import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fantasy-ufc-auth-v2";
const AuthContext = createContext(null);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const getAdminEmail = () => normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || "");

const buildUser = ({ id, name, email }) => {
  const normalizedEmail = normalizeEmail(email);
  const adminEmail = getAdminEmail();

  return {
    id: id || crypto.randomUUID(),
    name: name?.trim() || "Fantasy UFC User",
    email: normalizedEmail,
    isAdmin: Boolean(adminEmail) && normalizedEmail === adminEmail,
  };
};

const loadInitialUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!parsed?.email) {
      return null;
    }

    return buildUser(parsed);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(loadInitialUser);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const signup = ({ name, email }) => {
    const nextUser = buildUser({ name, email });
    setUser(nextUser);
    return nextUser;
  };

  const login = ({ email }) => {
    const nextUser = buildUser({
      name: email?.split("@")[0] || "Fantasy UFC User",
      email,
    });

    setUser(nextUser);
    return nextUser;
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.isAdmin),
      signup,
      login,
      logout,
    }),
    [user]
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