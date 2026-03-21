export const isEventLocked = (event) => {
  const status = (event?.status || "").toLowerCase();
  return status === "locked" || status === "closed";
};

export const getEventStatusLabel = (event) => {
  return isEventLocked(event) ? "Locked" : "Open";
};