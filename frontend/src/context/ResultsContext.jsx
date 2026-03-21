import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as resultsApi from "../api/results";

const ResultsContext = createContext(null);

const replaceEventInList = (events, nextEvent) => {
  const index = events.findIndex((event) => event.id === nextEvent.id);

  if (index === -1) {
    return [...events, nextEvent];
  }

  const next = [...events];
  next[index] = nextEvent;
  return next;
};

export const ResultsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshEvents = useCallback(async () => {
    setLoading(true);

    try {
      const nextEvents = await resultsApi.fetchAllEventsWithDetails();
      setEvents(nextEvents);
      setError(null);
    } catch (nextError) {
      console.error("ResultsContext refreshEvents error", nextError);
      setEvents([]);
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const refreshEvent = useCallback(async (eventId) => {
    const nextEvent = await resultsApi.fetchEventById(eventId);

    if (!nextEvent) {
      return null;
    }

    setEvents((current) => replaceEventInList(current, nextEvent));
    return nextEvent;
  }, []);

  const updateFightResult = useCallback(async (eventId, fightId, result) => {
    const response = await resultsApi.updateFightResult(eventId, fightId, result);

    setEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) {
          return event;
        }

        return {
          ...event,
          fights: (event.fights || []).map((fight) =>
            fight.id === fightId
              ? {
                  ...fight,
                  result: response?.fight?.result ?? result,
                }
              : fight
          ),
        };
      })
    );

    return response?.fight ?? null;
  }, []);

  const clearFightResult = useCallback(async (eventId, fightId) => {
    await resultsApi.clearFightResult(eventId, fightId);

    setEvents((current) =>
      current.map((event) => {
        if (event.id !== eventId) {
          return event;
        }

        return {
          ...event,
          fights: (event.fights || []).map((fight) =>
            fight.id === fightId
              ? {
                  ...fight,
                  result: null,
                }
              : fight
          ),
        };
      })
    );
  }, []);

  const updateEventStatus = useCallback(async (eventId, status) => {
    const nextEvent = await resultsApi.updateEventStatus(eventId, status);

    if (!nextEvent) {
      return null;
    }

    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              status: nextEvent.status,
            }
          : event
      )
    );

    return nextEvent;
  }, []);

  const value = useMemo(
    () => ({
      events,
      loading,
      error,
      refreshEvents,
      refreshEvent,
      updateFightResult,
      clearFightResult,
      updateEventStatus,
    }),
    [
      events,
      loading,
      error,
      refreshEvents,
      refreshEvent,
      updateFightResult,
      clearFightResult,
      updateEventStatus,
    ]
  );

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>;
};

export const useResults = () => {
  const context = useContext(ResultsContext);

  if (!context) {
    throw new Error("useResults must be used within a ResultsProvider");
  }

  return context;
};