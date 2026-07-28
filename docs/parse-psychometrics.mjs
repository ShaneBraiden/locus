#!/usr/bin/env node
// Parses locus_psychometric_engine.xlsx into two committed JSON datasets:
//   docs/psychometric-items.json   — 25 scenario items, every option pre-scored
//   docs/career-profiles.json      — 127 careers with success profiles
//
// Same contract as parse-topology.mjs: run it by hand, commit the output, and
// let the server read JSON at boot. Deliberately dependency-free — an .xlsx is
// a zip of XML, and node:zlib is enough to read both.
//
//   node docs/parse-psychometrics.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DOCS, '..');
const XLSX = join(ROOT, 'locus_psychometric_engine.xlsx');

// ---------------------------------------------------------------- zip reader

// Minimal reader for the stored/deflated entries an .xlsx contains. Walks the
// central directory rather than scanning for local headers, so it does not trip
// over compressed data that happens to look like a signature.
function unzip(buf) {
  const EOCD = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip: end-of-central-directory not found');

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();

  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

    // The local header repeats the name/extra with its own lengths.
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(start, start + compSize);

    files.set(name, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

// ---------------------------------------------------------------- xml bits

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(s) {
  return s.replace(/&(#x?[0-9a-fA-F]+|amp|lt|gt|quot|apos);/g, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(parseInt(e[1] === 'x' ? e.slice(2) : e.slice(1), e[1] === 'x' ? 16 : 10));
    return ENTITIES[e] ?? m;
  });
}

function sharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(([, si]) =>
    decode([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join('')),
  );
}

// Returns rows as { [columnLetter]: string }, skipping empty rows entirely.
function sheetRows(xml, strings) {
  const rows = [];
  for (const [, attrs, body] of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    for (const [, cAttrs, inner] of body.matchAll(cellRe)) {
      if (!inner) continue;
      const ref = /\br="([A-Z]+)\d+"/.exec(cAttrs)?.[1];
      if (!ref) continue;
      const type = /\bt="([^"]+)"/.exec(cAttrs)?.[1];
      let value;
      if (type === 'inlineStr') {
        value = decode([...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(''));
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        if (v === undefined) continue;
        value = type === 's' ? strings[Number(v)] : decode(v);
      }
      if (value !== undefined && value !== '') cells[ref] = value;
    }
    if (Object.keys(cells).length) {
      rows.push({ r: Number(/\br="(\d+)"/.exec(attrs)?.[1] ?? 0), cells });
    }
  }
  return rows;
}

function sheetPaths(files) {
  const wb = files.get('xl/workbook.xml').toString('utf8');
  const rels = files.get('xl/_rels/workbook.xml.rels').toString('utf8');
  const target = new Map();
  for (const [, id, tgt] of rels.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
    target.set(id, tgt.replace(/^\/?xl\//, '').replace(/^\//, ''));
  }
  const out = new Map();
  for (const [, attrs] of wb.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const name = decode(/\bname="([^"]+)"/.exec(attrs)?.[1] ?? '');
    const rid = /\br:id="([^"]+)"/.exec(attrs)?.[1];
    if (name && rid && target.has(rid)) out.set(name, `xl/${target.get(rid)}`);
  }
  return out;
}

const num = (v) => (v === undefined ? undefined : Number(String(v).replace(/[^\d.-]/g, '')));

// ------------------------------------------------- construct tag extraction

