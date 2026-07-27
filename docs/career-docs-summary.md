# Career Docs — Structured Summary

**Source:** Google Doc `1OP2utJYnRqfRhPm5186kwLgXEBsLvB0Xhp9Pz3f-qio`
**Raw text:** `docs/career-docs-raw.txt` (265,925 bytes, 3,967 lines, fetched via `export?format=txt`)
**Contents:** 26 "Integrated Academic & Career Topology" documents, one per undergraduate degree program (Indian higher-education context).

---

## 1. Overall structure of the document

The doc is a **taxonomy / knowledge base**, not an algorithm spec. It contains **no scoring rules, no weights, no questionnaire, no aptitude or personality model, and no explicit prediction logic**. (Verified by full-text search for `predict|score|scoring|signal|weight|algorithm|engine|questionnaire|assessment|quiz|aptitude|interest|personality|rule|mapping|match` — all hits are domain nouns like "Assessment Hubs" or "Validation Engineer", never meta-instructions.)

Each of the 26 documents follows the same shape:

```
<Degree short name>                       <- doc title / key
Integrated Academic & Career Topology: <full degree name> (High-Scope Pathways Only)
Regulatory (& Standards) Framework: <list of statutory bodies>
Academic & Career Pathways:
   1. Higher Education & Specialized PG Pathways
   2. Frontline <Clinical|Industrial|Field|Computational|Core Operational> Job Opportunities
   3. Non-Traditional Industry Domains & Job Roles
   4. Government Opportunities
   5. Civil Services & General Graduate Frameworks   (own section in newer docs;
                                                      nested under Government in older docs)
   6. Global Licensing & Study Abroad Pathways
   7. High-Value Certifications & Skill Accelerators
   8. Entrepreneurial Outlets
   9. Research Domains & Academic Nodes
  10. Emerging Horizon Domains
```

### The canonical 10-section taxonomy (stable across all 26 docs)

| # | Section | Semantic role | Node type |
|---|---------|---------------|-----------|
| 1 | Higher Education & Specialized PG Pathways | Next-degree branching (M.Sc./M.Tech./M.Pharm./MPT/MOT/MPH/MHA/MBA/LL.B./Ph.D.) | study path |
| 2 | Frontline … Job Opportunities | Immediate post-graduation employment, core discipline | job |
| 3 | Non-Traditional Industry Domains & Job Roles | Adjacent/lateral industry pivots | job |
| 4 | Government Opportunities | Named public-sector exams, cadres, recruitment boards | exam/job |
| 5 | Civil Services & General Graduate Frameworks | Degree-agnostic escape hatch: UPSC CSE, State PSC Group-A/Group Services, SSC CGL (+ banking PO/clerk, IBPS AFO where relevant) | exam |
| 6 | Global Licensing & Study Abroad Pathways | Foreign licensure exams + overseas MS/PhD | licence/study |
| 7 | High-Value Certifications & Skill Accelerators | Short credentials that unlock roles | certification |
| 8 | Entrepreneurial Outlets | Business/venture formats | venture |
| 9 | Research Domains & Academic Nodes | PhD-track / research thesis topics | research |
| 10 | Emerging Horizon Domains | Future-facing / AI, XR, robotics, closed-loop, 3D-printing themes | frontier |

### Three formatting variants (matters for parsing)

- **Variant A (docs 1–15):** nested bullets, 3-space indent per level. Depth 3 = PG degree / role; depth 4 = employer nodes AND job titles **mixed in the same list, undifferentiated**.
- **Variant B (docs 16–17):** flat bullets, numbered sections. **Doc 17 (B.Sc. Biomedical Sciences) is the only one with an explicit field schema**, and it is the best template for a data model:
  - `Destination Nodes: <comma-separated employer/setting list>`
  - `Frontline Titles: <comma-separated job title list>`
- **Variant C (docs 18–26, the newest):** flat bullets, each item followed by a **one-line prose description** of what the role actually does. PG entries follow a strict 7-line repeating pattern: `Degree → 2 Destination Nodes → 4 Role Titles`.

### Recurring cross-degree "hub" nodes

These appear in nearly every doc and are the natural cross-links in a graph model:
`Master of Public Health (MPH)`, `Master of Hospital Administration (MHA)`, `MBA in Healthcare & Hospital Management`, `3-Year LL.B.` (domain-specific specialization per degree), `UPSC Civil Services Examination`, `State PSC`, `SSC CGL`, `Certified Professional Coder (CPC – AAPC)`, `ISO 15189 / NABL internal auditor`, `ACLS/PALS (AHA)`, `Allied Health Professional Licensing Exams (Middle East – DHA, HAAD, MOH)`, `HCPC Registration (UK)`.

---

## 2. Fields / signals the docs actually define

Per document (degree):
- `title` — short key (e.g. `BMLT`, `B.Optom`, `BOT`)
- `full_title` — from the "Integrated Academic & Career Topology:" line
- `regulatory_framework` — list of statutory/accreditation bodies (INC, PCI, NCAHP, NABL, AERB, ICAR, FSSAI, RCI, CDSCO, AICTE, DBT/RCGM, …)
- `scope_note` — most say "(High-Scope Pathways Only)"

Per pathway node:
- `section` — one of the 10 above
- `name` — exact pathway/role/exam/certification name
- `destination_nodes` — employers / institutional settings
- `frontline_titles` — concrete job titles
- `description` — one-line duty description (Variant C and doc 17 only)

**Not present anywhere:** salary bands, difficulty, duration, eligibility cut-offs, entrance-exam scores, aptitude tags, interest categories, personality types, prerequisites, or any numeric weighting.

---

## 3. How a prediction engine should use this

Because the doc supplies **structure but not scoring**, the engine must supply the scoring itself. The doc's implied model is:

1. **Entry point = the degree.** The 26 doc titles are the only legitimate root inputs. A prediction request should start from one of them (or a normalized alias).
2. **The 10 sections are the outcome intents.** A user's goal ("I want a government job", "I want to go abroad", "I want to start a business", "I want research") maps 1:1 onto a section. Section selection is a filter, not a score.
3. **Within a section, items are siblings** — the doc presents them as unranked alternatives. Ranking must come from user signals (interest keywords, subject strengths, risk appetite, location, budget) matched against `name`, `destination_nodes`, `frontline_titles`, and `description` text.
4. **Two-hop expansion.** `degree → PG pathway → (destination nodes + frontline titles)` is the primary prediction chain. A second chain is `degree → certification → unlocked frontline/non-traditional roles` (e.g. CPC unlocks Medical Coder across many degrees).
5. **Cross-degree hubs enable "pivot" predictions.** MPH/MHA/MBA/LL.B./UPSC appear under most degrees, so the engine can legitimately answer "can I switch to management/law/civil services from X?" for essentially any of the 26.
6. **Emerging Horizon Domains** is the natural source for "future-proof" or "high-growth" recommendations; **Research Domains** for "academic track"; **Entrepreneurial Outlets** for "self-employment".
7. **Regulatory framework** is a hard constraint, not a preference — it tells the engine which licensure body gates a path (e.g. AERB for anything radiation, NCAHP for allied health, PCI for pharmacy).

**Suggested API shape** (derived, not stated in the doc):
- `GET /degrees` → 26 entries `{key, full_title, regulatory_framework, section_counts}`
- `GET /degrees/{key}` → full tree
- `GET /degrees/{key}/sections/{section}` → items with `destination_nodes`, `frontline_titles`, `description`
- `POST /predict` → body `{degree, intents[], interests[], constraints{}}` → ranked items with `{section, name, why_matched[], score}` where score is engine-owned (e.g. text/embedding similarity over name + titles + description, boosted by intent→section match)
- `GET /search?q=` → cross-degree free-text over all nodes (supports "which degrees lead to X?")

---

## 4. The 26 documents

### 1. B.Sc. Nursing
*Integrated Academic & Career Topology: B.Sc. Nursing (High-Scope Pathways Only)*
**Regulatory:** Indian Nursing Council (INC) & State Nursing Councils (SNC)

- **Higher Education & Specialized PG Pathways (19):** M.Sc. Medical-Surgical Nursing; M.Sc. Pediatric (Child Health) Nursing; M.Sc. Obstetrics & Gynecological Nursing; M.Sc. Mental Health (Psychiatric) Nursing; M.Sc. Community Health Nursing; M.Sc. Critical Care Nursing; M.Sc. Oncological Nursing; M.Sc. Neurosciences Nursing; M.Sc. Nephro-Urology Nursing; M.Sc. Orthopedic Nursing; Master of Public Health (MPH); Master of Hospital Administration (MHA); MBA in Healthcare & Hospital Management; Post Basic Diploma in Operation Theatre (OT) Nursing; Post Basic Diploma in Cardio-Thoracic Nursing; Post Basic Diploma in Emergency and Disaster Nursing; Post Basic Diploma in Neonatal Nursing; Post Basic Diploma in Dialysis Nursing; 3-Year LL.B. (Law)
- **Frontline Clinical Job Opportunities (8):** Staff Nurse; Critical Care Nurse; Infection Control Nurse; Industrial / Occupational Health Nurse; Nurse Educator; Nursing Superintendent; Clinical Nurse Specialist; Patient Care Coordinator
- **Non-Traditional (6):** Clinical Corporate Nursing & Medical Device Management; Healthcare IT, Informatics & Scribing; Clinical Research Management; Medical Coding & Auditing; Healthcare Insurance Case Management; Public Health Consultancy & Writing
- **Government (8):** AIIMS / Central Government Hospital Staff Nurse Exam (NORCET); State PSC Staff Nurse Recruitment (e.g., MRB Tamil Nadu); Military Nursing Services (MNS – Commissioned Officer Entry); Railway Recruitment Board (RRB) Staff Nurse; ESIC Hospital Nursing Cadres; State Pollution Control Board Biomedical Waste Inspector; National Health Mission (NHM) Community Health Officer (CHO); Civil Services & General Graduate Tracks (UPSC CSE, State PSC Group Services, SSC CGL)
- **Global Licensing (6):** NCLEX-RN (USA/Canada); OSCE/CBT (NMC UK); NMBA Registration (Australia); MS Adult-Gerontology Nurse Practitioner (USA/UK); MS Advanced Clinical Nursing (Australia); MS Public Health (Global)
- **Certifications (6):** CPC; CPHIMS; ACLS (AHA); PALS (AHA); Neonatal Resuscitation Program (NRP); Infection Control and Prevention (NABH/WHO)
- **Entrepreneurial (4):** Specialized Home Nursing & Caregiver Bureau; Nursing Competitive Exam & Global Licensure Prep Academy; Specialized Maternity & Postnatal Home Care Service; Corporate Wellness & Occupational Health Setup
- **Research (5):** Clinical Nursing Protocols Optimization; Hospital-Acquired Infection Control Mechanisms; Patient Care Quality Assessment Indices; Geriatric Nursing Care Models; Community Healthcare Delivery Models
- **Emerging (4):** Tele-Nursing Care Matrix Architecture; Nursing Informatics Integration Specialist; AI-Enabled Remote Patient Triage Monitoring; Digital Therapeutics Adherence Management

