#!/usr/bin/env node
/**
 * parse-topology.mjs
 *
 * Parses docs/career-docs-raw.txt (a Google Doc export of 26 "Integrated
 * Academic & Career Topology" documents, one per undergraduate degree) into
 * docs/career-topology.json, the structured dataset consumed by the prediction
 * server.
 *
 * Usage:
 *   node docs/parse-topology.mjs            # write JSON + totals
 *   node docs/parse-topology.mjs --audit    # also print per-doc diagnostics
 *   node docs/parse-topology.mjs --dry-run  # diagnostics only, no write
 *
 * ---------------------------------------------------------------------------
 * Source quirks the parser has to absorb (see docs/career-docs-summary.md §5):
 *
 *  - Doc 3 (B.Sc. Agriculture) has no "Integrated Academic & Career Topology"
 *    subtitle; it starts straight at the regulatory framework line.
 *  - Doc 15 (B.Optom) has stray column-0 lines inside its Emerging section that
 *    look like new doc titles.
 *  - Doc 20 is one document covering two degrees (Cardiac Care + Perfusion);
 *    it stays a single entry with both names in `aliases`.
 *  - Three layouts:
 *      Variant A (docs 1-15)  nested bullets, 3 spaces per level.
 *      Variant B (docs 16-17) flat bullets, section headings numbered/plain.
 *      Variant C (docs 18-26) flat bullets, item + one-line prose description;
 *                             PG runs repeat [degree, node, node, 4x title].
 *  - Only doc 17 labels "Destination Nodes:" / "Frontline Titles:" explicitly;
 *    that pair is the canonical data model, and the other 25 docs are
 *    back-filled into it. Where docs 1-15 interleave employer names and job
 *    titles at the same depth with no marker, classification is heuristic and
 *    the item carries `nodesTitlesInferred: true`.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUT = join(HERE, 'career-docs-raw.txt');
const OUTPUT = join(HERE, 'career-topology.json');
const SOURCE_LABEL = 'Google Doc career topology, exported 2026-07-26';

/* ------------------------------------------------------------------ *
 * 1. The fixed 10-section taxonomy
 * ------------------------------------------------------------------ *
 * Heading patterns are anchored at the start of the line on purpose:
 * ordinary bullets contain category words ("GA4GH Technical Certification
 * Tracks", "ASHA Clinical Certification Pathway") and must not be mistaken
 * for headings. Every real heading leads with its category term.
 */
const CATEGORIES = [
  { key: 'pgPathways', test: /^(higher education|postgraduate|pg )/i },
  { key: 'frontlineJobs', test: /^frontline\b/i },
  { key: 'industryRoles', test: /^non-?traditional\b/i },
  { key: 'government', test: /^government (opportunit|job)/i },
  { key: 'civilServices', test: /^civil services\b/i },
  { key: 'globalPathways', test: /^(global licens|study abroad|international licens)/i },
  { key: 'certifications', test: /^(high-value certification|certifications?\b|skill accelerator)/i },
  { key: 'entrepreneurship', test: /^entrepreneur(ial|ship)\b/i },
  { key: 'research', test: /^research domains?\b/i },
  { key: 'emerging', test: /^emerging horizon\b/i },
];

const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

