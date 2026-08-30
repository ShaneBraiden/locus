import { interviewItemById, interviewItems, type InterviewItem } from './bridge.js';
import type { CategoryId, InterviewSurface, PsychAnswer } from './types.js';

// THE SIX CATEGORIES.
//
// The instrument is 28 items long. Asked end to end in one sitting it is a
// twenty-minute form, and a twenty-minute form put in front of a student
// before the app has shown them anything is the most reliable way there is to
// lose them on their first session. So the bank is cut into six themed
// categories, and each category is delivered on the surface where its
// questions are least intrusive and most obviously relevant:
//
//   onboarding  The personal ones. Name, degree, year, money, timeline,
//               geography, and where they actually are in the decision. Asked
//               once, at first login, as plain multiple choice. NO GEMINI:
//               these are the questions a student expects a sign-up flow to
//               ask, they are answered by tapping, and routing them through a
//               language model would add latency and a failure mode to the
//               one screen that must never stall.
//   feature     Two categories held back until the student opens the feature
//               that needs them. Opening Career Paths asks what pulls them;
//               opening the Experiments lab asks how they work. Also plain
//               multiple choice — a modal is not a conversation.
//   chat        The remaining three, and the ones actually worth a
//               conversation: how they think, what drives them, how they
//               decide. FAB asks these in its own words, one at a time.
//
// Nothing here scores anything. A category is a delivery schedule over item
// ids that already exist in the committed bank; the arithmetic in
// psychometrics.ts is untouched, and identical answers still produce identical
// output no matter which surface collected them.

export interface CategoryDef {
  id: CategoryId;
  /** The order the student meets them in. */
  order: number;
  title: string;
  /** One line, shown to the student above the questions. */
  blurb: string;
  surface: InterviewSurface;
  /**
   * Which feature unlocks a `feature` category. The client maps this onto a
   * tab; the server only needs it to be a stable string.
   */
  feature?: 'paths' | 'lab';
  /** Item ids from the committed bank, in the order they should be asked. */
  itemIds: string[];
  /** Collected alongside the items on this surface. Profile, not score. */
  profileFields?: ('name' | 'degree' | 'year')[];
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'basics',
    order: 1,
    title: 'About you',
    blurb: 'The practical stuff first — who you are, and what your situation actually allows.',
    surface: 'onboarding',
    profileFields: ['name', 'degree', 'year'],
    // p7 is "when someone asks what you want to do after graduation" — the
    // most personal question in the bank, and the one that says how much of
    // the rest to take at face value. x1/x2/x3 are money, timeline and
    // geography: constraints rather than traits, and the topology engine
    // cannot rank anything honestly without them.
    itemIds: ['p7', 'x1', 'x2', 'x3'],
  },
  {
    id: 'interests',
    order: 2,
    title: 'What pulls you',
    blurb: 'Six quick ones about the work you drift toward when nobody is grading you.',
    surface: 'feature',
    feature: 'paths',
    // Holland RIASEC — the strongest environment-fit signal in the instrument
    // and the one that most directly decides which paths rank. Asked at the
    // door of Career Paths because that is the screen it pays for.
    itemIds: ['p1', 'p5', 'p11', 'p18', 'p20', 'p24'],
  },
  {
    id: 'workstyle',
    order: 3,
    title: 'How you work',
    blurb: 'Pressure, structure, and other people. Six taps.',
    surface: 'feature',
    feature: 'lab',
    // Big Five. These decide which experiments the lab should be handing out,
    // so the lab is where they get asked.
    itemIds: ['p2', 'p6', 'p9', 'p12', 'p16', 'p21'],
  },
  {
    id: 'thinking',
    order: 4,
    title: 'How you think',
    blurb: 'The way your head actually works on a problem.',
    surface: 'chat',
    itemIds: ['p4', 'p8', 'p13', 'p23'],
  },
  {
    id: 'drive',
    order: 5,
    title: 'What drives you',
    blurb: 'The honest reasons underneath the ambition.',
    surface: 'chat',
    itemIds: ['p3', 'p10', 'p17', 'p22', 'p25'],
  },
  {
    id: 'deciding',
    order: 6,
    title: 'How you decide',
    blurb: 'What you do when a real decision is actually in front of you.',
    surface: 'chat',
    itemIds: ['p14', 'p19', 'p15'],
  },
];

/** Years of study offered at onboarding. Stored verbatim, never scored. */
export const STUDY_YEARS = [
  { id: '1', label: '1st year' },
  { id: '2', label: '2nd year' },
  { id: '3', label: '3rd year' },
  { id: '4', label: '4th year' },
  { id: 'final', label: 'Final year, about to graduate' },
  { id: 'graduated', label: 'Already graduated' },
] as const;