**Engine notes:** richest PG branching of all 26 (10 clinical specialisms + 5 post-basic diplomas). Strongest global-mobility signal (NCLEX/OSCE/NMBA). Use specialism keywords (cardiac, neuro, neonatal, renal, ortho, psych, onco) as the primary discriminator.

---

### 2. B.Pharm
*Integrated Academic & Career Topology: Bachelor of Pharmacy (B.Pharm) (High-Scope Pathways Only)*
**Regulatory:** Pharmacy Council of India (PCI) & State Pharmacy Councils

- **PG Pathways (17):** M.Pharm. Pharmaceutics; M.Pharm. Pharmaceutical Chemistry; M.Pharm. Pharmacology; M.Pharm. Pharmacognosy; M.Pharm. Pharmaceutical Analysis; M.Pharm. Pharmaceutical Quality Assurance; M.Pharm. Regulatory Affairs; M.Pharm. Pharmacy Practice; M.Pharm. Industrial Pharmacy; M.Pharm. Pharmaceutical Biotechnology; Pharm.D. (Post-Baccalaureate – 3 Year); M.Sc. Clinical Research; MBA in Pharmaceutical Management; M.Sc. Bioinformatics / Master of Data Science; 3-Year LL.B. (Patent/IP Law); MPH; MBA in Healthcare & Hospital Management
- **Frontline Industrial & Clinical (13):** Research Associate (R&D); Production Executive; Quality Control Analyst; Quality Assurance Executive; Drug Safety Associate (Pharmacovigilance); Clinical Data Analyst; Regulatory Affairs Executive; Patent Analyst; Medical Writer; Scientific Communications Specialist; Product Executive (PMT); Medical Representative (Technical/Specialty); Procurement & Supply Chain Executive
- **Non-Traditional (12):** F&D; API Synthesis & Industrial Manufacturing; Analytical QC & QA; Global Regulatory Affairs (DRA); Pharmacovigilance & Drug Safety; Clinical Data Management (CDM); Clinical Research Auditing; Medical Writing & MedComms; Patent Analytics & IPR; Pharmaceutical Product Management (PMT); Institutional Technical Sales & Corporate BD; Pharmaceutical Supply Chain & Cold-Chain Logistics
- **Government (8):** CDSCO Drug Inspector Exam; State PSC Drug Inspector; Government Hospital Pharmacist (RRB/ESIC/AIIMS/State); SSC Junior Scientific Assistant; IPC Scientific Assistant; State Public Health Laboratories Analyst; FSSAI Technical Officer; Civil Services & General Graduate Frameworks (UPSC, State PSC, Banking PO/Clerk)
- **Global Licensing (7):** MS Pharmaceutical Sciences; MS Drug Discovery & Development; MS Regulatory Affairs; MS Pharmacoeconomics & Health Outcomes Research; NAPLEX (USA); PEBC (Canada); GPhC (UK)
- **Certifications (6):** CPC; PG Diploma in Clinical Research & Pharmacovigilance; WHO GMP Modules; GLP Audit Certifications; SAS Clinical Programming; RAC (RAPS)
- **Entrepreneurial (5):** Pharmaceutical Retail & Digital Pharmacy Chains; Surgical Equipment & Pharma Distribution Wholesale Hub; Third-Party Pharmaceutical Manufacturing Brokerage; Regulatory Compliance & Dossier Preparation Consultancy; Pharmacovigilance Outsourcing Unit (Micro-KPO)
- **Research (5):** NDDS; Target-Specific Phytochemical Isolation; In-Vitro/In-Vivo Pharmacological Screening; Computational Molecular Docking & QSAR; Impurity Profiling & Stability Testing Matrix
- **Emerging (4):** AI-Driven Computational Target Identification; Digital Pharmacy & Automated Dispensing Networks; Customized 3D-Printed Pharmaceutical Formulations; Decentralized Clinical Trial Data Architectures

**Engine notes:** the M.Pharm specialisation chosen determines almost everything downstream; treat it as a required second-hop question. Only doc besides B.Sc. Agriculture that lists banking exams under civil services.

---

### 3. B.Sc. Agriculture
**Regulatory:** Indian Council of Agricultural Research (ICAR) & State Agricultural Universities (SAUs)
*(This doc omits the "Integrated Academic & Career Topology" subtitle line and starts directly with the regulatory framework.)*

- **PG Pathways (8):** M.Sc. Agronomy; M.Sc. Genetics & Plant Breeding; M.Sc. Plant Pathology / Entomology; M.Sc. Soil Science & Agricultural Chemistry; M.Sc. Agricultural Economics / Agricultural Extension; M.Sc. Agricultural Biotechnology; MBA in Agribusiness Management (FABM); M.Tech in Agricultural Engineering (Precision Ag Specialty)
- **Frontline Industrial & Field (6):** Research Associate (Agri-Input R&D); Production Executive (Seed/Fertilizer); QC Analyst (Agri-Chemicals); QA Executive (Food Safety); Territory Technical Manager; Farm Operations Executive
- **Non-Traditional (5):** Corporate Agri-Tech Systems & Drone Remote Sensing; Carbon Credit Asset Management; Clinical Trial Coordination (Agri-Chemical Bio-Safety); Agri-Commodity Sourcing & Cold-Chain Logistics; Digital Agribusiness Marketplaces
- **Government (8):** ICAR ARS Scientist Exam; IBPS Agriculture Field Officer (AFO); State PSC Agricultural Officer / Assistant Director of Agriculture; FSSAI Technical Officer; FCI Technical Management Exam; NABARD Grade A Officer; State Forest Service Exam (Range Forest Officer); Civil Services (UPSC CSE / IFS, SSC CGL)
- **Global Licensing (3):** MS/PhD Sustainable Agriculture (USA/Europe); MS Precision Agriculture / Smart Farming Technology (Israel/Netherlands); MS Agricultural Data Analytics
- **Certifications (4):** DGCA Drone Pilot License (Agriculture Ops); FOSTAC Food Safety Supervisor (FSSAI); Commercial Hydroponics & Vertical Farming Mastery; GIS & Remote Sensing Application Certificate
- **Entrepreneurial (4):** Commercial Soilless Farming & Vertical Farms; Agri-Clinics & Smart Custom Hiring Centers; Organic & Bio-Input Small-Scale Formulations Unit; Agribusiness Export & Supply Chain Brokerage
- **Research (4):** Climate-Resilient Varietal Breeding Architecture; Nanotechnology in Crop Nutrition; Microbiome Engineering for Soil Vitality; Post-Harvest Shelf-Life Extension Systems
- **Emerging (3):** Generative AI Crop Phenotyping Infrastructure; Cellular Agriculture & Lab-Grown Nutrient Engineering; Autonomous Robotic Harvester Sensor Deployments

**Engine notes:** the only non-health-sector doc. Uniquely strong banking/finance government track (IBPS AFO, NABARD Grade A) — a distinct intent bucket the other 25 don't have.

---

### 4. B.Sc. Biotechnology
**Regulatory:** Department of Biotechnology (DBT), Review Committee on Genetic Manipulation (RCGM), Institutional Biosafety Committees (IBSC)

- **PG Pathways (11):** M.Sc. Biotechnology; M.Sc. Molecular Biology / Genetics; M.Sc. Bioinformatics / Computational Biology; M.Sc. Food Biotechnology; M.Sc. Marine Biotechnology; M.Sc. Medical Biotechnology; M.Sc. Clinical Research; MPH; MHA; MBA in Biotechnology / Healthcare Management; 3-Year LL.B. (Patent/IP Law)
- **Frontline Clinical & Industrial (7):** Junior Research Associate / Lab Technician; Bioprocess Technician; QA/QC Executive (Biotech/Pharma); Clinical Research Coordinator (CRC); Pharmacovigilance Associate; Biostatistics / Data Associate; Biotech Product Specialist
- **Non-Traditional (5):** Genomics Data Analytics; Bio-IT & Biological Knowledge Management; Synthetic Biology Assistant; Medical Writing & MedComms; Healthcare IT KPOs & Medical Coding
- **Government (7):** ICMR/CSIR/DRDO JRF via National Exams; FSSAI / State PSC Food Safety Officer (FSO); ISRO / BARC Technical Assistant; IPC Scientific Assistant; Drug Inspector (State PSC / CDSCO); State Public Health Laboratories Analyst; Civil Services & General Graduate Frameworks
- **Global Licensing (4):** MS/PhD Pharmaceutical Biotechnology & Molecular Discovery (USA/Europe); MS Drug Discovery & Gene Therapy Development (UK/Europe); MS Regulatory Affairs (Global); MS Pharmacoeconomics & Health Outcomes Research
- **Certifications (4):** RAC (RAPS); SAS Certified Clinical Trials Programmer; CPC (AAPC); GLP/GMP Modules
- **Entrepreneurial (4):** Pharmacovigilance & Data Outsourcing Micro-KPO; Regulatory Compliance & Dossier Sourcing Bureau; Coaching & Entrance Prep EdTech Platform; Surgical Equipment & Specialized Diagnostic Kit Distribution Wholesale Hub
- **Research (4):** Novel Vector Design & Genetic Engineering; Bioreactor Process Optimization; Immunotechnology & Hybridoma Optimization; Bio-Remediation & Environmental Microbial Frameworks
- **Emerging (4):** AI-Assisted Biological Data Analysis; Decentralized Clinical Trial Data Architectures; Customized 3D-Bioprinted Tissue Matrix Architecture; mRNA & Cell-Therapy Production Scale-Up Engineering

---

### 5. B.Sc. Microbiology
**Regulatory:** NABL, FSSAI, Institutional Biosafety Committees (IBSC)

- **PG Pathways (10):** M.Sc. Medical Microbiology; M.Sc. Industrial Microbiology; M.Sc. Food Microbiology; M.Sc. Environmental Microbiology; M.Sc. Virology; M.Sc. Immunology; MPH; MHA; MBA in Healthcare Management / Agribusiness; 3-Year LL.B. (IPR)
- **Frontline Industrial & Clinical (5):** QC Microbiologist; QA Sterility Executive; Clinical Laboratory Executive; Downstream Processing Executive; Culture Collection Curator
- **Non-Traditional (4):** IVD Application Specialist; Corporate Biosafety & Biosecurity Officer; Microbiome Data Analytics; Medical Scribing & Scientific Communications
- **Government (6):** FSSAI Technical Officer; ICMR / CSIR NIV Project Scientist; State Public Health Laboratories Analyst / Bacteriologist; Government Hospital Pharmacist / Allied Consultant (RRB/ESIC/AIIMS); BIS Technical Assistant; Civil Services & General Graduate Frameworks
- **Global Licensing (3):** MS/PhD Medical Virology & Immunology (USA/Europe); MS Food Safety & Molecular Epidemiology; MS Industrial Biotechnology & Bio-Refineries
- **Certifications (4):** NABL Certified Internal Auditor (ISO/IEC 17025 / ISO 15189); HACCP Level 3/4; CPC (AAPC); WHO GLP Alignment Modules
- **Entrepreneurial (4):** NABL Accredited Third-Party Testing Laboratory; Bio-Fertilizer & Organic Bio-Input Production Venture; Industrial Bio-Sanitization & Decontamination Bureau; Higher Education Competitive Prep EdTech Platform
- **Research (4):** Antimicrobial Resistance (AMR) Mutation Architecture; Fermentation Kinetic Optimization Matrices; Phage Therapy Formulation Research; Metagenomic Soil Cluster Mapping
- **Emerging (4):** AI-Driven Automated Pathogen Morphology Identification; Space Microbiology & Astrobiological Shielding Matrices; Decentralized Outbreak Epidemiological Data Architectures; Synthetic Genome Yeast Platform Engineering

