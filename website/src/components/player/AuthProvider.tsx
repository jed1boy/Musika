"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAuthStatus, signOut, signInUrl } from "@/lib/player/api";
import type { AuthStatus } from "@/lib/player/types";

interface AuthContextValue {
  status: AuthStatus;
  loading: boolean;
  signIn: () => void;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth requires AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>({ connected: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const s = await getAuthStatus();
      setStatus(s);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(() => {
    window.location.href = signInUrl();
  }, []);

  const disconnect = useCallback(async () => {
    await signOut();
    setStatus({ connected: false });
  }, []);

  return (
    <AuthCtx.Provider value={{ status, loading, signIn, disconnect, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
