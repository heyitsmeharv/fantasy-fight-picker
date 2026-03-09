import { CalendarDays, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEventStatusLabel, isEventLocked } from "../../utils/event";

const EventCard = ({ event, onOpen }) => {
  const fightCount = Array.isArray(event.fights) ? event.fights.length : event.fights;
  const locked = isEventLocked(event);

  return (
    <Card className="border-white/10 bg-zinc-950/90 text-white backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.04em]">
              {event.name}
            </p>
            <p className="text-sm text-slate-400">{event.location}</p>
          </div>

          <Badge
            className={
              locked
                ? "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200 hover:bg-[#d20a11]/15"
                : "border border-emerald-500/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15"
            }
          >
            {getEventStatusLabel(event)}
          </Badge>
        </div>

        <p className="mb-4 text-sm text-slate-300">{event.tagline}</p>

        <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#d20a11]" />
            <span>{event.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#d20a11]" />
            <span>Locks {event.lockTime}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Fight card
            </p>
            <p className="text-base font-medium">{fightCount} fights available</p>
          </div>

          <Button
            onClick={onOpen}
            className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
          >
            {locked ? "View card" : "Make picks"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;