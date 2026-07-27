import { CareerConfidence, CareerPath, ChatSession, PracticalConstraints, ProfileSignals } from "../types";
import { CognitiveLoad, DailyReality, PilotExperience } from "./pilotOrchestrator";
import { GUEST_TOKEN } from "../auth/AuthContext";

// ---------------------------------------------------------------------------
// Server-side state sync (replaces the old Firestore mirroring).
//
//   GET /api/state  Bearer -> {state: <json> | null}
//   PUT /api/state  Bearer, {state: <json>} -> {ok:true}
//
// localStorage stays the fast local cache; the server copy is the portable one.
// On login (non-guest) the server copy wins over localStorage. Guest sessions
// never touch the network.
// ---------------------------------------------------------------------------

export interface LivingStudentModelCache {
  signals?: ProfileSignals;
  constraints?: PracticalConstraints;
  bestFitPaths?: CareerPath[];
  /** Degree the student picked during the FAB flow, once it is known. */
  degree?: string;
}

export interface NorthrSyncedState {
  chatSessions?: ChatSession[];
  lsm?: LivingStudentModelCache;
  dailyReality?: DailyReality;
  cognitiveBudget?: CognitiveLoad;
  activePilotExperience?: PilotExperience | null;
  completedExperienceIds?: string[];
  careerConfidences?: CareerConfidence[];
  evidenceList?: any[];
}

export const STORAGE_KEYS = {
  chatSessions: "northr_chat_sessions",
  legacyChatSession: "northr_chat_session",
  lsm: "northr_lsm",
  dailyReality: "northr_daily_reality",
  cognitiveBudget: "northr_cognitive_budget",
  activePilotExperience: "northr_active_pilot_exp",
  completedExperienceIds: "northr_completed_exp_ids",
  careerConfidences: "northr_career_confidences",
  evidenceList: "northr_evidence",
} as const;

const SYNC_DEBOUNCE_MS = 2000;
/** The API caps a state document at 1MB; stay under it with a little headroom. */
const MAX_STATE_BYTES = 1_000_000;

export function isGuestToken(token: string | null): boolean {
  return !token || token === GUEST_TOKEN;
}

export function authHeaders(token: string | null): Record<string, string> {
  return { Authorization: `Bearer ${token || GUEST_TOKEN}` };
}

