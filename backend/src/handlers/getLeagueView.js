import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getEvents, getEventById } from "../services/eventsService.js";
import { getFightsByEventId } from "../services/fightsService.js";
import { ddb, TABLES } from "../services/ddb.js";
import { getProfileNameMap } from "../services/profileService.js";
import { getUserIdFromEvent } from "../utils/auth.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";
import {
  buildHeadToHeadRows,
  calculateEventTotals,
  calculateOverallTotals,
  rankLeaderboardEntries,
} from "../services/scoringService.js";

const scanAll = async (input) => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await ddb.send(
      new ScanCommand({
        ...input,
        ExclusiveStartKey,
      })
    );

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
};

export const handler = async (event) => {
  try {
    const currentUserId = getUserIdFromEvent(event);

    if (!currentUserId) {
      return forbidden("Unauthorized");
    }

    const query = event?.queryStringParameters || {};
    const requestedEventId = query.eventId || null;
    const requestedOpponentId = query.opponentId || null;

    const events = await getEvents();
    const eventMap = new Map(events.map((entry) => [entry.eventId, entry]));
    const fightsByEventId = new Map();

    for (const eventRecord of events) {
      const fights = await getFightsByEventId(eventRecord.eventId);
      fightsByEventId.set(eventRecord.eventId, fights);
    }

    const pickCards = await scanAll({
      TableName: TABLES.PICKS,
    });

    const uniqueUserIds = [...new Set(pickCards.map((entry) => entry.userId).filter(Boolean))];
    const profileNameMap = await getProfileNameMap(uniqueUserIds);

    const cardsByUserId = pickCards.reduce((acc, card) => {
      const current = acc.get(card.userId) || [];
      current.push(card);
      acc.set(card.userId, current);
      return acc;
    }, new Map());

    const leaderboardEntries = [];

    for (const [userId, cards] of cardsByUserId.entries()) {
      const totals = calculateOverallTotals(cards, eventMap, fightsByEventId);
      const displayName = profileNameMap.get(userId) || "Unknown player";

      leaderboardEntries.push({
        id: userId,
        userId,
        name: displayName,
        displayName,
        points: totals.totalPoints,
        accuracy: totals.scoredPicks
          ? Math.round((totals.correctPicks / totals.scoredPicks) * 100)
          : 0,
        correctPicks: totals.correctPicks,
        scoredPicks: totals.scoredPicks,
        isCurrentUser: currentUserId === userId,
      });
    }

    const leaderboard = rankLeaderboardEntries(leaderboardEntries);
    const resultEvents = events
      .filter((entry) => Array.isArray(fightsByEventId.get(entry.eventId)))
      .map((entry) => ({
        eventId: entry.eventId,
        name: entry.name,
        status: String(entry.status || "open").toLowerCase(),
      }));

    const selectedEventId = requestedEventId || resultEvents[0]?.eventId || null;

    if (!selectedEventId) {
      return notFound("No events available");
    }

    const selectedEvent =
      eventMap.get(selectedEventId) || (await getEventById(selectedEventId));

    if (!selectedEvent) {
      return notFound("Event not found");
    }

    const fights = fightsByEventId.get(selectedEventId) || [];
    const currentUserCards = cardsByUserId.get(currentUserId) || [];
    const yourCard =
      currentUserCards.find((entry) => entry.eventId === selectedEventId) || {
        userId: currentUserId,
        eventId: selectedEventId,
        selectedCount: 0,
        picks: {},
      };

    const opponentOptions = leaderboard.filter((entry) => !entry.isCurrentUser);
    const selectedOpponent =
      opponentOptions.find((entry) => entry.userId === requestedOpponentId) ||
      opponentOptions[0] ||
      null;

    if (requestedOpponentId && !selectedOpponent) {
      return badRequest("opponentId is invalid");
    }

    const opponentCards = selectedOpponent
      ? cardsByUserId.get(selectedOpponent.userId) || []
      : [];
    const opponentCard = selectedOpponent
      ? opponentCards.find((entry) => entry.eventId === selectedEventId) || {
          userId: selectedOpponent.userId,
          eventId: selectedEventId,
          selectedCount: 0,
          picks: {},
        }
      : null;

    const fightRows = buildHeadToHeadRows({
      fights,
      yourCard,
      opponentCard,
    });

    const yourTotals = calculateEventTotals({
      card: yourCard,
      event: selectedEvent,
      fights,
    });

    const opponentTotals = opponentCard
      ? calculateEventTotals({
          card: opponentCard,
          event: selectedEvent,
          fights,
        })
      : {
          totalPoints: 0,
          correctPicks: 0,
          scoredPicks: 0,
          accuracy: 0,
          selectedCount: 0,
          totalFights: fights.length,
          status: String(selectedEvent.status || "open").toLowerCase(),
          picks: [],
        };

    return ok({
      leaderboard,
      resultEvents,
      selectedEvent: {
        ...selectedEvent,
        fights,
      },
      selectedOpponent,
      comparison: {
        eventId: selectedEventId,
        eventHasResults: fights.some((fight) => Boolean(fight.result)),
        yourTotals,
        opponentTotals,
        fights: fightRows,
      },
    });
  } catch (error) {
    console.error("getLeagueView error", error);
    return serverError();
  }
};