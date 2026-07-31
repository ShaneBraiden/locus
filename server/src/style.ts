import type { Message } from './types.js';

// Reading how the student writes, so FAB can write back the same way.
//
// The old rule was blunt and applied to every turn: "always write your reply in
// English, the app translates it." That rule exists for a real reason, but the
// reason is a VOICE reason. On a spoken turn FAB's words are handed to Sarvam,
// which translates English into the student's language and speaks it, so a
// reply already written in Tamil would be translated a second time and come
// back mangled.
//
// On a TYPED turn none of that happens. Nothing translates a typed reply — it
// goes straight to the screen. So the English-only rule was buying nothing and
// costing a lot: a student who typed to FAB in Tamil got answered in English,
// which is not what a friend does, and is the single most alienating thing the
// app did.
//
// Hence the split this module exists to support:
//
//   typed turn  -> Gemini writes in the student's own language and register.
//                  Sarvam is not involved at any point.
//   spoken turn -> Gemini writes plain English, Sarvam translates and speaks.
//
// Everything measured here is surface texture — script, length, casing,
// punctuation, emoji. None of it touches scoring. The instrument reads what a
// student MEANT; this reads how they SOUND, and the two never meet.

/** Scripts we can recognise, in the order they are tested. */
const SCRIPTS: [RegExp, string, string][] = [
  [/\p{Script=Tamil}/u, 'Tamil', 'ta-IN'],
  [/\p{Script=Devanagari}/u, 'Devanagari (Hindi or Marathi)', 'hi-IN'],
  [/\p{Script=Bengali}/u, 'Bengali', 'bn-IN'],
  [/\p{Script=Gujarati}/u, 'Gujarati', 'gu-IN'],
  [/\p{Script=Gurmukhi}/u, 'Gurmukhi (Punjabi)', 'pa-IN'],
  [/\p{Script=Kannada}/u, 'Kannada', 'kn-IN'],
  [/\p{Script=Malayalam}/u, 'Malayalam', 'ml-IN'],
  [/\p{Script=Oriya}/u, 'Odia', 'od-IN'],
  [/\p{Script=Telugu}/u, 'Telugu', 'te-IN'],
];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/**
 * Romanised-Indic markers. A student writing "enakku theriyala bro" is not
 * writing English, even though every character is Latin, and answering them in
 * standard English reads as a correction.
 */
const ROMANISED_MARKERS = [
  'enna', 'enakku', 'illa', 'theriyala', 'seri', 'romba', 'konjam', 'vera',
  'nalla', 'venum', 'panna', 'irukku', 'aama', 'macha', 'da', 'nu',
  'kya', 'hai', 'nahi', 'nahin', 'haan', 'mujhe', 'mera', 'bhai', 'accha',
  'thoda', 'bohot', 'bahut', 'karna', 'matlab', 'yaar', 'bilkul',
];

/** Textspeak. Present or absent, it says a lot about the register to match. */
const SHORTHAND = [
  'u', 'ur', 'r', 'pls', 'plz', 'thx', 'tq', 'idk', 'idc', 'imo', 'btw',
  'ya', 'yaa', 'yeah', 'yup', 'nope', 'k', 'kk', 'ok', 'okk', 'lol', 'lmao',
  'bro', 'bruh', 'dude', 'ngl', 'fr', 'tbh',
];

export interface TypingStyle {
  /** Human-readable script name, or "Latin". */
  script: string;
  /** Sarvam language code implied by the script. */
  languageCode: string;
  /** Latin characters, but the words are Indic — Tanglish, Hinglish and so on. */
  romanised: boolean;
  /** Mean words per message across what we sampled. */
  avgWords: number;
  /** They do not capitalise the start of sentences. */
  lowercase: boolean;
  /** They use emoji. */
  emoji: boolean;
  /** They use textspeak abbreviations. */
  shorthand: boolean;
  /** They mostly skip end punctuation. */
  sparsePunctuation: boolean;
  /** Their last few messages, verbatim, as the strongest evidence of all. */
  samples: string[];
}

/** How many recent user messages inform the read. */
const SAMPLE_SIZE = 4;

/**
 * Reads the student's texting fingerprint off the transcript. Returns null when
 * there is nothing to read — the first turn of a brand new conversation, or a
 * transcript of nothing but tapped option buttons.
 */