/** Degree-program heads that start a new PG item inside flat documents. */
const PROGRAM_RE =
  /^(m\.?\s?sc\b|m\.?\s?s\b|master(?:'s)?\b|mba\b|mha\b|mph\b|m\.?tech\b|m\.?pharm\b|m\.?p\.?t\b|m\.?o\.?t\b|m\.?a\.?o\.?t\.?t\b|m\.?a\.?s\.?l\.?p\b|m\.?e\b|m\.?a\b|m\.?ch\b|m\.?d\b|ph\.?\s?d\b|doctor(ate)?\b|integrated\s+(m\.?sc|ph\.?d)|pg\s+(diploma|certificate|program)|post[- ]?graduate\s+diploma|post[- ]?basic\b|advanced\s+diploma\b|fellowship\b|ll\.?\s?[bm]\b|\d\s*-?\s*year\s+ll\.?\s?b\b|pharm\.?\s?d\b|dm\b|dnb\b|b\.?ed\b)/i;

/** Civil-services sub-bullets always belong to the preceding heading/item. */
const CIVIL_CHILD_RE =
  /^(upsc\b|union public service|state psc\b|state public service|staff selection|ssc\b|combined graduate|state civil|banking\b|ibps\b)/i;

/** Statutory credentials the source calls out as hard, mandatory gates. */
const MANDATORY_RE =
  /(board of cardiovascular perfusion india \(bcp-i\)|aerb radiological safety officer \(rso level-ii\)|rso level-ii\) certification)/i;

/* ------------------------------------------------------------------ *
 * 2. Head-noun classifiers: destination node (where) vs. title (who)
 * ------------------------------------------------------------------ */

const SETTING_NOUNS =
  /^(hospitals?|centres?|centers?|clinics?|labs?|laborator(y|ies)|units?|institutes?|institutions?|firms?|compan(y|ies)|chains?|hubs?|networks?|organi[sz]ations?|agenc(y|ies)|colleges?|universit(y|ies)|schools?|wards?|departments?|divisions?|wings?|plants?|facilit(y|ies)|suites?|rooms?|banks?|startups?|ventures?|groups?|consultanc(y|ies)|corporates?|corporations?|ngos?|boards?|missions?|authorit(y|ies)|cells?|parks?|studios?|practices?|ecosystems?|infrastructures?|frameworks?|sites?|bureaus?|bureaux|stations?|theatres?|theaters?|markets?|academies|academy|foundations?|societ(y|ies)|councils?|ministr(y|ies)|services?|systems?|platforms?|portals?|providers?|manufacturers?|multinationals?|multi-nationals?|mncs?|kpos?|cros?|smos?|oems?|blocks?|zones?|campuses|campus|homes?|houses?|complexes|enclaves?|registries|registry|programs?|programmes?|projects?|schemes?|verticals?|desks?|teams?|forces?|bod(y|ies)|federations?|associations?|trusts?|estates?|domains?|pipelines?|pools?|circuits?|floors?|bays?|camps?|towers?|villages?|districts?|clusters?|corridors?|hospices?|dispensar(y|ies)|pharmacies|pharmacy|stores?|outlets?|warehouses?|depots?|farms?|greenhouses?|nurseries|nursery|refineries|refinery|mills?|factor(y|ies)|industr(y|ies)|sectors?|arenas?|spaces?|landscapes?|libraries|library|repositories|repository|databases?|archives?|consortiums?|consortia|alliances?|partnerships?|collaborations?|initiatives?|cadres?|posts?|tracks?|routes?|pathways?|exams?|examinations?|recruitments?|commissions?|corps|hqs?|headquarters|rehabs?|super-specialt(y|ies)|specialt(y|ies)|operations|offices?|panels?|giants?|cooperatives?|funds?|diagnostics|biopharma|nutraceuticals?|biologics|manufacturing|cultivation|collections?|r&d|advisory|logistics|distribution|tiers?|lines?|wards|hubs|grids?|fleets?|chambers?|labs|setups?|installations?|establishments?|reserves?|bases?|studios|stations|kpo|bpo|conglomerates?|enterprises?|holdings?|incubators?|accelerators?|marketplaces?|portfolios?|contracts?|divisions|departments|colleges|wings|estates|belts?|zones|circles?|regions?|territories|territory)$/i;

const ROLE_NOUNS =
  /^(officers?|managers?|analysts?|engineers?|specialists?|consultants?|coordinators?|leads?|directors?|executives?|scientists?|associates?|assistants?|nurses?|technologists?|technicians?|supervisors?|heads?|auditors?|trainers?|educators?|practitioners?|therapists?|modelers?|modellers?|designers?|developers?|operators?|strategists?|advisors?|advisers?|planners?|captains?|superintendents?|fellows?|researchers?|professionals?|architects?|programmers?|writers?|profilers?|curators?|custodians?|administrators?|investigators?|evaluators?|examiners?|counselors?|counsellors?|counsel|dietitians?|dieticians?|pharmacists?|physiologists?|optometrists?|audiologists?|perfusionists?|paramedics?|instructors?|facult(y|ies)|surgeons?|physicians?|doctors?|inspectors?|reviewers?|monitors?|assessors?|liaisons?|representatives?|controllers?|marketers?|editors?|authors?|processors?|handlers?|schedulers?|navigators?|coaches?|mentors?|apprentices?|interns?|trainees?|entrepreneurs?|founders?|owners?|partners?|agents?|brokers?|statisticians?|epidemiologists?|geneticists?|toxicologists?|microbiologists?|biochemists?|biologists?|chemists?|anaesthetists?|anesthetists?|radiographers?|sonographers?|echocardiographers?|phlebotomists?|cytotechnologists?|histotechnologists?|psychologists?|attendants?|aides?|orderlies|prescribers?|dispensers?|formulators?|validators?|verifiers?|integrators?|implementers?|annotators?|labelers?|labellers?|testers?|chiefs?|deans?|principals?|professors?|lecturers?|tutors?|jrfs?|srfs?|nutritionists?|orthotists?|prosthetists?|podiatrists?|opticians?|midwives|midwife|matrons?|pilots?|marshals?|responders?|drivers?|dispatchers?|attorneys?|lawyers?|litigators?|breeders?|pharmacologists?|virologists?|bacteriologists?|immunologists?|experts?|finders?|in-charge|assayers?|diagnosticians?|technologist|clinicians?|therapists|leaders?|masters?|agronomists?|embryologists?|biostatisticians?|informaticians?|bioinformaticians?|programmer|monitorists?|generalists?)$/i;

const ROLE_HINT =
  /\b(officer|manager|analyst|engineer|specialist|consultant|coordinator|director|executive|scientist|associate|assistant|nurse|technologist|technician|supervisor|auditor|trainer|educator|practitioner|therapist|designer|developer|operator|strategist|advisor|planner|superintendent|fellow|researcher|architect|programmer|writer|curator|custodian|administrator|investigator|evaluator|examiner|counselor|dietitian|pharmacist|physiologist|optometrist|audiologist|perfusionist|paramedic|instructor|surgeon|physician|inspector|reviewer|monitor|assessor|epidemiologist|statistician|radiographer|sonographer|psychologist|attorney|lawyer|clinician|in-charge)\b/i;

/* ------------------------------------------------------------------ *
 * 3. Small helpers
 * ------------------------------------------------------------------ */

const clean = (s) =>
  s.replace(/ /g, ' ').replace(/﻿/g, '').replace(/\s+/g, ' ').trim();

/** Strip list numbering ("1. ", "iv) ") and trailing punctuation for matching. */
const normalizeHeading = (s) =>
  clean(s)
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^[ivxlc]+[.)]\s*/i, '')
    .replace(/\s*\(.*?\)\s*$/, '')
    .replace(/[:.]\s*$/, '')
    .trim();

