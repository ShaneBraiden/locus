import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  CareerDegreeInfo, CareerMatch, CareerTrack, DegreePivot,
  PsychAnswer, PsychScores, TheoryScores,
} from './types.js';

// The LOCUS psychometric layer. Pure arithmetic over two committed datasets —
// no network, no AI, no clock. Given the same answers it returns the same
// numbers forever, which is the whole point: Gemini decides which option a
// student's sentence meant, and nothing else.
//
// Every formula here is lifted verbatim from locus_psychometric_engine.xlsx.
// Do not "improve" them without changing the workbook too.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface PsychOption {
  id: string;
  letter: string;
  label: string;
  scores: TheoryScores;
  theory: string;
  construct: string;
  constructTags: string[];
}

export interface PsychItem {
  id: string;
  text: string;
  options: PsychOption[];
}

interface CareerProfile {
  id: string;
  name: string;
  domain: string;
  profile: TheoryScores;
  degree: CareerDegreeInfo;
}

const THEORIES: (keyof TheoryScores)[] = ['h', 'o', 's', 'm', 'd'];

/** CCFS weights. Sum to 1.00. */
const CCFS_WEIGHTS: TheoryScores = { h: 0.25, o: 0.2, s: 0.25, m: 0.2, d: 0.1 };

/**
 * Fit-score weights. Note these sum to 0.90, not 1.00 — the workbook stores a
 * D (decision-making) profile per career but never differences it. That is the
 * sheet's behaviour and we match it exactly so results stay comparable with it.
 */
const FIT_WEIGHTS: Omit<TheoryScores, 'd'> = { h: 0.25, o: 0.2, s: 0.25, m: 0.2 };

const BEST_FIT_AT = 72;
const CONSIDER_AT = 52;

/** Max score any single option can carry on one theory. */
const MAX_PER_ITEM = 5;

/**
 * Excel's ROUND(x, 1), not JavaScript's.
 *
 * Two behaviours have to be copied or results drift from the workbook by 0.1:
 * Excel collapses a value to 15 significant decimal digits before rounding, and
 * it rounds halves away from zero. Sports Scientist is the case that catches
 * this — 100 - 69.15 lands on 30.849999999999994 in binary, which Excel reads
 * as 30.85 and rounds up to 30.9, while `Math.round(n * 10) / 10` sees the
 * noise and rounds down to 30.8.
 */
function round1(n: number): number {
  if (!Number.isFinite(n)) return n;
  const negative = n < 0;
  const s = Math.abs(n).toPrecision(15); // 0-100 here, so never exponential
  const dot = s.indexOf('.');
  if (dot < 0) return n;

  const frac = s.slice(dot + 1);
  let out = Number(`${s.slice(0, dot)}.${frac.slice(0, 1)}`);
  if (frac.charCodeAt(1) - 48 >= 5) out = Number((out + 0.1).toFixed(1));
  return negative ? -out : out;
}

