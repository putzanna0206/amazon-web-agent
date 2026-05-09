"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, getAgents } from "./api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface Agent {
  id: string;
  name: string;
  config: { description?: string };
}

interface AuthContextType {
  user: User | null;
  agent: Agent | null;
  loading: boolean;
  authError: "unauthorized" | "server_error" | "no_agent" | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<"unauthorized" | "server_error" | "no_agent" | null>(null);

  useEffect(() => {
    getAgents()
      .then(async (res) => {
        const agents = res.agents || [];
        const stored = localStorage.getItem("fc_user");
        if (stored) {
          try {
            const { user: u, agent: a } = JSON.parse(stored);
            setUser(u);
            const resolved = agents[0] || a;
            setAgent(resolved);
            if (!resolved) setAuthError("no_agent");
          } catch (e) {
            console.error("Failed to parse stored user data:", e);
            localStorage.removeItem("fc_user");
          }
        }
      })
      .catch((error: Error & { status?: number }) => {
        console.log("Auth check failed:", error.message);
        localStorage.removeItem("fc_user");
        if (error.status === 401) {
          setAuthError("unauthorized");
        } else {
          setAuthError("server_error");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const { user: u } = await apiLogin(username, password);
    const { agents } = await getAgents();
    const a = agents[0]; // Take the first (only) agent
    setUser(u);
    setAgent(a);
    localStorage.setItem("fc_user", JSON.stringify({ user: u, agent: a }));
  };

  const logout = () => {
    setUser(null);
    setAgent(null);
    localStorage.removeItem("fc_user");
  };

  return (
    <AuthContext.Provider value={{ user, agent, loading, authError, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
