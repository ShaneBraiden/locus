import { GoogleGenAI, Modality } from '@google/genai';
import { geminiKeys } from './gemini.js';
import { DEFAULT_LANGUAGE, normalizeLanguage, type Transcription } from './sarvam.js';

// Gemini Flash Live as FAB's ear.
//
// The Live API hears Indic speech natively and transcribes Tamil verbatim, so
// it replaces Sarvam as the ear. It does NOT remove the translation step: the
// transcript comes back in Tamil, and the matchers in topology.ts and flow.ts
// are English, so flow.ts still puts the answer through toEnglish() before
// matching it. Live buys accuracy on the way in, not a shorter pipeline.
//
// The boundary is unchanged and deliberate: this file turns audio into text and
// nothing else. It never picks an option id, never scores, never ranks. flow.ts
// still drives every question. Gemini is a better ear here, not a new brain.
//
// Two awkward facts about the model, both worked around below:
//
//   1. gemini-3.1-flash-live-preview refuses responseModalities: [TEXT] — it
//      always answers in audio. We only want the `inputAudioTranscription`, so
//      the session is closed the moment the transcript is settled and the
//      model's spoken answer is dropped on the floor. FAB's actual words come
//      from flow.ts and are spoken by Sarvam, whose voice we control.
//   2. inputAudioTranscription carries no language code, and the reply has to
//      be spoken back in the student's language. The script the transcript came
//      back in tells us that for free — see languageFromScript.

const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';

/** The Live API takes exactly one input format: signed 16-bit PCM, mono, 16 kHz. */
export const LIVE_INPUT_MIME = 'audio/pcm;rate=16000';
const SAMPLE_RATE = 16000;

const CONNECT_TIMEOUT_MS = 15000;
const TRANSCRIBE_TIMEOUT_MS = 20000;
/**
 * How long the transcript must stop growing before we call it finished.
 *
 * We cannot wait for the model's own turn to end: it is told to stay quiet, and
 * a model that obeys never sends `modelTurn` or `turnComplete` at all, which
 * used to leave the first turn of a session hanging for the full timeout. The
 * transcript going quiet is the only signal that depends on nothing but the
 * student.
 */
const QUIET_MS = 700;

// The ear shares gemini.ts's key pool rather than holding its own client, so a
// key that gets quota'd by the interviewer is already benched when the next
// spoken turn arrives, and a spoken turn that fails on one key is re-heard on
// the next with the same audio buffer.
export const liveEnabled = () =>
  geminiKeys.enabled() && process.env.GEMINI_LIVE_STT !== 'off';

/**
 * Each Indic script belongs to exactly one of the languages Sarvam can speak
 * back in, so the transcript identifies its own language with no extra call.
 * Devanagari is shared by Hindi and Marathi; Hindi is the safer default.
 */
const SCRIPTS: [RegExp, string][] = [
  [/\p{Script=Tamil}/u, 'ta-IN'],
  [/\p{Script=Devanagari}/u, 'hi-IN'],
  [/\p{Script=Bengali}/u, 'bn-IN'],
  [/\p{Script=Gujarati}/u, 'gu-IN'],
  [/\p{Script=Gurmukhi}/u, 'pa-IN'],
  [/\p{Script=Kannada}/u, 'kn-IN'],
  [/\p{Script=Malayalam}/u, 'ml-IN'],
  [/\p{Script=Oriya}/u, 'od-IN'], // Sarvam spells Odia "od-IN", not "or-IN"
  [/\p{Script=Telugu}/u, 'te-IN'],
];

export function languageFromScript(text: string): string {
  for (const [re, code] of SCRIPTS) if (re.test(text)) return normalizeLanguage(code);
  return DEFAULT_LANGUAGE;
}

