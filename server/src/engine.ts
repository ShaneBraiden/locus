import { QUESTIONS } from './questions.js';
import type {
  Answer, CareerPath, ConstraintEntry, Degree, PracticalConstraints,
  ProfileSignals, ProfileType, QuizOption, RoadmapData, SectionKey, SignalEntry,
} from './types.js';

// Deterministic prediction: no AI in the ranking itself.
// Section intents + profile-type affinity + keyword interest matching + constraints.

const TYPE_AFFINITY: Record<ProfileType, Partial<Record<SectionKey, number>>> = {
  investigator: { research: 2, pgPathways: 2 },
  builder: { industryRoles: 2, entrepreneurship: 2, emerging: 1 },
  connector: { frontlineJobs: 2, civilServices: 1 },
  creator: { emerging: 2, entrepreneurship: 1, research: 1 },
  operator: { frontlineJobs: 2, certifications: 1 },
  strategist: { government: 2, civilServices: 1, industryRoles: 1 },
};

const SECTION_LABEL: Record<SectionKey, string> = {
  pgPathways: 'higher studies',
  frontlineJobs: 'frontline clinical work',
  industryRoles: 'industry roles',
  government: 'government service',
  civilServices: 'civil services',
  globalPathways: 'global pathways',
  certifications: 'certification-first entry',
  entrepreneurship: 'building your own venture',
  research: 'research',
  emerging: 'emerging tech domains',
};

export interface Profile {
  sectionScores: Record<SectionKey, number>;
  typeScores: Record<ProfileType, number>;
  topType: ProfileType;
  tags: string[];
  avoid: string[];
  signals: ProfileSignals;
  constraints: PracticalConstraints;
  reflections: string[];
}

const emptySignal = (): SignalEntry => ({ value: '', label: '', description: '', detected: false });
const emptyConstraint = (): ConstraintEntry => ({ value: '', label: '', detected: false });

export function defaultSignals(): ProfileSignals {
  return {
    openness: emptySignal(), conscientiousness: emptySignal(), extraversion: emptySignal(),
    agreeableness: emptySignal(), stability: emptySignal(), competence: emptySignal(),
    motivation: emptySignal(),
  };
}

export function defaultConstraints(): PracticalConstraints {
  return {
    financial: emptyConstraint(), timeline: emptyConstraint(), geography: emptyConstraint(),
    academic: emptyConstraint(), exams: emptyConstraint(),
  };
}

export function optionFor(a: Answer): QuizOption | undefined {
  if (a.optionIndex < 0) return undefined;
  return QUESTIONS.find((q) => q.id === a.questionId)?.options[a.optionIndex];
}

export function buildProfile(answers: Answer[]): Profile {
  const sectionScores = Object.fromEntries(
    (Object.keys(SECTION_LABEL) as SectionKey[]).map((k) => [k, 0]),
  ) as Record<SectionKey, number>;
  const typeScores: Record<ProfileType, number> = {
    investigator: 0, builder: 0, connector: 0, creator: 0, operator: 0, strategist: 0,
  };
  const tags: string[] = [];
  const avoid: string[] = [];
  const signals = defaultSignals();
  const constraints = defaultConstraints();
  const reflections: string[] = [];

  for (const a of answers) {
    const opt = optionFor(a);
    if (!opt) continue;
    for (const [k, v] of Object.entries(opt.sections ?? {})) sectionScores[k as SectionKey] += v as number;
    for (const [k, v] of Object.entries(opt.types ?? {})) typeScores[k as ProfileType] += v as number;
    tags.push(...(opt.tags ?? []));
    avoid.push(...(opt.avoid ?? []));
    if (opt.signal) signals[opt.signal.key] = { value: opt.signal.value, label: opt.signal.label, description: opt.signal.description, detected: true };
    if (opt.constraint) constraints[opt.constraint.key] = { value: opt.constraint.value, label: opt.constraint.label, detected: true };
    if (opt.reflect) reflections.push(opt.reflect);
  }

  const topType = (Object.entries(typeScores).sort((a, b) => b[1] - a[1])[0][0]) as ProfileType;
  return { sectionScores, typeScores, topType, tags, avoid, signals, constraints, reflections };
}

const TYPE_TITLE: Record<ProfileType, string> = {
  investigator: 'The Investigator — you dig until things make sense',
  builder: 'The Builder — you want to make tangible things happen',
  connector: 'The Connector — people trust you fast, and you use it well',
  creator: 'The Creator — you live slightly in the future',
  operator: 'The Operator — you make hard things run flawlessly',
  strategist: 'The Strategist — you see the whole board',
};

