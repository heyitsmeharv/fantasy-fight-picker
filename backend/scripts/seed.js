#!/usr/bin/env node

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "eu-west-2";

const TABLES = {
  EVENTS: process.env.EVENTS_TABLE_NAME || "fantasy-fight-picker-sandbox-events",
  FIGHTS: process.env.FIGHTS_TABLE_NAME || "fantasy-fight-picker-sandbox-fights",
  FIGHTERS: process.env.FIGHTERS_TABLE_NAME || "fantasy-fight-picker-sandbox-fighters",
  PICKS: process.env.PICKS_TABLE_NAME || "fantasy-fight-picker-sandbox-picks",
  PROFILES: process.env.PROFILES_TABLE_NAME || "fantasy-fight-picker-sandbox-profiles",
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
  fighterId,
  name,
  nickname = null,
  record,
  rank,
  reach,
  stance,
  sigStrikes,
  takedowns,
  imageUrl = null,
  aliases = [],
}) => ({
  fighterId,
  slug: fighterId,
  name,
  nickname,
  record,
  rank,
  reach,
  stance,
  sigStrikes,
  takedowns,
  imageUrl,
  aliases,
  headshot: {
    status: "missing",
    bucket: null,
    key: null,
    thumbnailKey: null,
    contentType: null,
    etag: null,
    updatedAt: null,
  },
  createdAt: now,
  updatedAt: now,
});

const toFightSnapshot = (fighter) => ({
  id: fighter.fighterId,
  name: fighter.name,
  nickname: fighter.nickname,
  record: fighter.record,
  rank: fighter.rank,
  reach: fighter.reach,
  stance: fighter.stance,
  sigStrikes: fighter.sigStrikes,
  takedowns: fighter.takedowns,
  imageUrl: fighter.imageUrl,
});

const fightersById = {
  gaethje: buildFighter({
    fighterId: "gaethje",
    name: "Justin Gaethje",
    record: "25-5-0",
    rank: "#2",
    reach: '70"',
    stance: "Orthodox",
    sigStrikes: 7.46,
    takedowns: 0.15,
    aliases: ["fighter-gaethje"],
  }),
  holloway: buildFighter({
    fighterId: "holloway",
    name: "Max Holloway",
    record: "26-7-0",
    rank: "#1",
    reach: '69"',
    stance: "Orthodox",
    sigStrikes: 7.16,
    takedowns: 0.3,
    aliases: ["fighter-holloway"],
  }),
  whittaker: buildFighter({
    fighterId: "whittaker",
    name: "Robert Whittaker",
    record: "26-7-0",
    rank: "#3",
    reach: '73.5"',
    stance: "Orthodox",
    sigStrikes: 4.48,
    takedowns: 0.8,
    aliases: ["fighter-whittaker"],
  }),
  costa: buildFighter({
    fighterId: "costa",
    name: "Paulo Costa",
    record: "14-3-0",
    rank: "#7",
    reach: '72"',
    stance: "Orthodox",
    sigStrikes: 6.16,
    takedowns: 0,
    aliases: ["fighter-costa"],
  }),
  edwards: buildFighter({
    fighterId: "edwards",
    name: "Leon Edwards",
    record: "22-4-0",
    rank: "Champion",
    reach: '74"',
    stance: "Southpaw",
    sigStrikes: 2.74,
    takedowns: 1.26,
    aliases: ["fighter-edwards"],
  }),
  masvidal: buildFighter({
    fighterId: "masvidal",
    name: "Jorge Masvidal",
    record: "35-17-0",
    rank: "#11",
    reach: '74"',
    stance: "Orthodox",
    sigStrikes: 4.2,
    takedowns: 1.59,
    aliases: ["fighter-masvidal"],
  }),
  pereira: buildFighter({
    fighterId: "pereira",
    name: "Alex Pereira",
    nickname: "Poatan",
    record: "11-2-0",
    rank: "Champion",
    reach: '79"',
    stance: "Orthodox",
    sigStrikes: 5.23,
    takedowns: 0.17,
    aliases: ["fighter-pereira"],
  }),
  ankalaev: buildFighter({
    fighterId: "ankalaev",
    name: "Magomed Ankalaev",
    record: "19-1-1",
    rank: "#1",
    reach: '75"',
    stance: "Southpaw",
    sigStrikes: 3.64,
    takedowns: 0.92,
    aliases: ["fighter-ankalaev"],
  }),
};

