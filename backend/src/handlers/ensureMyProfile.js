import { upsertProfileFromClaims } from "../services/profileService.js";
import { getUserClaimsFromEvent, getUserIdFromEvent } from "../utils/auth.js";
import { forbidden, ok, serverError } from "../utils/response.js";

export const handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);

    if (!userId) {
      return forbidden("Unauthorized");
    }

    const profile = await upsertProfileFromClaims(getUserClaimsFromEvent(event));

    return ok({ profile });
  } catch (error) {
    console.error("ensureMyProfile error", error);
    return serverError();
  }
};