import { CareerPath, RoadmapData } from "../types";

export interface CareerIntelligence {
  futureDemand: string;
  futureDemandSubtitle: string;
  salaryRange: string;
  yearsToEnter: string;
  aiRisk: string;
  aiSafetyLevel: string;
  aiSafetySubtitle: string;
  scholarshipAvailability: string;
  scholarshipsSubtitle: string;
  financingOutlook: string;
  
  // Section 3: What You Actually Do
  dailyResponsibilities: string[];
  weeklyResponsibilities: string[];
  majorDecisions: string[];
  workEnvironment: string;
  whoTheyWorkWith: string;
  successCriteria: string;
  
  // Section 4: Day in the Life
  dayInTheLife: string;
  
  // Section 5: Pros and Cons / Traits
  pros: string[];
  cons: string[];
  thriveTraits: string[];
  struggleWarning: string;
  
  // Section 6: Expected Progression
  timeline: { title: string; exp: string; desc: string }[];
  
  // Section 7: Global Opportunities
  globalOpportunities: {
    countries: string[];
    industries: string[];
    employers: string[];
    growthRegions: string;
    remoteWork: string;
  };
  
  // Section 8: Target Skills
  skills: {
    technical: { name: string; level: number }[];
    soft: { name: string; level: number }[];
    emerging: { name: string; level: number }[];
  };
  
  // Section 9: Educational Pathways
  education: {
    degrees: string[];
    masters: string[];
    alternative: string[];
    certifications: string[];
    bridgePrograms: string[];
  };
  
  // Section 10: Reality Check
  realityCheck: {
    challenges: string[];
    competition: string;
    stressLevel: string;
    learningCurve: string;
    typicalSetbacks: string[];
  };
}

