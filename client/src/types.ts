// FAB TYPES — ADDITIVE, ported verbatim from Ajith's northr-main build.
// These are FAB's own vocabulary (ChatSession, CareerPath, RoadmapData, etc.)
// and are kept unmodified so FAB's prompt/schema contract stays intact.
// Do not rename fields here without also updating src/server/fabChat.ts.
// ============================================================================
export type Phase =
  | 'phase1' // Become Friends (5-7 exchanges)
  | 'phase2' // Understand Who They Are (8-12 exchanges)
  | 'reflection' // Reflection Moment (Bridge)
  | 'constraints' // Collect remaining constraints
  | 'recommendation' // Step 3: The Recommendation
  | 'roadmap' // Step 4: The Clarity Roadmap
  | 'services' // Step 5: Value Added Services
  | 'closing'; // Step 6: Closing

export type ReadinessStage = 'Exploration' | 'Preparation' | 'Application' | 'Finalization';

export interface ReadinessGap {
  category: 'Academic' | 'Exam' | 'Profile' | 'Financial' | 'Decision';
  issue: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface CareerConfidence {
  careerPathway: string;
  score: number; // 0-100
  lastUpdated: string;
  evidenceCount: number; // how many signals contributed to this score
}

export interface ExecutionEngineData {
  readinessStage: ReadinessStage;
  decisionConfidence: number; // 0-100
  gaps: ReadinessGap[];
  nextBestAction: {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    impact: 'High' | 'Medium' | 'Low';
  };
}

export interface Message {
  id: string;
  sender: 'user' | 'fab' | 'aryan';
  text: string;
  timestamp: string;
  options?: string[]; // For scenario questions (MCQ)
  selectedOption?: string; // If user clicked an MCQ option
  /** How the turn arrived. Absent means typed; both share one conversation. */
  channel?: 'text' | 'voice';
  /** BCP-47 language a spoken turn was heard in, or spoken back in. */
  language?: string;
  /**
   * What FAB actually said out loud, when that differs from `text` — i.e. the
   * student is not on English. `text` stays the canonical English transcript
   * the interviewer reasons over; this is only ever displayed.
   */
  spokenText?: string;
}

/** A language Sarvam can both hear and speak. Served by /api/voice/status. */
export interface VoiceLanguage {
  code: string;
  label: string;
}

/**
 * What FAB remembers about the student across every conversation, typed or
 * spoken. Server-owned (see server/src/memory.ts) — read-only here.
 */
export interface UserMemory {
  name: string | null;
  degreeName: string | null;
  /** Year of study, collected at onboarding. */
  year: string | null;
  language: string;
  traits: string[];
  topPaths: { fieldName: string; matchScore: number }[];
  fitScore: number | null;
  notes: { text: string; at: string }[];
  turns: { text: number; voice: number };
  firstSeen: string;
  lastSeen: string;
}

export interface ProfileSignals {
  openness: { value: string; label: string; description: string; detected: boolean };
  conscientiousness: { value: string; label: string; description: string; detected: boolean };
  extraversion: { value: string; label: string; description: string; detected: boolean };
  agreeableness: { value: string; label: string; description: string; detected: boolean };
  stability: { value: string; label: string; description: string; detected: boolean };
  competence: { value: string; label: string; description: string; detected: boolean };
  motivation: { value: string; label: string; description: string; detected: boolean };
}

export interface PracticalConstraints {
  financial: { value: string; label: string; detected: boolean };
  timeline: { value: string; label: string; detected: boolean };
  geography: { value: string; label: string; detected: boolean };
  academic: { value: string; label: string; detected: boolean };
  exams: { value: string; label: string; detected: boolean };
}

export type PilotDecision =
  | { action: "update_model"; reason: string }
  | { action: "assign_experiment"; reason: string; suggestedCareerHint?: string }
  | { action: "no_action"; reason: string };

export interface LivingStudentModel {
  userId: string;
  degree: string;
  activeCareerHypotheses: string[];
  completedExperienceIds: string[];
  careerConfidences?: CareerConfidence[];
  lastUpdated: string;
  createdAt: string;
  signals: ProfileSignals;
  constraints: PracticalConstraints;
  bestFitPaths: CareerPath[];
  executionEngine?: ExecutionEngineData;
}

// ---- Psychometric layer, mirrored from server/src/types.ts ----

export interface PsychAnswer {
  itemId: string;
  optionId: string;
  rawText: string;
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
  pct: TheoryScores;
  ccfs: number;
  adjustedCcfs: number;
  sdtFlag: boolean;
  sdtWarning: boolean;
  answered: number;
  total: number;
}

/**
 * Whether a bachelor's degree is the gate on a career.
 * 'open' — no real degree requirement · 'bridge' — one qualification away ·
 * 'locked' — the degree genuinely is the gate.
 */
export type DegreeGate = 'open' | 'bridge' | 'locked';

/** How a career relates to the degree this student actually holds. */
export type CareerTrack = 'aligned' | 'bridge' | 'pivot' | 'locked';

export interface CareerDegreeInfo {
  typical: string;
  agnostic: string;
  gate: DegreeGate;
  altEntryRoute: string;
  pivotFrom: string;
}

export interface CareerMatch {
  careerId: string;
  name: string;
  domain: string;
  fitScore: number;
  status: 'best_fit' | 'consider' | 'mismatch';
  rank: number;
  degree: CareerDegreeInfo;
  /** Absent until the server knows the student's degree. */
  track?: CareerTrack;
}

/** One row of the degree → career pivot map. */
export interface DegreePivot {
  id: string;
  degreeName: string;
  topologyDegreeId: string | null;
  direct: string[];
  adjacent: string[];
  fullPivots: string[];
  bridgeQualification: string;
  timeToPivot: string;
}

/** The same matches, re-cut by what this student's degree opens. */
export interface PivotReadout {
  degree: DegreePivot | null;
  aligned: CareerMatch[];
  bridge: CareerMatch[];
  pivot: CareerMatch[];
  locked: CareerMatch[];
}

export interface PsychReadout {
  scores: PsychScores;
  topMatches: CareerMatch[];
  secondaryMatches: CareerMatch[];
  motivationNote: string | null;
  convergentCareers: string[];
  pivots: PivotReadout;
}

/**
 * The conversation's position, owned by the server but stored here so the
 * stateless API can pick up where it left off. Treated as an opaque blob:
 * the server re-validates every field on arrival.
 */
export interface AssessmentState {
  v: 1;
  name: string | null;
  degreeId: string | null;
  /** Year of study, from the onboarding picker. Profile only, never scored. */
  year?: string | null;
  answers: PsychAnswer[];
  followUps: Record<string, number>;
  skipped: string[];
  targetItemId: string | null;
  fallbackItemId?: string | null;
  reflectionShown: boolean;
  reflectionAnswered: boolean;
  recommendationShown: boolean;
}

export interface ChatProgress {
  answered: number;
  total: number;
}

// ---- The six-category interview schedule (server/src/categories.ts) ----
//
// The 28-item bank is delivered across three surfaces so no student ever meets
// it as one long form: the personal items at first login, two categories
// behind the features that need them, and the rest in conversation with FAB.
// Only the chat categories go through Gemini — the tapped ones are scored
// straight from the committed tables.

export type InterviewSurface = 'onboarding' | 'feature' | 'chat';

export type CategoryId =
  | 'basics'
  | 'interests'
  | 'workstyle'
  | 'thinking'
  | 'drive'
  | 'deciding';

/** Which tab opening a `feature` category belongs to. */
export type GatedFeature = 'paths' | 'lab';

export interface InterviewOption {
  id: string;
  letter: string;
  label: string;
}

export interface InterviewItem {
  id: string;
  text: string;
  options: InterviewOption[];
}

/** A category with its questions, as served by /api/interview/categories. */
export interface InterviewCategory {
  id: CategoryId;
  order: number;
  title: string;
  blurb: string;
  surface: InterviewSurface;
  feature?: GatedFeature;
  profileFields: ('name' | 'degree' | 'year')[];
  items: InterviewItem[];
}

/** Per-category completion, returned alongside every turn and every batch. */
export interface CategoryStatus {
  id: CategoryId;
  order: number;
  title: string;
  blurb: string;
  surface: InterviewSurface;
  feature?: GatedFeature;
  answered: number;
  total: number;
  complete: boolean;
}

export interface DegreeOption {
  id: string;
  name: string;
}

export interface StudyYear {
  id: string;
  label: string;
}

/** The whole schedule, fetched once per session. */
export interface InterviewSchedule {
  categories: InterviewCategory[];
  degrees: DegreeOption[];
  years: StudyYear[];
  total: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  phase: Phase;
  reflectionText?: string;
  signals?: ProfileSignals;
  constraints?: PracticalConstraints;
  bestFitPaths?: CareerPath[];
  recommendationField?: string;
  roadmap?: RoadmapData;
  reflectionApproved?: boolean;
  selectedPath?: CareerPath;
  viewingRoadmap?: boolean;
  compareList?: CareerPath[];
  assessment?: AssessmentState | null;
  progress?: ChatProgress | null;
  psychometrics?: PsychReadout | null;
  categories?: CategoryStatus[] | null;
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
    researchOrientation: number; // 0-100
    industryOrientation: number; // 0-100
    globalMobility: string;
    workLifeBalance: string;
    scholarshipAvailability: string;
    estimatedCost: string;
    overallROI: string;
    difficultyToEnter: string;
  };
  roadmap: RoadmapData;
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
    month1: {
      week1: string[];
      week2: string[];
      week3_4: string[];
    };
    month2: {
      certifications: string[];
      platforms: string[];
      linkedinConnections: string[];
    };
    month3: {
      targets: string[];
      deliverables: string[];
      milestones: string[];
    };
  };
  backupPath: {
    field: string;
    reason: string;
    firstStep: string;
  };
  holdingYouBack: {
    tendency: string;
    solution: string;
  };
}

export interface Experience {
  id: string;                 // "G1", "D5", "S2" — unique within its subject
  subject: string;            // "Biomedical Sciences" | "Psychology" | "Bioinformatics" | "Biotechnology" | "Clinical Research" | "NORTHR Core"
  title: string;
  bucket: "Growth" | "Discovery" | "Stretch" | null;
  careerPathway: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | null;
  year: string | null;        // "2nd" | "3rd" | "Universal"
  situationHook: string | null;
  whyChosen: string | null;
  goal: string | null;
  estimatedTime: string | null;
  environment: string | null;
  resources: string | null;
  microtasks: string[];
  reflectionQuestion: string | null;
  signals: string | null;
  evidenceProduced: string | null;
  verificationOpportunity: string | null;
  recommendedNext: string | null;
  primarySkills: string | null;
  secondarySkills: string | null;
  careerTags: string | null;
  questionAnswered: string | null;
  verificationTier: string | null;
}

