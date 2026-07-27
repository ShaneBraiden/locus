import { QUESTIONS } from './questions.js';
import { buildCareerPaths, buildProfile, optionFor, reflectionText } from './engine.js';
import { narrateRecommendation, casualReply } from './gemini.js';
import { degreeNames, findDegree } from './topology.js';
import type { Answer, CareerPath, Degree, Message, Phase } from './types.js';

// Stateless chat state machine: the full history arrives on every request,
// so the server re-derives its position from the messages themselves.

const NAME_PROMPT = 'Heyy! Welcome to Northr, I am FAB.\n\nFifteen quick questions, one real answer at the end: the career path that actually fits you.\n\nFirst things first, what do I call you?';
const NAME_PROBE = 'what do I call you';

const DEGREE_PROBE = 'which of these are you studying';
const REFLECT_PROBE = 'am I close, or am I missing something';
const RECO_PROBE = 'Best Fit Paths tab';

interface FlowState {
  name: string | null;
  degree: Degree | null;
  degreeAskedTimes: number;
  answers: Answer[];
  nextQuestionIdx: number; // first unanswered question
  reflectionShown: boolean;
  reflectionAnswered: boolean;
  recommendationShown: boolean;
  lastUserText: string;
}

function matchOption(q: (typeof QUESTIONS)[number], text: string): number {
  const t = text.trim().toLowerCase();
  const exact = q.options.findIndex((o) => o.label.toLowerCase() === t);
  if (exact >= 0) return exact;
  const contains = q.options.findIndex(
    (o) => o.label.toLowerCase().includes(t) || t.includes(o.label.toLowerCase()),
  );
  if (contains >= 0) return contains;
  // Overlap on words (>=2 significant shared words)
  const words = new Set(t.split(/\W+/).filter((w) => w.length > 3));
  let best = -1, bestHits = 1;
  q.options.forEach((o, i) => {
    const hits = o.label.toLowerCase().split(/\W+/).filter((w) => words.has(w)).length;
    if (hits > bestHits) { best = i; bestHits = hits; }
  });
  return best;
}

export function parseState(messages: Message[]): FlowState {
  const s: FlowState = {
    name: null, degree: null, degreeAskedTimes: 0, answers: [],
    nextQuestionIdx: 0, reflectionShown: false, reflectionAnswered: false,
    recommendationShown: false, lastUserText: '',
  };

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.sender === 'user') { s.lastUserText = m.text; continue; }

    // Find the user's reply to this fab message (next user message)
    const reply = messages.slice(i + 1).find((x) => x.sender === 'user');

    if (m.text.includes(NAME_PROBE)) {
      if (reply) {
        const raw = reply.text.trim().replace(/^(i am|i'm|my name is|call me|im)\s+/i, '');
        const first = raw.split(/[\s,!.]+/).filter(Boolean)[0] ?? 'friend';
        s.name = first.charAt(0).toUpperCase() + first.slice(1, 20);
      }
      continue;
    }
    if (m.text.includes(DEGREE_PROBE)) {
      s.degreeAskedTimes++;
      if (reply) s.degree = findDegree(reply.text) ?? null;
      continue;
    }
    const q = QUESTIONS.find((qq) => m.text.includes(qq.probe));
    if (q) {
      if (reply && !s.answers.some((a) => a.questionId === q.id)) {
        s.answers.push({ questionId: q.id, optionIndex: matchOption(q, reply.text), rawText: reply.text });
      }
      continue;
    }
    if (m.text.includes(REFLECT_PROBE)) {
      s.reflectionShown = true;
      if (reply) s.reflectionAnswered = true;
      continue;
    }
    if (m.text.includes(RECO_PROBE)) {
      s.recommendationShown = true;
    }
  }

  s.nextQuestionIdx = QUESTIONS.findIndex((q) => !s.answers.some((a) => a.questionId === q.id));
  if (s.nextQuestionIdx === -1) s.nextQuestionIdx = QUESTIONS.length;
  return s;
}

export interface FlowResponse {
  reply: string;
  options?: string[];
  updatedPhase?: Phase;
  updatedSignals?: unknown;
  updatedConstraints?: unknown;
  reflectionText?: string;
  bestFitPaths?: CareerPath[];
}

