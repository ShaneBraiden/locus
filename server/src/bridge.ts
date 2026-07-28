import { defaultConstraints, defaultSignals, type Profile } from './engine.js';
import { itemById, items, optionById } from './psychometrics.js';
import type {
  PracticalConstraints, ProfileSignals, ProfileType, PsychAnswer, SectionKey,
} from './types.js';

// Translates the LOCUS psychometric layer into the vocabulary engine.ts already
// speaks (section intents, profile types, keyword tags, signals, constraints),
// so the 26-degree topology ranking keeps working unchanged.
//
// The psychometric instrument measures who someone is. It says nothing about
// what they can afford or when they need to start earning, which the topology
// engine's constraint pass depends on — hence PRACTICAL_ITEMS below.

interface ConstructMapping {
  types?: Partial<Record<ProfileType, number>>;
  sections?: Partial<Record<SectionKey, number>>;
  tags?: string[];
  signal?: { key: keyof ProfileSignals; value: string; label: string; description: string };
  reflect?: string;
}

const sig = (
  key: keyof ProfileSignals, value: string, label: string, description: string,
) => ({ key, value, label, description });

/**
 * One row per construct tag emitted by docs/parse-psychometrics.mjs.
 * The Holland -> ProfileType mapping is deliberately aligned with engine.ts's
 * TYPE_AFFINITY table so the two layers reinforce each other instead of
 * pulling in different directions.
 */
