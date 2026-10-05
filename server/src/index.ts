import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import {
  currentUser, loginHandler, meHandler, registerHandler, requireAuth, userForToken,
  type AuthUser,
} from './auth.js';
import { interviewItemCount, interviewItemById } from './bridge.js';
import {
  CATEGORIES, STUDY_YEARS, categoryById, categoryStatus, orderedItems,
} from './categories.js';
import { initDb, getRepos } from './db.js';
import { buildCareerPaths, buildProfile } from './engine.js';
import { recordBatch, respond, sanitizeAssessment, type FlowResponse } from './flow.js';
import { geminiEnabled, geminiKeys } from './gemini.js';
import {
  clearContext, contextBrief, loadContext, publicContext, saveContext, updateContext,
} from './memory.js';
import {
  careers as careerProfiles, degreePivots, items as psychItems, pivotForDegree,
} from './psychometrics.js';
import { QUESTIONS } from './questions.js';
import {
  DEFAULT_LANGUAGE, VOICE_LANGUAGES, isEnglish, normalizeLanguage, sarvamEnabled,
  sarvamKeyCount, speak, transcribe, translate,
} from './sarvam.js';
import { liveEnabled, pcmSeconds, transcribeLive } from './geminiLive.js';
import { findDegree, loadDegrees } from './topology.js';
import type { Answer, Message, UserContext } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env first (shared), then server/.env overrides
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
// Hosts like Render put a load balancer in front of the app. Without this every
// request appears to come from the proxy's IP, so the rate limiters below would
// throttle all students together as one client. TRUST_PROXY is the number of
// proxy hops to trust (default 1); raise it if the host chains several.
const trustProxy = process.env.TRUST_PROXY ?? '1';
app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy);
// State sync payloads can be large, and a voice clip arrives base64-encoded in
// the same JSON body (see MAX_AUDIO_BYTES below for the per-clip cap).
app.use(express.json({ limit: '8mb' }));

// Body-parser failures (malformed JSON, oversized state sync) must come back as
// JSON so the client can surface the message instead of choking on an HTML page.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!err) { next(); return; }
  if (err.type === 'entity.too.large') {
    res.status(413).json({ error: 'That payload is too large to save. Try clearing older chat sessions.' });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Malformed JSON in request body' });
    return;
  }
  next(err);
});

// Signed-in students are limited per account. Guests all share one user id, so
// they are limited per IP instead or every guest would throttle every other.
const userOrIpKey = (req: express.Request): string => {
  const user = (req as any).user as AuthUser | undefined;
  return user && !user.isGuest ? user.id : ipKeyGenerator(req.ip ?? '');
};

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 150, // a full 15-question conversation is ~19 requests; leave headroom for the dashboard
  keyGenerator: userOrIpKey,
  handler: (_req, res) => {
    res.status(429).json({ error: "You're sending requests too fast, please slow down" });
  },
});

// Voice costs a round trip to Sarvam on top of everything the chat already
// does, so it gets its own, tighter budget.
const voiceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  keyGenerator: userOrIpKey,
  handler: (_req, res) => {
    res.status(429).json({ error: "That's a lot of talking. Give it a minute and try again." });
  },
});

// Stricter limiter for credential endpoints (brute-force resistance)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
  handler: (_req, res) => {
    res.status(429).json({ error: 'Too many attempts. Please wait a few minutes and try again.' });
  },
});

app.get('/healthz', (_req, res) => {
  res.json({
    ok: true,
    degrees: loadDegrees().length,
    questions: QUESTIONS.length,
    interviewItems: interviewItemCount(),
    categories: categoryStatus([]).map((c) => `${c.id}:${c.total}@${c.surface}`),
    psychometricItems: psychItems().length,
    careerProfiles: careerProfiles().length,
    degreePivots: degreePivots().length,
    gemini: geminiEnabled() ? 'enabled' : 'fallback',
    sarvam: sarvamEnabled() ? 'enabled' : 'disabled',
    liveStt: liveEnabled() ? 'enabled' : 'disabled',
    // How much failover headroom each provider has. Key values are never
    // exposed — only how many are configured.
    keys: { gemini: geminiKeys.size(), sarvam: sarvamKeyCount() },
    db: getRepos().backend,
  });
});