const fighterItems = Object.values(fightersById);

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
    slotLabel: "Main Card",
    weightClass: "Lightweight",
    leftFighterId: fightersById.gaethje.fighterId,
    rightFighterId: fightersById.holloway.fighterId,
    left: toFightSnapshot(fightersById.gaethje),
    right: toFightSnapshot(fightersById.holloway),
    result: {
      outcome: "win",
      winnerId: fightersById.holloway.fighterId,
      winnerName: fightersById.holloway.name,
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
    slotLabel: "Main Card",
    weightClass: "Middleweight",
    leftFighterId: fightersById.whittaker.fighterId,
    rightFighterId: fightersById.costa.fighterId,
    left: toFightSnapshot(fightersById.whittaker),
    right: toFightSnapshot(fightersById.costa),
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
    slotLabel: "Main Card",
    weightClass: "Welterweight",
    leftFighterId: fightersById.edwards.fighterId,
    rightFighterId: fightersById.masvidal.fighterId,
    left: toFightSnapshot(fightersById.edwards),
    right: toFightSnapshot(fightersById.masvidal),
    result: {
      outcome: "disqualification",
      winnerId: fightersById.edwards.fighterId,
      winnerName: fightersById.edwards.name,
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
    slotLabel: "Main Event",
    weightClass: "Light Heavyweight",
    leftFighterId: fightersById.pereira.fighterId,
    rightFighterId: fightersById.ankalaev.fighterId,
    left: toFightSnapshot(fightersById.pereira),
    right: toFightSnapshot(fightersById.ankalaev),
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
        selectionId: fightersById.holloway.fighterId,
        selection: fightersById.holloway.name,
        predictedMethod: "KO/TKO",
        predictedRound: 2,
      },
      "fight-2": {
        selectionId: fightersById.whittaker.fighterId,
        selection: fightersById.whittaker.name,
        predictedMethod: "Decision",
        predictedRound: 3,
      },
      "fight-3": {
        selectionId: fightersById.edwards.fighterId,
        selection: fightersById.edwards.name,
        predictedMethod: "Decision",
        predictedRound: 5,
      },
      "fight-4": {
        selectionId: fightersById.pereira.fighterId,
        selection: fightersById.pereira.name,
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
        selectionId: fightersById.gaethje.fighterId,
        selection: fightersById.gaethje.name,
        predictedMethod: "Decision",
        predictedRound: 3,
      },
      "fight-2": {
        selectionId: fightersById.costa.fighterId,
        selection: fightersById.costa.name,
        predictedMethod: "Decision",
        predictedRound: 3,
      },
      "fight-3": {
        selectionId: fightersById.masvidal.fighterId,
        selection: fightersById.masvidal.name,
        predictedMethod: "KO/TKO",
        predictedRound: 2,
      },
      "fight-4": {
        selectionId: fightersById.ankalaev.fighterId,
        selection: fightersById.ankalaev.name,
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
        selectionId: fightersById.holloway.fighterId,
        selection: fightersById.holloway.name,
        predictedMethod: "Submission",
        predictedRound: 2,
      },
      "fight-2": {
        selectionId: fightersById.whittaker.fighterId,
        selection: fightersById.whittaker.name,
        predictedMethod: "KO/TKO",
        predictedRound: 1,
      },
      "fight-3": {
        selectionId: fightersById.edwards.fighterId,
        selection: fightersById.edwards.name,
        predictedMethod: "Decision",
        predictedRound: 4,
      },
      "fight-4": {
        selectionId: fightersById.pereira.fighterId,
        selection: fightersById.pereira.name,
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
  console.log(`Fighters table: ${TABLES.FIGHTERS}`);
  console.log(`Picks table:    ${TABLES.PICKS}`);
  console.log(`Profiles table: ${TABLES.PROFILES}`);
  console.log("");

  await putMany(TABLES.EVENTS, events, "events");
  await putMany(TABLES.FIGHTERS, fighterItems, "fighters");
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