export function readTypingStyle(messages: Message[]): TypingStyle | null {
  const typed = messages
    .filter((m) => m.sender === 'user' && m.channel !== 'voice')
    .map((m) => (m.text ?? '').trim())
    // A tapped multiple-choice button is our copy, not theirs. Reading style
    // off it would have FAB mirroring itself.
    .filter((t) => t.length > 1 && !/^option picked:/i.test(t))
    .slice(-SAMPLE_SIZE);

  if (!typed.length) return null;

  const joined = typed.join(' ');
  const words = joined.split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  let script = 'Latin';
  let languageCode = 'en-IN';
  for (const [re, name, code] of SCRIPTS) {
    if (re.test(joined)) { script = name; languageCode = code; break; }
  }

  const lower = words.map((w) => w.toLowerCase().replace(/[^\p{L}]/gu, ''));
  const romanised = script === 'Latin'
    && lower.filter((w) => ROMANISED_MARKERS.includes(w)).length >= 2;

  const sentenceStarts = typed.map((t) => t.replace(/^[^\p{L}]*/u, '')[0]).filter(Boolean);
  const lowercase = sentenceStarts.length > 0
    && sentenceStarts.filter((c) => c === c.toLowerCase() && c !== c.toUpperCase()).length
       > sentenceStarts.length / 2;

  const enders = (joined.match(/[.!?]/g) ?? []).length;

  return {
    script,
    languageCode,
    romanised,
    avgWords: Math.round(words.length / typed.length),
    lowercase,
    emoji: EMOJI.test(joined),
    shorthand: lower.some((w) => SHORTHAND.includes(w)),
    sparsePunctuation: enders < typed.length / 2,
    samples: typed.slice(-3),
  };
}

/**
 * The prompt block that tells FAB how to sound.
 *
 * Two completely different instructions depending on how the turn arrived, and
 * the difference is the whole point of this file.
 */
export function styleDirective(
  style: TypingStyle | null, channel: 'text' | 'voice' = 'text',
): string {
  if (channel === 'voice') {
    // Spoken path. Sarvam translates and speaks what you write, so it must
    // arrive in plain English or it gets translated twice.
    return `
HOW TO SOUND — this turn was SPOKEN, and your reply will be translated and read out loud:
- Write your reply in plain English. Do not write it in Tamil or any other language: the app translates it into their language before speaking it, and a reply that is already in their language comes back twice-translated and broken.
- Understand whatever language they spoke in fully, and take it exactly as seriously as English. Never ask them to switch languages and never remark on which one they used.
- Short, plain, spoken sentences. No parentheses, no lists, nothing that only works on a page.`;
  }

  // Typed path. Nothing translates this — it goes straight to their screen — so
  // write it the way they would write it.
  const base = `
HOW TO SOUND — this turn was TYPED, and your reply goes straight to their screen exactly as you write it:
- Write in the SAME LANGUAGE AND SCRIPT they used. If they typed Tamil, reply in Tamil. If they typed Hindi, reply in Hindi. If they typed romanised Tamil or Hindi in English letters, reply the same way, in English letters. If they mixed the two, mix them the same way. Nothing translates this reply, so whatever you write is what they read.
- Never ask them to switch languages and never remark on which one they used.
- Match how they text, not how a brand writes. You are a friend replying, not an assistant composing.`;

  if (!style) return base;

  const notes: string[] = [];

  if (style.script !== 'Latin') {
    notes.push(`They are typing in ${style.script}. Reply in ${style.script}.`);
  } else if (style.romanised) {
    notes.push('They are typing their own language in English letters (Tanglish/Hinglish). Reply the same way — English letters, their words. Do not "correct" it into standard English.');
  }

  notes.push(
    style.avgWords <= 4
      ? `They answer in about ${style.avgWords} words. Keep your reply to one or two short lines — matching a four-word answer with four sentences reads as pressure.`
      : style.avgWords <= 12
        ? `They write about ${style.avgWords} words at a time. Two short lines is the right size.`
        : `They write in full paragraphs (about ${style.avgWords} words). You can give them three or four lines back.`,
  );

  if (style.lowercase) notes.push('They do not capitalise sentences. Do the same.');
  if (style.sparsePunctuation) notes.push('They skip full stops. Do the same rather than punctuating carefully at them.');
  if (style.shorthand) notes.push('They use texting shorthand. A little of the same is right; do not pile it on.');
  notes.push(
    style.emoji
      ? 'They use emoji. At most one, and only where it lands.'
      : 'They do not use emoji. Do not use any.',
  );

  return `${base}
${notes.map((n) => `- ${n}`).join('\n')}

Their last few messages, so you can hear them:
${style.samples.map((s) => `  "${s}"`).join('\n')}
Match that voice. Do not imitate their spelling mistakes, do not mock, and never mention that you are matching how they write.`;
}
