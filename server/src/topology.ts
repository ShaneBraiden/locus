import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Degree, SectionKey, TopologyItem } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SECTION_KEYS: SectionKey[] = [
  'pgPathways', 'frontlineJobs', 'industryRoles', 'government', 'civilServices',
  'globalPathways', 'certifications', 'entrepreneurship', 'research', 'emerging',
];

interface RawItem {
  name: string;
  destination_nodes?: string[];
  frontline_titles?: string[];
  description?: string;
  mandatory?: boolean;
}

interface RawDegree {
  id: string;
  name: string;
  shortName?: string;
  aliases?: string[];
  regulatoryFramework?: { body: string; mandatory: boolean }[];
  regulatoryFrameworkText?: string;
  categories: Record<string, RawItem[]>;
}

function findDataFile(): string {
  const candidates = [
    path.resolve(__dirname, '../../docs/career-topology.json'),
    path.resolve(__dirname, '../../../docs/career-topology.json'),
    path.resolve(process.cwd(), 'docs/career-topology.json'),
    path.resolve(process.cwd(), '../docs/career-topology.json'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(
    'career-topology.json not found. Generate it with: node docs/parse-topology.mjs',
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function stripAnnotation(s: string): string {
  // "Med-Surg Ward Supervisor: Daily ward operations, staffing" -> keep title part
  const i = s.indexOf(':');
  return i > 0 && i < 60 ? s.slice(0, i).trim() : s.trim();
}

function flattenDegree(raw: RawDegree): Degree {
  const items: TopologyItem[] = [];
  const seen = new Set<string>();

  const push = (name: string, section: SectionKey, blobParts: string[], mandatory?: boolean) => {
    const clean = stripAnnotation(name);
    if (!clean) return;
    const id = `${raw.id}__${section}__${slug(clean)}`;
    if (seen.has(id)) return;
    seen.add(id);
    items.push({
      id,
      name: clean + (mandatory ? ' (mandatory license)' : ''),
      section,
      blob: [name, ...blobParts].join(' | ').toLowerCase(),
    });
  };

  for (const section of SECTION_KEYS) {
    const arr = raw.categories?.[section] ?? [];
    for (const it of arr) {
      const nodes = it.destination_nodes ?? [];
      const titles = it.frontline_titles ?? [];
      const desc = it.description ?? '';
      // The item itself (a PG program, a job, a certification, a venture...)
      push(it.name, section, [...nodes, ...titles, desc], it.mandatory);
      // Each frontline title is a career destination in its own right —
      // "Organ Transplant Coordinator" should be predictable, not just "M.Sc. Med-Surg".
      for (const t of titles) push(t, section, [it.name, ...nodes, desc]);
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    aliases: [raw.shortName, ...(raw.aliases ?? [])].filter(Boolean) as string[],
    regulatoryFramework:
      raw.regulatoryFrameworkText ||
      (raw.regulatoryFramework ?? []).map((r) => r.body).join(', '),
    items,
  };
}

let cache: Degree[] | null = null;

export function loadDegrees(): Degree[] {
  if (cache) return cache;
  const file = findDataFile();
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  cache = (data.degrees as RawDegree[]).map(flattenDegree);
  console.log(`[topology] loaded ${cache.length} degrees, ${cache.reduce((n, d) => n + d.items.length, 0)} career items from ${file}`);
  return cache;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Separator-free key: "b.sc nursing", "B.Sc.Nursing" and "bsc nursing" all collapse to one string. */
const squash = (s: string) => norm(s).replace(/ /g, '');

/** Words a student wraps an answer in. Dropped before matching. */
const FILLER = new Set([
  'i', 'im', 'am', 'my', 'me', 'a', 'an', 'the', 'is', 'was', 'are',
  'doing', 'do', 'study', 'studying', 'studied', 'pursuing', 'pursue',
  'currently', 'now', 'presently', 'course', 'degree', 'student', 'college',
  'year', 'first', 'second', 'third', 'fourth', 'final', '1st', '2nd', '3rd', '4th',
  'in', 'at', 'of', 'and', 'for', 'to', 'it', 'its',
]);

/** Qualification prefixes — they say the level, not the subject. */
const PREFIX = new Set(['b', 'sc', 'bsc', 'tech', 'btech', 'bachelor', 'of', 'and', 'in']);

/** Shared across half the catalogue, so never enough to identify a degree alone. */
const GENERIC = new Set([
  'technology', 'science', 'sciences', 'medical', 'medicine', 'therapy', 'care', 'bachelor',
]);

const surfaceForms = (d: Degree) => [d.name, ...d.aliases].map((f) => f.trim()).filter(Boolean);

/** "Bachelor of Physiotherapy (BPT)" -> "physiotherapy". Drops prefixes and parentheticals. */
function subjects(d: Degree): string[] {
  return surfaceForms(d)
    .map((f) => norm(f.replace(/\([^)]*\)/g, ' ')).split(' ').filter((t) => t && !PREFIX.has(t)).join(' '))
    .filter(Boolean);
}

/** Equal, or one is a prefix of the other — "lab" matches "laboratory". */
const tokenish = (a: string, b: string) =>
  a === b || (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a)));

/**
 * Resolves whatever the student said into one of the 26 degrees.
 *
 * Students do not answer with a catalogue name. They say "bsc nursing", "I'm
 * in my 3rd year of b.pharm", or just "nursing", and every one of those has to
 * land without making them hunt through a 26-item list. Returns undefined only
 * when the answer is genuinely ambiguous ("biotechnology" is two different
 * degrees here) — then asking is the right move, not guessing.
 */
export function findDegree(input: string): Degree | undefined {
  const degrees = loadDegrees();
  const q = norm(input);
  if (!q) return undefined;
  const qs = squash(q);
  const meaningful = q.split(' ').filter((t) => t && !FILLER.has(t));

  // 1. The id, or a full name/alias on its own.
  for (const d of degrees) {
    if (d.id === slug(input)) return d;
    if (surfaceForms(d).some((f) => squash(f) === qs)) return d;
  }

  // 2. A full name/alias sitting anywhere inside the answer, matched with all
  //    separators stripped. This is what makes "bsc nursing" and "I'm studying
  //    B.Sc. Nursing" behave identically. Longest form wins, so "b.tech
  //    biotechnology" beats the shorter "biotechnology" reading.
  let best: { d: Degree; len: number } | null = null;
  for (const d of degrees) {
    for (const f of surfaceForms(d)) {
      const key = squash(f);
      if (key.length >= 5 && qs.includes(key) && (!best || key.length > best.len)) {
        best = { d, len: key.length };
      }
    }
  }
  if (best) return best.d;

  // 3. Subject match — "nursing", "medical lab technology", "cardiac care".
  //    Requires a distinctive (non-generic) word, so a bare "technology" or
  //    "therapy" falls through to the picker instead of guessing.
  const hits: { d: Degree; score: number }[] = [];
  for (const d of degrees) {
    for (const s of subjects(d)) {
      const sTokens = s.split(' ').filter(Boolean);
      const covered = sTokens.filter((t) => meaningful.some((m) => tokenish(m, t))).length;
      if (!covered) continue;
      const distinctive = meaningful.some(
        (m) => !GENERIC.has(m) && sTokens.some((t) => tokenish(m, t) && !GENERIC.has(t)),
      );
      if (!distinctive) continue;
      const back = meaningful.filter((m) => sTokens.some((t) => tokenish(m, t))).length;
      // The whole subject is present, or the answer is a subset of it.
      if (covered === sTokens.length || (back === meaningful.length && meaningful.length > 0)) {
        hits.push({ d, score: covered * 10 + back });
      }
    }
  }
  if (hits.length) {
    const top = Math.max(...hits.map((h) => h.score));
    const winners = [...new Set(hits.filter((h) => h.score === top).map((h) => h.d))];
    if (winners.length === 1) return winners[0];
  }
  return undefined;
}

export function degreeNames(): string[] {
  return loadDegrees().map((d) => d.name);
}
