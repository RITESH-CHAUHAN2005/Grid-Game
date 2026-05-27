import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, type ApiUser } from "./api";

type AuthCtx = {
  user: ApiUser | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  guestLogin: (name: string, color?: string) => Promise<void>;
  updateColor: (color: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = getToken();
      if (!t) {
        if (alive) setLoading(false);
        return;
      }
      try {
        const r = await api.me();
        if (alive) setUser(r.user);
      } catch {
        setToken(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const r = await api.signup({ name, email, password });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.login({ email, password });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const guestLogin = useCallback(async (name: string, color?: string) => {
    const r = await api.guest({ name, color });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const updateColor = useCallback(async (color: string) => {
    const r = await api.updateColor(color);
    setUser(r.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, signup, login, guestLogin, updateColor, logout }),
    [user, loading, signup, login, guestLogin, updateColor, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
