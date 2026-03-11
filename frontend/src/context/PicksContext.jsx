import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useResults } from "./ResultsContext";
import * as picksApi from "../api/picks";

const STORAGE_PREFIX = "fantasy-ufc-picks-v5";
const PicksContext = createContext(null);

const getStorageKey = (userId) => {
  return userId ? `${STORAGE_PREFIX}:${userId}` : null;
};

const loadStoredPickCards = (storageKey) => {
  if (typeof window === "undefined" || !storageKey) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const removeStoredPickCards = (storageKey) => {
  if (typeof window === "undefined" || !storageKey) {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // ignore storage cleanup failures
  }
};

const sortPicksForEvent = (event, picks) => {
  if (!Array.isArray(event?.fights)) {
    return picks;
  }

  return [...picks].sort((a, b) => {
    const aIndex = event.fights.findIndex((fight) => fight.id === a.fightId);
    const bIndex = event.fights.findIndex((fight) => fight.id === b.fightId);

    return aIndex - bIndex;
  });
};

const buildBaseCard = (event) => ({
  eventId: event.id,
  selectedCount: 0,
  picks: [],
});

const replaceCard = (cards, nextCard) => {
  const index = cards.findIndex((card) => card.eventId === nextCard.eventId);

  if (nextCard.picks.length === 0) {
    if (index === -1) {
      return cards;
    }

    const next = [...cards];
    next.splice(index, 1);
    return next;
  }

  if (index === -1) {
    return [nextCard, ...cards];
  }

  const next = [...cards];
  next[index] = nextCard;
  return next;
};

export const PicksProvider = ({ children }) => {
  const { isAuthenticated, hasAccessToken, user } = useAuth();
  const { events } = useResults();
  const userId = user?.id || user?.userId || user?.sub || null;
  const storageKey = getStorageKey(userId);
  const [pickCards, setPickCards] = useState([]);

  useEffect(() => {
    if (!isAuthenticated || !hasAccessToken || !storageKey) {
      setPickCards([]);
      return;
    }

    setPickCards(loadStoredPickCards(storageKey));
  }, [isAuthenticated, hasAccessToken, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isAuthenticated || !hasAccessToken || !storageKey) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(pickCards));
  }, [pickCards, isAuthenticated, hasAccessToken, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!isAuthenticated || !hasAccessToken) {
      removeStoredPickCards(STORAGE_PREFIX);
    }
  }, [isAuthenticated, hasAccessToken]);

  useEffect(() => {
    let cancelled = false;

    const loadRemotePicks = async () => {
      if (!isAuthenticated || !hasAccessToken || events.length === 0) {
        return;
      }

      try {
        const cards = await Promise.all(
          events.map((event) => picksApi.fetchMyEventPicks(event.id, event))
        );

        if (!cancelled) {
          setPickCards(cards.filter(Boolean).filter((card) => card.picks.length > 0));
        }
      } catch (error) {
        console.error("PicksContext loadRemotePicks error", error);
      }
    };

    loadRemotePicks();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasAccessToken, events]);

  const persistCard = useCallback(
    async (event, nextCard) => {
      if (!hasAccessToken) {
        return nextCard;
      }

      const saved = await picksApi.saveMyEventPicks(event.id, nextCard, event);
      return saved;
    },
    [hasAccessToken]
  );

  const savePick = useCallback(
    async (event, fight, fighter) => {
      if (!event || !fight || !fighter) {
        return;
      }

      const previousCard =
        pickCards.find((card) => card.eventId === event.id) || buildBaseCard(event);

      const nextCard = {
        ...previousCard,
        picks: [...previousCard.picks],
      };

      const pickIndex = nextCard.picks.findIndex((pick) => pick.fightId === fight.id);
      const existingPick = pickIndex === -1 ? null : nextCard.picks[pickIndex];
      const isSameFighter = existingPick?.selectionId === fighter.id;

      const updatedPick = {
        fightId: fight.id,
        selectionId: fighter.id,
        selection: fighter.name,
        predictedMethod: isSameFighter ? existingPick?.predictedMethod ?? null : null,
        predictedRound: isSameFighter ? existingPick?.predictedRound ?? null : null,
      };

      if (pickIndex === -1) {
        nextCard.picks.push(updatedPick);
      } else {
        nextCard.picks[pickIndex] = updatedPick;
      }

      nextCard.picks = sortPicksForEvent(event, nextCard.picks);
      nextCard.selectedCount = nextCard.picks.length;

      setPickCards((current) => replaceCard(current, nextCard));

      try {
        if (hasAccessToken) {
          const saved = await persistCard(event, nextCard);
          setPickCards((current) => replaceCard(current, saved));
        }
      } catch (error) {
        setPickCards((current) => replaceCard(current, previousCard));
        console.error("PicksContext savePick error", error);
      }
    },
    [pickCards, hasAccessToken, persistCard]
  );

  const removePick = useCallback(
    async (eventId, fightId) => {
      const event = events.find((entry) => entry.id === eventId);

      if (!event) {
        return;
      }

      const previousCard =
        pickCards.find((card) => card.eventId === eventId) || buildBaseCard(event);

      const nextCard = {
        ...previousCard,
        picks: previousCard.picks.filter((pick) => pick.fightId !== fightId),
      };

      nextCard.selectedCount = nextCard.picks.length;

      setPickCards((current) => replaceCard(current, nextCard));

      try {
        if (hasAccessToken) {
          const saved = await persistCard(event, nextCard);
          setPickCards((current) => replaceCard(current, saved));
        }
      } catch (error) {
        setPickCards((current) => replaceCard(current, previousCard));
        console.error("PicksContext removePick error", error);
      }
    },
    [events, pickCards, hasAccessToken, persistCard]
  );

  const updatePickDetails = useCallback(
    async (eventId, fightId, details = {}) => {
      const event = events.find((entry) => entry.id === eventId);

      if (!event) {
        return;
      }

      const previousCard =
        pickCards.find((card) => card.eventId === eventId) || buildBaseCard(event);

      const nextCard = {
        ...previousCard,
        picks: previousCard.picks.map((pick) => {
          if (pick.fightId !== fightId) {
            return pick;
          }

          return {
            ...pick,
            predictedMethod:
              details.predictedMethod !== undefined
                ? details.predictedMethod
                : pick.predictedMethod ?? null,
            predictedRound:
              details.predictedRound !== undefined
                ? details.predictedRound
                : pick.predictedRound ?? null,
          };
        }),
      };

      nextCard.selectedCount = nextCard.picks.length;

      setPickCards((current) => replaceCard(current, nextCard));

      try {
        if (hasAccessToken) {
          const saved = await persistCard(event, nextCard);
          setPickCards((current) => replaceCard(current, saved));
        }
      } catch (error) {
        setPickCards((current) => replaceCard(current, previousCard));
        console.error("PicksContext updatePickDetails error", error);
      }
    },
    [events, pickCards, hasAccessToken, persistCard]
  );

  const getEventCard = useCallback(
    (eventId) => {
      return pickCards.find((card) => card.eventId === eventId) || null;
    },
    [pickCards]
  );

  const getEventPickMap = useCallback(
    (eventId) => {
      const card = getEventCard(eventId);

      if (!card) {
        return {};
      }

      return card.picks.reduce((acc, pick) => {
        acc[pick.fightId] = pick.selectionId;
        return acc;
      }, {});
    },
    [getEventCard]
  );

  const value = useMemo(
    () => ({
      pickCards,
      savePick,
      removePick,
      updatePickDetails,
      getEventCard,
      getEventPickMap,
    }),
    [pickCards, savePick, removePick, updatePickDetails, getEventCard, getEventPickMap]
  );

  return <PicksContext.Provider value={value}>{children}</PicksContext.Provider>;
};

export const usePicks = () => {
  const context = useContext(PicksContext);

  if (!context) {
    throw new Error("usePicks must be used within a PicksProvider");
  }

  return context;
};