// The workbook's "Construct Measured" column is prose ("Investigative (I) +
// Autonomy", "Low Neuroticism / High Stability"). These patterns turn it into
// stable tags that bridge.ts maps onto the topology engine's vocabulary.
//
// ORDER IS LOAD-BEARING. Each pattern consumes the text it matches, so the
// specific phrase must come before the generic word it contains — otherwise
// "Extrinsic — Social approval" would register as Holland Social.
const PATTERNS = [
  // Neuroticism is inverted into the engine's "stability" signal.
  [/low\s+neuroticism\s*\/\s*high\s+stability/i, ['ocean:stability_high']],
  [/mid\s+neuroticism(\s*\(adaptive\))?/i, ['ocean:stability_mid']],
  [/high\s+neuroticism/i, ['ocean:stability_low']],
  [/neuroticism/i, ['ocean:stability_low']],

  // SDT motivation quality — the workbook's headline construct.
  [/extrinsic\s*[—–-]\s*social\s+approval/i, ['sdt:extrinsic', 'sdt:extrinsic_approval']],
  [/extrinsic\s*[—–-]\s*(status\/security|security\/status)/i, ['sdt:extrinsic', 'sdt:extrinsic_security']],
  [/extrinsic\s*\+\s*relatedness\s+low/i, ['sdt:extrinsic', 'sdt:relatedness_low']],
  [/extrinsic(\s+motivation)?/i, ['sdt:extrinsic']],
  [/intrinsic\s*[—–-]\s*mastery/i, ['sdt:intrinsic', 'sdt:mastery']],
  [/intrinsic\s*[—–-]\s*purpose/i, ['sdt:intrinsic', 'sdt:purpose']],
  [/intrinsic\s+purpose/i, ['sdt:intrinsic', 'sdt:purpose']],
  [/intrinsic(\s+motivation)?/i, ['sdt:intrinsic']],

  // Career decision-making.
  [/happenstance\s+readiness\s*\(high\)/i, ['cdm:happenstance_high']],
  [/closed\s+to\s+happenstance/i, ['cdm:happenstance_low']],
  [/deliberate\s+exploration/i, ['cdm:exploration', 'cdm:systematic']],
  [/systematic\s+decision-making/i, ['cdm:systematic']],
  [/intuitive\s+decision-making/i, ['cdm:intuitive']],
  [/dependent\s+decision-making/i, ['cdm:dependent']],
  [/avoidant\s+decision-making/i, ['cdm:avoidant']],
  [/decision\s+paralysis/i, ['cdm:paralysis']],
  [/pre-?contemplation/i, ['cdm:precontemplation']],
  [/crystallization\s+stage/i, ['cdm:crystallization']],
  [/exploration\s+stage/i, ['cdm:exploration']],
  [/low\s+autonomy\s*\+\s*avoidant/i, ['sdt:autonomy_low', 'cdm:avoidant']],
  [/decision-making/i, ['cdm:systematic']],
  [/systematic/i, ['cdm:systematic']],

  // Self-awareness (Q23) reads as intrapersonal intelligence.
  [/intrapersonal\s*\+\s*self-awareness/i, ['mi:intrapersonal', 'meta:self_aware_high']],
  [/developing\s+self-awareness/i, ['meta:self_aware_mid']],
  [/low\s+intrapersonal/i, ['mi:intrapersonal_low']],
  [/self-awareness/i, ['meta:self_aware_high']],

  // Big Five.
  [/conscientiousness\s*\(high\)|high\s+conscientiousness/i, ['ocean:conscientiousness_high']],
  [/conscientiousness\s*\(mid\)/i, ['ocean:conscientiousness_mid']],
  [/conscientiousness\s*\(low\)/i, ['ocean:conscientiousness_low']],
  [/low\s+self-regulation/i, ['ocean:conscientiousness_low']],
  [/conscientiousness/i, ['ocean:conscientiousness_high']],
  [/openness\s*\(high\)/i, ['ocean:openness_high']],
  [/openness\s*\(mid-high\)/i, ['ocean:openness_mid_high']],
  [/openness\s*\(low\)/i, ['ocean:openness_low']],
  [/openness/i, ['ocean:openness_high']],
  [/extraversion\s*\(high\)/i, ['ocean:extraversion_high']],
  [/extraversion\s*\(low\)\s*\/\s*introversion|introversion/i, ['ocean:extraversion_low']],
  [/ambiversion/i, ['ocean:extraversion_mid']],
  [/agreeableness\s*\(low-mid\)/i, ['ocean:agreeableness_low']],
  [/agreeableness\s*\(high\)/i, ['ocean:agreeableness_high']],
  [/agreeableness/i, ['ocean:agreeableness_high']],

  // SDT needs.
  [/autonomy\s*\(high\)/i, ['sdt:autonomy_high']],
  [/autonomy\s*\(mid\)/i, ['sdt:autonomy_mid']],
  [/autonomy\s*\(low\)(\s*\/\s*controlled\s+motivation)?/i, ['sdt:autonomy_low']],
  [/external\s+locus(\s*\+\s*low\s+autonomy)?/i, ['sdt:autonomy_low']],
  [/low\s+autonomy/i, ['sdt:autonomy_low']],
  [/autonomy/i, ['sdt:autonomy_high']],
  [/competence\s*\(high\)/i, ['sdt:competence_high']],
  [/competence\s*\(developing\)|competence\s*\(diffuse\)/i, ['sdt:competence_mid']],
  [/competence\s*\(low\)/i, ['sdt:competence_low']],
  [/competence/i, ['sdt:competence_high']],
  [/relatedness\s+low/i, ['sdt:relatedness_low']],
  [/relatedness/i, ['sdt:relatedness']],

  // Multiple Intelligences.
  [/logical-math(ematical)?/i, ['mi:logical']],
  [/bodily-kinesthetic/i, ['mi:bodily']],
  [/linguistic(\s+intelligence)?/i, ['mi:linguistic']],
  [/spatial(\s+intelligence)?/i, ['mi:spatial']],
  [/interpersonal(\s+intel\w*)?/i, ['mi:interpersonal']],
  [/intrapersonal/i, ['mi:intrapersonal']],
  [/musical(\s+intelligence)?/i, ['mi:musical']],
  [/naturalistic(\s+intelligence)?/i, ['mi:naturalistic']],
  [/logical/i, ['mi:logical']],
  [/visual/i, ['mi:spatial']],

  // Holland RIASEC — after "social approval" above, so it cannot steal it.
  [/realistic(\s*\(r\))?/i, ['holland:R']],
  [/investigative(\s*\(i\))?/i, ['holland:I']],
  [/artistic(\s*\(a\))?/i, ['holland:A']],
  [/enterprising(\s*\(e\))?/i, ['holland:E']],
  [/rule-following\s*\/\s*conventional|conventional(\s*\(c\))?/i, ['holland:C']],
  [/social(\s*\(s\))?/i, ['holland:S']],

  // Leftovers worth keeping as narrative colour.
  [/low\s+engagement|low\s+investment/i, ['meta:low_engagement']],
  [/risk-averse/i, ['meta:risk_averse']],
  [/assertive/i, ['meta:assertive']],
  [/avoidant/i, ['meta:conflict_avoidant']],
  [/mastery/i, ['sdt:mastery']],
  [/purpose/i, ['sdt:purpose']],
];

