import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check } from "lucide-react";
import { InterviewItem } from "../../types";
import { cx } from "../../ui";

// ---------------------------------------------------------------------------
// THE TAPPED SURFACE.
//
// One shared runner behind both places the interview is answered by tapping:
// the onboarding screen at first login, and the two feature gates. It renders
// the committed item bank exactly as written and returns option ids — there is
// no model anywhere on this path, which is what makes it instant and what
// makes it work with the API down.
//
// ONE QUESTION AT A TIME, AND A TAP IS THE SUBMIT. Six questions on one
// scrolling page reads as a form and gets abandoned like one; six questions
// one at a time, each advancing the moment it is answered, reads as six taps.
// The cost of that choice is that it hides how much is left, which is what the
// step counter above the card is for.
// ---------------------------------------------------------------------------

export interface RunnerAnswer {
  itemId: string;
  optionId: string;
}

/** What a prelude step is handed so its own controls can advance the runner. */
export interface PreludeControls {
  next: () => void;
  back: () => void;
  busy: boolean;
}

export type PreludeStep = (controls: PreludeControls) => React.ReactNode;

export interface QuestionRunnerProps {
  items: InterviewItem[];
  /**
   * Extra steps rendered before the questions — the onboarding profile fields.
   * Each one is a render function rather than a node so it can drive the same
   * step counter the questions do, instead of running a second one beside it.
   */
  prelude?: PreludeStep[];
  /**
   * Called with every answer once the last step is done.
   *
   * May return a promise. If it rejects the runner unlatches, so a failed save
   * leaves the student on the last question with their answer still selected
   * and able to retry by tapping it again — rather than staring at an error
   * beside a UI that has already decided it is finished.
   */
  onComplete: (answers: RunnerAnswer[]) => void | Promise<void>;
  /** Rendered under the options. A "Later" escape, usually. */
  footer?: React.ReactNode;
  /** Disables input while a submission is in flight. */
  busy?: boolean;
  /** Fires whenever the step changes, so a parent can title itself. */
  onStepChange?: (step: number, total: number) => void;
  /** Answers already collected, so a reopened sheet resumes where it left off. */
  initialAnswers?: RunnerAnswer[];
  /**
   * Offers a "skip this one" under each question.
   *
   * A skipped item is simply left unanswered — it is NOT posted as skipped, so
   * the server keeps it open and FAB picks it up in conversation later. That
   * distinction matters: the server's own `skipped` list means "we gave up on
   * this", and a student choosing not to answer right now is not the same
   * thing as us deciding never to ask again.
   */
  allowSkip?: boolean;
}

/**
 * A tappable option.
 *
 * The letter chip is not decoration: the item bank is lettered A-E and a
 * student who read the question out to a friend, or who is answering the same
 * bank on paper somewhere, should see the same labels. It also gives the row a
 * fixed left edge so a two-line option and a one-line option still align.
 */
function OptionButton({
  letter,
  label,
  selected,
  disabled,
  onClick,
}: {
  letter: string;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        "group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left",
        "text-sm font-semibold leading-snug",
        "transition-[border-color,background-color,box-shadow] duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-moss-500 bg-moss-50 text-moss-900 shadow-e2"
          : "border-ink-200 bg-white text-ink-900 shadow-e1 hover:border-moss-400 hover:bg-moss-50/60 hover:shadow-e2",
      )}
    >
      <span
        className={cx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-tiny font-bold",
          "transition-colors duration-150",
          selected
            ? "border-moss-500 bg-moss-500 text-white"
            : "border-ink-200 bg-ink-50 text-ink-500 group-hover:border-moss-500 group-hover:bg-moss-500 group-hover:text-white",
        )}
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : letter}
      </span>
      <span className="min-w-0 flex-1 break-words text-pretty">{label}</span>
    </button>
  );
}

/**
 * The step rail. Dots rather than "3 of 6" because the count is small enough
 * to see at a glance, and a filled dot answers the only question a student
 * actually has here, which is "how much more of this is there".
 */
function StepRail({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cx(
            "h-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
            i === current
              ? "w-5 bg-moss-500"
              : i < current
                ? "w-1.5 bg-moss-300"
                : "w-1.5 bg-ink-200",
          )}
        />
      ))}
    </div>
  );
}

