import { Experience } from "../types";
import { experienceLibrary } from "../data/experienceLibrary";

// Cognitive Budget Tiers replacing traditional difficulty
export type CognitiveLoad = "Passive" | "Light" | "Focused" | "Deep";

export interface DailyReality {
  workload: "Low" | "Medium" | "High";
  academicFocus: "Lectures" | "Exams" | "Practical Labs" | "Vacation";
  energyLevel: "Low" | "Medium" | "High";
  availableHours: number; // 1 to 5+ hours
}

export interface PilotExperience {
  id: string; // "PILOT_P1", "PILOT_L2" etc.
  originalId?: string; // Reference to experienceLibrary if applicable
  type: "Structured" | "Parameterized" | "Dynamic" | "Passive";
  title: string;
  subject: string;
  cognitiveLoad: CognitiveLoad;
  estimatedTime: string;
  rationale: string; // Explains "Why you are seeing this"
  expectedOutcome: string; // "Expected learning outcome"
  situationHook: string;
  goal: string;
  microtasks: string[];
  reflectionQuestion: string;
  skillsTargeted: string[];
  careerPathway: string;
  isCustomGenerated?: boolean;
}

// 1. Passive Experiments Database (Zero work, observational, massive behavioral signals)
const PASSIVE_EXPERIMENTS: Omit<PilotExperience, "rationale" | "expectedOutcome">[] = [
  {
    id: "PAS_1",
    type: "Passive",
    title: "The Leadership Observer",
    subject: "NORTHR Core",
    cognitiveLoad: "Passive",
    estimatedTime: "5-10 minutes during lab",
    situationHook: "During today's practical lab session, something will inevitably go slightly wrong — a missing reagent, a frozen computer, or a misread step in the protocol.",
    goal: "Silently observe who naturally steps up to solve the issue, and how others react. Do not intervene yourself.",
    microtasks: [
      "Wait for a minor friction point or confusion in today's lab.",
      "Notice who takes charge: do they dictate, coordinate, or sit back?",
      "Observe the tone they use: is it panic-driven, logical, or defensive?",
      "Pay attention to your own reaction: did you feel like stepping in, or were you happier letting them handle it?"
    ],
    reflectionQuestion: "What did the person who took charge do right, and would you have done it differently?",
    skillsTargeted: ["Leadership Observation", "Team Dynamics", "Stress Shield"],
    careerPathway: "Healthcare Administration & Leadership"
  },
  {
    id: "PAS_2",
    type: "Passive",
    title: "The Time Loss Metric",
    subject: "NORTHR Core",
    cognitiveLoad: "Passive",
    estimatedTime: "Entire day",
    situationHook: "You attend several lectures and study sessions every day. Some of them drag on forever, while during others, you look at the clock and are shocked that an hour has passed.",
    goal: "Identify the exact moment today where you completely lost track of time because you were genuinely absorbed.",
    microtasks: [
      "Throughout the day, check in with yourself after each class or study session.",
      "Note down which specific slide, problem, or explanation caught your focus.",
      "Identify if you lost track of time because of the topic itself, or because of how it was presented."
    ],
    reflectionQuestion: "Which specific topic today made your mind active rather than passive?",
    skillsTargeted: ["Self-Awareness", "Intrinsic Motivation Tracking"],
    careerPathway: "Research & Development"
  },
  {
    id: "PAS_3",
    type: "Passive",
    title: "Professor's Uncertainty Shield",
    subject: "NORTHR Core",
    cognitiveLoad: "Passive",
    estimatedTime: "During lecture",
    situationHook: "Your professors are experts, but they don't know literally everything. Today, a student will ask a complex or obscure question that the teacher might not have an immediate answer to.",
    goal: "Notice how the professor responds when they hit the limit of their current knowledge.",
    microtasks: [
      "Listen closely when an off-topic or deep question is asked during lecture.",
      "Observe the professor's pivot: Do they admit they don't know? Do they promise to look it up? Or do they redirect?",
      "Assess whether their response increases or decreases your respect for them."
    ],
    reflectionQuestion: "How did they project authority while handling uncertainty?",
    skillsTargeted: ["Critical Analysis", "Authority Dynamics"],
    careerPathway: "Strategic Advisory"
  },
  {
    id: "PAS_4",
    type: "Passive",
    title: "The Senior Specialisation Interview",
    subject: "NORTHR Core",
    cognitiveLoad: "Passive",
    estimatedTime: "10-minute casual chat",
    situationHook: "Seniors and professors have already made the choices you are currently stressing about. They chose biotech, bioinformatics, or clinical paths for reasons that might surprise you.",
    goal: "Ask one senior or professor a single, highly specific question about their choice, bypassing polite small talk.",
    microtasks: [
      "Catch a senior or young professor in the corridor or canteen during a free moment.",
      "Ask them: 'If you could go back to my semester, would you choose this exact track again? What was the catch?'",
      "Listen to whether they focus on the money, the research excitement, or the lifestyle."
    ],
    reflectionQuestion: "What did they tell you that you won't find in any brochure?",
    skillsTargeted: ["Informational Interviewing", "Skeptical Auditing"],
    careerPathway: "Healthcare Consulting"
  }
];

