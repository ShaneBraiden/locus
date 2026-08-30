import {
  AssessmentState,
  CategoryId,
  CategoryStatus,
  GatedFeature,
  InterviewCategory,
  InterviewSchedule,
  PracticalConstraints,
  ProfileSignals,
  PsychReadout,
  CareerPath,
  ChatProgress,
  UserMemory,
} from "../types";
import { authHeaders, readLocal, writeLocal } from "./stateSync";

// ---------------------------------------------------------------------------
// THE SIX-CATEGORY INTERVIEW, CLIENT SIDE.
//
// The 28-item bank is delivered across three surfaces rather than as one form:
//
//   1. Onboarding, at first login — the personal category ("About you"): name,
//      degree, year, and the four items about money, timing, geography and
//      where they are in the decision.
//   2. Feature gates — "What pulls you" the first time they open Career Paths,
//      "How you work" the first time they open the lab.
//   3. FAB chat — the remaining three categories, in conversation.
//
// Surfaces 1 and 2 are plain multiple choice and go through
// POST /api/interview/answers, which never calls Gemini. Surface 3 is the
// existing chat turn. Both write into the same AssessmentState, so scoring
// cannot tell them apart — which is the property that lets the schedule move
// questions between surfaces without changing anybody's result.
// ---------------------------------------------------------------------------

/** What a batch of tapped answers gets back. Mirrors the server's FlowResponse. */
export interface BatchResult {
  assessment: AssessmentState;
  progress?: ChatProgress;
  categories?: CategoryStatus[];
  updatedSignals?: ProfileSignals;
  updatedConstraints?: PracticalConstraints;
  bestFitPaths?: CareerPath[];
  psychometrics?: PsychReadout;
  degreeName?: string;
  memory?: UserMemory;
}

export interface BatchSubmission {
  categoryId?: CategoryId;
  name?: string;
  degreeId?: string;
  year?: string;
  answers: { itemId: string; optionId: string }[];
}

/**
 * The whole schedule — six categories with their questions, the 26 degrees and
 * the year options — in one request. Cached for the tab session because it is
 * static reference data: the item bank only changes when the workbook is
 * re-parsed and the server restarts.
 */
let schedulePromise: Promise<InterviewSchedule | null> | null = null;