// 100% Unique Career Intelligence Database for all 10 careers
const CAREER_INTEL_DB: Record<string, CareerIntelligence> = {
  "healthtech product management": {
    futureDemand: "High",
    futureDemandSubtitle: "Driven by digital health and patient-app adoption",
    salaryRange: "₹8.5L–₹18.2L",
    yearsToEnter: "2–4 Years",
    aiRisk: "Very Low Risk",
    aiSafetyLevel: "Outstanding",
    aiSafetySubtitle: "Completely Safe (High-Context Human Coordination)",
    scholarshipAvailability: "Rare",
    scholarshipsSubtitle: "Rare (Sponsorships restricted to corporate executives)",
    financingOutlook: "Mainly self-funded; premium MBA/PM courses have strong tie-ups with student loan providers.",
    dailyResponsibilities: [
      "Draft Product Requirement Documents (PRDs) for health/telemedicine features.",
      "Analyze patient drop-off funnels in appointment booking and medication tracker modules.",
      "Conduct user research interviews with active clinicians and hospital billing heads."
    ],
    weeklyResponsibilities: [
      "Coordinate weekly sprint grooming sessions with software engineering leads and UI/UX designers.",
      "Present user feedback summaries and conversion rates to the Chief Product Officer.",
      "Review regulatory compliance guidelines with HIPAA or regional medical privacy lawyers."
    ],
    majorDecisions: [
      "Prioritizing the feature roadmap (e.g., patient-doctor video chat vs automated billing integration).",
      "Deciding user interface adjustments based on doctor feedback vs engineering complexity."
    ],
    workEnvironment: "Modern technology office with high collaboration; frequent virtual sprint standups.",
    whoTheyWorkWith: "Software Engineers, UI/UX Designers, Clinical Consultants, Data Analysts, and Legal Advisers.",
    successCriteria: "Increased monthly active users (MAU), reduced patient flow friction, and 100% regulatory compliance.",
    dayInTheLife: "It's 8:30 AM. You log into Jira and review feedback on the latest beta release of a doctor-patient tele-consultation portal. You notice that 12% of doctors drop off during the clinical notes input phase. At 10:00 AM, you host a design sprint with UI/UX engineers to simplify the text-input UI. Over lunch, you draft a PRD for a new automated prescription-sharing feature. At 3:00 PM, you join a cross-functional alignment call with legal advisors to ensure the database meets HIPAA security standards. You close your laptop at 6:30 PM, after finalizing the engineering milestone timelines for the next sprint release.",
    pros: ["High starting compensation and rapid career growth", "Directly shapes user-facing medical technology", "Excellent networking across tech-leadership", "Zero lab-work or physical posture stresses"],
    cons: ["Heavy cross-functional negotiation burden", "Accountability for deadlines without direct authority", "Navigating slow medical compliance reviews", "Requires continuous technology upskilling"],
    thriveTraits: ["User Empathy", "Negotiation & Influence", "Data-Driven Prioritization", "Agile Execution"],
    struggleWarning: "If you dislike endless alignment meetings, struggle with conflicting feedback, or prefer working in isolation, product management will feel highly chaotic.",
    timeline: [
      { title: "Associate Product Manager (APM)", exp: "0–2 Years", desc: "Owns micro-features, writes PRDs, tracks bug tickets, and conducts basic competitive analysis." },
      { title: "Product Manager (PM)", exp: "2–5 Years", desc: "Owns an entire product module, aligns sprint schedules, and coordinates user-testing pipelines." },
      { title: "Senior Product Manager", exp: "5–8 Years", desc: "Defines long-term product vision, manages a team of APMs, and structures cross-functional product suites." },
      { title: "VP of Product / Head of Healthtech", exp: "8+ Years", desc: "Aligns technology roadmap with corporate financial goals and guides global expansion efforts." }
    ],
    globalOpportunities: {
      countries: ["USA", "Singapore", "United Kingdom", "Germany", "United Arab Emirates"],
      industries: ["Digital Therapeutics", "Electronic Health Records (EHR)", "Telemedicine", "Wearable Technology"],
      employers: ["Practo", "PharmEasy", "MediBuddy", "Tata 1mg", "Apollo 24/7"],
      growthRegions: "Silicon Valley, Bangalore Tech Corridor, and Berlin Healthtech Incubators.",
      remoteWork: "High; most tech companies operate fully remote or hybrid models."
    },
    skills: {
      technical: [
        { name: "Agile / Scrum Methodologies", level: 90 },
        { name: "Figma Wireframing", level: 80 },
        { name: "Product Analytics (Mixpanel)", level: 85 }
      ],
      soft: [
        { name: "Cross-Functional Influence", level: 95 },
        { name: "Executive Stakeholder Pitching", level: 90 },
        { name: "Empathetic User Interviewing", level: 92 }
      ],
      emerging: [
        { name: "AI Clinical Summarization PM", level: 85 },
        { name: "FHIR Interoperability Standards", level: 75 }
      ]
    },
    education: {
      degrees: ["Bachelor of Science", "Bachelor of Engineering", "BBA (Information Systems)"],
      masters: ["MBA (Product Management)", "Master of Science in Health Informatics"],
      alternative: ["Product School certificates", "Agile Scrum Master credentials"],
      certifications: ["Certified Scrum Product Owner (CSPO)", "Pragmatic Institute Level III"],
      bridgePrograms: ["Associate PM training programs inside top-tier healthtech unicorns."]
    },
    realityCheck: {
      challenges: ["Explaining complex clinical software barriers to business-minded marketing heads.", "Managing engineers who reject feature designs due to backend architectural constraints."],
      competition: "Fierce. Product roles attract elite tech talent and MBA graduates with high credentials.",
      stressLevel: "High — driven by tight launch deadlines and cross-functional friction.",
      learningCurve: "Steep — requires absorption of both clinical terminology and backend databases.",
      typicalSetbacks: ["A major feature launch getting delayed by 3 months due to unexpected regulatory filing changes.", "An app update causing a critical bug, requiring an emergency weekend hotfix."]
    }
  },
  "clinical data management": {
    futureDemand: "Steady",
    futureDemandSubtitle: "Driven by global clinical trial outsourcing to India",
    salaryRange: "₹4.2L–₹10.5L",
    yearsToEnter: "1–2 Years",
    aiRisk: "Moderate Risk",
    aiSafetyLevel: "Moderate",
    aiSafetySubtitle: "Moderate (Database validation partially automated)",
    scholarshipAvailability: "Available",
    scholarshipsSubtitle: "Available (CRO training allowances & company credits)",
    financingOutlook: "Extremely low training costs; CROs often sponsor certifications for incoming trainees.",
    dailyResponsibilities: [
      "Review Case Report Forms (CRFs) for data consistency and audit trail accuracy.",
      "Issue queries to clinical site investigators regarding missing or outlying patient records.",
      "Validate clinical database lock procedures against ICH-GCP regulatory guidelines."
    ],
    weeklyResponsibilities: [
      "Present database cleanliness charts and outstanding query logs to the clinical trial manager.",
      "Collaborate with clinical biostatisticians to prepare datasets for interim analysis.",
      "Verify electronic data capture (EDC) security locks and user-access directories."
    ],
    majorDecisions: [
      "Deciding whether a discrepant data point requires site re-verification or is a minor typographical error.",
      "Approving the final locking of a trial database module for regulatory reporting."
    ],
    workEnvironment: "Structured corporate office; quiet desktop environment with clear standardized processes.",
    whoTheyWorkWith: "Clinical Trial Investigators, Biostatisticians, QA Auditors, and Clinical Database Designers.",
    successCriteria: "Zero regulatory non-compliance logs, 100% query resolution before database locks, and perfect audit trail integrity.",
    dayInTheLife: "It's 8:30 AM. You open your EDC database to check outstanding discrepancies for a multi-center oncology trial. You locate an outlying blood pressure entry of '22/12'—clearly a typo. At 10:00 AM, you issue an electronic query to the nurse investigator at the clinical site to log the corrected value. After lunch, you audit the case histories of three patient drop-outs to ensure their exit reasons are categorized per CDISC standards. At 3:30 PM, you join a status meeting with clinical biostatisticians in Hyderabad to prepare the database for an upcoming Phase II interim lock, closing your day with clean audit verification reports.",
    pros: ["Extremely stable hours with zero wet-lab stresses", "Clear, predictable career ladder in CROs", "Direct involvement in global life-saving drug approvals", "Highly secure legal requirement for trials"],
    cons: ["Can be document-heavy and highly repetitive", "Lacks creative design or business negotiation", "Strict compliance guidelines leave no room for trial error", "Slower compensation growth compared to tech PM"],
    thriveTraits: ["Extreme Attention to Detail", "Meticulous Compliance Mind", "Structured Database Comfort", "Clear Written Logic"],
    struggleWarning: "If you dislike repetitive auditing, get bored by checking database rows, or prefer dynamic workspace shifts, clinical data management will feel tedious.",
    timeline: [
      { title: "Clinical Data Associate", exp: "0–2 Years", desc: "Performs discrepancy management, reviews Case Report Forms, and tracks queries." },
      { title: "Clinical Data Manager (CDM)", exp: "2–5 Years", desc: "Oversees EDC study setups, writes Data Management Plans, and leads database lock phases." },
      { title: "Senior CDM / Project Lead", exp: "5–8 Years", desc: "Manages data operations for multiple global clinical trials, budgeting resources across CRO sites." },
      { title: "Director of Data Management", exp: "8+ Years", desc: "Aligns global clinical database platforms with FDA/EMA compliance standards and drives regional strategy." }
    ],
    globalOpportunities: {
      countries: ["India", "USA", "United Kingdom", "Germany", "Belgium"],
      industries: ["Contract Research Organizations (CRO)", "Pharmaceutical Development", "Medical Device Manufacturing", "Clinical Trial Software"],
      employers: ["IQVIA", "Parexel", "ICON plc", "Cognizant Life Sciences", "Labcorp India"],
      growthRegions: "Chennai Clinical Corridor, Bangalore IT Hub, and Hyderabad Pharma Cluster.",
      remoteWork: "Moderate; hybrid structures are highly common across Indian CRO operations."
    },
    skills: {
      technical: [
        { name: "CDISC Standards (SDTM/ADaM)", level: 90 },
        { name: "Electronic Data Capture (EDC)", level: 85 },
        { name: "Good Clinical Practice (GCP)", level: 95 }
      ],
      soft: [
        { name: "Written Technical Clarification", level: 90 },
        { name: "Process-Driven Methodologies", level: 95 },
        { name: "Regulatory Compliance Mind", level: 92 }
      ],
      emerging: [
        { name: "Decentralized Clinical Trials (DCT)", level: 80 },
        { name: "AI-Assisted Query Generation", level: 75 }
      ]
    },
    education: {
      degrees: ["B.Sc. Biotechnology", "B.Pharm", "Bachelor of Nursing"],
      masters: ["M.Sc. Clinical Research", "Master of Science in Biostatistics"],
      alternative: ["SCDM student operational modules", "CDISC implementation training"],
      certifications: ["Certified Clinical Data Manager (CCDM)", "Good Clinical Practice (GCP) Certificate"],
      bridgePrograms: ["Entry-level operational training contracts at global clinical CROs in Chennai."]
    },
    realityCheck: {
      challenges: ["Chasing busy clinical site doctors for query responses under tight database lock timelines.", "Handling massive document audit logs during sudden regulatory compliance inspections."],
      competition: "Moderate. Steady volume of entry-level positions with strong demand for certified candidates.",
      stressLevel: "Moderate — driven by periodic database locks and client reporting deadlines.",
      learningCurve: "Moderate — requires absorption of clinical trial regulations and standard data dictionaries.",
      typicalSetbacks: ["A clinical site entering corrupt patient files, requiring a manual rollback of the database module.", "An investigator failing to provide certified signatures on case reports, delaying locks."]
    }
  },
  "biotech entrepreneurship & incubation": {
    futureDemand: "Moderate",
    futureDemandSubtitle: "Driven by startup ecosystem and government funding grants",
    salaryRange: "₹5.4L–₹12.8L",
    yearsToEnter: "2–4 Years",
    aiRisk: "Very Low Risk",
    aiSafetyLevel: "Outstanding",
    aiSafetySubtitle: "Completely Safe (High-Context Relationship-Driven Ventures)",
    scholarshipAvailability: "Competitive",
    scholarshipsSubtitle: "Competitive (Government incubation grants & fellowships)",
    financingOutlook: "Strong reliance on public BIRAC BIG grants; incubation spaces offer subsidized office perks.",
    dailyResponsibilities: [
      "Conduct technical due diligence on early-stage life science IP and startup patent filings.",
      "Assist incubation startups in drafting grant proposals and commercial pitch decks.",
      "Coordinate incubator facility operations, scheduling shared lab access for bio-startups."
    ],
    weeklyResponsibilities: [
      "Present startup milestone evaluations to incubator directors and seed funding boards.",
      "Organize venture networking sessions and legal workshops on biotechnology commercialization.",
      "Review incubator lease agreements and biological safety certificates for resident startups."
    ],
    majorDecisions: [
      "Selecting which early-stage bio-innovator applications to approve for incubator residency.",
      "Prioritizing seed grant allocations for high-potential biotech concepts."
    ],
    workEnvironment: "Vibrant university-linked incubator space; split between office spaces and shared wet-lab facilities.",
    whoTheyWorkWith: "Academic Scientists, Startup Founders, Venture Capitalists, and Intellectual Property Lawyers.",
    successCriteria: "Incubator startups securing venture funding, patent approvals, and commercial launch milestones.",
    dayInTheLife: "It's 8:30 AM. You enter the incubator and review three applications from PhD students seeking lab residency. You analyze their Technology Readiness Level (TRL) to evaluate commercial viability. At 10:30 AM, you mentor a resident oncology startup on structuring their pitch deck for a seed investment board. After lunch, you coordinate with facility managers to resolve an equipment scheduling conflict for the high-end flow cytometer. At 3:30 PM, you draft a report detailing incubator performance for government grant auditors, ending your day with a networking mixer for biotech angel investors.",
    pros: ["Highly dynamic and energetic startup workspace", "Massive exposure to cutting-edge scientific patents", "Accelerated learning of corporate business models", "Builds an elite network of biotech founders & funders"],
    cons: ["Slower early-career salary relative to corporate IT", "High ambiguity and early-stage project failure rates", "Heavy administrative burden for government grant audits", "Requires balancing multiple startup personalities"],
    thriveTraits: ["Ecosystem Building", "Commercial Acumen", "Interdisciplinary Synthesis", "Comfort with Ambiguity"],
    struggleWarning: "If you thrive on highly structured tasks, dislike daily chaos, or require predictable corporate structures, biotech incubation management will feel overwhelming.",
    timeline: [
      { title: "Incubator Analyst", exp: "0–2 Years", desc: "Coordinates cohort applications, manages wet-lab resources, and assists with event planning." },
      { title: "Program Manager / Associate", exp: "2–5 Years", desc: "Leads technical due diligence, guides grant proposals, and manages startup milestone trackers." },
      { title: "Incubator Director / CEO", exp: "5–8 Years", desc: "Secures government funding, builds VC relations, manages incubator budgets, and selects resident startups." },
      { title: "Venture Partner / Accelerator Partner", exp: "8+ Years", desc: "Coordinates long-term strategic biotech investments and drives national biotechnology translation." }
    ],
    globalOpportunities: {
      countries: ["India", "USA", "United Kingdom", "Singapore", "Israel"],
      industries: ["Venture Capital", "Biotechnology Acceleration", "Tech Transfer", "Government Innovation Programs"],
      employers: ["IIT Madras Bio-Incubator", "C-CAMP Bangalore", "IKP Knowledge Park", "Venture Center Pune", "SINE IIT Bombay"],
      growthRegions: "IIT Madras Research Park, Bangalore Bio-Ecosystem, and Cambridge Tech Incubators.",
      remoteWork: "Low; requires physical coordination inside the shared incubator and lab facility."
    },
    skills: {
      technical: [
        { name: "Intellectual Property & Patent Audits", level: 85 },
        { name: "Technology Readiness Assessment", level: 90 },
        { name: "Financial Modeling & Valuation", level: 80 }
      ],
      soft: [
        { name: "Ecosystem Relationship Building", level: 95 },
        { name: "Startup Mentoring & Coaching", level: 90 },
        { name: "High-Ambiguity Problem Solving", level: 92 }
      ],
      emerging: [
        { name: "Deeptech Valuation Frameworks", level: 80 },
        { name: "Venture Deal Sourcing (SaaS)", level: 75 }
      ]
    },
    education: {
      degrees: ["B.Sc. Biotechnology", "B.Tech Bioengineering", "B.Tech Chemical Engineering"],
      masters: ["MBA (Entrepreneurship / Finance)", "M.Sc. Biotech Commercialization"],
      alternative: ["Venture capital online bootcamps", "IPR & patent drafting pathways"],
      certifications: ["WIPO IP Administration", "Lean Startup Practitioner"],
      bridgePrograms: ["Specialized operations internships at BIRAC-funded university incubators."]
    },
    realityCheck: {
      challenges: ["Managing startup founders who resist feedback or have unrealistic valuations.", "Handling slow government grant release cycles which strain incubator operating cashflow."],
      competition: "High. Incubation manager roles are highly selective, favoring candidates with strong interdisciplinary records.",
      stressLevel: "Moderate-High — driven by startup funding cycles and operational deadlines.",
      learningCurve: "Steep — demands deep comprehension of commercial law, biotech IP, and corporate finance.",
      typicalSetbacks: ["A high-potential resident startup failing to secure funding, forcing team disbandment.", "A government grant application getting rejected due to minor administrative errors, straining cashflow."]
    }
  },
  "healthcare consulting": {
    futureDemand: "High",
    futureDemandSubtitle: "Driven by corporate healthcare restructuring post-pandemic",
    salaryRange: "₹8.0L–₹21.0L",
    yearsToEnter: "1–2 Years",
    aiRisk: "Low Risk",
    aiSafetyLevel: "Very High",
    aiSafetySubtitle: "Highly Safe (Strategic Client Advising)",
    scholarshipAvailability: "Rare",
    scholarshipsSubtitle: "Rare (Consulting firm fellowships are highly restricted)",
    financingOutlook: "Fully paid travel expenses; premium starting salaries easily offset initial MBA or study debts.",
    dailyResponsibilities: [
      "Analyze hospital cost-structures and clinical trial databases to optimize product pipelines.",
      "Draft presentation slide-decks for healthcare executive boards outlining strategic options.",
      "Conduct stakeholder interviews with medical device managers and regional health directors."
    ],
    weeklyResponsibilities: [
      "Present operational progress updates to the client's executive steering committee.",
      "Facilitate workshop sessions with medical heads to design patient-flow improvements.",
      "Review financial and supply chain spreadsheets to find device purchasing waste."
    ],
    majorDecisions: [
      "Selecting which cost-cutting measures to propose to a hospital client without impacting clinical safety.",
      "Designing pricing models for new healthcare diagnostic packages based on demographic metrics."
    ],
    workEnvironment: "Modern professional offices or regional healthcare headquarters; frequent travel to client sites.",
    whoTheyWorkWith: "Hospital Directors, Biopharma VP of Operations, Senior Strategy Consultants, and Financial Analysts.",
    successCriteria: "Delivery of actionable strategic plans that reduce client expenses by 12%+ or secure market-entry approvals.",
    dayInTheLife: "It's 8:30 AM. You arrive at the corporate office of a major private hospital chain that is facing high emergency room overcrowding. You open your laptop to audit a spreadsheet tracking average patient discharge times. At 10:00 AM, you meet with the clinical director to analyze a 20% spike in emergency room wait-times during the night shift. After lunch, you build an Excel model predicting the operational savings of outsourcing diagnostics. At 3:30 PM, you join an executive sync to present your pricing strategy for a new health-checkup product, ending your day with slide preparation for tomorrow's executive board review.",
    pros: ["Accelerated acquisition of business and finance skills", "Direct interactions with C-suite healthcare leaders", "Highly dynamic projects across clinical and IT sectors", "Industry-leading starting salaries and performance bonuses"],
    cons: ["Demanding 60-70 hour consulting work weeks", "Frequent travel requirements and weekend work", "High stress from tight client presentation deadlines", "Lack of deep, long-term technical ownership of single products"],
    thriveTraits: ["Hospital Workflow Understanding", "Process Optimization", "Client Management", "Operational Rigor"],
    struggleWarning: "If you prefer long-term quiet technical research or struggle with complex spreadsheet math, standard healthcare consulting will feel intense.",
    timeline: [
      { title: "Junior Healthcare Consultant", exp: "0–2 Years", desc: "Performs client data audits, drafts flowcharts, and prepares operational slides." },
      { title: "Consultant / Lead Auditor", exp: "2–5 Years", desc: "Coordinates department restructuring plans and guides client staff implementations." },
      { title: "Engagement Director", exp: "5–8 Years", desc: "Owns specific hospital chain portfolios, drafts contracts, and secures performance improvements." },
      { title: "Partner / Sector Chief", exp: "8+ Years", desc: "Secures consulting agreements, oversees large-scale healthcare system migrations." }
    ],
    globalOpportunities: {
      countries: ["India", "United Kingdom", "United Arab Emirates", "Saudi Arabia", "Singapore"],
      industries: ["Hospital System Advisory", "Post-pandemic Operations restructuring", "Healthcare Facilities Management"],
      employers: ["Apollo Hospital Consulting", "Max Healthcare Advisory", "PwC India Healthcare", "Fortis Operations Group"],
      growthRegions: "Mumbai, Bangalore, Hyderabad, and major GCC health-cities.",
      remoteWork: "Low; mostly on-site client inspections and workshop engagements."
    },
    skills: {
      technical: [
        { name: "Hospital Capacity Planning", level: 85 },
        { name: "Clinical Audit & Standards", level: 90 },
        { name: "Spreadsheet Analytics (Excel)", level: 80 }
      ],
      soft: [
        { name: "Cross-Functional Client Alignment", level: 92 },
        { name: "Stakeholder Empathy Workshops", level: 90 },
        { name: "Operational Troubleshooting", level: 88 }
      ],
      emerging: [
        { name: "Digital Health Records Integration", level: 80 },
        { name: "AI Nurse-Staffing Optimizers", level: 75 }
      ]
    },
    education: {
      degrees: ["B.Sc. Nursing", "Bachelor of Pharmacy (B.Pharm)", "B.Sc. Biotechnology"],
      masters: ["Master of Hospital Administration (MHA)", "Healthcare MBA", "Master of Public Health (MPH)"],
      alternative: ["Hospital quality standards certifications (NABH)", "Six Sigma Green Belt in Healthcare"],
      certifications: ["NABH Assessor Credentials", "Lean Healthcare Practitioner"],
      bridgePrograms: ["On-site administrative internships at major private multi-specialty medical networks."]
    },
    realityCheck: {
      challenges: ["Aligning hospital operational stakeholders who resist process restructuring.", "Designing hospital-floor solutions that balance patient density with medical safety."],
      competition: "High. Top-tier clinical strategy groups recruit heavily from MBA or medical degree pools.",
      stressLevel: "High — driven by tight deadlines, competitive peer groups, and client expectations.",
      learningCurve: "Steep — demands deep assimilation of a new healthcare sector's dynamics within 2 weeks.",
      typicalSetbacks: ["A client board rejecting your strategic plan due to sudden internal politics, rendering weeks of work obsolete.", "A clinical project getting postponed due to hospital budgeting freezes."]
    }
  },
  "healthcare strategy consulting": {
    futureDemand: "Exponential",
    futureDemandSubtitle: "Driven by clinical market consolidation and biopharma acquisitions",
    salaryRange: "₹12.5L–₹31.5L",
    yearsToEnter: "1.5–2 Years",
    aiRisk: "Very Low Risk",
    aiSafetyLevel: "Outstanding",
    aiSafetySubtitle: "Completely Safe (High-Stake Boardroom Strategy)",
    scholarshipAvailability: "Rare",
    scholarshipsSubtitle: "Rare (Reserved for elite corporate scholars)",
    financingOutlook: "Elite starting compensation post-MBA easily supports high-interest educational loans; fully paid travel portfolios.",
    dailyResponsibilities: [
      "Review merger and acquisition (M&A) valuations for multi-center hospital networks.",
      "Construct detailed market-access models for novel gene therapy candidates in APAC.",
      "Conduct clinical due diligence on target pharmaceutical acquisitions for corporate clients."
    ],
    weeklyResponsibilities: [
      "Present high-impact M&A slides to the C-suite steering committee of biopharma majors.",
      "Facilitate strategy alignment workshops with private equity healthcare partners.",
      "Analyze pricing and reimbursement policies with government pharmaceutical regulators."
    ],
    majorDecisions: [
      "Determining the commercial viability and risk factors of acquiring a biotech therapeutic target.",
      "Advising C-suite clients on global pricing structures for high-cost drug rollouts."
    ],
    workEnvironment: "Prestigious strategy consulting headquarters or corporate boardrooms; high global travel.",
    whoTheyWorkWith: "Biopharma CEO/CFO, Hospital Network Executives, Venture Capital Partners, and Senior Lead Economists.",
    successCriteria: "Successful corporate M&A integrations, high market share captures, and client trust retention.",
    dayInTheLife: "It's 8:30 AM. You enter the high-floor boardroom of a leading global consulting firm. Today, you are reviewing a financial and market-access model for an innovative oncology candidate in Europe. At 10:00 AM, you lead a client huddle with the corporate strategy head of a major Swiss pharmaceutical company, outlining how competitors' biosimilars will impact their market share by 2028. After lunch, you analyze competitive intelligence on therapeutic clinical trials. At 3:30 PM, you present your commercial assessment to the client's executive steering committee, addressing tough questions on pricing and regulatory CDSCO bottlenecks, closing your day at 7:00 PM before flying out for partner workshops.",
    pros: ["Elite industry compensation and premium bonuses", "Direct influence on multi-million dollar corporate deals", "Exceptional global career mobility and prestige", "Working with top-performing analytical teams"],
    cons: ["Extreme work weeks (70+ hours common)", "High travel fatigue from constant flights", "Constant pressure to perform under executive eyes", "Demands high corporate-finance and clinical mastery"],
    thriveTraits: ["Elite Financial Modeling", "C-Suite Presentation Comfort", "High Ambiguity Toleration", "Boardroom Persuasion"],
    struggleWarning: "If you struggle with intensive financial spreadsheets, find constant corporate travel exhausting, or dislike elite high-pressure environments, strategy consulting will feel overwhelming.",
    timeline: [
      { title: "Strategy Consultant / Associate", exp: "0–2 Years", desc: "Constructs valuation models, gathers biopharma intelligence, and structures complex data decks." },
      { title: "Senior Consultant", exp: "2–5 Years", desc: "Directs specific operational due diligence streams, manages client huddles, and guides junior analysts." },
      { title: "Engagement Manager", exp: "5–8 Years", desc: "Directs high-impact strategy teams, acts as primary C-suite interface, and signs off on deal valuations." },
      { title: "Junior Partner / Partner", exp: "8+ Years", desc: "Brings in commercial client accounts, leads strategy firm life sciences sectors, and secures deal flow." }
    ],
    globalOpportunities: {
      countries: ["USA", "Switzerland", "United Kingdom", "Singapore", "Japan"],
      industries: ["M&A Strategy Consulting", "Pharma Corporate Development", "Healthcare Private Equity", "Investment Banking"],
      employers: ["McKinsey (Healthcare)", "Boston Consulting Group (BCG)", "Bain & Company", "L.E.K. Consulting", "ZS Associates"],
      growthRegions: "Zurich Pharmaceutical Hub, Singapore MedTech Park, and Mumbai Financial District.",
      remoteWork: "Low; strategic corporate deals demand direct in-person boardroom presence."
    },
    skills: {
      technical: [
        { name: "Pharma Asset Valuation", level: 95 },
        { name: "Corporate Finance & M&A", level: 90 },
        { name: "Reimbursement Policy Analysis", level: 85 }
      ],
      soft: [
        { name: "C-Suite Boardroom Persuasion", level: 95 },
        { name: "Strategic Team Leadership", level: 92 },
        { name: "High-Context Negotiation", level: 90 }
      ],
      emerging: [
        { name: "Biopharma Pipeline Analytics", level: 85 },
        { name: "AI Due Diligence Automation", level: 80 }
      ]
    },
    education: {
      degrees: ["Bachelor of Dental Surgery (BDS)", "Bachelor of Medicine (MBBS)", "B.Tech Biotechnology"],
      masters: ["MBA from elite business schools", "Master of Science in Health Economics"],
      alternative: ["Strategy consulting case bootcamps", "Pharma M&A micro-credentials"],
      certifications: ["Certified Valuation Analyst (CVA)", "Project Management Professional (PMP)"],
      bridgePrograms: ["Elite PhD-to-Consulting recruiting tracks or firm-sponsored MBA pipelines."]
    },
    realityCheck: {
      challenges: ["Answering aggressive, rapid-fire questions from skeptical pharma CFOs during live pitch decks.", "Conducting emergency 72-hour due diligence runs for a hostile corporate takeover."],
      competition: "Fierce. Strategy desks recruit the top 1% of elite business and medical school graduates.",
      stressLevel: "Very High — driven by massive financial transactions and tight corporate timelines.",
      learningCurve: "Very Steep — requires immediate command of market-sizing guesstimates and accounting rules.",
      typicalSetbacks: ["A major client pulling out of a $1B drug deal at the last minute, rendering months of research obsolete.", "Facing severe physical burnout from multi-city timezone travel schedules."]
    }
  },
  "hospital administration & operations mba": {
    futureDemand: "High",
    futureDemandSubtitle: "Driven by hospital network expansions into Tier-2/3 cities",
    salaryRange: "₹8.2L–₹22.5L",
    yearsToEnter: "2–3 Years",
    aiRisk: "Very Low Risk",
    aiSafetyLevel: "Outstanding",
    aiSafetySubtitle: "Completely Safe (On-Site Operational Leadership)",
    scholarshipAvailability: "Competitive",
    scholarshipsSubtitle: "Competitive (Government and institutional merit waivers)",
    financingOutlook: "Direct educational bank loans with low interest; healthcare groups frequently sponsor top employees.",
    dailyResponsibilities: [
      "Review emergency room (ER) bed occupancy and patient turnaround timetables.",
      "Manage nurse-to-patient staffing ratios and daily clinical department shift allocations.",
      "Audit medical waste disposal certificates and hospital sanitation checklists."
    ],
    weeklyResponsibilities: [
      "Present facility operational safety reports and cost audits to the medical director.",
      "Organize Quality Assurance (QA) training sessions for hospital administrative staff.",
      "Review surgical supply chain inventories to ensure zero out-of-stock events."
    ],
    majorDecisions: [
      "Allocating capital budgets between emergency department upgrades and diagnostic radiology equipment.",
      "Resolving labor disputes between clinical nurse unions and hospital management."
    ],
    workEnvironment: "Busy, fast-paced hospital facility environment; constant movement across clinical wings.",
    whoTheyWorkWith: "Chief of Medicine, Head of Nursing, Facilities Managers, and Insurance Claim Coordinators.",
    successCriteria: "Reduced average patient length of stay (ALOS), high patient satisfaction scores, and perfect NABH compliance.",
    dayInTheLife: "It's 8:30 AM. You do a walking round of the outpatient clinic wing to verify that the automated registration kiosks are operational. At 10:00 AM, you meet with the clinical director to analyze a 20% spike in emergency room wait-times during the night shift. After lunch, you audit the hospital's surgical implant inventory to optimize supply chain delivery. At 3:30 PM, you lead a prep session for the upcoming NABH accreditation audit, verifying compliance across bio-waste logs. You wrap up your day at 6:00 PM, after signing off on nurse staffing schedules for the weekend.",
    pros: ["Extremely rewarding direct impact on healthcare quality", "Highly stable and locally anchored career options", "Exits physical manual clinical labor completely", "Diverse operations spanning finance, staffing, and technology"],
    cons: ["Demanding and unpredictable crisis management events", "Navigating complex administrative bureaucracy", "Risk of direct exposure to clinical infection settings", "Managing high-stress labor relations and union negotiations"],
    thriveTraits: ["Crisis Leadership", "Operational Logistics", "NABH Regulatory Knowledge", "Conflict Resolution"],
    struggleWarning: "If you stress easily under operational chaos, dislike hospital environments, or prefer sitting at a quiet desk all day, hospital administration will feel highly stressful.",
    timeline: [
      { title: "Assistant Administrator", exp: "0–2 Years", desc: "Manages outpatient billing flows, monitors bed occupancy, and tracks patient feedback." },
      { title: "Department Operations Manager", exp: "2–5 Years", desc: "Coordinates nurse scheduling, budgets surgical inventory, and oversees clinical department compliance." },
      { title: "Regional General Manager", exp: "5–8 Years", desc: "Oversees operations across 3-4 regional clinic centers, managing regional profitability and staff flows." },
      { title: "Chief Operating Officer (COO)", exp: "8+ Years", desc: "Directs complete corporate hospital facility strategy, aligning multi-city operations with clinical targets." }
    ],
    globalOpportunities: {
      countries: ["India", "United Arab Emirates", "Saudi Arabia", "Singapore", "Canada"],
      industries: ["Corporate Hospital Systems", "Diagnostic Chain Networks", "Venture-Backed Clinic groups", "Ambulatory Surgical Centers"],
      employers: ["Apollo Hospitals", "Fortis Healthcare", "Max Healthcare", "Manipal Hospitals", "Kokilaben Hospital"],
      growthRegions: "Mumbai-Pune Metropolitan Corridor, Delhi NCR Facility expansion, and Middle East healthcare zones.",
      remoteWork: "Low; hospital operations are fundamentally on-site and facility-centric."
    },
    skills: {
      technical: [
        { name: "Hospital Capacity Planning", level: 90 },
        { name: "NABH Compliance Audits", level: 95 },
        { name: "Operational Cost Management", level: 85 }
      ],
      soft: [
        { name: "Inter-Professional Conflict Management", level: 95 },
        { name: "High-Pressure Team Coordination", level: 90 },
        { name: "Empathetic Patient Advocacy", level: 88 }
      ],
      emerging: [
        { name: "Healthcare IoT System Integration", level: 80 },
        { name: "AI Patient-Discharge Forecasting", level: 75 }
      ]
    },
    education: {
      degrees: ["Bachelor of Dental Surgery (BDS)", "Bachelor of Physiotherapy (BPT)", "B.Sc. Nursing"],
      masters: ["MBA in Hospital Administration", "Master of Healthcare Management (MHA)"],
      alternative: ["NABH Assessor certification courses", "Lean Six Sigma Green Belt (Healthcare)"],
      certifications: ["Fellow in American College of Healthcare Executives (FACHE)", "NABH Internal Auditor"],
      bridgePrograms: ["Specialized operations internships during specialized Healthcare MBA programs in India."]
    },
    realityCheck: {
      challenges: ["Managing medical resource shortages during sudden regional health outbreaks.", "Explaining strict financial budget limits to senior clinical physicians who demand premium equipment."],
      competition: "Moderate-High. Top private hospital groups seek graduates from prestigious MHA programs (e.g. TISS, GIM).",
      stressLevel: "High — direct connection to clinical operations and patient outcomes.",
      learningCurve: "Moderate-Steep — demands deep understanding of both business operations and clinical workflows.",
      typicalSetbacks: ["A hospital department failing an NABH compliance check, requiring emergency operational overhaul.", "Facing extreme administrative backlog after a weekend computer network system failure."]
    }
  },
  "pharma venture capital & investment": {
    futureDemand: "Moderate",
    futureDemandSubtitle: "Driven by deep-tech biotech and medical startup funding",
    salaryRange: "₹15.2L–₹35.8L",
    yearsToEnter: "2–4 Years",
    aiRisk: "Very Low Risk",
    aiSafetyLevel: "Outstanding",
    aiSafetySubtitle: "Completely Safe (Trust-Based Investment Decision Making)",
    scholarshipAvailability: "Rare",
    scholarshipsSubtitle: "Rare (Private sector investments rarely offer scholarships)",
    financingOutlook: "Elite upfront costs are offset by carrying interest, deal bonuses, and high-prestige executive compensations.",
    dailyResponsibilities: [
      "Perform technical due diligence on early-stage life science IP and clinical trial reports.",
      "Build complex valuation models and capitalization tables for biotech startups.",
      "Draft investment thesis decks for upcoming medical venture funding rounds."
    ],
    weeklyResponsibilities: [
      "Present pipeline evaluations and deal sourcing pipelines to the VC investment committee.",
      "Conduct audit reviews of target biotech company accounting books and regulatory filings.",
      "Facilitate alignment syncs with startup founders and syndicate investment partners."
    ],
    majorDecisions: [
      "Recommending whether to fund a high-risk biotechnology startup based on early clinical trial signals.",
      "Determining valuation terms and equity percentages for seed-stage medical device developers."
    ],
    workEnvironment: "High-end corporate investment office in financial districts; elegant, professional workspace.",
    whoTheyWorkWith: "Venture Partners, Biotech Founders, Patent Attorneys, Financial Auditors, and Investment Analysts.",
    successCriteria: "High-return portfolio exits (IPO or acquisition), successful due diligence, and elite deal sourcing.",
    dayInTheLife: "It's 8:30 AM. You review the clinical trial dossier of an AI-driven drug discovery startup seeking a ₹15 Crore Series A funding round. You analyze whether their cellular assay data supports their therapeutic efficacy claims. At 10:30 AM, you meet with the founders to discuss their IP patent status and cap table structures. After lunch, you build an Excel sheet calculating the startup's post-money valuation. At 3:30 PM, you pitch the investment opportunity to the venture partners, detailing why their proprietary protein folding model is a safe investment. You close your day at 6:30 PM by summarizing the due diligence checklist.",
    pros: ["Elite starting compensation and high deal performance bonuses", "Direct exposure to revolutionary life-science technologies", "Prestigious, high-level corporate network across finance", "Fascinating blend of deep-science analysis with business strategy"],
    cons: ["Extremely competitive and high-barrier entry routes", "High-stress accountability for massive investment capital", "Navigating complex financial and regulatory structures", "Lacks immediate day-to-day creative product building"],
    thriveTraits: ["Deep Tech Due Diligence", "Financial & Accounting Logic", "Cap Table Calculations", "Executive Confidence"],
    struggleWarning: "If you dislike deep financial modeling, get stressed by massive monetary decisions, or struggle with analyzing raw medical patents, venture capital will feel overwhelming.",
    timeline: [
      { title: "Investment Analyst", exp: "0–2 Years", desc: "Builds financial spreadsheets, conducts early technical due diligence, and organizes deal logs." },
      { title: "Investment Associate", exp: "2–5 Years", desc: "Directs target sourcing pipelines, manages founder interviews, and drafts formal investment thesis decks." },
      { title: "Vice President / Principal", exp: "5–8 Years", desc: "Leads entire negotiation rounds, sits on target startup boards, and manages corporate exit strategies." },
      { title: "Venture Partner / Managing Director", exp: "8+ Years", desc: "Gathers capital from limited partners, shapes firm strategy, and manages high-impact investments." }
    ],
    globalOpportunities: {
      countries: ["USA", "Singapore", "United Kingdom", "Switzerland", "Germany"],
      industries: ["Venture Capital", "Private Equity", "Pharma Corporate Investment", "Family Office Advisory"],
      employers: ["Eight Roads Ventures", "Somerset Indus Capital", "Quadria Capital", "F-Prime Capital", "Biocon Investment"],
      growthRegions: "Mumbai Banking District, Boston-Cambridge VC corridor, and Singapore Healthtech funds.",
      remoteWork: "Low-Moderate; investment deals rely heavily on trust and direct in-person relationships."
    },
    skills: {
      technical: [
        { name: "Venture Deal Structuring", level: 90 },
        { name: "IP & Scientific Due Diligence", level: 95 },
        { name: "Biotech Valuation Modeling", level: 85 }
      ],
      soft: [
        { name: "Investment Boardroom Pitching", level: 95 },
        { name: "Founder Relationship Building", level: 92 },
        { name: "High-Stake Persuasion", level: 90 }
      ],
      emerging: [
        { name: "Deeptech Asset Capitalization", level: 85 },
        { name: "AI Patent-Similarity Sourcing", level: 75 }
      ]
    },
    education: {
      degrees: ["Bachelor of Dental Surgery (BDS)", "Bachelor of Medicine (MBBS)", "B.Tech Biotechnology"],
      masters: ["MBA from top-tier global business schools", "Master of Science in Corporate Finance"],
      alternative: ["CFA Level 1 preparation modules", "Venture capital associate training"],
      certifications: ["Chartered Financial Analyst (CFA)", "Certified Venture Capital Specialist"],
      bridgePrograms: ["Specialized healthcare investment internships post elite MBA programs."]
    },
    realityCheck: {
      challenges: ["Sifting through hundreds of poor-quality pitch decks to locate one viable biotech deal.", "Answering to angry limited partners if a heavily funded portfolio startup fails its clinical trial."],
      competition: "Fierce. VC firms hire the absolute top-tier MBA and medical domain experts with outstanding records.",
      stressLevel: "High — driven by massive monetary transactions, high transaction speeds, and market risk.",
      learningCurve: "Very Steep — requires simultaneous command of corporate finance, clinical trial audits, and patent laws.",
      typicalSetbacks: ["A target startup failing its Phase III trial unexpectedly, rendering your investment worthless.", "A competitor fund securing a highly lucrative biotech deal before your committee can approve terms."]
    }
  },
  "medical affairs & scientific liaison": {
    futureDemand: "High",
    futureDemandSubtitle: "Driven by highly scientific drug promotion guidelines",
    salaryRange: "₹6.5L–₹15.8L",
    yearsToEnter: "1–2 Years",
    aiRisk: "Low Risk",
    aiSafetyLevel: "Very High",
    aiSafetySubtitle: "Highly Safe (Doctor-to-Doctor Peer Relationships)",
    scholarshipAvailability: "Competitive",
    scholarshipsSubtitle: "Competitive (Medical Council and company educational allowances)",
    financingOutlook: "Extremely low preparation cost; travel expenses and training modules are 100% corporate-reimbursed.",
    dailyResponsibilities: [
      "Review oncology or clinical journal studies to extract drug safety and efficacy parameters.",
      "Conduct in-person scientific briefing sessions with leading hospital specialty chiefs.",
      "Prepare medical response documents for complex investigator data requests."
    ],
    weeklyResponsibilities: [
      "Organize Regional advisory board mix panels with Key Opinion Leaders (KOLs).",
      "Train corporate pharmaceutical sales teams on core therapeutic clinical trial data.",
      "Collaborate with clinical trial monitors to identify prospective trial sites."
    ],
    majorDecisions: [
      "Deciding which key opinion leaders to invite to strategic pharmaceutical advisory panels.",
      "Approving the scientific accuracy and compliance of clinical marketing materials."
    ],
    workEnvironment: "Split between corporate pharmaceutical offices and major regional medical centers.",
    whoTheyWorkWith: "Hospital Specialty Chiefs, Clinical Investigators, Head Medical Directors, and Regulatory Managers.",
    successCriteria: "Strong medical peer relationship index, successful advisory boards, and zero compliant disputes.",
    dayInTheLife: "It's 8:30 AM. You study a newly published clinical trial paper detailing your company's cardiovascular drug candidate. At 10:30 AM, you travel to a major hospital to meet with the chief oncologist, presenting raw statistical data on drug safety profiles. After a working lunch, you draft responses to an investigator's technical query on pediatric dosing profiles. At 3:30 PM, you organize a webinar schedule for a panel of medical specialists in Mumbai to discuss clinical trial outcomes, closing your day with clean stakeholder briefing files.",
    pros: ["Retains clinical medical authority and prestigious 'Doctor' status", "Permanently exits physical manual dental/medical chairside labor", "Direct, intellectual interactions with leading medical chiefs", "Predictable, comfortable lifestyle with excellent travel perks"],
    cons: ["Extensive travel requirements (up to 50%-70% of work weeks)", "Rigid non-promotional regulatory constraints (cannot sell)", "Managing demanding or non-responsive Key Opinion Leaders", "High responsibility to maintain perfect scientific accuracy"],
    thriveTraits: ["Scientific Literature Audit", "Peer Relationship Building", "Clinical Credibility", "Excellent Presentation"],
    struggleWarning: "If you dislike constant travel, find presenting complex science journals tiring, or struggle with building relationships, scientific liaison will feel challenging.",
    timeline: [
      { title: "Medical Information Associate", exp: "0–2 Years", desc: "Reviews clinical trial journals, drafts technical medical response documents, and monitors safety databases." },
      { title: "Medical Science Liaison (MSL)", exp: "2–5 Years", desc: "Manages regional KOL networks, delivers clinical presentations, and answers medical queries." },
      { title: "Senior MSL / Medical Manager", exp: "5–8 Years", desc: "Leads medical strategies, organizes national panels, and trains commercial teams." },
      { title: "Medical Director", exp: "8+ Years", desc: "Aligns national medical affairs strategy with global pharmaceutical regulatory frameworks and corporate initiatives." }
    ],
    globalOpportunities: {
      countries: ["India", "USA", "Switzerland", "United Kingdom", "Germany"],
      industries: ["Multinational Biopharmaceuticals", "Specialized Medical Devices", "Contract Research Organizations", "Medical Affairs Advisory"],
      employers: ["AstraZeneca", "Roche", "Eli Lilly", "Sanofi", "IQVIA Medical Affairs"],
      growthRegions: "Active in global pharmaceutical headquarters and major regional medical centers.",
      remoteWork: "Low-Moderate; high reliance on on-site doctor meetings and medical congresses."
    },
    skills: {
      technical: [
        { name: "Pharmacology & Therapeutic Area Depth", level: 95 },
        { name: "Clinical Trial Data Translation", level: 95 },
        { name: "Medical Communication Compliance", level: 90 }
      ],
      soft: [
        { name: "KOL Peer-to-Peer Liaison", level: 95 },
        { name: "Scientific Public Presentation", level: 95 },
        { name: "Interdisciplinary Medical Advisory", level: 90 }
      ],
      emerging: [
        { name: "Digital KOL & Virtual Advisory Board Management", level: 85 },
        { name: "AI-driven Medical Literature Mapping", level: 80 }
      ]
    },
    education: {
      degrees: ["B.Sc. Biotechnology", "B.Pharmacy", "Bachelor of Medicine (MBBS)"],
      masters: ["Ph.D. in Life Sciences / Pharmacology", "Doctor of Pharmacy (Pharm.D.)", "Doctor of Medicine (M.D.)"],
      alternative: ["Medical science liaison bootcamps", "Clinical advisory training programs"],
      certifications: ["Board Certified Medical Affairs Specialist (BCMAS)", "MSL-BC Board Certification"],
      bridgePrograms: ["Industry internships inside medical affairs departments of top pharma firms."]
    },
    realityCheck: {
      challenges: ["Waiting hours in busy hospital lobbies to secure a brief 10-minute slot with a busy clinical chief.", "Maintaining strict regulatory boundaries so as never to cross into sales or promotion during meetings."],
      competition: "Moderate-High. Pharmaceutical companies hire only candidates with doctorates (BDS, MBBS, MD, PharmD) and high communication skills.",
      stressLevel: "Moderate — project timelines are planned in steady quarterly blocks with zero sales pressure.",
      learningCurve: "Steep — demands deep clinical depth in therapeutic areas, clinical statistics, and pharmacology.",
      typicalSetbacks: ["A key opinion leader canceling a critical advisory panel meeting at the last minute.", "Facing rejection when presenting data to a highly skeptical medical specialist who prefers competitor drugs."]
    }
  },
  "regulatory affairs": {
    futureDemand: "Steady",
    futureDemandSubtitle: "Driven by international pharmaceutical export filings",
    salaryRange: "₹5.2L–₹12.5L",
    yearsToEnter: "1–2 Years",
    aiRisk: "Very Low Risk",
    aiSafetyLevel: "Outstanding",
    aiSafetySubtitle: "Completely Safe (Legal & CDSCO Signature Accountability)",
    scholarshipAvailability: "Competitive",
    scholarshipsSubtitle: "Competitive (RAPS and manufacturing organization bursaries)",
    financingOutlook: "Extremely low preparation cost; pharmaceutical companies frequently sponsor ISO auditing and filing courses.",
    dailyResponsibilities: [
      "Compile and organize Common Technical Document (CTD) drug registration dossiers.",
      "Audit drug manufacturer product labeling and package leaflets for compliance errors.",
      "Review regulatory filing notifications on CDSCO, FDA, and EMA portal boards."
    ],
    weeklyResponsibilities: [
      "Present filing status tables and safety updates to the corporate compliance committee.",
      "Submit clinical dossier updates to government drug control officers and auditors.",
      "Review medical safety and laboratory records to ensure perfect filing integrity."
    ],
    majorDecisions: [
      "Determining if a manufacturing change requires a full regulatory filing variation or a minor notification.",
      "Approving the final release of medical package text for drug exports."
    ],
    workEnvironment: "Structured corporate desk environment; quiet office with predictable 9-to-5 schedules.",
    whoTheyWorkWith: "R&D Chemists, QA Officers, Legal Counsel, and Government Drug Control Inspectors.",
    successCriteria: "Zero product launch delays, 100% filing approvals, and perfect scores in compliance inspections.",
    dayInTheLife: "It's 8:30 AM. You review the CDSCO notification board to track a pending drug export dossier for South America. You locate an administrative request to clarify manufacturing raw-material parameters. At 10:00 AM, you coordinate with the R&D team to secure laboratory batch records. After lunch, you structure a CTD Module 3 dossier for a new pharmaceutical line, ensuring compliance with international EMA guidelines. At 3:30 PM, you lead a compliance review of drug packaging text to avoid labeling discrepancies, wrapping up your day with clean dossier logs.",
    pros: ["Extremely stable, predictable corporate work lifestyle", "Permanently exits high-pressure clinical or wet-lab setups", "Highly secure legal requirement for pharmaceutical exports", "Clear, step-by-step career path in top pharmaceutical firms"],
    cons: ["Lacks strategic design or creative product building", "Requires reading hundreds of pages of legal compliance texts", "Slower compensation growth compared to high-end consulting", "Mistakes in filings can cause massive corporate losses"],
    thriveTraits: ["Meticulous Document Reading", "Regulatory Compliance Logic", "Structured Dossier Formatting", "Consistent Work Stamina"],
    struggleWarning: "If you dislike reading legal documents, find highly structured processes boring, or prefer active, client-facing roles, regulatory affairs will feel tedious.",
    timeline: [
      { title: "Regulatory Affairs Associate", exp: "0–2 Years", desc: "Drafts basic eCTD dossiers, monitors portal notification logs, and checks labeling texts." },
      { title: "Regulatory Affairs Manager", exp: "2–5 Years", desc: "Oversees export filings for specific countries, manages variations, and communicates with auditors." },
      { title: "Senior Regulatory Manager", exp: "5–8 Years", desc: "Leads a division of regulatory filings, budgets submission schedules, and coordinates FDA inspections." },
      { title: "VP of Regulatory Compliance", exp: "8+ Years", desc: "Directs complete corporate regulatory compliance strategy, aligning global sites with clinical guidelines." }
    ],
    globalOpportunities: {
      countries: ["India", "USA", "Germany", "Belgium", "Singapore"],
      industries: ["Pharmaceutical Exports", "Medical Device Manufacturing", "Biomedical R&D", "Regulatory Consulting Services"],
      employers: ["Biocon", "Dr. Reddy's Laboratories", "Lupin Pharmaceuticals", "Cipla India", "Sun Pharma"],
      growthRegions: "Mumbai-Gujarat Pharma Corridor, Hyderabad Export Hub, and Bangalore Tech parks.",
      remoteWork: "Moderate; hybrid structures are highly common across Indian pharmaceutical headquarters."
    },
    skills: {
      technical: [
        { name: "Common Technical Document (CTD)", level: 95 },
        { name: "CDSCO / FDA Filing Regulations", level: 92 },
        { name: "ISO 13485 Quality Standards", level: 85 }
      ],
      soft: [
        { name: "Meticulous Document Auditing", level: 95 },
        { name: "Written Agency Communication", level: 90 },
        { name: "Highly Predictable Delivery", level: 92 }
      ],
      emerging: [
        { name: "eCTD Electronic Software (Veeva)", level: 85 },
        { name: "AI-Assisted Dossier Verification", level: 75 }
      ]
    },
    education: {
      degrees: ["Bachelor of Dental Surgery (BDS)", "B.Pharm", "B.Sc. Biotechnology"],
      masters: ["M.Pharm in Regulatory Affairs", "M.Sc. in Quality Assurance"],
      alternative: ["RAPS regulatory training courses", "ISO standards auditor pathways"],
      certifications: ["Regulatory Affairs Certification (RAC)", "ISO 13485 Internal Auditor"],
      bridgePrograms: ["Regulatory compliance internships during pharma postgraduate programs in India."]
    },
    realityCheck: {
      challenges: ["Maintaining high concentration while proofreading 500-page drug dossier tables for typographical errors.", "Answering to management if a major product launch is delayed due to missed regulatory variations."],
      competition: "Moderate. Strong and stable demand for certified professionals across pharmaceutical manufacturing.",
      stressLevel: "Moderate — projects are planned around regulatory timelines with predictable schedules.",
      learningCurve: "Moderate — requires absorption of legal filing structures, drug guidelines, and manufacturing rules.",
      typicalSetbacks: ["A governmental body raising a major audit query on a dossier, requiring an emergency 48-hour response.", "Packaging errors discovered on exported drugs, forcing an expensive batch recall."]
    }
  },
  "bioinformatics_computational_biology": {
    "futureDemand": "Very High",
    "futureDemandSubtitle": "India's bioinformatics market is projected to grow from ~$337M (2023) to ~$1.8B by 2032 (~19.6% CAGR), driven by genomics, AI-drug discovery, and precision medicine.",
    "salaryRange": "India: ₹4-6L entry, ₹8-15L mid (3-6 yrs), ₹15-25L+ senior/PhD. Abroad (US): $65-100K entry, $100-150K mid, $150-250K+ senior/principal (Bay Area, Boston premium 15-25%).",
    "yearsToEnter": "2-4 years (BSc/BTech + MSc/MTech); PhD path adds 4-5 years but commands ~$20-30K higher US starting salary",
    "aiRisk": "Low-Medium",
    "aiSafetyLevel": "Augmented, not replaced",
    "aiSafetySubtitle": "AI tools (AlphaFold-class models, LLM-assisted pipeline writing) are speeding up routine analysis, but domain judgment on experimental design, biological interpretation, and validating model outputs remains firmly human for the foreseeable future.",
    "scholarshipAvailability": "Moderate",
    "scholarshipsSubtitle": "DBT-JRF, CSIR-UGC NET, and Prime Minister Research Fellowship (PMRF, ₹70-80K/month) fund PhD-track students; most MSc/MTech programs are self-funded.",
    "financingOutlook": "Strong ROI given low course cost (₹2-8L for MSc/MTech) against a ₹8-25L mid-career ceiling within 5 years",
    "dailyResponsibilities": [
        "Write and debug pipelines (Python/R) to process genomic, transcriptomic, or proteomic datasets",
        "Run and validate NGS (next-gen sequencing) data through alignment, variant calling, and QC steps",
        "Meet with wet-lab scientists to translate experimental questions into computational analyses",
        "Document methods and maintain version-controlled code for reproducibility"
    ],
    "weeklyResponsibilities": [
        "Present findings or troubleshooting updates in lab/team meetings",
        "Read 2-3 recent papers to stay current on tools and reference databases",
        "Optimize or refactor a pipeline for speed, cost, or a new data type",
        "Collaborate cross-functionally with biologists, statisticians, or software engineers"
    ],
    "majorDecisions": [
        "Which computational method or tool best fits a specific biological question (e.g. which variant caller for a given sequencing depth)",
        "When to trust an automated pipeline output vs. flag it for manual biological review",
        "Whether to build custom tooling vs. adapt existing open-source packages"
    ],
    "workEnvironment": "Primarily computer-based work in a lab, biotech company, hospital research wing, or remote/hybrid setup; less bench work than a traditional wet-lab role, but frequent contact with wet-lab collaborators.",
    "whoTheyWorkWith": "Molecular biologists, clinicians, biostatisticians, software engineers, and PIs (principal investigators) in academic or industry R&D settings.",
    "successCriteria": "Judged on pipeline accuracy and reproducibility, turnaround time on analysis requests, and the clarity with which findings are communicated to non-computational collaborators.",
    "dayInTheLife": "Mornings are usually pipeline-run monitoring and code review; midday often has a stand-up or collaborator meeting to discuss a dataset's biological interpretation; afternoons are heads-down scripting, debugging failed runs, or writing up a method for a paper or internal report. Deadlines cluster around grant submissions, conference abstracts, or drug-discovery milestones.",
    "pros": [
        "Sits at the intersection of two fast-growing fields (biology + AI/data), so skills transfer across pharma, agri-tech, and health-tech",
        "Remote-friendly compared to most life-science roles",
        "Strong exit options into general data science/ML if interest shifts",
        "Global demand (US, UK, Germany, Canada all short on trained bioinformaticians)"
    ],
    "cons": [
        "Indian entry salaries lag general software/data roles by ₹2-4L despite similar technical bar",
        "Can involve long stretches of unglamorous debugging with little biological payoff",
        "Career ceiling in India is lower than the US without a PhD or a move into general data science",
        "Field moves fast; tools and reference databases need continuous relearning"
    ],
    "thriveTraits": [
        "Comfortable with ambiguity in messy biological data",
        "Enjoys both coding and biology equally",
        "Patient with long debugging cycles",
        "Strong written communication for cross-disciplinary teams"
    ],
    "struggleWarning": "If you want fast positive feedback loops or dislike programming, the debugging-heavy nature of this role will wear on you quickly.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Analyst / Research Associate",
            "desc": "Running established pipelines, learning the biological domain, building programming fluency (Python, R, Unix)"
        },
        {
            "title": "Year 3-5",
            "exp": "Bioinformatics Scientist",
            "desc": "Designing analyses independently, owning a research question, mentoring juniors"
        },
        {
            "title": "Year 6-10",
            "exp": "Senior Scientist / Computational Biologist",
            "desc": "Leading multi-person projects, publishing, choosing tool/method strategy for a program"
        },
        {
            "title": "Year 10+",
            "exp": "Principal Scientist / Director",
            "desc": "Setting computational strategy across a company's pipeline, often PhD-required at this tier"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Germany",
            "Canada",
            "Singapore"
        ],
        "industries": [
            "Pharma R&D",
            "Genomics/diagnostics startups",
            "Agri-biotech",
            "Academic research",
            "AI-drug discovery"
        ],
        "employers": [
            "Biocon",
            "Strand Life Sciences",
            "MedGenome",
            "Illumina",
            "Thermo Fisher Scientific",
            "Genentech",
            "NIH",
            "Novartis",
            "Pfizer"
        ],
        "growthRegions": "Bay Area, Boston/Cambridge, Bengaluru, Hyderabad show the fastest hiring growth",
        "remoteWork": "High — many analysis-heavy roles are fully remote or hybrid"
    },
    "skills": {
        "technical": [
            {
                "name": "Python/R programming",
                "level": 90
            },
            {
                "name": "NGS data analysis",
                "level": 80
            },
            {
                "name": "Statistics & ML basics",
                "level": 70
            },
            {
                "name": "Unix/Linux & pipeline tools (Nextflow/Snakemake)",
                "level": 65
            }
        ],
        "soft": [
            {
                "name": "Cross-disciplinary communication",
                "level": 80
            },
            {
                "name": "Documentation discipline",
                "level": 70
            },
            {
                "name": "Patience with iterative debugging",
                "level": 75
            }
        ],
        "emerging": [
            {
                "name": "LLM-assisted coding/analysis",
                "level": 60
            },
            {
                "name": "Protein structure prediction tools (AlphaFold-class)",
                "level": 50
            },
            {
                "name": "Single-cell genomics",
                "level": 55
            }
        ]
    },
    "education": {
        "degrees": [
            "BSc/BTech in Bioinformatics, Biotechnology, CS, or Life Sciences"
        ],
        "masters": [
            "MSc/MTech Bioinformatics (IIT Hyderabad, Shoolini University, IISERs)",
            "MS Bioinformatics (USA — high fee but strong placement)"
        ],
        "alternative": [
            "Bridge diplomas/certificate programs in bioinformatics for CS or pure-biology graduates lacking the other half"
        ],
        "certifications": [
            "No single mandatory license; portfolio/GitHub projects and specific tool fluency (NGS pipelines) matter more than certificates"
        ],
        "bridgePrograms": [
            "Coursera/edX genomic data science specializations for graduates missing programming or biology fundamentals"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Indian pay lags equivalent software roles significantly at entry level",
            "Field is crowded with self-taught bootcamp grads competing for the same junior roles",
            "Requires continual relearning as reference genomes/tools update"
        ],
        "competition": "High at entry level (many bootcamp/certificate grads), moderate-low at senior level (genuine biology+code fluency is rarer than it looks)",
        "stressLevel": "Moderate — deadline-driven around publications/regulatory submissions but rarely acute crisis-mode",
        "learningCurve": "Steep in year one if coming from pure biology (or pure CS) background; levels off once core toolchain is fluent",
        "typicalSetbacks": [
            "Pipelines failing silently on edge-case data, costing days of undetected bad analysis",
            "Being pulled into pure IT-support work at smaller companies without a dedicated bioinformatics team"
        ]
    }
},
  "biotechnology_biomanufacturing": {
    "futureDemand": "High",
    "futureDemandSubtitle": "India's biotech sector contributes ~4.25% of GDP today and is projected toward a $300B valuation by 2030, with 11,000+ biotech startups already active.",
    "salaryRange": "India: ₹3-6L entry, ₹6-12L mid, ₹12-25L senior (PhD/specialized). Abroad (US): $60-90K entry, $90-140K mid, $140-200K+ senior R&D scientist.",
    "yearsToEnter": "3-5 years (BSc/BTech + MSc); PhD adds 4-5 years and is near-mandatory for pharma R&D leadership",
    "aiRisk": "Low-Medium",
    "aiSafetyLevel": "Lab automation growing, R&D judgment stays human",
    "aiSafetySubtitle": "Robotic liquid handling and AI-driven molecule screening are automating routine bench work, but strategic R&D decisions, regulatory strategy, and troubleshooting novel biological systems remain expert-driven.",
    "scholarshipAvailability": "Moderate",
    "scholarshipsSubtitle": "DBT-JRF, CSIR fellowships, and BIRAC (Biotechnology Industry Research Assistance Council) grants support research-track students",
    "financingOutlook": "Solid — degree cost is moderate (₹1.5-6L for MSc) relative to a ₹6-25L 5-10 year salary ceiling, though the fresher years (₹3-6L) are tight",
    "dailyResponsibilities": [
        "Run and monitor lab experiments (cell culture, fermentation, protein purification, or assay development depending on specialization)",
        "Record data meticulously per GLP/GMP documentation standards",
        "Troubleshoot failed runs or unexpected results",
        "Coordinate with quality control/quality assurance on batch release criteria (in manufacturing roles)"
    ],
    "weeklyResponsibilities": [
        "Team meetings on project progress and experimental design",
        "Literature review to inform next experimental iteration",
        "Equipment calibration/maintenance checks",
        "Cross-functional syncs with regulatory affairs or process engineering"
    ],
    "majorDecisions": [
        "Which experimental protocol or cell line/vector to pursue for a given target",
        "When a batch deviation requires escalation vs. can be resolved at the bench",
        "Scale-up strategy from lab to pilot to commercial production"
    ],
    "workEnvironment": "Lab-based (wet lab) for R&D roles; cleanroom/manufacturing floor for biomanufacturing roles; increasingly hybrid for data-heavy specializations like bioprocess modeling.",
    "whoTheyWorkWith": "Fellow scientists, QA/QC teams, regulatory affairs, process engineers, and (in larger companies) global R&D counterparts.",
    "successCriteria": "Judged on experimental reproducibility, batch yield/quality consistency (manufacturing), and contribution to IP/publications (R&D).",
    "dayInTheLife": "A biomanufacturing scientist's day often starts with reviewing overnight fermentation/culture data, followed by hands-on bench work, documentation, and a QA check-in before end-of-day batch review. An R&D scientist's day skews more toward experimental design, running assays, and analyzing results against hypotheses, with less rigid documentation overhead than manufacturing.",
    "pros": [
        "India is genuinely a global biotech manufacturing hub (vaccines, biosimilars, generics) — real, growing demand",
        "Wide range of sub-specializations (vaccines, agri-biotech, industrial enzymes, biosimilars) to pick from",
        "Strong public-sector research option (ICMR, DBT institutes) alongside private industry",
        "Meaningful, tangible impact (vaccines, affordable biosimilars)"
    ],
    "cons": [
        "Entry salaries are genuinely low relative to degree investment (₹20-35K/month is common for BSc/MSc freshers)",
        "Manufacturing-floor roles can involve long shifts and strict GMP compliance pressure",
        "Career progression to senior scientist often gated behind a PhD",
        "Regional pay disparity is stark — Bangalore/Hyderabad pay well above tier-2 cities"
    ],
    "thriveTraits": [
        "Meticulous with documentation and protocol",
        "Comfortable with repetitive precision work",
        "Patient with experiments that fail often before they succeed",
        "Interested in translating lab science into scaled products"
    ],
    "struggleWarning": "If you need quick wins or dislike strict SOP/documentation discipline, GMP-regulated biomanufacturing environments will feel constraining fast.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Research Associate / Junior Scientist",
            "desc": "Executing established protocols, learning GLP/GMP discipline"
        },
        {
            "title": "Year 3-6",
            "exp": "Scientist / Process Engineer",
            "desc": "Owning experiments or process steps, contributing to scale-up decisions"
        },
        {
            "title": "Year 7-12",
            "exp": "Senior Scientist / Team Lead",
            "desc": "Leading a research program or manufacturing unit, mentoring juniors"
        },
        {
            "title": "Year 12+",
            "exp": "Principal Scientist / R&D Director",
            "desc": "Setting scientific/technical strategy; PhD near-mandatory at large pharma/biotech"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "Germany",
            "Singapore",
            "Ireland",
            "UK"
        ],
        "industries": [
            "Vaccines",
            "Biosimilars/generics",
            "Agri-biotech",
            "Industrial enzymes",
            "Cell & gene therapy"
        ],
        "employers": [
            "Biocon",
            "Syngene International",
            "Serum Institute of India",
            "Bharat Biotech",
            "Panacea Biotec",
            "Dr. Reddy's Laboratories",
            "Intas Biopharmaceuticals"
        ],
        "growthRegions": "Bangalore, Hyderabad, and Pune dominate India; Ireland and Singapore are fast-growing biomanufacturing hubs abroad",
        "remoteWork": "Low for bench/manufacturing roles; moderate for process modeling, regulatory, or data-heavy R&D roles"
    },
    "skills": {
        "technical": [
            {
                "name": "Cell culture / fermentation technique",
                "level": 80
            },
            {
                "name": "GLP/GMP documentation",
                "level": 75
            },
            {
                "name": "Protein purification & assay development",
                "level": 65
            },
            {
                "name": "Bioprocess/scale-up principles",
                "level": 55
            }
        ],
        "soft": [
            {
                "name": "Attention to detail",
                "level": 85
            },
            {
                "name": "Cross-functional coordination (QA/regulatory)",
                "level": 65
            },
            {
                "name": "Patience with iterative failure",
                "level": 75
            }
        ],
        "emerging": [
            {
                "name": "AI-assisted molecule/process screening",
                "level": 45
            },
            {
                "name": "Single-use bioprocessing systems",
                "level": 50
            },
            {
                "name": "Continuous manufacturing",
                "level": 40
            }
        ]
    },
    "education": {
        "degrees": [
            "BSc/BTech Biotechnology, Microbiology, or Biochemistry"
        ],
        "masters": [
            "MSc Biotechnology (top picks: IISc, ICT Mumbai, top state agri/biotech universities)",
            "MS in Biotechnology/Bioprocess Engineering (USA, Germany)"
        ],
        "alternative": [
            "Diploma in biomanufacturing/GMP for direct-to-industry entry without a full MSc"
        ],
        "certifications": [
            "GMP/GLP training certificates (mandatory in practice for manufacturing floor roles)",
            "Six Sigma (Green/Black Belt) valued in process-improvement tracks"
        ],
        "bridgePrograms": [
            "BIRAC-supported internship-to-job bridge programs at recognized biotech incubators"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Entry pay is a real gap between expectation and reality for many MSc grads",
            "PhD is close to mandatory for meaningful seniority in R&D at large pharma",
            "Manufacturing-floor shift work is physically and mentally demanding"
        ],
        "competition": "High at entry level given the volume of biotech graduates each year vs. available quality roles",
        "stressLevel": "Moderate-High in manufacturing (batch deadlines, regulatory audits); Moderate in pure R&D",
        "learningCurve": "Moderate — undergraduate training covers most fundamentals, but GMP compliance rigor is learned on the job",
        "typicalSetbacks": [
            "Batch failures traced back to human error under audit",
            "Long waits for scale-up approval that can stall a project for months",
            "Being stuck in a QC/documentation-heavy role with little bench science"
        ]
    }
},
  "genetic_counseling": {
    "futureDemand": "High (small, young field)",
    "futureDemandSubtitle": "A genuinely emerging field in India — regulated only since the Board of Genetic Counselling India (BOGCI) was established — growing alongside rising genetic testing and prenatal screening adoption, but still a very small workforce nationally.",
    "salaryRange": "India: ₹3-5L entry, ₹6-10L mid, ₹15-35L senior/PhD (rare — most top out ₹8-12L). Abroad (US): ~$70-100K typical (NSGC survey data), with hospital/genomics-company roles at the higher end.",
    "yearsToEnter": "5-6 years (Bachelor's + BOGCI-accredited Master's, e.g. MSc Genomic/Genetic Counseling)",
    "aiRisk": "Low-Medium",
    "aiSafetyLevel": "Interpretation partly automatable, counseling is not",
    "aiSafetySubtitle": "AI is speeding up variant interpretation and risk-scoring, but delivering that information to a frightened patient or family — with empathy, correct framing, and follow-through — is a core human skill that resists automation.",
    "scholarshipAvailability": "Low",
    "scholarshipsSubtitle": "Very few dedicated scholarships exist yet given the field's newness in India; most students self-fund the Master's",
    "financingOutlook": "Mixed — a genuinely growing field with real demand, but Indian salaries haven't caught up to the training investment yet; better ROI if targeting research/industry roles at genomics companies over pure hospital counseling",
    "dailyResponsibilities": [
        "Meet with patients/families to take detailed family and medical histories",
        "Explain genetic test results, inheritance patterns, and risk in plain language",
        "Coordinate with physicians, geneticists, and lab teams on testing strategy",
        "Document consultations per clinical and (where applicable) legal requirements"
    ],
    "weeklyResponsibilities": [
        "Review incoming genetic test reports before patient consultations",
        "Case conference with the broader clinical genetics team",
        "Stay current on newly characterized variants and gene-disease associations",
        "Support informed-consent processes for genetic testing"
    ],
    "majorDecisions": [
        "How to frame uncertain or ambiguous genetic findings without over- or under-stating risk",
        "Whether a family history warrants referral for additional genetic testing",
        "How to navigate family dynamics when a diagnosis affects relatives beyond the patient"
    ],
    "workEnvironment": "Hospitals (especially oncology, prenatal/maternal-fetal medicine, and pediatric genetics units), private diagnostic labs, and increasingly telehealth/remote genetic testing companies.",
    "whoTheyWorkWith": "Clinical geneticists, oncologists, obstetricians, pediatricians, and laboratory scientists.",
    "successCriteria": "Judged on patient comprehension and satisfaction, accuracy of risk communication, and smooth coordination with the referring physician and lab.",
    "dayInTheLife": "A typical day mixes back-to-back patient consultations (30-60 minutes each) with prep time reviewing family history intake forms and test reports beforehand. Between sessions, counselors often field physician questions about which test to order for a specific family history, and end the day documenting sessions and following up on pending lab results.",
    "pros": [
        "Deeply meaningful patient-facing work with real clinical impact",
        "A genuinely underserved specialty in India — less competition than saturated allied-health fields",
        "Growing overlap with reproductive medicine, oncology, and rare-disease diagnostics as testing becomes mainstream",
        "US demand remains strong with a clear certification pathway (ABGC) for those wanting to emigrate"
    ],
    "cons": [
        "Indian salaries are low relative to the length and cost of training",
        "Small field means few open positions per year and limited peer community",
        "Emotionally taxing — delivering difficult diagnoses (terminal, hereditary cancer, fetal anomalies) regularly",
        "Career ceiling is currently capped without a move into research, industry, or abroad"
    ],
    "thriveTraits": [
        "High emotional resilience and empathy",
        "Comfortable explaining complex science simply",
        "Genuine interest in genetics and medicine",
        "Patience with families who need time to process difficult news"
    ],
    "struggleWarning": "If you're drawn to this for the science alone and less for the emotionally intensive patient conversations, the day-to-day reality will be a mismatch.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Junior Genetic Counselor",
            "desc": "Building consultation skills under supervision, learning institutional protocols"
        },
        {
            "title": "Year 3-5",
            "exp": "Genetic Counselor",
            "desc": "Independent caseload, specializing (oncology, prenatal, pediatric, or rare disease)"
        },
        {
            "title": "Year 6-10",
            "exp": "Senior Genetic Counselor / Program Coordinator",
            "desc": "Leading a genetics program, training junior counselors, contributing to research"
        },
        {
            "title": "Year 10+",
            "exp": "Clinical Genetics Lead / Academic-Research track",
            "desc": "Rare in India currently but growing as testing volume increases"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Canada",
            "Australia"
        ],
        "industries": [
            "Hospital clinical genetics",
            "Reproductive/prenatal medicine",
            "Oncology genetics",
            "Direct-to-consumer/clinical genomics companies"
        ],
        "employers": [
            "Manipal Hospitals",
            "MedGenome",
            "Mapmygenome",
            "Strand Life Sciences",
            "ARUP Laboratories (US)",
            "Wellstar Health System (US)"
        ],
        "growthRegions": "US demand remains the strongest abroad; India's growth is concentrated in Bangalore, Chennai, Hyderabad, and Mumbai",
        "remoteWork": "Growing — telegenetics/remote counseling is an active and expanding model, especially post-2020"
    },
    "skills": {
        "technical": [
            {
                "name": "Pedigree/family history analysis",
                "level": 80
            },
            {
                "name": "Genetic test interpretation",
                "level": 75
            },
            {
                "name": "Risk communication",
                "level": 85
            },
            {
                "name": "Clinical documentation (REDCap/OpenClinica)",
                "level": 55
            }
        ],
        "soft": [
            {
                "name": "Empathetic, non-directive counseling",
                "level": 90
            },
            {
                "name": "Plain-language science communication",
                "level": 85
            },
            {
                "name": "Emotional resilience",
                "level": 80
            }
        ],
        "emerging": [
            {
                "name": "AI-assisted variant interpretation tools",
                "level": 45
            },
            {
                "name": "Telegenetics/remote counseling platforms",
                "level": 60
            }
        ]
    },
    "education": {
        "degrees": [
            "Bachelor's in genetics, life sciences, molecular biology, or a related field"
        ],
        "masters": [
            "MSc in Genomic/Genetic Counseling — BOGCI-accredited programs at Manipal Hospitals Bangalore, NIMS Hyderabad, Sri Guru Ram Das University Amritsar"
        ],
        "alternative": [
            "Certificate programs in genetic counseling are emerging but MSc remains the standard route to BOGCI registration"
        ],
        "certifications": [
            "BOGCI (Board of Genetic Counselling India) registration — the governing body for the profession in India",
            "ABGC (American Board of Genetic Counseling) certification for US practice"
        ],
        "bridgePrograms": [
            "Short workshops/CME in clinical genetics for those transitioning from a general genetics or nursing background"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Very few positions open per year nationally, making job search genuinely competitive despite the 'growing field' narrative",
            "Salary doesn't yet reflect the specialized training required",
            "Field lacks the institutional maturity (clear career ladders, large peer networks) of more established allied-health professions"
        ],
        "competition": "Moderate for the limited MSc seats; low-moderate for jobs given how few positions exist, but that's also the risk — supply of trained counselors could outpace real openings",
        "stressLevel": "Moderate-High — emotionally weighty conversations are routine, not occasional",
        "learningCurve": "Steep initially given the dual science + counseling skill set required",
        "typicalSetbacks": [
            "Struggling to find a genetics-specific role and ending up in adjacent lab/QC work instead",
            "Emotional burnout from repeated difficult-diagnosis conversations without adequate institutional support"
        ]
    }
},
  "clinical_research_regulatory_affairs": {
    "futureDemand": "Very High",
    "futureDemandSubtitle": "India is now the world's third-largest clinical trials hub, with registered trials up ~50% year-on-year into early 2026 as global pharma shifts R&D to Indian sites.",
    "salaryRange": "India: ₹3.5-5.5L entry (Junior CRA/CRC), ₹8-14L mid (CRA II/III), ₹16-22L senior/lead, ₹30-50L+ director. Abroad (US): $70-85K entry, $95-135K senior, $150-180K+ director.",
    "yearsToEnter": "2-4 years (Bachelor's in life sciences/pharmacy + PG Diploma in Clinical Research; PGDCR bridges non-life-science backgrounds)",
    "aiRisk": "Medium",
    "aiSafetyLevel": "Remote/centralized monitoring is automating routine site checks",
    "aiSafetySubtitle": "Decentralized trials and AI-assisted remote data monitoring are reducing the need for in-person site visits for pure data-verification work, but relationship management with investigator sites and judgment calls on protocol deviations stay human.",
    "scholarshipAvailability": "Low",
    "scholarshipsSubtitle": "Few dedicated scholarships; most PGDCR/certificate programs are self-funded, though some CROs sponsor training for hires",
    "financingOutlook": "Strong — PGDCR/certification costs (₹50K-2L) are recovered quickly given fast salary growth in the first 3-5 years",
    "dailyResponsibilities": [
        "Conduct site monitoring visits (or remote reviews) to verify trial data against source documents",
        "Check protocol and ICH-GCP compliance at investigator sites",
        "Communicate with site coordinators, investigators, and sponsors on trial status",
        "Prepare monitoring visit reports (eMVRs) and follow up on action items"
    ],
    "weeklyResponsibilities": [
        "Travel to assigned sites (field CRA roles; 50-80% travel is typical)",
        "Sponsor/CRO status calls on enrollment and data quality metrics",
        "Review adverse event reports and query resolution status",
        "Training updates on protocol amendments"
    ],
    "majorDecisions": [
        "Whether a data discrepancy or protocol deviation requires escalation to the sponsor",
        "Site selection and site-initiation readiness assessments",
        "Risk-based monitoring priorities across a portfolio of sites"
    ],
    "workEnvironment": "Mix of hospital/clinic site visits and remote/office-based data review; travel-heavy for field CRA roles, more desk-based for in-house/regulatory roles.",
    "whoTheyWorkWith": "Principal investigators, site coordinators (CRCs), sponsors, regulatory affairs teams, and data management teams.",
    "successCriteria": "Judged on data quality at assigned sites, timeliness of monitoring visit reports, and how few protocol deviations go undetected.",
    "dayInTheLife": "A field CRA's day often starts early with travel to a site, several hours reviewing source documents against case report forms, a debrief with the site coordinator on open queries, then travel back and writing up the visit report that evening. In-house/regulatory roles look more like a standard office day: reviewing submissions, coordinating with regulators (CDSCO in India), and tracking trial-wide compliance metrics.",
    "pros": [
        "India's trial volume is genuinely growing fast, so job security and salary growth are both real right now",
        "Clear certification pathway (ICH-GCP, CCRP, CCRA) with visible salary impact",
        "Transferable globally — the same GCP framework applies at CROs worldwide",
        "Variety: therapeutic areas rotate, so the work rarely gets stale"
    ],
    "cons": [
        "Field CRA roles involve heavy travel (50-80%), which wears on some people over time",
        "Entry-level pay (₹3-5L) is modest relative to the technical/regulatory knowledge required",
        "High documentation burden — every action must be audit-defensible",
        "Career growth to CRA II/III often requires 1-2 years of grinding through junior monitoring work first"
    ],
    "thriveTraits": [
        "Meticulous, audit-minded attention to detail",
        "Comfortable with frequent travel",
        "Diplomatic in managing site relationships under compliance pressure",
        "Organized enough to track many parallel sites/protocols"
    ],
    "struggleWarning": "If constant travel and rigid documentation standards sound draining rather than manageable, the field CRA path specifically will burn you out fast — though in-house/regulatory-affairs tracks avoid most of the travel.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Clinical Research Coordinator (CRC) / Junior CRA",
            "desc": "Site-level coordination or entry monitoring under supervision"
        },
        {
            "title": "Year 2-5",
            "exp": "CRA / CRA II",
            "desc": "Independent site monitoring, ICH-GCP certification, growing site portfolio"
        },
        {
            "title": "Year 5-8",
            "exp": "Senior/Lead CRA",
            "desc": "Managing complex or multi-country trials, mentoring junior CRAs"
        },
        {
            "title": "Year 8+",
            "exp": "Clinical Research Manager / Regulatory Affairs Director",
            "desc": "Team leadership, budget/timeline ownership, sponsor relationship management"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "Switzerland",
            "Singapore",
            "Canada",
            "Germany"
        ],
        "industries": [
            "Contract Research Organizations (CROs)",
            "Pharmaceutical sponsors",
            "Government trials (ICMR)",
            "Medical device trials"
        ],
        "employers": [
            "IQVIA",
            "Parexel",
            "AstraZeneca",
            "Sun Pharma",
            "Novo Nordisk",
            "Cliantha Research",
            "Lambda Therapeutic Research"
        ],
        "growthRegions": "India (fastest-growing CRA market by % YoY), Singapore, and Switzerland (highest absolute pay) lead globally",
        "remoteWork": "Growing — decentralized trials and remote/centralized monitoring roles are an increasing share of the market"
    },
    "skills": {
        "technical": [
            {
                "name": "ICH-GCP compliance",
                "level": 90
            },
            {
                "name": "Source data verification (SDV)",
                "level": 80
            },
            {
                "name": "EDC systems (electronic data capture)",
                "level": 70
            },
            {
                "name": "Regulatory submission basics (CDSCO/FDA)",
                "level": 55
            }
        ],
        "soft": [
            {
                "name": "Attention to detail under audit pressure",
                "level": 90
            },
            {
                "name": "Site relationship management",
                "level": 75
            },
            {
                "name": "Time management across multiple sites",
                "level": 75
            }
        ],
        "emerging": [
            {
                "name": "Decentralized/remote trial monitoring platforms",
                "level": 55
            },
            {
                "name": "AI-assisted data anomaly detection",
                "level": 45
            }
        ]
    },
    "education": {
        "degrees": [
            "B.Pharm, BSc Life Sciences (Microbiology/Biochemistry/Biotechnology), BPT, BDS, or MBBS"
        ],
        "masters": [
            "M.Pharm, MSc Life Sciences, MBA in Clinical Research, or MSc Clinical Research"
        ],
        "alternative": [
            "PG Diploma in Clinical Research (PGDCR) — the most common bridge for non-medical graduates entering the field"
        ],
        "certifications": [
            "ICH-GCP E6(R2) — effectively mandatory across the industry",
            "CCRP (Certified Clinical Research Professional)",
            "CCRA (Certified Clinical Research Associate)"
        ],
        "bridgePrograms": [
            "NIPER, Institute of Clinical Research India (ICRI), and Jamia Hamdard offer strong placement-linked PGDCR/MSc programs"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Heavy travel burden in field roles can strain work-life balance",
            "Entry salary correction has made the first 1-2 years financially tight despite rising demand",
            "Regulatory landscape (CDSCO requirements) shifts and requires continuous relearning"
        ],
        "competition": "High at entry level (many PGDCR grads chasing junior CRA roles); moderate at senior level where genuine multi-country trial experience is scarcer",
        "stressLevel": "Moderate-High — audit readiness and sponsor deadlines create real pressure",
        "learningCurve": "Moderate — ICH-GCP and SOP fluency is learnable in months, but judgment on edge cases takes a few years",
        "typicalSetbacks": [
            "Getting typecast in field monitoring with no route into in-house or regulatory roles",
            "Burnout from travel-heavy schedules without corresponding pay growth at smaller CROs"
        ]
    }
},
  "public_health_epidemiology": {
    "futureDemand": "High",
    "futureDemandSubtitle": "US BLS projects 16% employment growth for epidemiologists 2024-2034 (much faster than average); India's public health workforce is expanding via NMHP-style national programs and growing private health-data demand.",
    "salaryRange": "India: ₹3.65L entry, ₹6.4-12.6L average, up to ₹26L senior. Abroad (US): BLS median $83,980-$87,220, top 10% $134,860+, scientific R&D roles $130K+.",
    "yearsToEnter": "5-6 years (Bachelor's + MPH; PhD/DrPH adds 4-6 years for academic/research leadership)",
    "aiRisk": "Low-Medium",
    "aiSafetyLevel": "Data tools accelerate analysis, judgment on causality stays human",
    "aiSafetySubtitle": "AI and large datasets are speeding up outbreak detection and modeling, but designing sound studies, interpreting confounded real-world data, and communicating findings to policymakers require human epidemiological judgment.",
    "scholarshipAvailability": "Moderate",
    "scholarshipsSubtitle": "ICMR fellowships and WHO/UNICEF-linked traineeships support public health students; several international MPH programs (e.g. Fogarty, Fulbright) fund Indian applicants",
    "financingOutlook": "Solid for government/international-agency track; weaker if targeting only private-sector Indian roles, where pay is currently modest relative to MPH cost",
    "dailyResponsibilities": [
        "Collect and clean surveillance or research data (interviews, surveys, lab samples)",
        "Run statistical analyses to identify disease patterns or risk factors",
        "Draft reports/briefs for health departments, NGOs, or academic publication",
        "Coordinate with lab, clinical, or field teams on data collection protocols"
    ],
    "weeklyResponsibilities": [
        "Present findings to public health teams or advisory committees",
        "Review literature on emerging health threats relevant to current projects",
        "Support program planning/evaluation for ongoing public health interventions",
        "Respond to urgent outbreak investigations when they arise"
    ],
    "majorDecisions": [
        "Study design choices (cohort vs. case-control vs. cross-sectional) for a given research question",
        "Whether an observed pattern signals a genuine outbreak or statistical noise",
        "How to prioritize limited public health resources across competing risks"
    ],
    "workEnvironment": "Government health departments, research institutions/universities, NGOs (WHO, UNICEF, PHFI), or private health-data/insurance companies; a mix of desk-based analysis and occasional field investigation.",
    "whoTheyWorkWith": "Biostatisticians, physicians, health policymakers, lab scientists, and community health workers.",
    "successCriteria": "Judged on the rigor and reproducibility of analysis, timeliness of outbreak response (applied roles), and real-world influence on policy or program design.",
    "dayInTheLife": "Applied (government/NGO) epidemiologists split time between data analysis at a desk and field visits during active investigations, with sudden shifts in priority when an outbreak is reported. Research epidemiologists in academia have a steadier rhythm of data analysis, writing, and grant/publication deadlines, punctuated by teaching if in a university role.",
    "pros": [
        "Genuine global demand (WHO, CDC, national governments all hiring) with a portable MPH credential",
        "Meaningful, population-scale impact rather than one-patient-at-a-time work",
        "Diverse specialization options (infectious disease, chronic disease, environmental, occupational health)",
        "Strong international mobility given the credential is recognized worldwide"
    ],
    "cons": [
        "Indian private-sector pay is currently modest relative to MPH cost and prestige of the degree",
        "Government positions (the most stable, well-regarded track) are limited in number and competitive to enter",
        "Applied roles can involve sudden, disruptive outbreak-response demands on personal time",
        "Career impact is often diffuse/long-term, which can feel less immediately rewarding than clinical work"
    ],
    "thriveTraits": [
        "Strong quantitative/statistical reasoning",
        "Comfortable with ambiguity in real-world (non-experimental) data",
        "Motivated by population-level rather than individual impact",
        "Able to communicate technical findings to non-technical policymakers"
    ],
    "struggleWarning": "If you want the immediate feedback of one-on-one patient care, the delayed, population-level nature of public health impact may feel unsatisfying.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Research/Public Health Associate",
            "desc": "Data collection and analysis support under senior epidemiologist supervision"
        },
        {
            "title": "Year 3-6",
            "exp": "Epidemiologist",
            "desc": "Independent study design and analysis, contributing to publications or program reports"
        },
        {
            "title": "Year 7-12",
            "exp": "Senior Epidemiologist / Program Lead",
            "desc": "Leading surveillance programs or research units, supervising junior staff"
        },
        {
            "title": "Year 12+",
            "exp": "Chief Epidemiologist / Academic Faculty / Agency Director",
            "desc": "Setting research or policy agenda at institutional or national level"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Switzerland (WHO)",
            "Kenya/multi-country field epidemiology programs"
        ],
        "industries": [
            "Government public health",
            "Academic research",
            "International NGOs/agencies",
            "Health insurance/health-data analytics"
        ],
        "employers": [
            "ICMR",
            "WHO",
            "UNICEF",
            "Public Health Foundation of India (PHFI)",
            "CDC (US)",
            "state/local health departments"
        ],
        "growthRegions": "US federal and state agencies, WHO regional offices, and India's expanding state health surveillance systems",
        "remoteWork": "Moderate — data analysis roles are often remote-friendly; field investigation and program roles are not"
    },
    "skills": {
        "technical": [
            {
                "name": "Biostatistics (R/SAS/STATA)",
                "level": 85
            },
            {
                "name": "Study design methodology",
                "level": 80
            },
            {
                "name": "Surveillance data systems",
                "level": 65
            },
            {
                "name": "GIS/spatial epidemiology (specialization)",
                "level": 45
            }
        ],
        "soft": [
            {
                "name": "Policy communication for non-technical audiences",
                "level": 75
            },
            {
                "name": "Cross-sector coordination",
                "level": 70
            },
            {
                "name": "Composure under outbreak-response pressure",
                "level": 65
            }
        ],
        "emerging": [
            {
                "name": "AI-assisted outbreak detection/modeling",
                "level": 55
            },
            {
                "name": "Real-world/electronic health record data analysis",
                "level": 60
            }
        ]
    },
    "education": {
        "degrees": [
            "Bachelor's in life sciences, statistics, or a health-related field"
        ],
        "masters": [
            "MPH (Master of Public Health) — near-mandatory; top Indian options include PHFI's Indian Institutes of Public Health, AIIMS; abroad: Johns Hopkins, UNC-Chapel Hill, Harvard"
        ],
        "alternative": [
            "PG Diploma in Public Health Management for those seeking a shorter, applied route"
        ],
        "certifications": [
            "No single mandatory license in India; CDC/WHO field epidemiology training programs (FETP) add strong applied credibility"
        ],
        "bridgePrograms": [
            "Online MPH concentrations (Epidemiology, Leadership, Nutrition/Food Systems) from CEPH-accredited programs for working professionals"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Government roles are prestigious but genuinely scarce and slow-moving to hire",
            "Private-sector Indian pay hasn't caught up with the degree's cost/prestige",
            "Career payoff often requires an international stint (WHO, CDC, or a Western MPH) to unlock the higher salary bands"
        ],
        "competition": "High for government/international-agency roles; moderate for private-sector health-data roles",
        "stressLevel": "Moderate normally, spiking sharply during active outbreak investigations",
        "learningCurve": "Steep for the statistical/methodological core during the MPH; applied field judgment builds over 3-5 years",
        "typicalSetbacks": [
            "Getting stuck in data-entry-adjacent roles without real analytical ownership at the start of a career",
            "Long, bureaucratic timelines for government hiring processes"
        ]
    }
},
  "medical_laboratory_sciences_diagnostics": {
    "futureDemand": "High",
    "futureDemandSubtitle": "Laboratory results underpin roughly 70% of all medical treatment decisions, and India's diagnostic chains (Apollo, SRL, Dr. Lal PathLabs, Thyrocare) are expanding rapidly into tier-2/3 cities.",
    "salaryRange": "India: ₹2.5-4L entry, ₹4.5-8L mid, ₹8-12L+ senior/specialized. Abroad: ASCP-certified roles in the US typically $55-75K; UK Band 5-6 NHS scale roughly equivalent to physiotherapy bands.",
    "yearsToEnter": "3-4 years (Diploma/BSc MLT); MSc MLT adds 2 years for supervisory/specialized roles",
    "aiRisk": "Medium",
    "aiSafetyLevel": "Routine testing automating, complex diagnostics and sample judgment stay human",
    "aiSafetySubtitle": "Automated analyzers already handle high-volume routine tests (CBC, basic chemistry panels); the more durable human value is in sample quality judgment, troubleshooting unusual results, and complex specialized testing (molecular diagnostics, microbiology).",
    "scholarshipAvailability": "Low-Moderate",
    "scholarshipsSubtitle": "Limited dedicated scholarships; government ITI/polytechnic-linked diploma programs are the most affordable entry route",
    "financingOutlook": "Reasonable — low course cost (₹50K-3L) against a realistic ₹4-8L mid-career ceiling, though growth plateaus without further specialization",
    "dailyResponsibilities": [
        "Collect, process, and analyze patient samples (blood, tissue, fluids) using standard lab protocols",
        "Operate and maintain lab equipment (analyzers, centrifuges, microscopes)",
        "Perform quality control checks to ensure test accuracy",
        "Document results accurately in the lab information system"
    ],
    "weeklyResponsibilities": [
        "Equipment calibration and maintenance logs",
        "Review of quality control trends and flagging any drift",
        "Coordination with pathologists/clinicians on unusual or critical results",
        "Continuing education on new testing methods or equipment"
    ],
    "majorDecisions": [
        "Whether a sample is fit for testing or needs to be rejected/recollected",
        "How to troubleshoot an unexpected or inconsistent result before reporting it",
        "When to escalate a critical value for immediate clinical attention"
    ],
    "workEnvironment": "Hospital labs, standalone diagnostic centers, blood banks, or research labs; a structured, protocol-driven environment with defined shifts (including night shifts in 24/7 hospital labs).",
    "whoTheyWorkWith": "Pathologists, physicians, phlebotomists, and lab management/quality assurance teams.",
    "successCriteria": "Judged on accuracy and turnaround time of results, adherence to quality control standards, and reliability under high sample volume.",
    "dayInTheLife": "A typical shift involves processing a queue of samples through defined testing protocols, running quality control checks at set intervals, troubleshooting instrument flags, and documenting results — punctuated by occasional urgent/critical samples that jump the queue for immediate processing and physician notification.",
    "pros": [
        "Stable, essential-services demand — labs don't go away regardless of economic conditions",
        "Clear, structured career ladder from technician to supervisor to lab manager",
        "Government job security options (AIIMS, state hospitals) alongside private diagnostic chains",
        "Genuine abroad mobility with the right certification (ASCP-i, HCPC)"
    ],
    "cons": [
        "Entry salaries are low (₹2.5-4L) relative to the technical skill and shift-work demands",
        "Career ceiling without further specialization (MSc, niche certification) is modest",
        "Shift work, including nights and weekends, is standard in hospital settings",
        "Repetitive high-volume testing can feel monotonous over time"
    ],
    "thriveTraits": [
        "Precise, methodical, and quality-control minded",
        "Comfortable with repetitive protocol-driven work",
        "Able to stay calm and accurate under high sample-volume pressure",
        "Interested in the diagnostic 'detective work' behind unusual results"
    ],
    "struggleWarning": "If you want variety and creative problem-solving day-to-day, high-volume routine testing work will feel repetitive fast — specialization (molecular diagnostics, microbiology) is the main route out of that.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Lab Technician/Assistant",
            "desc": "Executing standard tests under supervision, learning instrument operation"
        },
        {
            "title": "Year 3-5",
            "exp": "Medical Laboratory Technologist",
            "desc": "Independent testing across departments (hematology, microbiology, biochemistry)"
        },
        {
            "title": "Year 6-10",
            "exp": "Senior Technologist / Section Lead",
            "desc": "Specializing (molecular diagnostics, blood banking) or moving into QA/quality management"
        },
        {
            "title": "Year 10+",
            "exp": "Lab Manager / Quality Control Manager",
            "desc": "Overseeing lab operations, compliance, and staff across a diagnostic facility"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Canada",
            "Australia",
            "UAE"
        ],
        "industries": [
            "Hospital pathology labs",
            "Standalone diagnostic chains",
            "Blood banks",
            "Research/pharma QC labs"
        ],
        "employers": [
            "Apollo Health and Lifestyle",
            "SRL Diagnostics",
            "Dr. Lal PathLabs",
            "Vijaya Diagnostic Centre",
            "HLL Lifecare",
            "Thyrocare"
        ],
        "growthRegions": "Metro and tier-2 Indian cities (diagnostic chain expansion); US and UK for certified professionals",
        "remoteWork": "Very low — inherently hands-on, on-site work"
    },
    "skills": {
        "technical": [
            {
                "name": "Sample processing & lab safety protocols",
                "level": 85
            },
            {
                "name": "Instrument operation (analyzers, microscopy)",
                "level": 80
            },
            {
                "name": "Quality control (GLP)",
                "level": 75
            },
            {
                "name": "Specialized testing (molecular/microbiology)",
                "level": 50
            }
        ],
        "soft": [
            {
                "name": "Precision and consistency under pressure",
                "level": 85
            },
            {
                "name": "Communication with clinical staff on critical results",
                "level": 60
            }
        ],
        "emerging": [
            {
                "name": "Automated analyzer troubleshooting",
                "level": 55
            },
            {
                "name": "Digital pathology/lab information systems",
                "level": 50
            }
        ]
    },
    "education": {
        "degrees": [
            "Diploma in Medical Laboratory Technology (DMLT) or BSc MLT"
        ],
        "masters": [
            "MSc MLT for supervisory/specialized roles"
        ],
        "alternative": [
            "Certificate courses in specific specializations (phlebotomy, blood banking, histopathology)"
        ],
        "certifications": [
            "ASCP-i (American Society for Clinical Pathology International) for US-track mobility",
            "HCPC registration equivalent pathways for UK"
        ],
        "bridgePrograms": [
            "MBA in Hospital Management as a bridge into lab administration/management roles"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Entry pay doesn't reflect the real technical responsibility (patient safety) of the role",
            "Shift work (including nights) is standard, not occasional",
            "Career growth plateaus without a deliberate move into specialization or management"
        ],
        "competition": "Moderate — high volume of diploma/BSc graduates each year, though private diagnostic chains are expanding capacity to absorb them",
        "stressLevel": "Moderate — steady rather than acute, though critical-result situations create sudden spikes",
        "learningCurve": "Moderate — core protocols are learnable within the diploma/degree; specialized testing takes longer to master",
        "typicalSetbacks": [
            "Getting stuck in high-volume routine testing with no path to specialization at smaller labs",
            "Physical fatigue from long shifts on feet handling high sample volumes"
        ]
    }
},
  "clinical_nutrition_dietetics": {
    "futureDemand": "High",
    "futureDemandSubtitle": "Rising lifestyle-disease burden (diabetes, obesity, cardiovascular disease) in India is steadily increasing demand for clinical dietitians in hospitals and corporate wellness programs.",
    "salaryRange": "India: ₹2.5-4L entry, ₹5-9L mid, ₹9-12L senior/RD-certified. Abroad (US): RD average $74,770 ($48,830-$101,760+), senior/specialized (sports nutrition, hospital directors) $100K+.",
    "yearsToEnter": "3-4 years (BSc Nutrition/Dietetics) + 6-month clinical internship for RD registration",
    "aiRisk": "Low-Medium",
    "aiSafetyLevel": "Meal-plan generation automatable, clinical counseling is not",
    "aiSafetySubtitle": "AI nutrition apps can generate generic meal plans, but adapting nutrition therapy to a specific patient's medical conditions, medications, and behavioral realities — and getting them to actually follow through — remains a clinical, relational skill.",
    "scholarshipAvailability": "Low",
    "scholarshipsSubtitle": "Limited dedicated scholarships; most BSc/MSc Nutrition programs are self-funded",
    "financingOutlook": "Modest — course cost is low but so is entry pay; RD certification (via IDA) is the single highest-leverage investment for salary growth",
    "dailyResponsibilities": [
        "Assess patients' nutritional status and medical history",
        "Design personalized diet/meal plans for medical conditions (diabetes, renal disease, cardiac conditions)",
        "Counsel patients and families on dietary changes and adherence",
        "Document nutrition care plans in medical charts"
    ],
    "weeklyResponsibilities": [
        "Round with the broader clinical team (physicians, nurses) on complex cases",
        "Update diet plans based on patient progress or lab results",
        "Conduct group education sessions (diabetes education, weight management)",
        "Stay current on nutrition science and dietary guideline updates"
    ],
    "majorDecisions": [
        "Which nutrition therapy approach fits a patient's specific medical + lifestyle constraints",
        "When to escalate a case (e.g. severe malnutrition, eating disorder signs) to a physician or mental health specialist",
        "How to balance clinical ideal vs. realistic patient adherence"
    ],
    "workEnvironment": "Hospitals and clinics (clinical dietitians), corporate wellness firms and fitness centers (wellness-track nutritionists), or private practice/telehealth.",
    "whoTheyWorkWith": "Physicians, nurses, diabetes educators, and (in hospital settings) the broader multidisciplinary care team.",
    "successCriteria": "Judged on measurable patient outcomes (weight, blood sugar, lipid panels), adherence rates, and clarity of patient education.",
    "dayInTheLife": "Hospital-based dietitians typically start with patient chart review, move into bedside assessments and counseling sessions, coordinate with the medical team on complex nutrition cases, and end the day updating care plans and documentation. Private-practice or corporate-wellness dietitians have more control over scheduling, usually running back-to-back consultations with less institutional documentation overhead.",
    "pros": [
        "Genuine, growing demand as lifestyle diseases rise across urban India",
        "RD certification (Indian Dietetic Association) provides a clear, credentialed path to higher pay and credibility",
        "Flexible career paths — hospital, corporate wellness, private practice, or content/education",
        "Meaningful day-to-day patient impact with visible health outcomes"
    ],
    "cons": [
        "Entry salaries are low (often ₹20-35K/month) relative to the science-heavy training",
        "RD certification process (6-month internship + IDA exam) is a real time/logistics hurdle",
        "Private practice income is unpredictable in the early years while building a client base",
        "Field sits adjacent to a lot of unlicensed 'nutrition influencer' competition that can undercut credibility and pricing"
    ],
    "thriveTraits": [
        "Genuine interest in behavior change, not just nutrition science",
        "Patient with slow, incremental patient progress",
        "Comfortable balancing clinical rigor with realistic patient counseling",
        "Entrepreneurial if pursuing private practice"
    ],
    "struggleWarning": "If you're drawn to this mainly for the science and less for the ongoing behavior-change coaching with patients, day-to-day practice will feel like a mismatch.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Junior Dietitian/Nutritionist",
            "desc": "Building clinical assessment skills, pursuing RD internship/certification"
        },
        {
            "title": "Year 3-5",
            "exp": "Registered Dietitian (RD)",
            "desc": "Independent caseload, often specializing (renal, diabetes, pediatric, sports)"
        },
        {
            "title": "Year 6-10",
            "exp": "Senior Clinical Dietitian / Wellness Program Lead",
            "desc": "Leading a hospital nutrition department or corporate wellness program"
        },
        {
            "title": "Year 10+",
            "exp": "Chief Dietitian / Private Practice Owner",
            "desc": "Department leadership or an established private practice/consultancy"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "UAE",
            "Australia"
        ],
        "industries": [
            "Hospitals",
            "Corporate wellness",
            "Sports nutrition",
            "Public health nutrition programs"
        ],
        "employers": [
            "Apollo Hospitals",
            "Fortis Healthcare",
            "corporate wellness startups",
            "St. John's Research Institute",
            "Health Care at Home India"
        ],
        "growthRegions": "Metro Indian cities for hospital/corporate roles; US/UK for RD/RDN-credentialed professionals",
        "remoteWork": "Moderate-High — tele-nutrition consulting is a genuinely growing model"
    },
    "skills": {
        "technical": [
            {
                "name": "Medical nutrition therapy",
                "level": 85
            },
            {
                "name": "Nutritional assessment & lab interpretation",
                "level": 75
            },
            {
                "name": "Meal planning for chronic conditions",
                "level": 80
            },
            {
                "name": "Nutrition informatics/tracking tools",
                "level": 50
            }
        ],
        "soft": [
            {
                "name": "Behavior-change counseling",
                "level": 85
            },
            {
                "name": "Patient education & communication",
                "level": 85
            },
            {
                "name": "Empathy without judgment",
                "level": 80
            }
        ],
        "emerging": [
            {
                "name": "AI-assisted meal planning tools (as an aid, not a replacement)",
                "level": 45
            },
            {
                "name": "Continuous glucose monitor (CGM) data interpretation",
                "level": 55
            }
        ]
    },
    "education": {
        "degrees": [
            "BSc Nutrition & Dietetics / Food Science"
        ],
        "masters": [
            "MSc Foods and Nutrition / Clinical Nutrition / Dietetics"
        ],
        "alternative": [
            "PG Diploma in Food and Nutrition for career-changers from adjacent science backgrounds"
        ],
        "certifications": [
            "RD (Registered Dietitian) via the Indian Dietetic Association (IDA) — requires a 6-month accredited hospital internship plus a national exam",
            "RDN (US) via ACEND-accredited program + Commission on Dietetic Registration exam"
        ],
        "bridgePrograms": [
            "Sports nutrition, diabetes education, and clinical nutrition certificate add-ons to boost specialization and pay"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Entry pay is genuinely low relative to the degree's rigor",
            "RD certification requires navigating a 6-month internship placement, which isn't always straightforward to secure",
            "Unregulated 'nutrition coach' competition can undercut credentialed dietitians on price"
        ],
        "competition": "High at entry level given large numbers of BSc Nutrition graduates each year",
        "stressLevel": "Low-Moderate in most settings; higher in acute hospital settings managing critically ill patients' nutrition",
        "learningCurve": "Moderate — clinical nutrition therapy for specific conditions (renal, oncology) takes real time to master beyond general dietetics",
        "typicalSetbacks": [
            "Struggling to secure a quality hospital internship for RD certification",
            "Slow client-base building in the first 1-2 years of private practice"
        ]
    }
},
  "physiotherapy_rehabilitation": {
    "futureDemand": "High",
    "futureDemandSubtitle": "Demand is rising globally (aging populations, chronic disease, sports medicine) and in India (growing hospital/wellness infrastructure); UK, Canada, and Australia all report active shortages of trained physiotherapists.",
    "salaryRange": "India: ₹1.7-3.5L entry, ₹3-6L average, ₹7-11L senior (up to ₹24L exceptional). Abroad (UK): NHS Band 5 £29,970 to Band 6 £37,338 entry-mid, up to £65,000 senior/private; (US/Australia/UAE pay meaningfully higher still).",
    "yearsToEnter": "4.5 years (BPT — Bachelor of Physiotherapy); MPT adds 2 years for specialization/senior roles",
    "aiRisk": "Very Low",
    "aiSafetyLevel": "Hands-on physical care resists automation",
    "aiSafetySubtitle": "Manual therapy, hands-on assessment, and real-time adjustment to a patient's physical response are inherently physical and relational — among the most automation-resistant clinical skills.",
    "scholarshipAvailability": "Low-Moderate",
    "scholarshipsSubtitle": "Limited dedicated scholarships in India; state quota/government college seats keep BPT costs manageable relative to private colleges",
    "financingOutlook": "Weak in India specifically at entry level (pay is low relative to a 4.5-year professional degree) but strong once combined with an abroad HCPC/licensure pathway",
    "dailyResponsibilities": [
        "Assess patients' mobility, pain, and functional limitations",
        "Deliver hands-on treatment (manual therapy, exercise therapy, modalities like ultrasound/electrotherapy)",
        "Track and adjust rehabilitation plans based on patient progress",
        "Educate patients/families on home exercise programs"
    ],
    "weeklyResponsibilities": [
        "Case discussions with referring physicians/surgeons on complex patients",
        "Documentation of progress notes for insurance/medical records",
        "Continuing education on new rehabilitation techniques",
        "Equipment/modality maintenance checks"
    ],
    "majorDecisions": [
        "Which treatment modality and intensity fits a patient's specific injury/condition and pain tolerance",
        "When to progress vs. hold back a rehabilitation plan based on patient response",
        "When a case needs referral back to a physician/surgeon rather than continued physiotherapy"
    ],
    "workEnvironment": "Hospitals, dedicated rehabilitation centers, sports clinics, or private practice; substantial time on your feet doing hands-on patient work rather than desk-based work.",
    "whoTheyWorkWith": "Orthopedic surgeons, neurologists, sports medicine physicians, occupational therapists, and patients' families.",
    "successCriteria": "Judged on measurable functional improvement in patients, patient satisfaction, and (in private practice) referral network strength.",
    "dayInTheLife": "A typical day is a back-to-back schedule of patient sessions — assessment, hands-on treatment, guided exercises — with short gaps for documentation between patients. Hospital-based physiotherapists often round with the broader care team on inpatients; private-practice physiotherapists have more control over scheduling but carry the burden of building and retaining a client base.",
    "pros": [
        "Very strong global mobility — genuinely in-demand in UK, Australia, Canada, US, and UAE with clear licensure pathways",
        "Hands-on work with visible, satisfying patient progress",
        "Diverse specialization options (sports, neuro, pediatric, geriatric, cardiopulmonary rehab)",
        "Low automation risk given the physical, relational nature of the work"
    ],
    "cons": [
        "Indian entry salaries are genuinely low (₹1.7-3.5L) for a 4.5-year professional degree",
        "Physically demanding — long hours on your feet, repetitive strain risk for the practitioner",
        "HCPC/abroad licensure (UK) involves real cost (£678+ fees) and 3-5 month process overhead",
        "India still pays meaningfully less than MBBS for comparable years of training, a common source of frustration in the field"
    ],
    "thriveTraits": [
        "Physically fit and comfortable with hands-on manual work",
        "Patient with slow, incremental patient recovery timelines",
        "Strong communicator for patient motivation/adherence",
        "Interested in biomechanics and movement science"
    ],
    "struggleWarning": "If you're drawn to this expecting Indian pay to match the length of professional training, the reality — especially in the first 5 years — will be a source of real frustration; the abroad pathway substantially changes this picture.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Junior Physiotherapist",
            "desc": "Building hands-on treatment skills under supervision across general caseloads"
        },
        {
            "title": "Year 3-6",
            "exp": "Physiotherapist / Specializing",
            "desc": "Independent caseload, often specializing (sports, neuro, ortho, pediatric)"
        },
        {
            "title": "Year 7-12",
            "exp": "Senior Physiotherapist / Clinic Lead",
            "desc": "Managing a department or growing a private practice/clinic"
        },
        {
            "title": "Year 12+",
            "exp": "Practice Owner / Department Head",
            "desc": "Running a multi-therapist clinic or leading hospital rehabilitation services"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "UK",
            "Australia",
            "Canada",
            "USA",
            "UAE",
            "Switzerland"
        ],
        "industries": [
            "Hospital rehabilitation",
            "Sports medicine/clinics",
            "Private practice",
            "Occupational health",
            "NHS (UK)"
        ],
        "employers": [
            "Max Healthcare",
            "Apollo Hospitals",
            "NHS Trusts (UK)",
            "private physiotherapy clinics abroad"
        ],
        "growthRegions": "UK NHS and private sector, Australia, Canada, and UAE show the strongest active demand for overseas-trained physiotherapists",
        "remoteWork": "Very low — inherently hands-on work; telehealth limited to remote exercise coaching/follow-up only"
    },
    "skills": {
        "technical": [
            {
                "name": "Manual therapy techniques",
                "level": 85
            },
            {
                "name": "Exercise prescription & biomechanics",
                "level": 80
            },
            {
                "name": "Electrotherapy/modality use",
                "level": 65
            },
            {
                "name": "Condition-specific rehab protocols",
                "level": 75
            }
        ],
        "soft": [
            {
                "name": "Patient motivation & adherence coaching",
                "level": 85
            },
            {
                "name": "Physical stamina",
                "level": 80
            },
            {
                "name": "Clear progress communication to patients/families",
                "level": 75
            }
        ],
        "emerging": [
            {
                "name": "Wearable/movement-tracking tech in rehab",
                "level": 50
            },
            {
                "name": "Telehealth follow-up coaching",
                "level": 45
            }
        ]
    },
    "education": {
        "degrees": [
            "BPT (Bachelor of Physiotherapy) — 4.5 years including clinical internship"
        ],
        "masters": [
            "MPT (Master of Physiotherapy) with specialization (ortho, neuro, sports, cardiopulmonary, pediatric)"
        ],
        "alternative": [
            "Diploma routes exist but BPT is the standard professional entry point"
        ],
        "certifications": [
            "HCPC registration (UK) for practicing abroad",
            "AHPRA registration (Australia)",
            "State licensure (US, varies by state)"
        ],
        "bridgePrograms": [
            "Top-up/adaptation programs in the UK for Indian-trained physiotherapists to meet HCPC standards of proficiency"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Indian salary genuinely lags the length/rigor of the BPT+MPT training path",
            "Physical toll of a hands-on career over decades (repetitive strain)",
            "HCPC/abroad registration takes real time and money to navigate correctly"
        ],
        "competition": "Moderate-High for hospital roles in major Indian cities; lower for underserved regions or abroad given active shortages",
        "stressLevel": "Moderate — physically tiring more than acutely stressful, barring high-acuity rehab (post-stroke, ICU) settings",
        "learningCurve": "Moderate — foundational manual therapy skills are taught in BPT; genuine clinical judgment builds over the first 2-3 years of practice",
        "typicalSetbacks": [
            "CoS (certificate of sponsorship) refusals or visa hurdles when applying to work in the UK/other countries",
            "Physical injury or burnout from years of manual, hands-on patient work without adequate self-care"
        ]
    }
},
  "hospital_healthcare_management": {
    "futureDemand": "Very High",
    "futureDemandSubtitle": "India's private hospital sector is expanding rapidly (chains, tier-2/3 city hospitals, digital health integration), and US BLS projects roughly 23% growth for healthcare/medical services managers.",
    "salaryRange": "India: ₹4.5-6.6L entry (up to ₹12L for MBA entrants), ₹15-30L+ senior. Abroad (US): $98,754-$117,015 average, senior-weighted samples averaging $229,559; UK: managers average £55,000, NHS admin entry £25,000-£28,000.",
    "yearsToEnter": "3-5 years (BHA/MBA/MHA); MHA or MBA in Healthcare Management is the strongest credential for senior tracks",
    "aiRisk": "Medium",
    "aiSafetyLevel": "Operational/scheduling tasks automating, leadership judgment stays human",
    "aiSafetySubtitle": "Routine scheduling, billing, and reporting are increasingly software-driven, but strategic decisions — staffing models, capacity planning, crisis response, stakeholder negotiation — remain a human leadership function.",
    "scholarshipAvailability": "Low-Moderate",
    "scholarshipsSubtitle": "Limited dedicated scholarships; MHA/MBA programs at institutions like TISS and IIHMR are moderately priced relative to general MBA programs",
    "financingOutlook": "Strong for MHA/MBA-credentialed entrants targeting private hospital chains; weaker for diploma-only entrants who plateau earlier",
    "dailyResponsibilities": [
        "Oversee daily hospital/department operations (staffing, patient flow, resource allocation)",
        "Review budget and financial performance metrics",
        "Ensure regulatory and accreditation compliance (NABH in India)",
        "Coordinate between clinical staff, administration, and support services"
    ],
    "weeklyResponsibilities": [
        "Leadership/department head meetings on operational priorities",
        "Review of patient satisfaction and quality metrics",
        "Staffing and resource planning for the coming period",
        "Vendor/supply chain management coordination"
    ],
    "majorDecisions": [
        "Resource and staffing allocation across departments, especially during surges",
        "Capital investment priorities (equipment, facility expansion)",
        "How to balance cost efficiency against quality-of-care standards"
    ],
    "workEnvironment": "Hospital administrative offices, with regular floor walks and cross-department coordination; less clinical, more managerial/operational in nature.",
    "whoTheyWorkWith": "Medical directors, department heads (nursing, pharmacy, lab), finance teams, and (at senior levels) hospital boards/ownership.",
    "successCriteria": "Judged on operational efficiency metrics, patient satisfaction scores, regulatory compliance standing, and financial performance of the unit/hospital.",
    "dayInTheLife": "A typical day mixes operational firefighting (staffing gaps, equipment issues, patient complaints) with scheduled meetings on budget, compliance, or strategic planning, and a walk-through of hospital floors to stay grounded in ground-level realities. Senior roles skew more toward strategy and less toward day-to-day firefighting, which is delegated to unit-level managers.",
    "pros": [
        "Strong, durable demand as India's private hospital sector keeps expanding into smaller cities",
        "Clear credential-to-salary link — MHA/MBA entrants start meaningfully higher and grow faster",
        "Transferable skill set across the broader healthcare industry (insurance, health-tech, pharma) beyond just hospitals",
        "Leadership track with real strategic influence, unlike many allied-health clinical roles"
    ],
    "cons": [
        "Entry without an MHA/MBA (diploma-only) plateaus early and pays modestly",
        "High-pressure operational role — hospital crises don't wait for convenient hours",
        "Requires navigating competing interests (clinical staff, finance, patients) constantly, which can be politically taxing",
        "India's public hospital administration track (though stable) is bureaucratically slow to promote"
    ],
    "thriveTraits": [
        "Calm, decisive under operational pressure",
        "Comfortable with financial/budget management",
        "Strong stakeholder-management and negotiation skills",
        "Genuinely interested in systems and processes, not just patient care"
    ],
    "struggleWarning": "If you want to be close to direct patient care day-to-day, this role's inherently operational/managerial focus will feel like a step away from the reason many people enter healthcare.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Administrative Executive / OPD Operations",
            "desc": "Learning hospital operations from the ground up, department-level support"
        },
        {
            "title": "Year 3-6",
            "exp": "Assistant/Deputy Hospital Administrator",
            "desc": "Owning a department or unit's operations and budget"
        },
        {
            "title": "Year 7-12",
            "exp": "Hospital Administrator / Operations Director",
            "desc": "Full-hospital operational ownership, cross-department leadership"
        },
        {
            "title": "Year 12+",
            "exp": "CEO / Regional Healthcare Director",
            "desc": "Multi-facility or chain-level strategic leadership"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "UAE",
            "Singapore"
        ],
        "industries": [
            "Hospital chains",
            "Health insurance",
            "Health-tech",
            "Government health systems"
        ],
        "employers": [
            "Apollo Hospitals Group",
            "Fortis Healthcare",
            "Max Healthcare",
            "large NHS Trusts (UK)",
            "major US hospital systems"
        ],
        "growthRegions": "India's private hospital expansion into tier-2/3 cities; US hospital systems for MHA/FACHE-credentialed professionals",
        "remoteWork": "Low-Moderate — senior strategic roles have more flexibility than floor-level operational roles"
    },
    "skills": {
        "technical": [
            {
                "name": "Healthcare finance & budgeting",
                "level": 75
            },
            {
                "name": "Regulatory compliance (NABH/accreditation)",
                "level": 70
            },
            {
                "name": "Operations/process management",
                "level": 80
            },
            {
                "name": "Healthcare data systems (HMIS)",
                "level": 55
            }
        ],
        "soft": [
            {
                "name": "Stakeholder negotiation",
                "level": 80
            },
            {
                "name": "Crisis decision-making",
                "level": 75
            },
            {
                "name": "Cross-functional leadership",
                "level": 80
            }
        ],
        "emerging": [
            {
                "name": "Digital health / hospital automation systems",
                "level": 55
            },
            {
                "name": "Telemedicine program management",
                "level": 50
            }
        ]
    },
    "education": {
        "degrees": [
            "BHA (Bachelor of Hospital Administration) or any bachelor's + healthcare management PG"
        ],
        "masters": [
            "MHA (Master of Health Administration — TISS, IIHMR, Manipal in India; Johns Hopkins, GWU, Cornell abroad)",
            "MBA with Healthcare Management specialization"
        ],
        "alternative": [
            "PG Diploma in Hospital Management (PGDHM) as a shorter, applied alternative to a full MHA"
        ],
        "certifications": [
            "NABH (National Accreditation Board for Hospitals) familiarity is essential in India",
            "FACHE (Fellow of the American College of Healthcare Executives) — the premier US credential for senior healthcare executives"
        ],
        "bridgePrograms": [
            "Certificate courses in hospital administration for clinicians (nurses, allied health) transitioning into management"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Diploma-only entrants plateau early without an MHA/MBA",
            "Constant balancing act between clinical, financial, and patient-experience priorities",
            "Public-sector administrative promotion timelines can be slow and bureaucratic"
        ],
        "competition": "Moderate — MHA/MBA programs are competitive to enter but the healthcare management job market is expanding fast enough to absorb graduates",
        "stressLevel": "Moderate-High — operational crises (staffing gaps, equipment failures, patient complaints) are a routine part of the job",
        "learningCurve": "Moderate — general management principles transfer, but healthcare-specific regulatory/clinical-workflow knowledge takes a few years to internalize",
        "typicalSetbacks": [
            "Getting caught between clinical staff and cost-cutting directives from ownership",
            "Slow promotion timelines in public/government hospital systems"
        ]
    }
},
  "clinical_psychology": {
    "futureDemand": "Very High",
    "futureDemandSubtitle": "India has fewer than 10,000 certified clinical psychologists against a population where 200M+ people report mental health issues — a severe, well-documented supply gap that keeps demand structurally high.",
    "salaryRange": "India: Govt (NIMHANS/AIIMS, 7th CPC Level 10) ~₹80-95K/month in-hand; private hospital freshers often just ₹15-25K/month (₹1.8-3L/yr) despite the MPhil; established private practice ₹1.5-3.5L/month. Abroad: US BLS median $96,100 (entry $48,820-$66,050, top 10% $168,870+); UK average £58,902.",
    "yearsToEnter": "7 years total: BA/BSc Psychology (3-4 yrs) + MA/MSc Psychology (2 yrs) + RCI-recognized clinical qualification (2 yrs)",
    "aiRisk": "Very Low",
    "aiSafetyLevel": "Therapeutic relationship resists automation",
    "aiSafetySubtitle": "AI chatbot-delivered self-help tools are growing, but diagnosis, complex case formulation, and the therapeutic alliance itself are built on trust and clinical judgment that current AI cannot replicate for serious mental illness.",
    "scholarshipAvailability": "Low",
    "scholarshipsSubtitle": "Government stipends exist for MPhil seats at NIMHANS, CIP Ranchi, IHBAS, and similar RCI-recognized institutes, but seats are extremely limited (roughly 100:1 competition at top institutes)",
    "financingOutlook": "Genuinely mixed — the credential is prestigious and in real demand, but Indian private-sector entry pay badly lags the 7-year training investment; the payoff comes 3-7 years in, via government positions or an established private practice",
    "dailyResponsibilities": [
        "Conduct clinical interviews, psychological assessments, and diagnostic evaluations",
        "Deliver individual or group therapy (CBT, psychodynamic, or other modalities per training)",
        "Document case notes and treatment plans per clinical and RCI standards",
        "Coordinate with psychiatrists on cases requiring medication management"
    ],
    "weeklyResponsibilities": [
        "Case supervision or peer consultation on complex cases",
        "Continuing education on new therapeutic techniques or diagnostic criteria (DSM/ICD updates)",
        "Crisis intervention as needed for at-risk patients",
        "Report writing for legal, educational, or medical referral purposes"
    ],
    "majorDecisions": [
        "Diagnostic formulation and treatment approach for complex or comorbid presentations",
        "Risk assessment and safety planning for patients expressing suicidal or self-harm ideation",
        "When to refer to psychiatry for medication vs. continue with therapy alone"
    ],
    "workEnvironment": "Government hospitals (NIMHANS, AIIMS, state mental health institutes), private hospitals, mental health NGOs, rehabilitation centers, or private practice.",
    "whoTheyWorkWith": "Psychiatrists, other mental health professionals, family members of patients, and (in institutional settings) multidisciplinary care teams.",
    "successCriteria": "Judged on diagnostic accuracy, patient outcomes/symptom improvement, and (in private practice) client retention and referral network.",
    "dayInTheLife": "A government-hospital clinical psychologist's day is usually a packed schedule of assessments and therapy sessions across a high patient volume, with limited time between sessions for documentation. A private-practice psychologist has more control over caseload size and session length but carries the ongoing work of building and sustaining a client base, especially in the first several years.",
    "pros": [
        "Genuinely severe supply-demand gap in India means real, structural long-term demand",
        "Deeply meaningful work with direct, visible impact on people's lives",
        "Government positions (though few) offer strong pay (~₹80-95K/month in-hand) and job security",
        "Clear specialization paths (child psychology, trauma, neuropsychology, forensic) as a career matures"
    ],
    "cons": [
        "Private-hospital fresher pay (₹15-25K/month) is genuinely exploitative relative to the 7-year training required",
        "MPhil seats at reputable RCI-recognized institutes are brutally competitive (roughly 100:1)",
        "Government clinical psychologist positions are very few nationally (an estimated 200-300 total posts)",
        "Building a sustainable private practice typically takes 3-7 years of lower income while establishing reputation and referrals",
        "Important regulatory transition underway: RCI is discontinuing the MPhil Clinical Psychology route, with the 2025-26 academic year likely the final MPhil intake, transitioning to a new RCI-recognized 2-year MA in Clinical Psychology — anyone planning this path should verify the current RCI-approved route before committing, since this is actively changing"
    ],
    "thriveTraits": [
        "Deep emotional resilience and strong personal boundaries",
        "Genuine patience with slow therapeutic progress",
        "Comfortable holding difficult, heavy material without personal burnout",
        "Willingness to endure several financially lean years while building reputation"
    ],
    "struggleWarning": "If you're expecting the MPhil to translate into strong pay immediately, the private-sector reality (₹15-25K/month for freshers) will be a hard adjustment — this path pays off in reputation and government/senior positions over years, not immediately.",
    "timeline": [
        {
            "title": "Year 1-2 post-qualification",
            "exp": "Junior Clinical Psychologist",
            "desc": "Supervised practice, building assessment and therapy skills, often at low pay in private settings"
        },
        {
            "title": "Year 3-5",
            "exp": "Clinical Psychologist",
            "desc": "Independent caseload, growing specialization and reputation"
        },
        {
            "title": "Year 6-10",
            "exp": "Senior Clinical Psychologist / Government position",
            "desc": "Government hospital appointment (if available) or established private practice"
        },
        {
            "title": "Year 10+",
            "exp": "Consultant / Practice Owner / Academic",
            "desc": "Full private practice, supervisory roles, or academic/research leadership"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Canada",
            "Australia"
        ],
        "industries": [
            "Hospitals",
            "Private practice",
            "NGOs/international health organizations (WHO, UNICEF)",
            "Academic/research institutions"
        ],
        "employers": [
            "NIMHANS",
            "AIIMS",
            "state mental health hospitals",
            "WHO",
            "UNICEF",
            "leading private hospitals"
        ],
        "growthRegions": "India's private mental-health-tech sector (teletherapy platforms) is a fast-growing employer alongside traditional hospital roles",
        "remoteWork": "Growing — teletherapy is an active and expanding delivery model post-2020"
    },
    "skills": {
        "technical": [
            {
                "name": "Psychological assessment & psychometric testing",
                "level": 85
            },
            {
                "name": "Evidence-based therapy modalities (CBT, etc.)",
                "level": 85
            },
            {
                "name": "Diagnostic formulation (DSM/ICD)",
                "level": 80
            },
            {
                "name": "Case documentation & risk assessment",
                "level": 75
            }
        ],
        "soft": [
            {
                "name": "Deep empathy with professional boundaries",
                "level": 90
            },
            {
                "name": "Emotional resilience/self-regulation",
                "level": 90
            },
            {
                "name": "Crisis management composure",
                "level": 80
            }
        ],
        "emerging": [
            {
                "name": "Teletherapy platform delivery",
                "level": 55
            },
            {
                "name": "AI-assisted intake/screening tools (as an aid, not diagnosis)",
                "level": 40
            }
        ]
    },
    "education": {
        "degrees": [
            "BA/BSc Psychology (3-4 years, increasingly a 4-year NEP-aligned honours degree)"
        ],
        "masters": [
            "MA/MSc Psychology, followed by the RCI-recognized clinical qualification"
        ],
        "alternative": [
            "As of the 2025-26 transition, check current RCI guidance directly — the traditional MPhil Clinical Psychology route is being phased out in favor of a new RCI-recognized 2-year MA in Clinical Psychology"
        ],
        "certifications": [
            "RCI (Rehabilitation Council of India) registration — legally mandatory to practice as a 'Clinical Psychologist' or perform clinical diagnosis/therapy in India"
        ],
        "bridgePrograms": [
            "Add-on certifications in CBT, REBT, trauma-informed therapy, or art therapy to build specialization and credibility"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Severe mismatch between training length/cost and private-sector entry pay",
            "Extremely limited MPhil/RCI-recognized program seats relative to applicant volume",
            "Active regulatory transition creates genuine uncertainty for students planning their path right now — verify current RCI rules before committing to an institute"
        ],
        "competition": "Very high for MPhil/RCI-recognized program admission; moderate for jobs once qualified, though government positions specifically are scarce",
        "stressLevel": "High — carrying the emotional weight of serious mental illness cases is a core, unavoidable part of the job",
        "learningCurve": "Steep and multi-year — clinical judgment for complex, comorbid presentations takes years of supervised practice to build",
        "typicalSetbacks": [
            "Failing to secure a seat in a reputable RCI-recognized program on the first attempt given the fierce competition",
            "Financially lean early years in private practice or low-paying private hospital roles before reputation builds",
            "Vicarious trauma/burnout from sustained exposure to patients' distress without adequate personal support systems"
        ]
    }
},
  "counseling_psychology": {
    "futureDemand": "High",
    "futureDemandSubtitle": "Rising mental health awareness (a reported 40% increase in psychologist-related searches 2023-24) and growth in school counseling mandates, corporate Employee Assistance Programs (EAPs), and tele-counseling platforms are all expanding demand.",
    "salaryRange": "India: ₹3-6L entry (₹18-30K/month), ₹6-15L mid (5-10 yrs), ₹15-18L+ senior/established private practice. Abroad (US): master's-level licensed counselors typically $48,820-$70,000; specialized/private practice higher.",
    "yearsToEnter": "5 years (BA/BSc Psychology + MA in Counselling Psychology)",
    "aiRisk": "Low",
    "aiSafetyLevel": "Supportive relationship-based work, low automation exposure",
    "aiSafetySubtitle": "AI wellness chatbots increasingly handle low-acuity self-help, but ongoing counseling relationships for relationship, career, and adjustment issues rely on the human rapport and context that a counselor builds over sessions.",
    "scholarshipAvailability": "Low",
    "scholarshipsSubtitle": "Few dedicated scholarships; most MA Counselling Psychology programs are self-funded, though public universities keep costs moderate",
    "financingOutlook": "Reasonable — moderate degree cost, no mandatory licensing bottleneck (unlike clinical psychology), and a growing range of employment settings (schools, corporates, NGOs, private practice) to build income from",
    "dailyResponsibilities": [
        "Conduct one-on-one or group counseling sessions on everyday emotional, relational, or career concerns",
        "Develop and update client action/coping plans",
        "Maintain confidential session notes",
        "Coordinate with schools, HR, or referring physicians as relevant to the setting"
    ],
    "weeklyResponsibilities": [
        "Peer supervision or case consultation",
        "Continuing education workshops (CBT, NLP, trauma-informed approaches)",
        "Outreach or awareness sessions (in school/corporate settings)",
        "Client acquisition/marketing activities (in private practice)"
    ],
    "majorDecisions": [
        "Whether a client's presentation is within counseling scope or needs referral to a clinical psychologist/psychiatrist",
        "Which counseling approach or framework best fits a specific client's needs",
        "How to structure a sustainable caseload while maintaining quality of care"
    ],
    "workEnvironment": "Schools, corporate wellness/EAP programs, NGOs, private practice, or telehealth platforms; generally less clinically acute than a hospital psychiatric setting.",
    "whoTheyWorkWith": "Clients directly, and depending on setting: school administrators/teachers, HR teams, or referring physicians.",
    "successCriteria": "Judged on client-reported wellbeing improvement, session retention, and (in institutional settings) satisfaction feedback from the school/company.",
    "dayInTheLife": "A school counselor's day typically mixes scheduled student sessions with informal drop-ins, teacher consultations about a specific student, and administrative work like maintaining case files. A private-practice or corporate-EAP counselor runs a more session-based day, with back-to-back client appointments and less institutional administrative overhead.",
    "pros": [
        "No RCI licensing bottleneck (unlike clinical psychology), making entry more accessible",
        "Wide range of employment settings to choose from (schools, corporate, NGO, private practice)",
        "Genuinely growing demand as mental health destigmatizes across India",
        "Meaningful day-to-day work supporting people through everyday life challenges"
    ],
    "cons": [
        "Entry pay is modest (₹18-30K/month) and the field is broad enough that quality/training standards vary widely",
        "Lack of mandatory licensing (a pro for entry) also means the market is crowded with under-qualified 'counselors,' which can suppress pricing",
        "Career ceiling without further specialization or moving into private practice is limited",
        "Emotionally demanding work requiring strong personal boundaries to avoid burnout"
    ],
    "thriveTraits": [
        "Warm, approachable, and genuinely curious about people's everyday struggles",
        "Comfortable holding space for emotional conversations without becoming overwhelmed",
        "Practical, solutions-oriented mindset alongside empathy",
        "Self-driven if pursuing private practice or niche specialization"
    ],
    "struggleWarning": "If you're seeking this path purely as a stepping stone to higher pay quickly, the lack of a licensing bottleneck (which helps you enter) also means the field is crowded, and building real income usually requires a few years of reputation-building or niche specialization.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "Junior Counselor",
            "desc": "Supervised or entry-level practice in a school, NGO, or clinic setting"
        },
        {
            "title": "Year 3-6",
            "exp": "Counselor / Specializing",
            "desc": "Independent caseload, often specializing (career, relationship, school, corporate wellness)"
        },
        {
            "title": "Year 7-12",
            "exp": "Senior Counselor / Program Lead",
            "desc": "Leading a school counseling department or corporate EAP program, or a growing private practice"
        },
        {
            "title": "Year 12+",
            "exp": "Practice Owner / Clinical Director",
            "desc": "Established private practice or leadership of a counseling/wellness organization"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Canada",
            "Australia"
        ],
        "industries": [
            "Schools/universities",
            "Corporate wellness/EAPs",
            "NGOs",
            "Tele-counseling platforms",
            "Private practice"
        ],
        "employers": [
            "International schools",
            "corporate EAP providers",
            "mental health NGOs",
            "teletherapy startups"
        ],
        "growthRegions": "Metro Indian cities for corporate/school roles; US requires state licensure (LPC/LMHC) for independent practice",
        "remoteWork": "High — tele-counseling is one of the most remote-friendly branches of the mental health field"
    },
    "skills": {
        "technical": [
            {
                "name": "Counseling frameworks (person-centered, CBT basics, solution-focused)",
                "level": 80
            },
            {
                "name": "Psychometric/career assessment tools",
                "level": 60
            },
            {
                "name": "Case documentation",
                "level": 65
            }
        ],
        "soft": [
            {
                "name": "Active listening & rapport-building",
                "level": 90
            },
            {
                "name": "Emotional regulation & personal boundaries",
                "level": 85
            },
            {
                "name": "Practical problem-solving alongside empathy",
                "level": 75
            }
        ],
        "emerging": [
            {
                "name": "Tele-counseling platform delivery",
                "level": 65
            },
            {
                "name": "Digital/app-based wellness program design",
                "level": 45
            }
        ]
    },
    "education": {
        "degrees": [
            "BA/BSc Psychology"
        ],
        "masters": [
            "MA in Counselling Psychology (Christ University Bangalore, TISS, and many other university programs)"
        ],
        "alternative": [
            "Diploma in Counselling for career-changers from adjacent fields (social work, education, HR)"
        ],
        "certifications": [
            "No single mandatory license in India (unlike clinical psychology's RCI requirement)",
            "LPC/LMHC (US) requires state licensure for independent practice abroad"
        ],
        "bridgePrograms": [
            "Certifications in CBT, NLP, trauma-informed care, and specific niches (career counseling, relationship counseling) to differentiate and command higher fees"
        ]
    },
    "realityCheck": {
        "challenges": [
            "No licensing requirement means inconsistent quality/training standards across the field, which can undercut credentialed counselors on price",
            "Entry pay is modest relative to the emotional demands of the work",
            "Building a sustainable private practice takes real time and marketing effort"
        ],
        "competition": "Moderate — accessible entry point means many enter, but well-trained, specialized counselors with strong reputations remain in real demand",
        "stressLevel": "Moderate — generally less acute than clinical psychology's crisis-heavy caseload, but sustained emotional labor is still real",
        "learningCurve": "Moderate — core counseling skills are teachable within the MA program; genuine skill in handling nuanced client situations builds over the first few years",
        "typicalSetbacks": [
            "Struggling to differentiate from under-qualified 'counselors' in a crowded, unregulated market",
            "Slow client-base growth in the early years of private practice"
        ]
    }
},
  "industrial_organizational_psychology": {
    "futureDemand": "High",
    "futureDemandSubtitle": "As Indian companies increasingly formalize HR analytics, employee wellbeing, and organizational development functions, demand for psychology-trained professionals who can pair behavioral science with data is rising, especially in corporate/consulting settings.",
    "salaryRange": "India: ₹4-7L entry, ₹7-14L mid, ₹15-24L senior (specialized/consulting can exceed this). Abroad (US): PayScale average $110,313, entry ~$75,000, BLS top 10% $224,590+.",
    "yearsToEnter": "5-6 years (BA/BSc Psychology + MA/MSc in I-O/Organizational Psychology or an MBA with an HR/OD specialization)",
    "aiRisk": "Medium-High",
    "aiSafetyLevel": "HR analytics increasingly AI-augmented at junior levels",
    "aiSafetySubtitle": "AI-driven HR analytics platforms are automating a lot of routine survey analysis and turnover prediction that used to be entry-level I-O work, which may compress junior roles — the durable value shifts toward designing interventions and advising leadership on what the data means.",
    "scholarshipAvailability": "Low",
    "scholarshipsSubtitle": "Few dedicated scholarships; most programs are self-funded, though corporate-sponsored MBA/OD programs exist for working professionals",
    "financingOutlook": "Solid — degree cost is moderate and corporate/consulting employers pay a real premium for people who can combine psychology with data fluency",
    "dailyResponsibilities": [
        "Analyze employee survey, performance, or attrition data to identify organizational patterns",
        "Design or refine selection/assessment tools (interviews, psychometric tests) for hiring",
        "Advise HR/leadership on organizational development interventions",
        "Present findings and recommendations to non-technical business stakeholders"
    ],
    "weeklyResponsibilities": [
        "Stakeholder meetings with HR business partners or leadership on ongoing initiatives",
        "Data analysis using statistical/analytics tools (SPSS, R, Python, or HR analytics platforms)",
        "Literature review on best practices in organizational psychology and people analytics",
        "Training or workshop delivery on topics like leadership development or team dynamics"
    ],
    "majorDecisions": [
        "Which data signals genuinely indicate an organizational problem vs. statistical noise",
        "How to design a fair, valid, and legally sound selection/assessment process",
        "How to frame sensitive findings (e.g. management issues) for leadership in a constructive way"
    ],
    "workEnvironment": "Corporate HR/People Analytics teams, management consulting firms, or specialized OD/talent consultancies; largely desk-based, collaborative, and stakeholder-facing.",
    "whoTheyWorkWith": "HR business partners, senior leadership, data/analytics teams, and (in consulting) client organizations across industries.",
    "successCriteria": "Judged on the measurable business impact of interventions (reduced attrition, improved engagement scores, better hiring quality) and the clarity/credibility of recommendations to leadership.",
    "dayInTheLife": "A typical day mixes data analysis (survey results, turnover trends, assessment validity studies) with meetings translating that data into recommendations for HR or business leaders, and periodic project work designing a new selection process or organizational intervention. Consulting-track roles add client-facing presentation and proposal work to this mix.",
    "pros": [
        "Genuinely strong pay ceiling, especially abroad, compared to most psychology sub-fields",
        "Combines psychology with data analysis — a differentiated, hybrid skill set that's hard to commoditize",
        "Broad industry applicability (any company with an HR function is a potential employer)",
        "Clear consulting/corporate career ladder with visible progression"
    ],
    "cons": [
        "Entry-level analytics work is increasingly automatable, compressing the bottom rung of the career ladder",
        "Requires genuine data/statistics fluency alongside psychology — a steeper combined skill bar than pure counseling or clinical tracks",
        "Indian corporate awareness of the field is still maturing, so roles can get folded into generic 'HR Analyst' titles that undervalue the specialized training",
        "Success depends heavily on organizational buy-in — even good recommendations can be ignored by leadership"
    ],
    "thriveTraits": [
        "Genuinely comfortable with both psychology theory and quantitative data analysis",
        "Strong business communication — translating data into decisions leadership will act on",
        "Diplomatic in delivering sensitive organizational findings",
        "Curious about systems-level (not just individual) behavior"
    ],
    "struggleWarning": "If you enjoy the people-facing counseling side of psychology more than data analysis and corporate stakeholder management, this field's business/analytics-heavy reality will feel like a mismatch despite the 'psychology' label.",
    "timeline": [
        {
            "title": "Year 1-2",
            "exp": "People Analytics Analyst / HR Research Associate",
            "desc": "Supporting data analysis and reporting under senior guidance"
        },
        {
            "title": "Year 3-6",
            "exp": "I-O Psychologist / People Analytics Specialist",
            "desc": "Owning specific initiatives (selection tools, engagement surveys, OD interventions)"
        },
        {
            "title": "Year 7-12",
            "exp": "Senior I-O Psychologist / People Analytics Lead",
            "desc": "Leading a function or consulting practice, advising senior leadership directly"
        },
        {
            "title": "Year 12+",
            "exp": "Head of People Analytics / OD Consulting Partner",
            "desc": "Setting organizational strategy at a company or consulting-firm partner level"
        }
    ],
    "globalOpportunities": {
        "countries": [
            "USA",
            "UK",
            "Singapore",
            "Germany"
        ],
        "industries": [
            "Corporate HR/People Analytics",
            "Management consulting",
            "Talent assessment firms",
            "Tech companies (large-scale people data)"
        ],
        "employers": [
            "Big consulting firms (Deloitte, McKinsey-style HR practices)",
            "large tech companies with dedicated people analytics teams",
            "TCS/Infosys-scale Indian IT firms"
        ],
        "growthRegions": "US tech/consulting hubs pay the highest premiums; India's growth is concentrated in large corporate HQs and consulting firms in Bangalore, Mumbai, and Delhi-NCR",
        "remoteWork": "Moderate-High — much of the analytical work is remote-friendly, though stakeholder-facing consulting work often requires travel"
    },
    "skills": {
        "technical": [
            {
                "name": "Statistical analysis (SPSS/R/Python)",
                "level": 80
            },
            {
                "name": "Psychometric test design & validation",
                "level": 75
            },
            {
                "name": "Survey design & analysis",
                "level": 75
            },
            {
                "name": "HR analytics platforms",
                "level": 60
            }
        ],
        "soft": [
            {
                "name": "Business storytelling with data",
                "level": 85
            },
            {
                "name": "Stakeholder diplomacy",
                "level": 80
            },
            {
                "name": "Systems-level thinking",
                "level": 75
            }
        ],
        "emerging": [
            {
                "name": "AI-driven attrition/engagement prediction models",
                "level": 60
            },
            {
                "name": "Generative AI for survey/qualitative data synthesis",
                "level": 50
            }
        ]
    },
    "education": {
        "degrees": [
            "BA/BSc Psychology"
        ],
        "masters": [
            "MA/MSc in Industrial-Organizational Psychology or Organizational Psychology",
            "MBA with HR/Organizational Development specialization as an alternative route"
        ],
        "alternative": [
            "Certificate programs in HR Analytics/People Analytics for psychology grads wanting the data-fluency edge without a full MBA"
        ],
        "certifications": [
            "No single mandatory license; SHRM-CP/SHRM-SCP (HR-focused) or specific psychometric test certifications add credibility"
        ],
        "bridgePrograms": [
            "HR Analytics bootcamps/certifications (often via Coursera, LinkedIn Learning, or university extension programs) to build the data-science half of the skill set"
        ]
    },
    "realityCheck": {
        "challenges": [
            "Entry-level roles increasingly get automated or absorbed into generic HR analyst positions",
            "Requires maintaining a genuinely hybrid skill set (psychology + statistics + business) that's easy to be mediocre at and hard to be excellent at",
            "Organizational buy-in for recommendations isn't guaranteed even with strong data"
        ],
        "competition": "Moderate — role clarity is still maturing in India, so the field rewards those who can clearly demonstrate the hybrid skill set over generic HR generalists",
        "stressLevel": "Moderate — deadline and stakeholder-driven rather than crisis-driven",
        "learningCurve": "Steep for the combined psychology + statistics + business communication skill set; most graduate programs cover only part of this well",
        "typicalSetbacks": [
            "Getting pigeonholed into generic HR/People Ops work without genuine analytics ownership",
            "Recommendations getting deprioritized or ignored despite solid data backing them"
        ]
    }
}
};