// 2. Parameterized Templates (Variable replacements based on student degree)
interface ParameterizedTemplate {
  templateId: string;
  title: string;
  cognitiveLoad: CognitiveLoad;
  estimatedTime: string;
  situationHookTemplate: string;
  goalTemplate: string;
  microtasksTemplate: string[];
  reflectionQuestionTemplate: string;
  skillsTargeted: string[];
  careerPathway: string;
  parameters: Record<string, {
    topic: string;
    specificHook: string;
    specificGoal: string;
    specificTasks: string[];
    specificReflection: string;
    outcome: string;
  }>;
}

const PARAMETERIZED_TEMPLATES: ParameterizedTemplate[] = [
  {
    templateId: "PARAM_EXPLAIN",
    title: "The Jargon-Free Translator",
    cognitiveLoad: "Light",
    estimatedTime: "25 minutes",
    situationHookTemplate: "A relative or non-science friend asks you about a buzzword in your field.",
    goalTemplate: "Explain a complex topic in simple everyday terms.",
    skillsTargeted: ["Scientific Translation", "Communications", "Empathy"],
    careerPathway: "Science Communication & Medical Affairs",
    microtasksTemplate: [],
    reflectionQuestionTemplate: "",
    parameters: {
      "B.Sc. Biotechnology": {
        topic: "CRISPR Gene Editing",
        specificHook: "Your cousin sees a sci-fi movie mentioning 'designer babies' and asks you at tea, 'So what is CRISPR? Can we actually edit humans like text files?'",
        specificGoal: "Explain CRISPR-Cas9 mechanism to them using a simple MS Word 'Find and Replace' or kitchen recipe analogy — with zero biochemical jargon.",
        specificTasks: [
          "Explain what CRISPR stands for but instantly throw away the acronym and translate it into a 'biological scissors and search bar'.",
          "Use a kitchen recipe book metaphor: a recipe has an error, and CRISPR goes in, finds the exact page, cuts the bad sentence, and pastes the correction.",
          "Check if they can repeat the concept back to you using your own metaphor."
        ],
        specificReflection: "Did they get stuck on the biological parts, or did the recipe metaphor clear things up completely?",
        outcome: "Proven ability to translate advanced genetic engineering into a highly intuitive commercial or public concept."
      },
      "B.Sc. Bioinformatics": {
        topic: "Sequence Alignment",
        specificHook: "Your younger sibling is playing a puzzle matching game and asks, 'What do computers actually do with all that DNA data?'",
        specificGoal: "Explain Sequence Alignment and string-matching to someone with no coding background using a spellchecker or book editing analogy.",
        specificTasks: [
          "Explain how DNA is just 4 letters (A, C, G, T) representing a book of instructions.",
          "Show them how aligning sequence fragments is like assembling shredded pages of a book by matching overlapping words.",
          "Ask them: 'How would you find a single typo in a million-letter book?' and observe their algorithmic intuition."
        ],
        specificReflection: "How did you explain 'mismatches' or 'gaps' without talking about dynamic programming matrices?",
        outcome: "Develops computational empathy — a core skill for bioinformatics specialists presenting pipelines to clinicians."
      },
      "B.Sc. Psychology": {
        topic: "Classical Conditioning",
        specificHook: "A friend complains that they keep checking their phone reflexively whenever it vibrates, even if they don't have a notification, and asks why.",
        specificGoal: "Explain Ivan Pavlov's Classical Conditioning using their phone notification reflex as the active clinical model.",
        specificTasks: [
          "Map out the stimulus-response chain: the buzz (unconditioned/conditioned) and the dopamine hit of reading a text.",
          "Explain how their brain has been hardwired to salivate for notifications just like Pavlov's dogs.",
          "Propose one practical micro-habit to 'de-condition' their reflex tonight."
        ],
        specificReflection: "Did they realize how easily human behavior is programmed by digital interfaces?",
        outcome: "Applies behavioral psychology principles directly to real-world software interactions and patient compliance."
      }
    }
  },
  {
    templateId: "PARAM_ABSTRACT",
    title: "The 3-Sentence Auditor",
    cognitiveLoad: "Focused",
    estimatedTime: "40 minutes",
    situationHookTemplate: "You are given a complex, highly academic research paper abstract filled with experimental data.",
    goalTemplate: "Deconstruct the paper's core claims, clinical relevance, and major weaknesses in exactly three bullet points.",
    skillsTargeted: ["Academic Deconstruction", "Data Auditing", "Synthesis"],
    careerPathway: "Research & Development / Medical Affairs",
    microtasksTemplate: [],
    reflectionQuestionTemplate: "",
    parameters: {
      "B.Sc. Biotechnology": {
        topic: "mRNA Vaccine Delivery",
        specificHook: "You open a highly cited paper on 'Lipid Nanoparticle Delivery systems for mRNA therapeutics' and feel completely overwhelmed by the chemical formulations.",
        specificGoal: "Isolate how lipid nanoparticles shield mRNA molecules, and write down why standard refrigerators are required for storage.",
        specificTasks: [
          "Find a recent free-access abstract on PubMed/Google Scholar about mRNA LNPs.",
          "Isolate the 'Vehicle': What exactly surrounds the mRNA?",
          "Write exactly one sentence explaining the biological barrier the vehicle is trying to bypass.",
          "Pinpoint the commercial/logistic challenge: Why is temperature sensitivity the biggest bottleneck?"
        ],
        specificReflection: "Did looking at the chemical structures freeze your brain, or did you successfully focus on the vehicle mechanism?",
        outcome: "Prepares you for technical consulting and scientific operations roles where understanding formulation bottlenecks is vital."
      },
      "B.Sc. Bioinformatics": {
        topic: "Single-Cell RNA-seq Clustering",
        specificHook: "A new preprint claims to have identified a novel subpopulation of cancer-associated fibroblasts using t-SNE dimensionality reduction.",
        specificGoal: "Read the methodology abstract to identify the exact filtering threshold they used to throw out noisy cell data.",
        specificTasks: [
          "Search Google Scholar for 'Single-Cell RNA-Seq t-SNE cluster filtering'.",
          "Identify the clustering algorithm: Is it Seurat, scanpy, or a custom R script?",
          "Locate the parameter: What gene count or mitochondrial percentage did they use to define a 'dead cell'?",
          "Write one sentence explaining why throwing out the wrong cells ruins the clinical hypothesis."
        ],
        specificReflection: "Did you find yourself more interested in the biological clustering results, or the statistical filtering threshold?",
        outcome: "Trains high-level sequence validation skills necessary for bio-IT audits and genomic pipeline designs."
      },
      "B.Sc. Psychology": {
        topic: "Neuroplasticity in Clinical Depression",
        specificHook: "An academic paper details how repetitive transcranial magnetic stimulation (rTMS) physically alters dendritic spine density in the prefrontal cortex.",
        specificGoal: "Identify the exact physical mechanism by which electromagnetic pulses trigger neuronal growth, bypassing pharmacology.",
        specificTasks: [
          "Find an abstract regarding rTMS dendritic density changes in clinical depression.",
          "Identify the dose: How many hertz/sessions did the patients receive?",
          "Isolate the biological change: Did the dendritic spines increase in count, length, or receptor density?",
          "Synthesize: Why is physical magnetic stimulation faster than traditional oral antidepressants?"
        ],
        specificReflection: "Are you excited by the neurological hardware changes, or do you find psychological talk therapy more compelling?",
        outcome: "Develops neuro-scientific rigor, preparing you for clinical psychology trials and psychiatric assistantships."
      }
    }
  }
];