---

### 6. BMLT
*B.Sc. Medical Laboratory Technology (High-Scope Pathways Only)*
**Regulatory:** NCAHP – Medical Laboratory and Life Sciences Category; NABL

- **PG Pathways (15):** M.Sc. Medical Laboratory Technology; M.Sc. Medical Biochemistry; M.Sc. Medical Microbiology; M.Sc. Medical Anatomy / M.Sc. Medical Physiology; M.Sc. Medical Pharmacology; M.Sc. Clinical Research; M.Sc. Clinical Embryology; M.Sc. Molecular Diagnostics / M.Sc. Human Genetics; M.Sc. Bioinformatics; M.Sc. Biotechnology / M.Sc. Immunology; M.Sc. Toxicology; MPH; MHA; MBA in Healthcare & Hospital Management; 3-Year LL.B. (Medico-Legal / Regulatory Compliance)
- **Frontline Clinical & Industrial (11):** Medical Laboratory Technologist; Lab Supervisor / Manager; QC Executive; QA Analyst; Molecular Diagnostics Specialist; Cytotechnologist; Histotechnologist; Blood Bank Technologist; Research Assistant; Field Application Specialist (IVD Platforms); Medical Coder
- **Non-Traditional (8):** Clinical Pathology Labs; IVD Manufacturing; Molecular Diagnostics & Genomics Operations; CROs; Core Biopharmaceuticals; Medical Coding & Billing; Scientific Instrumentation Support; Healthcare Insurance Audit
- **Government (8):** AIIMS Technical Officer; ESIC Hospital Lab Technician; RRB Lab Superintendent; JIPMER / PGIMER Lab Technologist; AFMS Lab Cadres; FSSAI Technical Officer Exam; NHM District Lab Coordinator; NACO Technical Personnel
- **Global Licensing (5):** MS Medical Laboratory Science (USA); MS Biomedical Science (UK/Europe); ASCPi Certification Pathway (USA); HCPC Registration Route (UK); AIMS Certification Pathway (Australia)
- **Certifications (4):** ASCPi International Certification; ISO 15189 Internal Auditor; CPC (AAPC); WHO Laboratory Biosafety Modules
- **Entrepreneurial (4):** Independent Pathology Diagnostic Center (NABL Compliant); Specialized Diagnostic Reagent Distribution Network; NABL Accreditation Consultancy Firm; Automated Sample Logistics Service Startup
- **Research (4):** Antimicrobial Resistance Tracking Protocols; Liquid Biopsy Biomarker Characterization; Advanced Diagnostic Staining System Syntheses; Molecular Assay Miniaturization
- **Emerging (3):** Digital Pathology AI Image Calibration; Point-of-Care CRISPR Testing Architectures; High-Throughput Robotic Lab Pipeline Integration

---

### 7. B.Tech Biotechnology
**Regulatory:** AICTE, DBT, RCGM, CDSCO

- **PG Pathways (8):** M.Tech. Biotechnology; M.Tech. Bioprocess Engineering / Biochemical Engineering; M.Tech. Biomedical Engineering; M.Tech. Bioinformatics / Computational Biology; M.Tech. Food Biotechnology / Genetic Engineering; MPH; MBA in Technology Management / Agribusiness; 3-Year LL.B. (Patent Law & Tech Transfer)
- **Frontline Clinical & Industrial (6):** Bioprocess Engineer (Upstream/Downstream); Validation Engineer; QC Instrumentation Engineer; QA Compliance Officer; Bioinformatics Analyst; Clinical Data Engineer
- **Non-Traditional (4):** Life Sciences Venture Capital Analyst; Bio-IT Systems Cloud Architect; Bioprocess Automation Specialist; Technical Brand & Product Manager
- **Government (6):** BIRAC Technical Officer; CSIR / DBT Scientific Officer; FSSAI Technical Officer Exam; Drug Inspector / Medical Device Officer (CDSCO); Patent Examiner (Indian Patent Office – CGPDTM); Civil Services & General Graduate Frameworks
- **Global Licensing (3):** MS/PhD Metabolic Engineering & Synthetic Biology (USA/Europe); MS Biomedical Device Engineering & Regulatory Science (USA/Canada); MS Quantitative Biology & Systems Medicine
- **Certifications (4):** ASQ Certified Quality Engineer (CQE); Lean Six Sigma Green/Black Belt (Biomanufacturing); SAS Certified Clinical Data Programmer; RAC (RAPS)
- **Entrepreneurial (4):** CMO (Recombinant Proteins); Bioinformatics Pipeline-as-a-Service Venture; Advanced Tissue Culture & Micropropagation Bureau; Biomanufacturing Facility Auditing & Validation Consultancy
- **Research (4):** Metabolic Flux Analysis & Pathway Engineering; CRISPR-Cas9 Off-Target Mitigation Systems; Biopolymer Scaffold Engineering; Continuous Upstream Processing Matrices
- **Emerging (4):** AI-Driven De Novo Protein Structural Design; Cell-Free Synthetic Biology Platforms; Decentralized Clinical Trial Smart-Contract Architectures; DNA-Based Digital Data Storage Synthesis

**Engine notes:** the engineering counterpart to doc 4 — same domain, M.Tech (not M.Sc.) branching, engineering/QMS certifications (ASQ, Six Sigma) instead of clinical ones.

---

### 8. B.Sc. Food tech/Science
*B.Sc. Food Technology / Science*
**Regulatory:** FSSAI, Ministry of Food Processing Industries (MoFPI), APEDA, Bureau of Indian Standards (BIS)

- **PG Pathways (8):** M.Sc./M.Tech. Food Technology / Food Science; M.Sc. Food Safety & Quality Management; M.Sc./M.Tech. Food Process Engineering; M.Sc. Post-Harvest Technology / Horticultural Operations; M.Sc. Clinical Nutrition & Dietetics; MPH; MBA in Agribusiness Management / Food Retail; 3-Year LL.B. (Food Laws, Safety Regulations & IP)
- **Frontline (6):** Production / Processing Shift In-Charge; QC Executive; QA Analyst; Food Microbiologist; Sensory Analyst / Panel Coordinator; Packaging Quality Specialist
- **Non-Traditional (4):** Flavor Chemistry & Creation Houses; Food Tech Startup Incubators & Accelerators; Third-Party Food Testing Mega Labs; E-Commerce Dark Store Quality Auditors
- **Government (6):** FSSAI Central Food Safety Officer (CFSO) / Technical Officer; State Food Safety Officer (FSO); BIS Technical Examiner; APEDA / MPEDA Export Inspection Officers; DFRL / CSIR-CFTRI Scientific Cadres; Civil Services & General Graduate Frameworks
- **Global Licensing (3):** MS Food Science and Technology (USA/Canada/Europe); MS Food Safety and Regulatory Affairs (UK/Europe); IFT Certified Food Scientist (CFS) Pathway
- **Certifications (4):** ISO 22000 / FSSC 22000 Lead Auditor; HACCP Level 3; FSSAI FoSTaC Advance/Special Authority; BRCGS Internal Auditor
- **Entrepreneurial (4):** Clean-Label / Functional Food D2C Processing Unit; NABL Accredited Food Testing and Nutritional Labeling Bureau; FSMS Documentation Consultancy; Dehydrated Agro-Commodity Processing Infrastructure
- **Research (4):** Plant-Based Meat and Dairy Analogue Structuring; Active and Intelligent Biopolymer Packaging Matrix Synthesis; Non-Thermal Food Preservation Modalities; Upcycling Bio-Industrial Food Waste Streams
- **Emerging (4):** Precision Fermentation Alternative Biomolecule Expression; 3D Food Printing Personalized Nutrition Architecture; Blockchain-Enabled Farm-to-Fork Traceability Integration; AI-Powered Machine Vision Sorting & Grading Pipelines

---

### 9. BPT
*Bachelor of Physiotherapy*
**Regulatory:** NCAHP – Physiotherapy Category; Indian Association of Physiotherapists (IAP)

