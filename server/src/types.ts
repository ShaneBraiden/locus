// Shapes mirrored from client/src/types.ts — the client contract.
// Do not rename fields here without updating the client.

export type Phase =
  | 'phase1'
  | 'phase2'
  | 'reflection'
  | 'constraints'
  | 'recommendation'
  | 'roadmap'
  | 'services'
  | 'closing';

export interface Message {
  id: string;
  sender: 'user' | 'fab' | 'aryan';
  text: string;
  timestamp: string;
  options?: string[];
  selectedOption?: string;
  /** How the turn arrived. Absent means typed; both share one conversation. */
  channel?: 'text' | 'voice';
  /** BCP-47 language a spoken turn was heard in. */
  language?: string;
}

export interface SignalEntry {
  value: string;
  label: string;
  description: string;
  detected: boolean;
}

export interface ProfileSignals {
  openness: SignalEntry;
  conscientiousness: SignalEntry;
  extraversion: SignalEntry;
  agreeableness: SignalEntry;
  stability: SignalEntry;
  competence: SignalEntry;
  motivation: SignalEntry;
}

export interface ConstraintEntry {
  value: string;
  label: string;
  detected: boolean;
}

export interface PracticalConstraints {
  financial: ConstraintEntry;
  timeline: ConstraintEntry;
  geography: ConstraintEntry;
  academic: ConstraintEntry;
  exams: ConstraintEntry;
}

export interface RoadmapData {
  whoYouAre: string;
  fieldName: string;
  whyThisIsYourField: string;
  whyThisFieldRightNow: {
    boomSignal: string;
    aiSafety: string;
    indiaOpportunity: string;
    trajectory: string;
  };
  launchpad90Day: {
    month1: { week1: string[]; week2: string[]; week3_4: string[] };
    month2: { certifications: string[]; platforms: string[]; linkedinConnections: string[] };
    month3: { targets: string[]; deliverables: string[]; milestones: string[] };
  };
  backupPath: { field: string; reason: string; firstStep: string };
  holdingYouBack: { tendency: string; solution: string };
}

export interface CareerPath {
  id: string;
  fieldName: string;
  matchScore: number;
  confidence: 'Very High' | 'High' | 'Medium' | 'Low';
  oneLineRecommendation: string;
  whyThisMatchesYou: string[];
  heroImage: string;
  keyInsights: {
    aiRisk: string;
    futureDemand: string;
    salaryRange: string;
    researchOrientation: number;
    industryOrientation: number;
    globalMobility: string;
    workLifeBalance: string;
    scholarshipAvailability: string;
    estimatedCost: string;
    overallROI: string;
    difficultyToEnter: string;
  };
  roadmap: RoadmapData;
}

// ---- Server-internal types ----

export type SectionKey =
  | 'pgPathways'
  | 'frontlineJobs'
  | 'industryRoles'
  | 'government'
  | 'civilServices'
  | 'globalPathways'
  | 'certifications'
  | 'entrepreneurship'
  | 'research'
  | 'emerging';

export type ProfileType =
  | 'investigator'
  | 'builder'
  | 'connector'
  | 'creator'
  | 'operator'
  | 'strategist';

export interface TopologyItem {
  id: string;
  name: string;
  section: SectionKey;
  blob: string; // lowercase searchable text: name + settings + roles + description
}

export interface Degree {
  id: string;
  name: string;
  aliases: string[];
  regulatoryFramework: string;
  items: TopologyItem[];
}

export interface QuizOption {
  label: string;
  react?: string; // short FAB reaction when picked
  reflect?: string; // fragment used in the reflection moment
  sections?: Partial<Record<SectionKey, number>>;
  types?: Partial<Record<ProfileType, number>>;
  tags?: string[]; // +4 per keyword hit in an item blob
  avoid?: string[]; // -8 per keyword hit
  signal?: { key: keyof ProfileSignals; value: string; label: string; description: string };
  constraint?: { key: keyof PracticalConstraints; value: string; label: string };
}

export interface QuizQuestion {
  id: string;
  text: string;
  probe: string; // distinctive substring used to recognize this question in history
  options: QuizOption[];
}

export interface Answer {
  questionId: string;
  optionIndex: number; // -1 = unmatched free-text answer (no weights applied)
  rawText: string;
}

// ---- Psychometric layer (LOCUS instrument, docs/psychometric-items.json) ----

/** One settled item. `optionId` indexes into the committed item bank. */
export interface PsychAnswer {
  itemId: string;
  optionId: string;
  rawText: string;
  /** How sure the classifier was. 1 when the student clicked the option. */
  confidence?: number;
}

export interface TheoryScores {
  h: number; // Holland RIASEC
  o: number; // Big Five OCEAN
  s: number; // Self-Determination Theory
  m: number; // Multiple Intelligences
  d: number; // Career Decision-Making
}

export interface PsychScores {
  raw: TheoryScores;
  /** 0-100 per theory, normalised by what was actually answered. */
  pct: TheoryScores;
  ccfs: number;
  adjustedCcfs: number;
  sdtFlag: boolean; // pct.s < 50 — the 0.85x motivation-quality penalty applied
  sdtWarning: boolean; // pct.s < 35 — surface "your motivation appears external"
  answered: number;
  total: number;
}

export interface CareerMatch {
  careerId: string;
  name: string;
  domain: string;
  fitScore: number;
  status: 'best_fit' | 'consider' | 'mismatch';
  rank: number;
}

/**
 * Explicit conversation state, round-tripped through the client so the server
 * stays stateless. Replaces the old approach of re-deriving position by
 * substring-matching FAB's own past messages, which cannot survive questions
 * that Gemini phrases differently every time.
 *
 * Never trusted as-is: `sanitizeAssessment` re-validates every field.
 */
export interface AssessmentState {
  v: 1;
  name: string | null;
  degreeId: string | null;
  answers: PsychAnswer[];
  /** itemId -> follow-ups already spent, so a vague student cannot stall us. */
  followUps: Record<string, number>;
  /** Items we gave up on after too many follow-ups. Counted as covered. */
  skipped: string[];
  /** The item FAB's last message was actually asking about. */
  targetItemId: string | null;
  /** Set when Gemini was unreachable and we served the raw item as MCQ. */
  fallbackItemId?: string | null;
  reflectionShown: boolean;
  reflectionAnswered: boolean;
  recommendationShown: boolean;
}

/**
 * The student's long-term memory, one record per account. Unlike
 * AssessmentState it outlives a single chat session, and both the typed and
 * the spoken path read and write the same copy — see server/src/memory.ts.
 *
 * Server-owned: it is never accepted from a request body.
 */
export interface UserContext {
  v: 1;
  userId: string;
  name: string | null;
  degreeId: string | null;
  degreeName: string | null;
  /** BCP-47 code FAB speaks to them in. `en-IN` unless voice detected otherwise. */
  language: string;
  /** Deterministic reflections from the committed item bank, not model output. */
  traits: string[];
  topPaths: { fieldName: string; matchScore: number }[];
  fitScore: number | null;
  motivationNote: string | null;
  /** Things the student said, verbatim, that no scored item captures. */
  notes: { text: string; at: string }[];
  turns: { text: number; voice: number };
  firstSeen: string;
  lastSeen: string;
}

/** What the client needs to render the psychometric read. */
export interface PsychReadout {
  scores: PsychScores;
  topMatches: CareerMatch[];
  secondaryMatches: CareerMatch[];
  motivationNote: string | null;
  /** Careers the topology engine also surfaced — the strongest signal we have. */
  convergentCareers: string[];
}
