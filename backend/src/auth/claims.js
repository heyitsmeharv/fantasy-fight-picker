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