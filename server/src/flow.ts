import {
  buildPsychProfile, interviewItemById, interviewItems, isValidAnswer,
  type InterviewItem,
} from './bridge.js';
import { buildCareerPaths, reflectionText } from './engine.js';
import {
  dominantConstructs, matchCareers, motivationNote, scoreAnswers,
} from './psychometrics.js';
import {
  CONFIDENCE_FLOOR, fallbackQuestion, interviewTurn, sanitizeReply,
} from './conversation.js';
import { casualReply, narrateRecommendation, narrateReflection } from './gemini.js';
import { degreeNames, findDegree, loadDegrees } from './topology.js';
import type {
  AssessmentState, CareerPath, Degree, Message, Phase, PsychAnswer, PsychReadout,
} from './types.js';

// The chat state machine.
//
// The server stays stateless, but position is now carried in an explicit
// AssessmentState that round-trips through the client instead of being
// re-derived by substring-matching FAB's own past messages. That old trick
// cannot survive questions Gemini phrases differently every time.
//
// Nothing from the client is trusted: sanitizeAssessment re-validates every
// field against the committed item bank before a single score is computed.

const NAME_PROMPT = 'Heyy! Welcome to Northr, I am FAB.\n\nBefore I can point you anywhere useful, I want to actually know you a little. So this is just a chat, no right answers.\n\nFirst things first, what do I call you?';
const NAME_PROBE = 'what do I call you';
const DEGREE_PROBE = 'which of these are you studying';
const RECO_MARKER = 'Best Fit Paths tab';

/** How many times FAB may circle back on one item before letting it go. */
const MAX_FOLLOW_UPS = 2;

export function emptyAssessment(): AssessmentState {
  return {
    v: 1,
    name: null,
    degreeId: null,
    answers: [],
    followUps: {},
    skipped: [],
    targetItemId: null,
    fallbackItemId: null,
    reflectionShown: false,
    reflectionAnswered: false,
    recommendationShown: false,
  };
}

/**
 * Rebuilds a trustworthy AssessmentState from whatever the client sent.
 * Unknown item or option ids are dropped, duplicates collapse, counters are
 * clamped. A hand-edited payload can lose you progress; it cannot forge a score.
 */
export function sanitizeAssessment(input: unknown): AssessmentState {
  const s = emptyAssessment();
  if (!input || typeof input !== 'object') return s;
  const raw = input as Partial<AssessmentState>;

  if (typeof raw.name === 'string' && raw.name.trim()) s.name = raw.name.trim().slice(0, 40);

  if (typeof raw.degreeId === 'string') {
    s.degreeId = loadDegrees().some((d) => d.id === raw.degreeId) ? raw.degreeId : null;
  }

  const seen = new Set<string>();
  for (const a of Array.isArray(raw.answers) ? raw.answers : []) {
    if (!a || typeof a.itemId !== 'string' || typeof a.optionId !== 'string') continue;
    if (seen.has(a.itemId) || !isValidAnswer(a.itemId, a.optionId)) continue;
    seen.add(a.itemId);
    s.answers.push({
      itemId: a.itemId,
      optionId: a.optionId,
      rawText: typeof a.rawText === 'string' ? a.rawText.slice(0, 2000) : '',
      confidence: typeof a.confidence === 'number' && Number.isFinite(a.confidence)
        ? Math.min(1, Math.max(0, a.confidence))
        : undefined,
    });
  }

  if (raw.followUps && typeof raw.followUps === 'object') {
    for (const [k, v] of Object.entries(raw.followUps)) {
      if (!interviewItemById(k)) continue;
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) s.followUps[k] = Math.min(MAX_FOLLOW_UPS + 1, Math.floor(n));
    }
  }

  for (const id of Array.isArray(raw.skipped) ? raw.skipped : []) {
    if (typeof id === 'string' && interviewItemById(id) && !s.skipped.includes(id) && !seen.has(id)) {
      s.skipped.push(id);
    }
  }

  if (typeof raw.targetItemId === 'string' && interviewItemById(raw.targetItemId)) {
    s.targetItemId = raw.targetItemId;
  }
  if (typeof raw.fallbackItemId === 'string' && interviewItemById(raw.fallbackItemId)) {
    s.fallbackItemId = raw.fallbackItemId;
  }

  s.reflectionShown = raw.reflectionShown === true;
  s.reflectionAnswered = raw.reflectionAnswered === true;
  s.recommendationShown = raw.recommendationShown === true;
  return s;
}

/**
 * Best-effort recovery for a session that predates explicit state. Only the
 * name and degree survive — enough that a returning student is not asked who
 * they are all over again.
 */
