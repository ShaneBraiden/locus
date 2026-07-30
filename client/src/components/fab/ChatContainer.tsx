import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Message, Phase, VoiceLanguage } from "../../types";
import { Check, ClipboardList, Loader2, Mic, Plus, Send, Square, Volume2, VolumeX, X } from "lucide-react";
import { Recorder, Recording, isRecordingSupported, startRecording } from "../../lib/voice";
import { Button, EmptyState, Progress } from "../../ui";

// Progress is reported by the server (see FlowResponse.progress in
// server/src/flow.ts). It used to be scraped out of a literal "(n/15)" prefix
// in FAB's own text, which cannot work now that Gemini phrases every question
// differently.
interface ChatProgress {
  answered: number;
  total: number;
}

/**
 * Everything the spoken half of the chat needs. Voice is powered by Sarvam on
 * the server and shares this exact conversation: a recording is sent to the
 * same FAB turn a typed message is, so the two can be mixed freely.
 *
 * Omitted (or `enabled: false`, when the server has no Sarvam key) hides every
 * voice control and leaves the typed chat untouched.
 */
interface VoiceControls {
  enabled: boolean;
  languages: VoiceLanguage[];
  /** Selected language, or "auto" to let Sarvam detect it each time. */
  language: string;
  onLanguageChange: (code: string) => void;
  /** Whether FAB's replies play out loud on their own. */
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onSendVoice: (recording: Recording) => void;
  /** Read one message out loud. Called again while playing means stop. */
  onSpeakMessage: (message: Message) => void;
  /** Id of the message being spoken right now, if any. */
  speakingMessageId: string | null;
}

/** A minute is already past what the transcription endpoint handles well. */
const MAX_RECORDING_SECONDS = 60;

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (text: string, optionSelected?: string) => void;
  isProcessing: boolean;
  phase: Phase;
  progress?: ChatProgress | null;
  onNewChat?: () => void;
  voice?: VoiceControls;
  // Optional: only used to render the mobile "Peep Insights" toggle bar.
  // If the parent (App.tsx) doesn't pass these, the toggle bar is simply hidden
  // and everything else works exactly the same.
  onToggleSecretBoard?: () => void;
  showSecretBoardMobile?: boolean;
}

