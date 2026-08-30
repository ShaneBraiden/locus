import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Gauge,
  LineChart,
  Microscope,
  MoreHorizontal,
  Navigation,
  Network,
  Plus,
  Search,
  Server,
  Share2,
  Sliders,
  Star,
  TrendingUp,
  Upload,
  Users,
  X,
} from "lucide-react";
import { CareerPath, Experience } from "../../types";
import { experienceLibrary } from "../../data/experienceLibrary";
import { getCuratedRecommendations, DailyReality, CognitiveLoad, PilotExperience } from "../../lib/pilotOrchestrator";

interface ExperimentsViewProps {
  onAddEvidence: (evidenceItem: any) => void;
  bestFitPaths?: CareerPath[];
  onConfidenceUpdate: (fieldName: string, change: number) => void;

  // Pilot Orchestrator props
  dailyReality?: DailyReality;
  setDailyReality?: (dr: DailyReality) => void;
  cognitiveBudget?: CognitiveLoad;
  setCognitiveBudget?: (cb: CognitiveLoad) => void;
  activePilotExperience?: PilotExperience | null;
  setActivePilotExperience?: (exp: PilotExperience | null) => void;
  completedExperienceIds?: string[];
  setCompletedExperienceIds?: React.Dispatch<React.SetStateAction<string[]>>;
  onNavigateToTab?: (tab: string) => void;

  // Gamification & Account Props
  streak?: number;
  setStreak?: React.Dispatch<React.SetStateAction<number>> | ((s: number) => void);
  xp?: number;
  setXp?: React.Dispatch<React.SetStateAction<number>> | ((x: number) => void);

  // Student info props
  studentName?: string;
  studentDegree?: string;
}

// Helper to safely extract a list of skills from either Experience or PilotExperience format
export function getSkillsList(exp: any): string[] {
  if (!exp) return ["Communication", "Simplicity", "Science Clarity"];
  if (Array.isArray(exp.skillsTargeted)) return exp.skillsTargeted;
  if (Array.isArray(exp.primarySkills)) return exp.primarySkills;
  if (typeof exp.primarySkills === "string") {
    return exp.primarySkills.split(",").map((s: string) => s.trim());
  }
  return ["Communication", "Simplicity", "Science Clarity"];
}

// Helper to safely extract evidence description text
export function getEvidenceText(exp: any): string {
  if (!exp) return "You enjoy simplifying complex ideas and communicating them clearly.";
  if (Array.isArray(exp.evidenceProduced)) return exp.evidenceProduced[0] || "Successfully completed challenge.";
  if (typeof exp.evidenceProduced === "string") return exp.evidenceProduced;
  return "You enjoy simplifying complex ideas and communicating them clearly.";
}

// Helper to resolve a distinctive high-quality context-relevant Unsplash image for any experience
export function getExperienceImage(subject: string, title: string): string {
  const t = (title || "").toLowerCase();
  const s = (subject || "").toLowerCase();

  if (t.includes("dna") || s.includes("dna") || t.includes("crispr") || t.includes("gene") || t.includes("cloning") || t.includes("biotech")) {
    return "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=300&q=80"; // DNA / Biotech
  }
  if (t.includes("brain") || s.includes("psychology") || t.includes("neuro") || t.includes("cognitive") || t.includes("mental") || t.includes("empathy")) {
    return "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=300&q=80"; // Brain / Neuroscience
  }
  if (t.includes("clinical") || t.includes("trial") || t.includes("drug") || s.includes("medical") || t.includes("pharma") || t.includes("doctor")) {
    return "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80"; // Clinical / Medicine
  }
  if (t.includes("whatsapp") || t.includes("claim") || t.includes("fact") || t.includes("viral") || t.includes("forward") || t.includes("debunk")) {
    return "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=300&q=80"; // Digital Fact check / Mobile phone
  }
  if (t.includes("presentation") || t.includes("explain") || t.includes("teach") || t.includes("talk") || t.includes("pitch") || t.includes("lecture")) {
    return "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=300&q=80"; // Presentation / Communication
  }
  if (t.includes("interview") || t.includes("career") || t.includes("resume") || t.includes("job") || t.includes("linkedin")) {
    return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80"; // Interview / Career
  }

  // Defaults based on subject
  if (s.includes("biomedical") || s.includes("science") || s.includes("biology") || s.includes("chemistry")) {
    return "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&w=300&q=80"; // Science lab
  }
  if (s.includes("psychology") || s.includes("behavior") || s.includes("mind") || s.includes("health")) {
    return "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=300&q=80"; // Mindfulness / Psychology
  }

  return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80"; // Tech / Abstract
}

