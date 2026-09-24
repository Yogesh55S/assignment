"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCurrentUser, apiRequest, type UserSession } from "../lib/api";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: UserSession | null;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<UserSession | null>(null);

  const refreshAuth = useCallback(async () => {
    try {
      const data = await getCurrentUser();
      if (data && data.user) {
        setUser(data.user);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("unauthenticated");
      }
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, refreshAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
