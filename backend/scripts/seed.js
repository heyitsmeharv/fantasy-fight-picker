#!/usr/bin/env node

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "eu-west-2";

const TABLES = {
  EVENTS:
    process.env.EVENTS_TABLE_NAME || "fantasy-ufc-sandbox-events",
  FIGHTS:
    process.env.FIGHTS_TABLE_NAME || "fantasy-ufc-sandbox-fights",
  PICKS:
    process.env.PICKS_TABLE_NAME || "fantasy-ufc-sandbox-picks",
  PROFILES:
    process.env.PROFILES_TABLE_NAME || "fantasy-ufc-sandbox-profiles",
};

const client = new DynamoDBClient({ region: REGION });

const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const now = new Date().toISOString();
const eventId = "ufc-300";

const buildFighter = ({
  id,
  name,
  record,
  rank,
  reach,
  stance,
  sigStrikes,
  takedowns,
}) => ({
  id,
  name,
  record,
  rank,
  reach,
  stance,
  sigStrikes,
  takedowns,
});

const fighters = {
  gaethje: buildFighter({
    id: "fighter-gaethje",
    name: "Justin Gaethje",
    record: "25-5-0",
    rank: "#2",
    reach: '70"',
    stance: "Orthodox",
    sigStrikes: 7.46,
    takedowns: 0.15,
  }),
  holloway: buildFighter({
    id: "fighter-holloway",
    name: "Max Holloway",
    record: "26-7-0",
    rank: "#1",
    reach: '69"',
    stance: "Orthodox",
    sigStrikes: 7.16,
    takedowns: 0.30,
  }),
  whittaker: buildFighter({
    id: "fighter-whittaker",
    name: "Robert Whittaker",
    record: "26-7-0",
    rank: "#3",
    reach: '73.5"',
    stance: "Orthodox",
    sigStrikes: 4.48,
    takedowns: 0.80,
  }),
  costa: buildFighter({
    id: "fighter-costa",
    name: "Paulo Costa",
    record: "14-3-0",
    rank: "#7",
    reach: '72"',
    stance: "Orthodox",
    sigStrikes: 6.16,
    takedowns: 0.00,
  }),
  edwards: buildFighter({
    id: "fighter-edwards",
    name: "Leon Edwards",
    record: "22-4-0",
    rank: "Champion",
    reach: '74"',
    stance: "Southpaw",
    sigStrikes: 2.74,
    takedowns: 1.26,
  }),
  masvidal: buildFighter({
    id: "fighter-masvidal",
    name: "Jorge Masvidal",
    record: "35-17-0",
    rank: "#11",
    reach: '74"',
    stance: "Orthodox",
    sigStrikes: 4.20,
    takedowns: 1.59,
  }),
  pereira: buildFighter({
    id: "fighter-pereira",
    name: "Alex Pereira",
    record: "11-2-0",
    rank: "Champion",
    reach: '79"',
    stance: "Orthodox",
    sigStrikes: 5.23,
    takedowns: 0.17,
  }),
  ankalaev: buildFighter({
    id: "fighter-ankalaev",
    name: "Magomed Ankalaev",
    record: "19-1-1",
    rank: "#1",
    reach: '75"',
    stance: "Southpaw",
    sigStrikes: 3.64,
    takedowns: 0.92,
  }),
};

const events = [
  {
    eventId,
    name: "UFC 300",
    slug: "ufc-300",
    tagline: "Holloway vs Gaethje headlines a stacked card in Vegas.",
    date: "2026-04-13",
    lockTime: "2026-04-13T22:00:00Z",
    location: "Las Vegas, Nevada",
    venue: "T-Mobile Arena",
    status: "open",
    GSI1PK: "EVENT",
    GSI1SK: "2026-04-13T22:00:00Z",
    createdAt: now,
    updatedAt: now,
  },
];

