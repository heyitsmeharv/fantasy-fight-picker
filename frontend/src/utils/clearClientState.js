const AUTH_STORAGE_KEY = "fantasy-ufc-auth-v5";
const PICKS_STORAGE_PREFIX = "fantasy-ufc-picks-v5";

export const clearClientState = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);

    const keysToRemove = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (!key) {
        continue;
      }

      if (key === PICKS_STORAGE_PREFIX || key.startsWith(`${PICKS_STORAGE_PREFIX}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      window.localStorage.removeItem(key);
    });

    window.sessionStorage.clear();
  } catch (error) {
    console.error("clearClientState error", error);
  }
};