// Main Helper function to fetch 100% Unique Career Intelligence for any career path
export function getCareerIntelligence(fieldName: string): CareerIntelligence {
  const normalized = fieldName.toLowerCase().trim();
  
  const lookupManifest = [
    {
        "key": "bioinformatics_computational_biology",
        "aliases": [
            "bioinformatics",
            "computational biology",
            "genomics analyst",
            "computational biologist",
            "biostatistics"
        ]
    },
    {
        "key": "biotechnology_biomanufacturing",
        "aliases": [
            "biotechnology",
            "biotech",
            "biomanufacturing",
            "bioprocess",
            "biotechnologist"
        ]
    },
    {
        "key": "genetic_counseling",
        "aliases": [
            "genetic counseling",
            "genetic counsellor",
            "genomic counseling",
            "clinical genetics"
        ]
    },
    {
        "key": "clinical_research_regulatory_affairs",
        "aliases": [
            "clinical research",
            "clinical research associate",
            "cra",
            "regulatory affairs",
            "clinical trials"
        ]
    },
    {
        "key": "public_health_epidemiology",
        "aliases": [
            "public health",
            "epidemiology",
            "epidemiologist",
            "mph",
            "population health"
        ]
    },
    {
        "key": "medical_laboratory_sciences_diagnostics",
        "aliases": [
            "medical laboratory technology",
            "mlt",
            "clinical lab science",
            "lab technologist",
            "diagnostics"
        ]
    },
    {
        "key": "clinical_nutrition_dietetics",
        "aliases": [
            "nutrition",
            "dietetics",
            "dietitian",
            "clinical nutritionist",
            "rd"
        ]
    },
    {
        "key": "physiotherapy_rehabilitation",
        "aliases": [
            "physiotherapy",
            "physical therapy",
            "rehabilitation",
            "physiotherapist",
            "bpt",
            "mpt"
        ]
    },
    {
        "key": "hospital_healthcare_management",
        "aliases": [
            "hospital administration",
            "healthcare management",
            "hospital management",
            "mha",
            "health administrator"
        ]
    },
    {
        "key": "clinical_psychology",
        "aliases": [
            "clinical psychology",
            "clinical psychologist",
            "mphil clinical psychology",
            "rci psychologist"
        ]
    },
    {
        "key": "counseling_psychology",
        "aliases": [
            "counseling psychology",
            "counselling psychology",
            "counselor",
            "counsellor",
            "school counselor",
            "career counselor"
        ]
    },
    {
        "key": "industrial_organizational_psychology",
        "aliases": [
            "industrial organizational psychology",
            "i-o psychology",
            "io psychology",
            "people analytics",
            "organizational psychology",
            "occupational psychology"
        ]
    }
];
  
  // Exact match first
  for (const item of lookupManifest) {
    if (item.aliases.includes(normalized)) {
      return CAREER_INTEL_DB[item.key];
    }
  }

  // Fallback fuzzy search
  for (const item of lookupManifest) {
    if (item.aliases.some(alias => normalized.includes(alias))) {
      return CAREER_INTEL_DB[item.key];
    }
  }

  // Old Fallback Logic
  if (normalized.includes("product management") || normalized.includes("product manager")) {
    return CAREER_INTEL_DB["healthtech product management"];
  }
  if (normalized.includes("clinical data")) {
    return CAREER_INTEL_DB["clinical data management"];
  }
  if (normalized.includes("entrepreneurship") || normalized.includes("incubation") || normalized.includes("startup")) {
    return CAREER_INTEL_DB["biotech entrepreneurship & incubation"];
  }
  if (normalized.includes("strategy consulting") || normalized.includes("strategy consultant")) {
    return CAREER_INTEL_DB["healthcare strategy consulting"];
  }
  if (normalized.includes("hospital administration") || normalized.includes("operations mba") || normalized.includes("hospital admin")) {
    return CAREER_INTEL_DB["hospital administration & operations mba"];
  }
  if (normalized.includes("venture capital") || normalized.includes("investment")) {
    return CAREER_INTEL_DB["pharma venture capital & investment"];
  }
  if (normalized.includes("scientific liaison") || normalized.includes("medical affairs") || normalized.includes(" liaison")) {
    return CAREER_INTEL_DB["medical affairs & scientific liaison"];
  }
  if (normalized.includes("regulatory affairs") || normalized.includes("regulatory") || normalized.includes("compliance")) {
    return CAREER_INTEL_DB["regulatory affairs"];
  }
  if (normalized.includes("healthcare consulting") || normalized === "consulting") {
    return CAREER_INTEL_DB["healthcare consulting"];
  }

  // Fallback / missing item safeguard: "Currently gathering verified information."
  // Prevents fabrication of statistics or reusing other career's information.
  return {
    futureDemand: "Steady",
    futureDemandSubtitle: "Currently gathering verified information.",
    salaryRange: "Currently gathering verified information.",
    yearsToEnter: "Currently gathering verified information.",
    aiRisk: "Low",
    aiSafetyLevel: "Currently gathering verified information.",
    aiSafetySubtitle: "Currently gathering verified information.",
    scholarshipAvailability: "Moderate",
    scholarshipsSubtitle: "Currently gathering verified information.",
    financingOutlook: "Currently gathering verified information.",
    dailyResponsibilities: ["Currently gathering verified information."],
    weeklyResponsibilities: ["Currently gathering verified information."],
    majorDecisions: ["Currently gathering verified information."],
    workEnvironment: "Currently gathering verified information.",
    whoTheyWorkWith: "Currently gathering verified information.",
    successCriteria: "Currently gathering verified information.",
    dayInTheLife: "Currently gathering verified information.",
    pros: ["Currently gathering verified information."],
    cons: ["Currently gathering verified information."],
    thriveTraits: ["Currently gathering verified information."],
    struggleWarning: "Currently gathering verified information.",
    timeline: [
      { title: "Currently gathering verified information.", exp: "Currently gathering verified information.", desc: "Currently gathering verified information." }
    ],
    globalOpportunities: {
      countries: ["Currently gathering verified information."],
      industries: ["Currently gathering verified information."],
      employers: ["Currently gathering verified information."],
      growthRegions: "Currently gathering verified information.",
      remoteWork: "Currently gathering verified information."
    },
    skills: {
      technical: [{ name: "Currently gathering verified information.", level: 100 }],
      soft: [{ name: "Currently gathering verified information.", level: 100 }],
      emerging: [{ name: "Currently gathering verified information.", level: 100 }]
    },
    education: {
      degrees: ["Currently gathering verified information."],
      masters: ["Currently gathering verified information."],
      alternative: ["Currently gathering verified information."],
      certifications: ["Currently gathering verified information."],
      bridgePrograms: ["Currently gathering verified information."]
    },
    realityCheck: {
      challenges: ["Currently gathering verified information."],
      competition: "Currently gathering verified information.",
      stressLevel: "Currently gathering verified information.",
      learningCurve: "Currently gathering verified information.",
      typicalSetbacks: ["Currently gathering verified information."]
    }
  };
}

