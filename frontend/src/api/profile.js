import client from "./client";

export const ensureMyProfile = async () => {
  return client.put("/profiles/me", {});
};