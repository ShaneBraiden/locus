import { GoogleGenAI } from '@google/genai';
import type { CareerMatch, CareerPath, Degree, Message, PsychScores } from './types.js';
import type { Profile } from './engine.js';

// Gemini is the interviewer and the narrator. It is never the ranker.
// Everything here has a non-AI fallback in the caller, so the app works
// end to end with no API key — the conversation degrades to the raw
// multiple-choice instrument and every score stays identical.
//
// Every prompt here carries the student's long-term memory (memory.ts) so a
// student who spoke to FAB yesterday and types to him today is answered by the
// same FAB. Sarvam and Gemini share that one record; neither owns it.

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

let client: GoogleGenAI | null | undefined;

function ai(): GoogleGenAI | null {
  if (client !== undefined) return client;
  client = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;
  if (!client) console.warn('[gemini] GEMINI_API_KEY not set — using deterministic replies only');
  return client;
}

export const geminiEnabled = () => ai() !== null;

async function generate(prompt: string, json = false): Promise<string | null> {
  const g = ai();
  if (!g) return null;
  try {
    const res = await Promise.race([
      g.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: json
          ? { responseMimeType: 'application/json', temperature: 0.6 }
          : { temperature: 0.8 },
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('gemini timeout')), 25000)),
    ]);
    return (res as any).text ?? null;
  } catch (e: any) {
    console.warn('[gemini] falling back to deterministic reply:', e.message);
    return null;
  }
}

/**
 * JSON-mode call. Returns null on anything unexpected — a timeout, a missing
 * key, or output that is not parseable — so callers only ever handle
 * "worked" or "did not work".
 */
export async function generateJson<T>(prompt: string): Promise<T | null> {
  const raw = await generate(prompt, true);
  if (!raw) return null;
  try {
    // Models occasionally wrap JSON in a fenced block despite the mime type.
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned) as T;
  } catch (e: any) {
    console.warn('[gemini] unparseable JSON response:', e.message);
    return null;
  }
}

/** Formats a memory brief for injection, or nothing at all when it is empty. */
const memoryBlock = (brief?: string) => (brief?.trim() ? `\n\n${brief.trim()}\n` : '');

/**
 * Students answer in Tamil and the other Indian languages; FAB's own words stay
 * English because the app translates them on the way out (sarvam.ts). A reply
 * written in Tamil would be run through translation again and come back broken.
 */
const LANGUAGE_RULE = `
The student may write in Tamil, or in another Indian language, or mix one with English. Understand it fully and take it as seriously as English. Never ask them to switch languages or comment on the language they chose. Always write your own reply in English — the app translates it for them.`;

export async function narrateRecommendation(
  name: string,
  degree: Degree,
  profile: Profile,
  paths: CareerPath[],
  psych?: {
    scores: PsychScores;
    matches: CareerMatch[];
    motivationNote: string | null;
    /** Careers open to them regardless of their degree, best-scoring first. */
    pivots?: CareerMatch[];
  },
  brief?: string,
): Promise<string | null> {
  const top = paths[0];
  if (!top) return null;

  const psychLine = psych
    ? `\nTheir psychometric read (computed, not yours to argue with): overall fit score ${psych.scores.adjustedCcfs}/100. ` +
      `Strongest theories — Holland ${psych.scores.pct.h}%, personality ${psych.scores.pct.o}%, motivation quality ${psych.scores.pct.s}%, ` +
      `cognitive style ${psych.scores.pct.m}%, decision readiness ${psych.scores.pct.d}%. ` +
      `Broad career archetypes that fit them: ${psych.matches.slice(0, 3).map((m) => m.name).join(', ')}.` +
      (psych.motivationNote ? ` Motivation caveat you must mention in one honest line: "${psych.motivationNote}"` : '')
    : '';

  // Most students arrive assuming their degree has already decided their life.
  // These names are the counter-evidence, and they are computed — FAB is only
  // allowed to repeat them, never to invent a route into one.
  const pivotLine = psych?.pivots?.length
    ? `\nCareers that fit them and are open to ANY graduate, so their degree is not a barrier: ` +
      `${psych.pivots.slice(0, 3).map((m) => `${m.name} (${m.degree.altEntryRoute})`).join('; ')}. ` +
      `Mention one of these in a single line as a door that is genuinely open to them, and name the route exactly as given. Do not invent qualifications.`
    : '';

  const prompt = `You are FAB, a warm Indian friend who understands careers. A student named ${name} studying ${degree.name} just finished a long, honest conversation with you. A deterministic engine (not you) ranked their best-fit path as "${top.fieldName}" (${top.matchScore}% match), runner-up "${paths[1]?.fieldName ?? 'none'}".
What we learned about them: ${profile.reflections.slice(0, 6).join('; ') || 'clear, decisive answers'}. Profile type: ${profile.topType}.${psychLine}${pivotLine}${memoryBlock(brief)}
Write FAB's recommendation message: warm, specific, confident, under 12 lines, no em dashes, no bullet lists, never call it an assessment or survey or quiz. Name the field, connect it to 2-3 specific things they actually told you, mention the runner-up in one honest line, and end by telling them their full ranked paths and 90-day roadmap are ready in their Best Fit Paths tab.`;
  return generate(prompt);
}

export async function casualReply(
  name: string, messages: Message[], topField: string | null, brief?: string,
): Promise<string | null> {
  const recent = messages.slice(-8).map((m) => `${m.sender === 'user' ? name : 'FAB'}: ${m.text}`).join('\n');
  const prompt = `You are FAB, a warm Indian friend inside the Northr career app. The student ${name} already received their career prediction${topField ? ` (top path: ${topField})` : ''} and is now just chatting.${memoryBlock(brief)}
Recent conversation:
${recent}

Reply as FAB: under 4 lines, warm, specific to what they said, no em dashes, never robotic. If they ask about careers, ground answers in their predicted path and in what you already remember about them. If they want to redo the questions, tell them to start a new chat session.
${LANGUAGE_RULE}`;
  return generate(prompt);
}

/**
 * FAB's take on the reflection moment. The *content* is deterministic — it is
 * built from construct tags in engine.ts/bridge.ts — Gemini only rephrases it
 * in voice. Returning null keeps the deterministic wording.
 */
export async function narrateReflection(
  name: string, degreeName: string, deterministic: string, fragments: string[], brief?: string,
): Promise<string | null> {
  const prompt = `You are FAB, a warm Indian friend inside a career app. You have just finished a long conversation with ${name}, who studies ${degreeName}. Here is what you concluded about them, which is factually fixed and must not be changed or added to:
${fragments.map((f) => `- ${f}`).join('\n')}${memoryBlock(brief)}

Rewrite this as FAB playing back what they see in the student. Warm, specific, second person, under 8 lines, no em dashes, no bullet lists, no new claims about them beyond the list above. End by asking, in your own words, whether you are close or missing something — that question must be the last line.
For reference, the plain version reads: "${deterministic}"`;
  return generate(prompt);
}
