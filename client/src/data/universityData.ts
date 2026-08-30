export interface University {
  id: string;
  name: string;
  country: string;
  /**
   * FALLBACK ONLY. The card's photograph is resolved at runtime from the
   * university's own Wikipedia article — see `lib/universityImages.ts` and the
   * `wikipedia` field below. This is what renders on the first frame, and what
   * stays on screen if that request fails.
   *
   * These URLs are generic stock campus photography and always were. Do not add
   * more of them, and do not treat one as a picture of the school it sits next
   * to: the whole reason for the Wikipedia lookup is that this field cannot be
   * made accurate by hand at any realistic catalogue size.
   */
  heroImage: string;
  /**
   * Exact English Wikipedia article title. This is the key the real imagery is
   * fetched against, so it has to be the canonical title rather than a redirect
   * or a search phrase — `Massachusetts_Institute_of_Technology`, not `MIT`.
   * Underscores or spaces are both fine; the fetcher normalises.
   */
  wikipedia: string;
  /** Short initialism, used as the crest mark until the real one loads. */
  logo: string;
  qsRanking: number;
  programmes: UniversityProgramme[];
  campusSize: string;
  internationalDiversity: string;
  researchStrength: string;
  industryConnections: string;
}

export interface UniversityProgramme {
  id: string;
  title: string;
  degreeType: 'Bachelors' | 'Masters' | 'PhD' | 'Diploma';
  tuitionFee: number;
  livingCost: number;
  currency: string;
  scholarshipsAvailable: boolean;
  scholarshipDetails: string[];
  admissionDifficulty: 'Low' | 'Moderate' | 'Competitive' | 'Very High' | 'Extremely High';
  graduateEmployability: number; // 0-100%
  intakes: string[];
  durationMonths: number;
  admissionRequirements: string[];
  careerOutcomes: string[];
  relatedCareers: string[]; // for matching
}

export interface UniversityMatch {
  university: University;
  programme: UniversityProgramme;
  matchScore: number;
  personalizedExplanation: string;
}