const CONSTRUCT_MAP: Record<string, ConstructMapping> = {
  // ---- Holland RIASEC: the strongest environment-fit signal we have -------
  'holland:R': {
    types: { builder: 3 },
    sections: { frontlineJobs: 2, industryRoles: 1 },
    tags: ['technician', 'equipment', 'hands-on', 'operating', 'field', 'theatre'],
    reflect: 'you trust your hands and want the work to be real',
  },
  'holland:I': {
    types: { investigator: 3 },
    sections: { research: 3, pgPathways: 2 },
    tags: ['research', 'analysis', 'laboratory', 'diagnostic', 'evidence', 'clinical research'],
    reflect: 'you dig until a thing actually makes sense',
  },
  'holland:A': {
    types: { creator: 3 },
    sections: { emerging: 2, entrepreneurship: 1 },
    tags: ['design', 'content', 'communication', 'media', 'creative'],
    reflect: 'you need room to make something that looks like you',
  },
  'holland:S': {
    types: { connector: 3 },
    sections: { frontlineJobs: 2, civilServices: 1 },
    tags: ['counselling', 'education', 'patient', 'community', 'training', 'care'],
    reflect: 'people open up around you, and you actually like that',
  },
  'holland:E': {
    types: { strategist: 3 },
    sections: { entrepreneurship: 3, industryRoles: 2 },
    tags: ['startup', 'business', 'management', 'sales', 'consulting', 'venture'],
    reflect: 'you would rather own the outcome than be handed it',
  },
  'holland:C': {
    types: { operator: 3 },
    sections: { government: 2, certifications: 2 },
    tags: ['compliance', 'quality', 'documentation', 'regulatory', 'audit', 'coding'],
    reflect: 'you make hard things run without drama',
  },

  // ---- Big Five ----------------------------------------------------------
  'ocean:openness_high': {
    types: { creator: 1 }, sections: { emerging: 2, research: 1 },
    signal: sig('openness', 'high', 'Open to the unproven', 'Ambiguity energizes you rather than stalling you'),
    reflect: 'an open-ended brief excites you instead of scaring you',
  },
  'ocean:openness_mid_high': {
    sections: { emerging: 1 },
    signal: sig('openness', 'medium', 'Curious with guardrails', 'You will try the new thing once you can see its shape'),
  },
  'ocean:openness_low': {
    types: { operator: 1 }, sections: { certifications: 1, government: 1 },
    signal: sig('openness', 'grounded', 'Prefers clear ground', 'You do your best work when the rules are legible'),
    reflect: 'you want the brief clear before you commit',
  },
  'ocean:conscientiousness_high': {
    types: { operator: 2 }, sections: { certifications: 1 },
    signal: sig('conscientiousness', 'high', 'Finisher', 'You plan early and you close what you open'),
    reflect: 'you finish what you start, even when nobody is checking',
  },
  'ocean:conscientiousness_mid': {
    signal: sig('conscientiousness', 'balanced', 'Balanced', 'You pace yourself rather than sprinting or stalling'),
  },
  'ocean:conscientiousness_low': {
    signal: sig('conscientiousness', 'strategic', 'Pressure-driven', 'You do your sharpest work close to a deadline'),
    reflect: 'you work best when the deadline is breathing on you',
  },
  'ocean:extraversion_high': {
    types: { connector: 2 },
    signal: sig('extraversion', 'high', 'Charged by people', 'Energy comes from the room, not from solitude'),
    reflect: 'other people charge you up rather than drain you',
  },
  'ocean:extraversion_low': {
    types: { investigator: 2 }, sections: { research: 1 },
    signal: sig('extraversion', 'low', 'Deep worker', 'You need quiet to do anything that matters'),
    reflect: 'you need quiet to do the work that matters',
  },
  'ocean:extraversion_mid': {
    signal: sig('extraversion', 'medium', 'Small-group person', 'A trusted handful beats a crowd or total solitude'),
  },
  'ocean:agreeableness_high': {
    types: { connector: 1 },
    signal: sig('agreeableness', 'glue', 'The glue', 'You keep groups intact, sometimes at your own cost'),
  },
  'ocean:agreeableness_low': {
    types: { strategist: 1 },
    signal: sig('agreeableness', 'leader', 'Will say the hard thing', 'You would rather name the problem than absorb it'),
    reflect: 'you say the uncomfortable thing when it needs saying',
  },
  'ocean:stability_high': {
    signal: sig('stability', 'high', 'Steady under load', 'Pressure is just part of the process for you'),
    reflect: 'pressure does not rattle you the way it rattles most people',
  },
  'ocean:stability_mid': {
    signal: sig('stability', 'planner', 'Nerves that sharpen', 'Nerves show up, then push you to prepare harder'),
  },
  'ocean:stability_low': {
    signal: sig('stability', 'medium', 'Feels it first', 'High stakes land hard before you settle into them'),
  },

  // ---- Self-Determination Theory ----------------------------------------
  'sdt:autonomy_high': {
    types: { strategist: 1 }, sections: { entrepreneurship: 2 },
    signal: sig('motivation', 'growth', 'Self-directed', 'You want the decision to be genuinely yours'),
    reflect: 'you want the call to be yours, even when it is harder',
  },
  'sdt:autonomy_mid': { sections: { entrepreneurship: 1 } },
  'sdt:autonomy_low': {
    sections: { government: 1 },
    signal: sig('motivation', 'security', 'Externally anchored', 'Other people’s expectations carry real weight right now'),
    reflect: 'other people’s expectations still carry a lot of weight for you',
  },
  'sdt:competence_high': {
    types: { investigator: 1 }, sections: { pgPathways: 1 },
    signal: sig('competence', 'scholar', 'Knows their edge', 'You can name what you are good at without flinching'),
    reflect: 'you already know what you are good at',
  },
  'sdt:competence_mid': {
    signal: sig('competence', 'pragmatic', 'Still mapping it', 'You are working out where your strengths actually sit'),
  },
  'sdt:competence_low': {
    signal: sig('competence', 'practitioner', 'Undersells themselves', 'You rate others above yourself more often than the evidence supports'),
    reflect: 'you undersell yourself more than the evidence justifies',
  },
  'sdt:relatedness': { types: { connector: 1 } },
  'sdt:relatedness_low': {},
  'sdt:intrinsic': {
    sections: { research: 1, entrepreneurship: 1 },
    signal: sig('motivation', 'growth', 'Driven from inside', 'The work itself is the reward, not the title around it'),
    reflect: 'the work itself matters to you more than what it is called',
  },
  'sdt:extrinsic': {
    sections: { government: 1, certifications: 1 },
    signal: sig('motivation', 'security', 'Security-first', 'Stability and standing are doing a lot of the driving'),
  },
  'sdt:extrinsic_security': {
    sections: { government: 2, certifications: 1 },
    reflect: 'stability is not a small thing for you, and that is fair',
  },
  'sdt:extrinsic_approval': {
    reflect: 'you carry other people’s hopes in your decisions',
  },
  'sdt:mastery': {
    types: { investigator: 1 }, sections: { pgPathways: 2, research: 1 },
    reflect: 'you want to be genuinely good, not just employed',
  },
  'sdt:purpose': {
    types: { connector: 1 }, sections: { civilServices: 1, frontlineJobs: 1 },
    tags: ['public health', 'community', 'welfare', 'rural'],
    reflect: 'you want the work to matter to someone other than you',
  },

  // ---- Multiple Intelligences -------------------------------------------
  'mi:logical': {
    types: { investigator: 2 }, sections: { research: 1, emerging: 1 },
    tags: ['data', 'informatics', 'biostatistics', 'analytics', 'statistics'],
    reflect: 'you reach for the numbers before the story',
  },
  'mi:linguistic': {
    sections: { emerging: 1, government: 1 },
    tags: ['writing', 'documentation', 'medical writing', 'policy', 'regulatory'],
  },
  'mi:spatial': {
    types: { creator: 1 },
    tags: ['imaging', 'radiology', 'design', 'visualisation', 'anatomy'],
  },
  'mi:interpersonal': {
    types: { connector: 2 }, sections: { frontlineJobs: 1 },
    tags: ['counselling', 'coordinator', 'liaison', 'training'],
  },
  'mi:intrapersonal': {
    signal: sig('competence', 'scholar', 'Self-aware', 'You can see your own patterns clearly'),
  },
  'mi:intrapersonal_low': {},
  'mi:bodily': {
    types: { builder: 2 }, sections: { frontlineJobs: 1 },
    tags: ['therapy', 'physiotherapy', 'rehabilitation', 'procedural', 'hands-on'],
    reflect: 'you learn things properly only by doing them',
  },
  'mi:musical': { types: { creator: 1 }, tags: ['audiology', 'speech', 'acoustics'] },
  'mi:naturalistic': {
    sections: { research: 1 },
    tags: ['environment', 'public health', 'epidemiology', 'agriculture', 'ecology'],
  },

  // ---- Career decision-making readiness ---------------------------------
  'cdm:crystallization': {
    sections: { pgPathways: 1 },
    reflect: 'you already have a direction and you are moving on it',
  },
  'cdm:exploration': { sections: { certifications: 1 } },
  'cdm:precontemplation': {
    reflect: 'you have not really let yourself think about this yet',
  },
  'cdm:paralysis': {
    reflect: 'the fear of choosing wrong is doing more damage than any wrong choice would',
  },
  'cdm:systematic': {
    types: { strategist: 1 }, sections: { pgPathways: 1, globalPathways: 1 },
    reflect: 'you research a decision properly before you make it',
  },
  'cdm:intuitive': {
    types: { builder: 1 },
    reflect: 'you trust your gut and move fast',
  },
  'cdm:dependent': {
    reflect: 'you check with people you trust before you commit',
  },
  'cdm:avoidant': {
    reflect: 'you tend to let deadlines make the decision for you',
  },
  'cdm:happenstance_high': {
    types: { builder: 1 }, sections: { entrepreneurship: 1, emerging: 1 },
    reflect: 'an unexpected door opens and you walk through it',
  },
  'cdm:happenstance_low': { sections: { pgPathways: 1 } },

  // ---- Leftover colour ---------------------------------------------------
  'meta:self_aware_high': {
    signal: sig('competence', 'scholar', 'Reads themselves well', 'You know your strengths, limits and values without prompting'),
  },
  'meta:self_aware_mid': {},
  'meta:risk_averse': { sections: { government: 1, certifications: 1 } },
  'meta:assertive': { types: { strategist: 1 } },
  'meta:conflict_avoidant': {},
  'meta:low_engagement': {},
};

