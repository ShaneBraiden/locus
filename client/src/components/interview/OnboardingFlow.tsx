import React, { useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, GraduationCap, Loader2, Search } from "lucide-react";
import {
  DegreeOption,
  InterviewCategory,
  StudyYear,
} from "../../types";
import { Logo } from "../Logo";
import { Button, cx, inputClass } from "../../ui";
import QuestionRunner, {
  PreludeControls,
  PreludeStep,
  RunnerAnswer,
} from "./QuestionRunner";

// ---------------------------------------------------------------------------
// FIRST LOGIN.
//
// The personal category, and only the personal category: name, degree, year,
// then the four items about where they are in the decision, money, timing and
// geography. Everything else in the 28-item bank is held back for the feature
// gates and for FAB.
//
// NO GEMINI ON THIS SCREEN. It is the first thing a new account sees, it is
// answered entirely by tapping, and there is nothing here for a model to
// interpret — the student picks an option and the option is already scored in
// the committed table. Putting a network round trip and an outage mode in
// front of this screen would buy nothing at all.
//
// It is also the only screen in the app that is deliberately unskippable, and
// the reason is narrow: every ranking in the product is keyed on the degree.
// Without it there is no topology to rank against and no honest way to tell a
// student what their options are, so an app that let them past this screen
// would be an app that had to apologise on the next one. The four questions
// after the degree are a different matter and each carries a Skip.
// ---------------------------------------------------------------------------

export interface OnboardingSubmission {
  name: string;
  degreeId: string;
  year: string;
  answers: RunnerAnswer[];
}

interface OnboardingFlowProps {
  category: InterviewCategory;
  degrees: DegreeOption[];
  years: StudyYear[];
  /** Name from the account, offered as the default so most students just tap. */
  suggestedName?: string;
  onSubmit: (submission: OnboardingSubmission) => Promise<void>;
  /** Shown when the submission failed; the student stays on the last step. */
  error?: string | null;
}

/** A step's own heading, so the prelude and the questions read alike. */
function StepHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold tracking-tight text-ink-900 text-balance">{title}</h2>
      {hint && <p className="mt-1 text-xs font-medium text-ink-500 text-pretty">{hint}</p>}
    </div>
  );
}