// Express 4 does not catch rejections from async handlers: without this wrapper
// a database failure mid-request leaves the client hanging with no response.
const ah = (fn: express.RequestHandler): express.RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };

// --- Auth ---
app.post('/api/auth/register', authLimiter, ah(registerHandler));
app.post('/api/auth/login', authLimiter, ah(loginHandler));
app.get('/api/auth/me', ah(requireAuth), meHandler);

// --- Per-user state sync (replaces the old Firestore mirroring) ---
app.get('/api/state', ah(requireAuth), apiLimiter, ah(async (req, res) => {
  const u = currentUser(req);
  if (u.isGuest) { res.json({ state: null }); return; }
  res.json({ state: await getRepos().state.get(u.id) });
}));

app.put('/api/state', ah(requireAuth), apiLimiter, ah(async (req, res) => {
  const u = currentUser(req);
  if (u.isGuest) { res.json({ ok: true, persisted: false }); return; }
  if (!('state' in (req.body ?? {}))) {
    res.status(400).json({ error: 'Body must include a "state" field' });
    return;
  }
  await getRepos().state.set(u.id, req.body.state);
  res.json({ ok: true, persisted: true });
}));

/**
 * The tab-close path.
 *
 * `navigator.sendBeacon` cannot set an Authorization header, so the token
 * rides in the body instead. Everything else is identical to PUT /api/state,
 * including the guest no-op — this route grants nothing the header route does
 * not, it only accepts the credential somewhere a beacon can put it.
 *
 * It exists because a `fetch` started during `beforeunload` is routinely
 * cancelled as the document tears down, which is precisely the moment the
 * client most needs the write to land.
 */
app.post('/api/state/beacon', apiLimiter, ah(async (req, res) => {
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!token || !('state' in (req.body ?? {}))) {
    res.status(400).json({ error: 'Body must include "token" and "state"' });
    return;
  }

  const user = await userForToken(token);
  if (!user) { res.status(401).json({ error: 'Invalid session' }); return; }
  if (user.isGuest) { res.json({ ok: true, persisted: false }); return; }

  await getRepos().state.set(user.id, req.body.state);
  res.json({ ok: true, persisted: true });
}));

// --- The six-category interview schedule ---
//
// Two routes, and neither of them touches Gemini. The client renders the item
// bank as written and sends back option ids; the server validates them against
// the same bank and scores them with the same tables the conversation uses.
// That is the whole contract: a tapped answer and a spoken one are worth the
// same thing, and the onboarding screen cannot be taken down by an API outage.

app.get('/api/interview/categories', ah(requireAuth), apiLimiter, (_req, res) => {
  orderedItems(); // resolves any item the category table forgot, once
  res.json({
    categories: CATEGORIES.map((c) => ({
      id: c.id,
      order: c.order,
      title: c.title,
      blurb: c.blurb,
      surface: c.surface,
      feature: c.feature,
      profileFields: c.profileFields ?? [],
      items: c.itemIds.flatMap((id) => {
        const item = interviewItemById(id);
        return item
          ? [{
            id: item.id,
            text: item.text,
            options: item.options.map((o) => ({ id: o.id, letter: o.letter, label: o.label })),
          }]
          : [];
      }),
    })),
    // Everything the onboarding screen needs to render itself in one request.
    degrees: loadDegrees().map((d) => ({ id: d.id, name: d.name })),
    years: STUDY_YEARS,
    total: interviewItemCount(),
  });
});

app.post('/api/interview/answers', ah(requireAuth), apiLimiter, ah(async (req, res) => {
  const body = req.body ?? {};

  // A category id is optional, but when one is given it has to be real —
  // otherwise a typo in the client silently posts answers to nothing.
  if (body.categoryId !== undefined && !categoryById(String(body.categoryId))) {
    res.status(400).json({ error: 'Unknown categoryId' });
    return;
  }
  if (body.answers !== undefined && !Array.isArray(body.answers)) {
    res.status(400).json({ error: '"answers" must be an array of {itemId, optionId}' });
    return;
  }

  const flow = recordBatch(body.assessment, {
    name: body.name,
    degreeId: body.degreeId,
    year: body.year,
    answers: body.answers,
  });

  // Same long-term memory the chat writes to, so a student who answered at
  // onboarding is already known by name the first time FAB speaks to them.
  const u = currentUser(req);
  const ctx = await loadContext(u.id, u.isGuest);
  const context = updateContext(ctx, {
    assessment: flow.assessment,
    channel: 'text',
    bestFitPaths: flow.bestFitPaths,
    psychometrics: flow.psychometrics,
  });
  await saveContext(context, u.isGuest);

  const { reply: _reply, ...rest } = flow;
  res.json({ ...rest, memory: publicContext(context) });
}));

