import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/common/SectionHeading";
import { useResults } from "../context/ResultsContext";
import { useToast } from "../context/ToastContext";
import { isEventLocked } from "../utils/event";
import { getOfficialResultLabel } from "../utils/scoring";

const methodOptions = ["Decision", "KO/TKO", "Submission", "Disqualification"];

const selectClass =
  "h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-11 text-sm font-medium text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const getEventKey = (event) => String(event?.id || event?.eventId || "");

const getEventOptionLabel = (event) => {
  const baseName = event?.name || "Unknown event";
  const rawTagline = event?.tagline?.trim();

  if (!rawTagline) {
    return baseName;
  }

  const vsMatch = rawTagline.match(
    /([A-Za-zÀ-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÿ'’.-]+)*)\s+vs\s+([A-Za-zÀ-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÿ'’.-]+)*)/i
  );

  if (vsMatch) {
    return `${baseName} • ${vsMatch[1]} vs ${vsMatch[2]}`;
  }

  return `${baseName} • ${rawTagline}`;
};

const AdminResultsPage = () => {
  const { events, updateFightResult, clearFightResult, updateEventStatus } = useResults();
  const { showToast } = useToast();

  const resultEvents = useMemo(() => {
    return events.filter((event) => Array.isArray(event.fights));
  }, [events]);

  const [selectedEventId, setSelectedEventId] = useState(() => getEventKey(resultEvents[0]));

  const selectedEvent = useMemo(() => {
    return (
      resultEvents.find((event) => getEventKey(event) === selectedEventId) ||
      resultEvents[0] ||
      null
    );
  }, [resultEvents, selectedEventId]);

  const locked = isEventLocked(selectedEvent);

  const handleOutcomeChange = (fight, outcome, fighter = null) => {
    const existingResult = fight.result || {};
    const eventKey = getEventKey(selectedEvent);

    if (outcome === "draw") {
      updateFightResult(eventKey, fight.id, {
        outcome: "draw",
        winnerId: null,
        winnerName: "Draw",
        method:
          existingResult.method && existingResult.method !== "Disqualification"
            ? existingResult.method
            : "Decision",
        round: existingResult.round ?? null,
      });

      showToast({
        title: "Result updated",
        description: `${fight.left.name} vs ${fight.right.name} set to draw.`,
        variant: "success",
      });

      return;
    }

    if (outcome === "disqualification" && fighter) {
      updateFightResult(eventKey, fight.id, {
        outcome: "disqualification",
        winnerId: fighter.id,
        winnerName: fighter.name,
        method: "Disqualification",
        round: existingResult.round ?? null,
      });

      showToast({
        title: "Result updated",
        description: `${fighter.name} wins by disqualification.`,
        variant: "success",
      });

      return;
    }

    if (outcome === "win" && fighter) {
      updateFightResult(eventKey, fight.id, {
        outcome: "win",
        winnerId: fighter.id,
        winnerName: fighter.name,
        method:
          existingResult.method === "Disqualification" ? null : existingResult.method ?? null,
        round: existingResult.round ?? null,
      });

      showToast({
        title: "Winner updated",
        description: `${fighter.name} set as the official winner.`,
        variant: "success",
      });
    }
  };

  const handleMethodChange = (fight, method) => {
    updateFightResult(getEventKey(selectedEvent), fight.id, {
      outcome: fight.result?.outcome ?? "win",
      winnerId: fight.result?.winnerId ?? null,
      winnerName: fight.result?.winnerName ?? null,
      method,
      round: fight.result?.round ?? null,
    });

    showToast({
      title: "Method updated",
      description: `${method} saved for ${fight.left.name} vs ${fight.right.name}.`,
    });
  };

  const handleRoundChange = (fight, round) => {
    updateFightResult(getEventKey(selectedEvent), fight.id, {
      outcome: fight.result?.outcome ?? "win",
      winnerId: fight.result?.winnerId ?? null,
      winnerName: fight.result?.winnerName ?? null,
      method: fight.result?.method ?? null,
      round,
    });

    showToast({
      title: "Round updated",
      description: `Round ${round} saved for ${fight.left.name} vs ${fight.right.name}.`,
    });
  };

  const handleClearResult = (fight) => {
    clearFightResult(getEventKey(selectedEvent), fight.id);

    showToast({
      title: "Result cleared",
      description: `${fight.left.name} vs ${fight.right.name} has no official result now.`,
      variant: "danger",
    });
  };

  const handleStatusChange = (status) => {
    updateEventStatus(getEventKey(selectedEvent), status);

    showToast({
      title: status === "locked" ? "Event locked" : "Event opened",
      description:
        status === "locked"
          ? `${selectedEvent.name} is now read-only for picks.`
          : `${selectedEvent.name} can now accept picks again.`,
      variant: status === "locked" ? "danger" : "success",
    });
  };

  if (!selectedEvent) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">No events available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Admin" title="Results manager" />

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Choose event</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="max-w-xl">
            <label
              htmlFor="admin-results-event-select"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Select card
            </label>

            <div className="relative mt-2">
              <select
                id="admin-results-event-select"
                className={selectClass}
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                disabled={resultEvents.length === 0}
              >
                <option value="" disabled>
                  {resultEvents.length ? "Choose card" : "No cards available"}
                </option>

                {resultEvents.map((event) => {
                  const eventKey = getEventKey(event);

                  return (
                    <option
                      key={eventKey}
                      value={eventKey}
                      className="bg-zinc-950 text-white"
                    >
                      {getEventOptionLabel(event)}
                    </option>
                  );
                })}
              </select>

              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <p className="text-sm text-slate-400">
            {resultEvents.length} event{resultEvents.length === 1 ? "" : "s"} available.
          </p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Event status</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Control whether users can still make or edit picks.
              </p>
            </div>

            <Badge
              className={
                locked
                  ? "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200"
                  : "border border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
              }
            >
              {locked ? "Locked" : "Open"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant={!locked ? "default" : "outline"}
              className={
                !locked
                  ? "rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                  : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
              }
              onClick={() => handleStatusChange("open")}
            >
              Open event
            </Button>

            <Button
              variant={locked ? "default" : "outline"}
              className={
                locked
                  ? "rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                  : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
              }
              onClick={() => handleStatusChange("locked")}
            >
              Lock event
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            {locked
              ? "This event is locked. Users can still view their picks and results, but they cannot edit selections."
              : "This event is open. Users can still make and edit picks before you lock it."}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-5">
        {selectedEvent.fights.map((fight) => {
          const maxRounds = fight.slotLabel === "Main Event" ? 5 : 3;
          const officialResult = fight.result;
          const availableMethodOptions =
            officialResult?.outcome === "disqualification"
              ? ["Disqualification"]
              : methodOptions.filter((method) => method !== "Disqualification");

          return (
            <Card key={fight.id} className="border-white/10 bg-zinc-950/90 text-white">
              <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {fight.left.name} vs {fight.right.name}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {fight.weightClass} • {fight.slotLabel}
                    </p>
                  </div>

                  {officialResult ? (
                    <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
                      Result saved
                    </Badge>
                  ) : (
                    <Badge className="border border-white/10 bg-white/5 text-white">
                      No result
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <p className="mb-3 text-sm font-medium text-white">Official outcome</p>

                  <div className="flex flex-wrap gap-3">
                    {[fight.left, fight.right].map((fighter) => {
                      const active =
                        officialResult?.outcome === "win" &&
                        officialResult?.winnerId === fighter.id;

                      return (
                        <Button
                          key={fighter.id}
                          variant={active ? "default" : "outline"}
                          className={
                            active
                              ? "rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                              : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                          }
                          onClick={() => handleOutcomeChange(fight, "win", fighter)}
                        >
                          {fighter.name}
                        </Button>
                      );
                    })}

                    <Button
                      variant={officialResult?.outcome === "draw" ? "default" : "outline"}
                      className={
                        officialResult?.outcome === "draw"
                          ? "rounded-full bg-amber-600 text-white hover:bg-amber-500"
                          : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                      }
                      onClick={() => handleOutcomeChange(fight, "draw")}
                    >
                      Draw
                    </Button>

                    <Button
                      variant={
                        officialResult?.outcome === "disqualification" &&
                        officialResult?.winnerId === fight.left.id
                          ? "default"
                          : "outline"
                      }
                      className={
                        officialResult?.outcome === "disqualification" &&
                        officialResult?.winnerId === fight.left.id
                          ? "rounded-full bg-amber-600 text-white hover:bg-amber-500"
                          : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                      }
                      onClick={() => handleOutcomeChange(fight, "disqualification", fight.left)}
                    >
                      DQ: {fight.left.name}
                    </Button>

                    <Button
                      variant={
                        officialResult?.outcome === "disqualification" &&
                        officialResult?.winnerId === fight.right.id
                          ? "default"
                          : "outline"
                      }
                      className={
                        officialResult?.outcome === "disqualification" &&
                        officialResult?.winnerId === fight.right.id
                          ? "rounded-full bg-amber-600 text-white hover:bg-amber-500"
                          : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                      }
                      onClick={() => handleOutcomeChange(fight, "disqualification", fight.right)}
                    >
                      DQ: {fight.right.name}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-white">Method</p>
                  <div className="flex flex-wrap gap-3">
                    {availableMethodOptions.map((method) => {
                      const active = officialResult?.method === method;

                      return (
                        <Button
                          key={method}
                          variant={active ? "default" : "outline"}
                          className={
                            active
                              ? "rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                              : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                          }
                          onClick={() => handleMethodChange(fight, method)}
                        >
                          {method}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-white">Round</p>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: maxRounds }, (_, index) => index + 1).map((round) => {
                      const active = officialResult?.round === round;

                      return (
                        <Button
                          key={round}
                          variant={active ? "default" : "outline"}
                          className={
                            active
                              ? "rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                              : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                          }
                          onClick={() => handleRoundChange(fight, round)}
                        >
                          Round {round}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {officialResult ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                      Official result
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {getOfficialResultLabel(officialResult)}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {[officialResult.method, officialResult.round ? `Round ${officialResult.round}` : null]
                        .filter(Boolean)
                        .join(" • ") || "Method / round not complete"}
                    </p>
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    className="rounded-full text-slate-200 hover:bg-white/5 hover:text-white"
                    onClick={() => handleClearResult(fight)}
                  >
                    Clear result
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminResultsPage;