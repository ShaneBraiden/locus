import { authHeaders } from "./stateSync";
import { AssessmentState, CareerPath, Message, Phase, PsychReadout, UserMemory, VoiceLanguage } from "../types";

// ---------------------------------------------------------------------------
// Voice chat, powered by Sarvam AI on the server.
//
//   POST /api/fab/voice       audio -> transcript -> the normal FAB turn -> audio
//   POST /api/voice/transcribe  audio -> text (dictation into the input box)
//   POST /api/voice/speak       text  -> audio (read any FAB message out loud)
//   GET  /api/voice/status      is voice configured, and in which languages
//
// The browser only records and plays. Every model call happens server-side, so
// no API key is ever shipped to the client, and a spoken turn walks through the
// exact same career flow a typed one does.
// ---------------------------------------------------------------------------

/** Anything under this is a mis-tap, not a sentence. */
const MIN_CLIP_BYTES = 1200;

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
];

export interface VoiceStatus {
  enabled: boolean;
  languages: VoiceLanguage[];
  language: string;
  defaultLanguage: string;
}

export interface VoiceTurnResponse {
  reply: string;
  options?: string[];
  updatedPhase?: Phase;
  updatedSignals?: any;
  updatedConstraints?: any;
  reflectionText?: string;
  bestFitPaths?: CareerPath[];
  assessment: AssessmentState;
  progress?: { answered: number; total: number };
  psychometrics?: PsychReadout;
  degreeName?: string;
  /** What Sarvam heard, already appended to the conversation server-side. */
  transcript: string;
  languageCode: string;
  userMessage: Message;
  /** Base64 WAV clips, played back to back. Null when speech was not requested. */
  audio: string[] | null;
  /** FAB's reply as it was spoken — translated when the student is not on English. */
  spokenText: string;
  memory?: UserMemory;
}

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  });
}

export interface Recording {
  /** A data: URL — the server accepts it as-is. */
  audio: string;
  mimeType: string;
  bytes: number;
  /**
   * The same clip as bare base64 16 kHz mono PCM, which is the only thing
   * Gemini Live will take. Null when the browser could not decode it; the
   * server then falls back to Sarvam using `audio` above.
   */
  pcm16k?: string | null;
}

export interface Recorder {
  /** Resolves with the clip, or null if it was too short to be speech. */
  stop: () => Promise<Recording | null>;
  /** Abandons the clip and releases the microphone. */
  cancel: () => void;
}

/**
 * Opens the microphone and starts recording. Rejects if permission is denied,
 * which the caller surfaces as a normal error message rather than silence.
 */
export async function startRecording(): Promise<Recorder> {
  if (!isRecordingSupported()) {
    throw new Error("This browser cannot record audio. You can still type to FAB.");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err: any) {
    if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
      throw new Error("Microphone access is blocked. Allow it in your browser to talk to FAB.");
    }
    if (err?.name === "NotFoundError") {
      throw new Error("No microphone found. Plug one in, or just type.");
    }
    throw new Error("Could not start recording. You can still type to FAB.");
  }

  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  const release = () => stream.getTracks().forEach((track) => track.stop());

  return {
    stop: () =>
      new Promise<Recording | null>((resolve, reject) => {
        recorder.onerror = () => {
          release();
          reject(new Error("Recording failed. Try again, or type it instead."));
        };
        recorder.onstop = () => {
          release();
          const type = recorder.mimeType || mimeType || "audio/webm";
          const blob = new Blob(chunks, { type });
          if (blob.size < MIN_CLIP_BYTES) {
            resolve(null);
            return;
          }
          Promise.all([blobToDataUrl(blob), toPcm16k(blob)])
            .then(([audio, pcm16k]) =>
              resolve({ audio, mimeType: type, bytes: blob.size, pcm16k }))
            .catch(() => reject(new Error("Could not read that recording. Try again.")));
        };
        // A recorder that was already stopped never fires onstop again.
        if (recorder.state === "inactive") recorder.onstop?.(new Event("stop"));
        else recorder.stop();
      }),
    cancel: () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } finally {
        release();
      }
    },
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// --- PCM conversion ---------------------------------------------------------
//
// Gemini Live accepts exactly one input format: signed 16-bit PCM, mono, 16 kHz.
// MediaRecorder gives us WebM/Opus, and the server has no ffmpeg to transcode,
// so the browser does it — decodeAudioData already knows how to unpack Opus,
// and OfflineAudioContext resamples on the way out.
//
// If any of that fails we simply do not attach PCM, and the server falls back
// to Sarvam with the original clip. Voice never breaks over this.

const TARGET_RATE = 16000;

async function toPcm16k(blob: Blob): Promise<string | null> {
  try {
    const Ctx: typeof AudioContext =
      (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx || typeof OfflineAudioContext === "undefined") return null;

    const bytes = await blob.arrayBuffer();
    const decoder = new Ctx();
    let decoded: AudioBuffer;
    try {
      decoded = await decoder.decodeAudioData(bytes.slice(0));
    } finally {
      void decoder.close();
    }

    // Mix to mono and resample in one pass.
    const frames = Math.ceil((decoded.duration * TARGET_RATE) || 0);
    if (!frames) return null;
    const offline = new OfflineAudioContext(1, frames, TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();

    const samples = rendered.getChannelData(0);
    const pcm = new DataView(new ArrayBuffer(samples.length * 2));
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcm.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return bytesToBase64(new Uint8Array(pcm.buffer));
  } catch {
    return null;
  }
}

/** btoa in chunks — a spread over a long clip blows the argument limit. */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// --- API calls --------------------------------------------------------------

async function postJson<T>(url: string, token: string | null, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Server returned HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchVoiceStatus(token: string | null): Promise<VoiceStatus | null> {
  try {
    const res = await fetch("/api/voice/status", { headers: authHeaders(token) });
    if (!res.ok) return null;
    return (await res.json()) as VoiceStatus;
  } catch {
    return null;
  }
}

/** The whole spoken turn: hear, run the career flow, answer out loud. */
export function sendVoiceTurn(
  token: string | null,
  input: {
    recording: Recording;
    messages: Message[];
    assessment: AssessmentState | null;
    language: string;
    speak: boolean;
  },
): Promise<VoiceTurnResponse> {
  return postJson<VoiceTurnResponse>("/api/fab/voice", token, {
    audio: input.recording.audio,
    pcm16k: input.recording.pcm16k ?? undefined,
    mimeType: input.recording.mimeType,
    language: input.language,
    messages: input.messages,
    assessment: input.assessment,
    speak: input.speak,
  });
}

export function transcribeOnly(
  token: string | null,
  recording: Recording,
  language: string,
): Promise<{ transcript: string; languageCode: string }> {
  return postJson("/api/voice/transcribe", token, {
    audio: recording.audio,
    pcm16k: recording.pcm16k ?? undefined,
    mimeType: recording.mimeType,
    language,
  });
}

export function synthesize(
  token: string | null,
  text: string,
  language: string,
): Promise<{ audio: string[]; spokenText: string; language: string }> {
  return postJson("/api/voice/speak", token, { text, language });
}

// --- Playback ---------------------------------------------------------------
//
// One clip at a time, app-wide: starting a new one always stops whatever was
// already talking, so FAB never speaks over himself.

let activeAudio: HTMLAudioElement | null = null;
let playToken = 0;

export function stopSpeaking(): void {
  playToken += 1;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
}

/**
 * Plays base64 WAV clips back to back. Resolves when the last one finishes, or
 * immediately if a newer playback superseded this one.
 */
export async function playClips(clips: string[]): Promise<void> {
  stopSpeaking();
  const token = playToken;

  for (const clip of clips) {
    if (token !== playToken) return;
    await new Promise<void>((resolve) => {
      const audio = new Audio(
        clip.startsWith("data:") ? clip : `data:audio/wav;base64,${clip}`,
      );
      activeAudio = audio;
      const done = () => {
        if (activeAudio === audio) activeAudio = null;
        resolve();
      };
      audio.onended = done;
      // A clip the browser refuses to decode should not wedge the queue.
      audio.onerror = done;
      audio.play().catch(done);
    });
  }
}