function categoryOf(text) {
  const h = normalizeHeading(text);
  if (!h || h.split(/\s+/).length > 14) return null;
  for (const c of CATEGORIES) if (c.test.test(h)) return c.key;
  return null;
}

/**
 * Prose = a sentence-shaped description rather than a title.
 *
 * In the flat documents (16-26) every description ends in a full stop and no
 * item title does, so the trailing-period test alone is exact there. Applying
 * the looser phrasing heuristics to those docs would swallow long research and
 * certification titles ("Comparative Accuracy of ML Triage Algorithms ..."),
 * so the extra rules are reserved for nested docs, where they only ever fire
 * on the handful of mis-indented stray lines.
 */
function isProse(text, flat = false) {
  const t = clean(text);
  if (!t) return false;
  if (/^(destination nodes|frontline titles)\s*:/i.test(t)) return false;
  const words = t.split(/\s+/).length;
  if (/[.!?]$/.test(t) && words >= 6) return true;
  if (flat) return false;
  if (words >= 16) return true;
  if (
    words >= 8 &&
    /^(managing|providing|conducting|building|executing|processing|drafting|designing|creating|developing|analy[sz]ing|operating|maintaining|overseeing|tracking|testing|evaluating|coordinating|delivering|deploying|running|handling|calibrating|setting|labeling|labelling|mining|fusing|using|utili[sz]ing|harnessing|simulating|offering|specialized|regular|core|advanced|comparative|investigating|configuring|engineering|auditing|triaging|assembling|inspecting|coaching|interfacing|meeting|achieving|validation|mandatory|cloud|industry|direct|technical|elite|standardized|targeted|equivalence|document|prometric|launching|establishing|quantifying|mapping|comparing|deriving|extracting|applying|integrating|combining|leveraging|adapting|enabling|supporting|assisting|preparing|planning|scheduling|auditing|reviewing|verifying|screening|profiling|modeling|modelling|generating)\b/i.test(t)
  )
    return true;
  return false;
}

