import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Flame,
  FlameKindling,
  Shield,
  TimerReset,
  Lock,
  Unlock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import FightSection from "../components/events/FightSection";
import PickDetailsModal from "../components/events/PickDetailsModal";
import { usePicks } from "../context/PicksContext";
import { useToast } from "../context/ToastContext";
import { useResults } from "../context/ResultsContext";
import { getEventStatusLabel, isEventLocked } from "../utils/event";

const EventPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { events } = useResults();

  const event = useMemo(() => {
    return events.find((entry) => entry.id === eventId) || events[0];
  }, [eventId, events]);

  const locked = isEventLocked(event);

  const statusStamp = locked
    ? {
      icon: Lock,
      title: "Locked",
      description: "Results are live and picks are now read-only.",
      className: "border-[#d20a11]/20 bg-[#d20a11]/10 text-white",
      iconClassName: "text-[#d20a11]",
    }
    : {
      icon: Unlock,
      title: "Open",
      description: "You can still make and edit picks before lock.",
      className: "border-emerald-500/20 bg-emerald-500/10 text-white",
      iconClassName: "text-emerald-400",
    };

  const StatusStampIcon = statusStamp.icon;

  const {
    getEventCard,
    getEventPickMap,
    savePick,
    removePick,
    updatePickDetails,
  } = usePicks();

  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    fight: null,
    fighter: null,
  });

  if (!event || !Array.isArray(event.fights)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-8 text-white">
        <p className="text-2xl font-semibold">This card is not mocked yet.</p>
        <p className="mt-2 text-slate-400">
          Add the fight array to the mock data and this page will render fully.
        </p>
      </div>
    );
  }

  const eventCard = getEventCard(event.id);
  const picks = getEventPickMap(event.id);
  const selectedCount = eventCard?.selectedCount ?? 0;
  const progressValue = Math.round((selectedCount / event.fights.length) * 100);
  const mainCard = event.fights.filter((fight) => fight.cardType === "main");
  const prelims = event.fights.filter((fight) => fight.cardType === "prelim");

  const openFighter = (fighter) => navigate(`/fighters/${fighter.id}`);
  const openCompare = (fight) => navigate(`/compare/${fight.id}`);

  const formatDateTimeDisplay = (value) => {
    if (!value) {
      return "TBC";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(parsed);
  };

  const handlePick = (fightId, fighterId) => {
    if (locked) {
      showToast({
        title: "Card locked",
        description: "This event is now read-only.",
        variant: "danger",
      });
      return;
    }

    const fight = event.fights.find((entry) => entry.id === fightId);

    if (!fight) {
      return;
    }

    const fighter = [fight.left, fight.right].find((entry) => entry.id === fighterId);

    if (!fighter) {
      return;
    }

    const isSameSelection = picks[fightId] === fighterId;

    if (isSameSelection) {
      setDetailsModal({
        isOpen: true,
        fight,
        fighter,
      });

      showToast({
        title: "Editing pick",
        description: `Update bonus picks for ${fighter.name}.`,
      });

      return;
    }

    savePick(event, fight, fighter);

    setDetailsModal({
      isOpen: true,
      fight,
      fighter,
    });

    showToast({
      title: "Winner picked",
      description: `${fighter.name} selected for ${fight.left.name} vs ${fight.right.name}.`,
      variant: "success",
    });
  };

  const handleCloseDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      fight: null,
      fighter: null,
    });
  };

  const handleSaveDetails = ({ predictedMethod, predictedRound }) => {
    if (!detailsModal.fight) {
      return;
    }

    updatePickDetails(event.id, detailsModal.fight.id, {
      predictedMethod,
      predictedRound,
    });
  };

  const handleRemovePick = (fightId) => {
    if (locked) {
      showToast({
        title: "Card locked",
        description: "Locked picks can’t be removed.",
        variant: "danger",
      });
      return;
    }

    removePick(event.id, fightId);

    if (detailsModal.fight?.id === fightId) {
      handleCloseDetailsModal();
    }

    showToast({
      title: "Pick removed",
      description: "That fight is no longer selected.",
      variant: "danger",
    });
  };

  const getCurrentPick = (fightId) => {
    return eventCard?.picks.find((pick) => pick.fightId === fightId) || null;
  };

  const activeModalPick =
    eventCard?.picks.find((pick) => pick.fightId === detailsModal.fight?.id) || null;

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(10,10,10,1),rgba(3,4,6,1))] text-white">
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <Badge
                    className={
                      locked
                        ? "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200 hover:bg-[#d20a11]/15"
                        : "border border-emerald-500/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15"
                    }
                  >
                    {getEventStatusLabel(event)}
                  </Badge>
                  <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                    {event.venue}
                  </Badge>
                </div>

                <h1 className="text-3xl font-bold uppercase md:text-5xl">{event.name}</h1>
                <p className="mt-3 text-slate-300">
                  {event.location} • {event.date}
                </p>

                <div
                  className={`mt-5 inline-flex max-w-xl items-start gap-3 rounded-2xl border px-4 py-3 ${statusStamp.className}`}
                >
                  <div className="mt-0.5 rounded-full border border-white/10 bg-black/20 p-2">
                    <StatusStampIcon className={`h-4 w-4 ${statusStamp.iconClassName}`} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                      {statusStamp.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {statusStamp.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Main card
                    </p>
                    <p className="mt-1 font-semibold text-white">{mainCard.length} fights</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Prelims
                    </p>
                    <p className="mt-1 font-semibold text-white">{prelims.length} fights</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Lock time
                    </p>
                    <p className="mt-1 font-semibold text-white">{formatDateTimeDisplay(event.lockTime)}</p>
                  </div>
                </div>
              </div>

              <div className="self-start rounded-[20px] border border-white/10 bg-black/30 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                      Pick progress
                    </p>
                    <p className="mt-2 text-3xl font-semibold text-white">
                      {selectedCount}/{event.fights.length}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {progressValue}%
                  </div>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Choose a winner for every fight to complete your card.
                </p>

                <Progress value={progressValue} className="mt-5 h-2 bg-white/10" />

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-white">
                      <Flame className="h-4 w-4 text-[#d20a11]" />
                      <p className="text-sm font-medium">Winner points</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">3 points per correct pick</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-white">
                      <TimerReset className="h-4 w-4 text-[#d20a11]" />
                      <p className="text-sm font-medium">Method bonus</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">+2 method, +1 round</p>
                  </div>
                </div>

                <Button
                  className="mt-5 w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                  disabled
                >
                  {locked
                    ? "Card locked"
                    : selectedCount === 0
                      ? "Choose your picks"
                      : "Picks saved locally"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {locked ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
          This event is locked, so picks are now read-only.
        </div>
      ) : null}

      <FightSection
        title="Main card"
        icon={<Flame className="h-4 w-4 text-[#d20a11]" />}
        fights={mainCard}
        picks={picks}
        onPick={handlePick}
        onOpenFighter={openFighter}
        onOpenCompare={openCompare}
        getCurrentPick={getCurrentPick}
        onRemovePick={handleRemovePick}
        isLocked={locked}
      />

      <FightSection
        title="Prelims"
        icon={<FlameKindling className="h-4 w-4 text-orange-400" />}
        fights={prelims}
        picks={picks}
        onPick={handlePick}
        onOpenFighter={openFighter}
        onOpenCompare={openCompare}
        getCurrentPick={getCurrentPick}
        onRemovePick={handleRemovePick}
        isLocked={locked}
      />

      <PickDetailsModal
        isOpen={detailsModal.isOpen}
        fight={detailsModal.fight}
        fighter={detailsModal.fighter}
        initialMethod={activeModalPick?.predictedMethod ?? null}
        initialRound={activeModalPick?.predictedRound ?? null}
        onClose={handleCloseDetailsModal}
        onSave={handleSaveDetails}
      />
    </div>
  );
};

export default EventPage;