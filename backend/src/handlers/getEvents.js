import { getEvents, withDerivedEventStatus } from "../services/eventsService.js";
import { ok, serverError } from "../utils/response.js";

export const handler = async () => {
  try {
    const events = await getEvents();

    return ok({
      events: events.map((entry) => withDerivedEventStatus(entry)),
    });
  } catch (error) {
    console.error("getEvents error", error);
    return serverError();
  }
};