/**
 * Speech to text over the Live API.
 *
 * `pcm` must already be 16 kHz mono signed 16-bit little-endian — the browser
 * does that conversion (client/src/lib/voice.ts), because the server has no
 * ffmpeg and the Live API will not take WebM/Opus.
 *
 * Returns null on any failure, which is the caller's signal to fall back to
 * Sarvam. Voice never hard-fails; at worst it degrades to typing.
 */
export async function transcribeLive(
  pcm: Buffer, languageHint?: string,
): Promise<Transcription | null> {
  if (!liveEnabled() || !pcm.length) return null;
  try {
    // The closure captures the audio buffer, so if the first key is quota'd the
    // pool re-listens to the same clip on the next one. The student is never
    // asked to say it again.
    return await geminiKeys.run('live transcribe', (g) => listen(g, pcm, languageHint));
  } catch (e: any) {
    console.warn('[live] transcription failed:', e.message);
    return null;
  }
}

/**
 * One Live session. Throws rather than returning null so `createKeyPool` can
 * tell a quota'd key (rotate and retry) from a clip it simply could not make
 * out (give up and let the caller fall back to Sarvam).
 */
async function listen(
  g: GoogleGenAI, pcm: Buffer, languageHint?: string,
): Promise<Transcription | null> {
  let heard = '';
  let settled = false;
  let quiet: NodeJS.Timeout | null = null;
  /** Kept so an auth/quota close can be rethrown for the pool to classify. */
  let socketError: Error | null = null;
  let finish!: () => void;
  const done = new Promise<void>((resolve) => {
    finish = () => { if (!settled) { settled = true; resolve(); } };
  });

  /** Restarted on every transcript chunk; fires once the student's words stop. */
  const heardSomething = () => {
    if (quiet) clearTimeout(quiet);
    quiet = setTimeout(finish, QUIET_MS);
  };

  let session: Awaited<ReturnType<typeof g.live.connect>> | null = null;
  try {
    session = await withTimeout(
      g.live.connect({
        model: LIVE_MODEL,
        config: {
          // TEXT is rejected by this model; we discard the audio it produces.
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction:
            'You are only listening in order to transcribe. Never answer, never comment, stay silent.',
        },
        callbacks: {
          onmessage: (m: any) => {
            const chunk = m?.serverContent?.inputTranscription?.text;
            if (chunk) { heard += chunk; heardSomething(); }
            // If it does answer, the student's words are certainly complete.
            if (m?.serverContent?.modelTurn
              || m?.serverContent?.turnComplete
              || m?.serverContent?.generationComplete) finish();
          },
          onerror: (e: any) => {
            console.warn('[live] socket error:', e?.message ?? e);
            socketError = e instanceof Error ? e : new Error(String(e?.message ?? e));
            finish();
          },
          onclose: () => finish(),
        },
      }),
      CONNECT_TIMEOUT_MS,
      'gemini live connect',
    );

    session.sendRealtimeInput({
      audio: { data: pcm.toString('base64'), mimeType: LIVE_INPUT_MIME },
    });
    session.sendRealtimeInput({ audioStreamEnd: true });

    await Promise.race([
      done,
      new Promise<void>((r) => setTimeout(r, TRANSCRIBE_TIMEOUT_MS)),
    ]);
  } finally {
    if (quiet) clearTimeout(quiet);
    try { session?.close(); } catch { /* already gone */ }
  }

  const text = heard.trim();
  // A socket that died before producing a single word may well have died
  // because the key is spent. Rethrow so the pool can decide; if the error is
  // not key-shaped it propagates out to transcribeLive and becomes a null.
  if (!text && socketError) throw socketError;
  if (!text) return null;

  // An explicitly chosen language wins; otherwise the script tells us.
  const languageCode = languageHint ? normalizeLanguage(languageHint) : languageFromScript(text);
  return { text, languageCode };
}

function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

/** Duration in seconds of a 16 kHz mono 16-bit buffer. */
export const pcmSeconds = (pcm: Buffer) => pcm.length / 2 / SAMPLE_RATE;
