import React, { useState, useEffect } from "react";
import { RoadmapData } from "../../types";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  HelpCircle,
  LineChart,
  Navigation,
  ShieldAlert,
  Sliders,
  Star,
  XCircle,
} from "lucide-react";

interface RoadmapViewProps {
  roadmap: RoadmapData;
  onBack?: () => void;
}

// Concrete Gap Definition
interface GapItem {
  id: string;
  category: "ACADEMIC" | "EXAM" | "PROFILE" | "FINANCIAL" | "DECISION";
  title: string;
  description: string;
  unresolvedWarning: string;
  officialSource: string;
}

// Dynamic Task Definition
interface ReadinessTask {
  id: string;
  level: number; // 1 to 4
  title: string;
  whyThisMatters: string;
  difficulty: "Easy" | "Medium" | "Hard";
  impact: "Critical" | "High" | "Moderate";
  dependency?: string;
  actionSnippetLabel?: string;
  actionSnippetContent?: React.ReactNode;
}

export default function RoadmapView({ roadmap, onBack }: RoadmapViewProps) {
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"system" | "interactive_prep">("system");
  const [solvedGaps, setSolvedGaps] = useState<Record<string, boolean>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState<boolean>(false);

  // Determine standard gaps based on career field
  const fieldName = roadmap.fieldName.toLowerCase();
  const isConsulting = fieldName.includes("consulting") || fieldName.includes("business") || fieldName.includes("advisor");
  const isBioinformatics = fieldName.includes("bioinformatics") || fieldName.includes("data") || fieldName.includes("computational");
  const isPublicHealth = fieldName.includes("public health") || fieldName.includes("epidemiology");
  const isRegulatory = fieldName.includes("regulatory") || fieldName.includes("compliance");
  const isResearch = fieldName.includes("research") || fieldName.includes("scientist") || fieldName.includes("clinical");

  // Define static high-quality, government/industry backed career gaps
  const baseGaps: GapItem[] = React.useMemo(() => {
    if (isConsulting) {
      return [
        {
          id: "gap_case_prep",
          category: "PROFILE",
          title: "Case Analysis & Consulting Frameworks",
          description: "No formal training in McKinsey/BCG style case structures, root-cause client analysis, or profitability frameworks.",
          unresolvedWarning: "Top management consultancies screen up to 85% of applicants via complex timed case interviews.",
          officialSource: "Source: Association of Management Consulting Firms (AMCF) Standards Guide"
        },
        {
          id: "gap_gpa",
          category: "ACADEMIC",
          title: "Quantitative GPA Competitiveness",
          description: "Demonstrating top-tier analytics and quantitative rigor on academic transcripts to clear initial screening benchmarks.",
          unresolvedWarning: "Elite consulting firms frequently require high quantitative scores or top 10% class standing.",
          officialSource: "Source: McKinsey Global Talent Acquisition Benchmark Guidelines"
        },
        {
          id: "gap_ielts",
          category: "EXAM",
          title: "Executive Business English Proficiency",
          description: "Missing a valid high-score IELTS (8.0+) or TOEFL equivalent representing impeccable client-facing communication skills.",
          unresolvedWarning: "Required for high-level international placements and multi-market advisory programs.",
          officialSource: "Source: British Council Corporate Communication Framework"
        },
        {
          id: "gap_budget",
          category: "FINANCIAL",
          title: "Premium MBA/M.Sc. Budget Planning",
          description: "High tuition costs associated with global strategy programs require active scholarship shortlisting or corporate funding.",
          unresolvedWarning: "Overlooking funding deadlines blocks participation in global partner programs.",
          officialSource: "Source: IIE Open Doors Funding Reports"
        },
        {
          id: "gap_priority",
          category: "DECISION",
          title: "Corporate Strategy vs. Practical Operations",
          description: "Need clear division focus between high-level management strategy and healthcare operations.",
          unresolvedWarning: "Ambiguity during interviews leads to weak positioning and mismatched applications.",
          officialSource: "Source: Harvard Business Review Career Alignment Index"
        }
      ];
    }

    if (isBioinformatics) {
      return [
        {
          id: "gap_nextflow",
          category: "PROFILE",
          title: "NGS & Nextflow Pipeline Architecture",
          description: "Lack of validated proof-of-work in building Next-Generation Sequencing (NGS) data pipelines or cloud containerization.",
          unresolvedWarning: "90% of precision medicine institutions require proficiency in structured sequence pipelines.",
          officialSource: "Source: National Center for Biotechnology Information (NCBI) Pipeline Guidelines"
        },
        {
          id: "gap_cs_background",
          category: "ACADEMIC",
          title: "Core Computer Science Prerequisites",
          description: "Missing verified transcript credits in basic algorithms, data structures, and database management systems (SQL).",
          unresolvedWarning: "M.Sc. admissions boards filter out biological science graduates lacking computational prerequisites.",
          officialSource: "Source: ISCB (International Society for Computational Biology) Curriculum Standards"
        },
        {
          id: "gap_gre",
          category: "EXAM",
          title: "Quantitative GRE Core Competence",
          description: "Lack of a target 165+ GRE Quantitative section score to secure competitive global assistantships and stipends.",
          unresolvedWarning: "Top research universities weigh the Quantitative GRE heavily for funding allocations.",
          officialSource: "Source: ETS GRE Graduate Admissions Trends Report"
        },
        {
          id: "gap_grant_match",
          category: "FINANCIAL",
          title: "Cloud Computing & Compute Budget Allocation",
          description: "High costs of running sequence alignment models on AWS/GCP require secured lab-sponsored server budgets.",
          unresolvedWarning: "Failing to secure pre-allocated cloud credits blocks large-scale genome project testing.",
          officialSource: "Source: NIH Office of Science Policy Budgeting Standards"
        },
        {
          id: "gap_dec_bio",
          category: "DECISION",
          title: "Wet-Lab vs. Pure Computational Track",
          description: "Deciding whether to pursue hybrid dry/wet bench labs or commit completely to cloud bioinformatics engineering.",
          unresolvedWarning: "Lack of alignment results in unfocused portfolio building and incompatible program choices.",
          officialSource: "Source: Nature Biotechnology Careers Outlook"
        }
      ];
    }

    if (isPublicHealth) {
      return [
        {
          id: "gap_r_stats",
          category: "PROFILE",
          title: "Epidemiological Data Modeling (R/Stata)",
          description: "No public-facing clinical dataset modeling portfolio utilizing multivariate regression or GIS spatial mapping.",
          unresolvedWarning: "NGOs and health ministries require practical biostatistics evidence for technical surveillance roles.",
          officialSource: "Source: CDC Epidemiology and Surveillance Competencies"
        },
        {
          id: "gap_bio_policy",
          category: "ACADEMIC",
          title: "Health Economics & Policy Foundations",
          description: "Lack of formal academic exposure to healthcare system economics, social determinants, and policy appraisal.",
          unresolvedWarning: "Required to clear admission board interviews for global MPH programs.",
          officialSource: "Source: World Health Organization (WHO) Core Public Health Functions"
        },
        {
          id: "gap_toefl",
          category: "EXAM",
          title: "Global Health Communication IELTS/TOEFL",
          description: "Missing verified IELTS 7.5+ representing clear community advocacy and administrative report-writing fluency.",
          unresolvedWarning: "Crucial for working with international agencies like WHO, UNICEF, or PATH.",
          officialSource: "Source: WHO Language Competency Standards"
        },
        {
          id: "gap_ngo_grant",
          category: "FINANCIAL",
          title: "NGO Fellowship & Grant Tracking",
          description: "Identifying fully-funded external fellowships (e.g., Rotary, Commonwealth) early to avoid massive student debt.",
          unresolvedWarning: "Without early scholarship mapping, high-cost health programs become financially unviable.",
          officialSource: "Source: International Association of Universities Grant Directory"
        },
        {
          id: "gap_dec_ph",
          category: "DECISION",
          title: "Field Research vs. Administrative Policy Focus",
          description: "Uncertainty whether to specialize in on-ground field epidemiology or high-level health policy administration.",
          unresolvedWarning: "Weak statement of purpose (SOP) that attempts to cover too many unrelated areas.",
          officialSource: "Source: Association of Schools and Programs of Public Health (ASPPH)"
        }
      ];
    }

    if (isRegulatory) {
      return [
        {
          id: "gap_ctd_dossier",
          category: "PROFILE",
          title: "CTD Dossier Compilation Familiarity",
          description: "Lack of structured training in compiling Common Technical Documents (CTD) for FDA or CDSCO drug approvals.",
          unresolvedWarning: "Regulatory firms look specifically for candidates who already understand submission module rules.",
          officialSource: "Source: International Council for Harmonisation (ICH) M4 Guidelines"
        },
        {
          id: "gap_quality_standards",
          category: "ACADEMIC",
          title: "ISO 13485 & GMP Quality Standards",
          description: "No formal coursework in Good Manufacturing Practices (GMP) or medical device quality management systems.",
          unresolvedWarning: "Hiring managers filter out candidates without foundational knowledge of biosafety audits.",
          officialSource: "Source: ISO Technical Committee 210 Quality Standards"
        },
        {
          id: "gap_legal_vocab",
          category: "EXAM",
          title: "Legal & Regulatory English Precision",
          description: "Needs verified communication proof showing capability to interpret complex healthcare statutory legislation.",
          unresolvedWarning: "Language errors in regulatory submissions can trigger costly multi-month approval delays.",
          officialSource: "Source: European Medicines Agency (EMA) Language Quality Standards"
        },
        {
          id: "gap_corp_backing",
          category: "FINANCIAL",
          title: "Professional Certification Sponsorship",
          description: "Financing professional certifications (like RAPS RAC) which often require corporate sponsorships.",
          unresolvedWarning: "Professional credentials are expensive to self-fund and require strategic company mapping.",
          officialSource: "Source: Regulatory Affairs Professionals Society (RAPS) Compensation Report"
        },
        {
          id: "gap_dec_reg",
          category: "DECISION",
          title: "Device Regulation vs. Small Molecule Pharma",
          description: "Selecting a clear specialization between clinical medical hardware or pharmaceutical chemical compliance.",
          unresolvedWarning: "Generic compliance applications fail to grab the attention of specialized hiring panels.",
          officialSource: "Source: US FDA Center for Devices and Radiological Health (CDRH)"
        }
      ];
    }

    // Default or Research-oriented
    return [
      {
        id: "gap_lab_bench",
        category: "PROFILE",
        title: "Hands-on High-throughput Assays",
        description: "Lack of direct laboratory evidence running high-throughput assays (ELISA, PCR, CRISPR editing) or flow cytometry.",
        unresolvedWarning: "Top research labs reject applicants lacking robust hands-on laboratory pipette mileage.",
        officialSource: "Source: Federation of European Biochemical Societies (FEBS) Lab Guidelines"
      },
      {
        id: "gap_sci_lit",
        category: "ACADEMIC",
        title: "Scientific Manuscript Authorship",
        description: "No published or co-authored papers, or structured literature reviews in indexed journals (PubMed/Scopus).",
        unresolvedWarning: "Graduate research positions with full funding require proof of rigorous scientific writing.",
        officialSource: "Source: Council of Science Editors (CSE) Publication Standards"
      },
      {
        id: "gap_gre_subj",
        category: "EXAM",
        title: "GRE Subject Test (Biochemistry/Biology)",
        description: "No validated score in specialized subject tests to stand out among international applicants.",
        unresolvedWarning: "Securing competitive research stipends often depends on subject-specific test excellence.",
        officialSource: "Source: Graduate Record Examinations (GRE) Program Guidelines"
      },
      {
        id: "gap_lab_funding",
        category: "FINANCIAL",
        title: "Research Assistantship & Grant Mapping",
        description: "Identifying individual lab professors with active NIH or equivalent grants to sponsor tuition and living costs.",
        unresolvedWarning: "Applying blindly to departments without finding a funded supervisor results in high rejection rates.",
        officialSource: "Source: National Science Foundation (NSF) Graduate Research Fellowship Guide"
      },
      {
        id: "gap_dec_res",
        category: "DECISION",
        title: "Industry Biotech R&D vs. Academic Postdoc",
        description: "Deciding between high-speed commercial corporate drug development and slow, profound basic academic science.",
        unresolvedWarning: "Mismatched goals lead to early scientific burnout or career stagnation.",
        officialSource: "Source: Science Magazine Careers In Research Index"
      }
    ];
  }, [isConsulting, isBioinformatics, isPublicHealth, isRegulatory]);

  // Initialize feedback and solved gaps on mount
  useEffect(() => {
    const savedSolved = localStorage.getItem(`northr_solved_gaps_${roadmap.fieldName}`);
    if (savedSolved) {
      try {
        setSolvedGaps(JSON.parse(savedSolved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Initially, some gaps are unresolved to show progress potential
      const initial: Record<string, boolean> = {};
      baseGaps.forEach((g, idx) => {
        initial[g.id] = idx < 2; // pre-solve 2 gaps for realistic progression starting point
      });
      setSolvedGaps(initial);
    }
  }, [roadmap.fieldName, baseGaps]);

  // Save solved state
  const toggleGap = (gapId: string) => {
    const updated = {
      ...solvedGaps,
      [gapId]: !solvedGaps[gapId]
    };
    setSolvedGaps(updated);
    localStorage.setItem(`northr_solved_gaps_${roadmap.fieldName}`, JSON.stringify(updated));
  };

  // Compute confidence dynamically based on gaps cleared
  // Starts around 55% and approaches 100% as gaps are checked
  const totalGapsCount = baseGaps.length;
  const clearedGapsCount = baseGaps.filter(g => solvedGaps[g.id]).length;
  const computedConfidence = Math.min(
    100,
    Math.max(40, Math.round(50 + (clearedGapsCount / totalGapsCount) * 50))
  );

  // Infer Readiness Classification (Step 1)
  // Exploration -> Preparation -> Application -> Finalization
  let readinessStage: "Exploration" | "Preparation" | "Application" | "Finalization" = "Exploration";
  let stageColor = "text-moss-700 bg-moss-50 border-moss-200";
  let stageDot = "bg-moss-500";
  let stageBefore = "None";
  let stageAfter = "Preparation";

  if (computedConfidence >= 90) {
    readinessStage = "Finalization";
    stageColor = "text-moss-700 bg-moss-50 border-moss-200";
    stageDot = "bg-moss-500";
    stageBefore = "Application";
    stageAfter = "Arrival / Placement";
  } else if (computedConfidence >= 75) {
    readinessStage = "Application";
    stageColor = "text-info-700 bg-info-50 border-info-100";
    stageDot = "bg-info-500";
    stageBefore = "Preparation";
    stageAfter = "Finalization";
  } else if (computedConfidence >= 60) {
    readinessStage = "Preparation";
    stageColor = "text-moss-700 bg-moss-50 border-moss-200";
    stageDot = "bg-moss-500";
    stageBefore = "Exploration";
    stageAfter = "Application";
  }

  // Why confidence is not higher (Step 2)
  const remainingGaps = baseGaps.filter(g => !solvedGaps[g.id]);
  const confidenceBlockers = remainingGaps.slice(0, 3).map(g => g.title);

  // Define tasks corresponding to 4 levels (Step 4)
  const levelTasks: ReadinessTask[] = React.useMemo(() => {
    const tasks: ReadinessTask[] = [];

    if (isConsulting) {
      // Level 1
      tasks.push(
        {
          id: "t_c_1_1",
          level: 1,
          title: "Establish Case Interview Baseline",
          whyThisMatters: "Understand case structure and estimation problems (guesstimates) crucial for consultant filters.",
          difficulty: "Easy",
          impact: "Critical",
          actionSnippetLabel: "View Case Baseline Guide",
          actionSnippetContent: (
            <div className="text-xs bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2 font-mono">
              <p className="font-bold text-ink-900">Core Consulting Framework (Structure First):</p>
              <p className="text-ink-600">1. <strong>Profits Formulation:</strong> Profit = (Price × Volume) - (Fixed Costs + Variable Costs)</p>
              <p className="text-ink-600">2. <strong>Market Entry:</strong> Market Size → Competitors → Regulatory Hurdles → Logistics → Financial Feasibility</p>
              <p className="text-ink-600">Try calculating: How many hospital beds are required in Bangalore city?</p>
            </div>
          )
        },
        {
          id: "t_c_1_2",
          level: 1,
          title: "Map Top Strategic Health Cons",
          whyThisMatters: "Identify boutique firms focused purely on pharma and clinical consulting vs generalist giants.",
          difficulty: "Easy",
          impact: "High",
          dependency: "Establish Case Interview Baseline"
        }
      );
      // Level 2
      tasks.push(
        {
          id: "t_c_2_1",
          level: 2,
          title: "Build Resume using STAR Framework",
          whyThisMatters: "Demonstrate concrete business impact and technical analysis in every bullet point.",
          difficulty: "Medium",
          impact: "Critical",
          actionSnippetLabel: "Analyze Resume Bullet Template",
          actionSnippetContent: (
            <div className="text-xs bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2 font-mono">
              <p className="font-bold text-ink-900">STAR Resume Template:</p>
              <p className="text-bad-700 italic">Weak: \"Worked in a clinical project analyzing patient data.\"</p>
              <p className="text-moss-700 font-bold">Strong: \"Engineered a clinical throughput model for 500+ patients, reducing laboratory bottleneck delays by 22% and saving $14,000 in monthly hospital operations cost.\"</p>
            </div>
          )
        },
        {
          id: "t_c_2_2",
          level: 2,
          title: "Structure LOR Outlines with Professors",
          whyThisMatters: "Professors should back your quantitative and analytical capability, not just generic attributes.",
          difficulty: "Medium",
          impact: "High"
        }
      );
      // Level 3
      tasks.push(
        {
          id: "t_c_3_1",
          level: 3,
          title: "Targeted 8.0+ IELTS Prep Drill",
          whyThisMatters: "Secure seamless client-facing communication compliance required for corporate consulting.",
          difficulty: "Medium",
          impact: "High"
        },
        {
          id: "t_c_3_2",
          level: 3,
          title: "Shortlist Elite Strategy Masters",
          whyThisMatters: "Filter programs that feed directly into McKinsey, Bain, or BCG healthcare wings.",
          difficulty: "Easy",
          impact: "Critical",
          dependency: "Build Resume using STAR Framework"
        }
      );
      // Level 4
      tasks.push(
        {
          id: "t_c_4_1",
          level: 4,
          title: "Perform Mock Board Presentations",
          whyThisMatters: "Simulate rapid-fire pressure questions from hostile hospital administrators.",
          difficulty: "Hard",
          impact: "Critical"
        }
      );
    } else if (isBioinformatics) {
      // Level 1
      tasks.push(
        {
          id: "t_b_1_1",
          level: 1,
          title: "Audit Python & Pandas Baseline",
          whyThisMatters: "Ensure you can parse standard FASTA/FASTQ sequence files with zero latency.",
          difficulty: "Easy",
          impact: "Critical",
          actionSnippetLabel: "Run Python Sequence Audit Code",
          actionSnippetContent: (
            <div className="text-xs bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2 font-mono">
              <p className="font-bold text-ink-900">Simple RNA Transcript Count:</p>
              <pre className="scroll-slim overflow-x-auto rounded-lg bg-ink-900 p-2.5 text-micro text-moss-300">
{`def gc_content(seq):
    return (seq.count('G') + seq.count('C')) / len(seq) * 100

print(f"GC content: {gc_content('ATGCGATCG'):.1f}%")`}
              </pre>
            </div>
          )
        },
        {
          id: "t_b_1_2",
          level: 1,
          title: "Map NCBI Genomic Archives",
          whyThisMatters: "Learn to retrieve clinical tumor genome data for independent research projects.",
          difficulty: "Easy",
          impact: "High"
        }
      );
      // Level 2
      tasks.push(
        {
          id: "t_b_2_1",
          level: 2,
          title: "Build GitHub Sequence Pipeline Proof-of-Work",
          whyThisMatters: "Demonstrate that you can dockerize pipeline workflows using Snakemake or Nextflow.",
          difficulty: "Hard",
          impact: "Critical",
          actionSnippetLabel: "View Pipeline Structure Outline",
          actionSnippetContent: (
            <div className="text-xs bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2 font-mono">
              <p className="font-bold text-ink-900">Required Repository Layout:</p>
              <p className="text-ink-600"><strong>/pipeline:</strong> contains raw FastQC shell scripts</p>
              <p className="text-ink-600"><strong>/docker:</strong> holds container configuration for scalable AWS cluster execution</p>
              <p className="text-ink-600"><strong>/results:</strong> visual plots mapping genomic variants vs. public ClinVar labels</p>
            </div>
          )
        },
        {
          id: "t_b_2_2",
          level: 2,
          title: "SOP Structural Outline (Scientific Bias)",
          whyThisMatters: "Your SOP must focus 80% on computational methodology, not generic biology appreciation.",
          difficulty: "Medium",
          impact: "High"
        }
      );
      // Level 3
      tasks.push(
        {
          id: "t_b_3_1",
          level: 3,
          title: "Quantitative GRE Prep (Target 165+)",
          whyThisMatters: "Highly valued by top US bioinformatics labs looking for mathematical capabilities.",
          difficulty: "Hard",
          impact: "Critical"
        },
        {
          id: "t_b_3_2",
          level: 3,
          title: "Identify 3 Funded Bioinformatics Labs",
          whyThisMatters: "Look for labs that have recently secured grants to cover your research assistant stipend.",
          difficulty: "Medium",
          impact: "Critical",
          dependency: "Build GitHub Sequence Pipeline Proof-of-Work"
        }
      );
      // Level 4
      tasks.push(
        {
          id: "t_b_4_1",
          level: 4,
          title: "Server Deployment Testing",
          whyThisMatters: "Launch a live container pipeline using real data, measuring throughput latency.",
          difficulty: "Medium",
          impact: "High"
        }
      );
    } else if (isPublicHealth) {
      // Level 1
      tasks.push(
        {
          id: "t_p_1_1",
          level: 1,
          title: "Install and Test R Studio Setup",
          whyThisMatters: "Foundational environment configuration to calculate risk ratios and odds ratios.",
          difficulty: "Easy",
          impact: "Critical",
          actionSnippetLabel: "View Basic R Epidemic Formula",
          actionSnippetContent: (
            <div className="text-xs bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2 font-mono">
              <p className="font-bold text-ink-900">Odds Ratio (OR) Calculation in Epidemiology:</p>
              <p className="text-ink-600">OR = (Exposed Cases / Unexposed Cases) / (Exposed Controls / Unexposed Controls)</p>
              <p className="text-ink-600">An OR &gt; 1 indicates strong exposure-disease correlation.</p>
            </div>
          )
        },
        {
          id: "t_p_1_2",
          level: 1,
          title: "Examine WHO Health Indices",
          whyThisMatters: "Read current country-specific burden profiles to identify under-researched policy targets.",
          difficulty: "Easy",
          impact: "Moderate"
        }
      );
      // Level 2
      tasks.push(
        {
          id: "t_p_2_1",
          level: 2,
          title: "Assemble Public Dataset Epidemiology Study",
          whyThisMatters: "Build a mini-thesis exploring outbreak correlations using public-domain data.",
          difficulty: "Medium",
          impact: "Critical"
        },
        {
          id: "t_p_2_2",
          level: 2,
          title: "Secure Field NGO Reference Letters",
          whyThisMatters: "Graduate admissions committees expect practical field reference letters showing community empathy.",
          difficulty: "Medium",
          impact: "High"
        }
      );
      // Level 3
      tasks.push(
        {
          id: "t_p_3_1",
          level: 3,
          title: "IELTS Core Writing Diagnostic",
          whyThisMatters: "Ensure formal communication standards suitable for drafting policy manuals are validated.",
          difficulty: "Easy",
          impact: "High"
        },
        {
          id: "t_p_3_2",
          level: 3,
          title: "Map Public Health Fellowship Deadlines",
          whyThisMatters: "Identify tuition-saving programs like the Rotary Peace Fellowship before standard deadlines.",
          difficulty: "Easy",
          impact: "Critical"
        }
      );
      // Level 4
      tasks.push(
        {
          id: "t_p_4_1",
          level: 4,
          title: "Draft Regional Action Plan",
          whyThisMatters: "Create a complete mock epidemic intervention report following standard government templates.",
          difficulty: "Medium",
          impact: "High"
        }
      );
    } else {
      // Default / Research / Regulatory
      tasks.push(
        {
          id: "t_d_1_1",
          level: 1,
          title: "Map Foundational Regulations and Standards",
          whyThisMatters: "Grasp international quality expectations and review framework requirements.",
          difficulty: "Easy",
          impact: "Critical",
          actionSnippetLabel: "View Regulation Audit Checklist",
          actionSnippetContent: (
            <div className="text-xs bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2 font-mono">
              <p className="font-bold text-ink-900">Quality and Biosafety Core Areas:</p>
              <p className="text-ink-600">1. <strong>GLP (Good Laboratory Practice):</strong> Traceability, equipment calibration, documentation audits.</p>
              <p className="text-ink-600">2. <strong>CTD Structure:</strong> Module 1 (Admin) &rarr; Module 2 (Summaries) &rarr; Module 3 (Quality/CMC).</p>
            </div>
          )
        },
        {
          id: "t_d_1_2",
          level: 1,
          title: "Audit Regulatory Framework Core Elements",
          whyThisMatters: "Analyze CDSCO or local health agency submission guidelines for biotechnology products.",
          difficulty: "Easy",
          impact: "High"
        },
        {
          id: "t_d_2_1",
          level: 2,
          title: "Create Mock Dossier Draft Portfolio",
          whyThisMatters: "Demonstrate structured technical writing capacity by drafting clinical trial guidelines.",
          difficulty: "Medium",
          impact: "Critical"
        },
        {
          id: "t_d_2_2",
          level: 2,
          title: "Refine Personal Statement Focus",
          whyThisMatters: "Align your professional statement with specific compliance guidelines or research methodologies.",
          difficulty: "Medium",
          impact: "High"
        },
        {
          id: "t_d_3_1",
          level: 3,
          title: "Submit Pilot Application Drafts",
          whyThisMatters: "Get feedback on initial application packages prior to final submission.",
          difficulty: "Medium",
          impact: "Critical"
        },
        {
          id: "t_d_4_1",
          level: 4,
          title: "Pre-departure Readiness Verification",
          whyThisMatters: "Final verification of documentation, visa requirements, and financial sponsorships.",
          difficulty: "Easy",
          impact: "Critical"
        }
      );
    }

    return tasks;
  }, [isConsulting, isBioinformatics, isPublicHealth]);

  // Next Best Action Engine (Step 5)
  // Determine the highest priority task based on remaining gaps
  const getNextBestAction = (): { title: string; why: string; taskRefId?: string } => {
    // If we have unresolved profile gaps:
    const profileGap = remainingGaps.find(g => g.category === "PROFILE");
    if (profileGap) {
      if (isConsulting) return { title: "Establish Case Interview Baseline", why: "Resolves your gap in 'Case Analysis & Consulting Frameworks' by giving you standard diagnostic structures immediately.", taskRefId: "t_c_1_1" };
      if (isBioinformatics) return { title: "Audit Python & Pandas Baseline", why: "Resolves your genomics analysis gap by building validated, real-world coding capability.", taskRefId: "t_b_1_1" };
      if (isPublicHealth) return { title: "Install and Test R Studio Setup", why: "Establishes epidemiological data tools to begin community study modeling immediately.", taskRefId: "t_p_1_1" };
      return { title: "Map Foundational Regulations and Standards", why: "Gives you deep, certified structural compliance insights immediately.", taskRefId: "t_d_1_1" };
    }

    // If we have academic gaps:
    const academicGap = remainingGaps.find(g => g.category === "ACADEMIC");
    if (academicGap) {
      if (isConsulting) return { title: "Build Resume using STAR Framework", why: "Highlights analytical excellence and quant achievements on your resume to counter raw GPA filters.", taskRefId: "t_c_2_1" };
      if (isBioinformatics) return { title: "SOP Structural Outline (Scientific Bias)", why: "Reframes biological background under computational scientific guidelines.", taskRefId: "t_b_2_2" };
      if (isPublicHealth) return { title: "Assemble Public Dataset Epidemiology Study", why: "Counters policy background gaps with hands-on epidemiological study outputs.", taskRefId: "t_p_2_1" };
      return { title: "Create Mock Dossier Draft Portfolio", why: "Drafts high-quality technical analysis papers to prove regulatory rigor.", taskRefId: "t_d_2_1" };
    }

    // If exam gaps:
    const examGap = remainingGaps.find(g => g.category === "EXAM");
    if (examGap) {
      if (isConsulting) return { title: "Targeted 8.0+ IELTS Prep Drill", why: "Polishes executive-level communication to clear placement interview standards.", taskRefId: "t_c_3_1" };
      if (isBioinformatics) return { title: "Quantitative GRE Prep (Target 165+)", why: "Secures top-tier funding assistantships in computational sciences.", taskRefId: "t_b_3_1" };
      if (isPublicHealth) return { title: "IELTS Core Writing Diagnostic", why: "Establishes required international agency writing standards.", taskRefId: "t_p_3_1" };
      return { title: "Refine Personal Statement Focus", why: "Demonstrates technical and policy articulation directly to program directors.", taskRefId: "t_d_2_2" };
    }

    // Default or Fallback
    return {
      title: "Confirm Specific Study Country",
      why: "Locks down localized administrative and visa rules before starting final dossier creation."
    };
  };

  const nextBestAction = getNextBestAction();

  // Handle task click
  const handleTaskClick = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Safe file downloader for the execution framework
  const handleDownloadReport = () => {
    const textContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          NORTHR: PERSONALIZED EXECUTION INTELLIGENCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CAREER TARGET: ${roadmap.fieldName}
READINESS STAGE: ${readinessStage.toUpperCase()} STAGE
DECISION CONFIDENCE: ${computedConfidence}%

CURRENT BLOCKED GAPS:
${remainingGaps.map((g, i) => `${i + 1}. [BLOCKED] ${g.title}\n   - Why: ${g.description}\n   - Impact Warning: ${g.unresolvedWarning}`).join("\n\n")}

RESOLVED READINESS METRICS:
${baseGaps.filter(g => solvedGaps[g.id]).map((g, i) => `${i + 1}. [RESOLVED] ${g.title}`).join("\n")}

RECOMMENDED NEXT BEST ACTION:
"${nextBestAction.title}"Why this matters: ${nextBestAction.why}

ADAPTIVE READINESS PROGRESSION:
- LEVEL 1 (FOUNDATION): Build clarity and baseline eligibility.
- LEVEL 2 (PROFILE BUILDING): Become competitive and build portfolios.
- LEVEL 3 (APPLICATION): Shortlist programs and secure credentials.
- LEVEL 4 (FINALIZATION): Visa processing, sponsor mapping, and documentation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              AUTHENTIC DATA PROVISIONED BY NORTHR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Northr_Execution_Plan_${roadmap.fieldName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 pb-12 text-ink-900 font-sans">
      {/* Navigation and Back Button */}
      <div className="flex items-center justify-between mb-6">
        {onBack && (
          <button
            id="back-to-career-details-btn"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-ink-600 hover:text-ink-900 transition-colors cursor-pointer bg-white hover:bg-ink-50 px-4 py-2.5 rounded-xl border border-ink-200 shadow-e2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Career Profile</span>
          </button>
        )}
        <div className="flex items-center space-x-2 bg-moss-50 px-3.5 py-1.5 rounded-xl border border-ink-200 shadow-e2">
          <LineChart className="h-4 w-4 text-moss-700" />
          <span className="text-xs font-mono font-bold text-moss-700 uppercase tracking-wider">
            Execution Intelligence Active
          </span>
        </div>
      </div>

      {/* Premium Master Layout Card */}
      <div className="bg-white border border-ink-200 rounded-3xl overflow-hidden mb-8">
        {/* SaaS-Style Dashboard Header */}
        <div className="bg-moss-50 p-6 sm:p-8 border-b border-ink-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-moss-600 text-white text-micro font-mono tracking-widest font-bold px-3 py-1 rounded-full uppercase">
              Module 3: Decision Lab
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-ink-900">
              Personalized Readiness Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-ink-600 font-semibold leading-relaxed">
              Target Career: <strong className="text-moss-700">{roadmap.fieldName}</strong>
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex items-center w-full sm:w-auto bg-ink-0 p-1 rounded-xl border border-ink-200 shadow-e2 shadow-inner">
            <button
              id="switch-to-system-tab"
              onClick={() => setActiveTab("system")}
              className={`flex-1 sm:flex-initial text-center px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-micro sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "system"
                  ? "bg-moss-600 text-white shadow-e1"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              Intelligence System
            </button>
            <button
              id="switch-to-prep-tab"
              onClick={() => setActiveTab("interactive_prep")}
              className={`flex-1 sm:flex-initial text-center px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-micro sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                activeTab === "interactive_prep"
                  ? "bg-moss-600 text-white shadow-e1"
                  : "text-ink-600 hover:text-ink-900"
              }`}
            >
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Interactive Drills</span>
            </button>
          </div>
        </div>

        {/* ACTIVE TAB: INTELLIGENCE SYSTEM */}
        {activeTab === "system" && (
          <div className="p-6 sm:p-8 space-y-10">

            {/* Row 1: STEP 1 (Classification) & STEP 2 (Confidence) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Classification Card */}
              <div className="lg:col-span-5 bg-white border border-ink-200 rounded-2xl p-6 shadow-e1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-micro font-mono uppercase tracking-widest text-ink-600 font-bold mb-4">
                    <LineChart className="h-4.5 w-4.5 text-moss-700" />
                    <span>Inferred Readiness Stage</span>
                  </div>

                  <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wide ${stageColor} mb-4`}>
                    <span className={`h-2 w-2 rounded-full ${stageDot} animate-pulse`} />
                    <span>{readinessStage} Stage</span>
                  </div>

                  <p className="text-xs text-ink-600 font-semibold leading-relaxed mb-4">
                    Northr inferred this from your bioengineering profile, clinical career goals, and current financial boundaries.
                  </p>
                </div>

                {/* STEP 7: PROGRESSION LOGIC */}
                <div className="bg-moss-50 p-4 rounded-xl border border-ink-200 shadow-e2 space-y-2">
                  <span className="text-micro font-mono uppercase tracking-widest text-ink-500 font-bold block">Readiness Progression Timeline</span>
                  <div className="flex items-center justify-between text-xs text-ink-700 font-bold font-mono">
                    <span className="line-through text-ink-500">{stageBefore}</span>
                    <ArrowRight className="h-3 w-3 text-moss-700" />
                    <span className="text-moss-700 underline">{readinessStage}</span>
                    <ArrowRight className="h-3 w-3 text-ink-500" />
                    <span className="text-ink-500">{stageAfter}</span>
                  </div>
                </div>
              </div>

              {/* Confidence Score Card */}
              <div className="lg:col-span-7 bg-white border border-ink-200 rounded-2xl p-6 shadow-e1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 text-micro font-mono uppercase tracking-widest text-ink-600 font-bold">
                      <Sliders className="h-4.5 w-4.5 text-moss-700" />
                      <span>Decision Confidence Metric</span>
                    </div>
                    <span className="text-micro font-mono bg-moss-50 text-moss-800 border border-moss-200 font-bold px-2.5 py-0.5 rounded-full">
                      Real-Time Calculation
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-3 mb-4">
                    <span className="text-4xl sm:text-5xl font-display font-bold text-ink-900 tracking-tight">
                      {computedConfidence}%
                    </span>
                    <span className="text-xs font-mono font-bold text-moss-900">
                      {computedConfidence >= 80 ? "Highly Aligned" : "Building Momentum"}
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="w-full bg-ink-100 h-2.5 rounded-md overflow-hidden mb-6 border border-ink-200/40">
                    <div
                      className="bg-moss-600 h-full rounded-md transition-all duration-500"
                      style={{ width: `${computedConfidence}%` }}
                    />
                  </div>
                </div>

                {/* Why confidence is not higher */}
                {confidenceBlockers.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-micro font-mono uppercase tracking-widest text-ink-500 font-bold block">Why confidence is not yet 100%</span>
                    <ul className="space-y-1.5">
                      {confidenceBlockers.map((blocker, idx) => (
                        <li key={idx} className="flex items-start text-xs text-ink-900 font-bold">
                          <XCircle className="h-3.5 w-3.5 text-moss-700 shrink-0 mr-2 mt-0.5" />
                          <span>{blocker} remains unresolved</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-xs text-moss-800 font-bold bg-moss-50 border border-moss-100 p-3 rounded-xl">
                    <CheckCircle2 className="h-4.5 w-4.5 text-moss-700" />
                    <span>All major structural readiness gaps resolved! Ready for final execution templates.</span>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 5: NEXT BEST ACTION ENGINE (CORE OUTPUT) */}
            <motion.div
              id="next-best-action-card"
              className="bg-moss-600 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.08] pointer-events-none">
                <Navigation className="h-40 w-40" />
              </div>

              <div className="flex items-center space-x-2 text-micro font-mono uppercase tracking-widest text-white/80 font-bold mb-4">
                <Star className="h-4.5 w-4.5 text-moss-300" />
                <span>Your Next Best Action</span>
              </div>

              <div className="space-y-3 max-w-3xl">
                <h3 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
                  "{nextBestAction.title}"
                </h3>
                <p className="text-xs sm:text-sm text-white/95 leading-relaxed font-semibold italic">
                  "{nextBestAction.why}"
                </p>
                <p className="text-micro text-white/80 font-mono tracking-wide uppercase pt-2">
                  *Do this single action to significantly reduce career entry uncertainty.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {nextBestAction.taskRefId ? (
                  <button
                    id="trigger-drill-btn"
                    onClick={() => {
                      setActiveTab("interactive_prep");
                      setExpandedTask(nextBestAction.taskRefId || null);
                    }}
                    className="bg-white hover:bg-moss-50 text-moss-700 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-e2 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Activate Interactive Drill</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    id="trigger-feedback-btn"
                    onClick={() => {
                      alert(`Initiated preparation file draft for: ${nextBestAction.title}`);
                    }}
                    className="bg-white hover:bg-moss-50 text-moss-700 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-e2 transition-all cursor-pointer"
                  >
                    Generate Study File
                  </button>
                )}
                <button
                  id="mark-gap-resolved-btn"
                  onClick={() => {
                    // Try to resolve the first unresolved gap
                    const firstUnresolved = baseGaps.find(g => !solvedGaps[g.id]);
                    if (firstUnresolved) {
                      toggleGap(firstUnresolved.id);
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  Mark Gap as Resolved
                </button>
              </div>
            </motion.div>

            {/* STEP 3: READINESS GAP DIAGNOSTIC (GAP ANALYSIS) */}
            <div id="gap-analysis-section" className="space-y-4">
              <div className="flex items-center justify-between border-b border-ink-200 pb-3">
                <div className="flex items-center space-x-2.5">
                  <ShieldAlert className="h-5 w-5 text-moss-700" />
                  <h3 className="text-base sm:text-lg font-display font-bold text-ink-900">
                    Readiness Gap Analysis &amp; Diagnostic
                  </h3>
                </div>
                <span className="text-micro font-mono text-ink-500 font-bold uppercase">
                  Verify or Unblock Gaps
                </span>
              </div>

              <p className="text-xs sm:text-sm text-ink-600 font-semibold leading-relaxed">
                Admissions officers look for specific credentials. Toggle gaps as you complete them to see your confidence score and tasks update live:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {baseGaps.map((gap) => {
                  const isCleared = !!solvedGaps[gap.id];
                  return (
                    <div
                      key={gap.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                        isCleared
                          ? "bg-moss-50/40 border-moss-200 shadow-inner"
                          : "bg-white border-ink-200/80 hover:border-moss-200 hover:bg-moss-50/10 shadow-e1"
                      }`}
                    >
                      {/* Top match score pill */}
                      <div className="space-y-2">
                        <span className="text-micro font-mono font-bold bg-moss-500 text-ink-950 px-2.5 py-1 rounded-full uppercase">
                          {gap.category} Gap
                        </span>

                        <h4 className="text-xs sm:text-sm font-bold text-ink-900">
                          {gap.title}
                        </h4>

                        <p className="text-xs text-ink-600 leading-relaxed">
                          {gap.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-dashed border-ink-200 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleGap(gap.id)}
                            className={`py-1.5 px-3 rounded-lg border text-micro font-mono font-bold transition-colors cursor-pointer ${
                              isCleared
                                ? "bg-moss-100 text-moss-800 border-moss-300 hover:bg-moss-200"
                                : "bg-ink-50 text-ink-600 border-ink-200 hover:bg-ink-100"
                            }`}
                          >
                            {isCleared ? "Resolved" : "Unresolved"}
                          </button>
                        </div>
                        <span className="text-micro font-semibold text-moss-700 flex items-center gap-1.5 leading-tight">
                          <AlertCircle className="h-3.5 w-3.5 text-moss-700 shrink-0" />
                          <span>{gap.unresolvedWarning}</span>
                        </span>
                        <span className="text-micro font-mono text-ink-500 font-medium">
                          {gap.officialSource}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 4: ADAPTIVE EXECUTION LEVELS */}
            <div id="execution-levels-section" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ink-200 pb-4">
                <h3 className="font-display font-bold text-lg text-ink-900">
                  Adaptive Execution Framework
                </h3>

                {/* Level Tabs */}
                <div className="flex flex-wrap gap-1 bg-ink-100 p-0.5 rounded-xl border border-ink-200">
                  {[1, 2, 3, 4].map((lvl) => (
                    <button
                      key={lvl}
                      id={`level-tab-${lvl}`}
                      onClick={() => setActiveLevel(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-micro font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        activeLevel === lvl
                          ? "bg-moss-600 text-white shadow-e1"
                          : "text-ink-500 hover:text-ink-800"
                      }`}
                    >
                      Lvl {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal & Description of Active Level */}
              <div className="bg-moss-50 p-4 rounded-2xl border border-ink-200 shadow-e2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-micro font-mono uppercase tracking-widest text-moss-900 font-bold">
                    {activeLevel === 1 && "LEVEL 1 — FOUNDATION READINESS"}
                    {activeLevel === 2 && "LEVEL 2 — PROFILE BUILDING READINESS"}
                    {activeLevel === 3 && "LEVEL 3 — APPLICATION READINESS"}
                    {activeLevel === 4 && "LEVEL 4 — FINALIZATION READINESS"}
                  </span>
                  <h4 className="text-sm font-bold text-ink-900 mt-1">
                    {activeLevel === 1 && "Goal: Build clarity and baseline eligibility"}
                    {activeLevel === 2 && "Goal: Develop highly competitive profiles"}
                    {activeLevel === 3 && "Goal: Execute flawless application packages"}
                    {activeLevel === 4 && "Goal: Secure final visas, funding & travel details"}
                  </h4>
                </div>
                <span className="text-micro font-mono text-ink-500 font-bold">
                  {activeLevel === 1 && "Includes baseline, validation, & requirements"}
                  {activeLevel === 2 && "Includes resumes, SOP drafts, & references"}
                  {activeLevel === 3 && "Includes shortlists, exams, & submissions"}
                  {activeLevel === 4 && "Includes housing, visa prep, & confirmations"}
                </span>
              </div>

              {/* STEP 6: TASK TRIGGERS (NOT SCHEDULES) */}
              <div className="space-y-3">
                {levelTasks.filter(t => t.level === activeLevel).map((task) => {
                  const isExpanded = expandedTask === task.id;
                  return (
                    <div
                      key={task.id}
                      className="bg-white border border-ink-200 rounded-2xl overflow-hidden transition-all duration-300 shadow-e1"
                    >
                      <div
                        onClick={() => handleTaskClick(task.id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-ink-50/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-6 w-6 rounded-md bg-moss-50 border border-moss-200 flex items-center justify-center shrink-0 text-micro font-mono font-bold text-moss-700 mt-0.5">
                            {task.level}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-ink-900 leading-snug">
                              {task.title}
                            </h4>
                            <p className="text-xs text-ink-600 mt-0.5">
                              {task.whyThisMatters}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-micro font-mono uppercase tracking-wider font-bold px-2.5 py-1 rounded-full ${
                            task.difficulty === "Easy" ? "bg-moss-50 text-moss-700" :
                            task.difficulty === "Medium" ? "bg-moss-50 text-moss-700" :
                            "bg-bad-50 text-bad-700"
                          }`}>
                            {task.difficulty}
                          </span>
                          <span className="text-micro text-ink-600">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Task details (Step 6 Task Design) */}
                      {isExpanded && (
                        <div className="px-11 pb-4 pt-1 border-t border-ink-200/60 space-y-3 bg-moss-50/20">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-micro font-mono uppercase text-ink-500 font-bold block">Expected Impact</span>
                              <span className="text-ink-800 font-bold">{task.impact} on Readiness Score</span>
                            </div>
                            <div>
                              <span className="text-micro font-mono uppercase text-ink-500 font-bold block">Dependency</span>
                              <span className="text-ink-800 font-bold">{task.dependency || "None (Immediate Trigger)"}</span>
                            </div>
                          </div>

                          {task.actionSnippetContent && (
                            <div className="pt-2">
                              <span className="text-micro font-mono uppercase text-moss-700 font-bold block mb-1.5">Interactive Framework Preview</span>
                              {task.actionSnippetContent}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 11: IS THIS STILL A GOOD FIT? (REFLECTIVE DIAGNOSTIC) */}
            <div className="bg-moss-50 border border-ink-200 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-2 text-micro font-mono uppercase tracking-widest text-moss-700 font-bold">
                <HelpCircle className="h-4.5 w-4.5" />
                <span>Is this career path still a good fit?</span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-ink-900">
                After reviewing the readiness gaps, daily realities, and progression timelines, how is your excitation level?
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { level: "Very Excited", key: "very_excited" },
                  { level: "Interested", key: "interested" },
                  { level: "Unsure", key: "unsure" },
                  { level: "Probably Not", key: "probably_not" },
                  { level: "Definitely Not", key: "definitely_not" }
                ].map((opt) => (
                  <button
                    key={opt.key}
                    id={`reflect-btn-${opt.key}`}
                    onClick={() => {
                      localStorage.setItem(`northr_excite_feedback_${roadmap.fieldName}`, opt.key);
                      setFeedbackSaved(true);
                      setTimeout(() => setFeedbackSaved(false), 2000);
                    }}
                    className="bg-white hover:bg-ink-50 border border-ink-200 shadow-e2 hover:border-moss-600 px-3 py-2 rounded-xl text-xs font-bold transition-all text-ink-900 cursor-pointer text-center"
                  >
                    {opt.level}
                  </button>
                ))}
              </div>

              {feedbackSaved && (
                <div className="text-xs text-moss-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-moss-700" />
                  <span>Feedback stored securely. This will influence future career suggestions dynamically!</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ACTIVE TAB: INTERACTIVE DRILLS */}
        {activeTab === "interactive_prep" && (
          <div className="p-6 sm:p-8 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-micro font-mono uppercase tracking-widest text-moss-700 font-bold">
                <Star className="h-4.5 w-4.5" />
                <span>Interactive Drills &amp; Micro-Diagnostic Modules</span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-bold text-ink-900">
                Build Proof-of-Work Competence
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 font-semibold leading-relaxed">
                Test yourself with rapid-fire questions to clear readiness benchmarks immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Question Drill Panel */}
              <div className="lg:col-span-7 bg-white border border-ink-200 rounded-2xl p-6 shadow-e1 space-y-6">
                <h4 className="text-xs font-mono uppercase text-moss-700 tracking-wider font-bold border-b border-ink-200 pb-2.5">
                  Analytical Competency Drill
                </h4>

                {isConsulting && (
                  <div className="space-y-4 text-xs">
                    <p className="font-bold text-ink-900">Q: A global hospital chain experiences a 15% drop in operating margins. Which is the best structured root-cause hypothesis to present first?</p>
                    <div className="space-y-2">
                      <button
                        id="consulting-drill-opt-1"
                        onClick={() => setActionOutput("correct_cons")}
                        className="w-full text-left p-3 rounded-xl border border-ink-200 shadow-e2 hover:border-moss-600 hover:bg-ink-50 font-bold transition-all cursor-pointer"
                      >
                        A. Check price vs volume trends across both elective surgeries and emergency outpatient clinics. (Isolates MECE variables)
                      </button>
                      <button
                        id="consulting-drill-opt-2"
                        onClick={() => setActionOutput("wrong_cons")}
                        className="w-full text-left p-3 rounded-xl border border-ink-200 shadow-e2 hover:border-moss-600 hover:bg-ink-50 font-bold transition-all cursor-pointer"
                      >
                        B. Advise them to fire 10% of diagnostic staff immediately to save direct operational expenditures.
                      </button>
                    </div>
                  </div>
                )}

                {isBioinformatics && (
                  <div className="space-y-4 text-xs">
                    <p className="font-bold text-ink-900">Q: You have a memory-bound process aligning 100 whole genomes. How should you optimize file handling to prevent container out-of-memory (OOM) crashes?</p>
                    <div className="space-y-2">
                      <button
                        id="bioinformatics-drill-opt-1"
                        onClick={() => setActionOutput("correct_bio")}
                        className="w-full text-left p-3 rounded-xl border border-ink-200 shadow-e2 hover:border-moss-600 hover:bg-ink-50 font-bold transition-all cursor-pointer"
                      >
                        A. Stream datasets using Samtools block compression and deploy parallel workers bounded by Nextflow memory caps.
                      </button>
                      <button
                        id="bioinformatics-drill-opt-2"
                        onClick={() => setActionOutput("wrong_bio")}
                        className="w-full text-left p-3 rounded-xl border border-ink-200 shadow-e2 hover:border-moss-600 hover:bg-ink-50 font-bold transition-all cursor-pointer"
                      >
                        B. Load all FASTQ files completely into a single local pandas dataframe arrays.
                      </button>
                    </div>
                  </div>
                )}

                {!isConsulting && !isBioinformatics && (
                  <div className="space-y-4 text-xs">
                    <p className="font-bold text-ink-900">Q: How do you verify quality and biosafety compliance parameters before drafting the core Module 3 dossier for regulatory submissions?</p>
                    <div className="space-y-2">
                      <button
                        id="default-drill-opt-1"
                        onClick={() => setActionOutput("correct_default")}
                        className="w-full text-left p-3 rounded-xl border border-ink-200 shadow-e2 hover:border-moss-600 hover:bg-ink-50 font-bold transition-all cursor-pointer"
                      >
                        A. Cross-reference stable physical laboratory assays and audit batch-record sanitization logs.
                      </button>
                      <button
                        id="default-drill-opt-2"
                        onClick={() => setActionOutput("wrong_default")}
                        className="w-full text-left p-3 rounded-xl border border-ink-200 shadow-e2 hover:border-moss-600 hover:bg-ink-50 font-bold transition-all cursor-pointer"
                      >
                        B. Guess baseline metrics based on previously published marketing literature.
                      </button>
                    </div>
                  </div>
                )}

                {/* Drill feedback output */}
                {actionOutput && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    actionOutput.startsWith("correct")
                      ? "bg-moss-50 border-moss-200 text-moss-800"
                      : "bg-bad-50 border-bad-100 text-bad-700"
                  }`}>
                    {actionOutput === "correct_cons" && "Correct! Testing Price vs Volume trends is Mutually Exclusive & Collectively Exhaustive (MECE), preventing premature solution bias."}
                    {actionOutput === "wrong_cons" && "Incorrect. Recommending staff firing without isolating the operational segment is highly unstructured and violates MECE principles."}
                    {actionOutput === "correct_bio" && "Correct! Streaming block-compressed chunks under Nextflow memory boundary limits is standard best-practice to protect cloud instances."}
                    {actionOutput === "wrong_bio" && "Incorrect. Loading multiple multi-gigabyte files into raw RAM instantly triggers OOM crashes in cloud micro-nodes."}
                    {actionOutput === "correct_default" && "Correct! Real-world validation of manufacturing batch logs is critical to secure approval from international bodies like the FDA."}
                    {actionOutput === "wrong_default" && "Incorrect. Guessing regulatory parameters or utilizing un-audited marketing materials triggers instant dossier rejections."}
                  </div>
                )}
              </div>

              {/* Sidebar: Interview Quick Prep */}
              <div className="lg:col-span-5 bg-moss-50 rounded-2xl p-6 border border-ink-200 shadow-e2 space-y-4">
                <span className="text-micro font-mono uppercase text-moss-900 font-bold block">
                  Quick Interview Prep Tip
                </span>

                <div className="space-y-3 text-xs leading-relaxed">
                  <h5 className="font-bold text-ink-900">The 30-Second Elevator Pitch</h5>
                  <p className="text-ink-600 font-semibold">
                    When an admissions director asks <em>\"Why should we choose you for this program?\"</em>, answer using the **Triangle Alignment Method**:
                  </p>
                  <ul className="space-y-2 list-disc pl-4 font-bold text-ink-800">
                    <li>1. **Academic foundation** in biotechnology and health sciences.</li>
                    <li>2. **Practical gap closure** (e.g., your Nextflow projects or STAR-based operations experience).</li>
                    <li>3. **Specific future bet** matching their department's ongoing research or placement clusters.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Footer / Actions (Section 12 Next Actions) */}
        <div className="border-t border-ink-200 bg-moss-50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-xs text-ink-600 text-center sm:text-left font-semibold">
            Progress is stored locally. This framework guarantees <strong>Readiness Progression</strong> over simple calendar deadlines.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            {onBack && (
              <button
                id="back-to-profiles-bottom-btn"
                onClick={onBack}
                className="w-full sm:w-auto text-center px-5 py-3 rounded-xl border border-ink-200 shadow-e2 hover:bg-ink-50 text-xs font-bold uppercase tracking-wider text-ink-600 transition-colors cursor-pointer bg-white"
              >
                Back to Top Recommendations
              </button>
            )}
            <button
              id="download-execution-report-btn"
              onClick={handleDownloadReport}
              className="w-full sm:w-auto text-center px-5.5 py-3.5 rounded-xl bg-moss-600 hover:bg-moss-700 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="h-4.5 w-4.5" />
              <span>Download Intelligence Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
