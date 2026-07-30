import React, { useState, useEffect, useRef } from "react";
import ChatContainer from "./components/fab/ChatContainer";

import BestFitPathsView from "./components/fab/BestFitPathsView";
import CareerDetailView from "./components/fab/CareerDetailView";
import UniversityView from "./components/fab/UniversityView";
import RoadmapView from "./components/fab/RoadmapView";
import DashboardHomeView from "./components/fab/DashboardHomeView";
import ExperimentsView from "./components/fab/ExperimentsView";
import JourneyView from "./components/fab/JourneyView";
import { ChatSession, Message, Phase, ProfileSignals, PracticalConstraints, CareerPath, CareerConfidence, AssessmentState, ChatProgress, PsychReadout, UserMemory } from "./types";
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
  LogOut,
  X
} from "lucide-react";

import { Logo } from "./components/Logo";
import { Button, Segmented } from "./ui";
import AuthPage from "./components/auth/AuthPage";
import { AuthUser, useAuth } from "./auth/AuthContext";
import {
  NorthrSyncedState,
  STORAGE_KEYS,
  authHeaders,
  cancelStateSync,
  clearLocalState,
  clearUserMemory,
  fetchServerState,
  fetchUserMemory,
  flushStateSync,
  readLocal,
  readLocalState,
  scheduleStateSync,
  writeLocal,
  writeStateToLocal,
} from "./lib/stateSync";
import {
  Recording,
  VoiceStatus,
  fetchVoiceStatus,
  playClips,
  sendVoiceTurn,
  stopSpeaking,
  synthesize,
} from "./lib/voice";
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

// Fallback only. The server now reports the resolved degree name directly
// (FlowResponse.degreeName), which is authoritative because it comes from
// findDegree() rather than from whatever the student happened to type.
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

// FAB's opening line. Kept in sync with NAME_PROMPT in server/src/flow.ts: the
// server recognises "what do I call you" in the transcript, so the first-time
// wording must contain it and the returning-student wording must not — a
// student FAB already knows is never asked their name twice.
const FIRST_TIME_GREETING =
  "Heyy! Welcome to Northr, I am FAB.\n\nBefore I can point you anywhere useful, I want to actually know you a little. So this is just a chat, no right answers.\n\nFirst things first, what do I call you?";

function openingGreeting(memory: UserMemory | null): string {
  if (!memory?.name) return FIRST_TIME_GREETING;

  const degree = memory.degreeName ? ` Still ${memory.degreeName}, yeah?` : "";
  const top = memory.topPaths[0]
    ? ` Last time ${memory.topPaths[0].fieldName} was sitting right at the top of your list.`
    : "";
  return `Heyy ${memory.name}, good to see you back.${degree}${top}\n\nPick up wherever you like. Type it or just talk to me.`;
}