/** Safe localStorage JSON read. Returns `fallback` on missing/corrupt values. */
export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to cache "${key}" locally:`, err);
  }
}

/**
 * Reads the full synced snapshot back out of localStorage. Missing or corrupt
 * slices are simply omitted, so the caller keeps its own defaults for them.
 */
export function readLocalState(): NorthrSyncedState {
  if (typeof window === "undefined") return {};

  const state: NorthrSyncedState = {};

  const chatSessions = readLocal<ChatSession[] | null>(STORAGE_KEYS.chatSessions, null);
  if (Array.isArray(chatSessions)) state.chatSessions = chatSessions;

  const lsm = readLocal<LivingStudentModelCache | null>(STORAGE_KEYS.lsm, null);
  if (lsm && typeof lsm === "object") state.lsm = lsm;

  const dailyReality = readLocal<DailyReality | null>(STORAGE_KEYS.dailyReality, null);
  if (dailyReality && typeof dailyReality === "object") state.dailyReality = dailyReality;

  // Stored as a bare string (not JSON) — keep that shape for backwards compat.
  const budget = localStorage.getItem(STORAGE_KEYS.cognitiveBudget);
  if (budget) state.cognitiveBudget = budget as CognitiveLoad;

  const activeExp = readLocal<PilotExperience | null>(STORAGE_KEYS.activePilotExperience, null);
  if (activeExp && typeof activeExp === "object") state.activePilotExperience = activeExp;

  const completed = readLocal<string[] | null>(STORAGE_KEYS.completedExperienceIds, null);
  if (Array.isArray(completed)) state.completedExperienceIds = completed;

  const confidences = readLocal<CareerConfidence[] | null>(STORAGE_KEYS.careerConfidences, null);
  if (Array.isArray(confidences)) state.careerConfidences = confidences;

  const evidence = readLocal<any[] | null>(STORAGE_KEYS.evidenceList, null);
  if (Array.isArray(evidence)) state.evidenceList = evidence;

  return state;
}

/** Mirrors a full synced snapshot into localStorage (used after a server hydrate). */
export function writeStateToLocal(state: NorthrSyncedState): void {
  if (state.chatSessions) writeLocal(STORAGE_KEYS.chatSessions, state.chatSessions);
  if (state.lsm) writeLocal(STORAGE_KEYS.lsm, state.lsm);
  if (state.dailyReality) writeLocal(STORAGE_KEYS.dailyReality, state.dailyReality);
  if (state.cognitiveBudget) localStorage.setItem(STORAGE_KEYS.cognitiveBudget, state.cognitiveBudget);
  if (state.completedExperienceIds) writeLocal(STORAGE_KEYS.completedExperienceIds, state.completedExperienceIds);
  if (state.careerConfidences) writeLocal(STORAGE_KEYS.careerConfidences, state.careerConfidences);
  if (state.evidenceList) writeLocal(STORAGE_KEYS.evidenceList, state.evidenceList);
  if (state.activePilotExperience) {
    writeLocal(STORAGE_KEYS.activePilotExperience, state.activePilotExperience);
  } else if (state.activePilotExperience === null) {
    localStorage.removeItem(STORAGE_KEYS.activePilotExperience);
  }
}

/** Clears every locally cached Northr key (used on logout / "Start Fresh"). */
export function clearLocalState(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}

/**
 * Loads the server-side snapshot. Returns null when the user has never synced,
 * when running as a guest, or when the request fails (caller falls back to the
 * local cache).
 */
export async function fetchServerState(token: string | null): Promise<NorthrSyncedState | null> {
  if (isGuestToken(token)) return null;
  try {
    const res = await fetch("/api/state", { headers: authHeaders(token) });
    if (!res.ok) {
      if (res.status !== 401) console.warn(`GET /api/state failed: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const state = data?.state;
    if (!state || typeof state !== "object") return null;
    return state as NorthrSyncedState;
  } catch (err) {
    console.warn("Could not load your saved profile from the server:", err);
    return null;
  }
}

/** Immediately pushes a snapshot. Resolves to true when the server accepted it. */
export async function pushServerState(
  token: string | null,
  state: NorthrSyncedState,
): Promise<boolean> {
  if (isGuestToken(token)) return false;

  let body: string;
  try {
    body = JSON.stringify({ state });
  } catch (err) {
    console.warn("State snapshot is not serialisable, skipping sync:", err);
    return false;
  }

  if (body.length > MAX_STATE_BYTES) {
    console.warn(
      `State snapshot is ${body.length} bytes (limit ${MAX_STATE_BYTES}); skipping sync.`,
    );
    return false;
  }

  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body,
    });
    if (!res.ok) {
      console.warn(`PUT /api/state failed: HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Could not save your profile to the server:", err);
    return false;
  }
}

// --- Debounced writer -------------------------------------------------------

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSnapshot: { token: string | null; state: NorthrSyncedState } | null = null;

/**
 * Queues a snapshot for a debounced (~2s) PUT /api/state. Repeated calls inside
 * the window collapse into a single request carrying the newest snapshot.
 */
export function scheduleStateSync(token: string | null, state: NorthrSyncedState): void {
  if (isGuestToken(token)) return;
  pendingSnapshot = { token, state };
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    const snapshot = pendingSnapshot;
    pendingSnapshot = null;
    if (snapshot) void pushServerState(snapshot.token, snapshot.state);
  }, SYNC_DEBOUNCE_MS);
}

/** Drops any queued sync without sending it (used on logout). */
export function cancelStateSync(): void {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  pendingSnapshot = null;
}

/** Sends any queued snapshot right away (used on tab close). */
export function flushStateSync(): void {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  const snapshot = pendingSnapshot;
  pendingSnapshot = null;
  if (snapshot) void pushServerState(snapshot.token, snapshot.state);
}
