import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setAccessTokenGetter } from "../api/client";
import {
  confirmSignup as confirmSignupApi,
  getIdToken,
  loadSession,
  login as loginApi,
  logout as logoutApi,
  resendSignupCode as resendSignupCodeApi,
  signup as signupApi,
} from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(loadSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAccessTokenGetter(getIdToken);
  }, []);

  const signup = async ({ name, email, password }) => {
    setLoading(true);

    try {
      const result = await signupApi({ name, email, password });
      setSession(result.session ?? null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const confirmSignup = async ({ email, code }) => {
    setLoading(true);

    try {
      return await confirmSignupApi({ email, code });
    } finally {
      setLoading(false);
    }
  };

  const resendSignupCode = async ({ email }) => {
    setLoading(true);

    try {
      return await resendSignupCodeApi({ email });
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);

    try {
      const nextSession = await loginApi({ email, password });
      setSession(nextSession);
      return nextSession.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await logoutApi();
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: Boolean(session?.user && session?.accessToken),
      isAdmin: Boolean(session?.user?.isAdmin),
      hasAccessToken: Boolean(session?.accessToken),
      loading,
      signup,
      confirmSignup,
      resendSignupCode,
      login,
      logout,
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};