/** Split "A, B (x, y), C" on top-level commas only. */
function splitTopLevel(str) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out
    .map((s) => clean(s).replace(/\.$/, '').trim())
    .filter(Boolean);
}

/** Split a regulatory paragraph into individual statutory bodies. */
function splitBodies(paragraph) {
  if (!paragraph) return [];
  return splitTopLevel(paragraph)
    .flatMap((part) => part.split(/\s+&\s+(?=[A-Z])|\s+and\s+(?=[A-Z])/))
    .map((s) => clean(s).replace(/^(and|&)\s+/i, '').replace(/\.$/, '').trim())
    .filter((s) => s.length > 2);
}

/** Head-noun classification of a phrase: 'node' | 'title' | 'unknown'. */
function classifyPhrase(text) {
  const t = clean(text)
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*[:–—]\s.*$/, '')
    .replace(/\s+-\s.*$/, '')
    .replace(/[.,;]+$/, '')
    .trim();
  if (!t) return 'unknown';
  const words = t.split(/\s+/);
  const head = words[words.length - 1];
  if (ROLE_NOUNS.test(head)) return 'title';
  if (SETTING_NOUNS.test(head)) return 'node';
  if (ROLE_HINT.test(t)) return 'title';
  return 'unknown';
}

const slugify = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

/* ------------------------------------------------------------------ *
 * 4. Tokenize
 * ------------------------------------------------------------------ */

const rawText = readFileSync(INPUT, 'utf8').replace(/^﻿/, '');
const rawLines = rawText.split(/\r?\n/);

const tokens = rawLines.map((raw, i) => {
  const line = raw.replace(/ /g, ' ').replace(/﻿/g, '').replace(/\s+$/, '');
  const indent = line.length - line.replace(/^ +/, '').length;
  const body = line.slice(indent);
  const isBullet = /^\*\s/.test(body);
  return {
    n: i + 1,
    indent,
    isBullet,
    depth: isBullet ? Math.round(indent / 3) : null,
    text: clean(isBullet ? body.replace(/^\*\s*/, '') : body),
    empty: clean(line) === '',
  };
});

/* ------------------------------------------------------------------ *
 * 5. Split into the 26 documents
 * ------------------------------------------------------------------ */

const HEADER_RE = /^Integrated Academic & Career Topology\s*:\s*(.+)$/i;
const REG_RE = /^Regulatory( & Standards)? Framework\b/i;

const starts = [];
tokens.forEach((t, idx) => {
  if (t.empty || t.isBullet || t.indent > 0) return;
  const m = HEADER_RE.exec(t.text);
  if (m) {
    starts.push({ idx, title: clean(m[1]), headed: true });
    return;
  }
  // Doc 3 (B.Sc. Agriculture) skips the subtitle line: an unindented
  // "Regulatory Framework:" line with no subtitle immediately above it.
  if (REG_RE.test(t.text)) {
    const near = tokens.slice(Math.max(0, idx - 3), idx).some((p) => HEADER_RE.test(p.text || ''));
    if (!near) {
      let label = '';
      for (let j = idx - 1; j >= 0 && j > idx - 5; j--) {
        if (!tokens[j].empty) {
          label = tokens[j].text;
          break;
        }
      }
      starts.push({ idx: idx - 1, title: label || `Section @${t.n}`, headed: false, shortTitle: label });
    }
  }
});

// Resolve each doc's true first line (the short title line above the subtitle),
// then close the previous doc immediately before it - otherwise the next doc's
// title leaks into the previous doc's last section (the Emerging trap).
const begins = starts.map((s) => {
  if (s.headed && s.idx > 0 && !tokens[s.idx - 1].empty && tokens[s.idx - 1].indent === 0)
    return s.idx - 1;
  return s.idx;
});

const docs = starts.map((s, i) => ({
  ...s,
  shortTitle: s.shortTitle ?? (begins[i] < s.idx ? tokens[begins[i]].text : ''),
  lines: tokens.slice(begins[i], i + 1 < begins.length ? begins[i + 1] : tokens.length),
}));

/* ------------------------------------------------------------------ *
 * 6. Parse one document
 * ------------------------------------------------------------------ */

const audit = {
  docs: [],
  inferredPhrases: [],
  unknownPhrases: [],
  strayLines: [],
  droppedLines: [],
  sourceBullets: 0,
  placedLines: 0,
};

