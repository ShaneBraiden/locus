import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  CareerMatch, PsychAnswer, PsychScores, TheoryScores,
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

let itemCache: PsychItem[] | null = null;
let optionIndex: Map<string, { item: PsychItem; option: PsychOption }> | null = null;
let careerCache: CareerProfile[] | null = null;

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
 * Returns all 127 sorted best-first; callers slice what they need.
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
      } as Omit<CareerMatch, 'rank'>;
    })
    // Name as the tiebreak keeps ordering stable when fit scores collide.
    .sort((a, b) => b.fitScore - a.fitScore || a.name.localeCompare(b.name))
    .map((c, i) => ({ ...c, rank: i + 1 }));
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
