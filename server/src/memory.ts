import { buildPsychProfile } from './bridge.js';
import { isStudyYear, studyYearLabel } from './categories.js';
import { getRepos } from './db.js';
import { loadDegrees } from './topology.js';
import { DEFAULT_LANGUAGE, normalizeLanguage } from './sarvam.js';
import type { AssessmentState, CareerPath, PsychReadout, UserContext } from './types.js';

// The student's long-term context: one record per account, outliving any single
// chat session and shared by every engine that talks to them.
//
// Why this exists: AssessmentState is per-conversation and dies with "New
// Conversation". A student who starts a fresh chat, or switches from typing to
// speaking, should not become a stranger again. This record is what FAB
// remembers — their name, their degree, the language they speak to us in, what
// the engine concluded, and the things they said in their own words.
//
// It is a memory, never a scorer. Everything in it is either copied verbatim
// from what the student said or derived from the committed data tables through
// the same deterministic path as the rest of the app. Nothing here can change
// a fit score; it only gives Gemini and Sarvam a shared idea of who they are
// talking to.

/** Utterances worth remembering. Older ones fall off the end. */
const MAX_NOTES = 24;
/** How many of those get spent on prompt budget each turn. */
const NOTES_IN_BRIEF = 8;
const MAX_NOTE_CHARS = 240;

export function emptyContext(userId: string): UserContext {
  const now = new Date().toISOString();
  return {
    v: 1,
    userId,
    name: null,
    degreeId: null,
    degreeName: null,
    year: null,
    language: DEFAULT_LANGUAGE,
    traits: [],
    topPaths: [],
    fitScore: null,
    motivationNote: null,
    notes: [],
    turns: { text: 0, voice: 0 },
    firstSeen: now,
    lastSeen: now,
  };
}

/**
 * Defensive rebuild of a stored record. The store is ours, not the client's,
 * but a half-written or version-skewed document should degrade to "we know
 * less about you" rather than throw mid-conversation.
 */
export function sanitizeContext(input: unknown, userId: string): UserContext {
  const c = emptyContext(userId);
  if (!input || typeof input !== 'object') return c;
  const raw = input as Partial<UserContext>;

  if (typeof raw.name === 'string' && raw.name.trim()) c.name = raw.name.trim().slice(0, 40);
  if (typeof raw.degreeId === 'string' && loadDegrees().some((d) => d.id === raw.degreeId)) {
    c.degreeId = raw.degreeId;
    c.degreeName = loadDegrees().find((d) => d.id === raw.degreeId)?.name ?? null;
  }
  if (isStudyYear(raw.year)) c.year = raw.year;
  c.language = normalizeLanguage(raw.language);

  if (Array.isArray(raw.traits)) {
    c.traits = raw.traits.filter((t): t is string => typeof t === 'string').slice(0, 8);
  }
  if (Array.isArray(raw.topPaths)) {
    c.topPaths = raw.topPaths
      .filter((p) => p && typeof p.fieldName === 'string')
      .slice(0, 5)
      .map((p) => ({ fieldName: p.fieldName, matchScore: Number(p.matchScore) || 0 }));
  }
  if (typeof raw.fitScore === 'number' && Number.isFinite(raw.fitScore)) c.fitScore = raw.fitScore;
  if (typeof raw.motivationNote === 'string') c.motivationNote = raw.motivationNote;

  if (Array.isArray(raw.notes)) {
    c.notes = raw.notes
      .filter((n) => n && typeof n.text === 'string' && n.text.trim())
      .slice(-MAX_NOTES)
      .map((n) => ({
        text: n.text.trim().slice(0, MAX_NOTE_CHARS),
        at: typeof n.at === 'string' ? n.at : new Date().toISOString(),
      }));
  }

  const text = Number(raw.turns?.text);
  const voice = Number(raw.turns?.voice);
  c.turns = {
    text: Number.isFinite(text) && text > 0 ? Math.floor(text) : 0,
    voice: Number.isFinite(voice) && voice > 0 ? Math.floor(voice) : 0,
  };

  if (typeof raw.firstSeen === 'string') c.firstSeen = raw.firstSeen;
  if (typeof raw.lastSeen === 'string') c.lastSeen = raw.lastSeen;
  return c;
}

/**
 * Guests get a context object so prompts still read naturally, but nothing is
 * written to storage — the same rule /api/state already follows, and it keeps
 * every guest from sharing one record.
 */
export async function loadContext(userId: string, isGuest: boolean): Promise<UserContext> {
  if (isGuest) return emptyContext(userId);
  try {
    return sanitizeContext(await getRepos().context.get(userId), userId);
  } catch (e: any) {
    console.warn('[memory] could not load user context:', e.message);
    return emptyContext(userId);
  }
}

export async function saveContext(ctx: UserContext, isGuest: boolean): Promise<void> {
  if (isGuest) return;
  try {
    await getRepos().context.set(ctx.userId, ctx);
  } catch (e: any) {
    console.warn('[memory] could not save user context:', e.message);
  }
}

export async function clearContext(userId: string, isGuest: boolean): Promise<void> {
  if (isGuest) return;
  await getRepos().context.clear(userId);
}

