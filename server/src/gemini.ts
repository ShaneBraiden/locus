import { GoogleGenAI } from '@google/genai';
import type { CareerPath, Degree, Message } from './types.js';
import type { Profile } from './engine.js';

// Gemini is optional polish. The prediction itself is deterministic (engine.ts);
// every function here has a non-AI fallback path in the caller.

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

async function generate(prompt: string, json = false): Promise<string | null> {
  const g = ai();
  if (!g) return null;
  try {
    const res = await Promise.race([
      g.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: json ? { responseMimeType: 'application/json', temperature: 0.6 } : { temperature: 0.8 },
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('gemini timeout')), 25000)),
    ]);
    return (res as any).text ?? null;
  } catch (e: any) {
    console.warn('[gemini] falling back to deterministic reply:', e.message);
    return null;
  }
}

export async function narrateRecommendation(
  name: string, degree: Degree, profile: Profile, paths: CareerPath[],
): Promise<string | null> {
  const top = paths[0];
  if (!top) return null;
  const prompt = `You are FAB, a warm Indian friend who understands careers. A student named ${name} studying ${degree.name} just finished 15 quick questions. A deterministic engine (not you) ranked their best-fit path as "${top.fieldName}" (${top.matchScore}% match), runner-up "${paths[1]?.fieldName ?? 'none'}".
What we learned about them: ${profile.reflections.join('; ') || 'clear, decisive answers'}. Profile type: ${profile.topType}.
Write FAB's recommendation message: warm, specific, confident, under 10 lines, no em dashes, no bullet lists, never call it an assessment or survey. Name the field, connect it to 2-3 specific things from what we learned, mention the runner-up in one honest line, and end by telling them their full ranked paths and 90-day roadmap are ready in their Best Fit Paths tab.`;
  return generate(prompt);
}

export async function casualReply(
  name: string, messages: Message[], topField: string | null,
): Promise<string | null> {
  const recent = messages.slice(-8).map((m) => `${m.sender === 'user' ? name : 'FAB'}: ${m.text}`).join('\n');
  const prompt = `You are FAB, a warm Indian friend inside the Northr career app. The student ${name} already received their career prediction${topField ? ` (top path: ${topField})` : ''} and is now just chatting.
Recent conversation:
${recent}

Reply as FAB: under 4 lines, warm, specific to what they said, no em dashes, never robotic. If they ask about careers, ground answers in their predicted path. If they want to redo the questions, tell them to start a new chat session.`;
  return generate(prompt);
}
