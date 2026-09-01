import React, { useState, useEffect } from "react";
import { CareerPath, ProfileSignals, PracticalConstraints } from "../../types";
import { UniversityMatch } from "../../data/universityData";
import { getUniversityRecommendations } from "../../lib/universityIntelligence";
import { useUniversityMedia } from "../../lib/universityImages";
import { Badge, Button, EmptyState, Panel, Portal, Skeleton, cx } from "../../ui";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  Bookmark,
  Clock,
  GraduationCap,
  Star,
  Wallet,
  X,
} from "lucide-react";

interface UniversityViewProps {
  path: CareerPath | null;
  signals: ProfileSignals;
  constraints: PracticalConstraints;
  onBack: () => void;
  onContinue: () => void;
}

/* ===========================================================================
 * FILTER SELECT
 * A capsule. The native control keeps its own dropdown — this only restyles
 * the closed state, which is the only part that sits in the layout.
 * ======================================================================== */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-w-0 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          "w-full appearance-none rounded-full border border-ink-200 bg-white",
          // `pr-[2.25rem]`, not `pr-9`: the spacing compression block at the
          // foot of `index.css` rewrites step 9 to 22px, which is narrower than
          // the chevron below sits, so the label ran under the arrow.
          "py-2 pl-4 pr-[2.25rem] text-xs font-semibold text-ink-700",
          "transition-colors duration-150 hover:border-ink-300",
          "focus:border-moss-500 focus:outline-none focus:ring-1 focus:ring-moss-500",
          "md:w-auto",
        )}
      >
        {children}
      </select>
      {/* The native arrow is suppressed by `appearance-none` above, so this
          draws it back — a chevron rather than the platform triangle, which is
          the one square-shouldered glyph the OS still supplies. */}
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 h-2.5 w-2.5 text-ink-400"
      >
        <path
          d="M2 4.5 6 8.5 10 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}

/* ===========================================================================
 * METRIC — one figure in the card's stat strip.
 * ======================================================================== */
