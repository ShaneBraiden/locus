import { generateJson } from './gemini.js';
import { interviewItemById, isValidAnswer, type InterviewItem } from './bridge.js';
import { readTypingStyle, styleDirective } from './style.js';
import type { Message } from './types.js';

// FAB's interviewer. One Gemini call per turn does two jobs at once: work out
// which pre-scored option the student's last message actually meant, and ask
// the next thing in FAB's own voice.
//
// The critical boundary: Gemini returns OPTION IDS, never numbers. Every score
// is looked up from the committed item bank, so the model influences which
// option we record and nothing whatsoever about what that option is worth.

export interface ScoredExtraction {
  itemId: string;
  optionId: string;
  confidence: number;
}

export interface ConversationTurn {
  reply: string;
  scored: ScoredExtraction[];
  needsFollowUp: boolean;
}

/** Below this, we treat the read as a guess and ask again instead of recording it. */
export const CONFIDENCE_FLOOR = 0.5;

/** How many other unanswered items to offer up for opportunistic scoring. */
const OPPORTUNISTIC_WINDOW = 5;

const PERSONA = `You are FAB, a warm, sharp Indian friend inside Northr, a career app for Indian students. You talk like a real person texting: short, specific, curious, a bit funny. You never sound like a form, a survey, or a corporate chatbot.

Hard rules for your "reply" text:
- Two to four short lines. Never longer.
- No em dashes. No bullet points. No numbered lists. No headings.
- Never show lettered options (A, B, C), never show a question counter, never say "question 7 of 25".
- Never mention scoring, assessment, psychometrics, traits, or that you are measuring anything.
- React to what they actually just said before you move on. One genuine reaction line, then the next thing you are curious about.
- Ask about ONE thing at a time. Keep it concrete and everyday, not abstract.
- If they ask you a question, answer it briefly and warmly, then come back to what you were curious about.
- If they are vague or say "idk", get curious about a specific angle instead of repeating yourself word for word.

Reading them:
- Most of these students are Indian and many will answer in Tamil, or in Hindi, Telugu, Malayalam, Kannada, Bengali, Marathi, Gujarati, Punjabi or Odia, or in a mix of one of those and English. Read whatever arrives exactly as carefully as you would read English, and interpret it against the readings below with the same confidence you would give the equivalent English answer. An answer in Tamil is a real answer, not a vague one.

How you WRITE the reply is decided per turn — see the HOW TO SOUND block below, and follow it over any habit of your own.`;

function describeItem(item: InterviewItem): string {
  const opts = item.options.map((o) => `      ${o.id}: ${o.label}`).join('\n');
  return `  - itemId "${item.id}" — the underlying thing to find out: ${item.text}\n    possible readings of their answer:\n${opts}`;
}

function transcriptLines(messages: Message[], name: string, limit = 12): string {
  return messages
    .slice(-limit)
    .map((m) => `${m.sender === 'user' ? name : 'FAB'}: ${m.text}`)
    .join('\n');
}

/**
 * Strips anything that would give away the instrument underneath: leaked option
 * letters, question counters, stray markdown bullets.
 */
