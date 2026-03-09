import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "fantasy-ufc-picks-v4";
const PicksContext = createContext(null);

const loadInitialPickCards = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

export const PicksProvider = ({ children }) => {
  const [pickCards, setPickCards] = useState(loadInitialPickCards);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pickCards));
    }
  }, [pickCards]);

  const savePick = (event, fight, fighter) => {
    if (!event || !fight || !fighter) {
      return;
    }

    setPickCards((current) => {
      const next = [...current];
      const eventIndex = next.findIndex((card) => card.eventId === event.id);

      const existingCard =
        eventIndex === -1
          ? buildBaseCard(event)
          : {
              ...next[eventIndex],
              picks: [...next[eventIndex].picks],
            };

      const pickIndex = existingCard.picks.findIndex(
        (pick) => pick.fightId === fight.id
      );

      const existingPick = pickIndex === -1 ? null : existingCard.picks[pickIndex];
      const isSameFighter = existingPick?.selectionId === fighter.id;

      const updatedPick = {
        fightId: fight.id,
        selectionId: fighter.id,
        selection: fighter.name,
        predictedMethod: isSameFighter ? existingPick?.predictedMethod ?? null : null,
        predictedRound: isSameFighter ? existingPick?.predictedRound ?? null : null,
      };

      if (pickIndex === -1) {
        existingCard.picks.push(updatedPick);
      } else {
        existingCard.picks[pickIndex] = updatedPick;
      }

      existingCard.picks = sortPicksForEvent(event, existingCard.picks);
      existingCard.selectedCount = existingCard.picks.length;

      if (eventIndex === -1) {
        next.unshift(existingCard);
      } else {
        next[eventIndex] = existingCard;
      }

      return next;
    });
  };

  const removePick = (eventId, fightId) => {
    setPickCards((current) => {
      const next = [...current];
      const eventIndex = next.findIndex((card) => card.eventId === eventId);

      if (eventIndex === -1) {
        return next;
      }

      const updatedCard = {
        ...next[eventIndex],
        picks: next[eventIndex].picks.filter((pick) => pick.fightId !== fightId),
      };

      updatedCard.selectedCount = updatedCard.picks.length;

      if (updatedCard.picks.length === 0) {
        next.splice(eventIndex, 1);
        return next;
      }

      next[eventIndex] = updatedCard;
      return next;
    });
  };

  const updatePickDetails = (eventId, fightId, details = {}) => {
    setPickCards((current) =>
      current.map((card) => {
        if (card.eventId !== eventId) {
          return card;
        }

        return {
          ...card,
          picks: card.picks.map((pick) => {
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
      })
    );
  };

  const getEventCard = (eventId) => {
    return pickCards.find((card) => card.eventId === eventId) || null;
  };

  const getEventPickMap = (eventId) => {
    const card = getEventCard(eventId);

    if (!card) {
      return {};
    }

    return card.picks.reduce((acc, pick) => {
      acc[pick.fightId] = pick.selectionId;
      return acc;
    }, {});
  };

  return (
    <PicksContext.Provider
      value={{
        pickCards,
        savePick,
        removePick,
        updatePickDetails,
        getEventCard,
        getEventPickMap,
      }}
    >
      {children}
    </PicksContext.Provider>
  );
};

export const usePicks = () => {
  const context = useContext(PicksContext);

  if (!context) {
    throw new Error("usePicks must be used within a PicksProvider");
  }

  return context;
};