/**
 * Keywords to penalise when a student is repeatedly offered a Holland letter
 * and never once picks it. The engine's `avoid` list carries a -8 per hit,
 * deliberately heavier than the +4 for interest, because a clear dislike is
 * more predictive than a mild preference.
 */
const AVOID_KEYWORDS: Record<string, string[]> = {
  'holland:R': ['technician', 'equipment maintenance', 'theatre'],
  'holland:I': ['research', 'laboratory', 'phd'],
  'holland:A': ['design', 'creative', 'media'],
  'holland:S': ['counselling', 'community', 'teaching'],
  'holland:E': ['startup', 'sales', 'venture'],
  'holland:C': ['documentation', 'audit', 'compliance'],
};

/** A Holland letter must be on the table this often before silence means anything. */
const AVOID_MIN_OPPORTUNITIES = 5;

// -------------------------------------------------------- practical items

export interface PracticalOption {
  id: string;
  letter: string;
  label: string;
  sections?: Partial<Record<SectionKey, number>>;
  tags?: string[];
  reflect?: string;
  constraint: { key: keyof PracticalConstraints; value: string; label: string };
}

export interface PracticalItem {
  id: string;
  text: string;
  options: PracticalOption[];
}

/**
 * The three things the workbook does not ask about but engine.ts needs.
 * Constraint payloads are lifted from the corresponding options in
 * questions.ts so the downstream scoring behaves identically.
 */