function constructTags(text, residue) {
  let work = ` ${text} `;
  const tags = [];
  for (const [re, add] of PATTERNS) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    if (!global.test(work)) continue;
    work = work.replace(new RegExp(re.source, `${re.flags}g`), '   ');
    for (const t of add) if (!tags.includes(t)) tags.push(t);
  }
  // Anything left that is not punctuation or a consumed marker is unmapped.
  const left = work.replace(/ /g, ' ').replace(/[\s+/(),.—–-]+/g, ' ').trim();
  if (left) residue.add(left);
  return tags;
}

// ---------------------------------------------------------------- main

const files = unzip(readFileSync(XLSX));
const strings = sharedStrings(files.get('xl/sharedStrings.xml')?.toString('utf8'));
const sheets = sheetPaths(files);

const need = (name) => {
  const path = sheets.get(name);
  if (!path || !files.has(path)) throw new Error(`worksheet "${name}" not found in workbook`);
  return sheetRows(files.get(path).toString('utf8'), strings);
};

// --- Sheet 1: Q&A Engine -----------------------------------------------
// A=Q#  B=question  C=option  D..H=H,O,S,M,D  I=theory  J=construct
const residue = new Set();
const items = [];
const letters = 'abcdefghij';

for (const { cells } of need('Q&A Engine')) {
  const option = cells.C;
  if (!option || option === 'Answer Option') continue;

  if (cells.A && cells.B) {
    items.push({ id: `p${items.length + 1}`, text: cells.B.trim(), options: [] });
  }
  const item = items[items.length - 1];
  if (!item) continue;

  const scores = { h: num(cells.D), o: num(cells.E), s: num(cells.F), m: num(cells.G), d: num(cells.H) };
  if (Object.values(scores).some((v) => !Number.isFinite(v))) {
    throw new Error(`${item.id}: option "${option}" is missing one or more scores`);
  }

  const construct = (cells.J ?? '').trim();
  // "A — Set up and manage…" → letter + clean label.
  const split = /^([A-E])\s*[—–-]\s*(.*)$/s.exec(option.trim());
  item.options.push({
    id: `${item.id}${letters[item.options.length]}`,
    letter: split?.[1] ?? String.fromCharCode(65 + item.options.length),
    label: (split?.[2] ?? option).trim(),
    scores,
    theory: (cells.I ?? '').trim(),
    construct,
    constructTags: constructTags(construct, residue),
  });
}