export default function OnboardingFlow({
  category,
  degrees,
  years,
  suggestedName,
  onSubmit,
  error,
}: OnboardingFlowProps) {
  const [name, setName] = useState(suggestedName?.trim() ?? "");
  const [degreeId, setDegreeId] = useState("");
  const [year, setYear] = useState("");
  const [degreeQuery, setDegreeQuery] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [stepTotal, setStepTotal] = useState(3 + category.items.length);

  // The submitted answers, kept so a failed POST can be retried with the same
  // payload instead of making the student tap all four questions again.
  const pendingRef = useRef<RunnerAnswer[]>([]);

  const filteredDegrees = useMemo(() => {
    const q = degreeQuery.trim().toLowerCase();
    if (!q) return degrees;
    return degrees.filter((d) => d.name.toLowerCase().includes(q));
  }, [degrees, degreeQuery]);

  const submit = async (answers: RunnerAnswer[]) => {
    pendingRef.current = answers;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), degreeId, year, answers });
    } finally {
      setBusy(false);
    }
  };

  // The runner needs the rejection to unlatch itself, and nothing above needs
  // it: the parent has already turned the failure into `error`. Rethrowing
  // past this point would only surface as an unhandled rejection.
  const submitFromRunner = (answers: RunnerAnswer[]) =>
    submit(answers).catch(() => {
      throw new Error("save failed");
    });

  // ---- Step 1: name -------------------------------------------------------
  const nameStep: PreludeStep = ({ next, busy: isBusy }: PreludeControls) => {
    const confirm = () => {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        setNameError("Give me at least a couple of letters to work with.");
        return;
      }
      setNameError(null);
      next();
    };

    return (
      <div>
        <StepHeading
          title="First things first — what do I call you?"
          hint="Just the name your friends use. FAB will use it from here on."
        />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            confirm();
          }}
          className="space-y-3"
        >
          <input
            id="onboarding-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Your name"
            autoComplete="given-name"
            maxLength={40}
            disabled={isBusy}
            aria-invalid={!!nameError}
            aria-describedby={nameError ? "onboarding-name-error" : undefined}
            className={inputClass(!!nameError)}
          />
          {nameError && (
            <p
              id="onboarding-name-error"
              role="alert"
              className="flex items-center gap-1 text-tiny font-semibold text-bad-700"
            >
              <AlertCircle className="h-3 w-3 shrink-0" />
              {nameError}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" block disabled={isBusy}>
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    );
  };

  // ---- Step 2: degree -----------------------------------------------------
  //
  // A searchable list rather than a native select. Twenty-six long degree names
  // in a system dropdown is a scroll on a phone and an unreadable truncation on
  // a desktop, and this is the single most consequential answer on the screen —
  // every path the app ranks is ranked against it.
  const degreeStep: PreludeStep = ({ next, busy: isBusy }: PreludeControls) => (
    <div>
      <StepHeading
        title={`${name.trim() || "Right"} — what are you studying?`}
        hint="Pick the closest one. It decides which paths are actually open to you."
      />

      <div className="relative mb-2.5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          value={degreeQuery}
          onChange={(e) => setDegreeQuery(e.target.value)}
          placeholder="Search degrees"
          disabled={isBusy}
          aria-label="Search degrees"
          className={inputClass(false, true)}
        />
      </div>

      <div className="scroll-slim max-h-[15rem] space-y-1.5 overflow-y-auto pr-1">
        {filteredDegrees.length === 0 && (
          <p className="px-1 py-6 text-center text-xs font-medium text-ink-500">
            Nothing matches "{degreeQuery.trim()}". Try a shorter word — "nursing", "lab", "bio".
          </p>
        )}
        {filteredDegrees.map((degree) => {
          const selected = degree.id === degreeId;
          return (
            <button
              key={degree.id}
              type="button"
              disabled={isBusy}
              onClick={() => {
                setDegreeId(degree.id);
                // Selecting is committing here: there is exactly one thing to
                // choose, so a Continue button under it would only ever be a
                // second tap that does nothing new.
                next();
              }}
              className={cx(
                "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left",
                "text-sm font-semibold transition-[border-color,background-color] duration-150",
                "disabled:opacity-50",
                selected
                  ? "border-moss-500 bg-moss-50 text-moss-900"
                  : "border-ink-200 bg-white text-ink-900 hover:border-moss-400 hover:bg-moss-50/60",
              )}
            >
              <GraduationCap
                className={cx("h-4 w-4 shrink-0", selected ? "text-moss-600" : "text-ink-400")}
              />
              <span className="min-w-0 flex-1 break-words">{degree.name}</span>
              {selected && <Check className="h-4 w-4 shrink-0 text-moss-600" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ---- Step 3: year -------------------------------------------------------
  const yearStep: PreludeStep = ({ next, busy: isBusy }: PreludeControls) => (
    <div>
      <StepHeading
        title="How far along are you?"
        hint="This changes what counts as a realistic next step, not what you are capable of."
      />
      <div className="space-y-2">
        {years.map((y) => {
          const selected = y.id === year;
          return (
            <button
              key={y.id}
              type="button"
              disabled={isBusy}
              onClick={() => {
                setYear(y.id);
                next();
              }}
              className={cx(
                "flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left",
                "text-sm font-semibold transition-[border-color,background-color,box-shadow] duration-150",
                "disabled:opacity-50",
                selected
                  ? "border-moss-500 bg-moss-50 text-moss-900 shadow-e2"
                  : "border-ink-200 bg-white text-ink-900 shadow-e1 hover:border-moss-400 hover:bg-moss-50/60 hover:shadow-e2",
              )}
            >
              <span className="min-w-0 break-words">{y.label}</span>
              {selected && <Check className="h-4 w-4 shrink-0 text-moss-600" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const isQuestionStep = step >= 3;

  return (
    /* The auth page's shell, deliberately. This screen is the step immediately
       after it, and giving it the same glass card floating in the same sky is
       what makes onboarding read as the end of signing up rather than as the
       first chore inside the app. */
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-8 font-sans text-ink-900">
      <div className="w-full max-w-[30rem]">
        <div className="mb-5 flex items-center justify-center gap-2.5">
          <Logo className="h-9 w-9 rounded-lg" />
          <span className="font-display text-lg font-bold tracking-tight">northr</span>
        </div>

        <div className="nav-float has-cloud has-cloud--auth overflow-hidden rounded-3xl p-5 sm:p-6">
          {/* The category's own framing, held above the step rail so it stays
              put while the questions move underneath it. Without it the four
              scored items arrive with no explanation of why an app that just
              asked for a degree now wants to know about money. */}
          <div className="mb-4 border-b border-ink-200 pb-4">
            <div className="eyebrow mb-1.5">
              {isQuestionStep ? category.title : "Setting you up"}
            </div>
            <p className="text-xs font-medium leading-relaxed text-ink-600 text-pretty">
              {isQuestionStep
                ? category.blurb
                : "Two minutes, then FAB takes it from here. Nothing you pick is locked in."}
            </p>
          </div>

          <QuestionRunner
            items={category.items}
            prelude={[nameStep, degreeStep, yearStep]}
            onComplete={submitFromRunner}
            busy={busy}
            allowSkip
            initialAnswers={pendingRef.current}
            onStepChange={(s, t) => {
              setStep(s);
              setStepTotal(t);
            }}
            footer={
              <>
                {error && (
                  <div
                    role="alert"
                    className="mb-3 flex items-start gap-2 rounded-xl border border-bad-300/60 bg-bad-50 px-3 py-2.5"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bad-700" />
                    <span className="min-w-0 flex-1 text-xs font-semibold text-bad-700 text-pretty">
                      {error} Tap your answer again to retry.
                    </span>
                  </div>
                )}

                {busy && (
                  <div className="flex items-center justify-center gap-2 py-1 text-xs font-semibold text-ink-500">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving your answers
                  </div>
                )}

                <p className="mt-1 text-center text-tiny text-ink-500">
                  {isQuestionStep
                    ? `Question ${step - 2} of ${stepTotal - 3} · no wrong answers here`
                    : "Your answers stay yours. You can change any of this later."}
                </p>
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}
