import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getEvents, getFightsByEventId } from "../services/eventsService.js";
import { ddb, TABLES } from "../services/ddb.js";
import { getUserIdFromEvent } from "../utils/auth.js";
import { ok, serverError } from "../utils/response.js";
import {
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

const getProfileName = async (userId) => {
  try {
    const response = await ddb.send(
      new GetCommand({
        TableName: TABLES.PROFILES,
        Key: { userId },
      })
    );

    const profile = response.Item;

    return (
      profile?.displayName ||
      profile?.name ||
      profile?.username ||
      profile?.email ||
      userId
    );
  } catch (error) {
    console.warn("getLeaderboard profile lookup failed", { userId, error });
    return userId;
  }
};

export const handler = async (event) => {
  try {
    const currentUserId = getUserIdFromEvent(event);

    const events = await getEvents();
    const fightsByEventId = new Map();

    for (const eventRecord of events) {
      const fights = await getFightsByEventId(eventRecord.eventId);
      fightsByEventId.set(eventRecord.eventId, fights);
    }

    const eventMap = new Map(events.map((entry) => [entry.eventId, entry]));
    const pickCards = await scanAll({
      TableName: TABLES.PICKS,
    });

    const uniqueUserIds = [...new Set(pickCards.map((entry) => entry.userId).filter(Boolean))];
    const profileNameEntries = await Promise.all(
      uniqueUserIds.map(async (userId) => [userId, await getProfileName(userId)])
    );
    const profileNameMap = new Map(profileNameEntries);

    const cardsByUserId = pickCards.reduce((acc, card) => {
      const current = acc.get(card.userId) || [];
      current.push(card);
      acc.set(card.userId, current);
      return acc;
    }, new Map());

    const leaderboardEntries = [];

    for (const [userId, cards] of cardsByUserId.entries()) {
      const totals = calculateOverallTotals(cards, eventMap, fightsByEventId);

      leaderboardEntries.push({
        id: userId,
        userId,
        name: profileNameMap.get(userId) || userId,
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

    const recentEventReturns = currentUserId
      ? (cardsByUserId.get(currentUserId) || [])
          .map((card) => {
            const eventRecord = eventMap.get(card.eventId) || null;
            const fights = fightsByEventId.get(card.eventId) || [];
            const totals = calculateEventTotals({
              card,
              event: eventRecord,
              fights,
            });

            return {
              eventId: card.eventId,
              eventName: eventRecord?.name || card.eventId,
              points: totals.totalPoints,
              correctPicks: totals.correctPicks,
              scoredPicks: totals.scoredPicks,
              status: totals.status,
            };
          })
          .sort((a, b) => b.points - a.points)
      : [];

    return ok({
      leaderboard,
      recentEventReturns,
    });
  } catch (error) {
    console.error("getLeaderboard error", error);
    return serverError();
  }
};