// The flow state on its own, re-validated. Lets the client ask "where am I"
// after a reload without having to post a turn to find out.
app.post('/api/interview/state', ah(requireAuth), apiLimiter, (req, res) => {
  const assessment = sanitizeAssessment(req.body?.assessment);
  res.json({
    assessment,
    categories: categoryStatus(assessment.answers, assessment.skipped),
    progress: {
      answered: new Set([...assessment.answers.map((a) => a.itemId), ...assessment.skipped]).size,
      total: interviewItemCount(),
    },
  });
});

// --- Chat: FAB's conversational assessment ---
// `assessment` is the client's copy of the flow state. It is re-validated
// server-side on every turn (see sanitizeAssessment), so a missing or tampered
// payload costs the student progress but can never forge a score.
//
// Typed turns and spoken turns both come through runTurn, so they share one
// flow state machine and one long-term memory. Speaking a sentence and typing
// the same sentence are the same turn as far as the instrument is concerned.

async function runTurn(
  user: AuthUser,
  messages: Message[],
  rawAssessment: unknown,
  opts: { channel: 'text' | 'voice'; userText?: string; language?: string },
): Promise<{ flow: FlowResponse; context: UserContext }> {
  const ctx = await loadContext(user.id, user.isGuest);

  const flow = await respond(messages, rawAssessment, {
    brief: contextBrief(ctx),
    channel: opts.channel,
    known: { name: ctx.name, degreeId: ctx.degreeId },
  });

  const context = updateContext(ctx, {
    assessment: flow.assessment,
    userText: opts.userText,
    channel: opts.channel,
    language: opts.language,
    bestFitPaths: flow.bestFitPaths,
    psychometrics: flow.psychometrics,
  });
  await saveContext(context, user.isGuest);

  return { flow, context };
}

const lastUserText = (messages: Message[]): string | undefined =>
  [...messages].reverse().find((m) => m.sender === 'user')?.text;