export async function respond(messages: Message[]): Promise<FlowResponse> {
  const s = parseState(messages);
  const name = s.name ?? 'friend';

  // Step 1 — name
  if (!s.name) return { reply: NAME_PROMPT, updatedPhase: 'phase1' };

  // Step 2 — degree
  if (!s.degree) {
    const retry = s.degreeAskedTimes > 0 && s.lastUserText;
    return {
      reply: retry
        ? `Hmm, I could not place that one, ${name}. Pick the closest — which of these are you studying?`
        : `${name}! Love it. Okay, one important thing before the fun starts — which of these are you studying?`,
      options: degreeNames(),
      updatedPhase: 'phase1',
    };
  }

  const profile = buildProfile(s.answers);

  // Step 3 — the 15 questions
  if (s.nextQuestionIdx < QUESTIONS.length) {
    const q = QUESTIONS[s.nextQuestionIdx];
    const prev = s.answers[s.answers.length - 1];
    const react = prev ? optionFor(prev)?.react : undefined;
    const opener =
      s.nextQuestionIdx === 0
        ? `${s.degree.name} — solid ground, ${name}. Now the fun part. 15 quick ones, no wrong answers, just be honest.\n\n`
        : react
          ? `${react}\n\n`
          : '';
    const counter = `(${s.nextQuestionIdx + 1}/15) `;
    return {
      reply: `${opener}${counter}${q.text}`,
      options: q.options.map((o) => o.label),
      updatedPhase: s.nextQuestionIdx < 11 ? 'phase2' : 'constraints',
      updatedSignals: profile.signals,
      updatedConstraints: profile.constraints,
    };
  }

  // Step 4 — reflection moment (mandatory before any recommendation)
  if (!s.reflectionShown) {
    const text = reflectionText(name, s.degree, profile);
    return {
      reply: text,
      updatedPhase: 'reflection',
      reflectionText: text,
      updatedSignals: profile.signals,
      updatedConstraints: profile.constraints,
    };
  }

  // Step 5 — recommendation (deterministic prediction; Gemini narrates if available)
  if (!s.recommendationShown) {
    const disagreed = /\b(no|not really|missing|wrong|off)\b/i.test(s.lastUserText) &&
      !/\b(close|right|yes|spot)\b/i.test(s.lastUserText);
    const paths = buildCareerPaths(s.degree, profile, 5);
    const top = paths[0];
    const ack = disagreed
      ? `Fair, ${name} — nobody fits in 15 questions perfectly. But the pattern underneath your answers is still loud. `
      : `Knew it. `;

    let narrative = await narrateRecommendation(name, s.degree, profile, paths);
    if (!narrative) {
      narrative = top
        ? `${ack}Okay ${name}, here it is. I think your path is ${top.fieldName} (${top.matchScore}% match). Not a random guess — it lines up with almost everything you told me: ${profile.reflections.slice(0, 2).join(', and ')}. ${paths[1] ? `Honest second place: ${paths[1].fieldName}. Strong fit too, just slightly less you.` : ''} I have put your full ranked list and a 90-day launch plan in your Best Fit Paths tab. Start with week one. Just the first checkbox.`
        : `Hmm, ${name}, I could not build a confident ranking from these answers. Let us talk a bit more — tell me what kind of work day would make you genuinely happy?`;
    } else if (!narrative.includes(RECO_PROBE)) {
      narrative += `\n\nYour full ranked list and 90-day plan are live in your Best Fit Paths tab.`;
    }

    return {
      reply: narrative,
      updatedPhase: 'recommendation',
      bestFitPaths: paths,
      updatedSignals: profile.signals,
      updatedConstraints: profile.constraints,
    };
  }

  // Step 6 — post-recommendation chat
  const paths = buildCareerPaths(s.degree, profile, 5);
  const canned = `I'm right here, ${name}. Your paths are saved in the Best Fit Paths tab — poke around the roadmaps and tell me what feels right or what feels off. That reaction is real data too.`;
  const reply = (await casualReply(name, messages, paths[0]?.fieldName ?? null)) ?? canned;
  return { reply, updatedPhase: 'closing' };
}
