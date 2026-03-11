import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FighterChip from "../fighters/FighterChip";
import { calculatePickPoints, isPickCorrect } from "../../utils/scoring";

const MatchupRow = ({
  fight,
  selectedWinnerId,
  currentPick,
  onPick,
  onRemovePick,
  onFighterOpen,
  onCompare,
  isLocked = false,
}) => {
  const leftSelected = selectedWinnerId === fight.left.id;
  const rightSelected = selectedWinnerId === fight.right.id;
  const officialResult = fight.result || null;
  const pickedCorrectly =
    currentPick && officialResult ? isPickCorrect(currentPick, officialResult) : null;
  const earnedPoints =
    currentPick && officialResult ? calculatePickPoints(currentPick, officialResult) : 0;

  const yourPickPanelClass =
    currentPick && officialResult
      ? pickedCorrectly
        ? "border-emerald-500/20 bg-emerald-500/10"
        : "border-[#d20a11]/20 bg-[#d20a11]/10"
      : currentPick
        ? "border-amber-500/20 bg-amber-500/10"
        : "border-[#d20a11]/20 bg-[#d20a11]/10";

  const yourPickLabelClass =
    currentPick && officialResult
      ? pickedCorrectly
        ? "text-emerald-200"
        : "text-red-200"
      : currentPick
        ? "text-amber-200"
        : "text-red-200";

  const yourPickPointsBadgeClass =
    pickedCorrectly
      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : "border border-white/10 bg-white/5 text-white";

  const officialResultPanelClass =
    currentPick
      ? pickedCorrectly
        ? "border-emerald-500/20 bg-emerald-500/10"
        : "border-white/10 bg-white/[0.03]"
      : "border-white/10 bg-white/[0.03]";

  const officialResultBadgeClass =
    currentPick && pickedCorrectly
      ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : "border border-white/10 bg-white/5 text-white";

  return (
    <Card className="overflow-hidden border-white/10 bg-zinc-950/90 text-white">
      <div className="h-1 w-full bg-[linear-gradient(90deg,rgba(210,10,17,0.9),rgba(255,255,255,0.15),rgba(210,10,17,0.5))]" />
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200 hover:bg-[#d20a11]/15">
              {fight.slotLabel}
            </Badge>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              {fight.weightClass}
            </p>
          </div>

          <Button
            variant="ghost"
            className="text-slate-300 hover:bg-white/5 hover:text-white"
            onClick={onCompare}
          >
            Compare
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="space-y-3">
            <FighterChip
              fighter={fight.left}
              onOpen={onFighterOpen}
              selected={leftSelected}
            />
            <Button
              onClick={() => onPick(fight.id, fight.left.id)}
              disabled={isLocked}
              className={`w-full rounded-full ${
                leftSelected
                  ? "bg-[#d20a11] hover:bg-[#b2080e]"
                  : "bg-white/10 text-white hover:bg-white/15"
              } ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {isLocked
                ? "Locked"
                : leftSelected
                  ? "Edit pick"
                  : `Pick ${fight.left.name.split(" ")[0]}`}
            </Button>
          </div>

          <div className="text-center">
            <div className="mb-2 inline-flex items-center rounded-full border border-[#d20a11]/40 bg-[#d20a11]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-red-200">
              VS
            </div>
            <p className="text-xs text-slate-500">Winner: 3 pts</p>
            <p className="text-xs text-slate-500">Method: +2 pts</p>
            <p className="text-xs text-slate-500">Round: +1 pt</p>
          </div>

          <div className="space-y-3">
            <FighterChip
              fighter={fight.right}
              aligned="right"
              onOpen={onFighterOpen}
              selected={rightSelected}
            />
            <Button
              onClick={() => onPick(fight.id, fight.right.id)}
              disabled={isLocked}
              className={`w-full rounded-full ${
                rightSelected
                  ? "bg-[#d20a11] hover:bg-[#b2080e]"
                  : "bg-white/10 text-white hover:bg-white/15"
              } ${isLocked ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {isLocked
                ? "Locked"
                : rightSelected
                  ? "Edit pick"
                  : `Pick ${fight.right.name.split(" ")[0]}`}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reach</p>
            <p>
              {fight.left.reach} / {fight.right.reach}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Stance</p>
            <p>
              {fight.left.stance} / {fight.right.stance}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Sig. Strikes
            </p>
            <p>
              {fight.left.sigStrikes} / {fight.right.sigStrikes}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Takedowns
            </p>
            <p>
              {fight.left.takedowns} / {fight.right.takedowns}
            </p>
          </div>
        </div>

        {currentPick || officialResult ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {currentPick ? (
              <div className={`rounded-2xl border p-4 ${yourPickPanelClass}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-xs font-semibold uppercase tracking-[0.2em] ${yourPickLabelClass}`}
                    >
                      Your pick
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {currentPick.selection}
                    </p>
                  </div>

                  {officialResult ? (
                    <Badge className={yourPickPointsBadgeClass}>
                      {pickedCorrectly ? `+${earnedPoints} pts` : "0 pts"}
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-slate-300">
                  {currentPick.predictedMethod || currentPick.predictedRound
                    ? [
                        currentPick.predictedMethod,
                        currentPick.predictedRound
                          ? `Round ${currentPick.predictedRound}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")
                    : "Winner only"}
                </p>

                {officialResult ? (
                  <p
                    className={`mt-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                      pickedCorrectly ? "text-emerald-200" : "text-slate-300"
                    }`}
                  >
                    {pickedCorrectly ? "Correct pick" : "Did not land"}
                  </p>
                ) : (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    Awaiting official result
                  </p>
                )}
              </div>
            ) : null}

            {officialResult ? (
              <div className={`rounded-2xl border p-4 ${officialResultPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Official result
                </p>
                <p className="mt-1 text-base font-semibold text-white">
                  {officialResult.winnerName}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {[
                    officialResult.method,
                    officialResult.round ? `Round ${officialResult.round}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>

                {isLocked ? (
                  <div className="mt-3">
                    <Badge className={officialResultBadgeClass}>Result final</Badge>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {currentPick ? (
          <div className="mt-3 flex justify-end">
            {isLocked ? (
              <Badge className="border border-white/10 bg-white/5 text-white">
                Locked card
              </Badge>
            ) : (
              <Button
                variant="ghost"
                className="rounded-full text-slate-200 hover:bg-white/5 hover:text-white"
                onClick={onRemovePick}
              >
                Unpick
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default MatchupRow;