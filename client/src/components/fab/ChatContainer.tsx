import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Message, Phase } from "../../types";
import { Check, ClipboardList, Plus, Send } from "lucide-react";

// Progress is reported by the server (see FlowResponse.progress in
// server/src/flow.ts). It used to be scraped out of a literal "(n/15)" prefix
// in FAB's own text, which cannot work now that Gemini phrases every question
// differently.
interface ChatProgress {
  answered: number;
  total: number;
}

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (text: string, optionSelected?: string) => void;
  isProcessing: boolean;
  phase: Phase;
  progress?: ChatProgress | null;
  onNewChat?: () => void;
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
  onToggleSecretBoard,
  showSecretBoardMobile = false,
}: ChatContainerProps) {
  const [inputText, setInputText] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    <div className="flex flex-col h-full min-w-0 bg-[#FFFDFB]">
      {/* Chat header: identity + live question-flow progress */}
      <div className="shrink-0 border-b border-[#EAE3D5] bg-[#FAF6F0]">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center space-x-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706]"></span>
            </span>
            <span className="truncate text-xs font-bold text-[#1A1310]">FAB (Northr Companion)</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <AnimatePresence initial={false}>
              {progress && (
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5C534C] tabular-nums"
                >
                  Getting to know you {progress.answered} / {progress.total}
                </motion.span>
              )}
            </AnimatePresence>

            {onNewChat && (
              <button
                onClick={onNewChat}
                title="New Conversation"
                className="flex items-center space-x-1 rounded-lg border border-[#EAE3D5] bg-[#FFFDFB] px-2 py-1 text-[11px] font-semibold text-[#5C534C] shadow-xs hover:border-[#D97706] hover:bg-[#FFFBF3] hover:text-[#D97706] active:bg-[#FAF6F0] transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-[#D97706]" />
                <span className="hidden sm:inline">New</span>
              </button>
            )}

            {onToggleSecretBoard && (
              <button
                onClick={onToggleSecretBoard}
                className="lg:hidden flex items-center space-x-1.5 rounded-lg border border-[#EAE3D5] bg-[#FFFDFB] px-2.5 py-1 text-[11px] font-semibold text-[#5C534C] shadow-sm active:bg-[#FAF6F0] cursor-pointer"
              >
                <ClipboardList className="h-3.5 w-3.5 text-[#D97706]" />
                <span>{showSecretBoardMobile ? "Hide Insights" : "Peep Insights"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Slim progress bar — only while the conversation is still gathering */}
        <AnimatePresence initial={false}>
          {progress && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 3, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full overflow-hidden bg-[#EAE3D5]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.answered}
              aria-label="Conversation progress"
            >
              <motion.div
                className="h-full rounded-r-full bg-gradient-to-r from-[#D97706] to-[#F59E0B]"
                initial={false}
                animate={{ width: `${(progress.answered / progress.total) * 100}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 24 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Message Feed */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-6 bg-[#FFFDFB]">
        {messages.length === 0 && !isProcessing && (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C6F3F7] bg-[#EAFDFE] font-display text-lg font-extrabold text-[#D97706] shadow-sm">
              F
            </div>
            <h3 className="font-display text-base font-bold text-[#1A1310]">
              Say hi to FAB
            </h3>
            <p className="max-w-xs text-xs font-medium leading-relaxed text-[#5C534C]">
              Just a conversation, no right answers — and one real answer at the end: the
              career path that actually fits you. Start whenever you're ready.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.sender === "user";
          return (
            <div
              key={message.id}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex min-w-0 items-start space-x-3 max-w-[85%] sm:max-w-[75%]`}>
                {/* FAB Avatar */}
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EAFDFE] border border-[#C6F3F7] text-[#D97706] font-extrabold text-sm shadow-sm font-display">
                    F
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  {/* Sender Name */}
                  <div className={`text-[10px] font-mono tracking-wider uppercase text-[#5C534C] font-bold ${isUser ? "text-right" : "text-left"}`}>
                    {isUser ? "You" : "FAB"}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed shadow-xs border ${
                      isUser
                        ? "bg-[#D97706] text-white border-[#D97706]"
                        : "bg-[#FAF6F0] text-[#1A1310] border-[#EAE3D5]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  </div>

                  {/* Shortcut options: the degree picker, or the plain-instrument
                      fallback when Gemini is unreachable. Tapping is optional —
                      typing an answer works just as well. */}
                  {!isUser && message.options && message.options.length > 0 && !message.selectedOption && (
                    <div className="grid grid-cols-1 gap-2 mt-3 pt-1">
                      {message.options.map((option, idx) => (
                        <motion.button
                          key={idx}
                          id={`mcq-option-${idx}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.25, ease: "easeOut" }}
                          whileTap={{ scale: 0.985 }}
                          onClick={() => handleOptionClick(option)}
                          disabled={isProcessing}
                          className="group flex w-full items-center gap-3 rounded-xl border border-[#EAE3D5] bg-white px-3.5 py-3 text-left text-[13px] font-semibold leading-snug text-[#1A1310] shadow-xs transition-colors duration-150 hover:border-[#D97706] hover:bg-[#FFFBF3] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#EAE3D5] bg-[#FAF6F0] font-mono text-[11px] font-extrabold text-[#5C534C] transition-colors duration-150 group-hover:border-[#D97706] group-hover:bg-[#D97706] group-hover:text-white">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="min-w-0 flex-1 break-words">{option}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Chosen Option status */}
                  {!isUser && message.selectedOption && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#E4EFE6] bg-[#F3FAF4] px-3 py-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="min-w-0 break-words text-[11.5px] font-semibold text-emerald-800">
                        {message.selectedOption}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* FAB Typing thoughts status */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-[75%]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EAFDFE] border border-[#C6F3F7] text-[#D97706] font-extrabold text-sm shadow-sm animate-pulse font-display">
                F
              </div>
              <div className="space-y-1">
                <div className="text-[10px] font-mono tracking-wider uppercase text-[#5C534C] font-bold">
                  FAB is feeling the vibe...
                </div>
                <div className="rounded-2xl px-4 py-3 bg-[#FAF6F0] border border-[#EAE3D5] shadow-xs flex items-center space-x-1.5">
                  <div className="h-2 w-2 rounded-full bg-[#D97706] animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="h-2 w-2 rounded-full bg-[#D97706] animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="h-2 w-2 rounded-full bg-[#D97706] animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-[#EAE3D5] bg-[#FAF6F0] p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl flex items-center space-x-2">
          <input
            id="user-chat-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            placeholder={
              isProcessing ? "FAB is sensing the signals..." : "Say it however it comes out..."
            }
            className="flex-1 rounded-xl border border-[#EAE3D5] bg-[#FFFDFB] px-4 py-3 text-sm text-[#1A1310] placeholder-[#5C534C] focus:border-[#D97706] focus:bg-[#FFFDFB] focus:outline-none focus:ring-1 focus:ring-[#D97706] disabled:opacity-50 font-bold"
          />
          <button
            id="send-chat-btn"
            type="submit"
            disabled={isProcessing || !inputText.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D97706] text-white hover:bg-[#B45309] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:ring-offset-2 disabled:bg-[#FAF6F0] disabled:text-[#A39A94] cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-[#5C534C] mt-2 font-semibold">
          Keep it real. Talk to FAB like you'd talk to your smartest, warmest friend.
        </p>
      </div>
    </div>
  );
}
