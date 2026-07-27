import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  FlaskConical,
  BookOpen,
  Sparkles,
  Compass,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { CareerConfidence, CareerPath, PracticalConstraints, ProfileSignals } from "../../types";

type TimeFilter = "6M" | "3M" | "1M" | "All";

interface JourneyViewProps {
  studentName?: string;
  studentDegree?: string;
  signals: ProfileSignals;
  constraints: PracticalConstraints;
  evidenceList: any[];
  careerConfidences?: CareerConfidence[];
  bestFitPaths?: CareerPath[];
  onNavigateToTab?: (tab: "home" | "fab" | "experiments" | "paths" | "journey") => void;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthsForFilter(filter: TimeFilter): number {
  if (filter === "1M") return 1;
  if (filter === "3M") return 3;
  if (filter === "6M") return 6;
  return 12;
}

function timestampOf(item: any): number {
  const raw = item?.timestamp ?? item?.createdAt ?? item?.date;
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : NaN;
}

/**
 * Builds a real cumulative "evidence logged" series from the timestamps on the
 * student's own evidence items. No synthetic data, no random walk — an empty
 * log simply produces an empty series and the UI shows an empty state.
 */
function buildEvidenceSeries(evidenceList: any[], filter: TimeFilter) {
  const months = monthsForFilter(filter);
  const now = new Date();

  const buckets: { name: string; start: number; end: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    buckets.push({
      name: MONTH_LABELS[start.getMonth()],
      start: start.getTime(),
      end: end.getTime(),
    });
  }

  const stamps = evidenceList.map(timestampOf).filter((t) => Number.isFinite(t)) as number[];

  let running = stamps.filter((t) => t < buckets[0].start).length;
  return buckets.map((bucket) => {
    running += stamps.filter((t) => t >= bucket.start && t < bucket.end).length;
    return { name: bucket.name, evidence: running };
  });
}

export default function JourneyView({
  studentName,
  studentDegree,
  signals,
  evidenceList = [],
  careerConfidences = [],
  bestFitPaths = [],
  onNavigateToTab,
}: JourneyViewProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("6M");
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const firstName = (studentName || "there").split(" ")[0];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const topPath = bestFitPaths[0] ?? null;
  const currentConfidence = topPath
    ? Math.round(topPath.matchScore)
    : careerConfidences.length > 0
      ? Math.round(Math.max(...careerConfidences.map((c) => c.score)))
      : null;

  const chartData = useMemo(
    () => buildEvidenceSeries(evidenceList, timeFilter),
    [evidenceList, timeFilter],
  );

  const hasEvidence = evidenceList.length > 0;

  // Derive real strengths from detected signals only.
  const allSignals = Object.entries(signals || {})
    .filter(([, sig]) => sig?.detected)
    .map(([key, sig]) => ({ key, ...sig }));

  const topStrengths = allSignals.slice(0, 3);

  const filteredEvidence = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return evidenceList;
    return evidenceList.filter((ev) => {
      const haystack = [ev?.title, ev?.content, ev?.realization, ...(ev?.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [evidenceList, search]);

  const goTo = (tab: "home" | "fab" | "experiments" | "paths" | "journey") => {
    if (onNavigateToTab) onNavigateToTab(tab);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20 lg:pb-0 overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 md:p-8">
        {/* LEFT COLUMN: HERO & TIMELINE */}
        <div className="w-full lg:w-[45%] flex flex-col space-y-8 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-display font-extrabold tracking-tight text-[#0F172A]">
                Your Journey
              </h1>
              <p className="text-slate-500 text-sm mt-1">Your growth, visible.</p>
            </div>
          </div>

          {/* Hero Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-white to-[#F5F3FF] rounded-3xl p-6 shadow-sm border border-purple-100/50">
            <div className="absolute right-0 top-0 opacity-20 pointer-events-none" aria-hidden>
              <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M150 50 L100 150 L50 100" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="150" cy="50" r="4" fill="#4C1D95" />
                <circle cx="100" cy="150" r="4" fill="#4C1D95" />
                <circle cx="50" cy="100" r="4" fill="#4C1D95" />
                <path strokeDasharray="4 4" d="M150 50 Q 200 100 100 150" stroke="#4C1D95" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-[#0F172A]">
                {getGreeting()}, {firstName} 👋
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {studentDegree ? studentDegree : "Tell FAB what you're studying to sharpen this."}
              </p>

              <div className="mt-8 bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    Career Confidence <Lightbulb className="h-3 w-3" />
                  </span>
                </div>

                {currentConfidence === null ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-medium text-slate-500">
                      No reading yet — chat with FAB to unlock your career paths and this fills in.
                    </p>
                    <button
                      onClick={() => goTo("fab")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#4C1D95] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#3B0764] cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat with FAB
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-4xl font-display font-extrabold text-[#4C1D95] tabular-nums">
                        {currentConfidence}%
                      </span>
                      {topPath && (
                        <span className="text-right text-[10px] font-medium text-slate-500 max-w-[55%] truncate">
                          {topPath.fieldName}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-purple-100 rounded-full mt-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentConfidence}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-[#4C1D95] rounded-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress at a glance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0F172A]">Your Progress at a Glance</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                    <FlaskConical className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Evidence</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-extrabold text-[#0F172A] tabular-nums">
                    {evidenceList.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Logged</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Signals</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-extrabold text-[#0F172A] tabular-nums">
                    {allSignals.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Detected</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                    <Compass className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Paths</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-extrabold text-[#0F172A] tabular-nums">
                    {bestFitPaths.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Mapped</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-50 p-2 rounded-xl text-purple-600">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Pathways Tracked</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-extrabold text-[#0F172A] tabular-nums">
                    {careerConfidences.length}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">With evidence</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-bold text-[#0F172A]">Your Journey Timeline</h3>

              {hasEvidence && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search journey..."
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                    />
                    <svg
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-purple-200 before:to-transparent">
              {!hasEvidence ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center space-y-3">
                  <p className="text-sm text-slate-500">
                    You haven't built your story yet.
                    <br />
                    Every experiment you complete becomes another page in your journey.
                  </p>
                  <button
                    onClick={() => goTo("experiments")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#4C1D95] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#3B0764] cursor-pointer"
                  >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Run your first experiment
                  </button>
                </div>
              ) : filteredEvidence.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
                  <p className="text-sm text-slate-500">No entries match "{search}".</p>
                </div>
              ) : (
                filteredEvidence.map((ev, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.06 }}
                    key={ev.id ?? i}
                    className="relative flex items-start gap-6 group"
                  >
                    <div className="absolute -left-6 bg-[#F8F9FA] p-1">
                      <div className="h-5 w-5 rounded-md bg-white border border-purple-200 text-purple-600 flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    </div>
                    <div
                      className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setExpandedMilestone(expandedMilestone === ev.id ? null : ev.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600 shrink-0">
                          <FlaskConical className="h-4 w-4" />
                        </div>
                        <h4 className="font-bold text-[#0F172A] text-sm min-w-0 break-words">
                          {ev.title || ev.type || "Evidence logged"}
                        </h4>
                      </div>
                      {(ev.realization || ev.content) && (
                        <p className="text-slate-600 text-xs leading-relaxed mb-4 break-words">
                          {ev.realization || ev.content}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {(ev.tags ?? []).slice(0, 3).map((tag: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {Number.isFinite(timestampOf(ev)) && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(timestampOf(ev)).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <AnimatePresence>
                        {expandedMilestone === ev.id && ev.signals?.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                {ev.signals.map((s: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="bg-slate-50 border border-slate-100 text-[9px] font-bold px-2 py-1 rounded text-slate-600"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CHARTS & INSIGHTS */}
        <div className="w-full lg:w-[55%] flex flex-col space-y-8 mt-12 lg:mt-0 lg:sticky lg:top-8 self-start min-w-0">
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
              Your track record
            </h3>
            <h2 className="text-3xl font-display font-extrabold text-[#0F172A] leading-tight">
              Look how far
              <br />
              you've come.
            </h2>
            <p className="text-slate-500 text-sm mt-2">Every step has shaped who you are becoming.</p>
          </div>

          {/* Chart Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h3 className="font-bold text-[#0F172A]">Evidence Logged Over Time</h3>
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-100 flex items-center">
                {(["6M", "3M", "1M", "All"] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      timeFilter === filter
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {hasEvidence ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEvidence" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4C1D95" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4C1D95" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      itemStyle={{ color: "#4C1D95" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="evidence"
                      name="Evidence"
                      stroke="#4C1D95"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorEvidence)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-[#4C1D95]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500">
                  Your progress chart draws itself as you log evidence from completed experiments.
                </p>
                <button
                  onClick={() => goTo("experiments")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4C1D95] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#3B0764] cursor-pointer"
                >
                  Go to experiments
                </button>
              </div>
            )}
          </div>

          {/* Pathway confidence */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-[#0F172A]">Pathway Confidence</h3>
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100 divide-y divide-slate-50">
              {careerConfidences.length > 0 ? (
                [...careerConfidences]
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 5)
                  .map((c) => (
                    <div
                      key={c.careerPathway}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors rounded-2xl group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="bg-purple-50 p-2 rounded-xl text-purple-600 shrink-0">
                          <Compass className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-sm font-medium text-slate-700 truncate">
                            {c.careerPathway}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {c.evidenceCount} signal{c.evidenceCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                      <span className="font-display font-extrabold text-[#4C1D95] tabular-nums shrink-0">
                        {Math.round(c.score)}%
                      </span>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-100 bg-purple-50 text-[#4C1D95]">
                    <Compass className="h-4 w-4" />
                  </div>
                  <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500">
                    Complete experiments and confidence in each pathway starts tracking here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Top Strengths */}
          <div className="space-y-4 pt-4">
            <h3 className="font-bold text-[#0F172A] flex items-center gap-2 flex-wrap">
              Top Strengths{" "}
              <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                (Based on detected signals)
              </span>
            </h3>

            <div className="space-y-3">
              {topStrengths.length > 0 ? (
                topStrengths.map((s, idx) => (
                  <div
                    key={s.key}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-start gap-4"
                  >
                    <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
                      {idx === 0 ? (
                        <Sparkles className="h-5 w-5" />
                      ) : idx === 1 ? (
                        <MessageSquare className="h-5 w-5" />
                      ) : (
                        <Lightbulb className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-[#0F172A] mb-1">{s.label || s.key}</h4>
                      {(s.description || s.value) && (
                        <p className="text-xs text-slate-600 leading-relaxed break-words">
                          {s.description || s.value}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center space-y-3">
                  <p className="text-sm text-slate-500">
                    Your strengths appear as FAB detects them in conversation.
                  </p>
                  <button
                    onClick={() => goTo("fab")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#4C1D95] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#3B0764] cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat with FAB
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Next Action */}
          <button
            onClick={() => goTo(bestFitPaths.length > 0 ? "paths" : "fab")}
            className="w-full bg-[#4C1D95] hover:bg-[#3B1775] text-white rounded-2xl py-4 font-bold transition-all shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            {bestFitPaths.length > 0 ? "Review your pathways" : "Find your direction"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