export function reflectionText(name: string, degree: Degree, p: Profile): string {
  const frags = p.reflections.slice(0, 6);
  const lines = frags.length
    ? frags.map((f) => `${f.charAt(0).toUpperCase()}${f.slice(1)}.`).join(' ')
    : 'You answered fast and clear, which itself says something: you know yourself more than you think.';
  return `Okay ${name}, here's what I'm actually seeing in you. ${TYPE_TITLE[p.topType]}. ${lines} And you're doing ${degree.name}, which gives you more doors than most people realize. Tell me — am I close, or am I missing something?`;
}

// ---- Scoring ----

interface Scored { item: Degree['items'][number]; score: number; reasons: string[] }

export function scoreItems(degree: Degree, p: Profile): Scored[] {
  const affinity = TYPE_AFFINITY[p.topType] ?? {};
  const uniqueTags = [...new Set(p.tags)];
  const uniqueAvoid = [...new Set(p.avoid)];

  // Constraint adjustments (elimination pressure, never silent removal)
  const adj: Partial<Record<SectionKey, number>> = {};
  const c = p.constraints;
  if (c.geography.value === 'india') adj.globalPathways = (adj.globalPathways ?? 0) - 6;
  if (c.geography.value === 'flexible') adj.globalPathways = (adj.globalPathways ?? 0) + 3;
  if (c.financial.value === 'tight') {
    adj.pgPathways = (adj.pgPathways ?? 0) - 3;
    adj.certifications = (adj.certifications ?? 0) + 2;
    adj.frontlineJobs = (adj.frontlineJobs ?? 0) + 2;
  }
  if (c.timeline.value === 'immediate') {
    adj.pgPathways = (adj.pgPathways ?? 0) - 5;
    adj.research = (adj.research ?? 0) - 3;
    adj.frontlineJobs = (adj.frontlineJobs ?? 0) + 3;
    adj.certifications = (adj.certifications ?? 0) + 2;
  }
  if (c.timeline.value === 'flexible') {
    adj.pgPathways = (adj.pgPathways ?? 0) + 2;
    adj.research = (adj.research ?? 0) + 2;
  }

  const scored: Scored[] = degree.items.map((item) => {
    const reasons: string[] = [];
    let score = p.sectionScores[item.section] ?? 0;
    if (score > 0) reasons.push(`your answers leaned toward ${SECTION_LABEL[item.section]}`);

    const aff = affinity[item.section] ?? 0;
    if (aff) {
      score += aff;
      reasons.push(`fits your ${p.topType} profile`);
    }

    const hits = uniqueTags.filter((t) => item.blob.includes(t));
    if (hits.length) {
      score += hits.length * 4;
      reasons.push(`matches what energizes you (${hits.slice(0, 3).join(', ')})`);
    }
    const misses = uniqueAvoid.filter((t) => item.blob.includes(t));
    if (misses.length) score -= misses.length * 8;

    score += adj[item.section] ?? 0;
    return { item, score, reasons };
  });

  return scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
}

// ---- CareerPath construction (client contract) ----