// --- Sheet 3: Career Match Engine --------------------------------------
// A=#  B=name  C=domain  D..H=H,O,S,M,D success profile
const careers = [];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

for (const { cells } of need('Career Match Engine')) {
  const name = cells.B;
  if (!name || name === 'Career Path' || !cells.C) continue;
  const profile = { h: num(cells.D), o: num(cells.E), s: num(cells.F), m: num(cells.G), d: num(cells.H) };
  if (Object.values(profile).some((v) => !Number.isFinite(v))) continue;
  careers.push({
    id: `c${careers.length + 1}-${slug(name)}`,
    name: name.trim(),
    domain: cells.C.trim(),
    profile,
  });
}

// --- Validate ----------------------------------------------------------
const problems = [];
if (items.length !== 25) problems.push(`expected 25 items, got ${items.length}`);
if (careers.length !== 127) problems.push(`expected 127 careers, got ${careers.length}`);

let optionCount = 0;
for (const it of items) {
  optionCount += it.options.length;
  if (it.options.length < 3 || it.options.length > 5) {
    problems.push(`${it.id} has ${it.options.length} options`);
  }
  for (const o of it.options) {
    for (const [k, v] of Object.entries(o.scores)) {
      if (v < 1 || v > 5) problems.push(`${o.id} score ${k}=${v} out of range 1-5`);
    }
    if (!o.constructTags.length) problems.push(`${o.id} produced no construct tags from "${o.construct}"`);
  }
}
for (const c of careers) {
  for (const [k, v] of Object.entries(c.profile)) {
    if (v < 0 || v > 100) problems.push(`${c.id} profile ${k}=${v} out of range 0-100`);
  }
}
if (problems.length) {
  console.error('validation failed:');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}

// --- Write -------------------------------------------------------------
const stamp = new Date().toISOString().slice(0, 10);

writeFileSync(
  join(DOCS, 'psychometric-items.json'),
  `${JSON.stringify({
    version: 1,
    source: `locus_psychometric_engine.xlsx, parsed ${stamp}`,
    instrument: 'LOCUS 25-question instrument',
    theories: {
      h: 'Holland RIASEC',
      o: 'Big Five OCEAN',
      s: 'Self-Determination Theory',
      m: 'Multiple Intelligences',
      d: 'Career Decision-Making',
    },
    maxPerItem: 5,
    items,
  }, null, 2)}\n`,
);

writeFileSync(
  join(DOCS, 'career-profiles.json'),
  `${JSON.stringify({
    version: 1,
    source: `locus_psychometric_engine.xlsx, parsed ${stamp}`,
    weights: { h: 0.25, o: 0.2, s: 0.25, m: 0.2, d: 0.1 },
    // The workbook's fit formula differences H/O/S/M only; D is stored per
    // career but never subtracted. Replicated verbatim in psychometrics.ts.
    fitWeights: { h: 0.25, o: 0.2, s: 0.25, m: 0.2 },
    thresholds: { bestFit: 72, consider: 52 },
    careers,
  }, null, 2)}\n`,
);

console.log(`psychometric-items.json  ${items.length} items, ${optionCount} options`);
console.log(`career-profiles.json     ${careers.length} careers`);
if (residue.size) {
  console.log(`\nunmapped construct fragments (${residue.size}) — review before shipping:`);
  for (const r of [...residue].sort()) console.log('  -', r);
}
