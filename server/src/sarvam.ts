import { SarvamAIClient } from 'sarvamai';
import { createKeyPool } from './keypool.js';

// Sarvam is Northr's voice. It hears the student (speech to text) and answers
// out loud (text to speech), in English or any of the Indic languages the
// instrument's students actually speak.
//
// The boundary is the same one Gemini lives behind: Sarvam moves words between
// audio and text and nothing else. It never picks an option id, never scores,
// never ranks. A voice turn and a typed turn both land in the exact same
// flow.ts state machine, which is what makes the two engines cowork instead of
// forking the conversation.
//
// Everything here returns null when the key is missing or the call fails, so
// voice degrades to plain typing rather than breaking the chat.

const STT_MODEL = process.env.SARVAM_STT_MODEL || 'saarika:v2.5';
const TTS_MODEL = process.env.SARVAM_TTS_MODEL || 'bulbul:v2';
const TRANSLATE_MODEL = process.env.SARVAM_TRANSLATE_MODEL || 'sarvam-translate:v1';
const SPEAKER = process.env.SARVAM_SPEAKER || 'anushka';

const TIMEOUT_MS = 30000;
/** bulbul:v2 caps a single request at 1500 characters; leave room for pauses. */
const TTS_CHUNK_CHARS = 1200;
/** sarvam-translate:v1 takes 2000; stay well under it. */
const TRANSLATE_CHUNK_CHARS = 900;

/** Languages we can both hear and speak. `en-IN` is the default everywhere. */
export const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'bn-IN', label: 'বাংলা' },
  { code: 'gu-IN', label: 'ગુજરાતી' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'മലയാളം' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'od-IN', label: 'ଓଡ଼ିଆ' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ' },
  { code: 'ta-IN', label: 'தமிழ்' },
  { code: 'te-IN', label: 'తెలుగు' },
] as const;

const SPOKEN_CODES = new Set(VOICE_LANGUAGES.map((l) => l.code));

export const DEFAULT_LANGUAGE = 'en-IN';

/**
 * Maps whatever we were handed — a bare "hi", a detected "hi-IN", an unknown —
 * onto a language we can actually speak. Anything unrecognised becomes English.
 */
export function normalizeLanguage(input: unknown): string {
  if (typeof input !== 'string') return DEFAULT_LANGUAGE;
  const raw = input.trim().toLowerCase();
  if (!raw || raw === 'unknown') return DEFAULT_LANGUAGE;
  const withRegion = raw.includes('-') ? raw : `${raw}-in`;
  const canonical = withRegion.replace(/-in$/, '-IN');
  return SPOKEN_CODES.has(canonical as any) ? canonical : DEFAULT_LANGUAGE;
}

export const isEnglish = (code: string) => normalizeLanguage(code) === DEFAULT_LANGUAGE;

/**
 * Up to four keys: SARVAM_API_KEY, then _2, _3, _4.
 *
 * Voice is the most quota-hungry thing the app does — a single spoken turn can
 * be an STT call, a translate call and several TTS chunks — so this is the pool
 * that matters most in practice. Each call below runs through `keys.run`, which
 * replays the identical request (the same audio buffer, the same text, the same
 * target language) on the next key when one is exhausted.
 */
const keys = createKeyPool<SarvamAIClient>({
  name: 'sarvam',
  envPrefix: 'SARVAM_API_KEY',
  build: (apiSubscriptionKey) => new SarvamAIClient({ apiSubscriptionKey }),
  disabledNote: 'voice chat is disabled, typing still works',
});

export const sarvamEnabled = () => keys.enabled();

/** How many Sarvam keys are configured. Surfaced on /healthz. */
export const sarvamKeyCount = () => keys.size();

function withTimeout<T>(work: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
    ),
  ]);
}

export interface Transcription {
  text: string;
  /** Detected (or requested) language, always one we can speak back in. */
  languageCode: string;
}

/**
 * Speech to text. `languageHint` may be omitted, in which case Sarvam detects
 * the language and we hand it back so the reply can be spoken in kind.
 */
export async function transcribe(
  audio: Buffer, contentType: string, languageHint?: string,
): Promise<Transcription | null> {
  if (!keys.enabled()) return null;

  // "unknown" is Sarvam's own auto-detect value; passing a real code skips
  // detection and is noticeably more accurate when the student has told us.
  const requested = languageHint ? normalizeLanguage(languageHint) : null;

  // Sarvam matches the content type against a fixed allowlist verbatim, so the
  // codec parameter MediaRecorder tacks on ("audio/webm;codecs=opus") is a 400
  // even though plain "audio/webm" is accepted. Send the bare type.
  const baseType = contentType.split(';')[0].trim().toLowerCase() || 'audio/webm';

  try {
    const res = await keys.run('speech-to-text', (s) => withTimeout(
      s.speechToText.transcribe({
        file: {
          data: audio,
          filename: `speech.${extensionFor(baseType)}`,
          contentType: baseType,
        },
        model: STT_MODEL as any,
        language_code: (requested ?? 'unknown') as any,
      }),
      'sarvam speech-to-text',
    ));

    const text = (res.transcript ?? '').trim();
    if (!text) return null;
    return { text, languageCode: normalizeLanguage(res.language_code ?? requested) };
  } catch (e: any) {
    console.warn('[sarvam] transcription failed:', e.message);
    return null;
  }
}

