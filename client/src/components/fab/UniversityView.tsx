import React, { useState, useEffect } from "react";
import { CareerPath, ProfileSignals, PracticalConstraints } from "../../types";
import { UniversityMatch, UniversityProgramme, University } from "../../data/universityData";
import { getUniversityRecommendations } from "../../lib/universityIntelligence";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, Bookmark, MapPin, Award, DollarSign,
  Briefcase, GraduationCap, Building, Users, Clock, ArrowRight, X, Sparkles, TrendingUp
} from "lucide-react";

interface UniversityViewProps {
  path: CareerPath | null;
  signals: ProfileSignals;
  constraints: PracticalConstraints;
  onBack: () => void;
  onContinue: () => void;
}

export default function UniversityView({ path, signals, constraints, onBack, onContinue }: UniversityViewProps) {
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
    if (compareList.some(c => c.programme.id === match.programme.id)) {
      setCompareList(prev => prev.filter(c => c.programme.id !== match.programme.id));
    } else if (compareList.length < 3) {
      setCompareList(prev => [...prev, match]);
    }
  };

  const filteredMatches = matches.filter(match => {
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
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white border border-ink-200 rounded-3xl p-12 shadow-e2 max-w-md">
          <GraduationCap className="h-16 w-16 text-ink-300 mx-auto mb-6" />
          <h3 className="text-xl font-display font-extrabold text-ink-900 mb-3">No Career Selected</h3>
          <p className="text-ink-500 font-medium mb-8">
            Choose a career path to unlock personalised university recommendations.
          </p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-clay-600 hover:bg-clay-700 text-white rounded-xl font-bold transition-colors w-full"
          >
            Return to Career Paths
          </button>
        </div>
      </div>
    );
  }

  const uniqueCountries = Array.from(new Set(matches.map(m => m.university.country)));
  const uniqueDegrees = Array.from(new Set(matches.map(m => m.programme.degreeType)));
  const uniqueIntakes = Array.from(new Set(matches.flatMap(m => m.programme.intakes)));

  return (
    <div className="w-full max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-10 space-y-3">
        <h1 className="text-3xl font-display font-extrabold text-ink-900 tracking-tight">
          University Intelligence
        </h1>
        <p className="text-ink-500 font-medium text-lg max-w-3xl">
          Explore universities that best align with your chosen career, academic profile and long-term goals.
        </p>
      </div>

      {/* Smart Filter Bar */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2.5 mb-8 p-3 sm:p-4 bg-white border border-ink-200 rounded-2xl shadow-e2">
        <select 
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          className="bg-ink-50 border border-ink-200 text-ink-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/20 w-full md:w-auto"
        >
          <option value="All">All Countries</option>
          {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={filterBudget}
          onChange={e => setFilterBudget(e.target.value)}
          className="bg-ink-50 border border-ink-200 text-ink-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/20 w-full md:w-auto"
        >
          <option value="All">All Budgets</option>
          <option value="Low">Low Tuition / Funded</option>
          <option value="High">Premium / Private</option>
        </select>

        <select 
          value={filterDegree}
          onChange={e => setFilterDegree(e.target.value)}
          className="bg-ink-50 border border-ink-200 text-ink-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/20 w-full md:w-auto"
        >
          <option value="All">All Degrees</option>
          {uniqueDegrees.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select 
          value={filterIntake}
          onChange={e => setFilterIntake(e.target.value)}
          className="bg-ink-50 border border-ink-200 text-ink-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/20 w-full md:w-auto"
        >
          <option value="All">All Intakes</option>
          {uniqueIntakes.map(i => <option key={i} value={i}>{i}</option>)}
        </select>

        <select 
          value={filterScholarship}
          onChange={e => setFilterScholarship(e.target.value)}
          className="bg-ink-50 border border-ink-200 text-ink-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-clay-500/20 w-full md:w-auto"
        >
          <option value="All">Any Scholarship</option>
          <option value="Yes">Scholarships Available</option>
        </select>

        <div className="col-span-2 md:col-span-1 md:ml-auto flex items-center justify-between md:justify-end w-full md:w-auto gap-3 mt-1 md:mt-0">
          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompare(true)}
              className="px-3.5 py-2 bg-clay-100 text-clay-700 hover:bg-clay-200 rounded-xl text-xs sm:text-sm font-bold transition-colors flex items-center space-x-1.5"
            >
              <span>Compare ({compareList.length})</span>
            </button>
          )}
          <select 
            className="bg-transparent text-ink-500 text-xs sm:text-sm font-bold px-2 py-2 focus:outline-none cursor-pointer"
          >
            <option>Sort By: Best Match</option>
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-ink-200 rounded-3xl overflow-hidden animate-pulse flex flex-col md:flex-row h-auto md:h-72">
              <div className="w-full md:w-1/3 bg-ink-200 h-48 md:h-full"></div>
              <div className="flex-1 p-8 space-y-4">
                <div className="h-4 bg-ink-200 rounded w-1/4"></div>
                <div className="h-8 bg-ink-200 rounded w-3/4"></div>
                <div className="h-4 bg-ink-200 rounded w-1/2"></div>
                <div className="h-20 bg-ink-50 rounded-xl mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-20 bg-white border border-ink-200 rounded-3xl shadow-e2">
          <GraduationCap className="h-12 w-12 text-ink-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-ink-900 mb-2">No programs match exactly</h3>
          <p className="text-ink-500 mb-6">Try adjusting your filters or checking your career path.</p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-clay-600 text-white rounded-xl font-bold hover:bg-clay-700 transition-colors"
          >
            Return to Career Paths
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredMatches.map((match, idx) => {
            const isCompared = compareList.some(c => c.programme.id === match.programme.id);
            return (
              <motion.div 
                key={match.programme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-white border border-ink-200 rounded-3xl overflow-hidden shadow-e2 hover:shadow-e5 transition-all duration-500 flex flex-col lg:flex-row"
              >
                {/* Hero Image Section */}
                <div className="lg:w-2/5 h-64 lg:h-auto relative overflow-hidden">
                  <img 
                    src={match.university.heroImage} 
                    alt={match.university.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Purple Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-clay-900/90 via-clay-900/40 to-transparent"></div>
                  
                  {/* Overlay Content */}
                  <div className="absolute bottom-0 left-0 p-6 lg:p-8 w-full">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 text-2xl shadow-e4">
                        {match.university.logo}
                      </div>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-white text-xs font-bold uppercase tracking-wider">
                        {match.university.country}
                      </span>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-display font-extrabold text-white leading-tight drop-shadow-e2">
                      {match.university.name}
                    </h2>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col justify-between bg-white relative">
                  
                  {/* Top Row: Meta stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-ink-100">
                    <div>
                      <p className="text-micro uppercase tracking-wider font-bold text-ink-500 mb-1">QS Rank</p>
                      <p className="text-base sm:text-xl font-extrabold text-ink-900">#{match.university.qsRanking}</p>
                    </div>
                    <div>
                      <p className="text-micro uppercase tracking-wider font-bold text-ink-500 mb-1">Employability</p>
                      <p className="text-base sm:text-xl font-extrabold text-good-500">{match.programme.graduateEmployability}%</p>
                    </div>
                    <div>
                      <p className="text-micro uppercase tracking-wider font-bold text-ink-500 mb-1">Difficulty</p>
                      <p className="text-xs sm:text-sm font-bold text-ink-900 mt-1">{match.programme.admissionDifficulty}</p>
                    </div>
                    <div>
                      <p className="text-micro uppercase tracking-wider font-bold text-ink-500 mb-1">Match Score</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Sparkles className="h-3.5 w-3.5 text-clay-500" />
                        <span className="text-xs sm:text-sm font-bold text-clay-600">{match.matchScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Program Info */}
                  <div className="mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-ink-900 mb-2">
                      {match.programme.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-medium text-ink-600">
                      <span className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-0.5 text-ink-500"/> {match.programme.currency} {match.programme.tuitionFee.toLocaleString()}/yr (Tuition)</span>
                      <span className="flex items-center"><DollarSign className="h-3.5 w-3.5 mr-0.5 text-ink-500"/> {match.programme.currency} {match.programme.livingCost.toLocaleString()}/yr (Living)</span>
                      <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-0.5 text-ink-500"/> {match.programme.durationMonths} Mos</span>
                      {match.programme.scholarshipsAvailable && (
                        <span className="flex items-center text-clay-700 bg-clay-50 px-2 py-0.5 rounded-md text-tiny font-bold border border-clay-200">
                          <Award className="h-3 w-3 mr-0.5"/> Scholarships
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Personalized Explanation */}
                  <div className="bg-ink-50 border border-ink-100 rounded-2xl p-3.5 sm:p-4 mb-6">
                    <p className="text-xs sm:text-sm text-ink-700 leading-relaxed font-medium">
                      <span className="font-bold text-clay-700 mr-2">Why this fits you:</span>
                      {match.personalizedExplanation}
                    </p>
                  </div>

                   {/* Actions */}
                  <div className="flex items-center space-x-2 sm:space-x-3 mt-auto w-full">
                    <button className="flex-1 py-2.5 sm:py-3 bg-ink-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-ink-800 transition-colors shadow-e2 text-center">
                      View Details
                    </button>
                    <button 
                      onClick={() => toggleCompare(match)}
                      className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors border text-center ${
                        isCompared 
                          ? 'bg-clay-50 text-clay-700 border-clay-200' 
                          : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50'
                      }`}
                    >
                      {isCompared ? (
                        <span>Added<span className="hidden sm:inline"> to Compare</span></span>
                      ) : (
                        'Compare'
                      )}
                    </button>
                    <button className="p-2.5 sm:p-3 text-ink-500 hover:text-ink-900 bg-white border border-ink-200 rounded-xl hover:bg-ink-50 transition-colors shrink-0">
                      <Bookmark className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompare && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
              onClick={() => setShowCompare(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl bg-white rounded-3xl shadow-e5 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-ink-100 flex items-center justify-between bg-ink-50">
                <div>
                  <h3 className="text-2xl font-display font-extrabold text-ink-900">Compare Universities</h3>
                  <p className="text-sm font-medium text-ink-500 mt-1">Side-by-side analysis of your top picks.</p>
                </div>
                <button 
                  onClick={() => setShowCompare(false)}
                  className="p-2 bg-white border border-ink-200 rounded-full text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* The comparison grid needs its 800px to stay legible, so the
                  fix is to let it scroll sideways with a visible affordance
                  rather than silently clipping inside `overflow-auto`. */}
              <div className="scroll-slim flex-1 overflow-auto p-4 sm:p-6">
                <p className="mb-3 text-tiny text-ink-500 sm:hidden">Scroll sideways to compare →</p>
                <div className="grid min-w-[800px] grid-cols-4 gap-6">
                  {/* Labels Column */}
                  <div className="space-y-6 pt-48">
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">QS Rank</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Programme</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Tuition Fee</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Living Cost</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Scholarships</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Admission Difficulty</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Employability</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Research Strength</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Campus Size</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4 border-b border-ink-100">Intl. Diversity</div>
                    <div className="text-sm font-bold text-ink-500 uppercase tracking-wider py-4">Industry Connections</div>
                  </div>

                  {/* University Columns */}
                  {compareList.map(match => (
                    <div key={match.programme.id} className="space-y-6">
                      <div className="h-40 rounded-2xl overflow-hidden relative mb-8">
                        <img src={match.university.heroImage} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-ink-900/40"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h4 className="text-white font-bold text-lg leading-tight">{match.university.name}</h4>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-ink-900 py-4 border-b border-ink-100">#{match.university.qsRanking}</div>
                      <div className="text-sm font-bold text-ink-900 py-4 border-b border-ink-100">{match.programme.title}</div>
                      <div className="text-sm font-bold text-ink-900 py-4 border-b border-ink-100">{match.programme.currency} {match.programme.tuitionFee.toLocaleString()}</div>
                      <div className="text-sm font-bold text-ink-900 py-4 border-b border-ink-100">{match.programme.currency} {match.programme.livingCost.toLocaleString()}</div>
                      <div className="text-sm font-bold text-ink-900 py-4 border-b border-ink-100">{match.programme.scholarshipsAvailable ? 'Yes' : 'No'}</div>
                      <div className="text-sm font-bold text-ink-900 py-4 border-b border-ink-100">{match.programme.admissionDifficulty}</div>
                      <div className="text-sm font-bold text-good-500 py-4 border-b border-ink-100">{match.programme.graduateEmployability}%</div>
                      <div className="text-sm font-medium text-ink-700 py-4 border-b border-ink-100">{match.university.researchStrength}</div>
                      <div className="text-sm font-medium text-ink-700 py-4 border-b border-ink-100">{match.university.campusSize}</div>
                      <div className="text-sm font-medium text-ink-700 py-4 border-b border-ink-100">{match.university.internationalDiversity}</div>
                      <div className="text-sm font-medium text-ink-700 py-4">{match.university.industryConnections}</div>
                    </div>
                  ))}
                  
                  {/* Empty place holders if < 3 */}
                  {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="border-2 border-dashed border-ink-200 rounded-3xl flex flex-col items-center justify-center p-6 bg-ink-50/50">
                      <div className="h-12 w-12 rounded-full bg-ink-200 flex items-center justify-center mb-4">
                        <span className="text-ink-500 font-bold">+</span>
                      </div>
                      <p className="text-sm font-bold text-ink-500 text-center">Add another university to compare</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
