import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/common/SectionHeading";
import { useResults } from "../context/ResultsContext";
import { useToast } from "../context/ToastContext";
import { isEventLocked } from "../utils/event";

const methodOptions = ["Decision", "KO/TKO", "Submission"];

const AdminResultsPage = () => {
  const { events, updateFightResult, clearFightResult, updateEventStatus } = useResults();
  const { showToast } = useToast();

  const resultEvents = useMemo(() => {
    return events.filter((event) => Array.isArray(event.fights));
  }, [events]);

  const [selectedEventId, setSelectedEventId] = useState(resultEvents[0]?.id || "");

  const selectedEvent = useMemo(() => {
    return resultEvents.find((event) => event.id === selectedEventId) || resultEvents[0];
  }, [resultEvents, selectedEventId]);

  const locked = isEventLocked(selectedEvent);

  const handleWinnerChange = (fight, fighter) => {
    updateFightResult(selectedEvent.id, fight.id, {
      winnerId: fighter.id,
      winnerName: fighter.name,
      method: fight.result?.method ?? null,
      round: fight.result?.round ?? null,
    });

    showToast({
      title: "Winner updated",
      description: `${fighter.name} set as the official winner.`,
      variant: "success",
    });
  };

  const handleMethodChange = (fight, method) => {
    updateFightResult(selectedEvent.id, fight.id, {
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
    updateFightResult(selectedEvent.id, fight.id, {
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
    clearFightResult(selectedEvent.id, fight.id);

    showToast({
      title: "Result cleared",
      description: `${fight.left.name} vs ${fight.right.name} has no official result now.`,
      variant: "danger",
    });
  };

  const handleStatusChange = (status) => {
    updateEventStatus(selectedEvent.id, status);

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

        <CardContent>
          <div className="flex flex-wrap gap-3">
            {resultEvents.map((event) => {
              const active = event.id === selectedEventId;

              return (
                <Button
                  key={event.id}
                  variant={active ? "default" : "outline"}
                  className={
                    active
                      ? "rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                      : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                  }
                  onClick={() => setSelectedEventId(event.id)}
                >
                  {event.name}
                </Button>
              );
            })}
          </div>
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
                  <p className="mb-3 text-sm font-medium text-white">Winner</p>
                  <div className="flex flex-wrap gap-3">
                    {[fight.left, fight.right].map((fighter) => {
                      const active = officialResult?.winnerId === fighter.id;

                      return (
                        <Button
                          key={fighter.id}
                          variant={active ? "default" : "outline"}
                          className={
                            active
                              ? "rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                              : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                          }
                          onClick={() => handleWinnerChange(fight, fighter)}
                        >
                          {fighter.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-medium text-white">Method</p>
                  <div className="flex flex-wrap gap-3">
                    {methodOptions.map((method) => {
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
                      {officialResult.winnerName || "Winner not set"}
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