export const PRACTICAL_ITEMS: PracticalItem[] = [
  {
    id: 'x1',
    text: 'When do you realistically need to start earning your own money?',
    options: [
      {
        id: 'x1a', letter: 'A', label: 'Within a year — it is not optional',
        sections: { frontlineJobs: 3, certifications: 2 },
        reflect: 'you need income soon and your path has to respect that',
        constraint: { key: 'timeline', value: 'immediate', label: 'Income needed within a year' },
      },
      {
        id: 'x1b', letter: 'B', label: 'I can give it two or three years first',
        sections: { pgPathways: 2 },
        reflect: 'you can invest a couple of years before the payoff',
        constraint: { key: 'timeline', value: '2-3 years', label: 'Can invest 2-3 years first' },
      },
      {
        id: 'x1c', letter: 'C', label: 'No real pressure — I can take the long route',
        sections: { pgPathways: 2, research: 2, globalPathways: 1 },
        reflect: 'you have runway, which means you can aim high',
        constraint: { key: 'timeline', value: 'flexible', label: 'No income pressure' },
      },
    ],
  },
  {
    id: 'x2',
    text: 'If the right next step meant more studying, could that be funded?',
    options: [
      {
        id: 'x2a', letter: 'A', label: 'Yes, my family can support it',
        reflect: 'money will not be the thing that decides your path',
        constraint: { key: 'financial', value: 'comfortable', label: 'Can fund further study' },
      },
      {
        id: 'x2b', letter: 'B', label: 'Not really — it would have to pay for itself',
        sections: { frontlineJobs: 2, certifications: 2 },
        reflect: 'your plan has to pay for itself early',
        constraint: { key: 'financial', value: 'tight', label: 'Needs early income' },
      },
      {
        id: 'x2c', letter: 'C', label: 'Only with a scholarship or a stipend',
        sections: { research: 1, government: 1 },
        reflect: 'you will study more only if someone else funds it',
        constraint: { key: 'financial', value: 'scholarship', label: 'Needs funded pathways' },
      },
    ],
  },
  {
    id: 'x3',
    text: 'Do you see yourself building this life in India, or somewhere else?',
    options: [
      {
        id: 'x3a', letter: 'A', label: 'Open to going abroad for it',
        sections: { globalPathways: 3, certifications: 1 },
        tags: ['abroad', 'global', 'international', 'uk', 'usa', 'australia', 'gulf', 'nclex', 'hcpc', 'dha'],
        reflect: 'you see your career on a world map, not just an India map',
        constraint: { key: 'geography', value: 'flexible', label: 'Open to relocating abroad' },
      },
      {
        id: 'x3b', letter: 'B', label: 'India, clearly',
        sections: { government: 1, civilServices: 1 },
        reflect: 'your future is here, and you are clear about that',
        constraint: { key: 'geography', value: 'india', label: 'Prefers to stay in India' },
      },
      {
        id: 'x3c', letter: 'C', label: 'India first, maybe abroad later',
        sections: { globalPathways: 1 },
        reflect: 'you want roots first, wings later',
        constraint: { key: 'geography', value: 'later', label: 'Abroad possible later' },
      },
    ],
  },
];

const practicalOptionIndex = new Map<string, { item: PracticalItem; option: PracticalOption }>();
for (const item of PRACTICAL_ITEMS) {
  for (const option of item.options) practicalOptionIndex.set(option.id, { item, option });
}

export const isPracticalItem = (itemId: string) => PRACTICAL_ITEMS.some((i) => i.id === itemId);

export function practicalOptionById(id: string) {
  return practicalOptionIndex.get(id);
}

// -------------------------------------------------------- unified item view

export interface InterviewItem {
  id: string;
  text: string;
  kind: 'psych' | 'practical';
  options: { id: string; letter: string; label: string }[];
}

let interviewCache: InterviewItem[] | null = null;

/** The 25 psychometric items followed by the 3 practical ones. */
export function interviewItems(): InterviewItem[] {
  if (interviewCache) return interviewCache;
  interviewCache = [
    ...items().map((i) => ({
      id: i.id,
      text: i.text,
      kind: 'psych' as const,
      options: i.options.map((o) => ({ id: o.id, letter: o.letter, label: o.label })),
    })),
    ...PRACTICAL_ITEMS.map((i) => ({
      id: i.id,
      text: i.text,
      kind: 'practical' as const,
      options: i.options.map((o) => ({ id: o.id, letter: o.letter, label: o.label })),
    })),
  ];
  return interviewCache;
}

export function interviewItemById(id: string): InterviewItem | undefined {
  return interviewItems().find((i) => i.id === id);
}

export const interviewItemCount = () => interviewItems().length;

