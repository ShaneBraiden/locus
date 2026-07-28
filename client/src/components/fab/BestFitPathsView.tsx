import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ChevronRight, 
  Layers, 
  X, 
  ArrowRightLeft,
  GraduationCap,
  Briefcase,
  Globe2,
  TrendingUp,
  ShieldAlert,
  Clock,
  BookOpen
} from "lucide-react";
import { CareerPath, PsychReadout } from "../../types";
import { getCareerIntelligence } from "../../lib/careerIntelligence";

// The five theories behind the psychometric read, in the workbook's own order
// and weighting. Labels are deliberately plain English — students should not
// have to know what "RIASEC" means to read their own results.
const THEORY_META: { key: keyof PsychReadout["scores"]["pct"]; label: string; blurb: string }[] = [
  { key: "h", label: "Work environment fit", blurb: "The kind of setting you do your best work in" },
  { key: "o", label: "Personality fit", blurb: "How you tend to approach work and pressure" },
  { key: "s", label: "Motivation quality", blurb: "How much of your drive comes from inside you" },
  { key: "m", label: "Cognitive style", blurb: "The way you naturally process and solve things" },
  { key: "d", label: "Decision readiness", blurb: "How ready you are to actually commit to a direction" },
];

interface BestFitPathsViewProps {
  paths: CareerPath[];
  onViewDetails: (path: CareerPath) => void;
  compareList: CareerPath[];
  onToggleCompare: (path: CareerPath) => void;
  setActiveTab?: (tab: any) => void;
  onViewUniversities?: (path: CareerPath) => void;
  psychometrics?: PsychReadout | null;
}

