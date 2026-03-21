import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Activity, Shield, Swords, Target } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/common/SectionHeading";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import { fetchFighterById } from "../api/fighters";
import { useResults } from "../context/ResultsContext";

const hasValue = (value) => value !== null && value !== undefined && value !== "";

const getFightId = (fight) => fight?.fightId ?? fight?.id ?? null;
const getEventId = (event) => event?.eventId ?? event?.id ?? null;
const getFighterId = (fighter) => fighter?.fighterId ?? fighter?.id ?? null;

const formatFighterName = (name) => {
  if (!name || typeof name !== "string") {
    return "Unknown fighter";
  }

  if (!name.includes(",")) {
    return name;
  }

  const [lastName, firstName] = name.split(",").map((part) => part.trim());
  return [firstName, lastName].filter(Boolean).join(" ");
};

const normalizeFighterSnapshot = (fighter) => {
  if (!fighter) {
    return null;
  }

  const fighterId = getFighterId(fighter);

  return {
    ...fighter,
    id: fighterId,
    fighterId,
    name: formatFighterName(fighter.name),
    rank: fighter.rank || "Unranked",
    displayWeightClass: fighter.displayWeightClass || "Roster",
  };
};

const mergeFighterData = (baseFighter, fetchedFighter) => {
  if (!baseFighter && !fetchedFighter) {
    return null;
  }

  return normalizeFighterSnapshot({
    ...(baseFighter || {}),
    ...(fetchedFighter || {}),
    sourceRefs: {
      ...(baseFighter?.sourceRefs || {}),
      ...(fetchedFighter?.sourceRefs || {}),
    },
  });
};

const toNumber = (value) => {
  if (!hasValue(value)) {
    return null;
  }

  const normalized = String(value).replace(/[%"]/g, "").trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};

const formatValue = (value, suffix = "") => {
  if (!hasValue(value)) {
    return "N/A";
  }

  return suffix ? `${value}${suffix}` : String(value);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeMetric = (value, max, { invert = false } = {}) => {
  const numeric = toNumber(value);

  if (numeric === null || !max) {
    return 0;
  }

  const safe = clamp(numeric, 0, max);
  const normalized = (safe / max) * 100;

  if (invert) {
    return Math.round((100 - normalized) * 10) / 10;
  }

  return Math.round(normalized * 10) / 10;
};

const compareEdge = (leftValue, rightValue, { lowerIsBetter = false } = {}) => {
  const left = toNumber(leftValue);
  const right = toNumber(rightValue);

  if (left === null && right === null) {
    return null;
  }

  if (left !== null && right === null) {
    return "left";
  }

  if (left === null && right !== null) {
    return "right";
  }

  if (left === right) {
    return "even";
  }

  if (lowerIsBetter) {
    return left < right ? "left" : "right";
  }

  return left > right ? "left" : "right";
};

const buildEdgeBadges = (left, right) => {
  const reachEdge = compareEdge(left?.reach, right?.reach);
  const strikingEdge = compareEdge(left?.sigStrikes, right?.sigStrikes);
  const defenseEdge = compareEdge(left?.sigStrikesAbsorbed, right?.sigStrikesAbsorbed, {
    lowerIsBetter: true,
  });
  const wrestlingEdge = compareEdge(left?.takedowns, right?.takedowns);

  const resolveLabel = (edge, leftLabel, rightLabel, neutralLabel) => {
    if (edge === "left") return leftLabel;
    if (edge === "right") return rightLabel;
    return neutralLabel;
  };

  return [
    {
      label: `Reach edge: ${resolveLabel(
        reachEdge,
        left?.name || "Left",
        right?.name || "Right",
        "Even"
      )}`,
    },
    {
      label: `Striking edge: ${resolveLabel(
        strikingEdge,
        left?.name || "Left",
        right?.name || "Right",
        "Even"
      )}`,
    },
    {
      label: `Defense edge: ${resolveLabel(
        defenseEdge,
        left?.name || "Left",
        right?.name || "Right",
        "Even"
      )}`,
    },
    {
      label: `Wrestling edge: ${resolveLabel(
        wrestlingEdge,
        left?.name || "Left",
        right?.name || "Right",
        "Even"
      )}`,
    },
  ];
};

const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/95 p-3 text-sm text-white shadow-2xl">
      <p className="mb-2 font-semibold">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <p key={`${entry.dataKey}-${entry.name}`} className="text-slate-300">
            {entry.name}: {formatter ? formatter(entry.value, entry) : entry.value}
          </p>
        ))}
      </div>
    </div>
  );
};

