import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Loader2, Sparkles, X } from "lucide-react";
import { InterviewCategory } from "../../types";
import QuestionRunner, { RunnerAnswer } from "./QuestionRunner";

// ---------------------------------------------------------------------------
// THE FEATURE GATES.
//
// Two of the six categories are held back until the student opens the feature
// that needs them. "What pulls you" — the Holland items, which are what
// actually decide the ranking — is asked the first time they open Career
// Paths. "How you work" — the Big Five items, which decide which experiments
// the lab hands out — is asked the first time they open the lab.
//
// The point of asking here rather than at signup is that the question has an
// obvious answer to "why are you asking me this": they are one tap from the
// screen it feeds. Six items on the way into a feature they chose to open is a
// different experience from six more items on a signup form, even though it is
// the same six items.
//
// A GATE IS NOT A WALL. Every sheet carries a "Later", the dismissal is
// remembered on the device, and the category simply returns to FAB's queue —
// the conversation asks whatever the modals did not collect (see chatOrder in
// server/src/categories.ts). Nothing in the product is ever unreachable
// because a student closed a modal.
// ---------------------------------------------------------------------------

interface FeatureGateProps {
  open: boolean;
  category: InterviewCategory;
  /** Plain-language name of what they were opening, for the framing line. */
  featureName: string;
  onSubmit: (answers: RunnerAnswer[]) => Promise<void>;
  /** Dismiss and go through to the feature anyway. */
  onDefer: () => void;
  error?: string | null;
}

export default function FeatureGate({
  open,
  category,
  featureName,
  onSubmit,
  onDefer,
  error,
}: FeatureGateProps) {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [total, setTotal] = useState(category.items.length);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Escape defers rather than trapping them. The sheet is optional, so the key
  // that means "get me out of here" has to actually do that.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onDefer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onDefer]);

  // The page behind a modal must not scroll under it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Move focus into the sheet so a keyboard user is not left tabbing the page
  // underneath a dialog that has covered it.
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  const submit = async (answers: RunnerAnswer[]) => {
    setBusy(true);
    try {
      await onSubmit(answers);
    } catch {
      // Rethrown so the runner unlatches and the student can retry by tapping
      // their answer again. The parent has already turned this into `error`.
      setBusy(false);
      throw new Error("save failed");
    }
    setBusy(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-ink-900/45 backdrop-blur-[2px]"
            onClick={() => !busy && onDefer()}
            aria-hidden
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feature-gate-title"
            tabIndex={-1}
            ref={dialogRef}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-x-3 top-1/2 z-[61] mx-auto flex max-h-[min(42rem,88dvh)] w-auto max-w-[30rem] -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-e5 outline-none sm:inset-x-4"
          >
            {/* Header. Says what this is and, more importantly, why it is in
                the way — a modal that does not justify itself is a modal that
                gets dismissed on reflex. */}
            <div className="shrink-0 border-b border-ink-200 px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="eyebrow mb-1.5 flex items-center gap-1.5 text-moss-700">
                    <Sparkles className="h-3 w-3" />
                    {category.title}
                  </div>
                  <h2
                    id="feature-gate-title"
                    className="text-lg font-bold leading-tight tracking-tight text-ink-900 text-balance"
                  >
                    {category.items.length} quick ones before {featureName}
                  </h2>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-ink-600 text-pretty">
                    {category.blurb}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onDefer}
                  disabled={busy}
                  aria-label="Skip for now"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <QuestionRunner
                items={category.items}
                onComplete={submit}
                busy={busy}
                allowSkip
                onStepChange={(s, t) => {
                  setStep(s);
                  setTotal(t);
                }}
              />
            </div>

            <div className="shrink-0 border-t border-ink-200 px-5 py-3">
              {error && (
                <div
                  role="alert"
                  className="mb-2.5 flex items-start gap-2 rounded-xl border border-bad-300/60 bg-bad-50 px-3 py-2"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bad-700" />
                  <span className="min-w-0 flex-1 text-xs font-semibold text-bad-700 text-pretty">
                    {error} Tap your answer again to retry.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <span data-numeric className="font-mono text-micro font-bold text-ink-500">
                  {Math.min(step + 1, total)} / {total}
                </span>

                {busy ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onDefer}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
                  >
                    Later — FAB can ask me
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