// Fit Explanation generator
export function getPersonalizedExplanation(fieldName: string, presetId: string): string[] {
  const normField = fieldName.toLowerCase().trim();
  const isAnanya = presetId === "preset_ananya" || presetId.toLowerCase().includes("ananya");
  
  if (isAnanya) {
    if (normField.includes("bioinformatics") || normField.includes("computational biology")) {
      return [
        "Interests & Strengths: Your algorithmic curiosity and logical competence align with building genomic pipelines.",
        "Goals: Secures a high-ROI transition into Bangalore hubs within 12 months.",
        "Personality: Your conscientiousness ensures strict accuracy in complex data environments."
      ];
    }
    if (normField.includes("product management") || normField.includes("product manager")) {
      return [
        "Interests & Strengths: Your interdisciplinary curiosity and planning abilities bridge biology with user journeys.",
        "Goals: Accelerates entry into IT hubs, meeting your high-ROI salary expectations.",
        "Personality: Your adaptability allows you to thrive across engineering and medical stakeholders."
      ];
    }
    if (normField.includes("clinical data")) {
      return [
        "Interests & Strengths: Your interest in structured outcomes and systematic detail guarantees compliance.",
        "Goals: Enables an immediate, low-cost transition utilizing your existing biotech pedigree.",
        "Personality: Your methodical approach provides the precision required for stringent regulations."
      ];
    }
    if (normField.includes("entrepreneurship") || normField.includes("incubation") || normField.includes("startup")) {
      return [
        "Interests & Strengths: Your drive for innovation and analytical background are valued in venture due diligence.",
        "Goals: Fulfills your ambition to manage biotech grants and achieve independence.",
        "Personality: Your high-hustle motivation is essential for navigating bio-incubator uncertainty."
      ];
    }
    // Consulting / Healthcare Consulting
    return [
      "Interests & Strengths: Your interest in macro-strategy and sharp reasoning dismantle market-entry bottlenecks.",
      "Goals: Directly targets healthcare strategy desks, fulfilling your rapid-ascent compensation goal.",
      "Personality: Your collaborative drive makes you an excellent fit for high-stakes consulting."
    ];
  } else {
    // Dr. Rahul Deshmukh
    if (normField.includes("strategy consulting") || normField.includes("strategy consultant")) {
      return [
        "Interests & Strengths: Your desire for healthcare impact and BDS degree provide immediate strategic credibility.",
        "Goals: Perfect match for your high GMAT budget, enabling direct global placement.",
        "Personality: Your high social battery is ideal for fast-paced corporate sprint cycles."
      ];
    }
    if (normField.includes("hospital administration") || normField.includes("operations mba") || normField.includes("hospital admin")) {
      return [
        "Interests & Strengths: Your clinical management experience is invaluable for leading large-scale medical wings.",
        "Goals: Provides a structured, local transition in Mumbai/Pune within 12-18 months.",
        "Personality: Your emotional stability is crucial for managing high-pressure clinical operations."
      ];
    }
    if (normField.includes("venture capital") || normField.includes("investment")) {
      return [
        "Interests & Strengths: Your clinical background enables precise due diligence of medical patents.",
        "Goals: Maximizes financial leverage, targeting elite VC funds in the Mumbai banking capital.",
        "Personality: Your strategic risk-tolerance is suited for evaluating high-stakes investments."
      ];
    }
    if (normField.includes("scientific liaison") || normField.includes("medical affairs") || normField.includes(" liaison")) {
      return [
        "Interests & Strengths: Your medical passion and clinical depth establish instant trust with key opinion leaders.",
        "Goals: Requires minimal transition cost and ensures direct placement in pharmaceutical headquarters.",
        "Personality: Leverages your extraversion and empathy to build lasting stakeholder relationships."
      ];
    }
    // Regulatory / Compliance
    return [
      "Interests & Strengths: Your BDS background provides anatomical context for rigorous compliance audits.",
      "Goals: Provides a secure, non-burnout corporate anchor in the pharmaceutical export sector.",
      "Personality: Fits your conscientiousness, offering a stable lifestyle with no clinical pressure."
    ];
  }
}