// 3. Dynamic / On-The-Fly Experiences Creator
// Generates highly tailored experiences from career hypotheses on demand
export function generateDynamicExperience(
  studentDegree: string,
  targetCareer: string,
  completedCount: number
): PilotExperience {
  // Let's create an experience based on their specific targetCareer
  const cleanCareer = targetCareer.trim();
  
  if (cleanCareer.includes("Bioinformatics") || cleanCareer.includes("Computational")) {
    return {
      id: "DYN_BIO_1",
      type: "Dynamic",
      title: "The Sequence Pipeline Auditor",
      subject: "Bioinformatics",
      cognitiveLoad: "Deep",
      estimatedTime: "45 minutes",
      rationale: `Since you are aiming for ${cleanCareer} and have already proven computational interest, this dynamic experiment lets you audit a real genomic workflow configuration.`,
      expectedOutcome: "Learn to read and troubleshoot public gene sequencing pipelines (Nextflow/WDL) used by top bio-IT firms.",
      situationHook: "A clinical researcher hands you a Nextflow pipeline file that keeps crashing when aligning raw FastQ data. They ask, 'Is this a hardware out-of-memory issue, or did someone mistype a chromosome parameter?'",
      goal: "Simulate auditing a pipeline's genomic configuration script and identify key checkpoints.",
      microtasks: [
        "Search online for a simple public Nextflow genomic pipeline template (or look at a sample Nextflow.config on GitHub).",
        "Identify the 'processes': where does quality control (FastQC) stop and alignment (BWA/Bowtie) begin?",
        "Look for memory allocation variables: see how CPU cores are mapped to heavy alignment steps.",
        "Write down three key indicators that prove a genomic pipeline is ready for AWS/cloud scaling."
      ],
      reflectionQuestion: "Did configuring pipelines feel like annoying system administration, or did you enjoy setting up the scientific plumbing?",
      skillsTargeted: ["Pipeline Auditing", "Nextflow Foundations", "Bio-IT Scaling"],
      careerPathway: "Bioinformatics & Computational Biology",
      isCustomGenerated: true
    };
  }

  if (cleanCareer.includes("Consulting") || cleanCareer.includes("Strategy")) {
    return {
      id: "DYN_CON_1",
      type: "Dynamic",
      title: "The Clinic Bottleneck Diagnosis",
      subject: "Clinical Operations",
      cognitiveLoad: "Focused",
      estimatedTime: "35 minutes",
      rationale: "You've shown a strong commercial and analytical mind. Strategy consultants don't solve biology — they solve operational throughput. This experience tests your operational consulting logic.",
      expectedOutcome: "Develop high-level operational analysis models for medical clinics, a key skill for healthcare strategy firms.",
      situationHook: "A busy urban diagnostic lab in Bangalore is facing a 40-minute wait time for simple blood draws, causing 15% of walked-in patients to leave frustrated. The clinic director hires you to optimize the flow.",
      goal: "Map the patient journey from entry to exit, identify the structural bottleneck, and propose a high-ROI fix.",
      microtasks: [
        "List every single step a patient takes: Billing -> Token -> Waiting -> Phlebotomist -> Rest -> Exit.",
        "Identify where the bottleneck is likely situated (hint: is it the speed of the needle, or the manual billing queue?).",
        "Formulate a 'split-queue' solution: how can recurring patients bypass initial registration?",
        "Draft a 1-page consulting slide layout representing the financial cost of lost walk-ins vs. hiring one extra registration desk."
      ],
      reflectionQuestion: "Were you more satisfied by calculating the financial loss or by reorganizing the patient wait line?",
      skillsTargeted: ["Operational Diagnosis", "Financial Impact Modeling", "Patient Journey Mapping"],
      careerPathway: "Healthcare Strategy Consulting",
      isCustomGenerated: true
    };
  }

  // Default Clinical Research/Medical affairs
  return {
    id: "DYN_CLI_1",
    type: "Dynamic",
    title: "Phase I Safety Audit",
    subject: "Clinical Research",
    cognitiveLoad: "Deep",
    estimatedTime: "50 minutes",
    rationale: `As a student of ${studentDegree}, understanding clinical trial structures is critical. This dynamic experiment introduces you to clinical trials.`,
    expectedOutcome: "Understand how clinical trial protocols measure dose-limiting toxicities in real humans safely.",
    situationHook: "An oncology biotech firm is ready to test a new CDK4/6 inhibitor in humans for the first time. The lead investigator hands you the clinical protocol and says, 'Review our escalation design. Are we pushing the dose too fast?'",
    goal: "Understand how the '3+3 design' is used in Phase I trials to find the Maximum Tolerated Dose (MTD) without harming patients.",
    microtasks: [
      "Search for '3+3 clinical trial design' and read a quick summary of how patient cohorts are dosed.",
      "Understand the rule: Why do we treat 3 patients first, and only expand to 6 if a toxicity occurs?",
      "Draw a simple diagram or flowchart representing the escalation rules.",
      "Identify who makes the final call to stop a trial when a toxicity happens."
    ],
    reflectionQuestion: "Did studying the ethical and regulatory rules of dosing human volunteers feel exciting, or did you find the rigid protocols dry?",
    skillsTargeted: ["Trial Protocol Analysis", "Toxicology Escalation Logic", "Ethical Clinical Design"],
    careerPathway: "Clinical Research & Trial Operations",
    isCustomGenerated: true
  };
}

