import React, { useMemo, useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  Briefcase,
  Heart,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Beaker,
  Target,
} from "lucide-react";
import { CareerConfidence, CareerPath } from "../../types";
import { experienceLibrary } from "../../data/experienceLibrary";
import {
  getCuratedRecommendations,
  DailyReality,
  CognitiveLoad,
  PilotExperience,
} from "../../lib/pilotOrchestrator";

interface DashboardHomeViewProps {
  studentName: string;
  /** The student's real degree, learned from FAB. Empty until they tell it. */
  studentDegree: string;
  bestFitPaths: CareerPath[];
  onNavigateToTab: (tab: "home" | "fab" | "experiments" | "paths" | "journey") => void;
  completedCount: number;

  // Pilot Orchestrator States
  dailyReality: DailyReality;
  setDailyReality: (dr: DailyReality) => void;
  cognitiveBudget: CognitiveLoad;
  setCognitiveBudget: (cb: CognitiveLoad) => void;
  setActivePilotExperience: (exp: PilotExperience | null) => void;
  completedExperienceIds: string[];
  careerConfidences?: CareerConfidence[];
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** Shared empty-state block so no panel is ever left blank. */
function EmptyPanel({
  icon: Icon,
  title,
  body,
  ctaLabel,
  onCta,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-6 px-4 gap-2" : "py-10 px-6 gap-3"
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-[#4C1D95]">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h4 className="font-display text-sm font-bold text-[#0F172A]">{title}</h4>
      <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500">{body}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[#4C1D95] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#3B0764] cursor-pointer"
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function DashboardHomeView({
  studentName,
  studentDegree,
  bestFitPaths = [],
  onNavigateToTab,
  completedCount = 0,
  dailyReality,
  cognitiveBudget,
  setActivePilotExperience,
  completedExperienceIds = [],
  careerConfidences = [],
}: DashboardHomeViewProps) {
  // Carousel over the student's *real* ranked pathways.
  const [activePathIndex, setActivePathIndex] = useState(0);

  const hasPaths = bestFitPaths.length > 0;
  const firstName = (studentName || "there").split(" ")[0];
  const degreeLabel = studentDegree || "Course not set yet";

  const safeIndex = hasPaths ? Math.min(activePathIndex, bestFitPaths.length - 1) : 0;
  const spotlightPath = hasPaths ? bestFitPaths[safeIndex] : null;

  const handleNextPath = () =>
    setActivePathIndex((prev) => (prev + 1) % Math.max(1, bestFitPaths.length));
  const handlePrevPath = () =>
    setActivePathIndex(
      (prev) => (prev - 1 + Math.max(1, bestFitPaths.length)) % Math.max(1, bestFitPaths.length),
    );

  // Confidence comes from the ranked paths FAB produced — never a placeholder.
  const topPath = bestFitPaths[0] ?? null;
  const confidenceScore = topPath
    ? Math.round(topPath.matchScore)
    : careerConfidences.length > 0
      ? Math.round(Math.max(...careerConfidences.map((c) => c.score)))
      : null;

  const confidenceLabel =
    confidenceScore === null
      ? null
      : confidenceScore >= 85
        ? "Very High"
        : confidenceScore >= 70
          ? "High"
          : confidenceScore >= 50
            ? "Medium"
            : "Early";

  // Completed experiences resolved back to the content library.
  const completedExperiences = useMemo(
    () =>
      completedExperienceIds
        .map((id) => experienceLibrary.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => !!e),
    [completedExperienceIds],
  );

  // Skills are counted from what the student actually completed.
  const builtSkills = useMemo(() => {
    const counts = new Map<string, number>();
    for (const exp of completedExperiences) {
      const raw = [exp.primarySkills, exp.secondarySkills].filter(Boolean).join(",");
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((skill) => counts.set(skill, (counts.get(skill) ?? 0) + 1));
    }
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count, pct: Math.round((count / max) * 100) }));
  }, [completedExperiences]);

  const recentAchievements = useMemo(
    () => [...completedExperiences].reverse().slice(0, 3),
    [completedExperiences],
  );

  // Curate today's recommendation using the Pilot Orchestrator engine.
  const activeHypothesesList = bestFitPaths.map((p) => p.fieldName);
  const curatedRecommendations = getCuratedRecommendations(
    studentDegree,
    dailyReality,
    cognitiveBudget,
    completedExperienceIds,
    activeHypothesesList,
  );

  const topExperience = curatedRecommendations[0];

  const handleEngageExperience = (exp: PilotExperience) => {
    setActivePilotExperience(exp);
    onNavigateToTab("experiments");
  };

  return (
    <div
      id="dashboard-home-container"
      className="space-y-6 md:space-y-8 max-w-6xl mx-auto pb-12 md:pb-16"
    >
      {/* 1. SAAS HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-[#0F172A] tracking-tight truncate">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-xs md:text-sm text-[#5C534C] mt-1 font-medium">
            {hasPaths
              ? "Your direction is taking shape. Let's keep the momentum going."
              : "Let's find out where you're actually headed."}
          </p>
        </div>
        <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
          <span className="bg-[#F5F3FF] text-[#0F172A] text-[10px] md:text-xs px-3 py-1 rounded-full border border-slate-100 shadow-sm font-bold flex items-center space-x-1.5 min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{degreeLabel}</span>
          </span>
          <button
            onClick={() => onNavigateToTab("fab")}
            className="bg-[#4C1D95] hover:bg-[#3B0764] text-white text-[11px] md:text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
          >
            Talk to FAB
          </button>
        </div>
      </div>

      {/* 2. CORE ANALYTICAL WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        {/* Card 1: Career Confidence gauge */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col items-center justify-between min-h-[200px] sm:min-h-[220px]">
          <div className="w-full flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Career Confidence</span>
          </div>

          {confidenceScore === null ? (
            <EmptyPanel
              compact
              icon={Compass}
              title="No reading yet"
              body="Finish the FAB conversation and your confidence score appears here."
            />
          ) : (
            <>
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg className="w-36 h-20" aria-hidden>
                  <path
                    d="M 10 75 A 60 60 0 0 1 134 75"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 75 A 60 60 0 0 1 134 75"
                    fill="none"
                    stroke="#4C1D95"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="210"
                    strokeDashoffset={210 - (210 * confidenceScore) / 100}
                  />
                </svg>
                <div className="absolute top-10 flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {confidenceScore}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {confidenceLabel}
                  </span>
                </div>
              </div>

              <div className="w-full text-center text-[10px] text-slate-400 font-mono">
                CALCULATED ON SIGNAL CONGRUENCE
              </div>
            </>
          )}
        </div>

        {/* Card 2: Current Best Match */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[200px] sm:min-h-[220px]">
          <div className="w-full flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Current Best Match</span>
            {topPath && (
              <span className="text-[#4C1D95] bg-purple-50 border border-purple-100 text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                {Math.round(topPath.matchScore)}% Match
              </span>
            )}
          </div>

          {topPath ? (
            <>
              <div className="my-3 flex flex-col items-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#4C1D95] shadow-xs mb-2 sm:mb-3">
                  <Heart className="h-5 sm:h-6 w-5 sm:w-6 fill-current" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display text-center leading-tight">
                  {topPath.fieldName}
                </h3>
                <p className="text-[10px] text-slate-500 text-center font-semibold mt-1">
                  Top pathway matching your answers
                </p>
              </div>

              <button
                onClick={() => onNavigateToTab("paths")}
                className="w-full py-2 bg-slate-50 hover:bg-[#4C1D95] hover:text-white border border-slate-200 hover:border-[#4C1D95] rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                Explore Alternative Hypotheses
              </button>
            </>
          ) : (
            <EmptyPanel
              compact
              icon={MessageSquare}
              title="No match yet"
              body="Chat with FAB to unlock your career paths."
              ctaLabel="Start with FAB"
              onCta={() => onNavigateToTab("fab")}
            />
          )}
        </div>

        {/* Card 3: This Week */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[200px] sm:min-h-[220px]">
          <div className="w-full flex justify-between items-center text-xs font-bold text-slate-500">
            <span>Your Progress</span>
          </div>

          <div className="space-y-2 my-3">
            <div className="flex items-center space-x-3 text-xs font-bold text-stone-700">
              <CheckCircle2
                className={`h-4.5 w-4.5 shrink-0 ${
                  completedExperienceIds.length > 0 ? "text-emerald-500" : "text-slate-300"
                }`}
              />
              <span className="tabular-nums">
                {completedExperienceIds.length} Experience
                {completedExperienceIds.length === 1 ? "" : "s"} Completed
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-bold text-stone-700">
              <CheckCircle2
                className={`h-4.5 w-4.5 shrink-0 ${
                  completedCount > 0 ? "text-emerald-500" : "text-slate-300"
                }`}
              />
              <span className="tabular-nums">
                {completedCount} Evidence Item{completedCount === 1 ? "" : "s"} Logged
              </span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-bold text-stone-700">
              <CheckCircle2
                className={`h-4.5 w-4.5 shrink-0 ${
                  hasPaths ? "text-emerald-500" : "text-slate-300"
                }`}
              />
              <span className="tabular-nums">
                {bestFitPaths.length} Pathway{bestFitPaths.length === 1 ? "" : "s"} Mapped
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab("journey")}
            className="w-full py-2 bg-slate-50 hover:bg-[#4C1D95] hover:text-white border border-slate-200 hover:border-[#4C1D95] rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
          >
            View Your Journey
          </button>
        </div>
      </div>

      {/* 3. TODAY'S CURATED EXPERIENCE */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#4C1D95]" />
          <h2 className="text-xl font-display font-extrabold text-[#0F172A]">Today's Experience</h2>
        </div>

        {topExperience ? (
          <div className="relative overflow-hidden border border-slate-200 bg-white rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#4C1D95]/30 transition-all duration-300 group">
            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F5F3FF] border border-slate-100 shadow-sm text-[#5C534C] px-2.5 py-0.5 text-[8.5px] font-mono font-bold uppercase">
                    {topExperience.subject}
                  </span>
                  {topExperience.id.startsWith("JS_") && (
                    <span className="rounded-full bg-purple-50 border border-purple-100 text-[#4C1D95] px-2.5 py-0.5 text-[8.5px] font-mono font-bold uppercase flex items-center">
                      <Briefcase className="h-3 w-3 mr-1" />
                      Job Simulation
                    </span>
                  )}
                  <span
                    className={`text-[8.5px] font-mono px-2 py-0.5 rounded-full font-bold border uppercase ${
                      topExperience.cognitiveLoad === "Deep"
                        ? "bg-red-50 text-red-700 border-red-100"
                        : topExperience.cognitiveLoad === "Focused"
                          ? "bg-purple-50 text-purple-700 border-purple-100"
                          : topExperience.cognitiveLoad === "Light"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-stone-50 text-stone-700 border-stone-100"
                    }`}
                  >
                    {topExperience.cognitiveLoad} Load
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 font-display leading-snug">
                    {topExperience.title}
                  </h3>
                  <p className="text-xs text-[#5C534C] italic leading-relaxed">
                    "{topExperience.situationHook}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-[11px] text-stone-600 space-y-1">
                    <span className="text-[9px] font-mono text-[#4C1D95] font-extrabold uppercase block tracking-wider">
                      Why you're seeing this:
                    </span>
                    <p className="leading-relaxed font-medium">{topExperience.rationale}</p>
                  </div>
                  <div className="p-3 bg-stone-50 border border-stone-100 rounded-2xl text-[11px] text-stone-600 space-y-1">
                    <span className="text-[9px] font-mono text-[#4C1D95] font-extrabold uppercase block tracking-wider">
                      Expected Outcome:
                    </span>
                    <p className="leading-relaxed font-medium">{topExperience.expectedOutcome}</p>
                  </div>
                </div>
              </div>

              <div className="lg:border-l lg:border-slate-100 lg:pl-6 flex flex-row lg:flex-col items-center lg:justify-center justify-between gap-4 shrink-0">
                <div className="text-right lg:text-center">
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">
                    Estimated time
                  </span>
                  <span className="text-xs font-extrabold text-[#4C1D95] font-mono flex items-center justify-end lg:justify-center mt-0.5">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {topExperience.estimatedTime}
                  </span>
                </div>
                <button
                  onClick={() => handleEngageExperience(topExperience)}
                  className="text-xs font-bold bg-[#4C1D95] hover:bg-[#3B0764] text-white px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  Start Experience
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xs">
            <EmptyPanel
              icon={Beaker}
              title="Nothing queued right now"
              body="Complete the FAB conversation so the Pilot can curate experiments that fit your week."
              ctaLabel="Browse experiments"
              onCta={() => onNavigateToTab("experiments")}
            />
          </div>
        )}
      </div>

      {/* 5. PATHWAY SPOTLIGHT + SKILLS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pathway spotlight carousel — driven by the student's real ranked paths */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 z-10">
            <span className="bg-[#4C1D95] text-white text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-full font-bold shadow-md">
              Pathway Spotlight
            </span>
          </div>

          {spotlightPath ? (
            <>
              <div className="space-y-3 pr-24">
                <span className="inline-block text-[9px] font-mono font-bold text-[#4C1D95] uppercase bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                  Match Score: {Math.round(spotlightPath.matchScore)}%
                </span>
                <h4 className="text-base font-bold text-slate-900 font-display leading-snug">
                  {spotlightPath.fieldName}
                </h4>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  {spotlightPath.oneLineRecommendation}
                </p>

                {spotlightPath.whyThisMatchesYou?.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {spotlightPath.whyThisMatchesYou.slice(0, 3).map((reason, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-[11px] font-medium text-slate-600"
                      >
                        <Target className="mt-0.5 h-3 w-3 shrink-0 text-[#4C1D95]" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handlePrevPath}
                    disabled={bestFitPaths.length < 2}
                    aria-label="Previous pathway"
                    className="p-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    onClick={handleNextPath}
                    disabled={bestFitPaths.length < 2}
                    aria-label="Next pathway"
                    className="p-1 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </button>
                  <span className="pl-2 font-mono text-[10px] font-bold text-slate-400 tabular-nums">
                    {safeIndex + 1} / {bestFitPaths.length}
                  </span>
                </div>

                <button
                  onClick={() => onNavigateToTab("paths")}
                  className="px-4 py-1.5 bg-slate-50 hover:bg-[#4C1D95] hover:text-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition-all"
                >
                  View Details
                </button>
              </div>
            </>
          ) : (
            <EmptyPanel
              icon={Compass}
              title="Your pathways land here"
              body="Chat with FAB to unlock your career paths — you'll get a ranked list with a 90-day plan for each."
              ctaLabel="Chat with FAB"
              onCta={() => onNavigateToTab("fab")}
            />
          )}
        </div>

        {/* Skills built from completed experiences */}
        <div className="rounded-3xl border border-slate-200 shadow-xs bg-white p-5 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
            <TrendingUp className="h-4 w-4" />
            <span>Skills You're Building</span>
          </div>

          {builtSkills.length > 0 ? (
            <div className="space-y-3.5">
              {builtSkills.map((item) => (
                <div key={item.skill} className="space-y-1.5">
                  <div className="flex justify-between gap-2 text-xs font-bold text-stone-700">
                    <span className="min-w-0 truncate">{item.skill}</span>
                    <span className="font-mono text-[10px] shrink-0 tabular-nums">
                      ×{item.count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                    <div
                      className="h-full bg-[#4C1D95] rounded-full transition-[width] duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyPanel
              compact
              icon={Beaker}
              title="No skills logged yet"
              body="Every experiment you complete adds real evidence here."
              ctaLabel="Run an experiment"
              onCta={() => onNavigateToTab("experiments")}
            />
          )}
        </div>
      </div>

      {/* 6. RECENT ACHIEVEMENTS */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold mb-4">
          <Award className="h-4 w-4 text-[#4C1D95]" />
          <span>Recent Achievements & Evidence</span>
        </div>

        {recentAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentAchievements.map((exp) => (
              <div
                key={exp.id}
                className="p-4 bg-white border border-slate-100 rounded-xl flex items-start space-x-3"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="h-4 w-4 stroke-[3]" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-emerald-600 font-extrabold truncate">
                    {exp.subject}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900 leading-snug">{exp.title}</h5>
                  {exp.careerPathway && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {exp.careerPathway}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyPanel
            icon={Award}
            title="No evidence yet"
            body="Finish your first experiment and it shows up here as proof of what you've built."
            ctaLabel="Find an experiment"
            onCta={() => onNavigateToTab("experiments")}
          />
        )}
      </div>
    </div>
  );
}