const chatHandler: express.RequestHandler = async (req, res) => {
  try {
    const messages: Message[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const { flow, context } = await runTurn(currentUser(req), messages, req.body?.assessment, {
      channel: 'text',
      userText: lastUserText(messages),
    });
    res.json({ ...flow, memory: publicContext(context) });
  } catch (err: any) {
    console.error('chat error:', err);
    res.status(500).json({ reply: 'My brain glitched for a second there. Say that again?' });
  }
};
app.post('/api/fab/chat', ah(requireAuth), apiLimiter, ah(chatHandler));
app.post('/api/chat', ah(requireAuth), apiLimiter, ah(chatHandler)); // legacy alias

// --- Voice: the same conversation, spoken ---
// Sarvam handles ears and mouth only. Between the two, the turn runs through
// the identical flow.ts state machine the typed path uses, which is what lets a
// student start by talking and finish by typing without losing anything.

/** Decoded audio ceiling. Roughly a minute of Opus; the REST STT tops out ~30s. */
const MAX_AUDIO_BYTES = 1_500_000;
/**
 * 16 kHz mono 16-bit is 32 kB per second, so this is about 90 seconds. Kept
 * clear of the 8 mb body limit, since the PCM rides alongside the Opus clip
 * and base64 adds a third on top of both.
 */
const MAX_PCM_BYTES = 3_000_000;

interface DecodedAudio {
  buffer: Buffer;
  mimeType: string;
  /** 16 kHz mono PCM from the browser, when it managed the conversion. */
  pcm: Buffer | null;
}

/**
 * Hears the student.
 *
 * Gemini Flash Live goes first: it reads Indic speech natively and transcribes
 * Tamil verbatim. It needs 16 kHz PCM, which only arrives if the browser could
 * decode the clip, so Sarvam stays the fallback for older browsers, a failed
 * socket, and when Live is switched off. Either way the transcript is the
 * student's own language — flow.ts still translates it for matching.
 */
async function hear(clip: DecodedAudio, hint?: string) {
  if (clip.pcm && liveEnabled()) {
    const heard = await transcribeLive(clip.pcm, hint);
    if (heard) {
      console.log(`[voice] live heard ${heard.languageCode} (${pcmSeconds(clip.pcm).toFixed(1)}s)`);
      return heard;
    }
    console.warn('[voice] live returned nothing, falling back to sarvam');
  }
  return transcribe(clip.buffer, clip.mimeType, hint);
}

/** Returns the clip, or writes the error response and returns null. */
function readAudio(req: express.Request, res: express.Response): DecodedAudio | null {
  if (!sarvamEnabled() && !liveEnabled()) {
    res.status(503).json({ error: 'Voice is not configured on this server. You can still type to FAB.' });
    return null;
  }

  const raw = req.body?.audio;
  if (typeof raw !== 'string' || !raw.trim()) {
    res.status(400).json({ error: 'Body must include base64 "audio"' });
    return null;
  }

  // Accept both a bare base64 payload and a full data: URL from the browser.
  const commaAt = raw.startsWith('data:') ? raw.indexOf(',') : -1;
  const base64 = commaAt >= 0 ? raw.slice(commaAt + 1) : raw;
  const inlineType = commaAt >= 0 ? /^data:([^;,]+)/.exec(raw)?.[1] : undefined;

  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    res.status(400).json({ error: 'That recording came through empty. Try again.' });
    return null;
  }
  if (buffer.length > MAX_AUDIO_BYTES) {
    res.status(413).json({ error: 'That clip is too long. Keep it under about a minute.' });
    return null;
  }

  const mimeType = typeof req.body?.mimeType === 'string' && req.body.mimeType.trim()
    ? req.body.mimeType.trim()
    : inlineType || 'audio/webm';

  // Raw PCM is several times the size of the Opus clip it came from, so it gets
  // its own budget rather than eating into the one above.
  let pcm: Buffer | null = null;
  if (typeof req.body?.pcm16k === 'string' && req.body.pcm16k.trim()) {
    const decoded = Buffer.from(req.body.pcm16k, 'base64');
    if (decoded.length && decoded.length <= MAX_PCM_BYTES) pcm = decoded;
    else if (decoded.length) console.warn(`[voice] ignoring ${decoded.length}b pcm, over budget`);
  }

  return { buffer, mimeType, pcm };
}

/**
 * Renders FAB's reply as audio in the student's language. The transcript keeps
 * the English text either way, so the next Gemini turn reads one consistent
 * conversation no matter which language it was spoken in.
 */
async function voiceOver(text: string, language: string): Promise<{ audio: string[] | null; spokenText: string }> {
  const spokenText = isEnglish(language) ? text : (await translate(text, language)) ?? text;
  return { audio: await speak(spokenText, language), spokenText };
}

app.get('/api/voice/status', ah(requireAuth), apiLimiter, ah(async (req, res) => {
  const ctx = await loadContext(currentUser(req).id, currentUser(req).isGuest);
  res.json({
    enabled: sarvamEnabled(),
    languages: VOICE_LANGUAGES,
    language: ctx.language,
    defaultLanguage: DEFAULT_LANGUAGE,
  });
}));

