const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4,5}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cleanString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const toTitleCase = (value) => {
  return value
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const looksLikeOpaqueUserId = (value) => {
  const normalized = cleanString(value);

  if (!normalized) {
    return false;
  }

  return UUID_LIKE_PATTERN.test(normalized);
};

export const getSafeDisplayName = (value, fallback = "Unknown player") => {
  const normalized = cleanString(value);

  if (!normalized) {
    return fallback;
  }

  if (normalized.includes("@")) {
    const derivedFromEmail = toTitleCase(normalized.split("@")[0]);
    return derivedFromEmail || fallback;
  }

  if (looksLikeOpaqueUserId(normalized)) {
    return fallback;
  }

  return normalized;
};

export const getLeaderboardEntryName = (entry) => {
  return getSafeDisplayName(
    entry?.displayName || entry?.name || entry?.username || entry?.userId
  );
};