const INSIGHTS: Record<SectionKey, Partial<CareerPath['keyInsights']>> = {
  frontlineJobs: { aiRisk: 'Low — hands-on clinical work resists automation', futureDemand: 'High', salaryRange: '₹2.5–6L entry, grows with specialization', estimatedCost: 'Minimal beyond your degree', difficultyToEnter: 'Moderate — registration/license required', overallROI: 'Fast payback' },
  pgPathways: { aiRisk: 'Low-Medium', futureDemand: 'High for specialists', salaryRange: '₹4–12L post-PG, senior roles beyond', estimatedCost: '₹2–8L for the master\'s (varies widely)', difficultyToEnter: 'Entrance exams + 2-3 years study', overallROI: 'Strong long-term' },
  industryRoles: { aiRisk: 'Medium — routine parts automating, judgment stays human', futureDemand: 'Growing', salaryRange: '₹3.5–9L entry-mid', estimatedCost: 'Low — often direct entry or short course', difficultyToEnter: 'Competitive but open', overallROI: 'Good' },
  government: { aiRisk: 'Very Low', futureDemand: 'Stable', salaryRange: 'Pay-commission scales + benefits + pension', estimatedCost: 'Exam prep only', difficultyToEnter: 'High competition, exam-gated', overallROI: 'Excellent security' },
  civilServices: { aiRisk: 'Very Low', futureDemand: 'Stable', salaryRange: '7th CPC scales, senior cadres beyond', estimatedCost: 'Exam prep (1-2 years typical)', difficultyToEnter: 'Very high competition', overallROI: 'High if cleared' },
  globalPathways: { aiRisk: 'Low', futureDemand: 'High — global healthcare shortages', salaryRange: 'Country-dependent; typically 4-10x India entry pay', estimatedCost: '₹1-5L licensing exams + relocation', difficultyToEnter: 'Licensing exams + language/visa process', overallROI: 'Very high if committed', globalMobility: 'Excellent' },
  certifications: { aiRisk: 'Low-Medium', futureDemand: 'Growing', salaryRange: 'Unlocks +20-60% over base roles', estimatedCost: '₹20K–2L per certification', difficultyToEnter: 'Low — months, not years', overallROI: 'Fastest skill-to-salary route' },
  entrepreneurship: { aiRisk: 'Low — founders use AI, not the reverse', futureDemand: 'You create it', salaryRange: 'Unbounded, unstable early', estimatedCost: 'Seed capital varies', difficultyToEnter: 'Low barrier, high survival difficulty', overallROI: 'High risk, high ceiling' },
  research: { aiRisk: 'Low-Medium — AI accelerates, judgment remains human', futureDemand: 'Steady, funding-dependent', salaryRange: 'Stipends early (₹31-35K JRF), grows post-PhD', estimatedCost: 'Often funded (JRF/fellowships)', difficultyToEnter: 'NET/GATE-gated', overallROI: 'Slow build, deep moat' },
  emerging: { aiRisk: 'Low — you would be building the frontier', futureDemand: 'Explosive but early', salaryRange: 'Premium for rare skills, market still forming', estimatedCost: 'Self-learning heavy', difficultyToEnter: 'Few formal routes yet — early-mover advantage', overallROI: 'High variance, high upside' },
};

function orientation(section: SectionKey): { research: number; industry: number } {
  const map: Record<SectionKey, [number, number]> = {
    research: [90, 30], pgPathways: [75, 45], emerging: [65, 70], industryRoles: [35, 85],
    entrepreneurship: [25, 90], certifications: [30, 75], frontlineJobs: [25, 60],
    government: [30, 40], civilServices: [25, 40], globalPathways: [40, 65],
  };
  const [r, i] = map[section];
  return { research: r, industry: i };
}

function buildRoadmap(
  name: string, fieldName: string, degree: Degree, p: Profile,
  ranked: Scored[], backup?: string,
): RoadmapData {
  // Pick the certifications most aligned with this student's answers, not just the first in the doc
  const certs = ranked.filter((s) => s.item.section === 'certifications').slice(0, 3).map((s) => s.item.name);
  const research = ranked.filter((s) => s.item.section === 'research').slice(0, 2).map((s) => s.item.name);
  return {
    whoYouAre: TYPE_TITLE[p.topType],
    fieldName,
    whyThisIsYourField: `Everything you told me — ${p.reflections.slice(0, 3).join('; ')} — points at ${fieldName} harder than anything else in the ${degree.name} universe.`,
    whyThisFieldRightNow: {
      boomSignal: `India's allied-health and life-science sector is expanding into tier-2/3 cities and adding roles like ${fieldName} faster than colleges produce candidates.`,
      aiSafety: INSIGHTS[degree.items.find((i) => i.name === fieldName)?.section ?? 'frontlineJobs']?.aiRisk ?? 'Low',
      indiaOpportunity: `${degree.name} graduates with a focused specialization are still rare — most drift generalist, which is your opening.`,
      trajectory: 'Entry → specialist → lead/consultant is a well-worn ladder here; the first 24 months decide your slope.',
    },
    launchpad90Day: {
      month1: {
        week1: [`Follow 5 working professionals in ${fieldName} on LinkedIn and study their actual job titles`, `Read 2 recent articles on ${fieldName} in India`, 'Write down the 3 questions you most want answered about this path'],
        week2: [`Message 2 of those professionals with one specific question each`, `Map which of your current subjects feed directly into ${fieldName}`],
        week3_4: [`Do one small hands-on project or shadowing day related to ${fieldName}`, 'Summarize what surprised you — this becomes interview material'],
      },
      month2: {
        certifications: certs.length ? certs : ['One foundational certification in your field (ask a working professional which one actually matters)'],
        platforms: ['LinkedIn (profile rewritten around the target role)', 'Coursera/SWAYAM for one structured course', research.length ? `Explore: ${research[0]}` : 'One journal or industry newsletter subscription'],
        linkedinConnections: [`10 professionals currently working in ${fieldName}`, `2 alumni from your college in adjacent roles`, '1 recruiter who hires for this field'],
      },
      month3: {
        targets: [`Shortlist 10 organizations that hire for ${fieldName}`, 'Identify the exact entry designation you will apply for'],
        deliverables: ['One-page CV targeted at that designation', 'A 200-word "why this field" story you can say out loud'],
        milestones: ['First 3 applications or one confirmed internship/observership', 'One mock interview with honest feedback'],
      },
    },
    backupPath: {
      field: backup ?? 'The #2 path on your list',
      reason: 'It scored nearly as high on your answers and shares most of the same first steps, so no month is wasted if you pivot.',
      firstStep: 'Keep it warm: one LinkedIn follow and one saved job alert. Nothing more until month 3.',
    },
    holdingYouBack: {
      tendency: p.topType === 'investigator' ? 'You over-research and under-commit — one more article always feels safer than one real step.'
        : p.topType === 'operator' ? 'You wait for perfect instructions when this phase actually rewards messy first attempts.'
        : p.topType === 'connector' ? 'You optimize for everyone else\'s comfort and postpone your own calls.'
        : p.topType === 'creator' ? 'You start brilliantly and drift when the novelty fades — the 90-day plan is your antidote.'
        : p.topType === 'builder' ? 'You want results so fast you may skip the boring credential that actually unlocks the door.'
        : 'You strategize so well you can talk yourself out of starting. Start ugly.',
      solution: 'Do the week-1 checklist before you feel ready. Momentum first, confidence follows.',
    },
  };
}