// Helper to parse estimated minutes from time string (e.g., "45 minutes" or "1.5 hours")
function parseEstimatedMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return 30; // Default
  const clean = timeStr.toLowerCase();
  
  if (clean.includes("hour")) {
    const match = clean.match(/([\d.]+)\s*hour/);
    if (match) return Math.round(parseFloat(match[1]) * 60);
    return 60;
  }
  
  const matchMin = clean.match(/(\d+)/);
  if (matchMin) return parseInt(matchMin[1], 10);
  
  return 30; // Default
}

// Helper to normalize degree names to exact parameterized template keys
export function normalizeDegree(degree: string | null | undefined): string {
  if (!degree) return "B.Sc. Biotechnology";
  const clean = degree.toLowerCase();
  if (clean.includes("bioinformatics") || clean.includes("computational")) {
    return "B.Sc. Bioinformatics";
  }
  if (clean.includes("psychology") || clean.includes("behavior") || clean.includes("clinical")) {
    return "B.Sc. Psychology";
  }
  if (clean.includes("biotechnology") || clean.includes("biotech") || clean.includes("biology")) {
    return "B.Sc. Biotechnology";
  }
  return "B.Sc. Biotechnology"; // Default fallback
}

// 4. Unified Pilot Orchestration Engine
export function getCuratedRecommendations(
  studentDegree: string,
  dailyReality: DailyReality,
  cognitiveBudget: CognitiveLoad,
  completedIds: string[],
  activeCareerHypotheses: string[] = []
): PilotExperience[] {
  const recommendations: PilotExperience[] = [];
  const completedSet = new Set(completedIds || []);

  const normalizedDegree = normalizeDegree(studentDegree);

  // Parse time budget (default to 2 hours if not specified or invalid)
  const reality = dailyReality || { workload: "Medium", academicFocus: "Lectures", energyLevel: "Medium", availableHours: 2 };
  const availableHrs = reality.availableHours && reality.availableHours > 0 ? reality.availableHours : 2;
  const minutesBudget = availableHrs * 60;

  // A. Determine appropriate target load levels based on cognitive budget override & daily reality
  // If workload is High or energy is Low, prioritize "Passive" and "Light" irrespective of budget!
  let targetLoads: CognitiveLoad[] = [cognitiveBudget];
  if (reality.workload === "High" || reality.energyLevel === "Low") {
    targetLoads = ["Passive", "Light"];
  } else if (cognitiveBudget === "Deep") {
    targetLoads = ["Deep", "Focused"];
  } else if (cognitiveBudget === "Focused") {
    targetLoads = ["Focused", "Light"];
  } else if (cognitiveBudget === "Light") {
    targetLoads = ["Light", "Passive"];
  } else if (cognitiveBudget === "Passive") {
    targetLoads = ["Passive", "Light"];
  }

  // B. Load from PASSIVE EXPERIMENTS first if Passive is targeted
  if (targetLoads.includes("Passive")) {
    const availablePassives = PASSIVE_EXPERIMENTS.filter(p => !completedSet.has(p.id));
    availablePassives.forEach(pas => {
      recommendations.push({
        ...pas,
        rationale: "Recommended for minimal energy days. Observe your live environment to gather heavy career signals with zero paperwork or coding.",
        expectedOutcome: "Develop raw self-awareness and situational observation skills used in executive leadership."
      });
    });
  }

  // C. Load from PARAMETERIZED TEMPLATES
  PARAMETERIZED_TEMPLATES.forEach(tmpl => {
    if (completedSet.has(tmpl.templateId)) return;
    if (targetLoads.includes(tmpl.cognitiveLoad)) {
      // Extract parameter for the specific degree
      const degreeParam = tmpl.parameters[normalizedDegree] || tmpl.parameters["B.Sc. Biotechnology"]; // Fallback
      if (degreeParam) {
        // Time audit optimization
        const estMinutes = parseEstimatedMinutes(tmpl.estimatedTime);
        const overBudget = estMinutes > minutesBudget;
        
        recommendations.push({
          id: tmpl.templateId,
          type: "Parameterized",
          title: `${tmpl.title} (Topic: ${degreeParam.topic})`,
          subject: studentDegree,
          cognitiveLoad: tmpl.cognitiveLoad,
          estimatedTime: tmpl.estimatedTime,
          rationale: overBudget 
            ? `[Time Crunch Adjustment] This is highly recommended for ${studentDegree} but may exceed your today's ${availableHrs}hr budget. Take it slow!` 
            : `Designed specifically for ${studentDegree} curriculum. This custom adaptation evaluates your competency in translating ${degreeParam.topic} into clean visual outputs.`,
          expectedOutcome: degreeParam.outcome,
          situationHook: degreeParam.specificHook,
          goal: degreeParam.specificGoal,
          microtasks: degreeParam.specificTasks,
          reflectionQuestion: degreeParam.specificReflection,
          skillsTargeted: tmpl.skillsTargeted,
          careerPathway: tmpl.careerPathway
        });
      }
    }
  });

  // D. Map and load from STRUCTURED templates (the raw library)
  // We translate difficulty: Beginner -> Light, Intermediate -> Focused, Advanced -> Deep
  const mappedLibrary: PilotExperience[] = experienceLibrary.map(exp => {
    let load: CognitiveLoad = "Light";
    if (exp.difficulty === "Advanced") load = "Deep";
    else if (exp.difficulty === "Intermediate") load = "Focused";
    else if (exp.difficulty === "Beginner") load = "Light";

    return {
      id: `${exp.subject.substring(0, 4).toUpperCase()}_${exp.id}`,
      originalId: exp.id,
      type: "Structured",
      title: exp.title,
      subject: exp.subject,
      cognitiveLoad: load,
      estimatedTime: exp.estimatedTime || "30 minutes",
      rationale: exp.whyChosen || "This core experiment challenges your practical competence.",
      expectedOutcome: exp.questionAnswered || "Validate real alignment with practical workflows in your target field.",
      situationHook: exp.situationHook || "",
      goal: exp.goal || "",
      microtasks: exp.microtasks || [],
      reflectionQuestion: exp.reflectionQuestion || "Did you enjoy this task?",
      skillsTargeted: (exp.primarySkills ? exp.primarySkills.split(",") : []).concat(exp.secondarySkills ? exp.secondarySkills.split(",") : []).map(s => s.trim()),
      careerPathway: exp.careerPathway || exp.subject
    };
  });

  // Filter out completed ones, checking both the prefixed ID and originalId
  const availableLibrary = mappedLibrary.filter(exp => {
    const isCompleted = completedSet.has(exp.id) || (exp.originalId && completedSet.has(exp.originalId));
    return !isCompleted;
  });

  // Sort available library using 70/30 Strategy
  // 70% matches: career hypotheses or primary subjects
  // 30% matches: adjacent subjects
  const cleanHypotheses = activeCareerHypotheses.filter(Boolean);
  const targetCareerFields = cleanHypotheses.length > 0
    ? cleanHypotheses.map(h => h.toLowerCase())
    : ["bioinformatics", "biotechnology"];

  const matchesHypotheses = (exp: PilotExperience) => {
    const pathLower = exp.careerPathway.toLowerCase();
    const subLower = exp.subject.toLowerCase();
    return targetCareerFields.some(field => pathLower.includes(field) || subLower.includes(field) || field.includes(pathLower) || field.includes(subLower));
  };

  const primaryLib = availableLibrary.filter(exp => targetLoads.includes(exp.cognitiveLoad) && matchesHypotheses(exp));
  const secondaryLib = availableLibrary.filter(exp => targetLoads.includes(exp.cognitiveLoad) && !matchesHypotheses(exp));

  // E. Push library items according to ratio
  let primaryCount = 0;
  let secondaryCount = 0;

  // We want a total of 3-5 curated recommendations. Let's aim for up to 4 structured recommendations
  primaryLib.forEach(item => {
    if (recommendations.length < 5 && primaryCount < 3) {
      const estMinutes = parseEstimatedMinutes(item.estimatedTime);
      const suffix = estMinutes > minutesBudget ? " [Exceeds target time budget]" : "";
      recommendations.push({
        ...item,
        rationale: `Strengthening Hypotheses (70% Fit Match): ${item.rationale}${suffix}`
      });
      primaryCount++;
    }
  });

  secondaryLib.forEach(item => {
    if (recommendations.length < 5 && secondaryCount < 2) {
      const estMinutes = parseEstimatedMinutes(item.estimatedTime);
      const suffix = estMinutes > minutesBudget ? " [Exceeds target time budget]" : "";
      recommendations.push({
        ...item,
        rationale: `Expanding Adjacent Horizons (30% Exploration Match): ${item.rationale}${suffix}`
      });
      secondaryCount++;
    }
  });

  // F. Dynamic Fill-up mechanism: If strict load constraints yield < 5 items, fill up with other available items
  if (recommendations.length < 5) {
    const currentRecIds = new Set(recommendations.map(r => r.id));
    const remainingLibrary = availableLibrary.filter(exp => !currentRecIds.has(exp.id));
    
    // Fallback 1: Primary matches under any other cognitive load
    const primaryFallback = remainingLibrary.filter(exp => matchesHypotheses(exp));
    primaryFallback.forEach(item => {
      if (recommendations.length < 5) {
        const estMinutes = parseEstimatedMinutes(item.estimatedTime);
        const suffix = estMinutes > minutesBudget ? " [Exceeds target time budget]" : "";
        recommendations.push({
          ...item,
          rationale: `Hypothesis Match (Alternative Load): ${item.rationale}${suffix}`
        });
      }
    });

    // Fallback 2: Any remaining exploratory items
    const remainingRecIds = new Set(recommendations.map(r => r.id));
    const secondaryFallback = remainingLibrary.filter(exp => !remainingRecIds.has(exp.id));
    secondaryFallback.forEach(item => {
      if (recommendations.length < 5) {
        const estMinutes = parseEstimatedMinutes(item.estimatedTime);
        const suffix = estMinutes > minutesBudget ? " [Exceeds target time budget]" : "";
        recommendations.push({
          ...item,
          rationale: `Exploratory Journey (Flexible Load): ${item.rationale}${suffix}`
        });
      }
    });
  }

  // G. Always inject at least ONE dynamic generated experience based on target careers if available
  const activeHypothesis = cleanHypotheses[0] || "Bioinformatics & Computational Biology";
  if (recommendations.length < 5) {
    const dyn = generateDynamicExperience(normalizedDegree, activeHypothesis, completedSet.size);
    const isDynCompleted = completedSet.has(dyn.id) || (dyn.originalId && completedSet.has(dyn.originalId));
    if (!isDynCompleted) {
      const estMinutes = parseEstimatedMinutes(dyn.estimatedTime);
      if (estMinutes > minutesBudget) {
        dyn.rationale = `[High Potential, High Duration] ${dyn.rationale}`;
      }
      recommendations.push(dyn);
    }
  }

  // Sort by time-budget alignment: matches that fit within the minutes budget are prioritized
  recommendations.sort((a, b) => {
    const timeA = parseEstimatedMinutes(a.estimatedTime);
    const timeB = parseEstimatedMinutes(b.estimatedTime);
    const fitsA = timeA <= minutesBudget ? 1 : 0;
    const fitsB = timeB <= minutesBudget ? 1 : 0;
    if (fitsA !== fitsB) return fitsB - fitsA; // Fits first
    return 0; // Maintain original catalog ranking otherwise
  });

  // Ensure unique elements and slice to max 5 recommendations
  const seenIds = new Set<string>();
  const uniqueRecommendations = recommendations.filter(r => {
    if (seenIds.has(r.id)) return false;
    seenIds.add(r.id);
    return true;
  });

  return uniqueRecommendations.slice(0, 5);
}
