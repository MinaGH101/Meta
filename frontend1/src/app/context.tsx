import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { ApiUser, apiFetch, clearTokens, getRefreshToken, saveTokens, TokenPair } from "./api";

interface DarkModeCtx { dark: boolean; toggleDark: () => void; }
interface AuthCtx {
  user: ApiUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: Record<string, string>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

export const DarkModeContext = createContext<DarkModeCtx>({ dark: true, toggleDark: () => {} });
export const AuthContext = createContext<AuthCtx>({ user: null, loading: true, login: async () => {}, register: async () => {}, logout: async () => {}, updateProfile: async () => {}, uploadAvatar: async () => {} });
export function useDark() { return useContext(DarkModeContext); }
export function useAuth() { return useContext(AuthContext); }

export function AppProviders({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem("meta_theme") !== "light");
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("meta_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let active = true;
    apiFetch<ApiUser>("/auth/me")
      .then(data => { if (active) setUser(data); })
      .catch(() => { clearTokens(); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const auth = useMemo<AuthCtx>(() => ({
    user,
    loading,
    login: async (phone, password) => {
      const pair = await apiFetch<TokenPair>("/auth/login", { method: "POST", body: JSON.stringify({ phone: phone.trim(), password }) });
      saveTokens(pair); setUser(pair.user);
    },
    register: async (fullName, email, phone, password) => {
      const pair = await apiFetch<TokenPair>("/auth/register", { method: "POST", body: JSON.stringify({ full_name: fullName, email: email.trim() || null, phone: phone.trim(), password }) });
      saveTokens(pair); setUser(pair.user);
    },
    logout: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) await apiFetch<void>("/auth/logout", { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) }).catch(() => undefined);
      clearTokens(); setUser(null);
    },
    updateProfile: async payload => {
      const updated = await apiFetch<ApiUser>("/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
      setUser(updated);
    },
    uploadAvatar: async file => {
      const body = new FormData();
      body.append("file", file);
      const updated = await apiFetch<ApiUser>("/auth/me/avatar", { method: "POST", body });
      setUser(updated);
    },
  }), [loading, user]);

  return (
    <DarkModeContext.Provider value={{ dark, toggleDark: () => setDark(value => !value) }}>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </DarkModeContext.Provider>
  );
}
