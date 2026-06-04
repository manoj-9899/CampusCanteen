"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { SessionUser } from "@/types";
import { fetchJson } from "@/lib/fetch-client";

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await fetchJson<{
        user: SessionUser | null;
        stale?: boolean;
      }>("/api/auth/session", { timeoutMs: 12_000 });
      setUser(data.user);
      if (data.stale && typeof window !== "undefined") {
        window.location.href = "/login";
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