function recoverFromTranscript(messages: Message[], s: AssessmentState): void {
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.sender === 'user') continue;
    const reply = messages.slice(i + 1).find((x) => x.sender === 'user');
    if (!reply) continue;
    if (!s.name && m.text.includes(NAME_PROBE)) s.name = parseName(reply.text);
    if (!s.degreeId && m.text.includes(DEGREE_PROBE)) s.degreeId = findDegree(reply.text)?.id ?? null;
  }
}

function parseName(text: string): string {
  const raw = text.trim().replace(/^(i am|i'm|my name is|call me|im)\s+/i, '');
  const first = raw.split(/[\s,!.]+/).filter(Boolean)[0] ?? 'friend';
  return first.charAt(0).toUpperCase() + first.slice(1, 20);
}

/** Local option matching for the fallback path, when a student types instead of tapping. */
function matchOption(item: InterviewItem, text: string): string | null {
  const t = text.trim().toLowerCase().replace(/^option picked:\s*/i, '');
  if (!t) return null;

  const exact = item.options.find((o) => o.label.toLowerCase() === t);
  if (exact) return exact.id;

  const contains = item.options.find(
    (o) => o.label.toLowerCase().includes(t) || t.includes(o.label.toLowerCase()),
  );
  if (contains) return contains.id;

  // A bare "B" or "option c" when the buttons are on screen.
  const letter = /^(?:option\s*)?([a-e])[.)]?$/i.exec(t)?.[1]?.toUpperCase();
  if (letter) {
    const byLetter = item.options.find((o) => o.letter === letter);
    if (byLetter) return byLetter.id;
  }

  const words = new Set(t.split(/\W+/).filter((w) => w.length > 3));
  let best: string | null = null;
  let bestHits = 1;
  for (const o of item.options) {
    const hits = o.label.toLowerCase().split(/\W+/).filter((w) => words.has(w)).length;
    if (hits > bestHits) { best = o.id; bestHits = hits; }
  }
  return best;
}

export interface FlowResponse {
  reply: string;
  options?: string[];
  updatedPhase?: Phase;
  updatedSignals?: unknown;
  updatedConstraints?: unknown;
  reflectionText?: string;
  bestFitPaths?: CareerPath[];
  assessment: AssessmentState;
  progress?: { answered: number; total: number };
  psychometrics?: PsychReadout;
  /** Resolved degree name, so the client does not have to scrape the transcript. */
  degreeName?: string;
}

const covered = (s: AssessmentState) =>
  new Set([...s.answers.map((a) => a.itemId), ...s.skipped]);

function openItems(s: AssessmentState): InterviewItem[] {
  const done = covered(s);
  return interviewItems().filter((i) => !done.has(i.id));
}

function progressOf(s: AssessmentState) {
  return { answered: covered(s).size, total: interviewItems().length };
}

/** Everything the client needs to render the psychometric read. */
function readout(s: AssessmentState, paths: CareerPath[]): PsychReadout {
  const psychOnly = s.answers.filter((a) => a.itemId.startsWith('p'));
  const scores = scoreAnswers(psychOnly);
  const all = matchCareers(scores);
  const pathNames = paths.map((p) => p.fieldName.toLowerCase());

  const convergent = all
    .filter((m) => m.status !== 'mismatch')
    .filter((m) => pathNames.some((n) => n.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(n)))
    .map((m) => m.name);

  return {
    scores,
    topMatches: all.filter((m) => m.status === 'best_fit').slice(0, 6),
    secondaryMatches: all.filter((m) => m.status === 'consider').slice(0, 8),
    motivationNote: motivationNote(scores),
    convergentCareers: convergent,
  };
}

export async function respond(
  messages: Message[], rawAssessment?: unknown,
): Promise<FlowResponse> {
  const res = await runFlow(messages, rawAssessment);
  if (res.assessment.degreeId) {
    res.degreeName = loadDegrees().find((d) => d.id === res.assessment.degreeId)?.name;
  }
  return res;
}

async function runFlow(
  messages: Message[], rawAssessment?: unknown,
): Promise<FlowResponse> {
  const s = sanitizeAssessment(rawAssessment);
  if (!s.name || !s.degreeId) recoverFromTranscript(messages, s);

  const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
  const lastUserText = lastUser?.text?.trim() ?? '';
  const fabSaid = (probe: string) => messages.some((m) => m.sender !== 'user' && m.text.includes(probe));

  // ---- Step 1: name ------------------------------------------------------
  let consumedThisTurn = false;
  if (!s.name) {
    if (fabSaid(NAME_PROBE) && lastUserText) {
      s.name = parseName(lastUserText);
      consumedThisTurn = true;
    } else {
      return { reply: NAME_PROMPT, updatedPhase: 'phase1', assessment: s };
    }
  }
  const name = s.name ?? 'friend';

  // ---- Step 2: degree ----------------------------------------------------
  if (!s.degreeId) {
    if (fabSaid(DEGREE_PROBE) && lastUserText && !consumedThisTurn) {
      s.degreeId = findDegree(lastUserText)?.id ?? null;
      consumedThisTurn = true;
    }
    if (!s.degreeId) {
      const retry = fabSaid(DEGREE_PROBE) && lastUserText;
      return {
        reply: retry
          ? `Hmm, I could not place that one, ${name}. Pick the closest — which of these are you studying?`
          : `${name}! Love it. Okay, one thing before we properly get into it — which of these are you studying?`,
        options: degreeNames(),
        updatedPhase: 'phase1',
        assessment: s,
      };
    }
  }

  const degree = loadDegrees().find((d) => d.id === s.degreeId) as Degree;
  const profile = buildPsychProfile(s.answers);

  // ---- Step 3: the conversation -----------------------------------------
  let open = openItems(s);
  if (open.length) {
    const pending = s.targetItemId && !covered(s).has(s.targetItemId)
      ? interviewItemById(s.targetItemId) ?? null
      : null;

    // A reply to a fallback multiple-choice question is matched locally, so
    // scoring never depends on Gemini being reachable.
    if (s.fallbackItemId && lastUserText && !consumedThisTurn) {
      const item = interviewItemById(s.fallbackItemId);
      const optionId = item ? matchOption(item, lastUserText) : null;
      if (item && optionId) {
        record(s, { itemId: item.id, optionId, rawText: lastUserText, confidence: 1 });
        consumedThisTurn = true;
      }
      s.fallbackItemId = null;
      open = openItems(s);
      if (!open.length) return await finish(s, degree, name, messages);
    }

    const stillPending = pending && !covered(s).has(pending.id) ? pending : null;
    const target = open.find((i) => i.id !== stillPending?.id) ?? null;

    const turn = consumedThisTurn && !lastUserText
      ? null
      : await interviewTurn({
        name,
        degreeName: degree.name,
        messages,
        pending: consumedThisTurn ? null : stillPending,
        target: target ?? stillPending,
        others: open.filter((i) => i.id !== stillPending?.id && i.id !== target?.id),
        followUpsSpent: stillPending ? s.followUps[stillPending.id] ?? 0 : 0,
        answeredCount: covered(s).size,
        totalCount: interviewItems().length,
        isOpening: s.answers.length === 0 && s.skipped.length === 0,
      });

    if (turn) {
      // `target` is what this very reply goes on to ask about, so a score for
      // it is premature no matter how confident the model is — the student has
      // not answered it yet. Recording it here would ask a question and then
      // never read the answer, and would desync targetItemId from the reply.
      const askingAbout = target && target.id !== stillPending?.id ? target.id : null;

      for (const hit of turn.scored) {
        if (hit.confidence < CONFIDENCE_FLOOR) continue;
        if (hit.itemId === askingAbout) continue;
        if (covered(s).has(hit.itemId)) continue;
        record(s, {
          itemId: hit.itemId,
          optionId: hit.optionId,
          rawText: hit.itemId === stillPending?.id ? lastUserText : '',
          confidence: hit.confidence,
        });
      }

      // Nothing usable came back about what we asked: circle back, but only
      // so many times before letting the item go.
      if (stillPending && !covered(s).has(stillPending.id) && !consumedThisTurn) {
        const spent = (s.followUps[stillPending.id] ?? 0) + 1;
        s.followUps[stillPending.id] = spent;
        if (spent > MAX_FOLLOW_UPS) {
          s.skipped.push(stillPending.id);
          console.warn(`[flow] giving up on ${stillPending.id} after ${spent} attempts`);
        }
      }

      open = openItems(s);
      if (!open.length) return await finish(s, degree, name, messages);

      const askedAbout = turn.needsFollowUp && stillPending && !covered(s).has(stillPending.id)
        ? stillPending.id
        : (target && !covered(s).has(target.id) ? target.id : open[0].id);

      s.targetItemId = askedAbout;
      s.fallbackItemId = null;
      return {
        reply: turn.reply,
        updatedPhase: phaseFor(s),
        updatedSignals: profile.signals,
        updatedConstraints: profile.constraints,
        assessment: s,
        progress: progressOf(s),
      };
    }

    // ---- Fallback: Gemini unavailable, serve the instrument as written ----
    const ask = stillPending ?? open[0];
    s.targetItemId = ask.id;
    s.fallbackItemId = ask.id;
    const opening = s.answers.length === 0 && s.skipped.length === 0
      ? `${degree.name} — solid ground, ${name}. Let us get into it. No wrong answers here, just be honest.`
      : undefined;
    const { reply, options } = fallbackQuestion(ask, opening);
    return {
      reply,
      options,
      updatedPhase: phaseFor(s),
      updatedSignals: profile.signals,
      updatedConstraints: profile.constraints,
      assessment: s,
      progress: progressOf(s),
    };
  }

  return await finish(s, degree, name, messages);
}

function record(s: AssessmentState, a: PsychAnswer): void {
  if (covered(s).has(a.itemId) || !isValidAnswer(a.itemId, a.optionId)) return;
  s.answers.push(a);
  delete s.followUps[a.itemId];
}

function phaseFor(s: AssessmentState): Phase {
  const { answered, total } = progressOf(s);
  // The practical items (budget, timeline, geography) come last.
  return answered >= total - 3 ? 'constraints' : answered === 0 ? 'phase1' : 'phase2';
}

/** Reflection, then recommendation, then open chat. */
async function finish(
  s: AssessmentState, degree: Degree, name: string, messages: Message[],
): Promise<FlowResponse> {
  const profile = buildPsychProfile(s.answers);

  // ---- Step 4: the reflection moment, still mandatory --------------------
  if (!s.reflectionShown) {
    const deterministic = reflectionText(name, degree, profile);
    const narrated = await narrateReflection(
      name, degree.name, deterministic, profile.reflections.slice(0, 6),
    );
    const text = narrated ? sanitizeReply(narrated) : deterministic;
    s.reflectionShown = true;
    s.targetItemId = null;
    s.fallbackItemId = null;
    return {
      reply: text,
      updatedPhase: 'reflection',
      reflectionText: text,
      updatedSignals: profile.signals,
      updatedConstraints: profile.constraints,
      assessment: s,
      progress: progressOf(s),
    };
  }

  const lastUserText = [...messages].reverse().find((m) => m.sender === 'user')?.text ?? '';

  // ---- Step 5: the recommendation ---------------------------------------
  if (!s.recommendationShown) {
    s.reflectionAnswered = true;
    const disagreed = /\b(no|not really|missing|wrong|off)\b/i.test(lastUserText) &&
      !/\b(close|right|yes|spot)\b/i.test(lastUserText);

    const paths = buildCareerPaths(degree, profile, 5);
    const psych = readout(s, paths);
    const top = paths[0];
    const ack = disagreed
      ? `Fair, ${name} — nobody fits neatly into one conversation. But the pattern underneath your answers is still loud. `
      : `Knew it. `;

    let narrative = await narrateRecommendation(name, degree, profile, paths, {
      scores: psych.scores, matches: psych.topMatches, motivationNote: psych.motivationNote,
    });

    if (narrative) {
      narrative = sanitizeReply(narrative);
      if (!narrative.includes(RECO_MARKER)) {
        narrative += `\n\nYour full ranked list and 90-day plan are live in your Best Fit Paths tab.`;
      }
    } else {
      narrative = top
        ? `${ack}Okay ${name}, here it is. I think your path is ${top.fieldName} (${top.matchScore}% match). Not a random guess — it lines up with almost everything you told me: ${profile.reflections.slice(0, 2).join(', and ')}. ${paths[1] ? `Honest second place: ${paths[1].fieldName}. Strong fit too, just slightly less you.` : ''}${psych.motivationNote ? ` One honest note: ${psych.motivationNote}` : ''} I have put your full ranked list and a 90-day launch plan in your Best Fit Paths tab. Start with week one. Just the first checkbox.`
        : `Hmm, ${name}, I could not build a confident ranking from this. Let us talk a bit more — tell me what kind of work day would actually make you happy?`;
    }

    s.recommendationShown = true;
    return {
      reply: narrative,
      updatedPhase: 'recommendation',
      bestFitPaths: paths,
      updatedSignals: profile.signals,
      updatedConstraints: profile.constraints,
      assessment: s,
      progress: progressOf(s),
      psychometrics: psych,
    };
  }

  // ---- Step 6: open chat -------------------------------------------------
  const paths = buildCareerPaths(degree, profile, 5);
  const canned = `I'm right here, ${name}. Your paths are saved in the Best Fit Paths tab — poke around the roadmaps and tell me what feels right or what feels off. That reaction is real data too.`;
  const reply = (await casualReply(name, messages, paths[0]?.fieldName ?? null)) ?? canned;
  return {
    reply: sanitizeReply(reply),
    updatedPhase: 'closing',
    assessment: s,
    progress: progressOf(s),
  };
}