export default function QuestionRunner({
  items,
  prelude = [],
  onComplete,
  footer,
  busy = false,
  onStepChange,
  initialAnswers = [],
  allowSkip = false,
}: QuestionRunnerProps) {
  const [answers, setAnswers] = useState<RunnerAnswer[]>(initialAnswers);
  const total = prelude.length + items.length;

  // Resume where they left off. A sheet reopened after a "Later" starts on the
  // first question it has no answer for rather than making them tap through
  // the ones they already did — but only past the prelude, since a prelude
  // step owns whether it has been satisfied and the runner cannot know.
  const [step, setStep] = useState(() => {
    if (!initialAnswers.length) return 0;
    const firstOpen = items.findIndex((i) => !initialAnswers.some((a) => a.itemId === i.id));
    return firstOpen < 0 ? total - 1 : prelude.length + firstOpen;
  });

  // The completion callback fires from inside a click handler, so it has to
  // read the answers built in that same handler rather than the ones in state
  // — a setState is not visible until the next render.
  const completedRef = useRef(false);

  // Through a ref: every caller passes an inline arrow, so depending on the
  // callback itself would re-run this on each render of the parent.
  const stepChangeRef = useRef(onStepChange);
  useEffect(() => { stepChangeRef.current = onStepChange; }, [onStepChange]);
  useEffect(() => {
    stepChangeRef.current?.(step, total);
  }, [step, total]);

  const itemIndex = step - prelude.length;
  const item = itemIndex >= 0 ? items[itemIndex] : undefined;

  const answerFor = useCallback(
    (itemId: string) => answers.find((a) => a.itemId === itemId)?.optionId,
    [answers],
  );

  /** Ordered to match the bank rather than the order they were tapped in, so
   *  a resumed sheet posts the same payload a straight run would. */
  const collect = (from: RunnerAnswer[]) =>
    items.flatMap((i) => {
      const hit = from.find((a) => a.itemId === i.id);
      return hit ? [hit] : [];
    });

  const advance = (next: RunnerAnswer[]) => {
    if (step + 1 >= total) {
      completedRef.current = true;
      const result = onComplete(collect(next));
      if (result && typeof (result as Promise<void>).catch === "function") {
        (result as Promise<void>).catch(() => {
          completedRef.current = false;
        });
      }
      return;
    }
    setStep(step + 1);
  };

  const choose = (itemId: string, optionId: string) => {
    if (busy || completedRef.current) return;

    // Re-answering a question you stepped back to replaces the old answer
    // rather than appending a second one for the same item.
    const next = [...answers.filter((a) => a.itemId !== itemId), { itemId, optionId }];
    setAnswers(next);
    advance(next);
  };

  /** Move on without recording anything. See `allowSkip`. */
  const skip = () => {
    if (busy || completedRef.current) return;
    advance(answers);
  };

  const back = () => {
    if (step > 0 && !busy) setStep(step - 1);
  };

  /**
   * Advance without answering anything. Only a prelude step uses this — a
   * question advances by being answered, which is why there is no Next button
   * anywhere in the question half of this component.
   */
  const forward = () => {
    if (!busy && step + 1 < total) setStep(step + 1);
  };

  const preludeNode =
    step < prelude.length ? prelude[step]({ next: forward, back, busy }) : null;

  // A fresh key per step is what makes the transition read as one card being
  // replaced rather than as text changing inside a card that stayed put.
  const stepKey = preludeNode ? `prelude-${step}` : item?.id ?? `step-${step}`;

  const heading = useMemo(() => {
    if (!item) return null;
    return item.text;
  }, [item]);

  return (
    <div className="flex min-h-0 flex-col">
      {/* Step rail and back, on one line above the question. Back is only
          rendered once there is somewhere to go, so the row never holds a
          disabled control the student has to learn to ignore. */}
      <div className="mb-4 flex h-7 items-center justify-between gap-3">
        <StepRail total={total} current={step} />
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            disabled={busy}
            /* `min-h-6` keeps this on the 24px target floor (WCAG 2.5.8); at
               `py-1` around 10px type the box measured 20px tall. */
            className="inline-flex min-h-6 shrink-0 items-center gap-1 rounded-full px-2 py-1 text-micro font-bold uppercase tracking-[0.07em] text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepKey}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="min-h-0"
        >
          {preludeNode ?? (
            item && (
              <>
                <h2 className="mb-4 text-lg font-bold tracking-tight text-ink-900 text-balance">
                  {heading}
                </h2>
                <div className="space-y-2">
                  {item.options.map((option) => (
                    <OptionButton
                      key={option.id}
                      letter={option.letter}
                      label={option.label}
                      selected={answerFor(item.id) === option.id}
                      disabled={busy}
                      onClick={() => choose(item.id, option.id)}
                    />
                  ))}
                </div>

                {allowSkip && (
                  <div className="mt-3 text-center">
                    <button
                      type="button"
                      onClick={skip}
                      disabled={busy}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-500 underline-offset-2 transition-colors hover:bg-ink-100 hover:text-ink-900 hover:underline disabled:opacity-40"
                    >
                      None of these fit — ask me later
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