export function fetchSchedule(token: string | null): Promise<InterviewSchedule | null> {
  if (schedulePromise) return schedulePromise;
  schedulePromise = (async () => {
    try {
      const res = await fetch("/api/interview/categories", { headers: authHeaders(token) });
      if (!res.ok) {
        console.warn(`GET /api/interview/categories failed: HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as InterviewSchedule;
      if (!Array.isArray(data?.categories)) return null;
      return data;
    } catch (err) {
      console.warn("Could not load the interview schedule:", err);
      return null;
    }
  })();
  // A failed fetch must not be cached forever, or a student who was offline for
  // one second never gets onboarded at all.
  schedulePromise.then((v) => {
    if (!v) schedulePromise = null;
  });
  return schedulePromise;
}

/** Drops the cached schedule. Used on sign-out so the next account refetches. */
export function resetScheduleCache(): void {
  schedulePromise = null;
}

/**
 * Posts one batch of tapped answers and returns the updated flow state.
 *
 * Throws on failure rather than swallowing it: the caller is a modal the
 * student is actively looking at, and silently discarding their taps is the
 * one outcome worse than an error message.
 */
export async function submitBatch(
  token: string | null,
  assessment: AssessmentState | null,
  batch: BatchSubmission,
): Promise<BatchResult> {
  const res = await fetch("/api/interview/answers", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ assessment, ...batch }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `Could not save those answers (HTTP ${res.status}).`);
  }
  return (await res.json()) as BatchResult;
}

// ------------------------------------------------------------------ derived

/**
 * Per-category completion, computed locally from the schedule and the
 * assessment.
 *
 * The server returns the same thing on every turn and every batch, and the two
 * agree because they are the same arithmetic over the same item ids. It is
 * computed here anyway because gating is a render-time decision: deriving it
 * makes it impossible for the modal state and the answer state to disagree,
 * which is exactly the bug a second copy in `useState` would eventually cause.
 * Returns null until the schedule has loaded — see `needsOnboarding` for why
 * that is deliberately not the same as "nothing is answered yet".
 */
export function computeCategoryStatus(
  schedule: InterviewSchedule | null,
  assessment: AssessmentState | null,
): CategoryStatus[] | null {
  if (!schedule) return null;

  const covered = new Set([
    ...(assessment?.answers ?? []).map((a) => a.itemId),
    ...(assessment?.skipped ?? []),
  ]);

  return [...schedule.categories]
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const answered = c.items.filter((i) => covered.has(i.id)).length;
      return {
        id: c.id,
        order: c.order,
        title: c.title,
        blurb: c.blurb,
        surface: c.surface,
        feature: c.feature,
        answered,
        total: c.items.length,
        complete: answered >= c.items.length,
      };
    });
}

/**
 * The assessment a NEW CONVERSATION should start from.
 *
 * "New conversation" restarts the conversation, not the student. Their name,
 * degree, year and every answer they gave by tapping — onboarding and the two
 * feature gates — are account-level facts, and re-collecting them would mean
 * putting the onboarding modal back in front of somebody who just wanted a
 * fresh chat. What resets is the conversational half: the chat categories'
 * answers, the follow-up counters, and the reflection and recommendation
 * flags, all of which belong to one conversation and nothing else.
 *
 * "Start fresh" is the real reset and still wipes everything, memory included.
 */
export function seedAssessment(
  assessment: AssessmentState | null,
  schedule: InterviewSchedule | null,
): AssessmentState | null {
  if (!assessment) return null;

  const keep = new Set(
    (schedule?.categories ?? [])
      .filter((c) => c.surface !== "chat")
      .flatMap((c) => c.items.map((i) => i.id)),
  );

  // With no schedule we cannot tell a tapped answer from a conversational one,
  // so the profile is carried and the answers are not — losing a few answers
  // is recoverable, re-asking somebody their name is not.
  return {
    ...assessment,
    answers: schedule ? assessment.answers.filter((a) => keep.has(a.itemId)) : [],
    followUps: {},
    skipped: [],
    targetItemId: null,
    fallbackItemId: null,
    reflectionShown: false,
    reflectionAnswered: false,
    recommendationShown: false,
  };
}

// ------------------------------------------------------------------ selectors

export const categoryFor = (
  schedule: InterviewSchedule | null,
  id: CategoryId,
): InterviewCategory | undefined => schedule?.categories.find((c) => c.id === id);

export const onboardingCategory = (
  schedule: InterviewSchedule | null,
): InterviewCategory | undefined =>
  schedule?.categories.find((c) => c.surface === "onboarding");

export const featureCategory = (
  schedule: InterviewSchedule | null,
  feature: GatedFeature,
): InterviewCategory | undefined =>
  schedule?.categories.find((c) => c.surface === "feature" && c.feature === feature);

export const statusFor = (
  categories: CategoryStatus[] | null,
  id: CategoryId,
): CategoryStatus | undefined => categories?.find((c) => c.id === id);

/**
 * Which tab a feature category guards. The server speaks in features and the
 * app navigates in tabs, and this is the one place the two are joined.
 */
export const FEATURE_TABS: Record<GatedFeature, "paths" | "experiments"> = {
  paths: "paths",
  lab: "experiments",
};

export const featureForTab = (tab: string): GatedFeature | null =>
  tab === "paths" ? "paths" : tab === "experiments" ? "lab" : null;

// --------------------------------------------------------------- local flags

/**
 * Onboarding and the two gates are answered once per account, but "have they
 * answered" is a property of the assessment, not of this device — so it is
 * read from the server's category status rather than from a local flag.
 *
 * The only thing kept locally is a DISMISSAL: a student who tapped "Later" on
 * a feature gate should not be shown it again on their next click. That is a
 * device-local preference in the same sense the voice settings are, and it
 * deliberately does not sync — being nagged once on a new device is a far
 * smaller cost than a lost dismissal locking a category out permanently.
 */
const DEFERRED_KEY = "northr_interview_deferred";

export function readDeferrals(): CategoryId[] {
  const raw = readLocal<unknown>(DEFERRED_KEY, []);
  return Array.isArray(raw) ? raw.filter((v): v is CategoryId => typeof v === "string") : [];
}

export function writeDeferrals(ids: CategoryId[]): CategoryId[] {
  const next = Array.from(new Set(ids));
  writeLocal(DEFERRED_KEY, next);
  return next;
}

export function deferCategory(id: CategoryId): CategoryId[] {
  return writeDeferrals([...readDeferrals(), id]);
}

/** Undoes one dismissal — the dashboard reopening a gate the student skipped. */
export function undeferCategory(id: CategoryId): CategoryId[] {
  return writeDeferrals(readDeferrals().filter((c) => c !== id));
}

export function clearDeferrals(): void {
  writeDeferrals([]);
}

/**
 * True when the student still owes us the personal category.
 *
 * Deliberately strict about name and degree and lenient about the rest: those
 * two are what every downstream ranking is keyed on, so the app cannot do its
 * job without them, whereas an unanswered constraint item just means FAB picks
 * it up in conversation later. `categories` being null means the server has
 * not answered yet — in which case nothing is shown, because flashing an
 * onboarding screen at a returning student is worse than a moment of nothing.
 */
export function needsOnboarding(
  assessment: AssessmentState | null,
  categories: CategoryStatus[] | null,
): boolean {
  if (!categories) return false;
  if (!assessment?.name || !assessment?.degreeId) return true;
  const basics = statusFor(categories, "basics");
  return basics ? !basics.complete : false;
}

/**
 * Whether opening `feature` should raise its question sheet first.
 *
 * Three things have to line up: the category exists and is unfinished, the
 * student has not deferred it on this device, and we actually know who they
 * are — a gate shown before onboarding finished would be the second modal on
 * a student's first thirty seconds in the app.
 */
export function shouldGate(
  feature: GatedFeature,
  assessment: AssessmentState | null,
  categories: CategoryStatus[] | null,
  deferrals: CategoryId[],
): CategoryStatus | null {
  if (!categories || !assessment?.name || !assessment?.degreeId) return null;
  const status = categories.find((c) => c.surface === "feature" && c.feature === feature);
  if (!status || status.complete) return null;
  if (deferrals.includes(status.id)) return null;
  return status;
}
