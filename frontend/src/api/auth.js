const STORAGE_KEY = "fantasy-ufc-auth-v5";

const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION;
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const COGNITO_ENDPOINT = COGNITO_REGION
  ? `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`
  : "";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const getBaseNameFromEmail = (email = "") => {
  const localPart = normalizeEmail(email).split("@")[0] || "Fantasy UFC User";
  return localPart
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const parseJwt = (token) => {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split(".");
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const extractGroups = (...claimsList) => {
  for (const claims of claimsList) {
    if (!claims) {
      continue;
    }

    const rawGroups = claims["cognito:groups"] ?? claims.groups;

    if (Array.isArray(rawGroups)) {
      return rawGroups;
    }

    if (typeof rawGroups === "string" && rawGroups.trim()) {
      return rawGroups
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const buildSessionFromAuthResult = (authResult, fallback = {}) => {
  const accessToken = authResult?.AccessToken ?? fallback.accessToken ?? null;
  const idToken = authResult?.IdToken ?? fallback.idToken ?? null;
  const refreshToken = authResult?.RefreshToken ?? fallback.refreshToken ?? null;

  const accessClaims = parseJwt(accessToken);
  const idClaims = parseJwt(idToken);

  const email =
    normalizeEmail(
      idClaims?.email ||
      accessClaims?.email ||
      accessClaims?.username ||
      fallback.email ||
      ""
    ) || null;

  const groups = extractGroups(idClaims, accessClaims);
  const name =
    idClaims?.name ||
    fallback.name ||
    getBaseNameFromEmail(email || "");

  const userId =
    idClaims?.sub ||
    accessClaims?.sub ||
    email ||
    crypto.randomUUID();

  const expiresAt = accessClaims?.exp ? accessClaims.exp * 1000 : null;

  return {
    user: {
      id: userId,
      name,
      email,
      groups,
      isAdmin: groups.some(
        (group) => group.toLowerCase() === "fantasy-ufc-admins"
      ),
    },
    accessToken,
    idToken,
    refreshToken,
    expiresAt,
  };
};

const mapCognitoError = (payload = {}) => {
  const rawType = String(payload.__type || payload.code || "");
  const type = rawType.split("#").pop() || rawType;
  const message = payload.message || payload.error_description || "Authentication failed";

  switch (type) {
    case "UserNotConfirmedException":
      return {
        code: type,
        message: "Your account is not confirmed yet. Enter the email code to finish sign-up.",
      };
    case "UsernameExistsException":
      return {
        code: type,
        message: "An account with that email already exists.",
      };
    case "NotAuthorizedException":
      return {
        code: type,
        message: message || "Incorrect email or password.",
      };
    case "InvalidPasswordException":
      return {
        code: type,
        message:
          "Password must meet the password policy.",
      };
    case "UserNotFoundException":
      return {
        code: type,
        message: "No account was found for that email address.",
      };
    case "CodeMismatchException":
      return {
        code: type,
        message: "That confirmation code is incorrect.",
      };
    case "ExpiredCodeException":
      return {
        code: type,
        message: "That confirmation code has expired. Request a new one.",
      };
    case "LimitExceededException":
      return {
        code: type,
        message: "Too many attempts. Please wait a moment and try again.",
      };
    default:
      return {
        code: type || "AuthError",
        message,
      };
  }
};

const ensureConfig = () => {
  if (!COGNITO_REGION || !COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    throw new Error(
      "Missing Cognito configuration. Check VITE_COGNITO_REGION, VITE_COGNITO_USER_POOL_ID, and VITE_COGNITO_CLIENT_ID."
    );
  }
};

const cognitoRequest = async (target, body) => {
  ensureConfig();

  const response = await fetch(COGNITO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const mapped = mapCognitoError(payload);
    const error = new Error(mapped.message);
    error.code = mapped.code;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const loadSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored);

    if (!parsed?.refreshToken && !parsed?.accessToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveSession = (session) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};

const isTokenStillUsable = (session) => {
  if (!session?.accessToken || !session?.expiresAt) {
    return false;
  }

  const skewMs = 60 * 1000;
  return session.expiresAt - skewMs > Date.now();
};

const refreshSession = async (session) => {
  if (!session?.refreshToken) {
    return null;
  }

  const response = await cognitoRequest("InitiateAuth", {
    ClientId: COGNITO_CLIENT_ID,
    AuthFlow: "REFRESH_TOKEN_AUTH",
    AuthParameters: {
      REFRESH_TOKEN: session.refreshToken,
    },
  });

  const nextSession = buildSessionFromAuthResult(response.AuthenticationResult, {
    email: session.user?.email,
    name: session.user?.name,
    refreshToken: session.refreshToken,
  });

  saveSession(nextSession);
  return nextSession;
};

const getUsableSession = async () => {
  const session = loadSession();

  if (!session) {
    return null;
  }

  if (isTokenStillUsable(session) && session.idToken) {
    return session;
  }

  if (!session.refreshToken) {
    clearSession();
    return null;
  }

  try {
    const refreshed = await refreshSession(session);
    return refreshed ?? null;
  } catch (error) {
    console.error("auth refresh failed", error);
    clearSession();
    return null;
  }
};

export const getAccessToken = async () => {
  const session = await getUsableSession();
  return session?.accessToken ?? null;
};

export const getIdToken = async () => {
  const session = await getUsableSession();
  return session?.idToken ?? null;
};

export const login = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const response = await cognitoRequest("InitiateAuth", {
    ClientId: COGNITO_CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: normalizedEmail,
      PASSWORD: password,
    },
  });

  if (response.ChallengeName) {
    const error = new Error(
      `Unsupported Cognito challenge: ${response.ChallengeName}`
    );
    error.code = response.ChallengeName;
    throw error;
  }

  const session = buildSessionFromAuthResult(response.AuthenticationResult, {
    email: normalizedEmail,
  });

  saveSession(session);
  return session;
};

export const signup = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  const response = await cognitoRequest("SignUp", {
    ClientId: COGNITO_CLIENT_ID,
    Username: normalizedEmail,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: normalizedEmail,
      },
      {
        Name: "name",
        Value: name.trim(),
      },
    ],
  });

  const user = {
    id: response.UserSub,
    name: name.trim(),
    email: normalizedEmail,
    groups: [],
    isAdmin: false,
  };

  if (response.UserConfirmed) {
    const session = await login({
      email: normalizedEmail,
      password,
    });

    return {
      user: session.user,
      session,
      pendingConfirmation: false,
    };
  }

  clearSession();

  return {
    user,
    session: null,
    pendingConfirmation: true,
  };
};

export const confirmSignup = async ({ email, code }) => {
  const normalizedEmail = normalizeEmail(email);

  await cognitoRequest("ConfirmSignUp", {
    ClientId: COGNITO_CLIENT_ID,
    Username: normalizedEmail,
    ConfirmationCode: String(code).trim(),
  });

  return {
    confirmed: true,
    email: normalizedEmail,
  };
};

export const resendSignupCode = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  await cognitoRequest("ResendConfirmationCode", {
    ClientId: COGNITO_CLIENT_ID,
    Username: normalizedEmail,
  });

  return {
    email: normalizedEmail,
    resent: true,
  };
};

export const logout = async () => {
  clearSession();
};