export default function ChatContainer({
  messages,
  onSendMessage,
  isProcessing,
  phase,
  progress: serverProgress,
  onNewChat,
  voice,
  onToggleSecretBoard,
  showSecretBoardMobile = false,
}: ChatContainerProps) {
  const [inputText, setInputText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Voice -----------------------------------------------------------------
  const canRecord = Boolean(voice?.enabled) && isRecordingSupported();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // A clip is in flight and we do not yet know what it said — transcription
  // happens server-side, so the student's own words arrive with FAB's reply.
  const [awaitingTranscript, setAwaitingTranscript] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);

  const finishRecording = async (send: boolean) => {
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setIsRecording(false);
    if (!recorder) return;

    if (!send) {
      recorder.cancel();
      return;
    }
    try {
      const recording = await recorder.stop();
      if (!recording) {
        setVoiceError("That was too short to hear. Hold the mic a little longer.");
        return;
      }
      setAwaitingTranscript(true);
      voice?.onSendVoice(recording);
    } catch (err: any) {
      setVoiceError(err?.message || "Recording failed. Try again, or just type.");
    }
  };

  const beginRecording = async () => {
    setVoiceError(null);
    try {
      recorderRef.current = await startRecording();
      setElapsed(0);
      setIsRecording(true);
    } catch (err: any) {
      setVoiceError(err?.message || "Could not start recording.");
    }
  };

  const toggleRecording = () => {
    if (isProcessing && !isRecording) return;
    if (isRecording) void finishRecording(true);
    else void beginRecording();
  };

  // Tick the elapsed counter, and stop on our own before the clip gets too long
  // for the transcription endpoint to handle.
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= MAX_RECORDING_SECONDS) void finishRecording(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  // The transcript landing in the feed is what resolves the placeholder,
  // whether the turn succeeded or errored out.
  useEffect(() => setAwaitingTranscript(false), [messages]);

  // Never leave the microphone open behind us.
  useEffect(() => () => recorderRef.current?.cancel(), []);

  // Helper to scroll the container to the absolute bottom
  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  // Auto-scroll on messages or isProcessing state change
  useEffect(() => {
    // Scroll immediately
    scrollToBottom("smooth");

    // Set a sequence of timeouts to handle any dynamic heights, font layouts, or formatting settling
    const t1 = setTimeout(() => scrollToBottom("smooth"), 50);
    const t2 = setTimeout(() => scrollToBottom("smooth"), 150);
    const t3 = setTimeout(() => scrollToBottom("smooth"), 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [messages, isProcessing]);

  // Also scroll immediately on first mount to prevent visual delay
  useEffect(() => {
    scrollToBottom("auto");
    const t = setTimeout(() => scrollToBottom("auto"), 100);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const handleOptionClick = (option: string) => {
    if (isProcessing) return;
    onSendMessage(option, option);
  };

  // Options are a shortcut, never a gate: the student can always just type.
  // (The server matches typed text back onto the same options.)
  const progress =
    serverProgress && serverProgress.total > 0 && serverProgress.answered < serverProgress.total
      ? serverProgress
      : null;

  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      {/* Chat header. Everything used to sit in one row that overflowed on a
          phone the moment the voice controls appeared; the counter now lives
          with the progress bar and the controls collapse to icons. */}
      <header className="shrink-0 border-b border-ink-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-bold text-moss-300">
              F
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-good-500" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-ink-900">FAB</span>
              <span className="block truncate text-tiny text-ink-500">Your Northr companion</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {voice?.enabled && (
              <>
                <select
                  id="voice-language"
                  value={voice.language}
                  onChange={(e) => voice.onLanguageChange(e.target.value)}
                  title="Language FAB listens and replies in"
                  aria-label="Voice language"
                  className="h-8 max-w-28 rounded-lg border border-ink-450 bg-white px-2 text-tiny font-semibold text-ink-700 shadow-e1 transition-colors hover:border-ink-600"
                >
                  <option value="auto">Auto</option>
                  {voice.languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  variant={voice.autoSpeak ? "primary" : "outline"}
                  onClick={voice.onToggleAutoSpeak}
                  title={voice.autoSpeak ? "FAB reads replies out loud" : "FAB stays silent"}
                  aria-pressed={voice.autoSpeak}
                  aria-label="Toggle spoken replies"
                  className="w-8 px-0"
                >
                  {voice.autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </Button>
              </>
            )}

            {onNewChat && (
              <Button size="sm" variant="outline" onClick={onNewChat} title="New conversation">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New</span>
              </Button>
            )}

            {onToggleSecretBoard && (
              <Button size="sm" variant="outline" onClick={onToggleSecretBoard} className="lg:hidden">
                <ClipboardList className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{showSecretBoardMobile ? "Hide" : "Insights"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Progress: label and bar together, so the count reads as progress
            rather than as one more control competing in the header row. */}
        <AnimatePresence initial={false}>
          {progress && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mx-auto w-full max-w-3xl px-4 pb-2.5 sm:px-6">
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="eyebrow">Getting to know you</span>
                  <span data-numeric className="font-mono text-micro font-bold text-ink-500">
                    {progress.answered} / {progress.total}
                  </span>
                </div>
                <Progress
                  value={(progress.answered / progress.total) * 100}
                  size="sm"
                  tone="moss"
                  label="Conversation progress"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Message feed. The old feed had no max width, so on a wide monitor a
          reply ran the full 1900px and became unreadable. */}
      <div
        ref={scrollContainerRef}
        className="scroll-slim flex-1 overflow-y-auto bg-white"
      >
        <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
        {messages.length === 0 && !isProcessing && (
          <EmptyState
            className="border-none bg-transparent py-16"
            title="Say hi to FAB"
            description="Just a conversation, no right answers — and one real answer at the end: the career path that actually fits you. Start whenever you're ready."
          />
        )}

        {messages.map((message, i) => {
          const isUser = message.sender === "user";
          // Consecutive messages from the same side used to repeat the avatar
          // and the "FAB"/"You" label on every single bubble, which made a long
          // reply chain look like six separate speakers.
          const prev = messages[i - 1];
          const startsGroup = !prev || (prev.sender === "user") !== isUser;

          return (
            <div
              key={message.id}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${
                startsGroup ? "" : "-mt-3"
              }`}
            >
              <div className="flex min-w-0 max-w-[88%] items-start gap-2.5 sm:max-w-[80%]">
                {/* FAB avatar — a spacer keeps grouped bubbles aligned. */}
                {!isUser &&
                  (startsGroup ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-bold text-moss-300">
                      F
                    </span>
                  ) : (
                    <span className="h-0 w-8 shrink-0" aria-hidden />
                  ))}

                <div className="min-w-0 flex-1 space-y-1">
                  {startsGroup && (
                    <div
                      className={`flex items-center gap-1.5 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span className="eyebrow">{isUser ? "You" : "FAB"}</span>
                      {isUser && message.channel === "voice" && (
                        <Mic className="h-3 w-3 text-moss-600" aria-label="Spoken" />
                      )}
                    </div>
                  )}

                  {/* Message bubble. The tail corner is squared off on the
                      speaker's side so direction reads at a glance. */}
                  <div
                    className={`relative rounded-2xl px-4 py-3 text-base ${
                      isUser
                        ? "rounded-br-md bg-ink-900 text-white"
                        : "rounded-bl-md border border-ink-100 bg-ink-50 text-ink-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>

                    {/* What FAB actually said out loud, when the student is
                        not on English. The English above stays the record. */}
                    {!isUser && message.spokenText && (
                      <p className="mt-2 whitespace-pre-wrap break-words border-t border-ink-200 pt-2 text-sm text-ink-600">
                        {message.spokenText}
                      </p>
                    )}
                  </div>

                  {/* Replay control moved below the bubble — in the header row
                      it was a 12px tap target wedged against the label. */}
                  {!isUser && voice?.enabled && message.text && (
                    <button
                      onClick={() => voice.onSpeakMessage(message)}
                      title={voice.speakingMessageId === message.id ? "Stop" : "Read this out loud"}
                      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-micro font-bold uppercase tracking-wider text-ink-500 transition-colors hover:bg-ink-100 hover:text-moss-700"
                    >
                      {voice.speakingMessageId === message.id ? (
                        <>
                          <Square className="h-3 w-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3 w-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Shortcut options: the degree picker, or the plain-instrument
                      fallback when Gemini is unreachable. Tapping is optional —
                      typing an answer works just as well. */}
                  {!isUser && message.options && message.options.length > 0 && !message.selectedOption && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {message.options.map((option, idx) => (
                        <motion.button
                          key={idx}
                          id={`mcq-option-${idx}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => handleOptionClick(option)}
                          disabled={isProcessing}
                          className="group flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-left text-sm font-semibold leading-snug text-ink-900 shadow-e1 transition-[border-color,background-color,box-shadow] duration-150 hover:border-moss-400 hover:bg-moss-50 hover:shadow-e2 disabled:opacity-50"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink-200 bg-ink-50 font-mono text-tiny font-bold text-ink-500 transition-colors duration-150 group-hover:border-moss-500 group-hover:bg-moss-500 group-hover:text-white">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="min-w-0 flex-1 break-words">{option}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Chosen option status */}
                  {!isUser && message.selectedOption && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-good-300/50 bg-good-50 px-3 py-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-good-700" />
                      <span className="min-w-0 break-words text-xs font-semibold text-good-700">
                        {message.selectedOption}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* The clip is on its way up but nobody has read it back to us yet */}
        {awaitingTranscript && isProcessing && (
          <div className="flex w-full justify-end">
            <div className="flex min-w-0 max-w-[88%] items-start gap-2.5 sm:max-w-[80%]">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="eyebrow">You</span>
                  <Mic className="h-3 w-3 text-moss-600" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-br-md border border-ink-200 bg-ink-50 px-4 py-3">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-moss-600" />
                  <span className="text-sm font-medium text-ink-600">
                    Working out what you said…
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAB is thinking */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 font-display text-sm font-bold text-moss-300">
                F
              </span>
              <div className="space-y-1">
                <div className="eyebrow">FAB is thinking</div>
                <div
                  className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-ink-100 bg-ink-50 px-4 py-3.5"
                  role="status"
                  aria-label="FAB is composing a reply"
                >
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar: type it or say it, same conversation either way */}
      <div className="shrink-0 border-t border-ink-100 bg-white px-4 pb-4 pt-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          {voiceError && (
            <div className="mb-2 flex items-start gap-2 rounded-lg border border-warn-300/60 bg-warn-50 px-3 py-2">
              <span className="min-w-0 flex-1 break-words text-xs font-semibold text-warn-700">
                {voiceError}
              </span>
              <button
                onClick={() => setVoiceError(null)}
                className="shrink-0 text-warn-700 transition-colors hover:text-warn-900"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* The composer is now one bordered surface with the controls inset,
              rather than three separate floating pills that wrapped awkwardly
              on narrow screens. */}
          <form
            onSubmit={handleSubmit}
            className={`flex items-center gap-2 rounded-2xl border bg-white p-1.5 shadow-e2 transition-[border-color,box-shadow] ${
              isRecording
                ? "border-moss-400 shadow-glow-moss"
                : "border-ink-200 focus-within:border-moss-400 focus-within:shadow-glow-moss"
            }`}
          >
            {canRecord && (
              <button
                id="voice-record-btn"
                type="button"
                onClick={toggleRecording}
                disabled={isProcessing && !isRecording}
                title={isRecording ? "Send what you said" : "Talk to FAB"}
                aria-label={isRecording ? "Stop recording and send" : "Record a voice message"}
                aria-pressed={isRecording}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40 ${
                  isRecording
                    ? "bg-moss-500 text-white"
                    : "text-ink-500 hover:bg-ink-100 hover:text-moss-700"
                }`}
              >
                {isRecording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4.5 w-4.5" />}
              </button>
            )}

            {isRecording ? (
              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-1">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-moss-500" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">
                  Listening…
                </span>
                <span data-numeric className="shrink-0 font-mono text-xs font-bold text-ink-500">
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => void finishRecording(false)}
                  title="Discard this recording"
                  aria-label="Discard recording"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-bad-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <input
                id="user-chat-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isProcessing}
                placeholder={
                  isProcessing ? "FAB is sensing the signals…" : "Say it however it comes out…"
                }
                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-500 focus:outline-none disabled:opacity-50"
              />
            )}

            <button
              id="send-chat-btn"
              type="submit"
              disabled={isProcessing || isRecording || !inputText.trim()}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-white transition-colors hover:bg-ink-800 disabled:bg-ink-100 disabled:text-ink-500"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-2 text-center text-tiny text-ink-500">
            {canRecord
              ? "Type it or tap the mic and say it. FAB remembers either way."
              : "Talk to FAB like you'd talk to your smartest, warmest friend."}
          </p>
        </div>
      </div>
    </div>
  );
}