// Speak, and get FAB's spoken answer back. One request, whole turn.
app.post('/api/fab/voice', ah(requireAuth), voiceLimiter, ah(async (req, res) => {
  const user = currentUser(req);
  const clip = readAudio(req, res);
  if (!clip) return;

  // A hint only when the student picked a language by hand; otherwise let
  // Sarvam detect it, so switching mid-conversation just works.
  const hint = typeof req.body?.language === 'string' && req.body.language !== 'auto'
    ? normalizeLanguage(req.body.language)
    : undefined;

  const heard = await hear(clip, hint);
  if (!heard) {
    res.status(502).json({ error: "I could not make that out. Try again, or just type it." });
    return;
  }

  const messages: Message[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  // The spoken turn becomes a normal user message before the flow ever sees it.
  // That is the whole trick: downstream, nothing knows this one was spoken.
  const userMessage: Message = {
    id: `user_voice_${Date.now()}`,
    sender: 'user',
    text: heard.text,
    timestamp: new Date().toISOString(),
    channel: 'voice',
    language: heard.languageCode,
  };

  const { flow, context } = await runTurn(
    user, [...messages, userMessage], req.body?.assessment,
    { channel: 'voice', userText: heard.text, language: heard.languageCode },
  );

  const shouldSpeak = req.body?.speak !== false;
  const { audio, spokenText } = shouldSpeak
    ? await voiceOver(flow.reply, heard.languageCode)
    : { audio: null, spokenText: flow.reply };

  res.json({
    ...flow,
    transcript: heard.text,
    languageCode: heard.languageCode,
    userMessage,
    audio,
    spokenText,
    memory: publicContext(context),
  });
}));

// Transcription on its own, for dictating into the text box.
app.post('/api/voice/transcribe', ah(requireAuth), voiceLimiter, ah(async (req, res) => {
  const user = currentUser(req);
  const clip = readAudio(req, res);
  if (!clip) return;

  const hint = typeof req.body?.language === 'string' && req.body.language !== 'auto'
    ? normalizeLanguage(req.body.language)
    : undefined;

  const heard = await hear(clip, hint);
  if (!heard) {
    res.status(502).json({ error: "I could not make that out. Try again, or just type it." });
    return;
  }

  // Remember which language they speak, so a later reply comes back in it.
  const ctx = await loadContext(user.id, user.isGuest);
  if (ctx.language !== heard.languageCode) {
    await saveContext({ ...ctx, language: heard.languageCode }, user.isGuest);
  }

  res.json({ transcript: heard.text, languageCode: heard.languageCode });
}));

// Read any FAB message out loud — including one that was typed, which is how a
// student who typed the whole way can still listen to the recommendation.
app.post('/api/voice/speak', ah(requireAuth), voiceLimiter, ah(async (req, res) => {
  if (!sarvamEnabled()) {
    res.status(503).json({ error: 'Voice is not configured on this server. You can still read FAB here.' });
    return;
  }

  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'Body must include "text"' });
    return;
  }
  if (text.length > 5000) {
    res.status(413).json({ error: 'That is too much text to read out in one go.' });
    return;
  }

  const user = currentUser(req);
  const ctx = await loadContext(user.id, user.isGuest);
  const language = typeof req.body?.language === 'string' && req.body.language !== 'auto'
    ? normalizeLanguage(req.body.language)
    : ctx.language;

  const { audio, spokenText } = await voiceOver(text, language);
  if (!audio) {
    res.status(502).json({ error: 'Could not read that out just now.' });
    return;
  }
  res.json({ audio, spokenText, language });
}));

// --- Long-term memory: what FAB remembers about this student ---
app.get('/api/memory', ah(requireAuth), apiLimiter, ah(async (req, res) => {
  const u = currentUser(req);
  res.json({ memory: publicContext(await loadContext(u.id, u.isGuest)) });
}));

app.delete('/api/memory', ah(requireAuth), apiLimiter, ah(async (req, res) => {
  const u = currentUser(req);
  await clearContext(u.id, u.isGuest);
  res.json({ ok: true, cleared: !u.isGuest });
}));

// --- Careers data ---
app.get('/api/careers/degrees', ah(requireAuth), apiLimiter, (_req, res) => {
  res.json(loadDegrees().map((d) => ({
    id: d.id, name: d.name, aliases: d.aliases, items: d.items.length,
  })));
});

app.get('/api/careers/degrees/:id', ah(requireAuth), apiLimiter, (req, res) => {
  const d = findDegree(req.params.id);
  if (!d) { res.status(404).json({ error: 'Unknown degree' }); return; }
  res.json(d);
});

// --- Degree pivot map: what a degree opens beyond what it was designed for ---
// Static reference data, so it is served whole and cached by the client. The
// per-degree route is the one the UI actually calls.
app.get('/api/careers/pivots', ah(requireAuth), apiLimiter, (_req, res) => {
  res.json(degreePivots());
});

app.get('/api/careers/pivots/:degreeId', ah(requireAuth), apiLimiter, (req, res) => {
  const pivot = pivotForDegree(req.params.degreeId);
  if (!pivot) {
    res.status(404).json({ error: 'No pivot map for that degree (see /api/careers/degrees)' });
    return;
  }
  res.json(pivot);
});