function parseDoc(doc) {
  const lines = doc.lines.filter((l) => !l.empty);
  const name = doc.title.replace(/\s*\(High-Scope Pathways Only\)\s*$/i, '').trim();

  let regulatoryText = '';
  const buckets = new Map();
  const unclassified = [];
  const contentLines = [];
  let current = null;
  let headingIsBullet = null; // null = not yet known
  let categoryDepth = null;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i];
    const text = t.text;
    if (!text) continue;

    if (HEADER_RE.test(text)) continue;
    if (!t.isBullet && text === doc.shortTitle && !current) continue;
    if (/^academic & career pathways\s*:?\s*$/i.test(text)) continue;

    if (REG_RE.test(text) && !current) {
      const inline = text.replace(/^Regulatory( & Standards)? Framework\s*:?\s*/i, '').trim();
      if (inline) regulatoryText = inline;
      else if (lines[i + 1] && !lines[i + 1].isBullet) {
        regulatoryText = lines[i + 1].text;
        i++;
      }
      continue;
    }

    // ---- category headings -------------------------------------------
    const cat = categoryOf(text);
    let isHeading = false;
    if (cat && !isProse(text)) {
      if (headingIsBullet === null) {
        isHeading = true;
        headingIsBullet = t.isBullet;
        categoryDepth = t.isBullet ? t.depth : null;
      } else if (headingIsBullet && t.isBullet && t.depth === categoryDepth) {
        isHeading = true;
      } else if (!headingIsBullet && !t.isBullet) {
        isHeading = true;
      }
      // Docs 1-15 nest "Civil Services & General Graduate Frameworks" one level
      // deeper, as an item under Government. Promote it to a heading wherever
      // it appears so all documents expose the same 10 sections.
      if (cat === 'civilServices') isHeading = true;
    }
    if (isHeading) {
      if (!buckets.has(cat)) buckets.set(cat, []);
      current = cat;
      continue;
    }

    // ---- content ------------------------------------------------------
    if (!current) {
      unclassified.push(text);
      audit.strayLines.push({ doc: name, line: t.n, text });
      continue;
    }
    buckets.get(current).push({
      depth: t.isBullet ? t.depth : null,
      text,
      n: t.n,
    });
    contentLines.push({ n: t.n, text });
  }

  // Normalise depths: the item level sits one below the heading level; any
  // shallower stray line (B.Optom trap) is pulled up to item level.
  const itemDepth = categoryDepth === null ? 1 : categoryDepth + 1;
  for (const entries of buckets.values())
    for (const e of entries) e.depth = e.depth === null ? itemDepth : Math.max(e.depth, itemDepth);

  const categories = {};
  for (const key of CATEGORY_KEYS) categories[key] = [];
  for (const [key, entries] of buckets) categories[key] = buildItems(key, entries, name);

  const regulatoryFramework = splitBodies(regulatoryText).map((body) => ({
    body,
    mandatory: MANDATORY_RE.test(body),
  }));

  const degree = {
    id: slugify(name),
    name,
    shortName: doc.shortTitle || name,
    aliases: [],
    regulatoryFramework,
    regulatoryFrameworkText: regulatoryText,
    categories,
  };
  if (unclassified.length) degree.unclassified = unclassified;

  // Coverage proof: every content line of this document must survive into the
  // JSON. Comparison is punctuation- and whitespace-insensitive because tagged
  // lists ("Destination Nodes: A, B, C.") are exploded into array elements and
  // consecutive prose lines are joined into one description.
  const squash = (s) =>
    s.replace(/\b(and)\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const blob = squash(JSON.stringify(degree));
  const missing = contentLines.filter((l) => {
    const body = l.text.replace(/^(destination nodes|frontline titles)\s*:/i, '');
    const key = squash(body);
    if (!key.length || blob.includes(key)) return false;
    // A comma list may have been split across sibling items; then each part
    // must be present even though the whole line is no longer contiguous.
    const parts = splitTopLevel(body).map(squash).filter(Boolean);
    return parts.length < 2 || !parts.every((p) => blob.includes(p));
  });
  audit.sourceBullets += contentLines.length;
  audit.placedLines += contentLines.length - missing.length;
  audit.droppedLines.push(...missing.map((m) => ({ doc: name, line: m.n, text: m.text })));

  audit.docs.push({
    name,
    id: degree.id,
    lineStart: doc.lines[0]?.n,
    counts: Object.fromEntries(CATEGORY_KEYS.map((k) => [k, categories[k].length])),
    missing: CATEGORY_KEYS.filter((k) => categories[k].length === 0),
    unclassified: unclassified.length,
  });

  return degree;
}

/* ------------------------------------------------------------------ *
 * 7. Group entries into items, then shape them
 * ------------------------------------------------------------------ */

function groupEntries(key, entries, flat) {
  if (!entries.length) return [];
  const minDepth = Math.min(...entries.map((e) => e.depth));
  const groups = [];

  const pushChild = (text) => {
    if (groups.length) groups[groups.length - 1].children.push(text);
    else groups.push({ head: text, children: [] });
  };

  if (!flat) {
    for (const e of entries) {
      if (e.depth === minDepth) {
        // A prose line at item level describes the item above it.
        if (isProse(e.text) && groups.length) pushChild(e.text);
        else groups.push({ head: e.text, children: [] });
      } else pushChild(e.text);
    }
    return groups;
  }

  // Flat layouts (docs 16-26): infer boundaries from content.
  for (const e of entries) {
    const startsItem =
      key === 'pgPathways'
        ? PROGRAM_RE.test(e.text) || !groups.length
        : key === 'civilServices'
          ? !isProse(e.text, true) || !groups.length // UPSC / State PSC / SSC are siblings
          : !groups.length || (!isProse(e.text, true) && !CIVIL_CHILD_RE.test(e.text));
    if (startsItem) groups.push({ head: e.text, children: [] });
    else pushChild(e.text);
  }
  return groups;
}