export interface TurnRecord {
  /** The flow's own validated state after this turn. */
  assessment: AssessmentState;
  /** What the student said this turn, typed or spoken. */
  userText?: string;
  /** How they said it. Counted so FAB can tell a talker from a typer. */
  channel: 'text' | 'voice';
  /** The language the turn happened in, when voice resolved one. */
  language?: string;
  bestFitPaths?: CareerPath[];
  psychometrics?: PsychReadout;
}

/**
 * Folds one completed turn into the long-term record. Deterministic: name,
 * degree, traits and paths all come from the validated assessment and the
 * committed tables, and the notes are the student's own words copied verbatim.
 */
export function updateContext(ctx: UserContext, turn: TurnRecord): UserContext {
  const next: UserContext = {
    ...ctx,
    notes: [...ctx.notes],
    turns: { ...ctx.turns },
    lastSeen: new Date().toISOString(),
  };

  const { assessment } = turn;
  if (assessment.name) next.name = assessment.name;
  if (assessment.degreeId) {
    next.degreeId = assessment.degreeId;
    next.degreeName = loadDegrees().find((d) => d.id === assessment.degreeId)?.name ?? null;
  }
  if (assessment.year) next.year = assessment.year;
  if (turn.language) next.language = normalizeLanguage(turn.language);

  // Traits are the same deterministic reflections the reflection moment uses.
  if (assessment.answers.length) {
    next.traits = buildPsychProfile(assessment.answers).reflections.slice(0, 8);
  }

  if (turn.bestFitPaths?.length) {
    next.topPaths = turn.bestFitPaths.slice(0, 5).map((p) => ({
      fieldName: p.fieldName,
      matchScore: p.matchScore,
    }));
  }
  if (turn.psychometrics) {
    next.fitScore = turn.psychometrics.scores.adjustedCcfs;
    next.motivationNote = turn.psychometrics.motivationNote;
  }

  next.turns[turn.channel] += 1;

  const note = noteFrom(turn.userText);
  if (note && !next.notes.some((n) => n.text.toLowerCase() === note.toLowerCase())) {
    next.notes.push({ text: note, at: new Date().toISOString() });
    if (next.notes.length > MAX_NOTES) next.notes.splice(0, next.notes.length - MAX_NOTES);
  }

  return next;
}

/**
 * Keeps utterances that carry something. "yes", "ok", a tapped option label and
 * anything shorter than a few words are noise in a memory that has a budget.
 */
function noteFrom(text: string | undefined): string | null {
  const trimmed = (text ?? '').trim().replace(/^option picked:\s*/i, '');
  if (trimmed.length < 15) return null;
  if (/^(yes|yeah|yep|no|nope|ok|okay|sure|hmm+|idk|cool|thanks|thank you)\b[.!]?$/i.test(trimmed)) {
    return null;
  }
  if (trimmed.split(/\s+/).length < 4) return null;
  return trimmed.slice(0, MAX_NOTE_CHARS);
}

/**
 * The prompt-facing view. Every Gemini call in the app gets this block, so a
 * spoken turn and a typed turn are answered by a FAB who knows the same things.
 * Returns an empty string for a brand new student, which reads as "no prior
 * context" rather than an awkward empty heading.
 */
export function contextBrief(ctx: UserContext): string {
  const lines: string[] = [];

  if (ctx.name) lines.push(`Name: ${ctx.name}`);
  if (ctx.degreeName) {
    const year = studyYearLabel(ctx.year);
    lines.push(`Studying: ${ctx.degreeName}${year ? ` (${year})` : ''}`);
  }
  if (ctx.language && ctx.language !== DEFAULT_LANGUAGE) {
    lines.push(`Speaks to you in: ${ctx.language} (they use voice, so keep sentences short and easy to say out loud)`);
  }
  if (ctx.traits.length) lines.push(`What you already know about them: ${ctx.traits.join('; ')}`);
  if (ctx.topPaths.length) {
    lines.push(
      `Paths the engine already ranked for them: ${ctx.topPaths
        .map((p) => `${p.fieldName} (${p.matchScore}%)`)
        .join(', ')}`,
    );
  }
  if (ctx.motivationNote) lines.push(`Honest caveat already noted: ${ctx.motivationNote}`);

  const notes = ctx.notes.slice(-NOTES_IN_BRIEF);
  if (notes.length) {
    lines.push(`Things they have told you before, in their words:\n${notes.map((n) => `- "${n.text}"`).join('\n')}`);
  }

  if (!lines.length) return '';
  return `WHAT YOU REMEMBER ABOUT THIS STUDENT (from earlier conversations, typed and spoken — treat it as already known, never read it back to them as a list):\n${lines.join('\n')}`;
}

/** The safe subset the client may see. */
export function publicContext(ctx: UserContext) {
  return {
    name: ctx.name,
    degreeName: ctx.degreeName,
    year: ctx.year,
    language: ctx.language,
    traits: ctx.traits,
    topPaths: ctx.topPaths,
    fitScore: ctx.fitScore,
    notes: ctx.notes.slice(-NOTES_IN_BRIEF),
    turns: ctx.turns,
    firstSeen: ctx.firstSeen,
    lastSeen: ctx.lastSeen,
  };
}
