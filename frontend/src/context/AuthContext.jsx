import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setAccessTokenGetter } from "../api/client";
import { ensureMyProfile as ensureMyProfileApi } from "../api/profile";
import { clearClientState } from "../utils/clearClientState";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

const mergeSessionWithProfile = (session, profile) => {
  if (!session || !profile?.displayName) {
    return session;
  }

  return {
    ...session,
    user: {
      ...(session.user || {}),
      name: profile.displayName,
    },
  };
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(authApi.loadSession);
  const [loading, setLoading] = useState(false);

  const syncProfile = useCallback(async (baseSession = null) => {
    try {
      const response = await ensureMyProfileApi();
      const profile = response?.profile || null;

      if (profile) {
        const nextSession = mergeSessionWithProfile(
          baseSession ?? authApi.loadSession(),
          profile
        );

        setSession(nextSession);
        authApi.saveSession(nextSession);
      }

      return profile;
    } catch (error) {
      console.error("AuthContext ensureMyProfile error", error);
      return null;
    }
  }, []);

  useEffect(() => {
    setAccessTokenGetter(authApi.getIdToken ?? authApi.getAccessToken);

    const storedSession = authApi.loadSession();

    if (storedSession?.accessToken) {
      syncProfile(storedSession);
    }
  }, [syncProfile]);

  const signup = async ({ name, email, password }) => {
    setLoading(true);

    try {
      const result = await authApi.signup({ name, email, password });
      setSession(result.session ?? null);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const confirmSignup = async ({ email, code }) => {
    setLoading(true);

    try {
      return await authApi.confirmSignup({ email, code });
    } finally {
      setLoading(false);
    }
  };

  const resendSignupCode = async ({ email }) => {
    setLoading(true);

    try {
      return await authApi.resendSignupCode({ email });
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    setLoading(true);

    try {
      const nextSession = await authApi.login({ email, password });
      setSession(nextSession);

      const profile = await syncProfile(nextSession);
      const finalSession = mergeSessionWithProfile(nextSession, profile);

      setSession(finalSession);
      authApi.saveSession(finalSession);

      return finalSession?.user ?? nextSession.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    try {
      await authApi.logout();
    } finally {
      clearClientState();
      setSession(null);
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