function Workspace({ user }: { user: AuthUser }) {
  const { token, isGuest, logout } = useAuth();

  // Navigation Tabs: 'home' | 'fab' | 'experiments' | 'paths' | 'journey'
  const [activeTab, setActiveTab] = useState<"home" | "fab" | "experiments" | "paths" | "journey">("home");
  // Navigation lives in a floating pill across the top rather than a left
  // rail, so there is no collapsed/expanded state any more — only the mobile
  // dropdown and the account popover.
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  // Escape closes either overlay. The mobile dropdown also locks body scroll,
  // which the old drawer never did.
  useEffect(() => {
    if (!isMobileMenuOpen && !isAccountOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsMobileMenuOpen(false);
      setIsAccountOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen, isAccountOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  // Click-outside for the account popover. Pointerdown rather than click so
  // the menu closes before whatever was clicked underneath reacts.
  useEffect(() => {
    if (!isAccountOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) setIsAccountOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isAccountOpen]);

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

  // The conversation's position. Owned by the server, parked here so the
  // stateless API can resume after a refresh or on another device.
  const [assessment, setAssessment] = useState<AssessmentState | null>(null);
  const [progress, setProgress] = useState<ChatProgress | null>(null);
  const [psychometrics, setPsychometrics] = useState<PsychReadout | null>(null);

  // Evidence list completed in the Experiments Workspace
  const [evidenceList, setEvidenceList] = useState<any[]>([]);

  // Voice chat (Sarvam, server-side). `voiceStatus` stays null until the server
  // says it has a key, which is what hides every voice control when it does not.
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<string>(
    () => readLocal<string>(STORAGE_KEYS.voiceLanguage, "auto")
  );
  const [autoSpeak, setAutoSpeak] = useState<boolean>(
    () => readLocal<boolean>(STORAGE_KEYS.autoSpeak, true)
  );
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // What FAB remembers about this student across every conversation. Server
  // owned; the chat and the voice endpoints both refresh it on every turn.
  // The ref exists because createNewChatSession is called from boot, outside
  // the render that first receives the memory.
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const memoryRef = useRef<UserMemory | null>(null);
  useEffect(() => { memoryRef.current = memory; }, [memory]);

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
    setAssessment(activeSession.assessment || null);
    setProgress(activeSession.progress || null);
    setPsychometrics(activeSession.psychometrics || null);

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

  // Long-term memory, loaded once per session. It arrives after boot, so a
  // greeting that is still sitting untouched gets upgraded in place rather than
  // asking a student we already know who they are.
  useEffect(() => {
    if (!token || isGuest) return;
    let cancelled = false;
    fetchUserMemory(token).then((remembered) => {
      if (!cancelled && remembered) setMemory(remembered);
    });
    return () => { cancelled = true; };
  }, [token, isGuest]);

  useEffect(() => {
    if (!memory?.name) return;
    setMessages((prev) => {
      const untouched = prev.length === 1 && prev[0].sender === "fab" && prev[0].text === FIRST_TIME_GREETING;
      if (!untouched) return prev;
      return [{ ...prev[0], text: openingGreeting(memory) }];
    });
  }, [memory]);

  // Is voice available at all? Only the server knows, because only the server
  // has the Sarvam key. Until it answers, the chat is exactly as it was.
  useEffect(() => {
    let cancelled = false;
    fetchVoiceStatus(token).then((status) => {
      if (!cancelled && status?.enabled) setVoiceStatus(status);
    });
    return () => { cancelled = true; };
  }, [token]);

  // Nobody wants FAB still talking after they navigate away.
  useEffect(() => () => stopSpeaking(), []);

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

    const nextAssessment = updates.assessment !== undefined ? updates.assessment : assessment;
    if (updates.assessment !== undefined) setAssessment(updates.assessment);

    const nextProgress = updates.progress !== undefined ? updates.progress : progress;
    if (updates.progress !== undefined) setProgress(updates.progress);

    const nextPsych = updates.psychometrics !== undefined ? updates.psychometrics : psychometrics;
    if (updates.psychometrics !== undefined) setPsychometrics(updates.psychometrics);

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
      assessment: nextAssessment,
      progress: nextProgress,
      psychometrics: nextPsych,
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
        text: openingGreeting(memoryRef.current),
        timestamp: new Date().toISOString()
      }
    ];
    setPhase("phase1");
    setMessages(freshMessages);
    setSelectedPath(null);
    setCompareList([]);
    setReflectionText(null);
    setReflectionApproved(false);
    setAssessment(null);
    setProgress(null);
    setPsychometrics(null);

    const session: ChatSession = {
      id: sessionId,
      title: "New Conversation",
      createdAt: new Date().toISOString(),
      messages: freshMessages,
      phase: "phase1",
      assessment: null,
      progress: null,
      psychometrics: null
    };

    setChatSessions((prev) => [session, ...prev]);
  };

  const resetSession = () => {
    cancelStateSync();
    clearLocalState();
    stopSpeaking();
    setSpeakingMessageId(null);

    // Starting fresh means FAB forgets too, otherwise the next conversation
    // greets them by a name they just asked us to drop.
    setMemory(null);
    memoryRef.current = null;
    void clearUserMemory(token);

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

  /**
   * Folds one FAB turn into app state, whether it arrived from the typed
   * endpoint or the spoken one. Both return the identical payload — the server
   * runs the same flow for both — so there is exactly one place that knows how
   * to apply it. Returns FAB's new message so a voice turn can play it.
   */
  const applyTurn = (data: any, currentMessages: Message[], userText: string): Message => {
    const newFabMessage: Message = {
      id: `fab_${Date.now()}`,
      sender: "fab",
      text: data.reply || "Thinking...",
      timestamp: new Date().toISOString(),
      options: data.options || undefined,
      language: data.languageCode || undefined,
      // Only when it differs: FAB spoke their language, the transcript stays English.
      spokenText: data.spokenText && data.spokenText !== data.reply ? data.spokenText : undefined
    };

    // Check if phase transition occurred
    let nextPhase = data.updatedPhase || phase;

    // Update state arrays with response values
    const mergedMsgs = [...currentMessages, newFabMessage];
    const mergedPaths = data.bestFitPaths || bestFitPaths;

    // Handle reflection approvals
    let nextRefApproved = reflectionApproved;
    if (phase === "reflection" && userText.toLowerCase().match(/(yes|correct|close|spot on|agree|perfect|absolutely)/)) {
      nextRefApproved = true;
    }

    const nextSignals = data.updatedSignals ? mergeSignals(data.updatedSignals) : signals;
    const nextConstraints = data.updatedConstraints
      ? mergeConstraints(data.updatedConstraints)
      : constraints;

    const nextAssessment = data.assessment ?? assessment;
    const nextProgress = data.progress ?? progress;
    const nextPsych = data.psychometrics ?? psychometrics;

    setPhase(nextPhase);
    setMessages(mergedMsgs);
    if (data.updatedSignals) setSignals(nextSignals);
    if (data.updatedConstraints) setConstraints(nextConstraints);
    if (data.reflectionText) setReflectionText(data.reflectionText);
    if (data.bestFitPaths && data.bestFitPaths.length > 0) {
      setBestFitPaths(data.bestFitPaths);
    }
    setAssessment(nextAssessment);
    setProgress(nextProgress);
    if (data.psychometrics) setPsychometrics(data.psychometrics);
    if (data.degreeName) setStudentDegree(data.degreeName);
    // What FAB now remembers about them, across every session and both channels.
    if (data.memory) setMemory(data.memory);

    saveSession({
      phase: nextPhase,
      signals: nextSignals,
      constraints: nextConstraints,
      messages: mergedMsgs,
      bestFitPaths: mergedPaths,
      reflectionText: data.reflectionText || reflectionText || undefined,
      reflectionApproved: nextRefApproved,
      assessment: nextAssessment,
      progress: nextProgress,
      psychometrics: nextPsych
    });

    return newFabMessage;
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
          // The server's own flow state, handed back untouched. It re-validates
          // everything on arrival, so this is a convenience, not a trust path.
          assessment: assessment
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Server returned HTTP ${response.status}`);
      }

      applyTurn(await response.json(), currentMessages, text);

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

  // --- Voice -----------------------------------------------------------------

  /**
   * A spoken turn. The recording goes up, Sarvam transcribes it, the same FAB
   * flow that serves typed messages runs, and the answer comes back as text
   * plus audio. Nothing about the conversation forks: the transcript lands in
   * `messages` as an ordinary user message, so the next typed turn continues it.
   */
  const handleSendVoice = async (recording: Recording) => {
    if (isProcessing) return;
    setErrorMessage(null);
    setIsProcessing(true);
    stopSpeaking();
    setSpeakingMessageId(null);

    try {
      const data = await sendVoiceTurn(token, {
        recording,
        messages,
        assessment,
        language: voiceLanguage,
        speak: autoSpeak,
      });

      // The server already built the user message from what it heard; using its
      // copy keeps the client transcript identical to the one FAB reasoned over.
      const withUserTurn = [...messages, data.userMessage];
      setMessages(withUserTurn);

      const fabMessage = applyTurn(data, withUserTurn, data.transcript);

      if (autoSpeak && data.audio?.length) {
        setSpeakingMessageId(fabMessage.id);
        void playClips(data.audio).finally(() =>
          setSpeakingMessageId((current) => (current === fabMessage.id ? null : current))
        );
      }
    } catch (err: any) {
      console.error("Voice turn failed:", err);
      setErrorMessage(err?.message || "Could not send that recording. You can still type to FAB.");
    } finally {
      setIsProcessing(false);
    }
  };

  /** Read one FAB message out loud, or stop it if it is already talking. */
  const handleSpeakMessage = async (message: Message) => {
    if (speakingMessageId === message.id) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    stopSpeaking();
    setSpeakingMessageId(message.id);
    try {
      const { audio } = await synthesize(token, message.text, message.language || voiceLanguage);
      await playClips(audio);
    } catch (err: any) {
      console.error("Could not speak that message:", err);
      setErrorMessage(err?.message || "Could not read that out just now.");
    } finally {
      setSpeakingMessageId((current) => (current === message.id ? null : current));
    }
  };

  const handleVoiceLanguageChange = (code: string) => {
    setVoiceLanguage(code);
    writeLocal(STORAGE_KEYS.voiceLanguage, code);
  };

  const handleToggleAutoSpeak = () => {
    setAutoSpeak((prev) => {
      const next = !prev;
      writeLocal(STORAGE_KEYS.autoSpeak, next);
      if (!next) {
        stopSpeaking();
        setSpeakingMessageId(null);
      }
      return next;
    });
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

  /** The one place navigation is defined. Both the sidebar and the mobile bar
   *  render from this, so they can never drift apart again. */
  const NAV_ITEMS = [
    { id: "home",        label: "Home",        short: "Home",  icon: Home },
    { id: "fab",         label: "FAB Chat",    short: "Chat",  icon: MessageSquare },
    { id: "paths",       label: "Career Paths",short: "Paths", icon: Layers },
    { id: "experiments", label: "Experiments", short: "Lab",   icon: Beaker },
    { id: "journey",     label: "Journey",     short: "Journey", icon: BookOpen },
  ] as const;

  const go = (tab: (typeof NAV_ITEMS)[number]["id"]) => {
    setActiveTab(tab as any);
    setPathsSubTab("list");
    setIsMobileMenuOpen(false);
  };

  /** A sidebar navigation row. The active item is marked by a 2px accent rule
   *  on its leading edge plus a tinted fill — the standard for a vertical rail,
   *  and readable at a glance in a way a filled pill in a horizontal strip is
   *  not once there are five of them. Used by both the desktop rail and the
   *  mobile drawer so the two can never drift apart. */
  const NavItem = ({
    id,
    label,
    icon: Icon,
  }: {
    id: (typeof NAV_ITEMS)[number]["id"];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        id={`nav-${id}`}
        onClick={() => go(id)}
        aria-current={active ? "page" : undefined}
        className={`relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-semibold transition-colors duration-150 ${
          active
            ? "bg-moss-50 text-moss-700 before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-r before:bg-moss-500 before:content-['']"
            : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );
  };

  const syncState = isGuest
    ? { Icon: CloudOff, text: "Saved on this device", tone: "text-ink-500" }
    : isSyncing
      ? { Icon: Loader2, text: "Syncing…", tone: "text-ink-500" }
      : { Icon: Cloud, text: "Synced", tone: "text-good-700" };

  /** The top bar renders the current location rather than repeating the nav.
   *  Paths is the only tab with depth, so it is the only one that produces a
   *  second crumb. */
  const activeNav = NAV_ITEMS.find((item) => item.id === activeTab);
  const pageTitle = activeNav?.label ?? "";
  const crumb =
    activeTab === "paths" && pathsSubTab !== "list"
      ? pathsSubTab === "detail"
        ? selectedPath?.fieldName ?? "Details"
        : pathsSubTab === "universities"
          ? "Universities"
          : "90-Day Plan"
      : null;

  /** The nav list, shared by the desktop rail and the mobile drawer. */
  const navList = (
    <nav aria-label="Primary" className="flex flex-col gap-0.5 p-2">
      {NAV_ITEMS.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
    </nav>
  );

  return (
    // The shell is a two-column frame: a fixed rail on the left, and a column
    // on the right holding the top bar and the scrolling content region. Both
    // columns own their own overflow, so the rail never scrolls with the view
    // and the view never has to reserve space for floating chrome.
    <div className="flex h-[100dvh] overflow-hidden bg-ink-50 font-sans text-ink-900">

      {/* ====================================================================
          SIDEBAR
          A real column, not a floating pill. It is bounded by a single rule on
          its right edge; everything inside it aligns to one left margin.
          ================================================================= */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink-200 bg-white md:flex">
        {/* Brand block. Same height as the top bar so the two rules opposite
            each other line up across the seam. */}
        <div className="flex h-13 shrink-0 items-center gap-2.5 border-b border-ink-200 px-4">
          <button
            onClick={() => go("home")}
            aria-label="Northr home"
            className="flex min-w-0 items-center gap-2.5 rounded-md"
          >
            <Logo className="h-6 w-6 shrink-0 rounded-xs" />
            <span className="truncate text-sm font-bold tracking-tight text-ink-900">
              northr
            </span>
            <span className="shrink-0 rounded-xs border border-ink-200 bg-ink-50 px-1.5 py-px text-micro font-bold uppercase tracking-[0.07em] text-ink-500">
              Pro
            </span>
          </button>
        </div>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">{navList}</div>

        {/* Rail footer: session state and the destructive-ish reset, kept far
            from the primary nav and behind a rule. */}
        <div className="shrink-0 border-t border-ink-200 p-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-micro font-bold uppercase tracking-[0.07em] ${syncState.tone}`}
          >
            <syncState.Icon
              className={`h-3 w-3 shrink-0 ${isSyncing && !isGuest ? "animate-spin" : ""}`}
            />
            <span className="truncate">{syncState.text}</span>
          </div>
          <button
            onClick={resetSession}
            disabled={isProcessing}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-semibold text-ink-600 transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40"
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${isProcessing ? "animate-spin" : ""}`} />
            <span className="truncate">Start fresh</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer + scrim. Slides from the left, because that is where the
          rail lives on every other breakpoint. */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-ink-900/40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
              className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink-200 bg-white shadow-e5 md:hidden"
            >
              <div className="flex h-13 shrink-0 items-center justify-between border-b border-ink-200 px-4">
                <span className="flex items-center gap-2.5">
                  <Logo className="h-6 w-6 rounded-xs" />
                  <span className="text-sm font-bold tracking-tight">northr</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="scroll-slim min-h-0 flex-1 overflow-y-auto">{navList}</div>
              <div className="shrink-0 border-t border-ink-200 p-2">
                <button
                  onClick={resetSession}
                  disabled={isProcessing}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-40"
                >
                  <RefreshCw className={`h-4 w-4 ${isProcessing ? "animate-spin" : ""}`} />
                  <span>Start fresh</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ====================================================================
          CONTENT COLUMN
          ================================================================= */}
      <div className="flex min-w-0 flex-1 flex-col">

        {/* Top bar. States where you are; it does not repeat the nav. */}
        <header className="flex h-13 shrink-0 items-center gap-3 border-b border-ink-200 bg-white px-3 sm:px-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Breadcrumb. Truncation is on the trailing crumb, so the section
              name never disappears before the leaf does. */}
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className={`shrink-0 text-sm font-bold tracking-tight ${
                crumb ? "text-ink-500" : "text-ink-900"
              }`}
            >
              {pageTitle}
            </span>
            {crumb && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                <span className="min-w-0 truncate text-sm font-bold tracking-tight text-ink-900">
                  {crumb}
                </span>
              </>
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {/* Account popover */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setIsAccountOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isAccountOpen}
                aria-label={`Account: ${displayName}`}
                className="flex h-8 items-center gap-2 rounded-md border border-ink-200 bg-white pl-1 pr-2 transition-colors duration-150 hover:bg-ink-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-ink-900 text-micro font-bold uppercase text-white">
                  {displayName.charAt(0)}
                </span>
                <span className="hidden max-w-32 truncate text-xs font-semibold text-ink-700 sm:block">
                  {displayName}
                </span>
              </button>

              <AnimatePresence>
                {isAccountOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12, ease: [0.2, 0, 0, 1] }}
                    className="absolute right-0 top-[calc(100%+0.375rem)] z-50 w-60 origin-top-right rounded-lg border border-ink-200 bg-white shadow-e4"
                  >
                    <div className="border-b border-ink-200 px-3 py-2.5">
                      <div className="truncate text-sm font-bold leading-tight text-ink-900">
                        {displayName}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-ink-500">
                        {user.email || "Guest session"}
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 border-b border-ink-200 px-3 py-2 text-micro font-bold uppercase tracking-[0.07em] ${syncState.tone}`}
                    >
                      <syncState.Icon
                        className={`h-3 w-3 shrink-0 ${isSyncing && !isGuest ? "animate-spin" : ""}`}
                      />
                      <span className="truncate">{syncState.text}</span>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          handleSignOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Errors sit directly under the top bar as a full-width strip rather
            than as a floating capsule — an alert is part of the page, and one
            that overlays content hides the thing it is describing. */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              role="alert"
              className="shrink-0 overflow-hidden border-b border-bad-300/60 bg-bad-50"
            >
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="min-w-0 flex-1 text-xs font-semibold text-bad-700 text-pretty">
                  {errorMessage}
                </span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="shrink-0 rounded-xs px-2 py-0.5 text-micro font-bold uppercase tracking-[0.07em] text-bad-700 transition-colors hover:bg-bad-100"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN WORKSPACE AREA */}
        <main
          className={`relative flex min-w-0 flex-1 flex-col ${
            activeTab === "fab" ? "h-full overflow-hidden" : "scroll-slim overflow-y-auto"
          }`}
        >

          {/* Paths sub-navigation: a back affordance and an underlined tab
              strip on an opaque sticky bar. */}
          {activeTab === "paths" && pathsSubTab !== "list" && (
            <div className="sticky top-0 z-20 flex shrink-0 flex-wrap items-end gap-3 border-b border-ink-200 bg-white px-4 pt-2 sm:px-6">
              <Button
                className="mb-2"
                size="sm"
                variant="ghost"
                onClick={() => setPathsSubTab("list")}
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                <span>Hypotheses</span>
              </Button>

              {/* The tab strip's own bottom rule lands exactly on the bar's, so
                  the active underline reads as a mark on one continuous line
                  rather than as a second border. */}
              <Segmented
                className="ml-auto border-b-0"
                ariaLabel="Career path sections"
                value={pathsSubTab as "detail" | "universities" | "roadmap"}
                onChange={(v) => setPathsSubTab(v)}
                options={[
                  { value: "detail", label: "Details", icon: Info },
                  { value: "universities", label: "Universities", icon: GraduationCap },
                  { value: "roadmap", label: "90-Day Plan", icon: CalendarRange },
                ]}
              />
            </div>
          )}

          {/* DYNAMIC VIEW CONTAINER */}
          <div
            className={`flex-1 ${
              activeTab === "fab" || activeTab === "experiments"
                ? "flex h-full flex-col p-0"
                : "page"
            }`}
          >
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
                    progress={progress}
                    onNewChat={createNewChatSession}
                    voice={
                      voiceStatus
                        ? {
                            enabled: true,
                            languages: voiceStatus.languages,
                            language: voiceLanguage,
                            onLanguageChange: handleVoiceLanguageChange,
                            autoSpeak,
                            onToggleAutoSpeak: handleToggleAutoSpeak,
                            onSendVoice: handleSendVoice,
                            onSpeakMessage: handleSpeakMessage,
                            speakingMessageId,
                          }
                        : undefined
                    }
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
                        psychometrics={psychometrics}
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

        </main>

      </div>
    </div>
  );
}

/** Full-screen splash shown while the stored token is being validated. */
function BootSplash() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center gap-5 bg-ink-950">
      <Logo className="h-12 w-12 rounded-md" />
      <div className="flex items-center gap-2 font-mono text-micro font-bold uppercase tracking-wider text-white/40">
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
