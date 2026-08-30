import React from "react";
import { CareerPath } from "../../types";
import { motion } from "motion/react";
import { getCareerIntelligence } from "../../lib/careerIntelligence";
import {
  AlertCircle,
  ArrowUpRight,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  ChevronRight,
  Clock,
  Gauge,
  Globe2,
  GraduationCap,
  Layers,
  Network,
  ShieldAlert,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";

interface CareerDetailViewProps {
  path: CareerPath;
  onBack: () => void;
  onContinue: () => void;
  requiresHigherEducation?: boolean;
  compareList?: CareerPath[];
  onToggleCompare?: (path: CareerPath) => void;
}

export default function CareerDetailView({ 
  path, 
  onBack, 
  onContinue, 
  requiresHigherEducation = true,
  compareList = [],
  onToggleCompare
}: CareerDetailViewProps) {
  const detail = getCareerIntelligence(path.fieldName);
  const isSelected = compareList.some(p => p.id === path.id);

  const reqUni = ["medicine", "engineering", "law", "research", "architecture", "psychology", "business", "data science", "bioinformatics", "computational biology", "clinical data", "healthcare consulting", "strategy consulting", "hospital administration", "medical affairs", "regulatory", "computer science"].some(r => path.fieldName.toLowerCase().includes(r));

  return (
    /* No `min-h-screen` and no page fill. This view renders inside the app's
       content canvas, which is already a white pane with its own height and its
       own 40px corners — a full-height grey rectangle in it painted a hard-edged
       block over the top of the pane it was sitting in. */
    <div className="pb-16 text-ink-900 selection:bg-moss-200">

      {/* HERO SECTION
          Shorter than it was (70vh of photograph is a landing page, not a
          detail view) and no longer full-bleed: it is a plate with the same
          radius as the panels under it. Bleeding it to the canvas edge meant
          relying on the canvas to clip its top corners, which worked and left
          the bottom two square against the content below. */}
      <div className="media relative h-[34vh] min-h-[240px] w-full rounded-3xl sm:h-[42vh] sm:min-h-[320px]">
        <img
          src={path.heroImage}
          alt={path.fieldName}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-transparent" />
        
        {/* Top Nav (Back) */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Back to paths
          </button>
        </div>

        {/* Hero Content
            The type came down with the hero. It was 7xl on a 70vh plate, which
            is a landing-page proportion — at the height this block is now, a
            72px headline leaves room for the headline and nothing else. */}
        <div className="absolute bottom-0 left-0 right-0 z-20 mx-auto flex max-w-5xl flex-col items-start p-4 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-micro font-bold uppercase tracking-widest text-ink-900">
            <Star className="h-3.5 w-3.5 text-moss-600" />
            {path.matchScore}% match
          </div>

          <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-e3 sm:text-4xl">
            {path.fieldName}
          </h1>

          <p className="mb-5 max-w-3xl text-sm font-medium leading-relaxed text-white/90 drop-shadow-e2 sm:text-base">
            {path.oneLineRecommendation}
          </p>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              onClick={onContinue}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-900 transition-colors hover:bg-ink-100 sm:text-sm"
            >
              {reqUni ? (
                <>
                  <BookOpen className="h-4 w-4" />
                  View universities
                </>
              ) : (
                <>
                  <Target className="h-4 w-4" />
                  Explore skill roadmap
                </>
              )}
            </button>

            {onToggleCompare && (
              <button
                onClick={() => onToggleCompare(path)}
                className={`flex items-center justify-center gap-2 rounded-full border px-6 py-2.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors sm:text-sm ${
                  isSelected
                    ? "border-moss-400/50 bg-moss-400/25 text-white"
                    : "border-white/25 bg-white/15 text-white hover:bg-white/25"
                }`}
              >
                <Layers className="h-4 w-4" />
                {isSelected ? "Comparing" : "Compare"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 py-8 sm:space-y-14 sm:py-10">
        
        {/* SECTION 1: Why Northr Recommended This */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <Star className="h-5 sm:h-6 w-5 sm:w-6 text-moss-600" />
              Why This Is For You
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {path.whyThisMatchesYou.map((reason, i) => (
              <div key={i} className="bg-white border border-ink-200 rounded-2xl p-5 sm:p-6 shadow-e2 flex items-start gap-4">
                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-md bg-moss-50 flex items-center justify-center border border-moss-100">
                  <Target className="h-4 w-4 text-moss-700" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-ink-600 leading-relaxed">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Career Snapshot */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <Gauge className="h-5 sm:h-6 w-5 sm:w-6 text-info-500" />
              Career Snapshot
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: "Future Demand", value: detail.futureDemand, icon: TrendingUp },
              { label: "Salary Range", value: detail.salaryRange, icon: Briefcase },
              { label: "Global Demand", value: detail.globalOpportunities.growthRegions || path.keyInsights.globalMobility, icon: Globe2 },
              { label: "AI Resilience", value: detail.aiRisk, icon: ShieldAlert },
              { label: "Years to Enter", value: detail.yearsToEnter, icon: Clock },
              { label: "Work Style", value: detail.workEnvironment, icon: Building2 },
              { label: "Difficulty", value: path.keyInsights.difficultyToEnter, icon: Target },
              { label: "Work-Life Balance", value: path.keyInsights.workLifeBalance, icon: Clock }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-ink-200 rounded-2xl p-3.5 sm:p-5 shadow-e2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <stat.icon className="h-3.5 w-3.5 text-ink-500" />
                  <span className="text-micro sm:text-micro font-bold uppercase tracking-widest text-ink-500 truncate">{stat.label}</span>
                </div>
                <p className="text-xs sm:text-sm md:text-base font-bold text-ink-900 leading-snug">{stat.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: A Day In The Life */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <Clock className="h-5 sm:h-6 w-5 sm:w-6 text-moss-600" />
              A Day In The Life
            </h2>
          </div>
          <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-8 shadow-e2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-moss-50 rounded-bl-full -mr-8 -mt-8 sm:-mr-10 sm:-mt-10 opacity-50" />
            <p className="text-sm sm:text-lg text-ink-600 leading-relaxed sm:leading-loose relative z-10 font-medium">
              {detail.dayInTheLife}
            </p>
          </div>
        </section>

        {/* SECTION 4: Career Roadmap */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <ArrowUpRight className="h-5 sm:h-6 w-5 sm:w-6 text-moss-600" />
              Career Roadmap
            </h2>
          </div>
          <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-8 shadow-e2">
            <div className="relative border-l-2 border-ink-200 ml-1 sm:ml-4 space-y-8 sm:space-y-12">
              {reqUni && (
                <div className="relative pl-6 sm:pl-8">
                  <div className="absolute -left-[5px] sm:-left-[9px] top-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-ink-100 border-2 border-ink-300" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1.5 sm:mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-ink-900">Foundational Education</h3>
                    <span className="self-start text-micro sm:text-xs font-bold uppercase tracking-wider text-ink-600 bg-ink-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
                      Degree
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-medium">
                    {detail.education.degrees[0] || "Target a relevant bachelor's degree"} and participate in undergraduate internships.
                  </p>
                </div>
              )}
              {detail.timeline.map((stage, i) => (
                <div key={i} className="relative pl-6 sm:pl-8">
                  <div className="absolute -left-[5px] sm:-left-[9px] top-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-moss-100 border-2 border-moss-500" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1.5 sm:mb-2">
                    <h3 className="text-base sm:text-lg font-bold text-ink-900">{stage.title}</h3>
                    <span className="self-start text-micro sm:text-xs font-bold uppercase tracking-wider text-moss-700 bg-moss-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
                      {stage.exp}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-medium">
                    {stage.desc}
                  </p>
                </div>
              ))}
              <div className="relative pl-6 sm:pl-8">
                <div className="absolute -left-[5px] sm:-left-[9px] top-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-moss-100 border-2 border-moss-500" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1.5 sm:mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-ink-900">Specialization</h3>
                  <span className="self-start text-micro sm:text-xs font-bold uppercase tracking-wider text-moss-700 bg-moss-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
                    10+ Years
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-ink-600 leading-relaxed font-medium">
                  Establish yourself as a domain expert, lead departments, or transition into independent consulting and advanced strategy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: Skills Required */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <Network className="h-5 sm:h-6 w-5 sm:w-6 text-good-500" />
              Skills Required
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-4 sm:mb-6">Technical Skills</h3>
              <div className="space-y-4">
                {detail.skills.technical.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-ink-900 mb-1.5">
                      <span>{s.name}</span>
                    </div>
                    <div className="h-1.5 w-full bg-ink-100 rounded-md overflow-hidden">
                      <div className="h-full bg-good-500 rounded-md" style={{ width: `${s.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-4 sm:mb-6">Soft Skills</h3>
              <div className="space-y-4">
                {detail.skills.soft.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-ink-900 mb-1.5">
                      <span>{s.name}</span>
                    </div>
                    <div className="h-1.5 w-full bg-ink-100 rounded-md overflow-hidden">
                      <div className="h-full bg-info-500 rounded-md" style={{ width: `${s.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-4 sm:mb-6">Emerging Skills</h3>
              <div className="space-y-4">
                {detail.skills.emerging.map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs sm:text-sm font-bold text-ink-900 mb-1.5">
                      <span>{s.name}</span>
                    </div>
                    <div className="h-1.5 w-full bg-ink-100 rounded-md overflow-hidden">
                      <div className="h-full bg-moss-500 rounded-md" style={{ width: `${s.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2 lg:col-span-3">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-4">Transferable Skills</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {detail.thriveTraits.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-ink-50 border border-ink-200 text-ink-700 rounded-xl text-xs sm:text-sm font-bold shadow-e2">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: Industries & Global */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <Globe2 className="h-5 sm:h-6 w-5 sm:w-6 text-info-500" />
              Industries & Global Hubs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">Top Industries</h3>
              <ul className="space-y-2 sm:space-y-3">
                {detail.globalOpportunities.industries.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-ink-900">
                    <span className="text-info-300 mt-0.5">•</span> {ind}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">Top Recruiters</h3>
              <ul className="space-y-2 sm:space-y-3">
                {detail.globalOpportunities.employers.map((emp, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-ink-900">
                    <span className="text-info-300 mt-0.5">•</span> {emp}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">Top Countries</h3>
              <ul className="space-y-2 sm:space-y-3">
                {detail.globalOpportunities.countries.map((country, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-ink-900">
                    <span className="text-info-300 mt-0.5">•</span> {country}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 7: Education Pathways */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <GraduationCap className="h-5 sm:h-6 w-5 sm:w-6 text-bad-500" />
              Education Pathways
            </h2>
          </div>
          <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-8 shadow-e2 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
            <div>
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3 sm:mb-4">Recommended Degrees</h3>
              <ul className="space-y-2 sm:space-y-3">
                {detail.education.degrees.map((d, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-md bg-bad-50 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-3 w-3 text-bad-500" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-ink-900">{d}</span>
                  </li>
                ))}
              </ul>
              
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3 sm:mb-4 mt-6 sm:mt-8">Masters & Specializations</h3>
              <ul className="space-y-2 sm:space-y-3">
                {detail.education.masters.map((m, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-md bg-bad-50 flex items-center justify-center shrink-0">
                      <Award className="h-3 w-3 text-bad-500" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-ink-900">{m}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3 sm:mb-4">Professional Certifications</h3>
              <ul className="space-y-2 sm:space-y-3">
                {detail.education.certifications.map((c, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-md bg-ink-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-3 w-3 text-ink-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-ink-600">{c}</span>
                  </li>
                ))}
              </ul>

              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-3 sm:mb-4 mt-6 sm:mt-8">Alternative Routes</h3>
              <ul className="space-y-2 sm:space-y-3">
                {[...detail.education.alternative, ...detail.education.bridgePrograms].map((alt, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-md bg-ink-100 flex items-center justify-center shrink-0">
                      <Layers className="h-3 w-3 text-ink-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-ink-600">{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 8: Future Outlook */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <TrendingUp className="h-5 sm:h-6 w-5 sm:w-6 text-info-500" />
              Future Outlook
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">5-Year Outlook</h3>
              <p className="text-xs sm:text-sm font-bold text-ink-900 leading-relaxed">
                {detail.futureDemandSubtitle}
              </p>
            </div>
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">10-Year Outlook</h3>
              <p className="text-xs sm:text-sm font-bold text-ink-900 leading-relaxed">
                Continued {detail.futureDemand.toLowerCase()} demand as global integration and market sophistication deepens across {detail.globalOpportunities.growthRegions}.
              </p>
            </div>
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">AI Impact</h3>
              <p className="text-xs sm:text-sm font-bold text-ink-900 leading-relaxed">
                {detail.aiSafetySubtitle}
              </p>
            </div>
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2 sm:col-span-2 lg:col-span-1">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">Emerging Opportunities</h3>
              <p className="text-xs sm:text-sm font-bold text-ink-900 leading-relaxed">
                Specializations in {detail.skills.emerging.map(s => s.name).join(", ")} will command premium compensation.
              </p>
            </div>
            <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-6 shadow-e2 sm:col-span-2 lg:col-span-2">
              <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-ink-500 mb-2">Career Risks</h3>
              <p className="text-xs sm:text-sm font-bold text-ink-900 leading-relaxed">
                {detail.struggleWarning}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 9: Challenges */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <AlertCircle className="h-5 sm:h-6 w-5 sm:w-6 text-bad-500" />
              Reality Check & Challenges
            </h2>
          </div>
          <div className="bg-bad-50 border border-bad-100 rounded-3xl p-5 sm:p-8 shadow-e2">
            <p className="text-xs font-bold text-bad-700 mb-4 sm:mb-6 uppercase tracking-wider">Do not oversell. Every career has setbacks.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-bad-700/70 mb-3">Primary Roadblocks</h3>
                <ul className="space-y-2">
                  {detail.realityCheck.challenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-bad-900">
                      <span className="text-bad-300 mt-0.5">•</span> {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-bad-700/70 mb-3">Typical Setbacks</h3>
                <ul className="space-y-2">
                  {detail.realityCheck.typicalSetbacks.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-medium text-bad-900">
                      <span className="text-bad-300 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: Who Thrives Here */}
        <section>
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-ink-900 uppercase tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-5 sm:h-6 w-5 sm:w-6 text-good-500" />
              Who Thrives Here
            </h2>
          </div>
          <div className="bg-good-900 text-good-50 rounded-3xl p-5 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <div>
                <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-good-300 mb-4">Core Traits For Success</h3>
                <div className="flex flex-wrap gap-2">
                  {detail.thriveTraits.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-good-700 border border-good-700 rounded-lg text-xs sm:text-sm font-bold shadow-e2">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-micro sm:text-xs font-bold uppercase tracking-widest text-good-300 mb-4">Struggle Warning</h3>
                <p className="text-xs sm:text-sm sm:text-base font-medium leading-relaxed">
                  {detail.struggleWarning}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11: Next Step */}
        <section className="pt-10 border-t border-ink-200">
          <div className="bg-white border border-ink-200 rounded-3xl p-5 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8 text-center sm:text-left">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-ink-900 tracking-tight mb-2">
                Ready to take the next step?
              </h2>
              <p className="text-ink-600 font-medium text-sm sm:text-lg max-w-xl">
                {reqUni 
                  ? "Explore the best universities worldwide that offer targeted programs for this career."
                  : "Discover the exact certifications, bootcamps, and skills needed to break into this field."}
              </p>
            </div>
            <div className="w-full sm:w-auto shrink-0">
              <button
                onClick={onContinue}
                className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 bg-moss-500 hover:bg-moss-600 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-transform flex items-center justify-center gap-2"
              >
                {reqUni ? (
                  <>
                    <BookOpen className="h-4 sm:h-5 w-4 sm:w-5" />
                    View Universities
                  </>
                ) : (
                  <>
                    <Target className="h-4 sm:h-5 w-4 sm:w-5" />
                    Explore Skill Roadmap
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// Ensure CheckCircle is available
function CheckCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
