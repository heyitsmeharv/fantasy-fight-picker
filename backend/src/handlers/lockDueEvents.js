import {
  listEventsDueForLock,
  updateEventStatus,
} from "../services/eventsService.js";

export const handler = async () => {
  const processedAt = new Date().toISOString();
  const dueEvents = await listEventsDueForLock(processedAt);

  if (!dueEvents.length) {
    console.log("lockDueEvents: no events due for locking", { processedAt });

    return {
      processedAt,
      lockedCount: 0,
      lockedEventIds: [],
    };
  }

  const results = await Promise.allSettled(
    dueEvents.map((event) => updateEventStatus(event.eventId, "locked"))
  );

  const lockedEventIds = [];
  const failed = [];

  results.forEach((result, index) => {
    const eventId = dueEvents[index]?.eventId || `unknown-${index}`;

    if (result.status === "fulfilled") {
      lockedEventIds.push(eventId);
      return;
    }

    failed.push({
      eventId,
      message: result.reason?.message || "Unknown error",
    });
  });

  if (failed.length > 0) {
    console.error("lockDueEvents: failed to lock one or more events", {
      processedAt,
      lockedEventIds,
      failed,
    });

    throw new Error(`Failed to lock ${failed.length} event(s)`);
  }

  console.log("lockDueEvents: locked overdue events", {
    processedAt,
    lockedEventIds,
  });

  return {
    processedAt,
    lockedCount: lockedEventIds.length,
    lockedEventIds,
  };
};