export const isStudyYear = (v: unknown): v is string =>
  typeof v === 'string' && STUDY_YEARS.some((y) => y.id === v);

export const studyYearLabel = (id: string | null): string | null =>
  STUDY_YEARS.find((y) => y.id === id)?.label ?? null;

// ---------------------------------------------------------------- lookups

let indexCache: Map<string, CategoryDef> | null = null;

function index(): Map<string, CategoryDef> {
  if (indexCache) return indexCache;
  indexCache = new Map();
  for (const c of CATEGORIES) for (const id of c.itemIds) indexCache.set(id, c);
  return indexCache;
}

export function categoryOf(itemId: string): CategoryDef | undefined {
  return index().get(itemId);
}

export function categoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * Every item, in the order the categories want them asked.
 *
 * A COVERAGE CHECK RUNS ON FIRST CALL, and it is the reason this is a function
 * rather than a constant. The category table is hand-maintained while the item
 * bank is generated from a spreadsheet, and the failure mode of the two
 * drifting apart is an item that can never be asked on any surface — which
 * presents as a conversation that will not end rather than as an error.
 * So anything the table forgot is appended to the last chat category instead
 * of vanishing, and anything it invented is dropped with a warning.
 */
let orderedCache: InterviewItem[] | null = null;

export function orderedItems(): InterviewItem[] {
  if (orderedCache) return orderedCache;

  const out: InterviewItem[] = [];
  const placed = new Set<string>();

  for (const c of [...CATEGORIES].sort((a, b) => a.order - b.order)) {
    for (const id of c.itemIds) {
      const item = interviewItemById(id);
      if (!item) {
        console.warn(`[categories] "${c.id}" lists unknown item "${id}" — ignoring it`);
        continue;
      }
      if (placed.has(id)) {
        console.warn(`[categories] item "${id}" is listed twice — keeping the first`);
        continue;
      }
      placed.add(id);
      out.push(item);
    }
  }

  const orphans = interviewItems().filter((i) => !placed.has(i.id));
  if (orphans.length) {
    console.warn(
      `[categories] ${orphans.length} item(s) belong to no category (${orphans
        .map((i) => i.id)
        .join(', ')}) — appending them to the conversation so they can still be asked`,
    );
    const last = CATEGORIES[CATEGORIES.length - 1];
    for (const o of orphans) {
      last.itemIds.push(o.id);
      indexCache?.set(o.id, last);
      out.push(o);
    }
  }

  orderedCache = out;
  return out;
}

/**
 * The order FAB works through whatever is still open.
 *
 * Chat categories first, then the feature ones, then onboarding. That ordering
 * is what stops the schedule from being able to dead-end: a student who never
 * opens Career Paths and never opens the lab still reaches a recommendation,
 * because once the three conversational categories run dry FAB simply carries
 * on with the items the modals would have covered. The modals are a shortcut
 * through the interview, never a gate on it.
 */
const SURFACE_RANK: Record<InterviewSurface, number> = { chat: 0, feature: 1, onboarding: 2 };

export function chatOrder(open: InterviewItem[]): InterviewItem[] {
  const rank = (item: InterviewItem) => {
    const c = categoryOf(item.id);
    return c ? SURFACE_RANK[c.surface] * 100 + c.order : 999;
  };
  // Stable within a rank, because `open` already arrives in category order.
  return [...open].sort((a, b) => rank(a) - rank(b));
}

// ---------------------------------------------------------------- progress

export interface CategoryStatus {
  id: CategoryId;
  order: number;
  title: string;
  blurb: string;
  surface: InterviewSurface;
  feature?: 'paths' | 'lab';
  answered: number;
  total: number;
  /** True once every item in the category is answered or given up on. */
  complete: boolean;
}

/**
 * Per-category completion, computed from the validated assessment only.
 * `skipped` counts as covered for the same reason it does in flow.ts: an item
 * we have decided to stop chasing must not hold a category open forever.
 */
export function categoryStatus(
  answers: PsychAnswer[],
  skipped: string[] = [],
): CategoryStatus[] {
  orderedItems(); // resolve orphans before counting
  const covered = new Set([...answers.map((a) => a.itemId), ...skipped]);

  return [...CATEGORIES]
    .sort((a, b) => a.order - b.order)
    .map((c) => {
      const answered = c.itemIds.filter((id) => covered.has(id)).length;
      return {
        id: c.id,
        order: c.order,
        title: c.title,
        blurb: c.blurb,
        surface: c.surface,
        feature: c.feature,
        answered,
        total: c.itemIds.length,
        complete: answered >= c.itemIds.length,
      };
    });
}
