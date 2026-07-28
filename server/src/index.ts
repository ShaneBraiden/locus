import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import {
  currentUser, loginHandler, meHandler, registerHandler, requireAuth,
  type AuthUser,
} from './auth.js';
import { interviewItemCount } from './bridge.js';
import { initDb, getRepos } from './db.js';
import { buildCareerPaths, buildProfile } from './engine.js';
import { respond, type FlowResponse } from './flow.js';
import { geminiEnabled } from './gemini.js';
import {
  clearContext, contextBrief, loadContext, publicContext, saveContext, updateContext,
} from './memory.js';
import { careers as careerProfiles, items as psychItems } from './psychometrics.js';
import { QUESTIONS } from './questions.js';
import {
  DEFAULT_LANGUAGE, VOICE_LANGUAGES, isEnglish, normalizeLanguage, sarvamEnabled,
  speak, transcribe, translate,
} from './sarvam.js';
import { liveEnabled, pcmSeconds, transcribeLive } from './geminiLive.js';
import { findDegree, loadDegrees } from './topology.js';
import type { Answer, Message, UserContext } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env first (shared), then server/.env overrides
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
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

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 150, // a full 15-question conversation is ~19 requests; leave headroom for the dashboard
  keyGenerator: (req) => (req as any).user?.id || ipKeyGenerator(req.ip ?? ''),
  handler: (_req, res) => {
    res.status(429).json({ error: "You're sending requests too fast, please slow down" });
  },
});

// Voice costs a round trip to Sarvam on top of everything the chat already
// does, so it gets its own, tighter budget.
const voiceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req as any).user?.id || ipKeyGenerator(req.ip ?? ''),
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
    psychometricItems: psychItems().length,
    careerProfiles: careerProfiles().length,
    gemini: geminiEnabled() ? 'enabled' : 'fallback',
    sarvam: sarvamEnabled() ? 'enabled' : 'disabled',
    liveStt: liveEnabled() ? 'enabled' : 'disabled',
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
  careerProfiles();
  app.listen(PORT, () => {
    console.log(`Northr server listening on http://localhost:${PORT}`);
    console.log(`Storage: ${getRepos().backend}`);
    console.log(`Interview: ${interviewItemCount()} items, ${careerProfiles().length} career profiles`);
    console.log(`Gemini: ${process.env.GEMINI_API_KEY ? 'enabled (' + (process.env.GEMINI_MODEL || 'gemini-3.5-flash') + ')' : 'disabled — conversation falls back to multiple choice'}`);
    console.log(`Sarvam: ${sarvamEnabled() ? `enabled (${VOICE_LANGUAGES.length} languages, speaker ${process.env.SARVAM_SPEAKER || 'anushka'})` : 'disabled — voice chat is hidden, typing unaffected'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