function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "good" | "moss";
}) {
  return (
    <div className="min-w-0 rounded-lg bg-ink-50 px-3 py-2">
      <p className="eyebrow truncate">{label}</p>
      <p
        data-numeric
        className={cx(
          "mt-0.5 truncate text-base font-bold leading-tight",
          tone === "good" ? "text-good-700" : tone === "moss" ? "text-moss-700" : "text-ink-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ===========================================================================
 * UNIVERSITY CARD
 *
 * Its own component rather than a block inside the map, because it holds the
 * media request — a hook cannot be called from a loop body, and the request has
 * to be per-university.
 *
 * THE LAYOUT CHANGED WITH THE GEOMETRY. The previous card was a full-bleed
 * split: a photograph filling the left 40% edge to edge, its own corners
 * clipped by the card's, with a dark gradient over the lower half carrying the
 * name in white. That composition depends on the photograph being a controlled
 * crop — which a stock image is and a real one is not. Wikipedia will hand back
 * a portrait of a gate tower, a wide aerial, or a 3:1 panorama of a river, and
 * a fixed-height bleed turns all three into an unreadable slice.
 *
 * So the photograph is now an inset plate with its own radius, at a fixed
 * aspect ratio, and the name has moved out from on top of it onto the card
 * where it can be ink-900 on white. That is a plainer composition and a far
 * more robust one: it looks the same whatever shape the image turns out to be,
 * which is the only property that matters once the images stop being curated.
 * ======================================================================== */
function UniversityCard({
  match,
  isCompared,
  onToggleCompare,
  index,
}: {
  match: UniversityMatch;
  isCompared: boolean;
  onToggleCompare: () => void;
  index: number;
}) {
  const { university: uni, programme } = match;
  const { hero, crest, credit, isReal } = useUniversityMedia(uni.wikipedia, uni.heroImage);
  const [crestFailed, setCrestFailed] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.06, duration: 0.3 }}
      className="surface-card surface-ruled rounded-3xl p-3 sm:p-4"
    >
      <div className="flex flex-col gap-4 lg:flex-row">

        {/* --- The photograph ------------------------------------------- */}
        <div className="lg:w-[19rem] lg:shrink-0">
          <div className="media aspect-[16/10] w-full lg:aspect-[4/3]">
            <img
              src={hero}
              alt={`${uni.name} campus`}
              loading="lazy"
              decoding="async"
              className="transition-opacity duration-500"
            />
            {/* The crest sits on the photograph rather than beside the name,
                which is where a university puts it on its own material. It is
                on a light plate because the arms are drawn for paper and half
                of them have white in their field. */}
            <div className="absolute left-2.5 top-2.5 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/90 shadow-e2 backdrop-blur-sm">
                {crest && !crestFailed ? (
                  <img
                    src={crest}
                    alt=""
                    onError={() => setCrestFailed(true)}
                    className="h-7 w-7 object-contain"
                  />
                ) : (
                  <span className="text-micro font-bold uppercase tracking-tight text-ink-800">
                    {uni.logo}
                  </span>
                )}
              </span>
              <Badge solid tone="neutral" className="bg-ink-900/75 backdrop-blur-sm">
                {uni.country}
              </Badge>
            </div>
          </div>

          {/* Attribution. Held back until the real image is on screen, because
              crediting Commons for a stock photo would be a lie. */}
          {isReal && credit && (
            <p className="mt-1.5 truncate px-1 text-tiny text-ink-400">
              {credit} · Wikimedia Commons
            </p>
          )}
        </div>

        {/* --- The programme -------------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0 text-lg font-bold leading-tight text-ink-900 text-balance sm:text-xl">
                {uni.name}
              </h2>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-moss-50 px-2.5 py-1 text-xs font-bold text-moss-700">
                <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span data-numeric>{match.matchScore}%</span>
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-ink-600">{programme.title}</p>
          </div>

          {/* Three tiles, not four. `Match Score` moved up beside the name —
              it is the one figure that ranks the card, so it belongs with the
              title rather than buried at the end of a row of peers. */}
          <div className="grid grid-cols-3 gap-1.5">
            <Metric label="QS Rank" value={`#${uni.qsRanking}`} />
            <Metric label="Employability" value={`${programme.graduateEmployability}%`} tone="good" />
            <Metric label="Admission" value={programme.admissionDifficulty} />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">
              <Wallet className="h-3 w-3" strokeWidth={2} />
              {programme.currency} {programme.tuitionFee.toLocaleString()} tuition
            </Badge>
            <Badge tone="neutral">
              <Wallet className="h-3 w-3" strokeWidth={2} />
              {programme.currency} {programme.livingCost.toLocaleString()} living
            </Badge>
            <Badge tone="neutral">
              <Clock className="h-3 w-3" strokeWidth={2} />
              {programme.durationMonths} months
            </Badge>
            {programme.scholarshipsAvailable && (
              <Badge tone="moss">
                <Award className="h-3 w-3" strokeWidth={2} />
                Scholarships
              </Badge>
            )}
          </div>

          <Panel tone="cool" className="rounded-2xl text-sm leading-relaxed text-ink-700">
            <span className="font-bold text-moss-700">Why this fits you: </span>
            {match.personalizedExplanation}
          </Panel>

          <div className="mt-auto flex items-center gap-2 pt-1">
            <Button variant="inverse" size="md" className="flex-1">
              View details
            </Button>
            <Button
              variant={isCompared ? "secondary" : "outline"}
              size="md"
              className="flex-1"
              onClick={onToggleCompare}
              aria-pressed={isCompared}
            >
              {isCompared ? "Added to compare" : "Compare"}
            </Button>
            <Button variant="outline" size="icon" aria-label="Save this programme">
              <Bookmark className="h-4 w-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ===========================================================================
 * COMPARE COLUMN
 * ======================================================================== */
function CompareColumn({ match }: { match: UniversityMatch }) {
  const { hero } = useUniversityMedia(match.university.wikipedia, match.university.heroImage);
  const { university: uni, programme } = match;

  const rows: Array<[string, React.ReactNode]> = [
    ["QS Rank", `#${uni.qsRanking}`],
    ["Programme", programme.title],
    ["Tuition fee", `${programme.currency} ${programme.tuitionFee.toLocaleString()}`],
    ["Living cost", `${programme.currency} ${programme.livingCost.toLocaleString()}`],
    ["Scholarships", programme.scholarshipsAvailable ? "Yes" : "No"],
    ["Admission difficulty", programme.admissionDifficulty],
    ["Employability", `${programme.graduateEmployability}%`],
    ["Research strength", uni.researchStrength],
    ["Campus size", uni.campusSize],
    ["Intl. diversity", uni.internationalDiversity],
    ["Industry connections", uni.industryConnections],
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="media aspect-[16/10] w-full">
        <img src={hero} alt={`${uni.name} campus`} loading="lazy" />
      </div>
      <h4 className="px-1 text-sm font-bold leading-tight text-ink-900 text-balance">
        {uni.name}
      </h4>
      <dl className="flex flex-col gap-1">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-ink-50 px-3 py-2">
            <dt className="eyebrow">{label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink-900 text-pretty">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function UniversityView({ path, signals, constraints, onBack }: UniversityViewProps) {
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState("All");
  const [filterBudget, setFilterBudget] = useState("All");
  const [filterDegree, setFilterDegree] = useState("All");
  const [filterIntake, setFilterIntake] = useState("All");
  const [filterScholarship, setFilterScholarship] = useState("All");
  const [compareList, setCompareList] = useState<UniversityMatch[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!path) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Simulate intelligence engine loading
    const timer = setTimeout(() => {
      const recommendations = getUniversityRecommendations(path, signals, constraints);
      setMatches(recommendations);
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [path, signals, constraints]);

  const toggleCompare = (match: UniversityMatch) => {
    if (compareList.some((c) => c.programme.id === match.programme.id)) {
      setCompareList((prev) => prev.filter((c) => c.programme.id !== match.programme.id));
    } else if (compareList.length < 3) {
      setCompareList((prev) => [...prev, match]);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filterCountry !== "All" && match.university.country !== filterCountry) return false;
    if (filterBudget === "Low" && match.programme.tuitionFee > 20000) return false;
    if (filterBudget === "High" && match.programme.tuitionFee <= 20000) return false;
    if (filterDegree !== "All" && match.programme.degreeType !== filterDegree) return false;
    if (filterIntake !== "All" && !match.programme.intakes.includes(filterIntake)) return false;
    if (filterScholarship === "Yes" && !match.programme.scholarshipsAvailable) return false;
    return true;
  });

  if (!path) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center justify-center">
        <Panel className="rounded-3xl p-7 text-center" cloud="card">
          <GraduationCap className="mx-auto h-10 w-10 text-ink-300" strokeWidth={1.5} />
          <h3 className="mt-4 text-lg font-bold text-ink-900">No career selected</h3>
          <p className="mt-1.5 text-sm text-ink-500 text-pretty">
            Choose a career path to unlock personalised university recommendations.
          </p>
          <Button variant="primary" size="lg" block className="mt-5" onClick={onBack}>
            Return to career paths
          </Button>
        </Panel>
      </div>
    );
  }

  const uniqueCountries = Array.from(new Set(matches.map((m) => m.university.country)));
  const uniqueDegrees = Array.from(new Set(matches.map((m) => m.programme.degreeType)));
  const uniqueIntakes = Array.from(new Set(matches.flatMap((m) => m.programme.intakes)));

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">

      {/* ==================================================================
          HEADER
          ================================================================ */}
      <header className="mb-4">
        <p className="eyebrow">University intelligence</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 text-balance">
          Where this path is taught
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink-500 text-pretty">
          Programmes ranked against your academic profile, your constraints and where{" "}
          {path.fieldName ?? "this path"} actually leads. Every photograph is the real campus,
          pulled from the university's own Wikipedia article.
        </p>
      </header>

      {/* ==================================================================
          FILTERS
          One capsule bar. It was a bordered rectangle of five square selects;
          the selects are pills now and the bar around them is a single track,
          so the row reads as one control rather than as five.
          ================================================================ */}
      <div className="mb-5 flex flex-col gap-2 rounded-2xl bg-ink-50 p-2 md:flex-row md:flex-wrap md:items-center">
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center">
          <FilterSelect label="Country" value={filterCountry} onChange={setFilterCountry}>
            <option value="All">All countries</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="Budget" value={filterBudget} onChange={setFilterBudget}>
            <option value="All">All budgets</option>
            <option value="Low">Low tuition / funded</option>
            <option value="High">Premium / private</option>
          </FilterSelect>

          <FilterSelect label="Degree" value={filterDegree} onChange={setFilterDegree}>
            <option value="All">All degrees</option>
            {uniqueDegrees.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="Intake" value={filterIntake} onChange={setFilterIntake}>
            <option value="All">All intakes</option>
            {uniqueIntakes.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="Scholarship" value={filterScholarship} onChange={setFilterScholarship}>
            <option value="All">Any scholarship</option>
            <option value="Yes">Scholarships available</option>
          </FilterSelect>
        </div>

        <div className="flex items-center gap-2 md:ml-auto">
          <span className="hidden text-xs font-semibold text-ink-500 lg:block" data-numeric>
            {filteredMatches.length} of {matches.length}
          </span>
          {compareList.length > 0 && (
            <Button variant="primary" size="md" onClick={() => setShowCompare(true)}>
              Compare ({compareList.length})
            </Button>
          )}
        </div>
      </div>

      {/* ==================================================================
          RESULTS
          ================================================================ */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-card surface-ruled rounded-3xl p-3 sm:p-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                <Skeleton className="aspect-[16/10] w-full rounded-lg lg:aspect-[4/3] lg:w-[19rem] lg:shrink-0" />
                <div className="flex flex-1 flex-col gap-3">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3.5 w-1/3" />
                  <div className="grid grid-cols-3 gap-1.5">
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                    <Skeleton className="h-12 rounded-lg" />
                  </div>
                  <Skeleton className="h-16 rounded-2xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No programmes match exactly"
          description="Try widening a filter, or go back and pick a different path."
          action={
            <Button variant="primary" size="md" onClick={onBack}>
              Return to career paths
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredMatches.map((match, idx) => (
            <UniversityCard
              key={match.programme.id}
              match={match}
              index={idx}
              isCompared={compareList.some((c) => c.programme.id === match.programme.id)}
              onToggleCompare={() => toggleCompare(match)}
            />
          ))}
        </div>
      )}

      {/* ==================================================================
          COMPARE
          The labels column is gone. It carried eleven row headings that had to
          line up by eye with eleven values in each of three sibling columns,
          which is why the old markup needed `pt-48` on one column to force the
          alignment — a magic number that broke the moment a university name
          wrapped to two lines. Each column now carries its own labels, which
          costs some repetition and buys an arrangement that cannot drift.
          ================================================================ */}
      <Portal>
      <AnimatePresence>
        {showCompare && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
              onClick={() => setShowCompare(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-e5"
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 px-5 py-3.5">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-ink-900">Compare universities</h3>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Side-by-side analysis of your top picks.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCompare(false)}
                  aria-label="Close comparison"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="scroll-slim min-h-0 flex-1 overflow-auto p-4 sm:p-5">
                <p className="mb-3 text-tiny text-ink-500 sm:hidden">
                  Scroll sideways to compare →
                </p>
                <div className="grid min-w-[42rem] grid-cols-3 gap-4">
                  {compareList.map((match) => (
                    <CompareColumn key={match.programme.id} match={match} />
                  ))}

                  {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/60 p-5 text-center"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-lg font-bold text-ink-400">
                        +
                      </span>
                      <p className="text-xs font-semibold text-ink-500">
                        Add another university to compare
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </Portal>
    </div>
  );
}
