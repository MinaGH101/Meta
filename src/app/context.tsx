import { createContext, useContext, useState, ReactNode } from "react";

interface DarkModeCtx {
  dark: boolean;
  toggleDark: () => void;
}

interface AuthCtx {
  user: { name: string; email: string; phone: string; avatar: string } | null;
  login: (name: string, email: string) => void;
  logout: () => void;
}

export const DarkModeContext = createContext<DarkModeCtx>({ dark: true, toggleDark: () => {} });
export const AuthContext = createContext<AuthCtx>({ user: null, login: () => {}, logout: () => {} });

export function useDark() { return useContext(DarkModeContext); }
export function useAuth() { return useContext(AuthContext); }

export function AppProviders({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true);
  const [user, setUser] = useState<AuthCtx["user"]>({
    name: "علی رضایی",
    email: "ali.rezaei@email.com",
    phone: "۰۹۱۲۳۴۵۶۷۸۹",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=200",
  });

  return (
    <DarkModeContext.Provider value={{ dark, toggleDark: () => setDark(d => !d) }}>
      <AuthContext.Provider value={{
        user,
        login: (name, email) => setUser({ name, email, phone: "۰۹۱۲۳۴۵۶۷۸۹", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=200" }),
        logout: () => setUser(null),
      }}>
        {children}
      </AuthContext.Provider>
    </DarkModeContext.Provider>
  );
}
