import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import {
  currentUser, loginHandler, meHandler, registerHandler, requireAuth,
} from './auth.js';
import { initDb, getRepos } from './db.js';
import { buildCareerPaths, buildProfile } from './engine.js';
import { respond } from './flow.js';
import { QUESTIONS } from './questions.js';
import { findDegree, loadDegrees } from './topology.js';
import type { Answer, Message } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root .env first (shared), then server/.env overrides
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
app.use(express.json({ limit: '2mb' })); // state sync payloads can be large

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

// --- Chat: the 15-question FAB flow ---
const chatHandler: express.RequestHandler = async (req, res) => {
  try {
    const messages: Message[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
    res.json(await respond(messages));
  } catch (err: any) {
    console.error('chat error:', err);
    res.status(500).json({ reply: 'My brain glitched for a second there. Say that again?' });
  }
};
app.post('/api/fab/chat', ah(requireAuth), apiLimiter, chatHandler);
app.post('/api/chat', ah(requireAuth), apiLimiter, chatHandler); // legacy alias

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
  loadDegrees(); // fail fast if the topology dataset is missing
  app.listen(PORT, () => {
    console.log(`Northr server listening on http://localhost:${PORT}`);
    console.log(`Storage: ${getRepos().backend}`);
    console.log(`Gemini: ${process.env.GEMINI_API_KEY ? 'enabled (' + (process.env.GEMINI_MODEL || 'gemini-3.5-flash') + ')' : 'disabled — deterministic replies only'}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