- **PG Pathways (12):** MPT (Orthopedics / Musculoskeletal Disorders); MPT (Neurology & Psychosomatic Disorders); MPT (Cardiothoracic & Pulmonary); MPT (Sports Physiotherapy); MPT (Pediatrics / Developmental Disabilities); MPT (Geriatrics / Active Aging); MPT (Women's Health & Urogynecological Rehabilitation); MPT (Integumentary Systems & Wound Care); MPH; MHA; MBA in Healthcare Management; 3-Year LL.B. (Medical Law & Disability Rights)
- **Frontline (6):** Clinical Physiotherapist; ICU Physical Therapist; Ergonomic Consultant; Home-Health Rehabilitation Specialist; Cardiopulmonary Rehabilitation Technologist; Community CBR Coordinator
- **Non-Traditional (4):** MedTech Rehabilitation Device Testing & Validation; Corporate Wellness & Ergonomic Strategy Panels; Health Insurance Claims Rehabilitation Auditor; Healthcare Content & Digital Therapeutics Systems Lead
- **Government (6):** AIIMS / Central Government Hospital Physiotherapist; ESIC Hospital & Dispensary; RRB Physiotherapist Cadre; AFMS Rehabilitation Wings; State Health Services (State PSC); NHM District Disability Coordinator
- **Global Licensing (4):** NPTE (FSBPT – USA); PCE (Canadian Alliance of Physiotherapy Regulators); HCPC Registration (UK); APC Certification (Australian Physiotherapy Council)
- **Certifications (4):** Certified Manual Therapist (CMT) / Mulligan / Maitland; CSCS (NSCA); Neuro-Developmental Treatment (NDT) / Bobath; Certified Kinesio Taping Practitioner (CKTP)
- **Entrepreneurial (4):** Specialized Boutique Musculoskeletal & Sports Rehab Clinic Franchise; Corporate Ergonomic Risk Audit Agency; Geriatric Assisted Home-Care Logistic Network; Pediatric Sensory Integration & Neuro-Developmental Center
- **Research (4):** VR and Gamified Neuro-Plasticity Rehabilitation; EMG Biofeedback Patterns in Neuromuscular Control; Early Mechanical Loading Protocols in Post-Surgical Tendon Repairs; Epidemiological Variations in Occupational Repetitive Strain Injuries
- **Emerging (4):** Wearable Sensor Biomechanical Gait Analysis Interfaces; Robotic Exoskeleton Assistive Gait Calibration Systems; Telerehabilitation Remote Motion-Tracking Architectures; Regenerative Medicine Post-Stem Cell / PRP Loading Protocols

---

### 10. B.Sc. Biochemistry
**Regulatory:** NCAHP – Non-Clinical Laboratory Frameworks; CDSCO – IVD Divisions; NABL

- **PG Pathways (10):** M.Sc. Medical Biochemistry (Non-Clinical / Regulatory Track); M.Sc. Analytical Biochemistry; M.Sc. Plant Biochemistry & Phytochemistry; M.Sc. Clinical Chemistry; M.Sc. Molecular Biology / Enzyomology *(sic)*; M.Sc. Neurobiochemistry / Immunochemistry; MPH; MHA; MBA in Healthcare Management / Life Science Business; 3-Year LL.B. (Life Science Patents & Bioethics Law)
- **Frontline (6):** Biochemistry Laboratory Analyst; Assay Development Associate; QC Chemist; Protein Purification Technician; Nucleic Acid Extraction Specialist; Technical Documentation Executive
- **Non-Traditional (4):** IVD Manufacturing Operations; Biomedical KPO; Diagnostic Assay Troubleshooting & Support; Life Science Intellectual Property Search Analyst
- **Government (6):** CSIR / ICMR / DBT Project Assistant; FSSAI Technical Officer / Food Analyst; State Forensic Science Laboratories (FSL) – Toxicological Sub-Cadres; Drug Inspector (State/Central); BIS Laboratory Scientist; Civil Services & General Graduate Frameworks
- **Global Licensing (3):** MS/PhD Biochemistry & Structural Biology (USA/Europe); NRCC Certification Route (USA); MS Molecular Medicine / Translational Biochemistry
- **Certifications (4):** NRCC Certified Clinical Chemistry Technologist; ISO 15189 QMS Internal Auditor; ASQ Certified Calibration Technician (CCT); NPTEL / SWAYAM Advanced Enzyomology and Kinetics Modules
- **Entrepreneurial (4):** Custom Diagnostic Control and Calibrator Formulation Venture; NABL Technical Audit Readiness Advisory Group; Specialized Phytochemical and Active Botanical Extract Plant; Niche Diagnostics Reagent Cold-Chain Transportation Agency
- **Research (4):** Enzyme Kinetics Inhibitor Prototyping; Mitochondrial Bioenergetics and Metabolic Reprogramming; Post-Translational Modification (PTM) Glycosylation Profiling; Biosensor Electrochemical Interfacing Optimization
- **Emerging (4):** Metabolomics Shift Pattern Mapping via Machine Learning; In-Silico Automated Enzyme Active-Site Reshaping; Microfluidic Lab-on-a-Chip Metabolic Profiling Panels; Epigenetic Chemical Modification Sequencing Protocols

---

### 11. B.Sc. Nutrition and dietics
*B.Sc. Nutrition & Dietetics*
**Regulatory:** NCAHP – Nutrition and Dietetics Registry Category; Indian Dietetic Association (IDA); Registration Council for Dietitians (RCD)

- **PG Pathways (8):** M.Sc. Clinical Nutrition & Dietetics / Medical Nutrition Therapy; M.Sc. Food Science and Nutrition; M.Sc. Human Nutrition / Behavioral Nutrition; M.Sc. Sports Nutrition / Exercise Physiology; MPH / Community Nutrition; MHA; MBA in Healthcare Management / Wellness Business; 3-Year LL.B. (Food Safety, Labeling Claims & Health Law)
- **Frontline (6):** Clinical Dietitian (IPD/OPD); Critical Care Nutritionist; Bariatric & Weight Management Consultant; B2B Nutraceutical Formulation Associate; Food Service Manager / Institutional Dietitian; Diabetic Educator
- **Non-Traditional (4):** Personalized AI Therapeutics Nutrition Architect; Nutraceutical Regulatory Affairs Specialist; Corporate Ergonomic and Metabolic Wellness Director; Culinary Medicine Consultant
- **Government (6):** Registered Dietitian (RD) Institutional Appointments; ICMR – National Institute of Nutrition (NIN) Scientific Officer; FSSAI Technical Officer Exam; Sports Authority of India (SAI) Sports Nutritionist Cadre; State Child Development Project Officer (CDPO); Civil Services & General Graduate Frameworks
- **Global Licensing (3):** RD Credentialing Exam (IDA); CDR Registered Dietitian Nutritionist (RDN) Pathway (USA); HCPC International Registration Route (UK)
- **Certifications (4):** Certified Diabetes Educator (CDE); Certified Nutrition Support Clinician (CNSC – NBNSC); FSSAI FoSTaC Advanced Food Safety Supervisor; Sports Nutritionist Certification (ISSN – CISSN)
- **Entrepreneurial (4):** Specialized Multi-City Therapeutic Diet Counseling Network; Bespoke Macro-Calibrated Therapeutic Meal Delivery System; Nutraceutical Ingredient Brand and E-Commerce Venture; Dietary Department Operational Auditing Agency
- **Research (4):** Nutrigenomics and Epigenetic Response Patterns; Gut Microbiome Modulation via Targeted Prebiotics; Sarcopenia and Lean Mass Preservation in Geriatric Cohorts; Glycemic Dynamics of Alternate Indigenously Sourced Ancient Grains
- **Emerging (4):** Continuous Glucose Monitor (CGM) Tele-Therapeutics Loops; AI-Guided De Novo Formulation of Bioactive Peptides; Metabolic Digital Twins for Preventive Longevity Optimization; Blockchain-Verified Sustainable Nutrition Supply Chain Architecture

---

### 12. B.Sc. MIT/Rad
*B.Sc. Medical Imaging Technology*
**Regulatory:** NCAHP – Medical Radiology, Imaging and Therapeutic Technology Category; AERB; BARC

- **PG Pathways (8):** M.Sc. Medical Radiology & Imaging Technology; M.Sc. Medical Physics; M.Sc. Nuclear Medicine Technology; M.Sc. Health Informatics / Medical Informatics; MPH; MHA; MBA in Healthcare & Hospital Management; 3-Year LL.B. (Medical Jurisprudence & Radiation Laws)
- **Frontline (6):** Diagnostic Medical Radiographer / X-Ray Technologist; CT Scan Technologist; MRI Technologist; Mammographer; Ultrasonography Technical Assistant; Imaging Quality Control Officer
- **Non-Traditional (4):** Application Specialist (Imaging Systems); PACS Administrator; Clinical Imaging Research Coordinator; MedTech Technical Sales and Bid Executive
- **Government (7):** AIIMS Radiographer / Technical Officer; ESIC Hospital Imaging Technologist; RRB X-Ray Technician Cadre; BARC / DAE Scientific Assistant & Radiation Safety Officer Cadre; DRDO Medical Imaging Technical Assistant; AFMS Radiographer Selection; State PSC Government Medical College Radiographer
- **Global Licensing (3):** ARRT Board Examination (USA); CAMRT Certification (Canada); MS Diagnostic Radiography / Medical Imaging Science (UK/Europe/Australia)
- **Certifications (3):** Radiation Safety Officer (RSO) Level-I (AERB); Certified PACS/DICOM Systems Administrator (PARCA / SIIM-II); Advanced MRI/CT Imaging Modality PG Certificates
- **Entrepreneurial (4):** Standalone Diagnostic Imaging Clinic (Scan Center) Venture; Teleradiology Data Management & Processing Hub; Imaging Equipment Maintenance & Calibration Network; Mobile X-Ray & Ultrasound Healthcare Logistics Fleet
- **Research (4):** Low-Dose CT Protocol Optimization Matrices; Functional MRI (fMRI) Sequence Profiling; Contrast Media Biocompatibility & Nephrotoxicity Analysis; Advanced Radiation Shielding Material Synthesis
- **Emerging (4):** Generative AI Radiology Image Pre-Screening Systems; 3D Medical Holographic Image Reconstruction Loops; Real-Time Remote Diagnostic Robotic Ultrasound Networks; Photon-Counting Computed Tomography (PCCT) Calibrations

---

### 13. B.Tech BME
*B.Tech. Biomedical Engineering*
**Regulatory:** CDSCO – Medical Devices Division; FDA; EU-MDR; ISO; IEC

- **PG Pathways (11):** M.Tech. Biomedical Engineering; M.Tech. Medical Electronics; M.Tech. Biomechanics & Rehabilitation Engineering; M.Tech. Clinical Engineering; M.Tech. Biomedical Signal & Image Processing; M.Tech. Biomaterials & Tissue Engineering; M.Tech./M.Sc. Neuroengineering; M.Sc. Health Informatics / Medical Informatics; MPH; MBA in Healthcare Infrastructure / Technology Management; 3-Year LL.B. (MedTech Patents, IPR & Product Liability Law)
- **Frontline (6):** Biomedical Service & Maintenance Engineer; Medical Device QC Engineer; Biomedical Hardware Testing Associate; Clinical Applications Engineer; Embedded Software Firmware Engineer; Regulatory Affairs Associate
- **Non-Traditional (4):** Medical Device Cybersecurity Analyst; 3D Bio-Printing Lab Production Lead; MedTech Usability & Human Factors Engineer; Strategic Hospital Technology Asset Planner
- **Government (6):** AIIMS / Central Hospital Chief Biomedical Engineer; CDSCO Medical Device Officer (MDO); HLL Lifecare Technical / Production Management; ICMR / SCTIMST Scientific Cadres; DRDO Life Sciences Wings; Civil Services & General Graduate Frameworks
- **Global Licensing (3):** MS/PhD Advanced Medical Device Design (USA/Europe/Singapore); BMET / CCE Certification Route (USA); EU-MDR Compliance Auditor Track
- **Certifications (4):** ISO 13485 Lead Auditor (Medical Devices QMS); IEC 60601-1 Medical Electrical Equipment Safety Training; Certified Clinical Engineer (CCE); LabVIEW / MATLAB Bio-Signal Analysis Advanced Credentials
- **Entrepreneurial (4):** Bespoke Hospital Biomedical Equipment AMC/CMC Agency; Medical Device Prototyping and Human Factors Consultancy; NABL Accredited Medical Equipment Calibration Laboratory; Specialized Home-Isolation Telemetry Service Operator
- **Research (4):** Brain-Computer Interfaces for Paralysis Rehabilitation; Biodegradable Metallic Alloys for Temporary Bone Implants; Microfluidic Lab-on-a-Chip Early Cancer Isolation; Wireless Intracranial Pressure Telemetry Systems
- **Emerging (4):** AI-Guided Real-Time Closed-Loop Artificial Pancreas Systems; Biodegradable Soft Robotic Surgical Manipulators; In-Silico Virtual Clinical Trial Patient Modeling Platforms; Organ-on-a-Chip Predictive Drug-Toxicity Assay Microarchitectures

**Engine notes:** the only doc whose regulatory framework is primarily international (FDA, EU-MDR, ISO, IEC) — strong signal for global-first career recommendations.

---

### 14. B.Sc. Genetics
**Regulatory:** NCAHP – Molecular and Genetic Diagnostics Cadres; ICMR Biomedical Research Guidelines; DBT; Genetic Engineering Appraisal Committee (GEAC)

- **PG Pathways (10):** M.Sc. Human Genetics / Medical Genetics; M.Sc. Molecular Genetics / Human Genomics; M.Sc. Genetic Counseling; M.Sc. Bioinformatics / Computational Genomics; M.Sc. Reproductive Genetics / Clinical Embryology; M.Sc. Pharmacogenomics & Personalized Medicine; MPH; MHA; MBA in Healthcare Management / Biotechnology Business; 3-Year LL.B. (Bioethics, Genetic Privacy & Patent Law)
- **Frontline (6):** Cytogenetics Laboratory Technician; NGS Library Preparation Technologist; Molecular Diagnostic Associate; FISH Analyst; Genomic Data Curation Assistant; DNA Extraction and Biobanking Executive
- **Non-Traditional (4):** D2C Genomics Variant Curation Lead; Genomic Cloud Infrastructure Data Custodian; Biotech Intellectual Property Search Analyst; Scientific Medical KPO Associate
- **Government (6):** ICMR / DBT Project Assistant; State FSL – DNA Profiling Cadres; Central/State Pollution Control Boards (Genetic Toxicology Unit); Autonomous Research Institutes Technical Officer (NCBS, InStem); Patent Examiner (CGPDTM); Civil Services & General Graduate Frameworks
- **Global Licensing (3):** MS/PhD Computational Genomics & Systems Biology (USA/Europe); ABGC Board Certification (USA); HGSA Certification Route (Australia/NZ)
- **Certifications (4):** ISO 15189 Internal Auditor; ACMGG / ClinGen Variant Interpretation Standard Modules; Biostatistics and R-Programming for Genomics; Advanced PCR and Flow Cytometry Technical Certifications
- **Entrepreneurial (4):** Niche Molecular Diagnostics Lab (NIPT & Rare Diseases); Bioinformatics-Pipeline-as-a-Service (BPaaS) Venture; Pre-Marital Genetic Screening Strategy Network; Custom Molecular Biology Reagent and Primer Synthesis Bureau
- **Research (4):** Single-Cell RNA-Seq Expression Profiling in Tumor Microenvironments; Epigenetic Histone Modification Dynamics in Neurodegeneration; CRISPR-Mediated In-Vivo Gene Correction Delivery Vector Kinetics; Non-Coding RNA Regulated Phenotypic Manifestations
- **Emerging (4):** Spatial Transcriptomics Single-Cell Physical Mapping; Liquid Biopsy Multi-Cancer Early Detection (MCED) Platforms; AI-Driven De Novo Regulatory Sequence Design; DNA Data Storage Nucleic Synthesis Logic Systems

---

### 15. B.Optom
*Bachelor of Optometry*
**Regulatory:** NCAHP – Ophthalmic Sciences Category; Optometry Council of India (OCI); World Council of Optometry (WCO); MoHFW

- **PG Pathways (7):** Master of Optometry (M.Optom); M.Sc. Clinical Optometry / Binocular Vision specialty; MPH / Community Eye Health; MHA; M.Sc. Health Informatics / Ophthalmic Informatics; MBA in Healthcare Management / Ophthalmic Business Management; 3-Year LL.B. (Medical Jurisprudence & Healthcare Trade Compliance)
- **Frontline (6):** Clinical Optometrist; Contact Lens Specialist; Pediatric and Binocular Vision Therapist; Ophthalmic Modality Diagnostics Technologist; Low Vision and Rehabilitation Consultant; Refractive Surgery (LASIK/SMILE) Workup Specialist
- **Non-Traditional (4):** Ophthalmic Device Quality Assurance Auditor; Corporate Eyewear Lens Design Architect; AI Retinal Biomarker Verification Analyst; Corporate Academic & Professional Services Trainer
- **Government (6):** AIIMS / Central Government Hospital Optometrist Cadres; State PSC Government Medical College Optometrist; NHM District Ophthalmic Assistant; AFMS Allied Health Selection; ESIC Hospital and Diagnostic Center; Civil Services & General Graduate Frameworks
- **Global Licensing (4):** NBEO Board Examination (USA); FORAC Equivalence Assessment (Canada); GOC Registration (UK); OA Assessment Pathway (Optometry Australia)
- **Certifications (4):** FIACLE; FAAO; FCOVD; AERB Diagnostic Radiography Safety Basic Awareness Modules (Ophthalmic Lasers Specialization)
- **Entrepreneurial (4):** Specialized Independent Optometric and Contact Lens Clinic; Organized Multi-City Optical Retail and Precision Lens Dispensing Chain; Mobile Pediatric Vision Screening and Ergonomic Advisory Logistics; Ophthalmic Diagnostic Equipment Distribution and Calibration Lab
- **Research (4):** Optical Defocus Kinetics in Progressive Myopia Control; Meibomian Gland Dysfunction and Tear Film Dynamics; Cortical Visual Impairment (CVI) Neuro-Rehabilitation Pathways; Higher-Order Aberration Fluctuations in Ectatic Corneas
- **Emerging (2):** Smart Contact Lenses with Integrated Biosensors; Extended Reality (XR) Ambient Binocular Vision Therapy Loops

**Data-quality note:** the "Extended Reality (XR) Ambient Binocular Vision Therapy Loops" entry sits at column 0 in the raw text (a formatting break) and is easy for a naive parser to mistake for a 27th document title. It belongs to B.Optom's Emerging Horizon Domains.

---

### 16. B.Sc. Bioinformatics
**Regulatory & Standards:** MeitY Bioinformatics Grid; National Digital Health Blueprint (NDHB); GA4GH Standards; HL7/FHIR Interoperability Protocols; ICMR Data Governance Guidelines

- **PG Pathways (8):** M.Sc. Bioinformatics / Computational Biology; M.Sc. Health Informatics / Clinical Informatics; M.Sc. Data Science / Analytics (Life Sciences); M.Sc. Biostatistics / Quantitative Biology; M.Sc. Genomics / Multi-Omics Pipeline Engineering; MPH in Public Health Informatics; MBA in Healthcare Management / Biotechnology / IT; 3-Year LL.B. (Data Privacy, Cyber Law & Biotech Patents)
- **Frontline Computational & Corporate (6):** Bioinformatics Pipeline Operator (FastQC, BWA-MEM, GATK); Genomic Variant Curation Associate (VCF vs ClinVar/gnomAD/COSMIC); Clinical Data Standardization Specialist (SNOMED-CT, LOINC, ICD-11); In-Silico Compound Screening Assistant; Biological Database Curation Officer; Microbial Metagenomics Profiler (16S rRNA, shotgun)
- **Non-Traditional (4):** Synthetic Biology Sequence Designer; Agricultural Genomics Informatics Executive; Marine Metagenomics Bioprospecting Analyst; Genomic Cloud Infrastructure DevSecOps Engineer (HIPAA/GDPR)
- **Government (4):** MeitY / DBT / ICMR Bio-Informatics Infrastructure Technical Officer (IBDC); Autonomous Research Center Systems Administrator (NCBS, IGIB, NII); Forensic DNA Database Systems Custodian (Central FSL); Indian Patent Office Scientific Officer (Biotech & Software Examination)
- **Civil Services (3):** UPSC CSE; State PSC Group-A IT / Scientific Officer cadres; SSC CGL
- **Global Licensing (3):** MS/PhD Computational Biology & Systems Medicine (USA/Europe); AMIA Certified Health Informatics Professional (CHIP); GA4GH Technical Certification Tracks
- **Certifications (4):** HL7 / FHIR Certified Implementation Specialist; AWS Certified Machine Learning / Azure AI Engineer Specialty; Professional SAS Programmer / R-Bioconductor Badging; Linux/Unix Sysadmin & Docker Containerization
- **Entrepreneurial (4):** Bioinformatics-Pipeline-as-a-Service (BPaaS) Enterprise; AI-Driven Target Discovery & Repurposing Boutique; Clinical Interoperability & EMR Middleware Consulting Practice; Custom Biostatistical Analysis & Scientific Visualization Firm
- **Research (4):** Deep Learning Transformers for Protein Structure & Fold Synthesis; Single-Cell Spatial Transcriptomics Clustering Algorithms; Pan-Cancer Multi-Omics Deep Data Integration Matrices; Network Pharmacology & Dynamic Biological Pathway Modeling
- **Emerging (4):** Quantum-Accelerated Molecular Dynamics Simulations; Digital Twin Patient Organ Metamodeling; In-Silico Immunoinformatics Vaccine Formulation; DNA Computing Logic Gate Network Integration

**Engine notes:** the most software/IT-adjacent doc; the only one whose certification list is dominated by cloud/DevOps credentials. First doc where "Civil Services" is a top-level sibling section rather than nested under Government.

---

### 17. B.Sc. Biomedical Sciences
**Regulatory & Standards:** NCAHP – Medical Laboratory Sciences & Diagnostic Cadres; ICMR Biomedical Research Guidelines; CDSCO Medical Device Rules; NABL (ISO 15189)

**This is the schema reference doc** — sections are numbered 1–9 and every PG entry carries explicit `Destination Nodes:` and `Frontline Titles:` fields.

- **1. Higher Education & Specialized PG Pathways (19, "100% Comprehensive Eligibility Mapping"):** M.Sc. Biomedical Sciences / Translational Medicine; M.Sc. Clinical Research / Advanced Clinical Research; M.Sc. Pharmacovigilance & Drug Safety; M.Sc. Medical Microbiology / Clinical Microbiology; M.Sc. Medical Biochemistry / Clinical Pathology; M.Sc. Molecular Oncology & Cancer Biology; M.Sc. Human Genetics / Medical Genetics / Biomedical Genetics; M.Sc. Regenerative Medicine & Stem Cell Biology; M.Sc. Toxicology / Medical Pharmacology; M.Sc. Neurosciences / Cognitive Science; M.Sc. Forensic Science (Forensic Biology / DNA Profiling / Forensic Toxicology); M.Sc. Immunology & Immunotechnology / Vaccinology; M.Sc. Bioinformatics / Computational Biology; M.Sc. Health Informatics / Clinical Informatics; Integrated M.Sc.-Ph.D. / Ph.D. in Interdisciplinary Life Sciences (IISc, IITs, NCBS, InStem, TIFR, CDRI via JAM, JGEEBILS, GAT-B); MPH / Epidemiology; MHA; MBA in Healthcare & Hospital Management / Pharmaceutical Business Management; 3-Year LL.B. (Medical Jurisprudence, Bio-Patent Law & Clinical Trial Liability)
- **2. Frontline Clinical, Diagnostic & Research (9):** Clinical Research Coordinator (CRC) / Site Coordinator; Clinical Research Associate (CRA) / Clinical Trial Monitor; Pharmacovigilance (PV) Data Associate (MedDRA); Clinical Data Management (CDM) Executive; Molecular Diagnostics Technologist (qPCR, ddPCR, Sanger); Advanced Immunoassay & Pathology Specialist (CLIA, ELISA); Histopathology & IHC Technologist; Clinical Flow Cytometry Analyst; Toxicology & Mass Spectrometry Associate (LC-MS/MS)
- **3. Non-Traditional (4):** IVD Assay Validation Specialist; Biomedical Scientific Writer & Communications Executive; Medical Device Usability & Safety Auditor; Digital Pathology Image Annotation Associate
- **4. Government (6):** ICMR / DBT Autonomous Labs Senior Technical Assistant (NIIH, NICED, NIV); Central/State FSL Biological Divisions; CDSCO Medical Device / Drug Inspector; State Government Medical College Biomedical Scientist Cadres; FSSAI Biological Safety Officer; Civil Services (UPSC CSE, State PSC Group-A, SSC CGL)
- **5. Global Licensing (3):** ASCPi Certification Route — MB(ASCPi) / MLT(ASCPi); AIMS Professional Examination Pathway (Australia); IBMS Registration Process (UK → HCPC biomedical scientist)
- **6. Certifications (4):** ISO 15189 Internal Auditor (NABL QMS); ICH-GCP E6(R2) Professional Certification; Advanced Biostatistics & SPSS/MedCalc/R-Programming Analytics; Bio-Safety Level (BSL-3/BSL-4) Operational Safety Badging
- **7. Entrepreneurial (4):** Clinical Trial Site Management Organization (SMO); Specialized Molecular Path-Lab Venture; Point-of-Care Testing (POCT) Diagnostic Supply & Calibration Bureau; Biomedical Consumables and Specialty Reagent Manufacturing Facility
- **8. Research (4):** Exosome-Encapsulated MicroRNA Signatures in Liquid Biopsies; Organ-on-a-Chip Microfluidic Disease Microenvironment Modeling; Mitochondrial Genome Dysregulation in Cardiomyopathies; Host-Pathogen Interactome Mapping via Spatial Proteomics
- **9. Emerging (4):** In-Vivo Cellular Reprogramming via Targeted mRNA Nanoparticles; Digital Twin Multi-Omics Patient Modeling; Bio-Electronic Medicine & Peripheral Nerve Interface Modulation; Synthetic Biology Xenotransplantation Matrix Engineering

**Engine notes:** use this doc's `Destination Nodes` / `Frontline Titles` pair as the canonical data model for all 26; back-fill the other docs into that shape.

---

### 18. B.Sc. OTAT
*B.Sc. Operation Theatre & Anaesthesia Technology (B.AOTT)*
**Regulatory & Standards:** MoHFW Allied Health Sciences Cadres; NCAHP Act; NABH Operating Theatre Guidelines; Quality Council of India (QCI); PESO Gas Cylinder Rules

- **PG Pathways (8):** Master of Anaesthesia and Operation Theatre Technology (M.AOTT); M.Sc. Surgical Technology / Advanced Surgical Assist; M.Sc. Critical Care Technology / Trauma Care; M.Sc. Echocardiography / Cardiovascular Technology; MPH / Epidemiology (Nosocomial Infection Control); MHA; MBA in Healthcare & Hospital Management / Medical Technology Sourcing; 3-Year LL.B. (Medical Jurisprudence, Bioethics & Clinical Liability)
- **Frontline Clinical & Core Operational (6):** Anaesthesia Technologist; Operation Theatre Technologist; CSSD Supervisor / Manager; PACU / Recovery Room Coordinator; Endoscopy and Laparoscopy Technologist; MedTech Application Specialist (Surgical/Anesthesia Workstations)
- **Non-Traditional (4):** Medical Gas Pipeline System (MGPS) Compliance Auditor; Robotic Surgical Console VR Trainer; Surgical Procurement & Asset Management Strategist; Clinical Trial Support Analyst for Advanced Implants
- **Government (6):** AIIMS / Central Government Hospital Senior OT Technologist; ESIC Hospital OT Assistant Entry Tiers; RRB OT Superintendent; State MRB Frameworks; AFMS Technical Tiers; NHM Emergency Care Mobilization Roles
- **Civil Services (3):** UPSC CSE; State PSC Group-A IT / Scientific Officer cadres; SSC CGL
- **Global Licensing (3):** HCPC Registration (UK → Registered Operating Department Practitioner); MS Surgical Technology / Clinical Anesthesia Science (USA/Australia); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** Certified Registered Central Service Technician (CRCST — HSPA); AHA ACLS & BLS Instructor Badging; NABH / QCI OT Quality & Infection Control Auditor; Advanced Mechanical Ventilation & Airway Management Specialization
- **Entrepreneurial (4):** B2B CSSD Outsourcing Setup for Local Clinics; Surgical Instrument & Laparoscopic Equipment Supply Network; OT Cleanroom Validation & Environmental Advisory Firm; Medical Gas Pipeline & Preventive Maintenance Bureau
- **Research (4):** Perioperative Infection Control System Optimization; Anesthetic Gas Scavenging Setup Assessments; Surgical Instrument Ergonomic Quality Profiles; Patient Safety Protocols in High-Volume Emergency Surgeries
- **Emerging (4):** Mixed-Reality (MR) Guided Real-Time Surgical Navigation Systems; Closed-Loop Automated Anesthesia Delivery Platforms; Autonomous Robotic Instrument Management & Sterility Auditing; Green Operating Theatre Decarbonization Modalities

---

### 19. BASLP
*Bachelor of Audiology & Speech-Language Pathology*
**Regulatory & Standards:** Rehabilitation Council of India (RCI) Act; NCAHP Act; NABH Clinical Audiology & Speech Therapy Standards; WHO Guidelines for Hearing Care; Ministry of Social Justice and Empowerment frameworks

- **PG Pathways (8):** Master of Audiology & Speech-Language Pathology (MASLP); M.Sc. Audiology; M.Sc. Speech-Language Pathology; M.Sc. Neuroscience / Cognitive Sciences; MPH / Epidemiology (Public Health Informatics); MHA; MBA in Healthcare Management / Health Tech Sourcing; 3-Year LL.B. (Disability Rights, Medical Jurisprudence & Bioethics)
- **Frontline (6):** Clinical Audiologist (pure-tone audiometry, tympanometry, ABR/BERA); Speech-Language Pathologist (SLP); Pediatric Feeding & Swallowing Therapist; Hearing Aid Dispensing & Programming Specialist; Cochlear Implant Clinical Mapping Specialist; School-Based Speech & Hearing Screening Officer
- **Non-Traditional (4):** Industrial Noise & Occupational Hearing Conservation Auditor; Voice Biomarker Data Analysis Specialist; Aviation & Military Communications Auditory Consultant; Tele-Speech Rehabilitation Pipeline Architect
- **Government (6):** AIIMS / Central Government Hospital Senior Audiologist; AYJNISHD Technical Officer; State MRB Institutional Tiers; Rashtriya Bal Swasthya Karyakram (RBSK) District Coordinator; DRDO Acoustical Scientist; EVS / State Pollution Control Board Noise Pollution Inspector
- **Civil Services (3):** UPSC CSE; State PSC Group-A Administrative / Scientific Officer Cadres; SSC CGL
- **Global Licensing (3):** ASHA Clinical Certification (CCC-A / CCC-SLP — USA); HCPC Registration (UK); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** Auditory-Verbal Therapy (AVT) International Certification; LSVT LOUD Global Accreditation; Advanced Vestibular Evaluation & VNG Competency Badging; FEES Clinical Competency
- **Entrepreneurial (4):** Independent Speech & Hearing Diagnostic Hub Networks; Specialized Neonatal Auditory Screening Outsourcing Venture; Corporate Voice Training & Executive Presence Advisory Firm; Custom Ear-Mold & Hearing Protection Manufacturing Lab
- **Research (4):** Neuroplasticity Optimization in Late-Implanted Cochlear Recipients; Automated ML Algorithms for Pediatric Speech Sound Profiling; Genetic Mapping of Nonsyndromic Congenital Sensorineural Hearing Loss (GJB2); Efficacy Matrices of CAEP in Device Fittings
- **Emerging (4):** Brain-Computer Interface (BCI) Synthesized Speech Generation; Gene-Therapy Infusion Architectures for Inner Ear Hair Cell Regeneration; Spatial Augmented Reality Environments for Cognitive Aphasia Rehab; Deep-Learning Edge-AI Real-Time Cocktail-Party Voice Isolators

---

### 20. B.Sc. Cardiac Care
*B.Sc. Cardiac Care Technology & B.Sc. Perfusion Technology*
**Regulatory & Standards:** NCAHP Act – Cardiovascular, Thoracic and Perfusion Technology Cadre; NABH Cardiovascular & Cath Lab Standards; CDSCO Medical Device Rules (Class C/D); ICMR CVD Guidelines; Board of Cardiovascular Perfusion India (BCP-I); AACP Global Standards

- **PG Pathways (9):** M.Sc. Cardiovascular Technology; M.Sc. Echocardiography; M.Sc. Perfusion Technology; M.Sc. Cardiovascular Thoracic Sciences / Surgical Perfusion; M.Sc. Clinical Research / Electrophysiology Data Analytics; MPH / Epidemiology (Non-Communicable Diseases); MHA; MBA in Healthcare Management / Health-Tech Sourcing; 3-Year LL.B. (High-Risk Clinical Liability, Bioethics & Device Patent Laws)
- **Frontline (6):** Cath Lab Technologist; Clinical Perfusionist; Echocardiography Technologist; Cardiac Electrophysiology (EP) Technologist; ECMO Specialist; Pacemaker & ICD Clinic Analyst
- **Non-Traditional (4):** Cardiovascular Cleanroom Quality Validation Specialist; Remote Cardiac Rhythm Monitoring Matrix Operator; Ex-Vivo Organ Perfusion Logistics Tech Specialist; Cardiac Simulator VR Application Engineer
- **Government (6):** AIIMS / Central Government Hospital Senior Cath Lab / Perfusion Technical Cadres; State MRB Institutional Tracks; AFMS Combat Trauma Perfusion Tiers; ESIC Hospital Cardiovascular Department; SGPGIMS Technical Officer; Indian Patent Office Examiner (Medical Device & Surgical System Classifications)
- **Civil Services (3):** UPSC CSE; State PSC Group-A Science & Technology Administrative Cadres; SSC CGL
- **Global Licensing (3):** Board of Cardiovascular Perfusion India (BCP-I) Board Certification (mandatory national credential); European Board of Cardiovascular Perfusion (EBCP); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** AHA ACLS Elite Instructor Status; Advanced Intra-Aortic Balloon Pump (IABP) Operations; PALS Credentialing; Advanced Mechanical Circulatory Support (MCS) Systems Accreditation
- **Entrepreneurial (4):** Independent Turnkey Cath Lab Technical Management Outsourcing Firm; Outsourced Mobile Perfusionist & ECMO Emergency Deployment Network; Cardiac Diagnostic & Remote Holter Telemetry Monitoring Hub; Cardiovascular Surgical Consumables Specialized Distribution Grid
- **Research (4):** Biocompatibility Optimization of Extracorporeal Circuit Polymer Liners; Hemodynamic Modeling of Shear Stress in Transcatheter Aortic Valves; ML Predictive Analytics for Post-Cardiotomy ECMO Weaning; Myocardial Protection Strategies During Extended Aortic Cross-Clamping
- **Emerging (4):** Mixed-Reality Super-Imposed Real-Time 3D Electrophysiology Mapping; Closed-Loop Automated Extracorporeal Flow Regulators; Ex-Vivo Total Artificial Heart Bio-Engineering Paradigms; Nanotechnology-Enabled Target Thrombolytic Delivery Vectors

**Engine notes:** the only doc where a domestic board certification (BCP-I) is described as a **mandatory** prerequisite for independent practice — treat as a hard gate, not a recommendation.

---

### 21. B.Sc. Respiratory Therapy
*B.Sc. Respiratory Therapy (B.RT)*
**Regulatory & Standards:** NCAHP Act – Cardiovascular, Thoracic and Perfusion Technology Cadre (Respiratory Therapy Sub-Cadres); NABH Critical Care & OT Standards; ISCCM Mechanical Ventilation Guidelines; MoHFW NPCDCS Pulmonary Verticals; AARC Global Recommendations

- **PG Pathways (6):** M.Sc. Respiratory Therapy; M.Sc. Critical Care Technology; MPH / Epidemiology (Environmental & Chronic Lung Health); MHA; MBA in Healthcare Management / Health-Tech Venture Operations; 3-Year LL.B. (Critical Care Liability, Bioethics & Environmental Health Compliance)
- **Frontline (6):** Clinical Respiratory Therapist; Adult & Pediatric Critical Care Therapist; Pulmonary Function Test (PFT) Lab Specialist; Polysomnography (Sleep Lab) Technologist; Pulmonary Rehabilitation & Chest Physiotherapy Specialist; Home Respiratory Care Coordinator
- **Non-Traditional (4):** High-Altitude & Aerospace Physiology Respiratory Consultant; Hyperbaric Oxygen Therapy (HBOT) Chamber Operator; Neonatal Transport Ventilation Logistics Specialist; Pulmonary Drug Delivery Device Aerosol Scientist
- **Government (6):** AIIMS / Central Government Hospital Senior Respiratory Therapist; State MRB Institutional Tiers; NITRD Core Technical Officer; AFMS Aeromedical Evacuation Tiers; ESIC Hospital Respiratory Medicine Technical Tiers; Central Pollution Control Board (CPCB) Pulmonary Health Impact Assessor
- **Civil Services (3):** UPSC CSE; State PSC Group-A Science & Technology Administrative Cadres; SSC CGL
- **Global Licensing (3):** NBRC Advanced Respiratory Therapist (CRT/RRT — USA); CSRT Professional Registration (Canada); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** AHA ACLS Elite Instructor Status; NRP Advanced Credentialing; Advanced Mechanical Ventilation and ARDS Management Accreditation; Certified Pulmonary Function Technologist (CPFT)
- **Entrepreneurial (4):** Independent Turnkey Home Respiratory & Sleep Diagnostics Agency; Outsourced Pulmonary Rehabilitation Clinic Networks; Critical Care Ventilator Fleet Rental & Technical Maintenance Firm; Medical Gas Safety & Terminal Pipeline Auditing Bureau
- **Research (4):** AI-Driven Predictive Modeling for Mechanical Ventilation Weaning Failure; Dynamic Electrical Impedance Tomography (EIT) for Real-Time ARDS Lung Recruitment; Aerosol Deposition Mechanics in HFNC Pathways; Long-Term Pulmonary Pathophysiology Profiles in Electronic Nicotine Delivery Systems
- **Emerging (4):** Holographic Mixed-Reality Airway Mapping for High-Risk Intubations; Closed-Loop Algorithmic Diaphragmatic Neuro-Stimulation Frameworks; Extracorporeal Micro-Channel Artificial Lung Membrane Integration; Nanotechnology Aerosols for Target Pulmonary Surfactant Delivery

---

### 22. BOT
*Bachelor of Occupational Therapy*
**Regulatory & Standards:** NCAHP Act – Occupational Therapy Cadre; All India Occupational Therapists' Association (AIOTA); NABH Rehabilitation & Accessibility Standards; Rights of Persons with Disabilities (RPwD) Act; WFOT Minimum Standards

- **PG Pathways (8):** MOT – Pediatrics / Neurology; MOT – Mental Health & Psychiatric Rehabilitation; MOT – Musculoskeletal / Ergonomics & Work Rehabilitation; MOT – Hand & Upper Extremity Rehabilitation; MPH / Disability Informatics; MHA; MBA in Healthcare Management / Assistive Technology Venturing; 3-Year LL.B. (Accessibility Law, Medical Malpractice & Disability Advocacy)
- **Frontline (6):** Clinical Occupational Therapist; Sensory Integration Therapist; Hand Therapy Specialist; Psychosocial Rehabilitation Therapist; Geriatric Independence Coordinator; Assistive Technology & Wheelchair Seating Specialist
- **Non-Traditional (4):** Universal Design & Architectural Accessibility Auditor; Virtual Reality Rehabilitation Experience Designer; Corporate Wellness & Musculoskeletal Safety Lead; Adaptive Driver Training & Vehicle Modification Consultant
- **Government (6):** AIIMS / Central Government Hospital Senior Occupational Therapist; NIEPMD Technical Officer; State MRB Institutional Frames; RBSK Early Intervention Specialist; AFMS Combat Rehab Cadres; Special Education & Social Welfare District Rehabilitation Officer
- **Civil Services (3):** UPSC CSE; State PSC Group-A Administrative / Scientific Officer Cadres; SSC CGL
- **Global Licensing (3):** NBCOT Certification (OTR — USA); HCPC Registration (UK); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** USC Sensory Integration Certification (CE) / Ayres Sensory Integration (ASI) Badging; Certified Kinesio Taping Practitioner (CKTP); Neuro-Developmental Treatment (NDT) International Certification; Certified Ergonomic Assessment Specialist (CEAS)
- **Entrepreneurial (4):** Independent Pediatric Development & Sensory Integration Hub Networks; Turnkey Corporate Ergonomic Consulting & Audit Firm; Custom Assistive Device & Universal Living Modification Bureau; Outsourced Geriatric Care and ADL Conditioning Network
- **Research (4):** Neuroplastic Mechanics of Cortical Re-Mapping Through Constraint-Induced Movement Therapy; Efficacy of VR Immersive Environments on Executive Cognitive Function Recovery; Biomechanical Interventions for Upper Limb Tendon Transfer Dynamic Splinting; Cross-Cultural Standardization of Pediatric ADL Evaluation Matrices
- **Emerging (4):** Holographic Mixed-Reality Workstation Simulation for Cognitive Vocational Rehab; Closed-Loop Myoelectric Exo-Skeletal Upper Limb Orthotic Calibration; BCI-Driven Assistive Smart Home Integration Platforms; Bioprinted Custom-Molded Orthotic Matrix Fabrication Modalities

---

### 23. B.Sc. PA
*B.Sc. Physician Assistant / Physician Associate*
**Regulatory & Standards:** NCAHP Act – Physician Assistant / Associate Cadre; Clinical Establishments (Registration and Regulation) Act; NABH Clinical Audit & Patient Safety Standards; MoHFW Allied Health Operational Guidelines; IAPAE Global Standards

- **PG Pathways (6):** M.Sc. Physician Assistant / Advanced Clinical Practice; M.Sc. Clinical Research / Regulatory Affairs; MPH / Epidemiology; MHA; MBA in Healthcare Management / Health Insurance Operations; 3-Year LL.B. (Medical Jurisprudence, Healthcare Compliance & Informed Consent Law)
- **Frontline (6):** Surgical Physician Assistant & First Assistant; Outpatient Clinic Practitioner & Care Coordinator; Inpatient Ward Management Specialist; ICU Critical Care Associate; Emergency Medicine & Trauma Triage Officer; Specialty Care Pathway Manager (Cardiology / Oncology / Nephrology)
- **Non-Traditional (4):** Medical Simulation Training Specialist; Digital Health & Tele-Triage Clinical Expert; Corporate Occupational Health & Wellness Clinician; Health Informatics & Clinical Documentation Improvement (CDI) Specialist (ICD-10/11)
- **Government (5):** AIIMS / Central Government Hospital Physician Assistant; State MRB Cadres; NHM District Program Coordinator; ESIC Specialty Care Wings; Indian Railways Medical Services Clinical Support Cadres
- **Civil Services (3):** UPSC CSE; State PSC Group-A Healthcare Administrative / Scientific Officer Cadres; SSC CGL
- **Global Licensing (3):** NCCPA PANCE Pathway (PA-C — USA); PAMVR Professional Registration (Physician Associate — UK, GMC registers); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** AHA ACLS Provider Status; Advanced Trauma Life Support (ATLS) Audit Credentialing; Certified Clinical Research Associate (CCRA); Advanced Cardiovascular / Surgical Skill Micro-Credentials (FAST scans, central lines, arterial punctures)
- **Entrepreneurial (4):** Independent Turnkey Clinical Documentation & Auditing Agency; Outsourced Medical Simulation Training & Skill Lab Ventures; Chronic Disease Remote Care Monitoring & Tele-Triage Platforms; Healthcare Manpower Logistics & Clinical Care Pathway Consulting Firm
- **Research (4):** Impact of PA Integration on Reducing ER Discharge Cycle Times; Efficacy of Standardized Clinical Care Pathways Managed by PAs in Chronic Heart Failure; Comparative Accuracy of ML-Driven Pre-Authorization Coding vs Expert Clinical Audits; Multi-Centric Data Protocols for Rare Disease Registries Using EHRs
- **Emerging (4):** AI-Assisted Predictive Ambient Clinical Documentation Synthesizers; Spatial Mixed-Reality Navigation Arrays for Pre-Operative Surgical Planning; Autonomous Tele-Triage Diagnostic Algorithmic Validation Protocols; Precision Genomics Data Translation for Personalized Care Pathways

---

### 24. B.Sc. Emergency & Trauma Care
*B.Sc. Emergency Medical Technology / Trauma Care Technology*
**Regulatory & Standards:** NCAHP Act – Trauma and Emergency Care Cadre; NABH Emergency & Resuscitation Services Standards; NDMA Mass Casualty Management Guidelines; MoHFW National EMS Operational Guidelines; College of Emergency Medicine (UK) / ACEP International Resuscitation Protocols

- **PG Pathways (6):** M.Sc. Emergency Medicine Technology / Advanced Emergency Medical Care; M.Sc. Trauma and Critical Care Technology; MPH / Emergency Epidemiology & Disaster Medicine; MHA; MBA in Healthcare Management / Health Logistics Venturing; 3-Year LL.B. (Tort Law, Emergency Liability & Good Samaritan Legislation)
- **Frontline (6):** Advanced Emergency Medical Technologist (AEMT); Trauma Care Resuscitation Specialist; Critical Care Transport Paramedic / Flight Paramedic; Disaster Response & Triage Command Officer (START/JumpSTART); Poison Control & Toxicological Emergency Specialist; Cardiac Arrest Rapid Response Team Leader
- **Non-Traditional (4):** Offshore Oil Rig & Marine Emergency Medical Coordinator; Tactical Emergency Medical Services (TEMS) Consultant; Wilderness & Remote Expedition Medicine Logistics Specialist; Ambulance Tele-Triage & AI-Driven Dispatch Allocator
- **Government (5):** AIIMS / Central Government Hospital Emergency Medical Technologist; State MRB Institutional Frames; National Disaster Response Force (NDRF) Medical Battalion Officer; ESIC Emergency Infrastructure Wards; Municipal Corporation Fire & Emergency Services Paramedic Cadres
- **Civil Services (3):** UPSC CSE; State PSC Group-A Health Administrative / Scientific Officer Cadres; SSC CGL
- **Global Licensing (3):** NREMT Paramedic Certification (USA); HCPC Paramedic Registration (UK); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** AHA ACLS Elite Instructor Status; International Trauma Life Support (ITLS) Advanced Provider; PALS Advanced Credentialing; Certified Flight Paramedic (FP-C)
- **Entrepreneurial (4):** Independent Turnkey Private Ambulance Fleet & Tech-Enabled EMS Network; Corporate Industrial Disaster Preparedness & Crisis Simulation Consultancy; On-Demand Event Medical Architecture & Extreme Sports Rescue Bureau; Advanced First Responder Training & Skill Simulation Institutes
- **Research (4):** Neuroprotective Efficacy of Ultra-Early Therapeutic Hypothermia in Out-of-Hospital Cardiac Arrest; Comparative Accuracy of ML Triage Algorithms vs Human Scoring in Multi-System Trauma; Biomechanical Shear Force Dynamics on Cervical Spine During Rapid Vehicle Extraction; Efficacy of Tranexamic Acid (TXA) Micro-Dosing in Pre-Hospital Severe Hemorrhagic Shock
- **Emerging (4):** Autonomous Drone-Delivered AED Dispatch Networks; Spatial Mixed-Reality Glasses for Real-Time Remote Tele-Trauma Surgery Guidance; Closed-Loop Automated Fluid Resuscitation Systems for Burn Trauma Care; Topological Density 3D-Printed Custom Field Splints and Airway Stabilization Devices

---

### 25. B.Sc. Neuro-Electrophysiology
*B.Sc. Neuro-Electrophysiology / Neurodiagnostic Technology*
**Regulatory & Standards:** NCAHP Act – Medical Laboratory and Science Cadre / Neuro-Diagnostic Cadres; NABH Clinical Diagnostic Standards; Indian Academy of Neurology (IAN) Diagnostic Guidelines; RCI Neurodevelopmental Assessment Frameworks; ASNM / ACNS International Practice Standards

- **PG Pathways (8):** M.Sc. Neuro-Electrophysiology / Advanced Neurodiagnostic Technology; M.Sc. Neuroscience / Cognitive Science; M.Sc. Clinical Research / Neuro-Device Trials; MPH / Chronic Disease Epidemiology; MHA; MBA in Healthcare Management / Neuromodulation Device Commercial Operations; M.Sc. Health Informatics / Neuro-Informatics; 3-Year LL.B. (Neuro-Ethics, Brain Death Jurisprudence & Malpractice Law)
- **Frontline (6):** Senior Electroencephalography (EEG) Technologist; Intraoperative Neurophysiological Monitoring (IONM) Specialist (SSEP/MEP/EMG); Polysomnography (PSG) & Sleep Disorders Technologist; Nerve Conduction Study (NCS) & EMG Associate; Evoked Potential (EP) Clinical Diagnostician (VEP/BAER); Autonomic Function Testing Specialist
- **Non-Traditional (4):** Brain-Computer Interface (BCI) Signal Processing Engineer; Consumer Sleep-Tech Data Product Analyst; Neuromarketing Consumer Biometrics Evaluator; Neuromorphic Hardware System Validation Specialist
- **Government (5):** AIIMS / Central Government Hospital Senior Neuro-Electrophysiology Technologist; State MRB Institutional Frames; NIMHANS Technical Officer; ESIC Neurological Diagnostics Wards; AFMS Specialized Neuro-Labs
- **Civil Services (3):** UPSC CSE; State PSC Group-A Health Administrative / Scientific Officer Cadres; SSC CGL
- **Global Licensing (3):** ABRET Certification (R.EEG.T. / R.PSG.T. — USA); RPSGT Board of Registered Polysomnographic Technologists (Global); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** Certified Nerve Conduction Technologist (CNCT — AAET); Certification in Intraoperative Neurophysiological Monitoring (CNIM — ABRET); Quantitative EEG (qEEG) Diplomat / Technologist Badging; Advanced Sleep Titration Micro-Credentials (ASV, BiPAP)
- **Entrepreneurial (4):** Independent Turnkey Sleep Disorders Diagnostics & Ambulatory PSG Bureaus; qEEG & Neuro-Feedback Brain Mapping Centers; Outsourced IONM Contractor Agency; Corporate Neuromarketing and Biometric Consumer Insights Consultancy
- **Research (4):** Early Biomarker Identification in Prodromal Parkinson's Disease via High-Density qEEG Coherence Matrixes; Efficacy of Intracranial Stereo-EEG (sEEG) Signal Mapping in Insular Cortex Epileptogenic Zones; Biomechanical Shear Stress Impacts on Cortical Array Signal Quality; Comparative Accuracy of Deep Learning CNNs vs Expert Sleep Board Technologists
- **Emerging (4):** Holographic Mixed-Reality Real-Time Scalp Projection of Deep-Brain sEEG Current Densities; Closed-Loop Adaptive Deep Brain Stimulation via Real-Time LFP Tracking; BCI Non-Invasive Motor Imagery Synthesis for Severe Quadriplegia Rehabilitation; Topological Density 3D-Printed Custom Dry-Sensor High-Density EEG Cap System Fabrication

---

### 26. B.Sc. Nuclear Medicine
*B.Sc. Nuclear Medicine Technology*
**Regulatory & Standards:** AERB Safety Code for Nuclear Medicine Facilities; NCAHP Act – Medical Radiation Technology Cadre; BARC Radionuclide Handling Protocols; NABH Diagnostic Imaging & Radiation Safety Standards; Society of Nuclear Medicine India (SNMI) Clinical Practice Guidelines

- **PG Pathways (6):** M.Sc. Nuclear Medicine Technology / Advanced Molecular Imaging; M.Sc. Medical Physics / Radiological Physics (AERB Dip.RP Route); M.Sc. Molecular Theranostics & Radiopharmaceutical Sciences; MPH / Environmental Radiation Health; MHA; MBA in Healthcare Management / Radiopharmaceutical Venturing *(no LL.B. track in this doc)*
- **Frontline (6):** PET-CT / PET-MRI Imaging Technologist; SPECT / SPECT-CT Gamma Camera Technologist; Radiopharmaceutical Hot Lab Specialist (Tc-99m, F-18, I-131, Lu-177); Radionuclide Therapy Technical Associate; Radiological Quality Control & Dose Calibrator Technician; Clinical Radiation Decontamination & Waste Handling Officer
- **Non-Traditional (4):** Industrial Cyclotron Targetry & Synthesis Systems Engineer; AI-Driven Medical Image Segmentation Analytics Expert (SUV); Radiopharmaceutical Cold-Chain Logistics Optimization Planner; Pre-Clinical Molecular Imaging Core Research Operator
- **Government (5):** AIIMS / Central Government Hospital Senior Nuclear Medicine Technologist; BARC / Board of Radiation & Isotope Technology (BRIT) Technical Officer; State MRB Institutional Frames; ESIC Oncology Diagnostic Wings; Homi Bhabha Cancer Hospital & Research Centre Specialized Technical Cadres
- **Civil Services (3):** UPSC CSE; State PSC Group-A Health Administrative / Scientific Officer Cadres; SSC CGL
- **Global Licensing (3):** NMTCB Certification (CNMT — USA); ARRT Nuclear Medicine Technology Registration (USA/Global); Allied Health Professional Licensing Exams (Middle East — DHA, HAAD, MOH)
- **Certifications (4):** AERB Radiological Safety Officer (RSO Level-II) — *mandatory statutory credential*; EANM Advanced Technologist Badging; Advanced PET-MRI Fusion Hybrid Imaging Micro-Credentials; Good Radiopharmacy Practice (GRPP) Compliance Certification
- **Entrepreneurial (4):** Independent Turnkey Molecular Imaging Hubs & Standalone PET-CT Networks; Outsourced Radiation Safety Compliance & AERB Licensing Consultancy; Specialized Radiopharmaceutical Cold-Chain Logistics & Distribution Bureau; Advanced Hybrid Imaging Technical Skill Training & Simulation Academies
- **Research (4):** Quantifying Target-to-Background Ratio Optimizations in Novel Copper-64 Radioligand Formulations; Comparative Accuracy of ML-Driven Attenuation Correction vs CT-Derived Maps in PET-MRI; Biomechanical Shear Stress Impacts on Microfluidic Radiosynthesis Chips; Efficacy of Targeted Alpha Therapy (TAT) Actinium-225 Matrices in Overcoming Radioresistance
- **Emerging (4):** Holographic Mixed-Reality Real-Time Projection of 3D PET Parametric Tumor SUV Maps; Closed-Loop Automated Micro-Dosimetry Radioligand Therapy Systems; Quantum-Dot Enhanced Scintillation Crystals for Ultra-High Resolution Gamma Cameras; Topological Density 3D-Printed Custom Radionuclide Infusion Shielding Devices

---

## 5. Parsing caveats for implementers

1. **Doc 3 (B.Sc. Agriculture)** has no "Integrated Academic & Career Topology" subtitle; line 2 is the regulatory framework.
2. **Doc 15 (B.Optom)** has a stray column-0 line ("Extended Reality (XR) Ambient Binocular Vision Therapy Loops") that belongs to its Emerging section, not a new doc.
3. **Docs 16–17** switch to flat/numbered formatting; **docs 18–26** use flat bullets where item and description alternate — a depth-based parser will mis-nest them.
4. In docs 18–26 the PG section is a flat run of `Degree, Node, Node, Role, Role, Role, Role`; group in 7s (except doc 20, which has a 63-item run over 9 degrees).
5. Employer/setting names and job titles are interleaved without markers in docs 1–15; only doc 17 labels them explicitly.
6. Typos preserved from source: "Enzyomology" (B.Sc. Biochemistry), "gomAD" (should be gnomAD, B.Sc. Bioinformatics), "positive end-exppiratory" (B.Sc. Respiratory Therapy), "Corporate Corporate Medical Centers" (B.Sc. Nursing), "Empowerment Empowerment Frameworks" (BASLP), "Neuro-Diagnostic Diagnostic Throughput Architect" (Neuro-EP), "insurance insurance-backed" (Cardiac Care).
