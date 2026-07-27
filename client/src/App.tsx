import React, { useState, useEffect, useRef } from "react";
import ChatContainer from "./components/fab/ChatContainer";

import BestFitPathsView from "./components/fab/BestFitPathsView";
import CareerDetailView from "./components/fab/CareerDetailView";
import UniversityView from "./components/fab/UniversityView";
import RoadmapView from "./components/fab/RoadmapView";
import DashboardHomeView from "./components/fab/DashboardHomeView";
import ExperimentsView from "./components/fab/ExperimentsView";
import JourneyView from "./components/fab/JourneyView";
import { ChatSession, Message, Phase, ProfileSignals, PracticalConstraints, CareerPath, CareerConfidence } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { DailyReality, CognitiveLoad, PilotExperience } from "./lib/pilotOrchestrator";
import {
  MessageSquare,
  Layers,
  GraduationCap,
  CalendarRange,
  ChevronRight,
  Info,
  Home,
  Beaker,
  BookOpen,
  RefreshCw,
  Menu,
  Loader2,
  Cloud,
  CloudOff,
  LogOut
} from "lucide-react";

import { Logo } from "./components/Logo";
import AuthPage from "./components/auth/AuthPage";
import { AuthUser, useAuth } from "./auth/AuthContext";
import {
  NorthrSyncedState,
  STORAGE_KEYS,
  authHeaders,
  cancelStateSync,
  clearLocalState,
  fetchServerState,
  flushStateSync,
  readLocalState,
  scheduleStateSync,
  writeLocal,
  writeStateToLocal,
} from "./lib/stateSync";
import { experienceLibrary } from "./data/experienceLibrary";
import { updateConfidence, EXPERIMENT_COMPLETED_MATCH } from "./lib/confidenceEngine";


// Initial Empty Signals & Constraints
const initialSignals: ProfileSignals = {
  openness: { value: "", label: "Curiosity & Risk Appetite", description: "", detected: false },
  conscientiousness: { value: "", label: "Drive & Execution Style", description: "", detected: false },
  extraversion: { value: "", label: "Collaboration Style", description: "", detected: false },
  agreeableness: { value: "", label: "Empathy & Vibe alignment", description: "", detected: false },
  stability: { value: "", label: "Anxiety & Stress Shield", description: "", detected: false },
  competence: { value: "", label: "Implicit Superpower", description: "", detected: false },
  motivation: { value: "", label: "Core Career Anchor", description: "", detected: false },
};

const initialConstraints: PracticalConstraints = {
  financial: { value: "", label: "Financial Runway", detected: false },
  timeline: { value: "", label: "Settle Timeline", detected: false },
  geography: { value: "", label: "Geographic Bound", detected: false },
  academic: { value: "", label: "CGPA / Backlogs", detected: false },
  exams: { value: "", label: "Competitive Exams", detected: false },
};

const initialDailyReality: DailyReality = {
  workload: "Medium",
  academicFocus: "Lectures",
  energyLevel: "Medium",
  availableHours: 2,
};

// The server rebuilds the whole profile on every turn and only fills in
// label/description for signals it has actually detected — undetected ones come
// back blank. Merging (rather than replacing) keeps our field labels intact so
// the UI never renders nameless rows.
function mergeSignals(incoming: ProfileSignals | null | undefined): ProfileSignals {
  if (!incoming) return initialSignals;
  const next = { ...initialSignals };
  (Object.keys(initialSignals) as (keyof ProfileSignals)[]).forEach((key) => {
    const signal = incoming[key];
    if (signal?.detected) next[key] = signal;
  });
  return next;
}

function mergeConstraints(incoming: PracticalConstraints | null | undefined): PracticalConstraints {
  if (!incoming) return initialConstraints;
  const next = { ...initialConstraints };
  (Object.keys(initialConstraints) as (keyof PracticalConstraints)[]).forEach((key) => {
    const constraint = incoming[key];
    if (constraint?.detected) next[key] = constraint;
  });
  return next;
}

// FAB asks for the degree with this exact phrasing (server/src/flow.ts) and
// renders the answers as MCQ options, so the real degree can be read straight
// out of the transcript rather than guessed or hardcoded.
const DEGREE_PROMPT_MARKER = "which of these are you studying";

function deriveStudentDegree(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.sender === "user") continue;
    if (!msg.text?.toLowerCase().includes(DEGREE_PROMPT_MARKER)) continue;

    if (msg.selectedOption) return msg.selectedOption.trim();

    const reply = messages.slice(i + 1).find((m) => m.sender === "user");
    if (reply?.text) return reply.text.replace(/^option picked:\s*/i, "").trim();
    return "";
  }
  return "";
}