export function sanitizeReply(text: string): string {
  return text
    .replace(/\(\s*\d{1,2}\s*\/\s*\d{1,2}\s*\)/g, '')       // "(7/25)"
    .replace(/^\s*(?:option\s*)?[A-E]\s*[—–-]\s+/gim, '')    // "A — ..." / "Option B - ..."
    .replace(/^\s*[-*•]\s+/gm, '')                            // stray bullets
    .replace(/^#{1,6}\s*/gm, '')                              // stray headings
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface RawTurn {
  scored?: { itemId?: unknown; optionId?: unknown; confidence?: unknown }[];
  needsFollowUp?: unknown;
  reply?: unknown;
}

export interface InterviewInput {
  name: string;
  degreeName: string;
  messages: Message[];
  /** What FAB asked about last turn, waiting to be read from their reply. */
  pending: InterviewItem | null;
  /** What to ask about next, once `pending` is settled. Null when nothing is left. */
  target: InterviewItem | null;
  /** Other open items a rich answer might incidentally settle. */
  others: InterviewItem[];
  followUpsSpent: number;
  answeredCount: number;
  totalCount: number;
  isOpening: boolean;
  /** Long-term memory of this student (memory.ts). Empty for a new account. */
  brief?: string;
  /** How this turn arrived. Spoken answers need shorter, plainer sentences. */
  channel?: 'text' | 'voice';
}

/**
 * Returns null whenever Gemini is unavailable or returns something unusable,
 * which is the caller's signal to fall back to the plain multiple-choice item.
 */
export async function interviewTurn(input: InterviewInput): Promise<ConversationTurn | null> {
  const {
    name, degreeName, messages, pending, target, others,
    followUpsSpent, answeredCount, totalCount, isOpening, brief, channel,
  } = input;

  if (!pending && !target) return null;

  const scoreable = [pending, ...others.slice(0, OPPORTUNISTIC_WINDOW)]
    .filter((i): i is InterviewItem => Boolean(i));

  const followUpNote = pending && followUpsSpent > 0
    ? `\nYou have already circled back on "${pending.id}" ${followUpsSpent} time(s). If they still will not give you anything usable, let it go gracefully this turn and move on to the next thing rather than pushing again.`
    : '';

  const openingNote = isOpening
    ? `\nThis is your very first question after they told you their degree (${degreeName}). Open warmly, make it clear this is just a conversation and there are no wrong answers, then ask.`
    : '';

  const askBlock = target
    ? `2. ASK about this next, in your own words. Do not read the text out, work out your own way in:\n${describeItem(target)}`
    : `2. There is nothing new to ask about. Acknowledge what they said warmly in one or two lines and tell them you have what you need.`;

  const followUpRule = pending && target
    ? `\nIf their last message was too vague to read for "${pending.id}", set needsFollowUp to true and make your reply circle back on ${pending.id} from a different angle instead of asking about ${target.id}. Otherwise leave needsFollowUp false and ask about ${target.id}.`
    : '';

  // How FAB should sound this turn. A spoken turn gets plain English (Sarvam
  // translates and speaks it); a typed turn gets the student's own language,
  // script and register mirrored back, because nothing translates a typed reply
  // and Sarvam is never called on this path.
  const soundNote = `\n${styleDirective(readTypingStyle(messages), channel ?? 'text')}`;

  const memory = brief?.trim() ? `\n${brief.trim()}\n` : '';

  const prompt = `${PERSONA}

You are talking to ${name}, who studies ${degreeName}. You are ${answeredCount} of about ${totalCount} things in, but NEVER mention that or any other number.
${memory}
Conversation so far:
${transcriptLines(messages, name) || '(nothing yet)'}

YOUR TWO JOBS THIS TURN:

1. INTERPRET their most recent message against the readings below. ${pending ? `You most recently asked them about "${pending.id}", so that is the one most likely to be answerable.` : ''} Only record a reading you genuinely believe. If their message did not really address something, leave it out — never invent an answer for something they have not spoken about.

${scoreable.length ? `Readings you may record:\n${scoreable.map(describeItem).join('\n')}` : ''}

${askBlock}
${followUpRule}${followUpNote}${openingNote}
${soundNote}

Return ONLY this JSON:
{
  "scored": [{ "itemId": "<id>", "optionId": "<id from that item's readings>", "confidence": <0 to 1> }],
  "needsFollowUp": <boolean>,
  "reply": "<what FAB says next, following every rule above>"
}

Use confidence honestly: 0.9 or above when they were explicit, 0.6 to 0.8 when you are reading between the lines, below 0.5 when you are really just guessing. "scored" must be [] if they said nothing you can read.`;

  return validateTurn(await generateJson<RawTurn>(prompt));
}

/**
 * Turns whatever the model returned into something safe to act on.
 *
 * Every extraction is checked against the real item bank, so a hallucinated
 * option id is dropped rather than silently corrupting a score. Exported so it
 * can be tested without a live API key.
 */
export function validateTurn(raw: RawTurn | null): ConversationTurn | null {
  if (!raw) return null;

  const reply = typeof raw.reply === 'string' ? sanitizeReply(raw.reply) : '';
  if (!reply) return null;

  const scored: ScoredExtraction[] = [];
  const seen = new Set<string>();
  for (const s of Array.isArray(raw.scored) ? raw.scored : []) {
    const itemId = typeof s?.itemId === 'string' ? s.itemId : '';
    const optionId = typeof s?.optionId === 'string' ? s.optionId : '';
    if (!itemId || !optionId || seen.has(itemId)) continue;
    if (!interviewItemById(itemId) || !isValidAnswer(itemId, optionId)) {
      console.warn(`[conversation] discarded invalid extraction ${itemId}/${optionId}`);
      continue;
    }
    const n = Number(s?.confidence);
    seen.add(itemId);
    scored.push({
      itemId,
      optionId,
      confidence: Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0,
    });
  }

  return { reply, scored, needsFollowUp: raw.needsFollowUp === true };
}

/**
 * FAB's opening line for the plain multiple-choice fallback. Kept warm so a
 * missing API key degrades the texture of the conversation, not the product.
 */
export function fallbackQuestion(item: InterviewItem, react?: string): {
  reply: string; options: string[];
} {
  return {
    reply: `${react ? `${react}\n\n` : ''}${item.text}`,
    options: item.options.map((o) => o.label),
  };
}
