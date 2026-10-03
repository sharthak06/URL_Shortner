import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import type { LoginPayload, RegisterPayload, User } from "../types/auth.types";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  // Never authenticates: the account isn't usable until the magic link is clicked
  // (verifyEmail), so this only creates the account and resolves with it.
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const userRef = useRef<User | null>(null);
  // Query keys ("user-urls", "url-analytics", ...) aren't scoped by userId, so the cache
  // is wiped on every session change to keep one account's data from showing in another's.
  const queryClient = useQueryClient();

  // Synchronize ref with user state so event listeners always access active session status
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchSession = async () => {
    try {
      const currentUser = await authApi.getMe();
      setUser(currentUser);
    } catch {
      // 401 on initial load simply means the visitor has no active session; fail silently
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    const handleSessionExpired = () => {
      // Only display the error toast if the user was actively authenticated previously
      // and their session was terminated mid-use. Cold-start visitors should never see an error.
      if (userRef.current) {
        toast.error("Session expired. Please log in again.");
      }
      queryClient.clear();
      setUser(null);
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleSessionExpired);
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const loggedInUser = await authApi.login(payload);
      queryClient.clear();
      setUser(loggedInUser);
      toast.success("Welcome back!");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to log in";
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      // No setUser/isAuthenticated here - the account has no session until the
      // magic link (verifyEmail) is clicked. The caller shows a "check your email"
      // state rather than treating this as a sign-in.
      return await authApi.register(payload);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Failed to create account";
      toast.error(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      queryClient.clear();
      setUser(null);
      toast.info("Logged out successfully");
    }
  };

  const refreshUser = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
