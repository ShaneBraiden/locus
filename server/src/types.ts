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