function Workspace({ user }: { user: AuthUser }) {
  const { token, isGuest, logout } = useAuth();

  // Navigation Tabs: 'home' | 'fab' | 'experiments' | 'paths' | 'journey'
  const [activeTab, setActiveTab] = useState<"home" | "fab" | "experiments" | "paths" | "journey">("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => typeof window !== "undefined" ? window.innerWidth < 1024 : false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sub-tabs inside Career Paths to allow rich drill-down views
  const [pathsSubTab, setPathsSubTab] = useState<"list" | "detail" | "universities" | "roadmap">("list");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Session State
  const [phase, setPhase] = useState<Phase>("phase1");
  const [signals, setSignals] = useState<ProfileSignals>(initialSignals);
  const [constraints, setConstraints] = useState<PracticalConstraints>(initialConstraints);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [bestFitPaths, setBestFitPaths] = useState<CareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [compareList, setCompareList] = useState<CareerPath[]>([]);
  const [reflectionText, setReflectionText] = useState<string | null>(null);
  const [reflectionApproved, setReflectionApproved] = useState<boolean>(false);

  // Evidence list completed in the Experiments Workspace
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  // The student's real degree, learned from the FAB conversation. Empty until
  // they actually tell FAB — never seeded with sample data.
  const [studentDegree, setStudentDegree] = useState<string>("");

  // Pilot Orchestrator States
  const [dailyReality, setDailyReality] = useState<DailyReality>(initialDailyReality);
  const [cognitiveBudget, setCognitiveBudget] = useState<CognitiveLoad>("Light");
  const [activePilotExperience, setActivePilotExperience] = useState<PilotExperience | null>(null);
  const [completedExperienceIds, setCompletedExperienceIds] = useState<string[]>([]);
  const [careerConfidences, setCareerConfidences] = useState<CareerConfidence[]>([]);
  const prevCompletedRef = useRef<string[]>([]);

  // Cloud sync status
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Gamification counters — a brand new account starts at zero.
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const displayName = user.name || "Student";

  // ---------------------------------------------------------------------------
  // Boot & sync
  //
  // localStorage stays the instant local cache. For signed-in (non-guest) users
  // the server copy is fetched right after and wins when it exists. Guests never
  // touch the network.
  // ---------------------------------------------------------------------------

  /** Applies a synced snapshot to component state. Returns true if it carried chat sessions. */
  const applySyncedState = (state: NorthrSyncedState): boolean => {
    if (state.lsm) {
      if (state.lsm.signals) setSignals(state.lsm.signals);
      if (state.lsm.constraints) setConstraints(state.lsm.constraints);
      if (Array.isArray(state.lsm.bestFitPaths)) setBestFitPaths(state.lsm.bestFitPaths);
      if (state.lsm.degree) setStudentDegree(state.lsm.degree);
    }
    if (state.dailyReality) setDailyReality(state.dailyReality);
    if (state.cognitiveBudget) setCognitiveBudget(state.cognitiveBudget);
    if (state.activePilotExperience !== undefined) {
      setActivePilotExperience(state.activePilotExperience);
    }
    if (Array.isArray(state.completedExperienceIds)) {
      setCompletedExperienceIds(state.completedExperienceIds);
      prevCompletedRef.current = state.completedExperienceIds;
    }
    if (Array.isArray(state.careerConfidences)) setCareerConfidences(state.careerConfidences);
    if (Array.isArray(state.evidenceList)) setEvidenceList(state.evidenceList);

    const sessions = state.chatSessions;
    if (!Array.isArray(sessions) || sessions.length === 0) return false;

    setChatSessions(sessions);
    const activeSession = sessions[0]; // most recent lives at the head
    setActiveSessionId(activeSession.id);
    setPhase(activeSession.phase || "phase1");
    setMessages(activeSession.messages || []);
    setSelectedPath(activeSession.selectedPath || null);
    setCompareList(activeSession.compareList || []);
    setReflectionText(activeSession.reflectionText || null);
    setReflectionApproved(activeSession.reflectionApproved || false);

    if (activeSession.selectedPath) {
      setActiveTab("paths");
      setPathsSubTab(activeSession.viewingRoadmap ? "roadmap" : "detail");
    }
    return true;
  };

  const bootedRef = useRef(false);

  useEffect(() => {
    // StrictMode mounts effects twice in dev; booting twice would spawn a
    // duplicate chat session, so this runs exactly once per session.
    if (bootedRef.current) return;
    bootedRef.current = true;

    // 1. Local cache — instant, works offline and for guests.
    const hadLocalSessions = applySyncedState(readLocalState());
    if (!hadLocalSessions) createNewChatSession();

    // 2. Server copy wins for signed-in users.
    if (!token || isGuest) {
      setIsHydrating(false);
      return;
    }

    setIsSyncing(true);
    fetchServerState(token)
      .then((remote) => {
        if (!remote) return;
        applySyncedState(remote);
        writeStateToLocal(remote);
      })
      .finally(() => {
        setIsSyncing(false);
        setIsHydrating(false);
      });

    // Deliberately no cleanup/cancel flag: bootedRef already guarantees this
    // runs once, and StrictMode's simulated unmount would otherwise cancel the
    // only in-flight hydration, leaving the app stuck in its loading state.
    // Runs once per signed-in session (Workspace is keyed by user id).
  }, []);

  // Mirror every synced slice up to the server, debounced ~2s. No-op for guests.
  useEffect(() => {
    if (isHydrating) return;
    scheduleStateSync(token, {
      chatSessions,
      lsm: { signals, constraints, bestFitPaths, degree: studentDegree },
      dailyReality,
      cognitiveBudget,
      activePilotExperience,
      completedExperienceIds,
      careerConfidences,
      evidenceList,
    });
  }, [
    isHydrating,
    token,
    chatSessions,
    signals,
    constraints,
    bestFitPaths,
    studentDegree,
    dailyReality,
    cognitiveBudget,
    activePilotExperience,
    completedExperienceIds,
    careerConfidences,
    evidenceList,
  ]);

  // Don't lose the last couple of seconds of work when the tab goes away.
  useEffect(() => {
    const handleBeforeUnload = () => flushStateSync();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushStateSync();
    };
  }, []);

  // Keep the degree in step with what the student actually told FAB.
  useEffect(() => {
    const derived = deriveStudentDegree(messages);
    if (derived && derived !== studentDegree) setStudentDegree(derived);
  }, [messages]);

  // Completing an experiment nudges confidence in its career pathway.
  useEffect(() => {
    if (isHydrating) return;

    const previouslyCompleted = prevCompletedRef.current;
    const newlyCompleted = completedExperienceIds.filter((id) => !previouslyCompleted.includes(id));
    prevCompletedRef.current = completedExperienceIds;
    if (newlyCompleted.length === 0) return;

    setCareerConfidences((prev) => {
      let next = prev;
      for (const id of newlyCompleted) {
        const exp = experienceLibrary.find((e) => e.id === id);
        if (exp?.careerPathway) {
          next = updateConfidence(
            next,
            exp.careerPathway,
            EXPERIMENT_COMPLETED_MATCH,
            "Completed experiment matching pathway"
          );
        }
      }
      return next;
    });
  }, [completedExperienceIds, isHydrating]);

  // --- Local cache writers ---------------------------------------------------

  useEffect(() => {
    if (isHydrating) return;
    writeLocal(STORAGE_KEYS.chatSessions, chatSessions);
  }, [chatSessions, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    writeLocal(STORAGE_KEYS.lsm, { signals, constraints, bestFitPaths, degree: studentDegree });
  }, [signals, constraints, bestFitPaths, studentDegree, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    writeLocal(STORAGE_KEYS.dailyReality, dailyReality);
  }, [dailyReality, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    localStorage.setItem(STORAGE_KEYS.cognitiveBudget, cognitiveBudget);
  }, [cognitiveBudget, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    if (activePilotExperience) {
      writeLocal(STORAGE_KEYS.activePilotExperience, activePilotExperience);
    } else {
      localStorage.removeItem(STORAGE_KEYS.activePilotExperience);
    }
  }, [activePilotExperience, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    writeLocal(STORAGE_KEYS.completedExperienceIds, completedExperienceIds);
  }, [completedExperienceIds, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    writeLocal(STORAGE_KEYS.careerConfidences, careerConfidences);
  }, [careerConfidences, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    writeLocal(STORAGE_KEYS.evidenceList, evidenceList);
  }, [evidenceList, isHydrating]);

  // --- Session helpers -------------------------------------------------------

  // Save current session to cache on updates
  const saveSession = (updates: Partial<ChatSession> & { signals?: ProfileSignals, constraints?: PracticalConstraints, bestFitPaths?: CareerPath[] }) => {
    // 1. Calculate next states for Living Student Model
    const nextSignals = updates.signals !== undefined ? updates.signals : signals;
    if (updates.signals) setSignals(updates.signals);

    const nextConstraints = updates.constraints !== undefined ? updates.constraints : constraints;
    if (updates.constraints) setConstraints(updates.constraints);

    const nextPaths = updates.bestFitPaths !== undefined ? updates.bestFitPaths : bestFitPaths;
    if (updates.bestFitPaths) setBestFitPaths(updates.bestFitPaths);

    // 2. Calculate next states for current Chat Session
    const nextPhase = updates.phase !== undefined ? updates.phase : phase;
    if (updates.phase !== undefined) setPhase(updates.phase);

    const nextMsgs = updates.messages !== undefined ? updates.messages : messages;
    if (updates.messages !== undefined) setMessages(updates.messages);

    const nextSelected = updates.selectedPath !== undefined ? updates.selectedPath : selectedPath;
    if (updates.selectedPath !== undefined) setSelectedPath(updates.selectedPath);

    const nextCompare = updates.compareList !== undefined ? updates.compareList : compareList;
    if (updates.compareList !== undefined) setCompareList(updates.compareList);

    const nextRef = updates.reflectionText !== undefined ? updates.reflectionText : reflectionText;
    if (updates.reflectionText !== undefined) setReflectionText(updates.reflectionText);

    const nextApp = updates.reflectionApproved !== undefined ? updates.reflectionApproved : reflectionApproved;
    if (updates.reflectionApproved !== undefined) setReflectionApproved(updates.reflectionApproved);

    const session: ChatSession = {
      id: activeSessionId || "default",
      title: "Conversation",
      createdAt: new Date().toISOString(),
      messages: nextMsgs,
      phase: nextPhase,
      selectedPath: nextSelected || undefined,
      compareList: nextCompare,
      reflectionText: nextRef || undefined,
      reflectionApproved: nextApp,
      viewingRoadmap: pathsSubTab === "roadmap"
    };

    // Update session list
    const updatedSessions = [...chatSessions];
    const sIdx = updatedSessions.findIndex(s => s.id === session.id);
    if (sIdx >= 0) {
      updatedSessions[sIdx] = session;
    } else {
      updatedSessions.push(session);
    }
    setChatSessions(updatedSessions);
    // localStorage caching and the debounced /api/state push are both driven by
    // the state effects above, so there is nothing to persist by hand here.
  };

  const createNewChatSession = () => {
    const sessionId = "session_" + Date.now();
    setActiveSessionId(sessionId);
    const freshMessages: Message[] = [
      {
        id: "msg_init_" + Date.now(),
        sender: "fab",
        text: "Heyy! Welcome to Northr. I am FAB.\n\nFifteen quick questions, one real answer at the end: the career path that actually fits you.\n\nFirst things first, what do I call you?",
        timestamp: new Date().toISOString()
      }
    ];
    setPhase("phase1");
    setMessages(freshMessages);
    setSelectedPath(null);
    setCompareList([]);
    setReflectionText(null);
    setReflectionApproved(false);

    const session: ChatSession = {
      id: sessionId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      messages: freshMessages,
      phase: "phase1"
    };

    setChatSessions((prev) => [session, ...prev]);
  };

  const resetSession = () => {
    cancelStateSync();
    clearLocalState();

    setCompletedExperienceIds([]);
    prevCompletedRef.current = [];
    setActivePilotExperience(null);
    setDailyReality(initialDailyReality);
    setCognitiveBudget("Light");
    setCareerConfidences([]);
    setStudentDegree("");

    setPhase("phase1");
    setSignals(initialSignals);
    setConstraints(initialConstraints);
    setMessages([]);
    setBestFitPaths([]);
    setChatSessions([]);
    setActiveSessionId(null);
    setSelectedPath(null);
    setCompareList([]);
    setReflectionText(null);
    setReflectionApproved(false);
    setEvidenceList([]);
    setActiveTab("home");
    setPathsSubTab("list");
    setErrorMessage(null);

    createNewChatSession();
  };

  const handleSignOut = () => {
    cancelStateSync();
    setErrorMessage(null);
    // logout() clears the token, the guest flag and every northr_* app key.
    logout();
  };

  const [isPilotSyncing, setIsPilotSyncing] = useState(false);

  const runPilotAnalysis = async () => {
    if (messages.length < 2 || isPilotSyncing) return;
    setIsPilotSyncing(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/pilot/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token)
        },
        body: JSON.stringify({ messages, currentPaths: bestFitPaths })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to sync to Pilot Orchestrator");
      }
      const data = await response.json();

      // Update LSM Career Confidence
      if (data.careerConfidenceUpdates && data.careerConfidenceUpdates.length > 0) {
        setBestFitPaths((prev) => {
          const updatedPaths = prev.map((p) => ({ ...p }));
          data.careerConfidenceUpdates.forEach((update: any) => {
            const idx = updatedPaths.findIndex(p => p.fieldName.toLowerCase() === update.fieldName.toLowerCase() || p.fieldName.toLowerCase().includes(update.fieldName.toLowerCase()));
            if (idx >= 0) {
              updatedPaths[idx].matchScore = Math.min(100, Math.max(0, updatedPaths[idx].matchScore + update.change));
            }
          });
          return updatedPaths;
        });
      }

      // Update Journey
      if (data.newJourneyMilestones && data.newJourneyMilestones.length > 0) {
        setEvidenceList(prev => {
          const nextList = [...prev];
          data.newJourneyMilestones.forEach((m: any) => {
            nextList.push({
              id: "milestone_" + Date.now() + Math.random(),
              type: "Reflection",
              title: m.title,
              content: m.title + " - " + m.description,
              timestamp: new Date().toISOString(),
              tags: ["Pilot Milestone", m.impact]
            });
          });
          return nextList;
        });
      }

      // Recommend Experiences
      if (data.recommendedExperiences && data.recommendedExperiences.length > 0) {
        if (data.recommendedExperiences[0]) {
          setActivePilotExperience(data.recommendedExperiences[0]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Pilot Orchestrator sync failed.");
    } finally {
      setIsPilotSyncing(false);
    }
  };

  const handleSendMessage = async (text: string, optionSelected?: string) => {
    if (isProcessing) return;
    setErrorMessage(null);

    // Create user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toISOString()
    };

    // If selected an option, record it on the question that was answered
    const updatedMsgs = messages.map((m, idx) => {
      if (!optionSelected || idx !== messages.length - 1) return m;
      if (m.sender !== "fab" && m.sender !== "aryan") return m;
      return { ...m, selectedOption: optionSelected };
    });

    const currentMessages = [...updatedMsgs, userMessage];
    setMessages(currentMessages);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/fab/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token)
        },
        body: JSON.stringify({
          messages: currentMessages,
          phase: phase,
          signals: signals,
          constraints: constraints,
          reflectionApproved: reflectionApproved
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Server returned HTTP ${response.status}`);
      }

      const data = await response.json();

      const newFabMessage: Message = {
        id: `fab_${Date.now()}`,
        sender: "fab",
        text: data.reply || "Thinking...",
        timestamp: new Date().toISOString(),
        options: data.options || undefined
      };

      // Check if phase transition occurred
      let nextPhase = data.updatedPhase || phase;

      // Update state arrays with response values
      const mergedMsgs = [...currentMessages, newFabMessage];
      const mergedPaths = data.bestFitPaths || bestFitPaths;

      // Handle reflection approvals
      let nextRefApproved = reflectionApproved;
      if (phase === "reflection" && text.toLowerCase().match(/(yes|correct|close|spot on|agree|perfect|absolutely)/)) {
        nextRefApproved = true;
      }

      const nextSignals = data.updatedSignals ? mergeSignals(data.updatedSignals) : signals;
      const nextConstraints = data.updatedConstraints
        ? mergeConstraints(data.updatedConstraints)
        : constraints;

      setPhase(nextPhase);
      setMessages(mergedMsgs);
      if (data.updatedSignals) setSignals(nextSignals);
      if (data.updatedConstraints) setConstraints(nextConstraints);
      if (data.reflectionText) setReflectionText(data.reflectionText);
      if (data.bestFitPaths && data.bestFitPaths.length > 0) {
        setBestFitPaths(data.bestFitPaths);
      }

      saveSession({
        phase: nextPhase,
        signals: nextSignals,
        constraints: nextConstraints,
        messages: mergedMsgs,
        bestFitPaths: mergedPaths,
        reflectionText: data.reflectionText || reflectionText || undefined,
        reflectionApproved: nextRefApproved
      });

    } catch (err: any) {
      console.error("Failed to connect to FAB AI service:", err);
      setErrorMessage(err?.message || "Could not connect to the FAB engine. Your progress is saved locally.");

      // Fallback response inside App state
      const fallbackMsg: Message = {
        id: `fallback_${Date.now()}`,
        sender: "fab",
        text: "My apologies! I am currently feeling a high server load. Can you please restate that or try again shortly?",
        timestamp: new Date().toISOString()
      };
      const finalMsgs = [...currentMessages, fallbackMsg];
      setMessages(finalMsgs);
      saveSession({ messages: finalMsgs });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleCompare = (path: CareerPath) => {
    let nextCompare = [...compareList];
    const index = nextCompare.findIndex(p => p.id === path.id);
    if (index >= 0) {
      nextCompare.splice(index, 1);
    } else {
      if (nextCompare.length >= 5) {
        setErrorMessage("You can compare a maximum of 5 career pathways at once.");
        return;
      }
      nextCompare.push(path);
    }
    setCompareList(nextCompare);
    saveSession({ compareList: nextCompare });
  };

  const handleAddEvidence = (item: any) => {
    setEvidenceList(prev => [...prev, item]);
  };

  const handleConfidenceUpdate = (fieldName: string, change: number) => {
    setBestFitPaths(prev => prev.map(path => {
      if (path.fieldName.toLowerCase() === fieldName.toLowerCase() ||
          path.fieldName.toLowerCase().includes(fieldName.toLowerCase()) ||
          fieldName.toLowerCase().includes(path.fieldName.toLowerCase())) {
        const newScore = Math.min(99, path.matchScore + change);
        return { ...path, matchScore: newScore };
      }
      return path;
    }));
  };

  const completedCount = evidenceList.length;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 text-slate-900 font-sans">

      {/* Mobile Top Bar (Visible only on small screens) */}
      {activeTab === "home" && (
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center space-x-2">
            <div className="flex shrink-0 h-8 w-8 items-center justify-center">
              <Logo className="h-8 w-8 rounded-lg" />
            </div>
            <span className="font-display font-extrabold text-slate-900 text-lg tracking-tight">northr</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 -mr-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Error Warnings */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden shrink-0"
          >
            <div className="bg-rose-50 text-rose-800 border-b border-rose-100 px-4 py-2.5 flex items-center justify-center gap-3 text-xs font-bold">
              <span className="text-center">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="shrink-0 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SaaS split screen layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR: LEFT COLUMN NAVIGATION */}
        <>
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          <div className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out md:sticky md:translate-x-0 shrink-0 h-screen top-0 flex flex-col ${
            (isSidebarCollapsed && !isMobileMenuOpen) ? "w-[76px]" : "w-64"
          } ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}>

            {/* Brand Logo Header inside the sidebar */}
            <div className={`p-4 border-b border-slate-100 flex items-center h-[72px] ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center cursor-pointer hover:bg-slate-50 transition-colors" : "justify-between"}`} onClick={() => { if (isSidebarCollapsed) setIsSidebarCollapsed(false) }}>
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="flex shrink-0 h-9 w-9 items-center justify-center">
                  <Logo className="h-9 w-9 rounded-lg" />
                </div>
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-display text-lg font-extrabold tracking-tight text-slate-900 truncate">
                        northr
                      </span>
                      <span className="rounded-full bg-purple-50 border border-purple-100 px-1.5 py-0.5 text-[8px] font-mono font-bold text-[#4C1D95] uppercase shrink-0">
                        Pro
                      </span>
                    </div>
                    <p className="font-sans text-[9px] text-slate-400 font-bold tracking-wider uppercase truncate">
                      Your Career OS
                    </p>
                  </div>
                )}
              </div>
              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(!isSidebarCollapsed); }}
                  className="hidden md:flex p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Collapse Sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }}
                className="md:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
            </div>

            <div className={`flex-1 py-6 space-y-1.5 overflow-y-auto ${(isSidebarCollapsed && !isMobileMenuOpen) ? "px-2" : "px-4"}`}>

              <button
                id="sidebar-home"
                onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
                title={(isSidebarCollapsed && !isMobileMenuOpen) ? "Home" : undefined}
                className={`w-full flex items-center ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center" : "space-x-3 px-4"} py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative group ${
                  activeTab === "home"
                    ? "bg-[#4C1D95] text-white shadow-md shadow-purple-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {activeTab === "home" && (isSidebarCollapsed && !isMobileMenuOpen) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />
                )}
                <Home className="h-4 w-4 shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">Home</span>}

              </button>

              <button
                id="sidebar-fab"
                onClick={() => { setActiveTab("fab"); setIsMobileMenuOpen(false); }}
                title={(isSidebarCollapsed && !isMobileMenuOpen) ? "FAB Chat" : undefined}
                className={`w-full flex items-center ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center" : "space-x-3 px-4"} py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative group ${
                  activeTab === "fab"
                    ? "bg-[#4C1D95] text-white shadow-md shadow-purple-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {activeTab === "fab" && (isSidebarCollapsed && !isMobileMenuOpen) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />
                )}
                <MessageSquare className="h-4 w-4 shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">FAB Chat</span>}

              </button>

              <button
                id="sidebar-paths"
                onClick={() => { setActiveTab("paths"); setIsMobileMenuOpen(false); }}
                title={(isSidebarCollapsed && !isMobileMenuOpen) ? "Career Paths" : undefined}
                className={`w-full flex items-center ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center" : "space-x-3 px-4"} py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative group ${
                  activeTab === "paths"
                    ? "bg-[#4C1D95] text-white shadow-md shadow-purple-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {activeTab === "paths" && (isSidebarCollapsed && !isMobileMenuOpen) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />
                )}
                <Layers className="h-4 w-4 shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">Career Paths</span>}

              </button>

              <button
                id="sidebar-experiments"
                onClick={() => { setActiveTab("experiments"); setIsMobileMenuOpen(false); }}
                title={(isSidebarCollapsed && !isMobileMenuOpen) ? "Experiments" : undefined}
                className={`w-full flex items-center ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center" : "space-x-3 px-4"} py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative group ${
                  activeTab === "experiments"
                    ? "bg-[#4C1D95] text-white shadow-md shadow-purple-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {activeTab === "experiments" && (isSidebarCollapsed && !isMobileMenuOpen) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />
                )}
                <Beaker className="h-4 w-4 shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">Experiments</span>}

              </button>

              <button
                id="sidebar-journey"
                onClick={() => { setActiveTab("journey"); setIsMobileMenuOpen(false); }}
                title={(isSidebarCollapsed && !isMobileMenuOpen) ? "Journey" : undefined}
                className={`w-full flex items-center ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center" : "space-x-3 px-4"} py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative group ${
                  activeTab === "journey"
                    ? "bg-[#4C1D95] text-white shadow-md shadow-purple-100"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {activeTab === "journey" && (isSidebarCollapsed && !isMobileMenuOpen) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />
                )}
                <BookOpen className="h-4 w-4 shrink-0" />
                {(!isSidebarCollapsed || isMobileMenuOpen) && <span className="truncate">Journey</span>}

              </button>

              </div>
              {/* Functional Profile and Start Fresh */}
            <div className={`mt-auto border-t border-slate-100 bg-slate-50 flex flex-col shrink-0`}>
              <div className={`p-4 flex items-center ${(isSidebarCollapsed && !isMobileMenuOpen) ? "justify-center" : "justify-between space-x-2"} overflow-hidden min-h-[72px]`}>
                <div className={`flex items-center space-x-2 min-w-0`}>
                  <div className="h-8 w-8 rounded-full bg-[#4C1D95] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                    {displayName.charAt(0)}
                  </div>
                  {(!isSidebarCollapsed || isMobileMenuOpen) && (
                    <div className="truncate text-left min-w-0 flex-1">
                      <span className="block text-xs font-black text-slate-900 leading-tight truncate">
                        {displayName}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-mono font-bold leading-none truncate mt-0.5">
                        {user.email || "Guest session"}
                      </span>
                    </div>
                  )}
                </div>

                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>

              {(!isSidebarCollapsed || isMobileMenuOpen) && (
                <div className="px-4 -mt-1 pb-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    {isGuest ? (
                      <>
                        <CloudOff className="h-3 w-3 shrink-0" />
                        <span className="truncate">Saved on this device</span>
                      </>
                    ) : isSyncing ? (
                      <>
                        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                        <span className="truncate">Syncing…</span>
                      </>
                    ) : (
                      <>
                        <Cloud className="h-3 w-3 shrink-0 text-emerald-500" />
                        <span className="truncate">Synced to your account</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className={`px-4 pb-4 ${(isSidebarCollapsed && !isMobileMenuOpen) ? "hidden" : "block"}`}>
                <button
                  onClick={resetSession}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer hover:bg-slate-50 transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Start Fresh</span>
                </button>
              </div>
            </div>
          </div>
        </>
        {/* MAIN WORKSPACE AREA */}
        <div className={`flex-1 flex flex-col min-w-0 bg-[#F8FAFC] ${activeTab === "fab" ? "overflow-hidden h-full" : "overflow-y-auto"}`}>

          {/* Sub-tab navigation bar for paths sub-views (rendered only inside Paths tab) */}
          {activeTab === "paths" && pathsSubTab !== "list" && (
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPathsSubTab("list")}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <span>← Back to Hypotheses</span>
              </button>

              <button
                onClick={() => setPathsSubTab("detail")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  pathsSubTab === "detail" ? "bg-violet-600 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Info className="h-3.5 w-3.5" />
                <span>Details</span>
              </button>

              <button
                onClick={() => setPathsSubTab("universities")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  pathsSubTab === "universities" ? "bg-violet-600 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Universities</span>
              </button>

              <button
                onClick={() => setPathsSubTab("roadmap")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  pathsSubTab === "roadmap" ? "bg-violet-600 text-white" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span>90-Day Roadmap</span>
              </button>
            </div>
          )}

          {/* DYNAMIC VIEW CONTAINER */}
          <div className={`flex-1 ${(activeTab === "fab" || activeTab === "experiments") ? "p-0 h-full flex flex-col" : "p-4 sm:p-6 lg:p-8"}`}>
            <AnimatePresence mode="wait">

              {/* TAB 1: HOME WORKSPACE */}
              {activeTab === "home" && (
                <motion.div
                  key="home_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <DashboardHomeView
                    studentName={displayName}
                    studentDegree={studentDegree}
                    bestFitPaths={bestFitPaths}
                    onNavigateToTab={(tab) => {
                      setActiveTab(tab);
                      setPathsSubTab("list");
                    }}
                    completedCount={completedCount}
                    dailyReality={dailyReality}
                    setDailyReality={setDailyReality}
                    cognitiveBudget={cognitiveBudget}
                    setCognitiveBudget={setCognitiveBudget}
                    setActivePilotExperience={(exp) => {
                      setActivePilotExperience(exp);
                    }}
                    completedExperienceIds={completedExperienceIds}
                    careerConfidences={careerConfidences}
                  />
                </motion.div>
              )}

              {/* TAB 2: FAB CHAT WORKSPACE */}
              {activeTab === "fab" && (
                <motion.div
                  key="fab_tab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 h-full w-full overflow-hidden flex flex-col"
                >
                  <ChatContainer
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isProcessing={isProcessing}
                    phase={phase}
                    onNewChat={createNewChatSession}
                  />
                </motion.div>
              )}

              {/* TAB 3: EXPERIMENTS WORKSPACE */}
              {activeTab === "experiments" && (
                <motion.div
                  key="experiments_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ExperimentsView
                    onAddEvidence={handleAddEvidence}
                    bestFitPaths={bestFitPaths}
                    onConfidenceUpdate={handleConfidenceUpdate}
                    dailyReality={dailyReality}
                    setDailyReality={setDailyReality}
                    cognitiveBudget={cognitiveBudget}
                    setCognitiveBudget={setCognitiveBudget}
                    activePilotExperience={activePilotExperience}
                    setActivePilotExperience={setActivePilotExperience}
                    completedExperienceIds={completedExperienceIds}
                    setCompletedExperienceIds={setCompletedExperienceIds}
                    onNavigateToTab={(tab) => setActiveTab(tab as any)}
                    streak={streak}
                    setStreak={setStreak}
                    xp={xp}
                    setXp={setXp}
                    studentName={displayName}
                    studentDegree={studentDegree}
                    onOpenMenu={() => setIsMobileMenuOpen(true)}
                  />
                </motion.div>
              )}

              {/* TAB 4: CAREER PATHS WORKSPACE */}
              {activeTab === "paths" && (
                <div key="paths_tab">
                  {pathsSubTab === "list" && (
                    <motion.div
                      key="paths_list"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <BestFitPathsView
                        paths={bestFitPaths}
                        compareList={compareList}
                        onToggleCompare={handleToggleCompare}
                        onViewDetails={(path) => {
                          setSelectedPath(path);
                          setPathsSubTab("detail");
                          saveSession({ selectedPath: path });
                        }}
                        onViewUniversities={(path) => {
                          setSelectedPath(path);
                          setPathsSubTab("universities");
                          saveSession({ selectedPath: path });
                        }}
                        setActiveTab={setActiveTab}
                      />
                    </motion.div>
                  )}

                  {pathsSubTab === "detail" && selectedPath && (
                    <motion.div
                      key="paths_detail"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <CareerDetailView
                        path={selectedPath}
                        onBack={() => setPathsSubTab("list")}
                        onContinue={() => setPathsSubTab("universities")}
                        compareList={compareList}
                        onToggleCompare={handleToggleCompare}
                      />
                    </motion.div>
                  )}

                  {pathsSubTab === "universities" && (
                    <motion.div
                      key="paths_universities"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <UniversityView signals={signals} constraints={constraints}
                        path={selectedPath}
                        onBack={() => setPathsSubTab("detail")}
                        onContinue={() => setPathsSubTab("roadmap")}
                      />
                    </motion.div>
                  )}

                  {pathsSubTab === "roadmap" && selectedPath && (
                    <motion.div
                      key="paths_roadmap"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <RoadmapView
                        roadmap={selectedPath.roadmap}
                        onBack={() => setPathsSubTab("universities")}
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* TAB 5: JOURNEY LOG WORKSPACE */}
              {activeTab === "journey" && (
                <motion.div
                  key="journey_tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <JourneyView
                    studentName={displayName}
                    studentDegree={studentDegree}
                    signals={signals}
                    constraints={constraints}
                    evidenceList={evidenceList}
                    careerConfidences={careerConfidences}
                    bestFitPaths={bestFitPaths}
                    onNavigateToTab={(tab) => {
                      setActiveTab(tab);
                      setPathsSubTab("list");
                    }}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden flex items-center justify-around bg-white border-t border-slate-200 py-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-40 shrink-0">
        <button
          onClick={() => { setActiveTab("home"); setPathsSubTab("list"); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${activeTab === "home" ? "text-[#4C1D95]" : "text-slate-400 hover:text-slate-900"}`}
        >
          <Home className={`h-5 w-5 mb-1 ${activeTab === "home" ? "fill-purple-100" : ""}`} />
          <span className="text-[9px] font-bold tracking-wide">Home</span>
        </button>
        <button
          onClick={() => { setActiveTab("fab"); setPathsSubTab("list"); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${activeTab === "fab" ? "text-[#4C1D95]" : "text-slate-400 hover:text-slate-900"}`}
        >
          <MessageSquare className={`h-5 w-5 mb-1 ${activeTab === "fab" ? "fill-purple-100" : ""}`} />
          <span className="text-[9px] font-bold tracking-wide">Chat</span>
        </button>
        <button
          onClick={() => { setActiveTab("paths"); setPathsSubTab("list"); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${activeTab === "paths" ? "text-[#4C1D95]" : "text-slate-400 hover:text-slate-900"}`}
        >
          <Layers className={`h-5 w-5 mb-1 ${activeTab === "paths" ? "fill-purple-100" : ""}`} />
          <span className="text-[9px] font-bold tracking-wide">Paths</span>
        </button>
        <button
          onClick={() => { setActiveTab("experiments"); setPathsSubTab("list"); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${activeTab === "experiments" ? "text-[#4C1D95]" : "text-slate-400 hover:text-slate-900"}`}
        >
          <Beaker className={`h-5 w-5 mb-1 ${activeTab === "experiments" ? "fill-purple-100" : ""}`} />
          <span className="text-[9px] font-bold tracking-wide">Experiments</span>
        </button>
        <button
          onClick={() => { setActiveTab("journey"); setPathsSubTab("list"); }}
          className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${activeTab === "journey" ? "text-[#4C1D95]" : "text-slate-400 hover:text-slate-900"}`}
        >
          <BookOpen className={`h-5 w-5 mb-1 ${activeTab === "journey" ? "fill-purple-100" : ""}`} />
          <span className="text-[9px] font-bold tracking-wide">Journey</span>
        </button>
      </div>

    </div>
  );
}

/** Full-screen splash shown while the stored token is being validated. */
function BootSplash() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-5 bg-[#050505]">
      <Logo className="h-14 w-14 rounded-2xl" />
      <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white/40">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Restoring your session</span>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <BootSplash />;
  if (!user) return <AuthPage />;

  // Keying by user id guarantees a clean slate when accounts are swapped.
  return <Workspace key={user.id} user={user} />;
}
