"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
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

const AUTH_PAGES = ["/login", "/register"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await fetchJson<{
        user: SessionUser | null;
        stale?: boolean;
      }>("/api/auth/session", { timeoutMs: 12_000 });
      setUser(data.user);

      if (data.stale) {
        setUser(null);
        const path =
          typeof window !== "undefined" ? window.location.pathname : pathname;
        if (!AUTH_PAGES.includes(path)) {
          router.replace("/login");
        }
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
    router.replace("/login");
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
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