// --- Quiz bank (for clients that want to render the quiz directly) ---
app.get('/api/quiz/questions', ah(requireAuth), apiLimiter, (_req, res) => {
  res.json(QUESTIONS.map((q) => ({ id: q.id, text: q.text, options: q.options.map((o) => o.label) })));
});

// --- Standalone prediction: degree + answers -> ranked paths ---
app.post('/api/predict', ah(requireAuth), apiLimiter, (req, res) => {
  const { degreeId, answers } = req.body ?? {};
  const degree = typeof degreeId === 'string' ? findDegree(degreeId) : undefined;
  if (!degree) {
    res.status(400).json({ error: 'degreeId must match one of the 26 degrees (see /api/careers/degrees)' });
    return;
  }

  const parsed: Answer[] = [];
  if (answers && typeof answers === 'object') {
    for (const q of QUESTIONS) {
      const v = (answers as Record<string, unknown>)[q.id];
      if (typeof v === 'number' && v >= 0 && v < q.options.length) {
        parsed.push({ questionId: q.id, optionIndex: v, rawText: q.options[v].label });
      }
    }
  }
  const profile = buildProfile(parsed);
  res.json({
    degree: { id: degree.id, name: degree.name },
    profileType: profile.topType,
    signals: profile.signals,
    constraints: profile.constraints,
    bestFitPaths: buildCareerPaths(degree, profile, 5),
  });
});

// --- Pilot analyze (kept for the dashboard; deterministic) ---
app.post('/api/pilot/analyze', ah(requireAuth), apiLimiter, (req, res) => {
  const messages: Message[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const currentPaths: { fieldName: string }[] = Array.isArray(req.body?.currentPaths) ? req.body.currentPaths : [];
  const text = messages.slice(-6).map((m) => m.text).join(' ').toLowerCase();

  const careerConfidenceUpdates = currentPaths.flatMap((p) => {
    const words = p.fieldName.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    const hits = words.filter((w) => text.includes(w)).length;
    return hits > 0 ? [{ fieldName: p.fieldName, change: Math.min(hits * 4, 12) }] : [];
  });

  res.json({ careerConfidenceUpdates, newJourneyMilestones: [], recommendedExperiences: [] });
});

// Unknown API routes should read as JSON, not Express's HTML 404 page.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Unknown endpoint' });
});

// In production the built client is served from this same process, so the
// browser's relative /api calls reach this server with no CORS or base URL to
// configure. In dev, Vite serves the client on :5173 and proxies /api here.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  // Vite content-hashes everything under assets/, so it can be cached forever.
  app.use('/assets', express.static(path.join(clientDist, 'assets'), { immutable: true, maxAge: '1y' }));
  app.use(express.static(clientDist, { index: false }));
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Anything an async handler passed to next(err) lands here.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('unhandled route error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  await initDb();
  // Fail fast if any dataset is missing rather than mid-conversation.
  loadDegrees();
  interviewItemCount();
  // Resolves the category table against the item bank and warns loudly about
  // anything the two disagree on, at boot rather than mid-conversation.
  orderedItems();
  careerProfiles();
  degreePivots();
  app.listen(PORT, () => {
    console.log(`Northr server listening on http://localhost:${PORT}`);
    console.log(`Storage: ${getRepos().backend}`);
      console.log(`Interview: ${interviewItemCount()} items, ${careerProfiles().length} career profiles, ${degreePivots().length} degree pivot rows`);
    console.log(`Schedule: ${categoryStatus([]).map((c) => `${c.title} (${c.total}, ${c.surface})`).join(' | ')}`);
    const plural = (n: number) => `${n} key${n === 1 ? '' : 's'}`;
    console.log(`Gemini: ${geminiEnabled() ? `enabled (${process.env.GEMINI_MODEL || 'gemini-3.5-flash'}, ${plural(geminiKeys.size())})` : 'disabled — conversation falls back to multiple choice'}`);
    console.log(`Sarvam: ${sarvamEnabled() ? `enabled (${VOICE_LANGUAGES.length} languages, speaker ${process.env.SARVAM_SPEAKER || 'anushka'}, ${plural(sarvamKeyCount())}) — voice turns only` : 'disabled — voice chat is hidden, typing unaffected'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