function buildItems(key, entries, docName) {
  const minDepth = entries.length ? Math.min(...entries.map((e) => e.depth)) : 0;
  const isFlat = entries.length > 0 && !entries.some((e) => e.depth > minDepth);
  const groups = groupEntries(key, entries, isFlat);

  return groups.map((g) => {
    const item = {
      name: g.head,
      destination_nodes: [],
      frontline_titles: [],
      description: '',
      nodesTitlesInferred: false,
    };
    const prose = [];
    const untagged = [];

    for (const child of g.children) {
      const nodes = /^destination nodes\s*:/i.exec(child);
      const titles = /^frontline titles\s*:/i.exec(child);
      if (nodes) {
        item.destination_nodes.push(...splitTopLevel(child.slice(nodes[0].length)));
      } else if (titles) {
        item.frontline_titles.push(...splitTopLevel(child.slice(titles[0].length)));
      } else if (isProse(child, isFlat)) {
        prose.push(child);
      } else {
        untagged.push(child);
      }
    }

    if (untagged.length) {
      // Docs 18-26 use a strict [degree, node, node, title, title, title,
      // title] run for PG entries: the first two children are always
      // destination nodes. Everywhere else fall back to head-noun analysis.
      if (key === 'pgPathways' && isFlat && untagged.length >= 4) {
        item.destination_nodes.push(...untagged.slice(0, 2));
        item.frontline_titles.push(...untagged.slice(2));
        item.nodesTitlesInferred = true;
      } else {
        for (const phrase of untagged) {
          const cls = classifyPhrase(phrase);
          if (cls === 'title') item.frontline_titles.push(phrase);
          else if (cls === 'node') item.destination_nodes.push(phrase);
          else {
            item.destination_nodes.push(phrase);
            audit.unknownPhrases.push({ doc: docName, category: key, text: phrase });
          }
        }
        item.nodesTitlesInferred = true;
        audit.inferredPhrases.push(...untagged.map((p) => ({ doc: docName, text: p })));
      }
    }

    item.description = prose.join(' ');
    if (MANDATORY_RE.test(item.name)) item.mandatory = true;
    return item;
  })
    // Doc 17 packs all three civil-service exams onto one comma-separated
    // line; split it so every document lists them as siblings.
    .flatMap((item) => {
      if (key !== 'civilServices') return [item];
      const parts = splitTopLevel(item.name).flatMap((p) =>
        p.split(/\s+and\s+(?=[A-Z])/).map((x) => clean(x))
      );
      if (parts.length < 2) return [item];
      return parts.map((p, i) => ({
        ...item,
        name: p,
        destination_nodes: i === 0 ? item.destination_nodes : [],
        frontline_titles: i === 0 ? item.frontline_titles : [],
        description: i === 0 ? item.description : '',
      }));
    });
}

/* ------------------------------------------------------------------ *
 * 8. Build the dataset
 * ------------------------------------------------------------------ */

const degrees = docs.map(parseDoc);

// Doc 20 documents two degrees under one topology; expose both names.
for (const d of degrees) {
  if (/cardiac care technology\s*&\s*b\.?sc\.? perfusion technology/i.test(d.name)) {
    d.id = 'bsc-cardiac-care-and-perfusion-technology';
    d.aliases = [
      'B.Sc. Cardiac Care Technology',
      'B.Sc. Perfusion Technology',
      'B.Sc. Cardiac Care Technology & B.Sc. Perfusion Technology',
    ];
  } else if (/emergency medical technology\s*\/\s*trauma care technology/i.test(d.name)) {
    d.aliases = ['B.Sc. Emergency Medical Technology', 'B.Sc. Trauma Care Technology'];
  } else if (/neuro-electrophysiology\s*\/\s*neurodiagnostic/i.test(d.name)) {
    d.aliases = ['B.Sc. Neuro-Electrophysiology', 'B.Sc. Neurodiagnostic Technology'];
  } else if (/physician assistant\s*\/\s*physician associate/i.test(d.name)) {
    d.aliases = ['B.Sc. Physician Assistant', 'B.Sc. Physician Associate'];
  } else if (/food technology\s*\/\s*science/i.test(d.name)) {
    d.aliases = ['B.Sc. Food Technology', 'B.Sc. Food Science'];
  }
  if (d.shortName && d.shortName !== d.name && !d.aliases.includes(d.shortName))
    d.aliases.push(d.shortName);
}