export const UNIVERSITIES_DB: University[] = [
  {
    id: "uni_mit",
    name: "Massachusetts Institute of Technology (MIT)",
    country: "United States",
    heroImage: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "Massachusetts Institute of Technology",
    logo: "MIT",
    qsRanking: 1,
    campusSize: "Large, Urban",
    internationalDiversity: "34% International",
    researchStrength: "World-leading in engineering and physical sciences",
    industryConnections: "Unmatched connections with tech giants and startups",
    programmes: [
      {
        id: "prog_mit_robotics",
        title: "MSc in Robotics & AI",
        degreeType: "Masters",
        tuitionFee: 65000,
        livingCost: 28000,
        currency: "USD",
        scholarshipsAvailable: true,
        scholarshipDetails: ["MIT Graduate Fellowship", "Research Assistantships"],
        admissionDifficulty: "Extremely High",
        graduateEmployability: 99,
        intakes: ["Fall"],
        durationMonths: 24,
        admissionRequirements: ["GPA 3.9+", "GRE 330+", "Strong Research Background"],
        careerOutcomes: ["Robotics Engineer", "AI Researcher", "Tech Founder"],
        relatedCareers: ["robotics", "artificial intelligence", "computer science"]
      }
    ]
  },
  {
    id: "uni_stanford",
    name: "Stanford University",
    country: "United States",
    heroImage: "https://images.unsplash.com/photo-1622397333309-3056849bc70b?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "Stanford University",
    logo: "SU",
    qsRanking: 2,
    campusSize: "Vast, Suburban",
    internationalDiversity: "24% International",
    researchStrength: "Pioneering in tech, AI, and business",
    industryConnections: "Direct pipeline to Silicon Valley",
    programmes: [
      {
        id: "prog_stan_cs",
        title: "MSc in Computer Science",
        degreeType: "Masters",
        tuitionFee: 62000,
        livingCost: 32000,
        currency: "USD",
        scholarshipsAvailable: true,
        scholarshipDetails: ["Knight-Hennessy Scholars", "Teaching Assistantships"],
        admissionDifficulty: "Extremely High",
        graduateEmployability: 98,
        intakes: ["Fall"],
        durationMonths: 24,
        admissionRequirements: ["GPA 3.8+", "GRE Optional", "Strong Projects"],
        careerOutcomes: ["Software Engineer", "Product Manager", "Startup Founder"],
        relatedCareers: ["software engineering", "computer science", "technology"]
      }
    ]
  },
  {
    id: "uni_cambridge",
    name: "University of Cambridge",
    country: "United Kingdom",
    heroImage: "https://images.unsplash.com/photo-1582650893046-24e52f5898d9?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "University of Cambridge",
    logo: "CAM",
    qsRanking: 2,
    campusSize: "Historic, Collegiate",
    internationalDiversity: "40% International",
    researchStrength: "Exceptional fundamental science and humanities",
    industryConnections: "Silicon Fen ecosystem",
    programmes: [
      {
        id: "prog_camb_math",
        title: "Master of Advanced Study in Mathematics",
        degreeType: "Masters",
        tuitionFee: 35000,
        livingCost: 18000,
        currency: "GBP",
        scholarshipsAvailable: true,
        scholarshipDetails: ["Gates Cambridge", "Cambridge Trust"],
        admissionDifficulty: "Extremely High",
        graduateEmployability: 96,
        intakes: ["Fall"],
        durationMonths: 12,
        admissionRequirements: ["First Class Honours", "Exceptional Math Ability"],
        careerOutcomes: ["Quantitative Analyst", "Research Mathematician"],
        relatedCareers: ["mathematics", "quantitative finance", "research"]
      },
      {
        id: "prog_camb_biotech",
        title: "MPhil in Biotechnology",
        degreeType: "Masters",
        tuitionFee: 42000,
        livingCost: 18000,
        currency: "GBP",
        scholarshipsAvailable: true,
        scholarshipDetails: ["Gates Cambridge"],
        admissionDifficulty: "Very High",
        graduateEmployability: 95,
        intakes: ["Fall"],
        durationMonths: 12,
        admissionRequirements: ["First Class Honours in Bio/Chem", "Research Proposal"],
        careerOutcomes: ["Biotech Entrepreneur", "Research Scientist", "Consultant"],
        relatedCareers: ["biotechnology", "bioinformatics", "life sciences"]
      }
    ]
  },
  {
    id: "uni_eth",
    name: "ETH Zurich",
    country: "Switzerland",
    heroImage: "https://images.unsplash.com/photo-1542470719-74d115e5d3fa?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "ETH Zurich",
    logo: "ETH",
    qsRanking: 8,
    campusSize: "Urban & Suburban split",
    internationalDiversity: "38% International",
    researchStrength: "European leader in engineering and natural sciences",
    industryConnections: "Strong ties with Swiss pharma and European tech",
    programmes: [
      {
        id: "prog_eth_mech",
        title: "MSc in Mechanical Engineering",
        degreeType: "Masters",
        tuitionFee: 1500,
        livingCost: 24000,
        currency: "CHF",
        scholarshipsAvailable: true,
        scholarshipDetails: ["Excellence Scholarship & Opportunity Programme"],
        admissionDifficulty: "Very High",
        graduateEmployability: 97,
        intakes: ["Fall", "Spring"],
        durationMonths: 24,
        admissionRequirements: ["Excellent Bachelor degree", "GRE (for non-Bologna)"],
        careerOutcomes: ["Mechanical Engineer", "Project Lead", "R&D Specialist"],
        relatedCareers: ["mechanical engineering", "robotics", "automotive"]
      }
    ]
  },
  {
    id: "uni_nus",
    name: "National University of Singapore (NUS)",
    country: "Singapore",
    heroImage: "https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "National University of Singapore",
    logo: "NUS",
    qsRanking: 8,
    campusSize: "Large, Tropical Urban",
    internationalDiversity: "30% International",
    researchStrength: "Asian leader in tech, business and medicine",
    industryConnections: "Gateway to Asian markets and global finance",
    programmes: [
      {
        id: "prog_nus_biz",
        title: "Master of Science in Management",
        degreeType: "Masters",
        tuitionFee: 45000,
        livingCost: 22000,
        currency: "SGD",
        scholarshipsAvailable: true,
        scholarshipDetails: ["ASEAN Undergraduate Scholarship", "NUS Masters Grant"],
        admissionDifficulty: "Competitive",
        graduateEmployability: 94,
        intakes: ["Fall"],
        durationMonths: 12,
        admissionRequirements: ["Good Bachelor degree", "GMAT/GRE Optional but preferred"],
        careerOutcomes: ["Management Consultant", "Business Analyst", "Strategy Manager"],
        relatedCareers: ["consulting", "business management", "strategy"]
      }
    ]
  },
  {
    id: "uni_lbs",
    name: "London Business School (LBS)",
    country: "United Kingdom",
    heroImage: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "London Business School",
    logo: "LBS",
    qsRanking: 12,
    campusSize: "Compact, Urban",
    internationalDiversity: "90% International",
    researchStrength: "Finance, Strategy, and Entrepreneurship",
    industryConnections: "Direct access to London's financial district",
    programmes: [
      {
        id: "prog_lbs_mim",
        title: "Masters in Management (MiM)",
        degreeType: "Masters",
        tuitionFee: 47500,
        livingCost: 25000,
        currency: "GBP",
        scholarshipsAvailable: true,
        scholarshipDetails: ["LBS Dean's Scholarship", "Merit Fellowships"],
        admissionDifficulty: "Extremely High",
        graduateEmployability: 96,
        intakes: ["Fall"],
        durationMonths: 12,
        admissionRequirements: ["GPA 3.5+", "GMAT 700+", "Leadership Experience"],
        careerOutcomes: ["Consultant", "Investment Banker", "Product Manager"],
        relatedCareers: ["consulting", "finance", "business"]
      }
    ]
  },
  {
    id: "uni_tum",
    name: "Technical University of Munich (TUM)",
    country: "Germany",
    heroImage: "https://images.unsplash.com/photo-1599557422176-13a2a6b28189?q=80&w=2000&auto=format&fit=crop",
    wikipedia: "Technical University of Munich",
    logo: "TUM",
    qsRanking: 37,
    campusSize: "Urban & Garching Tech Hub",
    internationalDiversity: "34% International",
    researchStrength: "Engineering, Informatics, Natural Sciences",
    industryConnections: "Strong ties to BMW, Siemens, Allianz",
    programmes: [
      {
        id: "prog_tum_info",
        title: "MSc in Informatics",
        degreeType: "Masters",
        tuitionFee: 0,
        livingCost: 16000,
        currency: "EUR",
        scholarshipsAvailable: false,
        scholarshipDetails: [],
        admissionDifficulty: "Very High",
        graduateEmployability: 98,
        intakes: ["Fall", "Spring"],
        durationMonths: 24,
        admissionRequirements: ["Bachelor in Informatics", "Aptitude Assessment"],
        careerOutcomes: ["Software Engineer", "Data Scientist", "IT Consultant"],
        relatedCareers: ["software engineering", "computer science", "artificial intelligence", "data science"]
      }
    ]
  }
];
