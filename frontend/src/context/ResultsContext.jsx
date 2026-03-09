import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { upcomingEvents } from "../data/mockData";

const STORAGE_KEY = "fantasy-ufc-results-v2";
const ResultsContext = createContext(null);

const loadInitialOverrides = () => {
  if (typeof window === "undefined") {
    return {
      results: {},
      statuses: {},
    };
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return {
        results: {},
        statuses: {},
      };
    }

    const parsed = JSON.parse(stored);

    return {
      results: parsed?.results && typeof parsed.results === "object" ? parsed.results : {},
      statuses: parsed?.statuses && typeof parsed.statuses === "object" ? parsed.statuses : {},
    };
  } catch {
    return {
      results: {},
      statuses: {},
    };
  }
};

const mergeEventsWithOverrides = (events, overrides) => {
  return events.map((event) => {
    const statusOverride = overrides.statuses?.[event.id];
    const mergedStatus = statusOverride ?? event.status;

    if (!Array.isArray(event.fights)) {
      return {
        ...event,
        status: mergedStatus,
      };
    }

    return {
      ...event,
      status: mergedStatus,
      fights: event.fights.map((fight) => ({
        ...fight,
        result: overrides.results?.[event.id]?.[fight.id] ?? fight.result ?? null,
      })),
    };
  });
};

export const ResultsProvider = ({ children }) => {
  const [overrides, setOverrides] = useState(loadInitialOverrides);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }
  }, [overrides]);

  const events = useMemo(() => {
    return mergeEventsWithOverrides(upcomingEvents, overrides);
  }, [overrides]);

  const updateFightResult = (eventId, fightId, result) => {
    setOverrides((current) => ({
      ...current,
      results: {
        ...current.results,
        [eventId]: {
          ...(current.results?.[eventId] || {}),
          [fightId]: result,
        },
      },
    }));
  };

  const clearFightResult = (eventId, fightId) => {
    setOverrides((current) => {
      if (!current.results?.[eventId]?.[fightId]) {
        return current;
      }

      const nextEventResults = { ...(current.results?.[eventId] || {}) };
      delete nextEventResults[fightId];

      return {
        ...current,
        results: {
          ...current.results,
          ...(Object.keys(nextEventResults).length > 0
            ? { [eventId]: nextEventResults }
            : {}),
        },
      };
    });
  };

  const updateEventStatus = (eventId, status) => {
    setOverrides((current) => ({
      ...current,
      statuses: {
        ...current.statuses,
        [eventId]: String(status).toLowerCase(),
      },
    }));
  };

  return (
    <ResultsContext.Provider
      value={{
        events,
        updateFightResult,
        clearFightResult,
        updateEventStatus,
      }}
    >
      {children}
    </ResultsContext.Provider>
  );
};

export const useResults = () => {
  const context = useContext(ResultsContext);

  if (!context) {
    throw new Error("useResults must be used within a ResultsProvider");
  }

  return context;
};