const seen = new Map();
for (const d of degrees) {
  if (seen.has(d.id)) {
    const n = seen.get(d.id) + 1;
    seen.set(d.id, n);
    d.id = `${d.id}-${n}`;
  } else seen.set(d.id, 1);
}

const dataset = { version: 1, source: SOURCE_LABEL, degrees };

/* ------------------------------------------------------------------ *
 * 9. Totals, audit, write
 * ------------------------------------------------------------------ */

const totals = {
  degrees: degrees.length,
  items: 0,
  pgPrograms: 0,
  destinationNodes: 0,
  frontlineTitles: 0,
  descriptions: 0,
  regulatoryBodies: 0,
  mandatoryGates: 0,
  strings: 0,
};
const perCategory = Object.fromEntries(CATEGORY_KEYS.map((k) => [k, 0]));

for (const d of degrees) {
  totals.regulatoryBodies += d.regulatoryFramework.length;
  totals.mandatoryGates += d.regulatoryFramework.filter((r) => r.mandatory).length;
  for (const key of CATEGORY_KEYS) {
    const items = d.categories[key];
    perCategory[key] += items.length;
    totals.items += items.length;
    if (key === 'pgPathways') totals.pgPrograms += items.length;
    for (const it of items) {
      totals.destinationNodes += it.destination_nodes.length;
      totals.frontlineTitles += it.frontline_titles.length;
      if (it.description) totals.descriptions += 1;
      if (it.mandatory) totals.mandatoryGates += 1;
      totals.strings += 1 + it.destination_nodes.length + it.frontline_titles.length + (it.description ? 1 : 0);
    }
  }
  totals.strings += (d.unclassified || []).length;
}

const args = new Set(process.argv.slice(2));
if (!args.has('--dry-run')) writeFileSync(OUTPUT, JSON.stringify(dataset, null, 2) + '\n', 'utf8');

if (args.has('--audit') || args.has('--dry-run')) {
  console.log('--- documents ---');
  for (const s of audit.docs) {
    console.log(
      `${String(s.lineStart).padStart(4)}  ${s.id.slice(0, 44).padEnd(45)}` +
        CATEGORY_KEYS.map((k) => `${k.slice(0, 4)}:${String(s.counts[k]).padStart(2)}`).join(' ') +
        (s.missing.length ? `  MISSING[${s.missing.join(',')}]` : '') +
        (s.unclassified ? `  STRAY:${s.unclassified}` : '')
    );
  }
  console.log(`\n--- phrases with no recognisable head noun (filed as destination_nodes) ---`);
  console.log(`count: ${audit.unknownPhrases.length}`);
  for (const p of audit.unknownPhrases.slice(0, 60)) console.log(`  [${p.doc}] ${p.text}`);
  console.log(`\n--- stray lines with no section ---`);
  console.log(`count: ${audit.strayLines.length}`);
  for (const p of audit.strayLines.slice(0, 40)) console.log(`  ${p.line}: ${p.text}`);
  console.log(`\n--- source lines missing from the JSON ---`);
  console.log(`count: ${audit.droppedLines.length}`);
  for (const p of audit.droppedLines.slice(0, 40)) console.log(`  [${p.doc}] ${p.line}: ${p.text}`);
}

totals.sourceContentLines = audit.sourceBullets;
totals.linesPlaced = audit.placedLines;
totals.linesDropped = audit.droppedLines.length;
totals.headNounInferred = audit.inferredPhrases.length;
totals.headNounUnresolved = audit.unknownPhrases.length;

console.log('\n--- totals ---');
console.log(JSON.stringify({ ...totals, perCategory }, null, 2));
if (!args.has('--dry-run')) console.log(`\nwrote ${OUTPUT}`);
