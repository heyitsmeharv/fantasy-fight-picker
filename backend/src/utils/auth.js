export const getUserIdFromEvent = (event) => {
  return (
    event?.requestContext?.authorizer?.claims?.sub ||
    event?.requestContext?.authorizer?.jwt?.claims?.sub ||
    null
  );
};