function findDataFile(name: string): string {
  const candidates = [
    path.resolve(__dirname, `../../docs/${name}`),
    path.resolve(__dirname, `../../../docs/${name}`),
    path.resolve(process.cwd(), `docs/${name}`),
    path.resolve(process.cwd(), `../docs/${name}`),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(`${name} not found. Generate it with: node docs/parse-psychometrics.mjs`);
}

/** How many "open to any degree" careers a student must always be shown. */
const MIN_PIVOTS_SHOWN = 3;

let itemCache: PsychItem[] | null = null;
let optionIndex: Map<string, { item: PsychItem; option: PsychOption }> | null = null;
let careerCache: CareerProfile[] | null = null;
let pivotCache: DegreePivot[] | null = null;

export function items(): PsychItem[] {
  if (itemCache) return itemCache;
  const file = findDataFile('psychometric-items.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  itemCache = data.items as PsychItem[];
  optionIndex = new Map();
  for (const item of itemCache) {
    for (const option of item.options) optionIndex.set(option.id, { item, option });
  }
  console.log(`[psychometrics] loaded ${itemCache.length} items, ${optionIndex.size} options from ${file}`);
  return itemCache;
}

export function careers(): CareerProfile[] {
  if (careerCache) return careerCache;
  const file = findDataFile('career-profiles.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  careerCache = data.careers as CareerProfile[];
  console.log(`[psychometrics] loaded ${careerCache.length} career profiles from ${file}`);
  return careerCache;
}

/**
 * The degree → career pivot map. 48 rows, of which the first 26 are keyed to
 * the topology's degree ids so a student's degree resolves in one lookup.
 */
export function degreePivots(): DegreePivot[] {
  if (pivotCache) return pivotCache;
  const file = findDataFile('degree-pivots.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  pivotCache = data.degrees as DegreePivot[];
  console.log(`[psychometrics] loaded ${pivotCache.length} degree pivot rows from ${file}`);
  return pivotCache;
}

/** Pivot row for a topology degree id, or null if that degree has no row. */
export function pivotForDegree(degreeId: string | null): DegreePivot | null {
  if (!degreeId) return null;
  return degreePivots().find((p) => p.topologyDegreeId === degreeId) ?? null;
}

export function itemById(id: string): PsychItem | undefined {
  items();
  return itemCache!.find((i) => i.id === id);
}

export function optionById(id: string): { item: PsychItem; option: PsychOption } | undefined {
  items();
  return optionIndex!.get(id);
}

/** Total number of psychometric items (does not include the practical ones). */
export function itemCount(): number {
  return items().length;
}

/**
 * Sum → normalise → CCFS → motivation override. Mirrors the workbook's
 * "Student Calculator" sheet.
 *
 * The sheet divides by a hardcoded 125 (25 items x max 5). We divide by
 * `answered * MAX_PER_ITEM` instead so a half-finished conversation still
 * yields meaningful 0-100 scores for the live dashboard. With all 25 answered
 * the two are identical.
 */
export function scoreAnswers(answers: PsychAnswer[]): PsychScores {
  const raw: TheoryScores = { h: 0, o: 0, s: 0, m: 0, d: 0 };
  let answered = 0;

  const seen = new Set<string>();
  for (const a of answers) {
    const hit = optionById(a.optionId);
    // Unknown option ids contribute nothing rather than throwing — a stale or
    // hand-edited client payload should degrade, not crash the chat.
    if (!hit || hit.item.id !== a.itemId || seen.has(a.itemId)) continue;
    seen.add(a.itemId);
    answered++;
    for (const t of THEORIES) raw[t] += hit.option.scores[t];
  }

  const denom = answered * MAX_PER_ITEM;
  const pct: TheoryScores = { h: 0, o: 0, s: 0, m: 0, d: 0 };
  for (const t of THEORIES) pct[t] = denom ? round1((raw[t] / denom) * 100) : 0;

  const ccfs = round1(
    pct.h * CCFS_WEIGHTS.h + pct.o * CCFS_WEIGHTS.o + pct.s * CCFS_WEIGHTS.s +
    pct.m * CCFS_WEIGHTS.m + pct.d * CCFS_WEIGHTS.d,
  );

  // Motivation-quality override: extrinsic drive predicts drop-off, so the
  // composite is discounted rather than the student being quietly ranked high.
  const sdtFlag = answered > 0 && pct.s < 50;
  const adjustedCcfs = sdtFlag ? round1(ccfs * 0.85) : ccfs;

  return {
    raw, pct, ccfs, adjustedCcfs,
    sdtFlag,
    sdtWarning: answered > 0 && pct.s < 35,
    answered,
    total: items().length,
  };
}

/**
 * Absolute per-theory delta against each career's success profile, weighted.
 * Returns all 252 sorted best-first; callers slice what they need.
 */
export function matchCareers(scores: PsychScores): CareerMatch[] {
  const { pct } = scores;
  return careers()
    .map((c) => {
      const delta =
        Math.abs(pct.h - c.profile.h) * FIT_WEIGHTS.h +
        Math.abs(pct.o - c.profile.o) * FIT_WEIGHTS.o +
        Math.abs(pct.s - c.profile.s) * FIT_WEIGHTS.s +
        Math.abs(pct.m - c.profile.m) * FIT_WEIGHTS.m;
      const fitScore = round1(Math.max(0, 100 - delta));
      return {
        careerId: c.id,
        name: c.name,
        domain: c.domain,
        fitScore,
        status:
          fitScore >= BEST_FIT_AT ? 'best_fit'
            : fitScore >= CONSIDER_AT ? 'consider'
              : 'mismatch',
        degree: c.degree,
      } as Omit<CareerMatch, 'rank'>;
    })
    // Name as the tiebreak keeps ordering stable when fit scores collide.
    .sort((a, b) => b.fitScore - a.fitScore || a.name.localeCompare(b.name))
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

// ---------------------------------------------------------------- degree track

/**
 * Career names have to be compared across two hand-maintained sources: the
 * workbook's career list ("Medical Coder / Health Information Manager") and the
 * pivot map's prose lists ("Medical Coder (CPC)"). Normalising drops the
 * parenthetical, everything after a slash, and all punctuation, which makes
 * those two collapse onto "medical coder".
 */
function normName(s: string): string {
  return s
    .replace(/\([^)]*\)/g, ' ')
    .split(/[/·]/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Substring match in either direction, with a floor so "it" cannot match "fit". */
function namesOverlap(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 5 && long.includes(short);
}

/**
 * Search keys for a degree: the whole name, plus any parenthesised
 * abbreviation. "B.Sc. Medical Laboratory Technology (BMLT)" yields
 * ["b sc medical laboratory technology", "bmlt"], which is what lets us spot
 * the degree inside a career's free-text `typical` and `pivotFrom` columns.
 *
 * Keys shorter than 6 characters are dropped: "b sc" and "ba" appear in half
 * the table and would make everything look aligned.
 */
function degreeKeys(pivot: DegreePivot): string[] {
  const keys: string[] = [];
  for (const m of pivot.degreeName.matchAll(/\(([^)]*)\)/g)) keys.push(normName(m[1]));
  keys.push(normName(pivot.degreeName.replace(/\([^)]*\)/g, ' ')));
  return keys.filter((k) => k.length >= 6);
}

/**
 * True when a career's own degree columns name the student's degree — which
 * means the student already holds the qualification the career expects.
 *
 * This is what stops a B.Sc Nursing student being told that Nursing Professional
 * "would need a different degree": the career is gated on B.Sc Nursing, and
 * B.Sc Nursing is exactly what they have.
 */
function degreeIsNamed(career: Pick<CareerMatch, 'degree'>, pivot: DegreePivot): boolean {
  const haystack = `${normName(career.degree.typical)} ${normName(career.degree.pivotFrom)}`;
  return degreeKeys(pivot).some((k) => haystack.includes(k));
}

/**
 * Where a career sits relative to the degree this student actually holds, and
 * how we know.
 *
 * `mapped` means the answer came from researched, degree-specific data — the
 * pivot row naming the career, or the career naming the degree. `inferred`
 * means we fell back to the career's own gate column, which is true in general
 * but was never checked against this particular degree. Callers rank mapped
 * ahead of inferred so the confident answers are the ones a student sees.
 */
function classify(
  career: Pick<CareerMatch, 'name' | 'degree'>,
  pivot: DegreePivot | null,
): { track: CareerTrack; mapped: boolean } {
  const name = normName(career.name);

  if (pivot) {
    if (pivot.direct.some((d) => namesOverlap(name, normName(d)))) {
      return { track: 'aligned', mapped: true };
    }
    // The degree the career expects is the degree they hold. Checked before the
    // adjacent/full lists so holding the qualification always reads as aligned.
    if (degreeIsNamed(career, pivot)) return { track: 'aligned', mapped: true };

    if (pivot.adjacent.some((d) => namesOverlap(name, normName(d)))) {
      return { track: 'bridge', mapped: true };
    }
    if (pivot.fullPivots.some((d) => namesOverlap(name, normName(d)))) {
      // A row can only list a locked career as a "full pivot" by mistake; the
      // gate column wins there so we never promise an unreachable path.
      return career.degree.gate === 'locked'
        ? { track: 'locked', mapped: true }
        : { track: 'pivot', mapped: true };
    }
  }

  switch (career.degree.gate) {
    case 'open': return { track: 'pivot', mapped: false };
    case 'bridge': return { track: 'bridge', mapped: false };
    default: return { track: 'locked', mapped: false };
  }
}

/** The track alone. See `classify` for how it is decided. */
export function classifyTrack(
  career: Pick<CareerMatch, 'name' | 'degree'>,
  pivot: DegreePivot | null,
): CareerTrack {
  return classify(career, pivot).track;
}

/**
 * Split ranked matches into the four tracks the UI renders.
 *
 * `limit` caps each track so the client is not handed 250 rows, with one
 * exception: the pivot track is topped up to MIN_PIVOTS_SHOWN from the full
 * ranking even when those careers scored below the display threshold. A student
 * whose strongest matches are all locked behind a degree they do not have must
 * still leave with somewhere to go.
 */
export function splitByTrack(
  all: CareerMatch[],
  pivot: DegreePivot | null,
  limit = 6,
): { aligned: CareerMatch[]; bridge: CareerMatch[]; pivot: CareerMatch[]; locked: CareerMatch[] } {
  const tracked = all.map((m) => {
    const { track, mapped } = classify(m, pivot);
    return { ...m, track, mapped };
  });

  // Researched answers first, then fit score. Without this a lab-science student
  // is told Commercial Pilot is "one bridge away" — true of the career in the
  // abstract, but it outranks the clinical-research route that was actually
  // checked against their degree.
  const of = (t: CareerTrack) => tracked
    .filter((m) => m.track === t)
    .sort((a, b) => Number(b.mapped) - Number(a.mapped) || b.fitScore - a.fitScore)
    .map(({ mapped: _mapped, ...m }) => m);

  const shown = (t: CareerTrack) =>
    of(t).filter((m) => m.status !== 'mismatch').slice(0, limit);

  const pivots = shown('pivot');
  if (pivots.length < MIN_PIVOTS_SHOWN) {
    const already = new Set(pivots.map((m) => m.careerId));
    for (const m of of('pivot')) {
      if (pivots.length >= MIN_PIVOTS_SHOWN) break;
      if (!already.has(m.careerId)) pivots.push(m);
    }
  }

  return {
    aligned: shown('aligned'),
    bridge: shown('bridge'),
    pivot: pivots,
    // Locked careers are only worth showing if the student actually scored well
    // on them — that is the whole point of surfacing the gate at all.
    locked: of('locked').filter((m) => m.status === 'best_fit').slice(0, limit),
  };
}

/** The workbook's UI copy for a student running on external motivation. */
export function motivationNote(scores: PsychScores): string | null {
  if (scores.sdtWarning) {
    return 'Your motivation appears external — worth exploring why before you commit to a path.';
  }
  if (scores.sdtFlag) {
    return 'A lot of your drive is coming from outside you right now, so treat these matches as a starting point rather than a verdict.';
  }
  return null;
}

/**
 * The dominant Holland letter, used for the reflection moment.
 * Ties break in RIASEC order, which is deterministic.
 */
export function dominantConstructs(answers: PsychAnswer[]): {
  holland: string | null;
  tags: string[];
} {
  const counts = new Map<string, number>();
  for (const a of answers) {
    const hit = optionById(a.optionId);
    if (!hit || hit.item.id !== a.itemId) continue;
    for (const tag of hit.option.constructTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);

  const order = ['holland:R', 'holland:I', 'holland:A', 'holland:S', 'holland:E', 'holland:C'];
  let holland: string | null = null;
  let best = 0;
  for (const key of order) {
    const n = counts.get(key) ?? 0;
    if (n > best) { best = n; holland = key; }
  }
  return { holland, tags };
}
