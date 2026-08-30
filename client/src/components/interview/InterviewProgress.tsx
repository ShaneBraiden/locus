import React from "react";
import { Check, ChevronRight, Lock, MessageSquare, Sparkles } from "lucide-react";
import { CategoryStatus, GatedFeature } from "../../types";
import { Progress, cx } from "../../ui";

// ---------------------------------------------------------------------------
// THE SIX CATEGORIES, MADE VISIBLE.
//
// The schedule spreads the interview across three surfaces, which is good for
// the first session and bad for the second: a student who tapped "Later" on a
// gate has no way back to it, and a student wondering why their ranking looks
// thin has no way to see that two of six sections are still empty.
//
// This panel is that way back. It is the only place in the app where all six
// categories are visible at once, and every incomplete one is a live control:
// a feature category reopens its sheet, a conversational one takes them to
// FAB. Nothing here is a lock — a category is either done, or it is one tap
// from being done.
// ---------------------------------------------------------------------------

interface InterviewProgressProps {
  categories: CategoryStatus[] | null;
  /** Reopens a deferred feature sheet. */
  onOpenFeature: (feature: GatedFeature) => void;
  /** Sends them to the conversation for a chat category. */
  onOpenChat: () => void;
  className?: string;
}

export default function InterviewProgress({
  categories,
  onOpenFeature,
  onOpenChat,
  className,
}: InterviewProgressProps) {
  if (!categories?.length) return null;

  const answered = categories.reduce((sum, c) => sum + c.answered, 0);
  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const done = categories.filter((c) => c.complete).length;
  const allDone = done === categories.length;

  return (
    <div className={cx("rounded-2xl border border-ink-200 bg-white p-3.5", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold tracking-tight text-ink-900">
            What FAB knows about you
          </h3>
          <p className="mt-0.5 text-xs font-medium text-ink-500 text-pretty">
            {allDone
              ? "All six sections are in. Every ranking you see is built on the full picture."
              : "The more of these are in, the sharper your ranking gets. Nothing here takes long."}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div data-numeric className="font-mono text-lg font-bold leading-none text-ink-900">
            {done}
            <span className="text-xs text-ink-500">/{categories.length}</span>
          </div>
          <div className="mt-0.5 text-micro font-bold uppercase tracking-[0.07em] text-ink-500">
            sections
          </div>
        </div>
      </div>

      <Progress
        value={total ? (answered / total) * 100 : 0}
        size="sm"
        tone="moss"
        label="Interview progress"
        className="mb-3"
      />

      <ul className="space-y-1">
        {categories.map((c) => {
          // Onboarding is the one row that is never actionable here. It is
          // answered before the app opens, so if it were somehow incomplete
          // the student would be looking at the onboarding screen, not at this
          // panel — a button would point at a place they cannot get to.
          const actionable = !c.complete && c.surface !== "onboarding";
          const Icon = c.complete
            ? Check
            : c.surface === "chat"
              ? MessageSquare
              : c.surface === "feature"
                ? Sparkles
                : Lock;

          const act = () => {
            if (!actionable) return;
            if (c.surface === "feature" && c.feature) onOpenFeature(c.feature);
            else onOpenChat();
          };

          const body = (
            <>
              <span
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  c.complete
                    ? "bg-good-100 text-good-700"
                    : actionable
                      ? "bg-moss-100 text-moss-700"
                      : "bg-ink-100 text-ink-400",
                )}
              >
                <Icon className="h-3 w-3" strokeWidth={c.complete ? 3 : 2} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cx(
                    "block truncate text-xs font-bold",
                    c.complete ? "text-ink-500" : "text-ink-900",
                  )}
                >
                  {c.title}
                </span>
              </span>

              <span
                data-numeric
                className={cx(
                  "shrink-0 font-mono text-micro font-bold",
                  c.complete ? "text-good-700" : "text-ink-500",
                )}
              >
                {c.answered}/{c.total}
              </span>

              {actionable && (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              )}
            </>
          );

          // A row that does nothing is rendered as a row, not as a disabled
          // button — a button that cannot be pressed is a thing the student has
          // to test before they believe it.
          return (
            <li key={c.id}>
              {actionable ? (
                <button
                  type="button"
                  onClick={act}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors duration-150 hover:bg-moss-50"
                >
                  {body}
                </button>
              ) : (
                <div className="flex w-full items-center gap-2.5 px-2 py-1.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
