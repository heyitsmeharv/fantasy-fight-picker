export const getUserClaimsFromEvent = (event) => {
  return (
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    {}
  );
};

export const getUserIdFromEvent = (event) => {
  return getUserClaimsFromEvent(event).sub || null;
};

export const isAdminRequest = (event) => {
  const claims = getUserClaimsFromEvent(event);
  const rawGroups = claims["cognito:groups"] ?? claims.groups ?? [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  return groups.some((group) => group.toLowerCase().includes("admin"));
};