function extensionFor(contentType: string): string {
  const type = contentType.split(';')[0].trim().toLowerCase();
  if (type.includes('webm')) return 'webm';
  if (type.includes('ogg') || type.includes('opus')) return 'ogg';
  if (type.includes('mp4') || type.includes('m4a') || type.includes('aac')) return 'm4a';
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  if (type.includes('flac')) return 'flac';
  return 'wav';
}

/**
 * Text to speech. Returns base64 WAV clips meant to be played back to back —
 * Sarvam chunks long text itself, and we chunk again above its per-request
 * limit, so a long recommendation comes back as several clips.
 */
export async function speak(text: string, language = DEFAULT_LANGUAGE): Promise<string[] | null> {
  if (!keys.enabled()) return null;

  const clean = speakable(text);
  if (!clean) return null;

  const target = normalizeLanguage(language);
  const audios: string[] = [];

  try {
    // Rotation is per chunk, not per utterance. A long recommendation is
    // several TTS calls, and if the key runs dry on chunk three the remaining
    // chunks continue on the next key — the student hears one continuous reply
    // rather than a sentence and a half.
    for (const chunk of splitForLimit(clean, TTS_CHUNK_CHARS)) {
      const res = await keys.run('text-to-speech', (s) => withTimeout(
        s.textToSpeech.convert({
          text: chunk,
          target_language_code: target as any,
          speaker: SPEAKER as any,
          model: TTS_MODEL as any,
          enable_preprocessing: true,
        }),
        'sarvam text-to-speech',
      ));
      audios.push(...(res.audios ?? []));
    }
  } catch (e: any) {
    console.warn('[sarvam] speech synthesis failed:', e.message);
    return audios.length ? audios : null;
  }

  return audios.length ? audios : null;
}

/**
 * English out, the student's language back. Used only for what FAB *says* —
 * the transcript kept for Gemini stays in one language so the interviewer
 * reads a consistent conversation.
 */
export async function translate(text: string, target: string): Promise<string | null> {
  if (!keys.enabled()) return null;

  const to = normalizeLanguage(target);
  if (isEnglish(to)) return text;

  try {
    const parts: string[] = [];
    for (const chunk of splitForLimit(text, TRANSLATE_CHUNK_CHARS)) {
      const res = await keys.run('translate', (s) => withTimeout(
        s.text.translate({
          input: chunk,
          source_language_code: 'en-IN' as any,
          target_language_code: to as any,
          model: TRANSLATE_MODEL as any,
        }),
        'sarvam translate',
      ));
      if (res.translated_text) parts.push(res.translated_text);
    }
    const joined = parts.join(' ').trim();
    return joined || null;
  } catch (e: any) {
    console.warn('[sarvam] translation failed:', e.message);
    return null;
  }
}

/**
 * The other direction: the student's language in, English out.
 *
 * Used where the server has to *understand* a spoken answer rather than relay
 * it — matching "நர்சிங்" to B.Sc. Nursing, for instance. The catalogue and
 * every matcher in topology.ts are English, so a Tamil or Hindi answer has to
 * be brought into English before it can be resolved. What the student sees is
 * unaffected; this is only for lookup.
 */
export async function toEnglish(text: string, source: string): Promise<string | null> {
  if (!keys.enabled()) return null;

  const from = normalizeLanguage(source);
  if (isEnglish(from)) return text;

  const input = text.trim().slice(0, TRANSLATE_CHUNK_CHARS);
  if (!input) return null;

  try {
    const res = await keys.run('translate to english', (s) => withTimeout(
      s.text.translate({
        input,
        source_language_code: from as any,
        target_language_code: DEFAULT_LANGUAGE as any,
        model: TRANSLATE_MODEL as any,
      }),
      'sarvam translate to english',
    ));
    return (res.translated_text ?? '').trim() || null;
  } catch (e: any) {
    console.warn('[sarvam] translation to English failed:', e.message);
    return null;
  }
}

/**
 * What FAB says out loud is not byte-for-byte what he types. Line breaks that
 * read fine on screen become dead air, and a bare "(78% match)" is read as
 * punctuation soup.
 */
export function speakable(text: string): string {
  return String(text ?? '')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\s*\(\s*(\d{1,3})\s*%\s*match\s*\)/gi, ', a $1 percent match')
    .replace(/[*_#`>]/g, '')
    .replace(/\.{2,}/g, '.')
    .replace(/\s*\.\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Splits on sentence boundaries, never mid-word, never above `limit`. */
function splitForLimit(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];

  const chunks: string[] = [];
  let current = '';
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const piece of sentence.length > limit ? hardWrap(sentence, limit) : [sentence]) {
      if (current && current.length + piece.length + 1 > limit) {
        chunks.push(current);
        current = piece;
      } else {
        current = current ? `${current} ${piece}` : piece;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function hardWrap(text: string, limit: number): string[] {
  const out: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (current && current.length + word.length + 1 > limit) {
      out.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) out.push(current);
  return out;
}