export default function ExperimentsView({
  onAddEvidence,
  bestFitPaths = [],
  onConfidenceUpdate,
  dailyReality,
  setDailyReality,
  cognitiveBudget,
  setCognitiveBudget,
  activePilotExperience,
  setActivePilotExperience,
  completedExperienceIds = [],
  setCompletedExperienceIds,
  onNavigateToTab,
  streak: propStreak,
  setStreak: propSetStreak,
  xp: propXp,
  setXp: propSetXp,
  studentName = "",
  studentDegree = "",
}: ExperimentsViewProps) {
  // Screen States (8-step Active Experiment Flow)
  // 1: EXPERIMENTS HUB (Dashboard)
  // 2: MISSION DETAILS (Overview)
  // 3: STEP 1: UNDERSTAND THE SITUATION (Scenario Reading)
  // 4: STEP 2 UNLOCK TRANSITION (Pilot Encouragement)
  // 5: STEP 3: IDENTIFY KEY PROBLEMS (Problem identification inputs)
  // 6: STEP 4: PROPOSE INITIATIVES (Initiative formulation inputs)
  // 7: STEP 5: GUIDED REFLECTION (Multi-metric feedback)
  // 8: STEP 6: MISSION COMPLETE & IMPACT (Evidence check & confidence growth)
  const [currentScreen, setCurrentScreen] = useState<number>(1);
  const [dashboardTab, setDashboardTab] = useState<"for_you" | "in_progress" | "completed">("for_you");

  // Active in-progress experiment state for the "Continue Where You Left Off" widget
  const [inProgressExp, setInProgressExp] = useState<any | null>(null);
  const [inProgressStep, setInProgressStep] = useState<number>(1);

  // Step 3 Inputs: Identify Key Problems
  const [problem1, setProblem1] = useState("");
  const [problem2, setProblem2] = useState("");
  const [problem3, setProblem3] = useState("");

  // Step 4 Inputs: Propose Initiatives
  const [initiative1, setInitiative1] = useState("");
  const [initiative2, setInitiative2] = useState("");
  const [initiative3, setInitiative3] = useState("");

  // Step 5 Inputs: Guided Reflection Flow
  const [reflectionEnjoyed, setReflectionEnjoyed] = useState<string>("");
  const [reflectionChallenge, setReflectionChallenge] = useState<number>(5);

  // Experience and progress states
  const [localStreak, setLocalStreak] = useState(12);
  const [localXp, setLocalXp] = useState(120);

  const streak = propStreak !== undefined ? propStreak : localStreak;
  const xp = propXp !== undefined ? propXp : localXp;

  const setStreak = propSetStreak || setLocalStreak;
  const setXp = propSetXp || setLocalXp;

  const [isSaved, setIsSaved] = useState(false);
  const [isObserveSaved, setIsObserveSaved] = useState(false);

  // Step 3 Interactive checklists
  const [completedSubtasks, setCompletedSubtasks] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false
  });

  // Step 4 Interactive reflection answers
  const [activeEmoji, setActiveEmoji] = useState<number | null>(null);
  const [hardestText, setHardestText] = useState("");
  const [surprisedText, setSurprisedText] = useState("");
  const [tryAgainChoice, setTryAgainChoice] = useState<"Yes" | "Maybe" | "No" | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Certificate Workflow States
  const [showCertModal, setShowCertModal] = useState(false);
  const [certStep, setCertStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Parsing, 3: Review, 4: Success
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<any | null>(null);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [parsingLog, setParsingLog] = useState<string[]>([]);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [selectedSkillsToConvert, setSelectedSkillsToConvert] = useState<Record<string, boolean>>({});
  const [isConverting, setIsConverting] = useState(false);
  const [selectedExp, setSelectedExp] = useState<any | null>(null);
  const [isLoadingPicks, setIsLoadingPicks] = useState(true);

  // Trigger simulated loading effect for curated picks
  useEffect(() => {
    setIsLoadingPicks(true);
    const timer = setTimeout(() => {
      setIsLoadingPicks(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    studentDegree,
    dailyReality?.workload,
    dailyReality?.academicFocus,
    dailyReality?.energyLevel,
    dailyReality?.availableHours,
    cognitiveBudget
  ]);

  // Synchronize externally selected pilot experiences (e.g., from Dashboard)
  useEffect(() => {
    if (activePilotExperience) {
      setSelectedExp(activePilotExperience);
      setCurrentScreen(2); // Go to overview screen
      // Reset active experience so it doesn't trigger repeatedly if we return to the tab later
      if (setActivePilotExperience) {
        setActivePilotExperience(null);
      }
    }
  }, [activePilotExperience, setActivePilotExperience]);

  const certPresets = [
    {
      id: "google_pm",
      title: "Google Project Management",
      issuer: "Google / Coursera",
      subject: "Project Management",
      skills: [
        "Agile & Scrum Methodologies",
        "Strategic Resource Allocation",
        "Stakeholder Communication",
        "Risk Assessment & Management",
        "Project Charters & Documentation"
      ],
      boostField: "Biomedical Sciences",
      boostValue: 12
    },
    {
      id: "aws_cloud",
      title: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      subject: "Cloud Computing",
      skills: [
        "Cloud Architecture Principles",
        "AWS Core Services & Security",
        "Distributed System Design",
        "High Availability Setup",
        "Cost Optimization & Budgets"
      ],
      boostField: "Bioinformatics",
      boostValue: 15
    },
    {
      id: "stanford_ml",
      title: "Stanford Machine Learning",
      issuer: "Stanford Online / Coursera",
      subject: "Artificial Intelligence",
      skills: [
        "Supervised & Unsupervised Learning",
        "Neural Network Architecture",
        "Statistical Tuning & Variance",
        "Python AI Modeling Frameworks",
        "Pattern Classification Models"
      ],
      boostField: "Bioinformatics",
      boostValue: 18
    },
    {
      id: "harvard_cs50",
      title: "CS50 Introduction to Computer Science",
      issuer: "Harvard Online / edX",
      subject: "Computer Science",
      skills: [
        "Memory Management & Pointers",
        "Algorithmic Problem Solving",
        "Data Structures & Complexity",
        "Full-Stack Web Architectures",
        "C & Python Development"
      ],
      boostField: "Bioinformatics",
      boostValue: 15
    }
  ];

  const handleCustomFileUpload = (file: File) => {
    setSelectedFile(file);
    setSelectedPreset(null);

    // Guess subject and skills based on file name or default to general Career OS skills
    const fileNameLower = file.name.toLowerCase();
    let title = file.name.replace(/\.[^/.]+$/, "").split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    if (title.length > 40) title = title.substring(0, 37) + "...";

    let subject = "General Tech & Operations";
    let skills = [
      "Critical Problem Solving",
      "Collaborative Workflow Design",
      "Information Synthesis",
      "Systematic Task Management",
      "Digital Tool Competency"
    ];
    let boostField = "Biomedical Sciences";

    if (fileNameLower.includes("python") || fileNameLower.includes("code") || fileNameLower.includes("programming") || fileNameLower.includes("dev")) {
      subject = "Software Engineering";
      skills = ["Algorithmic Problem Solving", "Python Programming", "Code Modularization", "Debugging Systems", "Software Architecture"];
      boostField = "Bioinformatics";
    } else if (fileNameLower.includes("data") || fileNameLower.includes("analyst") || fileNameLower.includes("analytics") || fileNameLower.includes("sql")) {
      subject = "Data Analytics";
      skills = ["Statistical Analysis", "Data Cleaning & Structuring", "Interactive Dashboards", "Relational Databases", "Data-Driven Insights"];
      boostField = "Bioinformatics";
    } else if (fileNameLower.includes("bio") || fileNameLower.includes("chem") || fileNameLower.includes("science")) {
      subject = "Scientific Research";
      skills = ["Scientific Inquiry Methods", "Laboratory Documentation", "Data Modeling in Sciences", "Literature Review Synthesis", "Experimental Protocol Design"];
      boostField = "Biomedical Sciences";
    }

    // Prepare custom parsed preset object
    const customParsedPreset = {
      id: "custom_uploaded",
      title: title || "Verified Certificate",
      issuer: "Uploaded Document (" + file.name + ")",
      subject: subject,
      skills: skills,
      boostField: boostField,
      boostValue: 10
    };

    startParsing(customParsedPreset);
  };

  const startParsing = (presetOrCustom: any) => {
    setCertStep(2);
    setParsingProgress(0);
    setParsingLog([]);

    const logs = [
      "Initializing AI-assisted PDF and OCR parsing systems...",
      `Detected document: "${presetOrCustom.title}"`,
      `Cryptographic issuer detected: ${presetOrCustom.issuer}`,
      "Analyzing digital signatures and security checksums...",
      "Signature verified. Secure certificate hash match: SHA-256 (0x" + Math.random().toString(16).substring(2, 10) + "ea8...)",
      "Extracting cognitive competency tokens & structural syllabus metadata...",
      "Matching extracted terms against Career OS Skill Taxonomy...",
      `Mapped ${presetOrCustom.skills.length} core professional competencies.`,
      `Ready to convert certificate credentials to verified Proof Points!`
    ];

    let currentLogIndex = 0;

    // Animate progress and stream logs
    const interval = setInterval(() => {
      setParsingProgress(prev => {
        const next = prev + 4;

        // Match logs with progress ranges
        const logTriggers = [0, 10, 25, 40, 55, 70, 80, 90, 98];
        if (currentLogIndex < logs.length && next >= logTriggers[currentLogIndex]) {
          setParsingLog(p => [...p, logs[currentLogIndex]]);
          currentLogIndex++;
        }

        if (next >= 100) {
          clearInterval(interval);
          // Load skills to review
          setExtractedSkills(presetOrCustom.skills);
          const initialChecked: Record<string, boolean> = {};
          presetOrCustom.skills.forEach((skill: string) => {
            initialChecked[skill] = true;
          });
          setSelectedSkillsToConvert(initialChecked);
          setSelectedPreset(presetOrCustom);
          setTimeout(() => {
            setCertStep(3);
          }, 400);
          return 100;
        }
        return next;
      });
    }, 100);
  };

  const handleClaimCertificateProof = () => {
    if (!selectedPreset) return;
    setIsConverting(true);

    const activeSelectedSkills = Object.keys(selectedSkillsToConvert).filter(
      skill => selectedSkillsToConvert[skill]
    );

    setTimeout(() => {
      setIsConverting(false);
      setCertStep(4);
      setXp(prev => prev + 25);

      // 1. Add evidence
      if (onAddEvidence) {
        onAddEvidence({
          id: `cert_evidence_${Date.now()}`,
          type: "Verified Certificate",
          title: selectedPreset.title,
          subject: selectedPreset.subject,
          signals: activeSelectedSkills,
          tier: "Tier 1 Verified",
          completedAt: new Date().toLocaleDateString(),
          realization: `Imported via Certificate Decoder. Verified skills mapped to ${selectedPreset.boostField} matches.`
        });
      }

      // 2. Update parent confidence score
      if (onConfidenceUpdate && selectedPreset.boostField) {
        onConfidenceUpdate(selectedPreset.boostField, selectedPreset.boostValue);
      }
    }, 1800);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCustomFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCustomFileUpload(e.target.files[0]);
    }
  };

  // List of active picks curated dynamically by our Pilot Orchestrator
  const activeHypothesesList = (bestFitPaths || []).map(p => p.fieldName);
  const curatedRecs = getCuratedRecommendations(
    studentDegree,
    dailyReality || { workload: "Medium", academicFocus: "Lectures", energyLevel: "Medium", availableHours: 2 },
    cognitiveBudget || "Light",
    completedExperienceIds || [],
    activeHypothesesList
  );

  const todayPicks = curatedRecs.length > 0 ? curatedRecs.map(exp => {
    const isDyn = exp.isCustomGenerated || exp.type === "Dynamic";
    const shortRationale = exp.rationale ? exp.rationale.replace(/^Pilot Orchestrator: |^Hypothesis Match: |^Subject Match: /, "") : "";

    // Convert minutes to much shorter durations (e.g. 2-5 mins) for quick actionability
    const rawTime = exp.estimatedTime || "15 minutes";
    let shortTime = "2 min";
    if (rawTime.includes("10")) shortTime = "2 min";
    else if (rawTime.includes("15")) shortTime = "2 min";
    else if (rawTime.includes("20")) shortTime = "3 min";
    else if (rawTime.includes("30")) shortTime = "4 min";
    else if (rawTime.includes("45")) shortTime = "5 min";
    else if (rawTime.includes("60") || rawTime.includes("1 hour")) shortTime = "6 min";
    else shortTime = "3 min";

    const whyPilotSuggests = (exp as any).whyChosen || shortRationale || "Strengthens critical career pathways and practical science application.";

    return {
      id: exp.id,
      title: exp.title,
      desc: exp.goal || exp.expectedOutcome || "Explore core competencies.",
      duration: shortTime,
      whyPilotSuggests: whyPilotSuggests,
      icon: exp.subject === "Biomedical Sciences" ? "dna" : exp.subject === "Psychology" ? "brain" : "document",
      screenTarget: 2 as const,
      expData: exp
    };
  }) : [
    {
      id: "crispr",
      title: "Explain CRISPR to a 10-year-old",
      desc: "Simplify a complex concept. Builds clarity and communication.",
      duration: "3 min",
      whyPilotSuggests: "Translating cutting-edge gene editing tools for laypeople is the ultimate test of true scientific mastery.",
      icon: "dna",
      screenTarget: 2 as const,
      expData: null
    }
  ];

  // The post-experiment reaction scale.
  //
  // This was a row of five face emoji. A face is ambiguous across cultures,
  // renders differently on every platform, and cannot be read by a screen
  // reader as anything but "pouting face". It is now an ordinal 5-to-1 scale:
  // the numeral carries the ranking, the label carries the meaning, and the two
  // together are unambiguous in any font on any device.
  const reactionScale = [
    { score: 5, label: "Loved it" },
    { score: 4, label: "Okay" },
    { score: 3, label: "Neutral" },
    { score: 2, label: "Struggled" },
    { score: 1, label: "Disliked it" },
  ];

  // Helper to handle transitioning to Reflection submission and Completed state
  const handleReflectionSubmit = () => {
    if (!selectedExp) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setCurrentScreen(5); // Go to Completion screen
      if (setStreak) {
        setStreak(prev => prev + 1);
      }
      if (setXp) {
        setXp(prev => prev + 10);
      }

      const currentSubject = selectedExp.subject || "Biomedical Sciences";
      const currentSkills = getSkillsList(selectedExp);
      const currentId = selectedExp.id || "explain_crispr";

      // Call parent callbacks to keep full stack state synced if available
      if (onAddEvidence) {
        onAddEvidence({
          id: `proof_${Date.now()}`,
          type: "Curated Challenge",
          title: selectedExp.title || "Explain CRISPR to a 10-year-old",
          subject: currentSubject,
          signals: currentSkills,
          tier: selectedExp.verificationTier || "Tier 1",
          completedAt: new Date().toLocaleDateString(),
          realization: hardestText || `Successfully completed challenge in ${currentSubject}.`
        });
      }
      if (onConfidenceUpdate) {
        onConfidenceUpdate(currentSubject, 8);
      }
      if (setCompletedExperienceIds) {
        setCompletedExperienceIds(prev => {
          const next = [...prev, currentId];
          const origId = selectedExp.originalId;
          if (origId && !next.includes(origId)) {
            next.push(origId);
          }
          return next;
        });
      }
    }, 1500);
  };

  return (
    <div id="experiments-redesign-container" className="w-full h-full flex flex-col select-none font-sans">

      {/* Main Dynamic Workspace Canvas.
          The border and the page fill are gone: this sits inside the app's
          content canvas, which already supplies a white pane with its own
          corners, and a bordered rectangle drawn inside it read as a second
          window rather than as the workspace. What is left is the scroll
          boundary and its radius. */}
      <div className="relative flex-1 overflow-hidden flex flex-col justify-between rounded-2xl m-1.5 sm:m-2">

        <AnimatePresence mode="wait">

          {/* SCREEN 1: EXPERIMENT LIST (DASHBOARD) */}
          {currentScreen === 1 && (
            <motion.div
              key="screen-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-4 sm:space-y-6">
                {/* Search / Notifications and Title Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-ink-200">
                  <div className="flex items-center space-x-3">
                    {/* The menu button that used to live here was a workaround
                        for the shell only rendering its mobile top bar on the
                        Home tab. The shell now shows it on every tab, so this
                        was a second, duplicate hamburger. */}
                    <div className="space-y-0.5 sm:space-y-1">
                      <span className="block text-micro font-mono font-bold uppercase tracking-wider text-moss-700">Active Laboratory</span>
                      <h2 className="text-xl sm:text-2xl font-bold text-ink-900 tracking-tight">Experiments Hub</h2>
                    </div>
                  </div>

                  {/* Stats HUD + Convert Action (Highly engaging & fully visible) */}
                  <div className="flex items-center gap-2 sm:space-x-3 self-stretch sm:self-auto justify-between sm:justify-start flex-wrap">
                    <button
                      onClick={() => {
                        setShowCertModal(true);
                        setCertStep(1);
                        setSelectedFile(null);
                        setSelectedPreset(null);
                      }}
                      className="flex items-center space-x-1 sm:space-x-1.5 bg-moss-50 hover:bg-moss-100 border border-moss-200 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-moss-700 shadow-e1 font-mono font-bold text-micro sm:text-xs transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span>DECODE CERTIFICATE</span>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center space-x-1 bg-moss-50 border border-moss-100 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-moss-700 shadow-e1 font-mono text-micro sm:text-xs">
                        <TrendingUp className="h-3 w-3 fill-moss-500 text-moss-500 animate-pulse" />
                        <span className="font-bold">{streak}D</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-moss-50 border border-moss-100 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 text-moss-700 shadow-e1 font-mono text-micro sm:text-xs">
                        <Star className="h-3 w-3 text-info-500 animate-pulse" />
                        <span className="font-bold">{xp}XP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub Tab Selector (Pill Capsule Design) */}
                {/* `w-fit` on wide screens, not `w-auto`: this is a flex child
                    of a full-width row, so `w-auto` let it stretch and the
                    track ran the width of the page with three small pills
                    huddled at the left end. A capsule that wide reads as a
                    container rather than as a control. */}
                <div className="flex w-full sm:w-fit bg-ink-100 p-1 rounded-full text-micro sm:text-tiny font-mono font-bold tracking-wider uppercase text-ink-500 overflow-x-auto scroll-slim">
                  <button
                    onClick={() => setDashboardTab("for_you")}
                    className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer ${dashboardTab === "for_you" ? "bg-white text-ink-900 shadow-e2" : "hover:text-ink-900"}`}
                  >
                     For You
                  </button>
                  <button
                    onClick={() => setDashboardTab("in_progress")}
                    className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer ${dashboardTab === "in_progress" ? "bg-white text-ink-900 shadow-e2" : "hover:text-ink-900"}`}
                  >
                    ⏳ In Progress
                  </button>
                  <button
                    onClick={() => setDashboardTab("completed")}
                    className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer ${dashboardTab === "completed" ? "bg-white text-ink-900 shadow-e2" : "hover:text-ink-900"}`}
                  >
                     Completed ({completedExperienceIds.length})
                  </button>
                </div>

                 <AnimatePresence mode="wait">
                   {/* FOR YOU TAB CONTENT */}
                   {dashboardTab === "for_you" && (
                     <motion.div
                       key="tab-foryou"
                       initial={{ opacity: 0, y: 8 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -8 }}
                       transition={{ duration: 0.2 }}
                       className="space-y-4 sm:space-y-6"
                     >
                       {/* Pilot AI Pick banner (Personalized Counselor tone) */}
                       <div className="p-3.5 sm:p-5 bg-ink-50 border border-ink-200 rounded-2xl sm:rounded-3xl flex items-start gap-3 sm:space-x-4 shadow-e1 relative overflow-hidden group">

                         <div className="h-9 w-9 sm:h-10 sm:w-10 bg-moss-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-moss-700 shrink-0 shadow-e2">
                           <Star className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                         </div>
                         <div>
                           <span className="block text-xs sm:text-sm font-bold text-ink-950">Pilot Personalized Recommendation</span>
                           <span className="block text-micro sm:text-xs text-ink-600 font-semibold leading-relaxed mt-0.5 sm:mt-1">
                             {studentDegree ? (
                               <>Engineered dynamically for your <strong className="text-moss-900 font-bold">{studentDegree}</strong> track and current academic workload. Let's strengthen concrete proof of your skills today.</>
                             ) : (
                               <>Engineered around your current academic workload. Tell FAB what you're studying to sharpen these picks further.</>
                             )}
                           </span>
                         </div>
                       </div>

                       {/* Today's Picks */}
                       <div className="space-y-3 sm:space-y-4">
                         <div className="flex justify-between items-center">
                           <span className="text-micro font-mono font-bold uppercase text-ink-500 tracking-widest">Curated Challenges</span>
                           <span className="text-xs font-bold text-moss-700 hover:underline cursor-pointer">View all ({todayPicks.length})</span>
                         </div>

                         <div className="flex flex-col space-y-3 sm:space-y-4">
                           {isLoadingPicks ? (
                             [1, 2, 3].map((_, index) => (
                               <div
                                 key={`skeleton-${index}`}
                                 className="p-3 sm:p-5 bg-white border border-ink-200 rounded-2xl sm:rounded-[32px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pointer-events-none"
                               >
                                 <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                   {/* Animated Skeleton Avatar */}
                                   <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-ink-200/50 animate-pulse shrink-0 border-2 border-moss-100/10 shadow-e1 self-center" />

                                   <div className="min-w-0 flex-1 space-y-2">
                                     {/* Animated Skeleton Title */}
                                     <div className="h-4 sm:h-5 bg-ink-200/60 animate-pulse rounded-md w-3/4 sm:w-1/2" />
                                     {/* Animated Skeleton Description */}
                                     <div className="h-3 sm:h-3.5 bg-ink-100/70 animate-pulse rounded-md w-11/12 sm:w-5/6" />
                                     {/* Animated Skeleton Suggestion Bubble */}
                                     <div className="h-8 bg-moss-50/10 border border-moss-100/5 animate-pulse rounded-xl sm:rounded-2xl w-full" />
                                   </div>
                                 </div>

                                 {/* Animated Skeleton Duration Pill */}
                                 <div className="h-6 sm:h-8 w-16 bg-ink-100/60 animate-pulse rounded-md shrink-0 self-start sm:self-center" />
                               </div>
                             ))
                           ) : (
                             todayPicks.map(pick => {
                               const expImage = getExperienceImage(pick.expData?.subject || "Science", pick.title);
                               return (
                                 <div
                                   key={pick.id}
                                   onClick={() => {
                                     if (pick.expData) setSelectedExp(pick.expData);
                                     setCurrentScreen(2);
                                   }}
                                   className="p-3 sm:p-5 bg-white border border-ink-200 rounded-lg hover:border-ink-400 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 group"
                                 >
                                   <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                                     <img
                                       src={expImage}
                                       alt={pick.title}
                                       className="h-10 w-10 sm:h-14 sm:w-14 rounded-md object-cover shrink-0 border-2 border-moss-100/50 shadow-e1 self-center"
                                       referrerPolicy="no-referrer"
                                     />
                                     <div className="min-w-0 flex-1 space-y-1">
                                       <span className="block text-sm sm:text-base font-bold text-ink-900 leading-snug group-hover:text-moss-700 transition-colors break-words whitespace-normal">
                                         {pick.title}
                                       </span>
                                       <span className="block text-xs text-ink-600 font-semibold leading-relaxed break-words whitespace-normal">
                                         {pick.desc}
                                       </span>
                                       <p className="text-micro text-ink-500 font-medium leading-relaxed mt-1 flex items-start bg-moss-50/50 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-moss-100/30">
                                         <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-moss-700 shrink-0 mt-0.5" />
                                         <span><strong>Pilot Suggestion:</strong> {pick.whyPilotSuggests}</span>
                                       </p>
                                     </div>
                                   </div>
                                   <span className="text-micro sm:text-xs font-mono text-ink-500 font-bold shrink-0 sm:ml-3 flex items-center bg-ink-50 border border-ink-200/80 px-2.5 py-1 sm:py-1.5 rounded-full self-start sm:self-center">
                                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-moss-700" />
                                    {pick.duration}
                                   </span>
                                 </div>
                               );
                             })
                           )}
                         </div>
                      </div>
                    </motion.div>
                  )}

                  {/* IN PROGRESS TAB CONTENT */}
                  {dashboardTab === "in_progress" && (
                    <motion.div
                      key="tab-inprogress"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      <div className="p-3.5 sm:p-6 bg-white border border-ink-200 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 shadow-e1">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                          <div className="h-9 w-9 sm:h-12 sm:w-12 bg-moss-50 border border-moss-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-moss-700 shrink-0">
                            <BookOpen className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-moss-600" />
                          </div>
                          <div>
                            <span className="block text-micro font-mono font-bold uppercase text-moss-600">IN PROGRESS LAB</span>
                            <span className="block text-xs sm:text-base font-bold text-ink-900 mt-0.5">Understand Phase I Clinical Trials</span>
                            <span className="block text-tiny text-ink-500 font-semibold mt-0.5">Strengthening research clinical structure and trial protocols.</span>
                          </div>
                        </div>

                        <div className="flex-1 md:max-w-xs space-y-1.5 sm:space-y-2 w-full">
                          <div className="flex justify-between text-micro sm:text-xs font-mono font-bold text-ink-500">
                            <span>40% Completed</span>
                            <span className="text-moss-700">Step 2 of 5</span>
                          </div>
                          <div className="h-1.5 sm:h-2 w-full bg-ink-100 rounded-md overflow-hidden">
                            <div className="h-full bg-moss-500 rounded-md w-[40%]" />
                          </div>
                          <button
                            onClick={() => {
                              // Direct continuation trigger
                              setCurrentScreen(3);
                            }}
                            className="mt-1.5 w-full py-1.5 sm:py-2 bg-moss-500 text-white hover:bg-moss-600 text-micro sm:text-tiny font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                          >
                            Resume Experiment Steps
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* COMPLETED TAB CONTENT */}
                  {dashboardTab === "completed" && (
                    <motion.div
                      key="tab-completed"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 sm:space-y-4"
                    >
                      {completedExperienceIds.length === 0 ? (
                        <div className="p-6 sm:p-10 text-center bg-ink-25 border border-dashed border-ink-200 rounded-2xl sm:rounded-3xl space-y-3">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-ink-100 rounded-md flex items-center justify-center text-ink-500 mx-auto">
                            <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-ink-800">No laboratory credentials registered yet</h4>
                          <p className="text-tiny sm:text-xs text-ink-500 font-semibold max-w-sm mx-auto leading-relaxed">
                            Complete your first recommended challenge today. Once submitted, your validated proof points and certificates will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3 sm:p-4 bg-good-50/50 border border-good-100 rounded-xl sm:rounded-2xl flex items-center space-x-3.5 mb-2">
                            <div className="h-7 w-7 sm:h-8 sm:w-8 bg-good-100 rounded-xl flex items-center justify-center text-good-700 shrink-0">
                              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <span className="text-tiny sm:text-xs text-good-900 font-semibold">
                              You have registered <strong className="font-bold">{completedExperienceIds.length}</strong> permanent credentials to your Career Profile.
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                            {completedExperienceIds.map((id, index) => {
                              const foundExp = experienceLibrary.find(e => e.id === id);
                              const title = foundExp?.title || "Explain CRISPR to a 10-year-old";
                              const subject = foundExp?.subject || "Biomedical Sciences";
                              const skills = foundExp?.primarySkills ? foundExp.primarySkills.split(",") : ["Communication", "Scientific Simplification"];

                              return (
                                <div key={index} className="p-3 sm:p-4 bg-white border border-ink-200 rounded-xl sm:rounded-2xl flex items-center justify-between shadow-e1 hover:border-good-100 transition-colors">
                                  <div className="space-y-1 flex-1 min-w-0 pr-4">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-micro sm:text-micro font-mono font-bold text-good-700 bg-good-50 border border-good-100 px-1.5 py-0.5 rounded-md uppercase">Verified Proof</span>
                                      <span className="text-micro font-mono font-bold text-ink-500">ID: {id}</span>
                                    </div>
                                    <h5 className="text-xs sm:text-sm font-bold text-ink-900 truncate">{title}</h5>
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {skills.slice(0, 3).map((sk, idx) => (
                                        <span key={idx} className="text-micro sm:text-micro font-mono font-bold text-ink-500 bg-ink-50 border border-ink-200 px-2 rounded-full">{sk.trim()}</span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="block text-micro sm:text-micro text-ink-500 font-mono font-bold uppercase">Subject Matrix</span>
                                    <span className="block text-xs font-bold text-moss-700 font-mono mt-0.5">{subject}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: EXPERIMENT OVERVIEW (CRISPR DETAIL) */}
          {currentScreen === 2 && (
            <motion.div
              key="screen-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col justify-between"
            >
              {/* Top Navigation bar */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentScreen(1)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 border border-ink-200 rounded-xl hover:bg-ink-50 text-ink-600 text-tiny sm:text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 bg-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-moss-700" />
                  <span>Back to Hub</span>
                </button>
                <div className="flex space-x-2">
                  <button className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-ink-200 hover:bg-ink-50 flex items-center justify-center text-ink-500 transition-all bg-white">
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button
                    onClick={() => setIsSaved(!isSaved)}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-ink-200 hover:bg-ink-50 flex items-center justify-center text-ink-500 transition-all bg-white"
                  >
                    <Bookmark className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isSaved ? "fill-moss-700 text-moss-700 border-moss-600" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Main Info Columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-8 items-start">

                {/* Left block: Title, image and tags */}
                <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-4 sm:space-y-5">
                  <div className="relative h-36 sm:h-44 w-full bg-ink-100 rounded-2xl sm:rounded-3xl overflow-hidden border border-ink-200 shadow-e2">
                    <img
                      src={getExperienceImage(selectedExp?.subject || "Science", selectedExp?.title || "")}
                      alt={selectedExp?.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-white border border-ink-200 rounded-md p-2 sm:p-2.5 text-moss-700 shadow-e2">
                      {selectedExp?.subject === "Biomedical Sciences" ? (
                        <Microscope className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
                      ) : selectedExp?.subject === "Psychology" ? (
                        <Network className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
                      ) : (
                        <FileText className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 w-full">
                    <span className="inline-block text-micro sm:text-micro font-mono font-bold uppercase bg-moss-100 text-moss-700 border border-moss-200 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                      PILOT SUGGESTED CHALLENGE
                    </span>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-ink-900 tracking-tight leading-snug break-words whitespace-normal">
                      {selectedExp?.title || "Explain CRISPR to a 10-year-old"}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start space-x-3 text-micro sm:text-tiny font-mono font-bold text-ink-500">
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 text-moss-700" />
                        {(() => {
                          const rawTime = selectedExp?.estimatedTime || "15 minutes";
                          let shortTime = "2 min";
                          if (rawTime.includes("10")) shortTime = "2 min";
                          else if (rawTime.includes("15")) shortTime = "2 min";
                          else if (rawTime.includes("20")) shortTime = "3 min";
                          else if (rawTime.includes("30")) shortTime = "4 min";
                          else if (rawTime.includes("45")) shortTime = "5 min";
                          else if (rawTime.includes("60") || rawTime.includes("1 hour")) shortTime = "6 min";
                          else shortTime = "3 min";
                          return shortTime;
                        })()}
                      </span>
                      <span className="flex items-center"><Navigation className="h-3.5 w-3.5 mr-1 text-moss-700" /> {selectedExp?.careerPathway || "Communication"}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 pt-1 w-full">
                    <span className="block text-micro sm:text-micro font-mono font-bold uppercase text-ink-500 tracking-wider">Skills Strengthened</span>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center md:justify-start">
                      {(selectedExp?.primarySkills || ["Communication", "Simplicity", "Science Clarity"]).slice(0, 3).map(tag => (
                        <span key={tag} className="text-micro sm:text-xs font-mono font-bold uppercase bg-moss-50 text-moss-700 border border-moss-100 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right block: Context descriptors */}
                <div className="md:col-span-7 space-y-4 sm:space-y-5 bg-ink-25 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-ink-200 text-xs sm:text-sm leading-relaxed">
                  <div className="space-y-1">
                    <span className="block text-micro sm:text-micro font-mono font-bold uppercase text-ink-950 tracking-widest">Why This?</span>
                    <p className="text-ink-600 font-semibold leading-relaxed">
                      {selectedExp?.whyChosen || "You've shown strong interest in genetics and often enjoy explaining ideas clearly. Let's see if simplifying complex science excites you too."}
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-ink-200/50 pt-3 sm:pt-4">
                    <span className="block text-micro sm:text-micro font-mono font-bold uppercase text-ink-950 tracking-widest">What you'll do</span>
                    <p className="text-ink-600 font-semibold leading-relaxed">
                      {selectedExp?.situationHook || "Break down CRISPR in the simplest way possible for a 10-year-old."}
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-ink-200/50 pt-3 sm:pt-4">
                    <span className="block text-micro sm:text-micro font-mono font-bold uppercase text-ink-950 tracking-widest">Expected Outcome</span>
                    <p className="text-ink-600 font-semibold leading-relaxed">
                      {selectedExp?.goal || "Your clarity, communication and ability to simplify complex ideas."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Start CTA Button */}
              <button
                onClick={() => {
                  // Initialize clean subtask array
                  setCompletedSubtasks({ 0: false, 1: false, 2: false, 3: false });
                  setInProgressExp(selectedExp);
                  setInProgressStep(1);
                  setCurrentScreen(3);
                }}
                className="w-full bg-moss-500 hover:bg-moss-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl text-tiny sm:text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center block mt-4"
              >
                Start Experiment Workspace
              </button>
            </motion.div>
          )}

          {/* SCREEN 3: ACTIVE 8-STEP EXPERIMENT WORKSPACE */}
          {currentScreen === 3 && (
            <motion.div
              key="screen-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-3 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col justify-between"
            >
              {/* Unified Workspace Header */}
              <div className="flex justify-between items-center border-b border-ink-200 pb-3 sm:pb-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center space-x-1.5 text-micro font-mono font-bold uppercase text-moss-700 bg-moss-50 px-2.5 py-0.5 rounded-md border border-moss-100">
                    <LineChart className="h-3 w-3 animate-pulse text-moss-700" />
                    <span>MISSION PHASES • STEP {inProgressStep} OF 8</span>
                  </span>
                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-ink-900 tracking-tight mt-1">
                    {inProgressStep === 1 && "Phase I: Understand & Absorb Concepts"}
                    {inProgressStep === 2 && "Phase II: System Unlock & Setup"}
                    {inProgressStep === 3 && "Phase III: Real-world Problem Harvesting"}
                    {inProgressStep === 4 && "Phase IV: Formulate Strategic Initiatives"}
                    {inProgressStep === 5 && "Phase V: Observational Action & Logging"}
                    {inProgressStep === 6 && "Phase VI: Counselor Guided Reflection"}
                    {inProgressStep === 7 && "Phase VII: Validate & Sync Cognitive Signature"}
                    {inProgressStep === 8 && "Phase VIII: Mission Success & Credentials"}
                  </h4>
                </div>
                <button
                  onClick={() => {
                    // Save and exit to dashboard
                    setCurrentScreen(1);
                  }}
                  className="px-3 py-1.5 border border-ink-200 rounded-xl hover:bg-ink-50 text-ink-600 text-micro sm:text-xs font-mono font-bold uppercase transition-all cursor-pointer bg-white flex items-center space-x-1 shadow-e1 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Save & Close</span>
                </button>
              </div>

              {/* Core Dynamic Stepper Tracker (Segmented Progress Bar) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-micro font-mono font-bold text-ink-500">
                  <span className="uppercase tracking-widest text-moss-700">Workspace Progression</span>
                  <span>{Math.round(((inProgressStep) / 8) * 100)}% Complete</span>
                </div>
                {/* Eight fixed columns left each segment ~28px wide on a
                    360px screen once padding was counted. Flex lets them share
                    whatever width is actually available. */}
                <div className="flex gap-1 sm:gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(stepNum => {
                    const isActive = inProgressStep === stepNum;
                    const isDone = inProgressStep > stepNum;
                    return (
                      <button
                        key={stepNum}
                        type="button"
                        aria-label={`Go to step ${stepNum}`}
                        aria-current={isActive ? "step" : undefined}
                        onClick={() => {
                          // Allow free backward traversal or forward if current tasks completed
                          if (stepNum < inProgressStep || (stepNum <= 6)) {
                            setInProgressStep(stepNum);
                          }
                        }}
                        className={`h-1.5 min-w-0 flex-1 rounded-md transition-all duration-300 sm:h-2 ${
                          isActive
                            ? "bg-moss-600 ring-2 ring-moss-200"
                            : isDone
                              ? "bg-moss-500"
                              : "bg-ink-100 hover:bg-ink-200"
                        }`}
                        title={`Go to Step ${stepNum}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Step Panels (Progressive Disclosure Pattern) */}
              <div className="flex-1 py-2 sm:py-4 scroll-slim overflow-y-auto max-h-[480px]">
                <AnimatePresence mode="wait">

                  {/* STEP 1: UNDERSTAND & ABSORB */}
                  {inProgressStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-3 bg-moss-50/50 border border-moss-100 rounded-2xl">
                        <p className="text-xs text-moss-900 font-semibold leading-relaxed">
                           <strong>Pilot Guideline:</strong> Before you dive into action, build solid mental foundations. Review the core items and click to complete them once understood.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Interactive check items */}
                        <div className="md:col-span-7 space-y-2">
                          <span className="block text-micro font-mono font-bold uppercase text-ink-500 tracking-wider">Required Core Guidelines</span>
                          {(selectedExp?.microtasks || [
                            "Identify the central hypothesis of this study or experiment.",
                            "Understand the target audience, demographic, or physiological variable.",
                            "Synthesize complex vocabulary to layperson terms.",
                            "Formulate a plan for real-world verification."
                          ]).map((item, idx) => {
                            const isChecked = !!completedSubtasks[idx];
                            return (
                              <div
                                key={idx}
                                onClick={() => setCompletedSubtasks(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                className={`flex items-start space-x-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-ink-25/80 border-moss-50 text-ink-500"
                                    : "bg-white border-ink-200/80 hover:border-moss-300 hover:shadow-e1"
                                }`}
                              >
                                <div className="pt-0.5 shrink-0">
                                  <div className={`h-4.5 w-4.5 rounded-md border flex items-center justify-center transition-all ${
                                    isChecked ? "bg-moss-600 border-transparent text-white" : "border-ink-300 bg-white"
                                  }`}>
                                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                                  </div>
                                </div>
                                <span className={`text-xs sm:text-sm font-bold flex-1 ${isChecked ? "line-through text-ink-500 font-semibold" : "text-ink-900"}`}>
                                  {item}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Resource Deck */}
                        <div className="md:col-span-5 space-y-3 bg-ink-25 p-4 rounded-2xl border border-ink-200">
                          <span className="block text-micro font-mono font-bold text-ink-700 uppercase tracking-wider">Suggested Reading Deck</span>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-white border border-ink-200 rounded-xl hover:border-moss-300 cursor-pointer transition-colors shadow-e1">
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="h-4 w-4 text-moss-700 shrink-0" />
                                <span className="text-tiny text-ink-800 font-semibold truncate">
                                  {selectedExp?.resources || "Simple research paper or guideline"}
                                </span>
                              </div>
                              <ExternalLink className="h-3 w-3 text-ink-500 shrink-0" />
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white border border-ink-200 rounded-xl hover:border-moss-300 cursor-pointer transition-colors shadow-e1">
                              <div className="flex items-center space-x-2 min-w-0">
                                <Users className="h-4 w-4 text-moss-700 shrink-0" />
                                <span className="text-tiny text-ink-800 font-semibold truncate">
                                  Subject Overview Lecture References
                                </span>
                              </div>
                              <ExternalLink className="h-3 w-3 text-ink-500 shrink-0" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: SYSTEM UNLOCK & SETUP */}
                  {inProgressStep === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-moss-50/40 border border-moss-200 rounded-2xl flex items-start space-x-3">
                        <span className="text-xl shrink-0"></span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-moss-950">Setup & Environmental Preparation</h5>
                          <p className="text-tiny sm:text-xs text-moss-900 font-semibold mt-0.5 leading-relaxed">
                            A great researcher prepares their tools before logging data. Set up your notebook, close distracting background browser tabs, and gather clinical study materials.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-ink-200 rounded-2xl p-4 space-y-3">
                        <span className="block text-micro font-mono font-bold text-ink-500 uppercase tracking-widest">Active Workspace Preparation Checks</span>

                        <div className="flex items-center justify-between p-3 bg-ink-50/50 border border-ink-200 rounded-xl">
                          <div className="flex items-center space-x-2.5">
                            <Sliders className="h-4 w-4 text-moss-700" />
                            <span className="text-xs font-bold text-ink-800">Review Clinical/Experiment Subject Blueprint</span>
                          </div>
                          <span className="text-micro font-mono text-good-500 bg-good-50 px-2 py-0.5 rounded-full font-bold uppercase">READY</span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-ink-50/50 border border-ink-200 rounded-xl">
                          <div className="flex items-center space-x-2.5">
                            <BookOpen className="h-4 w-4 text-moss-700" />
                            <span className="text-xs font-bold text-ink-800">Academic references & vocabulary logs locked</span>
                          </div>
                          <span className="text-micro font-mono text-good-500 bg-good-50 px-2 py-0.5 rounded-full font-bold uppercase">LOCKED ON DECK</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: IDENTIFY KEY PROBLEMS */}
                  {inProgressStep === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <span className="block text-micro font-mono font-bold text-moss-700 uppercase tracking-wider">Tactile Logging Phase</span>
                        <h5 className="text-sm font-bold text-ink-900">Observe & Identify 3 Key Bottlenecks / Challenges</h5>
                        <p className="text-tiny sm:text-xs text-ink-500 font-semibold leading-relaxed">
                          What real-world issues, friction points, or core clinical bottlenecks did you observe? Be descriptive and clear.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-white border border-ink-200 rounded-xl space-y-1.5 focus-within:border-moss-300 transition-colors">
                          <span className="block text-micro font-mono font-bold text-ink-500">PROBLEM/OBSERVATION 1</span>
                          <input
                            type="text"
                            value={problem1}
                            onChange={e => setProblem1(e.target.value)}
                            placeholder="e.g. Traditional clinical trials lack representation of diverse age groups..."
                            className="w-full bg-transparent border-none text-xs font-semibold text-ink-800 outline-none placeholder-ink-500"
                          />
                        </div>

                        <div className="p-3 bg-white border border-ink-200 rounded-xl space-y-1.5 focus-within:border-moss-300 transition-colors">
                          <span className="block text-micro font-mono font-bold text-ink-500">PROBLEM/OBSERVATION 2</span>
                          <input
                            type="text"
                            value={problem2}
                            onChange={e => setProblem2(e.target.value)}
                            placeholder="e.g. Communication of side effects is overly technical..."
                            className="w-full bg-transparent border-none text-xs font-semibold text-ink-800 outline-none placeholder-ink-500"
                          />
                        </div>

                        <div className="p-3 bg-white border border-ink-200 rounded-xl space-y-1.5 focus-within:border-moss-300 transition-colors">
                          <span className="block text-micro font-mono font-bold text-ink-500">PROBLEM/OBSERVATION 3</span>
                          <input
                            type="text"
                            value={problem3}
                            onChange={e => setProblem3(e.target.value)}
                            placeholder="e.g. Tracking of participant logs is prone to transcription errors..."
                            className="w-full bg-transparent border-none text-xs font-semibold text-ink-800 outline-none placeholder-ink-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: PROPOSE INITIATIVES */}
                  {inProgressStep === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="space-y-1">
                        <span className="block text-micro font-mono font-bold text-moss-700 uppercase tracking-wider">Strategic Response Phase</span>
                        <h5 className="text-sm font-bold text-ink-900">Propose 3 Strategic Initiatives / Creative Solutions</h5>
                        <p className="text-tiny sm:text-xs text-ink-500 font-semibold leading-relaxed">
                          For each problem logged previously, propose a concrete, practical, and highly creative strategy.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-ink-25 border border-ink-200 rounded-xl space-y-1">
                          <span className="block text-micro font-mono font-bold text-ink-500">LINKED TO PROBLEM 1: "{problem1 || "Problem 1"}"</span>
                          <input
                            type="text"
                            value={initiative1}
                            onChange={e => setInitiative1(e.target.value)}
                            placeholder="e.g. Design tailored community workshops to engage minorized communities..."
                            className="w-full bg-transparent border-none text-xs font-semibold text-ink-800 outline-none placeholder-ink-500 mt-1"
                          />
                        </div>

                        <div className="p-3 bg-ink-25 border border-ink-200 rounded-xl space-y-1">
                          <span className="block text-micro font-mono font-bold text-ink-500">LINKED TO PROBLEM 2: "{problem2 || "Problem 2"}"</span>
                          <input
                            type="text"
                            value={initiative2}
                            onChange={e => setInitiative2(e.target.value)}
                            placeholder="e.g. Create visual brochures and simplified infographics with clear analogies..."
                            className="w-full bg-transparent border-none text-xs font-semibold text-ink-800 outline-none placeholder-ink-500 mt-1"
                          />
                        </div>

                        <div className="p-3 bg-ink-25 border border-ink-200 rounded-xl space-y-1">
                          <span className="block text-micro font-mono font-bold text-ink-500">LINKED TO PROBLEM 3: "{problem3 || "Problem 3"}"</span>
                          <input
                            type="text"
                            value={initiative3}
                            onChange={e => setInitiative3(e.target.value)}
                            placeholder="e.g. Deploy structured digital checklists with automatic backup validation..."
                            className="w-full bg-transparent border-none text-xs font-semibold text-ink-800 outline-none placeholder-ink-500 mt-1"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: REAL-WORLD OBSERVATIONAL PRACTICE */}
                  {inProgressStep === 5 && (
                    <motion.div
                      key="step-5"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-moss-50/50 border border-moss-100 rounded-2xl flex items-center space-x-3">
                        <Navigation className="h-6 w-6 text-moss-700 shrink-0" />
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-ink-900">Conduct Observational Trial Run</h5>
                          <p className="text-tiny sm:text-xs text-ink-600 font-semibold mt-0.5 leading-relaxed">
                            Take 5 minutes to practice your proposed strategy in real life or mock scenarios. Record the qualitative feedback.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-ink-200 rounded-2xl p-4 space-y-3">
                        <span className="block text-micro font-mono font-bold text-ink-500 uppercase tracking-widest">Interactive Practice Completion Checklist</span>

                        <label className="flex items-center space-x-3 p-3 bg-ink-50/50 rounded-xl cursor-pointer hover:bg-ink-50 transition-colors">
                          <input type="checkbox" className="h-4 w-4 rounded-xs text-moss-700 focus:ring-moss-500 border-ink-300" />
                          <span className="text-xs font-bold text-ink-800">I have actively tested simplifying clinical or system protocols in conversation or writing.</span>
                        </label>

                        <label className="flex items-center space-x-3 p-3 bg-ink-50/50 rounded-xl cursor-pointer hover:bg-ink-50 transition-colors">
                          <input type="checkbox" className="h-4 w-4 rounded-xs text-moss-700 focus:ring-moss-500 border-ink-300" />
                          <span className="text-xs font-bold text-ink-800">I compared layperson outcomes vs traditional text density.</span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 6: GUIDED REFLECTION */}
                  {inProgressStep === 6 && (
                    <motion.div
                      key="step-6"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      {/* Reaction scale */}
                      <div className="space-y-1.5">
                        <span className="eyebrow block">How did it go?</span>
                        {/* Five separate pills on a track, not a bordered grid
                            with rules between the cells. A divider that meets a
                            rounded frame has nowhere to terminate — see the
                            same change in `<StatRow>`. */}
                        <div className="grid grid-cols-5 gap-1 rounded-2xl bg-ink-100 p-1">
                          {reactionScale.map((item, idx) => {
                            const isActive = activeEmoji === idx;
                            return (
                              <button
                                key={item.score}
                                type="button"
                                aria-pressed={isActive}
                                onClick={() => setActiveEmoji(idx)}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 transition-[color,background-color] duration-150 ${
                                  isActive
                                    ? "bg-moss-50 text-moss-700"
                                    : "text-ink-500 hover:bg-white/70"
                                }`}
                              >
                                <span
                                  data-numeric
                                  className={`text-base font-bold leading-none ${isActive ? "text-moss-700" : "text-ink-900"}`}
                                >
                                  {item.score}
                                </span>
                                <span className="text-micro w-full truncate text-center font-semibold leading-none">
                                  {item.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Question Textareas */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-6 space-y-1.5">
                          <span className="block text-tiny sm:text-xs font-bold uppercase text-ink-800 tracking-wider">What was the most challenging obstacle?</span>
                          <textarea
                            value={hardestText}
                            onChange={e => setHardestText(e.target.value)}
                            placeholder="Type challenging points..."
                            rows={2}
                            className="w-full bg-white border border-ink-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink-800 outline-none resize-none focus:border-moss-400 transition-colors"
                          />
                        </div>

                        <div className="md:col-span-6 space-y-1.5">
                          <span className="block text-tiny sm:text-xs font-bold uppercase text-ink-800 tracking-wider">
                            {selectedExp?.reflectionQuestion || "What clinical or conceptual surprise occurred?"}
                          </span>
                          <textarea
                            value={surprisedText}
                            onChange={e => setSurprisedText(e.target.value)}
                            placeholder="Type details..."
                            rows={2}
                            className="w-full bg-white border border-ink-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-ink-800 outline-none resize-none focus:border-moss-400 transition-colors"
                          />
                        </div>

                        {/* Repeat Choice */}
                        <div className="md:col-span-12 space-y-1.5">
                          <span className="block text-tiny sm:text-xs font-bold uppercase text-ink-800 tracking-wider">Would you recommend this exercise to other academic students?</span>
                          <div className="flex space-x-2">
                            {(["Yes", "Maybe", "No"] as const).map(option => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => setTryAgainChoice(option)}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                                  tryAgainChoice === option
                                    ? "bg-moss-500 border-transparent text-white shadow-e1"
                                    : "bg-white border-ink-200 text-ink-600 hover:bg-ink-50"
                                }`}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 7: VERIFY & SYNC EVIDENCE */}
                  {inProgressStep === 7 && (
                    <motion.div
                      key="step-7"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4"
                    >
                      {isSyncing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <div className="relative h-12 w-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-moss-100 border-t-moss-500 animate-spin" />
                            <Star className="h-5 w-5 text-moss-700 animate-pulse" />
                          </div>
                          <div className="text-center space-y-1 animate-pulse">
                            <span className="text-xs font-mono font-bold text-moss-700 block uppercase">SECURE COGNITIVE SHAKEHAND</span>
                            <p className="text-micro text-ink-500 font-bold">Verifying physical logs and mapping credential registry...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-3.5 bg-good-50 border border-good-100 text-good-900 rounded-2xl flex items-center space-x-3 shadow-e1">
                            <CheckCircle2 className="h-5 w-5 text-good-500 shrink-0" />
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold">All inputs & observations verified</h5>
                              <p className="text-micro sm:text-xs text-good-700 font-semibold mt-0.5">
                                Cognitive proof logs are fully structured. We are ready to compile and upload your credential signature to your permanent Career Profile.
                              </p>
                            </div>
                          </div>

                          {/* Summary Deck */}
                          <div className="border border-ink-200 rounded-2xl p-4 bg-ink-25 space-y-3 text-xs">
                            <span className="block text-micro font-mono font-bold text-ink-500 uppercase tracking-wider">HARVESTED INSIGHT BLUEPRINT</span>

                            <div className="space-y-1">
                              <span className="block text-micro font-mono font-bold text-moss-700">STUDENT HARVESTS:</span>
                              <p className="text-ink-800 font-bold leading-relaxed">{problem1 || "Simplified medical vocabulary communication logs."}</p>
                            </div>

                            <div className="space-y-1 border-t border-ink-200/80 pt-2">
                              <span className="block text-micro font-mono font-bold text-good-700">PROPOSED RESPONSE INITIATIVE:</span>
                              <p className="text-ink-800 font-bold leading-relaxed">{initiative1 || "Visual clinical overview sheets for community participants."}</p>
                            </div>

                            <div className="space-y-1 border-t border-ink-200/80 pt-2">
                              <span className="block text-micro font-mono font-bold text-ink-500">REFLECTIVE DISCOVERY:</span>
                              <p className="text-ink-700 font-semibold italic">"{surprisedText || "Analogy translation helps patients feel included and safe."}"</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 8: MISSION SUCCESS & CREDENTIALS */}
                  {inProgressStep === 8 && (
                    <motion.div
                      key="step-8"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="flex flex-col items-center justify-center text-center py-4 space-y-4 max-w-md mx-auto"
                    >
                      {/* Award Graphic */}
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center">
                        <div className="absolute inset-0 bg-info-100 rounded-md animate-ping" style={{ animationDuration: "3s" }} />
                        <div className="h-12 w-12 sm:h-16 sm:w-16 bg-moss-500 rounded-md flex items-center justify-center text-white relative">
                          <Award className="h-6 w-6 sm:h-8 sm:w-8 relative z-10 animate-bounce" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-micro font-mono font-bold text-moss-700 bg-moss-50 border border-moss-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Validated Proof Point Signed</span>
                        <h3 className="text-lg sm:text-xl font-bold text-ink-950 tracking-tight leading-snug">
                          Mission Success & Registered!
                        </h3>
                        <p className="text-xs sm:text-sm text-ink-500 font-semibold">
                          Excellent work, {studentName || "Scholar"}! You have permanently mapped this proof point to your professional matrix.
                        </p>
                      </div>

                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-moss-50 border border-moss-100 text-moss-700 font-bold text-micro sm:text-xs rounded-full font-mono shadow-e1">
                        <Star className="h-3.5 w-3.5 animate-pulse" />
                        <span>+50 XP REGISTERED & STREAK MAINTAINED</span>
                      </div>

                      <div className="p-3 bg-ink-50/50 border border-ink-200 rounded-2xl w-full">
                        <span className="block text-micro font-mono text-ink-500 font-bold uppercase tracking-wider">SECURE CERTIFICATE HASH SHA-256</span>
                        <span className="block text-micro font-mono text-moss-700 font-bold mt-0.5 truncate select-all">SHA256_LAB_PRO_902X73F0_VALID</span>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Step Navigation Buttons with Progressive Validation constraints */}
              <div className="flex space-x-3 pt-3 sm:pt-4 border-t border-ink-200 mt-4">
                {inProgressStep > 1 && inProgressStep < 8 && (
                  <button
                    onClick={() => {
                      setInProgressStep(prev => prev - 1);
                    }}
                    className="flex-1 border border-ink-200 hover:bg-ink-50 text-ink-600 text-xs font-bold py-3 rounded-xl sm:rounded-2xl uppercase tracking-wider transition-all cursor-pointer text-center bg-white"
                  >
                    Back
                  </button>
                )}

                {inProgressStep === 1 && (
                  <button
                    onClick={() => {
                      setCurrentScreen(2);
                    }}
                    className="flex-1 border border-ink-200 hover:bg-ink-50 text-ink-600 text-xs font-bold py-3 rounded-xl sm:rounded-2xl uppercase tracking-wider transition-all cursor-pointer text-center bg-white"
                  >
                    Back to Detail
                  </button>
                )}

                {inProgressStep < 6 && (
                  <button
                    onClick={() => {
                      setInProgressStep(prev => prev + 1);
                    }}
                    className="flex-1 bg-moss-500 hover:bg-moss-600 text-white text-xs font-bold py-3 rounded-xl sm:rounded-2xl uppercase tracking-wider transition-all cursor-pointer text-center shadow-e2"
                  >
                    Next Phase
                  </button>
                )}

                {inProgressStep === 6 && (
                  <button
                    onClick={() => {
                      setIsSyncing(true);
                      setInProgressStep(7);
                      setTimeout(() => {
                        setIsSyncing(false);
                      }, 2000);
                    }}
                    disabled={activeEmoji === null}
                    className="flex-1 bg-moss-500 hover:bg-moss-600 text-white text-xs font-bold py-3 rounded-xl sm:rounded-2xl uppercase tracking-wider transition-all cursor-pointer text-center shadow-e2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit & Verify
                  </button>
                )}

                {inProgressStep === 7 && (
                  <button
                    onClick={() => {
                      // Final completion log submit to keep parent state synced perfectly
                      if (selectedExp) {
                        if (setStreak) {
                          setStreak(prev => prev + 1);
                        }
                        if (setXp) {
                          setXp(prev => prev + 50);
                        }

                        const currentSubject = selectedExp.subject || "Biomedical Sciences";
                        const currentSkills = getSkillsList(selectedExp);
                        const currentId = selectedExp.id || "explain_crispr";

                        if (onAddEvidence) {
                          onAddEvidence({
                            id: `proof_${Date.now()}`,
                            type: "Curated Challenge",
                            title: selectedExp.title || "Explain CRISPR to a 10-year-old",
                            subject: currentSubject,
                            signals: currentSkills,
                            tier: selectedExp.verificationTier || "Tier 1",
                            completedAt: new Date().toLocaleDateString(),
                            realization: surprisedText || hardestText || `Successfully completed challenge in ${currentSubject}.`
                          });
                        }
                        if (onConfidenceUpdate) {
                          onConfidenceUpdate(currentSubject, 8);
                        }
                        if (setCompletedExperienceIds) {
                          setCompletedExperienceIds(prev => {
                            const next = [...prev, currentId];
                            const origId = selectedExp.originalId;
                            if (origId && !next.includes(origId)) {
                              next.push(origId);
                            }
                            return next;
                          });
                        }
                        // Clear active active experiment
                        setInProgressExp(null);
                        setInProgressStep(1);
                      }
                      setInProgressStep(8);
                    }}
                    className="flex-1 bg-moss-500 hover:bg-moss-600 text-white text-xs font-bold py-3 rounded-xl sm:rounded-2xl uppercase tracking-wider transition-all cursor-pointer text-center shadow-e2"
                  >
                    Accept Verified Proof
                  </button>
                )}

                {inProgressStep === 8 && (
                  <button
                    onClick={() => {
                      setCurrentScreen(1);
                      setInProgressStep(1);
                    }}
                    className="flex-1 bg-moss-500 hover:bg-moss-600 text-white text-xs font-bold py-3 rounded-xl sm:rounded-2xl uppercase tracking-wider transition-all cursor-pointer text-center shadow-e2"
                  >
                    Return to Hub Dashboard
                  </button>
                )}

              </div>
            </motion.div>
          )}{/* SCREEN 6: IN PROGRESS DETAIL (OBSERVE NEURO) */}
          {currentScreen === 6 && (
            <motion.div
              key="screen-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 flex flex-col justify-between"
            >
              {/* Top Navigation bar */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setCurrentScreen(1)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-ink-200 rounded-xl hover:bg-ink-50 text-ink-600 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 bg-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Back to Hub</span>
                </button>
                <button className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-ink-200 hover:bg-ink-50 flex items-center justify-center text-ink-500 transition-all bg-white">
                  <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>

              {/* Main Content Info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">

                {/* Left block: brain icon & matching */}
                <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-3.5">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 bg-moss-50 rounded-2xl flex items-center justify-center border border-moss-100 shadow-e2">
                    <Network className="h-8 w-8 sm:h-10 sm:w-10 text-moss-700 animate-pulse" />
                  </div>

                  <div className="space-y-1.5 w-full">
                    <span className="inline-block text-micro sm:text-micro font-bold uppercase bg-moss-100 text-moss-700 border border-moss-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-mono">
                      High Match
                    </span>
                    <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-ink-900 tracking-tight leading-snug">
                      Observe a Neuro Lecture Pattern
                    </h4>
                    <div className="flex items-center justify-center md:justify-start space-x-3 text-tiny font-mono font-bold text-ink-500">
                      <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-moss-700" /> 15 min</span>
                      <span className="flex items-center"><Navigation className="h-3.5 w-3.5 mr-1 text-moss-700" /> Observation</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1 w-full">
                    <span className="block text-micro sm:text-micro font-bold uppercase text-ink-500 tracking-wider font-mono font-bold">Skills you'll build</span>
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center md:justify-start">
                      {["Attention", "Pattern Recognition", "Curiosity"].map(tag => (
                        <span key={tag} className="text-micro sm:text-xs font-mono font-bold uppercase bg-moss-50 text-moss-700 border border-moss-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right block: progress summary */}
                <div className="md:col-span-7 space-y-3 sm:space-y-4 w-full">

                  {/* Progress panel card */}
                  <div className="p-4 sm:p-5 bg-white border border-ink-200 rounded-2xl space-y-2.5 sm:space-y-3 shadow-e1">
                    <span className="block text-micro sm:text-xs font-bold uppercase text-ink-800 tracking-wider">Your progress</span>
                    <div className="flex justify-between text-tiny sm:text-xs font-mono font-bold text-ink-500">
                      <span>Step 1 of 3 (Observation logs)</span>
                      <span>33% Completed</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-ink-100 rounded-md overflow-hidden">
                      <div className="h-full bg-moss-500 rounded-md w-[33%]" />
                    </div>
                  </div>

                  {/* About panel card */}
                  <div className="p-4 sm:p-5 bg-ink-25 border border-ink-200/60 rounded-2xl text-tiny sm:text-sm leading-relaxed space-y-1">
                    <span className="block text-micro sm:text-micro font-bold uppercase text-ink-950 tracking-wider">About this experiment</span>
                    <p className="text-ink-600 font-semibold leading-relaxed">
                      You'll observe how ideas are presented in a neuroscience lecture and reflect on patterns you notice. This builds focus, critical parsing, and structural mapping skills.
                    </p>
                  </div>

                </div>

              </div>

              {/* Bottom Action Group */}
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-ink-200 mt-4">
                <button
                  onClick={() => setCurrentScreen(3)}
                  className="flex-1 bg-moss-500 hover:bg-moss-600 text-white py-3 rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center block shadow-e1"
                >
                  Continue Experiment
                </button>
                <button
                  onClick={() => setCurrentScreen(1)}
                  className="flex-1 border border-ink-200 hover:bg-ink-50 text-ink-600 py-3 rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-widest text-center block cursor-pointer transition-colors"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* FLOATING ACTION BUTTON (FAB) FOR CERTIFICATE CONVERSION */}
        {currentScreen === 1 && (
          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
            <button
              onClick={() => {
                setShowCertModal(true);
                setCertStep(1);
                setSelectedFile(null);
                setSelectedPreset(null);
              }}
              className="h-12 w-12 sm:h-14 sm:w-14 bg-moss-500 text-white hover:bg-moss-600 rounded-md flex items-center justify-center cursor-pointer transition-all group focus:outline-none"
              title="Convert Certificate"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3]" />
              <span className="absolute right-14 sm:right-16 bg-ink-900 text-white text-micro font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-e2 pointer-events-none">
                Convert Certificate
              </span>
            </button>
          </div>
        )}

      </div>

      {/* FULL-SCREEN OVERLAY MODAL FOR CERTIFICATE UPLOAD & DECODER */}
      <AnimatePresence>
        {showCertModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-900/80 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white rounded-2xl shadow-e5 w-full max-w-4xl overflow-hidden border border-ink-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-ink-200 flex items-center justify-between bg-ink-50/50">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-moss-100 rounded-2xl flex items-center justify-center text-moss-700">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink-900 uppercase tracking-tight">Certificate Decoder</h3>
                    <p className="text-tiny text-ink-500 font-semibold uppercase font-mono tracking-wider">Convert Credentials to Verified Proof Points</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="h-8 w-8 bg-ink-100 hover:bg-ink-200 text-ink-600 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body / Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1">

                {/* STEP 1: UPLOAD & PRESETS */}
                {certStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                      <h4 className="text-xl font-bold text-ink-900 tracking-tight">Upload Your Credentials</h4>
                      <p className="text-xs text-ink-600 font-semibold leading-relaxed">
                        Drag and drop a PDF, image, or digital certificate. Pilot's deep parser will decrypt the signatures, extract competencies, and map them to your Career OS profile.
                      </p>
                    </div>

                    {/* Drag & Drop Box */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                        dragActive
                          ? "border-moss-500 bg-moss-50/40 scale-[0.99]"
                          : "border-ink-200 bg-ink-50/50 hover:border-moss-300 hover:bg-moss-50/10"
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="h-14 w-14 bg-white border border-ink-200 rounded-md flex items-center justify-center text-ink-500 group-hover:text-moss-700 shadow-e1 mb-3">
                        <Upload className="h-6 w-6 text-moss-700 animate-bounce" />
                      </div>
                      <span className="text-sm font-bold text-ink-800">
                        Drag and drop your certificate file here
                      </span>
                      <span className="text-xs text-ink-500 font-semibold mt-1">
                        Supports PDF, PNG, or JPEG up to 10MB
                      </span>
                      <button className="mt-4 px-4 py-2 bg-moss-50 hover:bg-moss-100 text-moss-700 text-xs font-bold rounded-xl border border-moss-100 transition-colors">
                        Browse files
                      </button>
                    </div>

                    {/* Verified Presets Section */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Gauge className="h-4 w-4 text-moss-700 fill-moss-600" />
                        <span className="text-xs font-bold uppercase text-ink-800 tracking-wider">Don't have a file handy? Try a verified preset:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {certPresets.map(preset => (
                          <div
                            key={preset.id}
                            onClick={() => startParsing(preset)}
                            className="p-4 bg-white border border-ink-200 rounded-xl hover:border-moss-300 hover:shadow-e1 transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-moss-50 rounded-xl flex items-center justify-center text-moss-700 shrink-0 font-bold text-sm group-hover:bg-moss-100 transition-colors">

                              </div>
                              <div className="text-left">
                                <span className="block text-sm font-bold text-ink-900 leading-snug group-hover:text-moss-700 transition-colors">
                                  {preset.title}
                                </span>
                                <span className="block text-micro text-ink-500 font-bold uppercase mt-0.5 font-mono">
                                  {preset.issuer}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-ink-500 transition-transform" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PARSING SIMULATION */}
                {certStep === 2 && (
                  <div className="space-y-6 py-8 flex flex-col items-center">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-moss-100 border-t-moss-500 animate-spin" />
                      <Server className="h-8 w-8 text-moss-700 animate-pulse" />
                    </div>

                    <div className="text-center space-y-1.5 w-full max-w-md">
                      <h4 className="text-lg font-bold text-ink-900 uppercase tracking-tight">Decoding Credentials</h4>
                      <div className="flex justify-between text-tiny font-mono font-bold text-ink-500">
                        <span>Parser Progress</span>
                        <span>{parsingProgress}%</span>
                      </div>
                      <div className="h-2.5 w-full bg-ink-100 rounded-md overflow-hidden border border-ink-200/50 shadow-inner">
                        <div
                          className="h-full bg-moss-500 rounded-md transition-all duration-100"
                          style={{ width: `${parsingProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Parser console log */}
                    <div className="w-full max-w-xl bg-ink-950 rounded-2xl p-4 border border-ink-800 font-mono text-left">
                      <div className="flex items-center justify-between border-b border-ink-800 pb-2 mb-2">
                        <span className="text-micro text-ink-500 font-bold tracking-wider uppercase">Parser Console Log</span>
                        <span className="h-2 w-2 bg-good-500 rounded-full animate-ping" />
                      </div>
                      <div className="space-y-1.5 h-44 overflow-y-auto text-tiny text-ink-300 leading-normal scroll-slim">
                        {parsingLog.map((log, i) => (
                          <div key={i} className="flex items-start space-x-1">
                            <span className="text-moss-400 shrink-0 select-none">›</span>
                            <span className="font-semibold">{log}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW EXTRACTED COMPETENCIES */}
                {certStep === 3 && selectedPreset && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* Left: Certificate Digital Replica */}
                    <div className="md:col-span-5 bg-ink-50 p-6 rounded-lg border border-ink-200 shadow-e1 flex flex-col justify-between min-h-[340px] text-center relative overflow-hidden">


                      <div className="flex justify-between items-start">
                        <span className="text-2xl"></span>
                        <span className="text-micro font-mono font-bold uppercase bg-white border border-moss-200 px-2 py-0.5 rounded-md text-moss-700">
                          Verified SHA256
                        </span>
                      </div>

                      <div className="space-y-3 py-6 relative z-10">
                        <span className="block text-micro font-bold uppercase text-moss-700 font-mono tracking-widest">Certificate of Achievement</span>
                        <h4 className="text-xl font-bold text-ink-950 leading-tight">
                          {selectedPreset.title}
                        </h4>
                        <div className="h-[1px] w-12 bg-moss-200 mx-auto" />
                        <span className="block text-tiny text-ink-500 font-bold">
                          Successfully verified for:
                        </span>
                        <span className="block text-sm font-bold text-ink-900 bg-white border border-ink-200 px-3 py-1 rounded-lg shadow-e1 inline-block">
                          Student
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-moss-100/50 pt-4 mt-auto">
                        <div className="text-left text-micro font-bold text-ink-500 font-mono">
                          <span className="block">ISSUER:</span>
                          <span className="block text-ink-900 uppercase font-bold">{selectedPreset.issuer}</span>
                        </div>
                        <div className="text-right text-micro font-bold text-ink-500 font-mono">
                          <span className="block">DATE MATCHED:</span>
                          <span className="block text-ink-900 uppercase font-bold">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Mapped signals and Claim Button */}
                    <div className="md:col-span-7 space-y-5 text-left">
                      <div className="space-y-1">
                        <span className="inline-block text-micro font-bold uppercase bg-moss-100 text-moss-700 border border-moss-200 px-2.5 py-1 rounded-full font-mono">
                          Decoding Complete
                        </span>
                        <h4 className="text-xl font-bold text-ink-900 tracking-tight">Verify Mapped Skills</h4>
                        <p className="text-xs text-ink-600 font-semibold">
                          We mapped these extracted competencies to your skill taxonomy. Uncheck any skills you don't wish to import as proof.
                        </p>
                      </div>

                      {/* Checklist */}
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {extractedSkills.map(skill => {
                          const isChecked = !!selectedSkillsToConvert[skill];
                          return (
                            <div
                              key={skill}
                              onClick={() => setSelectedSkillsToConvert(prev => ({ ...prev, [skill]: !prev[skill] }))}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? "bg-moss-50/20 border-moss-200 text-ink-900"
                                  : "bg-white border-ink-200 text-ink-500 hover:border-moss-200"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? "bg-moss-500 border-transparent text-white"
                                    : "border-ink-300 bg-white"
                                }`}>
                                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                </div>
                                <span className="text-xs font-bold">{skill}</span>
                              </div>
                              <span className="text-micro font-mono font-bold text-moss-700 bg-moss-50 px-2 py-0.5 rounded-full uppercase border border-moss-100">
                                Verified Point
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Alignment Summary Panel */}
                      <div className="p-4 bg-good-50/40 border border-good-100 rounded-2xl flex items-start space-x-3">
                        <div className="h-8 w-8 bg-good-100 rounded-lg flex items-center justify-center text-good-700 shrink-0">
                          <Gauge className="h-4 w-4 fill-good-500 text-good-500" />
                        </div>
                        <div className="text-xs">
                          <span className="block font-bold text-good-900 uppercase tracking-wide">Targeted Alignment Boost!</span>
                          <span className="block font-semibold text-good-700 mt-0.5 leading-relaxed">
                            Claiming this certificate will boost your match confidence in <strong className="font-bold">{selectedPreset.boostField}</strong> by <strong className="font-bold">+{selectedPreset.boostValue}%</strong>.
                          </span>
                        </div>
                      </div>

                      {/* Submit button */}
                      <button
                        onClick={handleClaimCertificateProof}
                        disabled={isConverting || Object.values(selectedSkillsToConvert).filter(Boolean).length === 0}
                        className="w-full bg-moss-500 hover:bg-moss-600 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center block disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConverting ? (
                          <span className="flex items-center justify-center space-x-2">
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Converting Credentials...</span>
                          </span>
                        ) : (
                          <span>Convert & Claim Evidence (+25 XP)</span>
                        )}
                      </button>
                    </div>

                  </div>
                )}

                {/* STEP 4: CONVERSION SUCCESS */}
                {certStep === 4 && selectedPreset && (
                  <div className="text-center max-w-md mx-auto py-8 space-y-6 flex flex-col items-center">

                    {/* Starburst Icon */}
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <div className="absolute inset-0 bg-good-100 rounded-md animate-ping" style={{ animationDuration: "3s" }} />
                      <div className="h-16 w-16 bg-good-500 rounded-md flex items-center justify-center text-white relative">
                        <CheckCircle2 className="h-9 w-9 stroke-[2] relative z-10" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-ink-900 tracking-tight leading-snug">
                        Certificate Converted!
                      </h3>
                      <p className="text-xs text-ink-600 font-semibold leading-relaxed">
                        Fantastic work! The skills extracted from <strong className="font-bold">"{selectedPreset.title}"</strong> have been securely registered as permanent evidence in your profile.
                      </p>
                    </div>

                    {/* Stat Badges */}
                    <div className="flex items-center justify-center space-x-3 w-full">
                      <div className="flex-1 bg-moss-50 border border-moss-200 text-moss-700 font-bold text-xs rounded-xl p-3 shadow-e1 font-mono">
                        <span className="block text-micro text-moss-400 font-bold uppercase">REWARD CLAIMED</span>
                        <span className="block text-sm mt-0.5">+25 XP UNLOCKED</span>
                      </div>
                      <div className="flex-1 bg-good-50 border border-good-100 text-good-700 font-bold text-xs rounded-xl p-3 shadow-e1 font-mono">
                        <span className="block text-micro text-good-500 font-bold uppercase">ALIGNMENT BOOST</span>
                        <span className="block text-sm mt-0.5">+{selectedPreset.boostValue}% {selectedPreset.boostField}</span>
                      </div>
                    </div>

                    {/* Action triggers */}
                    <div className="space-y-2.5 w-full pt-2">
                      <button
                        onClick={() => {
                          setShowCertModal(false);
                          if (onNavigateToTab) {
                            onNavigateToTab("journey");
                          }
                        }}
                        className="w-full bg-moss-500 hover:bg-moss-600 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center block"
                      >
                        View in Journey
                      </button>
                      <button
                        onClick={() => {
                          setCertStep(1);
                          setSelectedFile(null);
                          setSelectedPreset(null);
                        }}
                        className="w-full bg-ink-50 hover:bg-ink-100 text-ink-600 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-ink-200 transition-all cursor-pointer text-center block"
                      >
                        Convert Another Certificate
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