const fights = [
  {
    eventId,
    fightId: "fight-1",
    order: 1,
    cardType: "main",
    weightClass: "Lightweight",
    slotLabel: "Main Card",
    left: fighters.gaethje,
    right: fighters.holloway,
    result: {
      outcome: "win",
      winnerId: fighters.holloway.id,
      winnerName: fighters.holloway.name,
      method: "KO/TKO",
      round: 2,
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    eventId,
    fightId: "fight-2",
    order: 2,
    cardType: "main",
    weightClass: "Middleweight",
    slotLabel: "Main Card",
    left: fighters.whittaker,
    right: fighters.costa,
    result: {
      outcome: "draw",
      winnerId: null,
      winnerName: "Draw",
      method: "Decision",
      round: null,
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    eventId,
    fightId: "fight-3",
    order: 3,
    cardType: "main",
    weightClass: "Welterweight",
    slotLabel: "Main Card",
    left: fighters.edwards,
    right: fighters.masvidal,
    result: {
      outcome: "disqualification",
      winnerId: fighters.edwards.id,
      winnerName: fighters.edwards.name,
      method: "Disqualification",
      round: 3,
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    eventId,
    fightId: "fight-4",
    order: 4,
    cardType: "main",
    weightClass: "Light Heavyweight",
    slotLabel: "Main Event",
    left: fighters.pereira,
    right: fighters.ankalaev,
    createdAt: now,
    updatedAt: now,
  },
];

const profiles = [
  {
    userId: "user-adam",
    displayName: "Adam",
    email: "adam@example.com",
    createdAt: now,
    updatedAt: now,
  },
  {
    userId: "user-sam",
    displayName: "Sam",
    email: "sam@example.com",
    createdAt: now,
    updatedAt: now,
  },
  {
    userId: "user-jess",
    displayName: "Jess",
    email: "jess@example.com",
    createdAt: now,
    updatedAt: now,
  },
];

const picks = [
  {
    userId: "user-adam",
    eventId,
    selectedCount: 4,
    picks: {
      "fight-1": {
        selectionId: fighters.holloway.id,
        selection: fighters.holloway.name,
        predictedMethod: "KO/TKO",
        predictedRound: 2,
      },
      "fight-2": {
        selectionId: fighters.whittaker.id,
        selection: fighters.whittaker.name,
        predictedMethod: "Decision",
        predictedRound: 3,
      },
      "fight-3": {
        selectionId: fighters.edwards.id,
        selection: fighters.edwards.name,
        predictedMethod: "Decision",
        predictedRound: 5,
      },
      "fight-4": {
        selectionId: fighters.pereira.id,
        selection: fighters.pereira.name,
        predictedMethod: "KO/TKO",
        predictedRound: 4,
      },
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    userId: "user-sam",
    eventId,
    selectedCount: 4,
    picks: {
      "fight-1": {
        selectionId: fighters.gaethje.id,
        selection: fighters.gaethje.name,
        predictedMethod: "Decision",
        predictedRound: 3,
      },
      "fight-2": {
        selectionId: fighters.costa.id,
        selection: fighters.costa.name,
        predictedMethod: "Decision",
        predictedRound: 3,
      },
      "fight-3": {
        selectionId: fighters.masvidal.id,
        selection: fighters.masvidal.name,
        predictedMethod: "KO/TKO",
        predictedRound: 2,
      },
      "fight-4": {
        selectionId: fighters.ankalaev.id,
        selection: fighters.ankalaev.name,
        predictedMethod: "Decision",
        predictedRound: 5,
      },
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    userId: "user-jess",
    eventId,
    selectedCount: 4,
    picks: {
      "fight-1": {
        selectionId: fighters.holloway.id,
        selection: fighters.holloway.name,
        predictedMethod: "Submission",
        predictedRound: 2,
      },
      "fight-2": {
        selectionId: fighters.whittaker.id,
        selection: fighters.whittaker.name,
        predictedMethod: "KO/TKO",
        predictedRound: 1,
      },
      "fight-3": {
        selectionId: fighters.edwards.id,
        selection: fighters.edwards.name,
        predictedMethod: "Decision",
        predictedRound: 4,
      },
      "fight-4": {
        selectionId: fighters.pereira.id,
        selection: fighters.pereira.name,
        predictedMethod: "KO/TKO",
        predictedRound: 1,
      },
    },
    createdAt: now,
    updatedAt: now,
  },
];

const putMany = async (tableName, items, label) => {
  for (const item of items) {
    await ddb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
  }

  console.log(`Seeded ${items.length} ${label} into ${tableName}`);
};

const main = async () => {
  console.log("Seeding Fantasy UFC sandbox...");
  console.log(`Region: ${REGION}`);
  console.log(`Events table:   ${TABLES.EVENTS}`);
  console.log(`Fights table:   ${TABLES.FIGHTS}`);
  console.log(`Picks table:    ${TABLES.PICKS}`);
  console.log(`Profiles table: ${TABLES.PROFILES}`);
  console.log("");

  await putMany(TABLES.EVENTS, events, "events");
  await putMany(TABLES.FIGHTS, fights, "fights");
  await putMany(TABLES.PROFILES, profiles, "profiles");
  await putMany(TABLES.PICKS, picks, "pick cards");

  console.log("");
  console.log("Seed complete.");
  console.log(`Event ID for testing: ${eventId}`);
};

main().catch((error) => {
  console.error("Seed failed");
  console.error(error);
  process.exit(1);
});