export function buildCareerPaths(degree: Degree, p: Profile, topN = 5): CareerPath[] {
  const allRanked = scoreItems(degree, p);
  const ranked = allRanked.slice(0, Math.max(topN * 3, 15));

  // Prefer name-diverse top picks (avoid 5 near-identical nursing wards)
  const picked: Scored[] = [];
  for (const s of ranked) {
    if (picked.length >= topN) break;
    const firstWord = s.item.name.split(' ')[0].toLowerCase();
    const dupes = picked.filter((x) => x.item.name.split(' ')[0].toLowerCase() === firstWord);
    if (dupes.length >= 2) continue;
    picked.push(s);
  }
  while (picked.length < topN && picked.length < ranked.length) {
    const next = ranked.find((r) => !picked.includes(r));
    if (!next) break;
    picked.push(next);
  }

  const max = picked[0]?.score ?? 1;
  const min = picked[picked.length - 1]?.score ?? 0;
  const span = Math.max(1, max - min);

  return picked.map((s, i) => {
    // Rank-anchored with a mild score-proportional pull: 97, ~91, ~85... without
    // one low outlier collapsing everyone else's spread.
    const ms = Math.round(97 - i * 5 - 8 * ((max - s.score) / span));
    const conf: CareerPath['confidence'] = ms >= 88 ? 'Very High' : ms >= 76 ? 'High' : ms >= 64 ? 'Medium' : 'Low';
    const ins = INSIGHTS[s.item.section] ?? {};
    const o = orientation(s.item.section);
    const backup = picked[i === 0 ? 1 : 0]?.item.name;
    return {
      id: s.item.id,
      fieldName: s.item.name,
      matchScore: Math.min(97, Math.max(50, ms)),
      confidence: conf,
      oneLineRecommendation: `A ${SECTION_LABEL[s.item.section]} route out of ${degree.name} that lines up with how you actually answered, not how people usually guess.`,
      whyThisMatchesYou: s.reasons.length ? [...new Set(s.reasons)].slice(0, 4) : ['Solid general fit with your degree and answer pattern'],
      heroImage: `https://picsum.photos/seed/${encodeURIComponent(s.item.id)}/800/400`,
      keyInsights: {
        aiRisk: ins.aiRisk ?? 'Low-Medium',
        futureDemand: ins.futureDemand ?? 'Growing',
        salaryRange: ins.salaryRange ?? 'Varies by city and institution',
        researchOrientation: o.research,
        industryOrientation: o.industry,
        globalMobility: ins.globalMobility ?? (s.item.section === 'globalPathways' ? 'Excellent' : 'Moderate'),
        workLifeBalance: s.item.section === 'frontlineJobs' ? 'Shift-based, intense early years' : s.item.section === 'entrepreneurship' ? 'You set it — and it will test you' : 'Generally balanced',
        scholarshipAvailability: s.item.section === 'research' || s.item.section === 'pgPathways' ? 'Good (JRF, institutional fellowships)' : 'Limited',
        estimatedCost: ins.estimatedCost ?? 'Varies',
        overallROI: ins.overallROI ?? 'Good',
        difficultyToEnter: ins.difficultyToEnter ?? 'Moderate',
      },
      roadmap: buildRoadmap('', s.item.name, degree, p, allRanked, backup),
    };
  });
}