/** True when `optionId` really belongs to `itemId`. Used to sanitise client state. */
export function isValidAnswer(itemId: string, optionId: string): boolean {
  const psych = optionById(optionId);
  if (psych) return psych.item.id === itemId;
  const practical = practicalOptionById(optionId);
  return practical ? practical.item.id === itemId : false;
}

// -------------------------------------------------------- profile assembly

/**
 * Folds psychometric and practical answers into the Profile shape engine.ts
 * consumes. Mirrors buildProfile() in engine.ts, but sourced from construct
 * tags rather than the 15-question option weights.
 */
export function buildPsychProfile(answers: PsychAnswer[]): Profile {
  const sectionScores: Record<SectionKey, number> = {
    pgPathways: 0, frontlineJobs: 0, industryRoles: 0, government: 0, civilServices: 0,
    globalPathways: 0, certifications: 0, entrepreneurship: 0, research: 0, emerging: 0,
  };
  const typeScores: Record<ProfileType, number> = {
    investigator: 0, builder: 0, connector: 0, creator: 0, operator: 0, strategist: 0,
  };
  const tags: string[] = [];
  const avoid: string[] = [];
  const signals = defaultSignals();
  const constraints = defaultConstraints();

  // Reflections are collected with the tag that produced them so the most
  // evidenced traits can be surfaced first, rather than whatever came last.
  const reflectWeight = new Map<string, number>();
  const reflectText = new Map<string, string>();

  const tagCounts = new Map<string, number>();
  const seen = new Set<string>();

  for (const a of answers) {
    if (seen.has(a.itemId)) continue;

    const practical = practicalOptionById(a.optionId);
    if (practical && practical.item.id === a.itemId) {
      seen.add(a.itemId);
      const o = practical.option;
      for (const [k, v] of Object.entries(o.sections ?? {})) {
        sectionScores[k as SectionKey] += v as number;
      }
      tags.push(...(o.tags ?? []));
      constraints[o.constraint.key] = {
        value: o.constraint.value, label: o.constraint.label, detected: true,
      };
      if (o.reflect) {
        reflectWeight.set(`x:${o.id}`, 2);
        reflectText.set(`x:${o.id}`, o.reflect);
      }
      continue;
    }

    const hit = optionById(a.optionId);
    if (!hit || hit.item.id !== a.itemId) continue;
    seen.add(a.itemId);

    for (const tag of hit.option.constructTags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      const map = CONSTRUCT_MAP[tag];
      if (!map) continue;
      for (const [k, v] of Object.entries(map.sections ?? {})) {
        sectionScores[k as SectionKey] += v as number;
      }
      for (const [k, v] of Object.entries(map.types ?? {})) {
        typeScores[k as ProfileType] += v as number;
      }
      tags.push(...(map.tags ?? []));
      if (map.reflect) {
        reflectWeight.set(tag, (reflectWeight.get(tag) ?? 0) + 1);
        reflectText.set(tag, map.reflect);
      }
    }
  }

  // Signals are written after the counting pass so the most-evidenced value for
  // each signal wins, instead of whichever answer happened to come last.
  const bySignal = new Map<keyof ProfileSignals, { count: number; entry: NonNullable<ConstructMapping['signal']> }>();
  for (const [tag, count] of tagCounts) {
    const entry = CONSTRUCT_MAP[tag]?.signal;
    if (!entry) continue;
    const current = bySignal.get(entry.key);
    if (!current || count > current.count) bySignal.set(entry.key, { count, entry });
  }
  for (const [key, { entry }] of bySignal) {
    signals[key] = {
      value: entry.value, label: entry.label, description: entry.description, detected: true,
    };
  }

  // Evidence-based dislikes: a Holland letter offered again and again and never
  // chosen once is a real signal, not an absence of one.
  const offered = new Map<string, number>();
  for (const itemId of seen) {
    const item = itemById(itemId);
    if (!item) continue;
    const lettersHere = new Set<string>();
    for (const o of item.options) {
      for (const t of o.constructTags) if (t.startsWith('holland:')) lettersHere.add(t);
    }
    for (const t of lettersHere) offered.set(t, (offered.get(t) ?? 0) + 1);
  }
  for (const [letter, chances] of offered) {
    if (chances >= AVOID_MIN_OPPORTUNITIES && !tagCounts.has(letter)) {
      avoid.push(...(AVOID_KEYWORDS[letter] ?? []));
    }
  }

  const reflections = [...reflectWeight.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => reflectText.get(tag)!)
    .filter(Boolean);

  const topType = (Object.entries(typeScores).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0][0]) as ProfileType;

  return { sectionScores, typeScores, topType, tags, avoid, signals, constraints, reflections };
}
