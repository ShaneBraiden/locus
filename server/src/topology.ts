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

export function findDegree(input: string): Degree | undefined {
  const degrees = loadDegrees();
  const q = norm(input);
  if (!q) return undefined;
  // Exact on id / name / alias first
  for (const d of degrees) {
    if (d.id === slug(input) || norm(d.name) === q) return d;
    if (d.aliases.some((a) => norm(a) === q)) return d;
  }
  // Then containment either way (user typed "nursing" or "b.sc nursing student")
  for (const d of degrees) {
    const names = [d.name, ...d.aliases].map(norm);
    if (names.some((n) => n.includes(q) || q.includes(n))) return d;
  }
  // Last resort: token overlap (>= 2 shared tokens, ignoring degree prefixes)
  const stop = new Set(['b', 'sc', 'tech', 'bachelor', 'of', 'and']);
  const qTokens = q.split(' ').filter((t) => t && !stop.has(t));
  let best: { d: Degree; hits: number } | null = null;
  for (const d of degrees) {
    const tokens = new Set(norm(`${d.name} ${d.aliases.join(' ')}`).split(' '));
    const hits = qTokens.filter((t) => tokens.has(t)).length;
    if (hits >= 2 && (!best || hits > best.hits)) best = { d, hits };
  }
  return best?.d;
}

export function degreeNames(): string[] {
  return loadDegrees().map((d) => d.name);
}