const FighterSummaryCard = ({ fighter, align = "left" }) => {
  const isRight = align === "right";

  return (
    <Card className="border-white/10 bg-zinc-950/90 text-white">
      <CardContent className="p-6">
        <div
          className={`flex items-center gap-4 ${isRight ? "sm:flex-row-reverse" : ""}`}
        >
          <FighterAvatar fighter={fighter} size="md" />

          <div className={isRight ? "text-right" : "text-left"}>
            <p className="text-2xl font-semibold uppercase">{fighter.name}</p>

            {fighter.nickname ? (
              <p className="mt-1 text-sm text-slate-400">“{fighter.nickname}”</p>
            ) : null}

            <div
              className={`mt-3 flex flex-wrap gap-2 ${
                isRight ? "justify-end" : "justify-start"
              }`}
            >
              <FighterRankBadge rank={fighter.rank || "Unranked"} compact />
              <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                {fighter.displayWeightClass || "Roster"}
              </Badge>
              <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                {fighter.record || "Record TBC"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ComparePage = () => {
  const { eventId, fightId } = useParams();
  const navigate = useNavigate();
  const { events } = useResults();

  const [leftFighter, setLeftFighter] = useState(null);
  const [rightFighter, setRightFighter] = useState(null);
  const [loadingFighters, setLoadingFighters] = useState(false);

  const event = useMemo(() => {
    return events.find((entry) => getEventId(entry) === eventId) || null;
  }, [eventId, events]);

  const fight = useMemo(() => {
    if (!event?.fights) {
      return null;
    }

    return event.fights.find((entry) => getFightId(entry) === fightId) || null;
  }, [event, fightId]);

  useEffect(() => {
    let cancelled = false;

    const loadFighters = async () => {
      if (!fight?.left || !fight?.right) {
        setLeftFighter(null);
        setRightFighter(null);
        return;
      }

      const leftSnapshot = normalizeFighterSnapshot(fight.left);
      const rightSnapshot = normalizeFighterSnapshot(fight.right);

      setLeftFighter(leftSnapshot);
      setRightFighter(rightSnapshot);

      const leftId = getFighterId(leftSnapshot);
      const rightId = getFighterId(rightSnapshot);

      if (!leftId || !rightId) {
        return;
      }

      try {
        setLoadingFighters(true);

        const [leftResponse, rightResponse] = await Promise.allSettled([
          fetchFighterById(leftId),
          fetchFighterById(rightId),
        ]);

        if (cancelled) {
          return;
        }

        const resolvedLeft =
          leftResponse.status === "fulfilled" && leftResponse.value
            ? mergeFighterData(leftSnapshot, leftResponse.value)
            : leftSnapshot;

        const resolvedRight =
          rightResponse.status === "fulfilled" && rightResponse.value
            ? mergeFighterData(rightSnapshot, rightResponse.value)
            : rightSnapshot;

        setLeftFighter(resolvedLeft);
        setRightFighter(resolvedRight);
      } catch (error) {
        console.error("ComparePage fighter fetch error", error);
      } finally {
        if (!cancelled) {
          setLoadingFighters(false);
        }
      }
    };

    loadFighters();

    return () => {
      cancelled = true;
    };
  }, [fight]);

  if (!event) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Event not found</p>
          <p className="mt-2 text-slate-400">{eventId}</p>
          <Button
            className="mt-6 rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!fight) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Fight not found</p>
          <p className="mt-2 text-slate-400">
            No fight matched {fightId} inside {eventId}
          </p>
          <Button
            className="mt-6 rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Back to event
          </Button>
        </CardContent>
      </Card>
    );
  }

  const resolvedLeft = leftFighter || normalizeFighterSnapshot(fight.left);
  const resolvedRight = rightFighter || normalizeFighterSnapshot(fight.right);

  const edgeBadges = useMemo(
    () => buildEdgeBadges(resolvedLeft, resolvedRight),
    [resolvedLeft, resolvedRight]
  );

  const radarData = useMemo(
    () => [
      {
        metric: "Reach",
        left: normalizeMetric(resolvedLeft?.reach, 90),
        right: normalizeMetric(resolvedRight?.reach, 90),
      },
      {
        metric: "SLpM",
        left: normalizeMetric(resolvedLeft?.sigStrikes, 8),
        right: normalizeMetric(resolvedRight?.sigStrikes, 8),
      },
      {
        metric: "Defense",
        left: normalizeMetric(resolvedLeft?.sigStrikeDefense, 100),
        right: normalizeMetric(resolvedRight?.sigStrikeDefense, 100),
      },
      {
        metric: "SApM",
        left: normalizeMetric(resolvedLeft?.sigStrikesAbsorbed, 8, { invert: true }),
        right: normalizeMetric(resolvedRight?.sigStrikesAbsorbed, 8, { invert: true }),
      },
      {
        metric: "TD Avg",
        left: normalizeMetric(resolvedLeft?.takedowns, 6),
        right: normalizeMetric(resolvedRight?.takedowns, 6),
      },
      {
        metric: "TD Def",
        left: normalizeMetric(resolvedLeft?.takedownDefense, 100),
        right: normalizeMetric(resolvedRight?.takedownDefense, 100),
      },
      {
        metric: "Sub Avg",
        left: normalizeMetric(resolvedLeft?.submissionAvg, 3),
        right: normalizeMetric(resolvedRight?.submissionAvg, 3),
      },
      {
        metric: "Str Acc",
        left: normalizeMetric(resolvedLeft?.sigStrikeAccuracy, 100),
        right: normalizeMetric(resolvedRight?.sigStrikeAccuracy, 100),
      },
    ],
    [resolvedLeft, resolvedRight]
  );

  const comparisonBarData = useMemo(
    () => [
      {
        label: "Reach",
        left: toNumber(resolvedLeft?.reach) ?? 0,
        right: toNumber(resolvedRight?.reach) ?? 0,
      },
      {
        label: "Leg Reach",
        left: toNumber(resolvedLeft?.legReach) ?? 0,
        right: toNumber(resolvedRight?.legReach) ?? 0,
      },
      {
        label: "SLpM",
        left: toNumber(resolvedLeft?.sigStrikes) ?? 0,
        right: toNumber(resolvedRight?.sigStrikes) ?? 0,
      },
      {
        label: "SApM",
        left: toNumber(resolvedLeft?.sigStrikesAbsorbed) ?? 0,
        right: toNumber(resolvedRight?.sigStrikesAbsorbed) ?? 0,
      },
      {
        label: "TD Avg",
        left: toNumber(resolvedLeft?.takedowns) ?? 0,
        right: toNumber(resolvedRight?.takedowns) ?? 0,
      },
      {
        label: "Sub Avg",
        left: toNumber(resolvedLeft?.submissionAvg) ?? 0,
        right: toNumber(resolvedRight?.submissionAvg) ?? 0,
      },
      {
        label: "Str Acc %",
        left: toNumber(resolvedLeft?.sigStrikeAccuracy) ?? 0,
        right: toNumber(resolvedRight?.sigStrikeAccuracy) ?? 0,
      },
      {
        label: "Str Def %",
        left: toNumber(resolvedLeft?.sigStrikeDefense) ?? 0,
        right: toNumber(resolvedRight?.sigStrikeDefense) ?? 0,
      },
      {
        label: "TD Acc %",
        left: toNumber(resolvedLeft?.takedownAccuracy) ?? 0,
        right: toNumber(resolvedRight?.takedownAccuracy) ?? 0,
      },
      {
        label: "TD Def %",
        left: toNumber(resolvedLeft?.takedownDefense) ?? 0,
        right: toNumber(resolvedRight?.takedownDefense) ?? 0,
      },
    ],
    [resolvedLeft, resolvedRight]
  );

  const finishChartData = useMemo(
    () => [
      {
        label: "KO Wins",
        left: toNumber(resolvedLeft?.winsByKnockout) ?? 0,
        right: toNumber(resolvedRight?.winsByKnockout) ?? 0,
      },
      {
        label: "Sub Wins",
        left: toNumber(resolvedLeft?.winsBySubmission) ?? 0,
        right: toNumber(resolvedRight?.winsBySubmission) ?? 0,
      },
      {
        label: "1st-Round Finishes",
        left: toNumber(resolvedLeft?.firstRoundFinishes) ?? 0,
        right: toNumber(resolvedRight?.firstRoundFinishes) ?? 0,
      },
    ],
    [resolvedLeft, resolvedRight]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Tale of the tape"
          title={`${resolvedLeft?.name || "Left"} vs ${resolvedRight?.name || "Right"}`}
        />

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
            onClick={() => navigate(`/events/${eventId}`)}
          >
            Back to event
          </Button>
        </div>
      </div>

      {loadingFighters ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          Loading full fighter profiles for comparison...
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {edgeBadges.map((item) => (
          <Badge
            key={item.label}
            className="border border-white/10 bg-white/5 text-white hover:bg-white/5"
          >
            {item.label}
          </Badge>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <FighterSummaryCard fighter={resolvedLeft} align="left" />
        <FighterSummaryCard fighter={resolvedRight} align="right" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Activity className="h-5 w-5 text-[#d20a11]" />
              Style profile
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name={resolvedLeft.name}
                  dataKey="left"
                  stroke="#d20a11"
                  fill="#d20a11"
                  fillOpacity={0.25}
                />
                <Radar
                  name={resolvedRight.name}
                  dataKey="right"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.18}
                />
                <Legend />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-5 w-5 text-[#d20a11]" />
              Tale of the tape
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarData}
                layout="vertical"
                margin={{ top: 8, right: 18, left: 18, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={95}
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar
                  dataKey="left"
                  name={resolvedLeft.name}
                  fill="#d20a11"
                  radius={[0, 6, 6, 0]}
                />
                <Bar
                  dataKey="right"
                  name={resolvedRight.name}
                  fill="#94a3b8"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-[#d20a11]" />
              Snapshot
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {resolvedLeft.name}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Rank: {resolvedLeft.rank || "Unranked"}</p>
                <p>Division: {resolvedLeft.displayWeightClass || "Roster"}</p>
                <p>Record: {resolvedLeft.record || "N/A"}</p>
                <p>Reach: {formatValue(resolvedLeft.reach)}</p>
                <p>SLpM: {formatValue(resolvedLeft.sigStrikes)}</p>
                <p>TD Avg: {formatValue(resolvedLeft.takedowns)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {resolvedRight.name}
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Rank: {resolvedRight.rank || "Unranked"}</p>
                <p>Division: {resolvedRight.displayWeightClass || "Roster"}</p>
                <p>Record: {resolvedRight.record || "N/A"}</p>
                <p>Reach: {formatValue(resolvedRight.reach)}</p>
                <p>SLpM: {formatValue(resolvedRight.sigStrikes)}</p>
                <p>TD Avg: {formatValue(resolvedRight.takedowns)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Swords className="h-5 w-5 text-[#d20a11]" />
              Finish profile
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={finishChartData}
                margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar
                  dataKey="left"
                  name={resolvedLeft.name}
                  fill="#d20a11"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="right"
                  name={resolvedRight.name}
                  fill="#94a3b8"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComparePage;