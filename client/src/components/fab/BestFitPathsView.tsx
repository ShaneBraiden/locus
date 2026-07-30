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
import { CareerPath, PivotReadout, PsychReadout } from "../../types";
import { getCareerIntelligence } from "../../lib/careerIntelligence";
import { Button } from "../../ui";

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

// The four degree tracks, in the order a student should read them: what your
// degree already gives you, what one qualification would give you, what is open
// to you no matter what you studied, and — last, and collapsed — what genuinely
// is not. Colours are deliberately distinct so the sections cannot be conflated.
const TRACK_META: {
  key: keyof Omit<PivotReadout, "degree">;
  title: string;
  blurb: string;
  chip: string;
  label: string;
  showRoute: boolean;
}[] = [
  {
    key: "aligned",
    title: "Built on your degree",
    blurb: "These use the qualification you already hold. No restart required.",
    chip: "border-good-300 bg-good-50 text-good-900",
    label: "text-good-700",
    showRoute: false,
  },
  {
    key: "bridge",
    title: "One bridge away",
    blurb: "Reachable, but one qualification stands between you and the role.",
    chip: "border-info-300 bg-info-50 text-info-900",
    label: "text-info-700",
    showRoute: true,
  },
  {
    key: "pivot",
    title: "Open to you regardless of your degree",
    blurb: "No degree gate at all. What you studied does not decide these.",
    chip: "border-moss-300 bg-moss-50 text-moss-900",
    label: "text-moss-700",
    showRoute: true,
  },
  {
    key: "locked",
    title: "Would need a different degree",
    blurb: "You scored well on these, but the qualification really is the gate. Shown so you know rather than wonder.",
    chip: "border-ink-200 bg-ink-50 text-ink-600",
    label: "text-ink-500",
    showRoute: false,
  },
];

/**
 * The degree-pivot read. Splits the same scored careers by what the student's
 * own bachelor's degree opens, because a fit score alone will happily tell a
 * nursing student they would make a fine architect — true, and useless.
 *
 * Every number and route string here is computed server-side from the workbook;
 * this component only arranges them.
 */
function DegreePivotPanel({ pivots }: { pivots: PivotReadout }) {
  const [showLocked, setShowLocked] = useState(false);
  const degree = pivots.degree;
  if (!degree) return null;

  // "Built on your degree" is kept even when empty. The 252-career table holds
  // broad archetypes, so a specialised degree — BMLT, perfusion technology —
  // can have no archetype that maps to it while still having plenty of
  // direct-line roles. Dropping the section would read as a bug; showing the
  // researched roles instead is the honest version.
  const sections = TRACK_META
    .map((meta) => ({ meta, matches: pivots[meta.key] ?? [] }))
    .filter(({ meta, matches }) => matches.length > 0 || meta.key === "aligned");

  return (
    <div className="mt-6 border-t border-ink-200 pt-6">
      <div className="mb-5">
        <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-ink-900">
          <ArrowRightLeft className="h-4 w-4 text-moss-700" />
          Beyond your degree
        </h3>
        <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-ink-600">
          Your {degree.degreeName} decides fewer things than you have probably been told.
          Here is the same list again, sorted by whether the qualification is actually in your way.
        </p>
      </div>

      <div className="space-y-5">
        {sections.map(({ meta, matches }) => {
          const collapsible = meta.key === "locked";
          if (collapsible && !showLocked) {
            return (
              <button
                key={meta.key}
                type="button"
                onClick={() => setShowLocked(true)}
                className="flex w-full items-center justify-between rounded-xl border border-ink-200 bg-ink-25 px-3.5 py-2.5 text-left transition-colors hover:bg-ink-50"
              >
                <span className="text-xs font-bold text-ink-600">
                  {matches.length} strong match{matches.length === 1 ? "" : "es"} would need a different degree
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-500" />
              </button>
            );
          }
          return (
            <div key={meta.key}>
              <div className={`font-mono text-micro font-bold uppercase tracking-wider ${meta.label} mb-1`}>
                {meta.title}
              </div>
              <p className="mb-2.5 text-tiny font-medium leading-snug text-ink-500">{meta.blurb}</p>

              {/* No scored archetype maps to this degree — show its actual
                  direct-line roles rather than an empty section. */}
              {meta.key === "aligned" && matches.length === 0 && (
                <div className="rounded-xl border border-good-300 bg-good-50 px-3 py-2">
                  <p className="text-tiny font-medium leading-snug text-good-900">
                    {degree.direct.length > 0 ? (
                      <>
                        <span className="font-bold">Your degree's own roles: </span>
                        {degree.direct.join(" · ")}
                      </>
                    ) : (
                      "Your degree's direct roles are listed as concrete paths below."
                    )}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                {matches.map((m) => (
                  <div
                    key={m.careerId}
                    className={`rounded-xl border px-3 py-2 ${meta.chip}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-xs font-bold">{m.name}</span>
                      <span className="font-mono text-micro font-bold tabular-nums opacity-70">
                        {m.fitScore}
                      </span>
                    </div>
                    {meta.showRoute && m.degree?.altEntryRoute && (
                      <p className="mt-1 text-tiny font-medium leading-snug opacity-80">
                        {m.degree.altEntryRoute}
                      </p>
                    )}
                    {meta.key === "locked" && m.degree?.typical && (
                      <p className="mt-1 text-tiny font-medium leading-snug opacity-80">
                        Requires: {m.degree.typical}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* The researched map for this specific degree, independent of fit score. */}
      <div className="mt-6 rounded-xl border border-ink-200 bg-ink-25 px-3.5 py-3">
        <div className="font-mono text-micro font-bold uppercase tracking-wider text-ink-600">
          Your degree at a glance
        </div>
        <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-3">
          {[
            { label: "Direct-line roles", value: degree.direct.length },
            { label: "Short-bridge pivots", value: degree.adjacent.length },
            { label: "Open to any degree", value: degree.fullPivots.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-tiny font-medium text-ink-500">{label}</dt>
              <dd className="text-sm font-bold tabular-nums text-ink-900">{value}</dd>
            </div>
          ))}
        </dl>
        {degree.bridgeQualification && (
          <p className="mt-2.5 text-tiny font-medium leading-relaxed text-ink-600">
            <span className="font-bold text-ink-900">Bridges that unlock these: </span>
            {degree.bridgeQualification}
          </p>
        )}
        {degree.timeToPivot && (
          <p className="mt-1 flex items-center gap-1.5 text-tiny font-semibold text-ink-600">
            <Clock className="h-3 w-3 shrink-0" />
            Typical time to pivot: {degree.timeToPivot}
          </p>
        )}
      </div>
    </div>
  );
}

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
          className="bg-white border border-ink-200 rounded-2xl overflow-hidden h-[280px] animate-pulse shadow-e2"
        >
        </div>
      ))}
    </div>
  );

  // Premium SVG Empty State
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        
        <svg 
          className="h-20 w-20 text-ink-600 relative z-10" 
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
        <h3 className="font-display text-xl font-bold text-ink-900">Complete your FAB conversation to unlock your personalised career recommendations.</h3>
      </div>
      <button 
        onClick={() => setActiveTab?.("chat")}
        className="px-6 py-3.5 bg-moss-500 hover:bg-moss-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer uppercase tracking-wider font-sans"
      >
        Continue with FAB
      </button>
    </div>
  );

  // `getAiRiskColor` used to live here — a dark-background variant of the risk
  // chip that nothing rendered. Its 300-weight text on a 10% tint measured
  // under 2:1 on the light page, so it was one accidental reference away from
  // being an accessibility bug. The live version is `getAiRiskColorLight`
  // further down, which uses the 700-on-50 pairs.

  return (
    <div className="p-3.5 sm:p-6 md:p-8 bg-ink-50 text-ink-900 rounded-3xl min-h-[550px] relative border border-ink-200 shadow-e2">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between pb-6 border-b border-ink-200 mb-10 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 font-sans">
            Career Paths
          </h1>
          <p className="text-sm text-ink-600 mt-1 font-medium leading-relaxed max-w-2xl">
            Explore the careers that best match your profile, aspirations and future goals.
          </p>
        </div>
        
        {paths.length > 0 && (
          <div className="shrink-0">
            <div className="bg-white border border-ink-200 shadow-e2 px-4 py-2.5 rounded-2xl font-mono text-xs text-ink-600 shadow-e1">
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
          className="mb-10 rounded-2xl border border-ink-200 bg-white p-5 sm:p-6 shadow-e2"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink-900">Your profile read</h2>
              <p className="text-xs text-ink-600 mt-1 font-medium max-w-xl leading-relaxed">
                Built from everything you told FAB, scored across five established frameworks.
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-2.5 text-center">
              <div className="font-mono text-micro font-bold uppercase tracking-wider text-ink-600">
                Overall fit
              </div>
              <div className="text-2xl font-bold tabular-nums text-ink-900 leading-tight">
                {psychometrics.scores.adjustedCcfs}
                <span className="text-sm font-bold text-ink-500">/100</span>
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
                    <span className="text-xs font-bold text-ink-900">{label}</span>
                    <span className={`font-mono text-tiny font-bold tabular-nums ${low ? "text-moss-600" : "text-ink-600"}`}>
                      {value}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-md bg-ink-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-md ${low ? "bg-moss-500" : "bg-moss-500"}`}
                    />
                  </div>
                  <p className="mt-1 text-tiny font-medium text-ink-500 leading-snug">{blurb}</p>
                </div>
              );
            })}
          </div>

          {/* Motivation-quality caveat, shown rather than buried */}
          {psychometrics.motivationNote && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-moss-200 bg-moss-50 px-3.5 py-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-moss-600" />
              <p className="text-xs font-semibold leading-relaxed text-moss-900">
                {psychometrics.motivationNote}
              </p>
            </div>
          )}

          {/* Tiered career archetypes */}
          {(psychometrics.topMatches.length > 0 || psychometrics.secondaryMatches.length > 0) && (
            <div className="space-y-4">
              {psychometrics.topMatches.length > 0 && (
                <div>
                  <div className="font-mono text-micro font-bold uppercase tracking-wider text-good-700 mb-2">
                    Strong fit
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {psychometrics.topMatches.map((m) => {
                      const convergent = psychometrics.convergentCareers.includes(m.name);
                      return (
                        <span
                          key={m.careerId}
                          title={convergent ? "Your degree pathways point here too" : m.domain}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                            convergent
                              ? "border-good-300 bg-good-100 text-good-900"
                              : "border-good-100 bg-good-50 text-good-700"
                          }`}
                        >
                          {convergent && <Sparkles className="h-3 w-3" />}
                          {m.name}
                          <span className="font-mono text-micro font-bold opacity-70 tabular-nums">{m.fitScore}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {psychometrics.secondaryMatches.length > 0 && (
                <div className="opacity-70">
                  <div className="font-mono text-micro font-bold uppercase tracking-wider text-moss-700 mb-2">
                    Worth considering
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {psychometrics.secondaryMatches.map((m) => (
                      <span
                        key={m.careerId}
                        title={m.domain}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-moss-200 bg-moss-50 px-2.5 py-1.5 text-xs font-semibold text-moss-800"
                      >
                        {m.name}
                        <span className="font-mono text-micro font-bold opacity-70 tabular-nums">{m.fitScore}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-tiny font-medium text-ink-500 leading-relaxed">
                These are broad archetypes across every field. The paths below are the specific,
                concrete routes open to you from your degree.
              </p>
            </div>
          )}

          {/* DEGREE PIVOT LAYER — the four tracks. Only rendered once the
              server knows which degree the student holds; without that, the
              tiered lists above are the honest view. */}
          {psychometrics.pivots?.degree && (
            <DegreePivotPanel pivots={psychometrics.pivots} />
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
                className="relative rounded-2xl overflow-hidden shadow-e2 bg-white border border-ink-200 flex flex-col md:h-[280px]"
              >
                {/* Image Section - Top 40% on md, 110px on mobile */}
                <div className="relative h-[110px] md:h-[40%] w-full overflow-hidden shrink-0">
                  <img 
                    src={path.heroImage} 
                    alt={path.fieldName} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <div className="inline-flex items-center gap-1 bg-white text-ink-900 text-micro font-bold tracking-wider px-2.5 py-1 rounded-md shadow-e2">
                      <Sparkles className="h-3 w-3 text-moss-600" />
                      {path.matchScore}% MATCH
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight text-white font-sans truncate drop-shadow-e2">
                      {path.fieldName}
                    </h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  {/* One line summary */}
                  <p className="text-xs text-ink-600 font-medium line-clamp-2 md:truncate mb-3">
                    {path.oneLineRecommendation}
                  </p>

                  {/* 4 Quick Metrics in a row */}
                  <div className="scroll-slim mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 whitespace-nowrap">
                    <div className="flex items-center gap-1 shrink-0 bg-ink-50 border border-ink-200 shadow-e2 px-2 py-1 rounded text-micro text-ink-600">
                      <TrendingUp className="h-3 w-3 text-moss-700" />
                      <span className="font-semibold truncate">{intel.futureDemand}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-ink-50 border border-ink-200 shadow-e2 px-2 py-1 rounded text-micro text-ink-600">
                      <Briefcase className="h-3 w-3 text-good-500" />
                      <span className="font-semibold truncate">{intel.salaryRange}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-ink-50 border border-ink-200 shadow-e2 px-2 py-1 rounded text-micro text-ink-600">
                      <Clock className="h-3 w-3 text-info-500" />
                      <span className="font-semibold truncate">{intel.yearsToEnter}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-ink-50 border border-ink-200 shadow-e2 px-2 py-1 rounded text-micro text-ink-600">
                      <ShieldAlert className="h-3 w-3 text-moss-700" />
                      <span className="font-semibold truncate">{intel.aiRisk}</span>
                    </div>
                  </div>

                  {/* Actions. Three equal buttons each with a 65px floor and
                      `truncate` meant "Universities" rendered as "Univer…" on
                      every phone. Details now takes the lead and the other two
                      wrap beneath it when there isn't room. */}
                  <div className="mt-auto flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="inverse"
                      size="sm"
                      className="min-w-24 flex-1"
                      onClick={() => onViewDetails(path)}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      variant={isSelected(path.id) ? "secondary" : "outline"}
                      className="min-w-24 flex-1"
                      onClick={() => onToggleCompare(path)}
                      aria-pressed={isSelected(path.id)}
                    >
                      {isSelected(path.id) ? "Added" : "Compare"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-w-24 flex-1"
                      onClick={() => (reqUni && onViewUniversities ? onViewUniversities(path) : null)}
                      disabled={!reqUni || !onViewUniversities}
                    >
                      Universities
                    </Button>
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
            <div className="bg-ink-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/10">
              <div className="flex flex-col">
                <span className="text-micro font-mono tracking-wider font-bold uppercase text-moss-400">
                  Comparison Tray
                </span>
                <span className="text-xs font-medium mt-1 text-ink-300">
                  {compareList.length} of 3 selected. {compareList.length < 2 ? "Select at least 1 more to compare." : "Compare Matrix is ready!"}
                </span>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <button
                  onClick={clearCompare}
                  className="text-ink-500 hover:text-white text-xs font-bold uppercase tracking-wider px-3 py-2 cursor-pointer transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => compareList.length >= 2 && setShowCompareModal(true)}
                  disabled={compareList.length < 2}
                  className="bg-white hover:bg-ink-200 disabled:opacity-45 disabled:cursor-not-allowed text-ink-900 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer flex items-center space-x-2"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto pt-20 pb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white text-ink-900 rounded-2xl shadow-e5 w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col border border-ink-200 shadow-e2"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-ink-200 bg-ink-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-ink-900">
                    Compare Matrix
                  </h2>
                </div>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="p-2 hover:bg-ink-200 rounded-md text-ink-600 hover:text-ink-900 transition-colors cursor-pointer bg-ink-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Matrix Grid */}
              <div className="p-6 overflow-auto flex-1 bg-white">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-ink-200 bg-white">
                      <th className="py-4 px-4 text-xs font-bold text-ink-600 w-48 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Dimension</th>
                      {compareList.map((p) => (
                        <th key={p.id} className="py-4 px-5 text-sm font-bold text-ink-900 min-w-[200px]">
                          {p.fieldName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-moss-200/60">
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Career Match %</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5">
                          <span className="text-lg font-bold text-moss-700">{p.matchScore}%</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Future Demand</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.futureDemand}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Salary</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.salaryRange}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Years to Enter</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.yearsToEnter}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">AI Resilience</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        const getAiRiskColorLight = (risk: string) => {
                          switch (risk) {
                            case "Very Low Risk": return "text-good-700 bg-good-50 border-good-100";
                            case "Low Risk": return "text-good-700 bg-good-50 border-good-300/60";
                            case "Moderate Risk": return "text-moss-700 bg-moss-50 border-moss-200";
                            case "High Risk": return "text-bad-700 bg-bad-50 border-bad-100";
                            default: return "text-ink-700 bg-ink-50 border-ink-200";
                          }
                        };
                        return (
                          <td key={p.id} className="py-4 px-5">
                            <span className={`inline-block px-3 py-1 text-tiny font-bold rounded-lg border ${getAiRiskColorLight(intel.aiRisk)}`}>
                              {intel.aiRisk}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Work-Life Balance</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.workLifeBalance}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Global Demand</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.globalOpportunities.growthRegions || p.keyInsights.globalMobility}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Cost of Education</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.estimatedCost}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Required Degree</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.education.degrees[0] || "None required"}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Difficulty</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.difficultyToEnter}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Career Growth</td>
                      {compareList.map((p) => (
                        <td key={p.id} className="py-4 px-5 text-sm font-medium">{p.keyInsights.overallROI}</td>
                      ))}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Top Recruiters</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.globalOpportunities.employers.slice(0, 3).join(", ")}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Top Countries</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.globalOpportunities.countries.slice(0, 3).join(", ")}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Required Skills</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.skills.technical.slice(0, 3).map((s: any) => s.name).join(", ")}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Emerging Trends</td>
                      {compareList.map((p) => {
                        const intel = getCareerIntelligence(p.fieldName);
                        return (
                          <td key={p.id} className="py-4 px-5 text-sm font-medium">{intel.skills.emerging[0]?.name || "N/A"}</td>
                        );
                      })}
                    </tr>
                    <tr className="hover:bg-ink-50/50 transition-colors">
                      <td className="py-4 px-4 text-xs font-bold text-ink-600 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_var(--color-ink-200)]">Scholarships</td>
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
