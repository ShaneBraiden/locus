import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Northr auth — MongoDB-backed API (replaces the old Firebase integration).
//
//   POST /api/auth/register  {name,email,password} -> 201 {token, user}
//   POST /api/auth/login     {email,password}      -> 200 {token, user}
//   GET  /api/auth/me        Bearer <token>        -> 200 {user}
//
// The token lives in localStorage under "northr_token" and is sent as
// `Authorization: Bearer <token>` on every API call in the app.
// ---------------------------------------------------------------------------

export const TOKEN_STORAGE_KEY = "northr_token";
export const GUEST_MODE_STORAGE_KEY = "northr_guest_mode";
export const GUEST_TOKEN = "local_guest_token";

export interface AuthUser {
  id: string;
  name: string;
  email: string | null;
}

export const GUEST_USER: AuthUser = {
  id: "guest",
  name: "Guest Student",
  email: null,
};

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  /** True while the boot-time token validation is still in flight. */
  loading: boolean;
  /** True when the session is the local, server-less guest session. */
  isGuest: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Reads a server error payload ({error} | {message}) without throwing. */
async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") return data.error;
    if (data && typeof data.message === "string") return data.message;
  } catch {
    /* body was empty or not JSON */
  }
  return fallback;
}

function isAuthUser(value: any): value is AuthUser {
  return !!value && typeof value.id === "string" && typeof value.name === "string";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Boot: restore the persisted session.
  useEffect(() => {
    let cancelled = false;

    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    const guestMode =
      typeof window !== "undefined" &&
      localStorage.getItem(GUEST_MODE_STORAGE_KEY) === "true";

    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Guest sessions are purely local — never hit the network.
    if (storedToken === GUEST_TOKEN || guestMode) {
      localStorage.setItem(TOKEN_STORAGE_KEY, GUEST_TOKEN);
      localStorage.setItem(GUEST_MODE_STORAGE_KEY, "true");
      setToken(GUEST_TOKEN);
      setUser(GUEST_USER);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (cancelled) return;

        if (res.status === 401) {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        if (isAuthUser(data?.user)) {
          setToken(storedToken);
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email ?? null,
          });
        } else {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        // Network hiccup: keep the token so a refresh can retry, but stay
        // signed out for this session rather than faking an authenticated UI.
        if (!cancelled) {
          console.warn("Session validation failed:", err);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        throw new Error(
          await readError(
            res,
            res.status === 401
              ? "Incorrect email or password."
              : "We couldn't sign you in. Please try again.",
          ),
        );
      }

      const data = await res.json();
      if (!data?.token || !isAuthUser(data?.user)) {
        throw new Error("The server returned an unexpected response.");
      }
      const nextUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email ?? null,
      };
      applySession(data.token, nextUser);
      return nextUser;
    },
    [applySession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthUser> => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (!res.ok) {
        throw new Error(
          await readError(
            res,
            res.status === 409
              ? "An account with that email already exists."
              : "We couldn't create your account. Please try again.",
          ),
        );
      }

      const data = await res.json();
      if (!data?.token || !isAuthUser(data?.user)) {
        throw new Error("The server returned an unexpected response.");
      }
      const nextUser: AuthUser = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email ?? null,
      };
      applySession(data.token, nextUser);
      return nextUser;
    },
    [applySession],
  );

  const loginAsGuest = useCallback(() => {
    localStorage.setItem(TOKEN_STORAGE_KEY, GUEST_TOKEN);
    localStorage.setItem(GUEST_MODE_STORAGE_KEY, "true");
    setToken(GUEST_TOKEN);
    setUser(GUEST_USER);
  }, []);

  const logout = useCallback(() => {
    // Clear the session *and* every cached app key, so the next person to sign
    // in on this device never sees the previous account's data.
    // (Done by prefix rather than importing the key list from lib/stateSync,
    // which would create an import cycle back into this module.)
    try {
      const staleKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("northr_")) staleKeys.push(key);
      }
      staleKeys.forEach((key) => localStorage.removeItem(key));
    } catch (err) {
      console.warn("Could not fully clear local Northr data:", err);
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isGuest: token === GUEST_TOKEN,
      login,
      register,
      loginAsGuest,
      logout,
    }),
    [user, token, loading, login, register, loginAsGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an <AuthProvider>");
  return ctx;
}