export default function BestFitPathsView({
  paths = [],
  onViewDetails,
  compareList = [],
  onToggleCompare,
  setActiveTab,
  onViewUniversities,
  psychometrics = null
}: BestFitPathsViewProps) {
  const [showCompareModal, setShowCompareModal] = useState(false);

  const isSelected = (id: string) => compareList.some(p => p.id === id);

  const clearCompare = () => {
    compareList.forEach(p => onToggleCompare(p));
  };

  // Premium Skeleton Loading Grid
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {[1, 2, 3].map((n) => (
        <div 
          key={n} 
          className="bg-white border border-slate-100 rounded-2xl overflow-hidden h-[280px] animate-pulse shadow-sm"
        >
        </div>
      ))}
    </div>
  );

  // Premium SVG Empty State
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-purple-100/50 blur-xl w-32 h-32 animate-pulse" />
        <svg 
          className="h-20 w-20 text-[#5C534C] relative z-10" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="1.2"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-xl font-bold text-[#0F172A]">Complete your FAB conversation to unlock your personalised career recommendations.</h3>
      </div>
      <button 
        onClick={() => setActiveTab?.("chat")}
        className="px-6 py-3.5 bg-[#4C1D95] hover:bg-[#3B0764] text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md uppercase tracking-wider font-sans"
      >
        Continue with FAB
      </button>
    </div>
  );

  const getAiRiskColor = (risk: string) => {
    switch (risk) {
      case "Very Low Risk": return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
      case "Low Risk": return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
      case "Moderate Risk": return "text-purple-400 border-purple-400/30 bg-purple-400/10";
      case "High Risk": return "text-rose-400 border-rose-400/30 bg-rose-400/10";
      default: return "text-stone-300 border-stone-400/30 bg-stone-400/10";
    }
  };

  return (
    <div className="p-3.5 sm:p-6 md:p-8 bg-[#F8FAFC] text-[#0F172A] rounded-3xl min-h-[550px] relative border border-slate-100 shadow-sm">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between pb-6 border-b border-slate-100 mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] font-sans">
            Career Paths
          </h1>
          <p className="text-sm text-[#5C534C] mt-1 font-medium leading-relaxed max-w-2xl">
            Explore the careers that best match your profile, aspirations and future goals.
          </p>
        </div>
        
        {paths.length > 0 && (
          <div className="shrink-0">
            <div className="bg-white border border-slate-100 shadow-sm px-4 py-2.5 rounded-2xl font-mono text-xs text-[#5C534C] shadow-xs">
              Top 5 Personalised Career Recommendations
            </div>
          </div>
        )}
      </div>

      {/* PSYCHOMETRIC READ — who you are, before what you could do.
          Careers here come from the 127-path LOCUS profile table and are
          scored independently of the degree topology below, so agreement
          between the two lists is meaningful rather than circular. */}
      {psychometrics && psychometrics.scores.answered > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">Your profile read</h2>
              <p className="text-xs text-[#5C534C] mt-1 font-medium max-w-xl leading-relaxed">
                Built from everything you told FAB, scored across five established frameworks.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-slate-100 bg-[#F8FAFC] px-4 py-2.5 text-center">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#5C534C]">
                Overall fit
              </div>
              <div className="text-2xl font-extrabold tabular-nums text-[#0F172A] leading-tight">
                {psychometrics.scores.adjustedCcfs}
                <span className="text-sm font-bold text-[#94A3B8]">/100</span>
              </div>
            </div>
          </div>

          {/* Five theory bars */}
          <div className="space-y-3 mb-6">
            {THEORY_META.map(({ key, label, blurb }) => {
              const value = psychometrics.scores.pct[key];
              const low = key === "s" && psychometrics.scores.sdtFlag;
              return (
                <div key={key}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-[12.5px] font-bold text-[#0F172A]">{label}</span>
                    <span className={`font-mono text-[11px] font-bold tabular-nums ${low ? "text-amber-600" : "text-[#5C534C]"}`}>
                      {value}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${low ? "bg-amber-500" : "bg-gradient-to-r from-[#D97706] to-[#F59E0B]"}`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-[#94A3B8] leading-snug">{blurb}</p>
                </div>
              );
            })}
          </div>

          {/* Motivation-quality caveat, shown rather than buried */}
          {psychometrics.motivationNote && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[12px] font-semibold leading-relaxed text-amber-900">
                {psychometrics.motivationNote}
              </p>
            </div>
          )}

          {/* Tiered career archetypes */}
          {(psychometrics.topMatches.length > 0 || psychometrics.secondaryMatches.length > 0) && (
            <div className="space-y-4">
              {psychometrics.topMatches.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-2">
                    Strong fit
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {psychometrics.topMatches.map((m) => {
                      const convergent = psychometrics.convergentCareers.includes(m.name);
                      return (
                        <span
                          key={m.careerId}
                          title={convergent ? "Your degree pathways point here too" : m.domain}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-bold ${
                            convergent
                              ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {convergent && <Sparkles className="h-3 w-3" />}
                          {m.name}
                          <span className="font-mono text-[10px] font-bold opacity-70 tabular-nums">{m.fitScore}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {psychometrics.secondaryMatches.length > 0 && (
                <div className="opacity-70">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                    Worth considering
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {psychometrics.secondaryMatches.map((m) => (
                      <span
                        key={m.careerId}
                        title={m.domain}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[12px] font-semibold text-amber-800"
                      >
                        {m.name}
                        <span className="font-mono text-[10px] font-bold opacity-70 tabular-nums">{m.fitScore}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] font-medium text-[#94A3B8] leading-relaxed">
                These are broad archetypes across every field. The paths below are the specific,
                concrete routes open to you from your degree.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* RENDER LOGIC */}
      {!paths ? (
        renderSkeletons()
      ) : paths.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {paths.slice(0, 5).map((path, idx) => {
            const intel = getCareerIntelligence(path.fieldName);
            const reqUni = ["medicine", "engineering", "law", "research", "architecture", "psychology", "business", "data science", "bioinformatics", "computational biology", "clinical data", "healthcare consulting", "strategy consulting", "hospital administration", "medical affairs", "regulatory", "computer science"].some(r => path.fieldName.toLowerCase().includes(r));

            return (
              <motion.div 
                key={path.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md bg-white border border-slate-100 flex flex-col md:h-[280px]"
              >
                {/* Image Section - Top 40% on md, 110px on mobile */}
                <div className="relative h-[110px] md:h-[40%] w-full overflow-hidden shrink-0">
                  <img 
                    src={path.heroImage} 
                    alt={path.fieldName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <div className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-sm text-[#0F172A] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                      <Sparkles className="h-3 w-3 text-purple-500" />
                      {path.matchScore}% MATCH
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-white font-sans truncate drop-shadow-sm">
                      {path.fieldName}
                    </h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  {/* One line summary */}
                  <p className="text-xs text-[#5C534C] font-medium line-clamp-2 md:truncate mb-3">
                    {path.oneLineRecommendation}
                  </p>

                  {/* 4 Quick Metrics in a row */}
                  <div className="flex items-center gap-1.5 overflow-x-auto mb-4 pb-1 whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="flex items-center gap-1 shrink-0 bg-[#F8FAFC] border border-slate-100 shadow-sm px-2 py-1 rounded text-[10px] text-[#5C534C]">
                      <TrendingUp className="h-3 w-3 text-purple-600" />
                      <span className="font-semibold truncate">{intel.futureDemand}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-[#F8FAFC] border border-slate-100 shadow-sm px-2 py-1 rounded text-[10px] text-[#5C534C]">
                      <Briefcase className="h-3 w-3 text-emerald-600" />
                      <span className="font-semibold truncate">{intel.salaryRange}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-[#F8FAFC] border border-slate-100 shadow-sm px-2 py-1 rounded text-[10px] text-[#5C534C]">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span className="font-semibold truncate">{intel.yearsToEnter}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-[#F8FAFC] border border-slate-100 shadow-sm px-2 py-1 rounded text-[10px] text-[#5C534C]">
                      <ShieldAlert className="h-3 w-3 text-purple-600" />
                      <span className="font-semibold truncate">{intel.aiRisk}</span>
                    </div>
                  </div>

                  {/* Actions Row - Stacks on mobile, inline on desktop */}
                  <div className="flex gap-1.5 sm:gap-2 mt-auto shrink-0">
                    <button
                      onClick={() => onViewDetails(path)}
                      className="flex-1 bg-[#4C1D95] hover:bg-[#3B0764] text-white py-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center truncate px-2 min-w-[65px]"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onToggleCompare(path)}
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer text-center border truncate px-2 min-w-[65px] ${
                        isSelected(path.id) 
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : "bg-white hover:bg-stone-50 text-[#0F172A] border-slate-100"
                      }`}
                    >
                      {isSelected(path.id) ? "Added" : "Compare"}
                    </button>
                    <button
                      onClick={() => reqUni && onViewUniversities ? onViewUniversities(path) : null}
                      disabled={!reqUni || !onViewUniversities}
                      className={`flex-1 border py-2.5 rounded-lg text-[11px] font-bold transition-colors text-center truncate px-2 min-w-[65px] ${
                        reqUni && onViewUniversities 
                          ? "bg-white hover:bg-stone-50 border-slate-100 text-[#0F172A] cursor-pointer" 
                          : "bg-stone-50 border-stone-200 text-stone-400 cursor-not-allowed"
                      }`}
                    >
                      Universities
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}        </div>
      )}

      {/* Persistent Compare Workbench bar at bottom */}
      <AnimatePresence>
        {compareList.length >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl px-4"
          >
            <div className="bg-[#0F172A] text-white rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-purple-400">
                  Comparison Tray
                </span>
                <span className="text-xs font-medium mt-1 text-stone-300">
                  {compareList.length} of 3 selected. {compareList.length < 2 ? "Select at least 1 more to compare." : "Compare Matrix is ready!"}
                </span>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <button
                  onClick={clearCompare}
                  className="text-stone-400 hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-2 cursor-pointer transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => compareList.length >= 2 && setShowCompareModal(true)}
                  disabled={compareList.length < 2}
                  className="bg-white hover:bg-stone-200 disabled:opacity-45 disabled:cursor-not-allowed text-[#0F172A] text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Compare Matrix</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPARISON MATRIX MODAL */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto pt-20 pb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white text-[#0F172A] rounded-3xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 shadow-sm"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    Compare Matrix
                  </h2>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="p-2 hover:bg-stone-200 rounded-full text-[#5C534C] hover:text-[#0F172A] transition-colors cursor-pointer bg-stone-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Matrix Grid */}
              <div className="p-6 overflow-auto flex-1 bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-100 bg-white">
                      <th className="py-4 px-4 text-xs font-bold text-[#5C534C] w-48 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Dimension</th>
                      {compareList.map((p) => (
                        <th key={p.id} className="py-4 px-5 text-sm font-bold text-[#0F172A] min-w-[200px]">
                          {p.fieldName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0D7FF]/60">
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Career Match %</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5">
                          <span className="text-lg font-black text-purple-600">{p.matchScore}%</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Future Demand</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.futureDemand}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Salary</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.salaryRange}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Years to Enter</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.yearsToEnter}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">AI Resilience</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        const getAiRiskColorLight = (risk: string) => {
                          switch (risk) {
                            case "Very Low Risk": return "text-emerald-700 bg-emerald-50 border-emerald-200";
                            case "Low Risk": return "text-emerald-700 bg-emerald-50 border-emerald-150";
                            case "Moderate Risk": return "text-purple-700 bg-purple-50 border-purple-200";
                            case "High Risk": return "text-rose-700 bg-rose-50 border-rose-200";
                            default: return "text-stone-700 bg-stone-50 border-stone-200";
                          }
                        };
                        return (
                          <td key={p.id} className="py-4 px-5">
                            <span className={`inline-block px-3 py-1 text-[11px] font-bold rounded-lg border ${getAiRiskColorLight(intel.aiRisk)}`}>
                              {intel.aiRisk}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Work-Life Balance</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.workLifeBalance}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Global Demand</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.globalOpportunities.growthRegions || p.keyInsights.globalMobility}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Cost of Education</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.estimatedCost}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Required Degree</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.education.degrees[0] || "None required"}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Difficulty</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.difficultyToEnter}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Career Growth</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.overallROI}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Top Recruiters</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.globalOpportunities.employers.slice(0, 3).join(", ")}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Top Countries</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.globalOpportunities.countries.slice(0, 3).join(", ")}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Required Skills</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.skills.technical.slice(0, 3).map((s: any) => s.name).join(", ")}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Emerging Trends</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.skills.emerging[0]?.name || "N/A"}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-[#5C534C] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_E0D7FF]">Scholarships</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.scholarshipAvailability}</td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
