import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const methodOptions = ["Decision", "KO/TKO", "Submission"];

const PickDetailsModal = ({
  isOpen,
  fight,
  fighter,
  initialMethod = null,
  initialRound = null,
  onClose,
  onSave,
}) => {
  const [predictedMethod, setPredictedMethod] = useState(initialMethod);
  const [predictedRound, setPredictedRound] = useState(initialRound);

  const maxRounds = useMemo(() => {
    if (!fight) {
      return 3;
    }

    return fight.slotLabel === "Main Event" ? 5 : 3;
  }, [fight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPredictedMethod(initialMethod ?? null);
    setPredictedRound(initialRound ?? null);
  }, [isOpen, initialMethod, initialRound, fight?.id, fighter?.id]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!fight || !fighter) {
    return null;
  }

  const handleMethodClick = (method) => {
    const nextMethod = predictedMethod === method ? null : method;
    setPredictedMethod(nextMethod);

    onSave({
      predictedMethod: nextMethod,
      predictedRound,
    });
  };

  const handleRoundClick = (round) => {
    const nextRound = predictedRound === round ? null : round;
    setPredictedRound(nextRound);

    onSave({
      predictedMethod,
      predictedRound: nextRound,
    });
  };

  const handleClear = () => {
    setPredictedMethod(null);
    setPredictedRound(null);

    onSave({
      predictedMethod: null,
      predictedRound: null,
    });
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <div className="absolute inset-0 flex items-end md:items-stretch md:justify-end">
            <motion.div
              key={`${fight.id}-${fighter.id}`}
              initial={{ opacity: 0, y: 48, x: 32 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 48, x: 32 }}
              transition={{ duration: 0.2 }}
              className="w-full md:h-full md:max-w-xl"
            >
              <Card className="h-[85vh] rounded-t-[28px] border-white/10 bg-zinc-950/95 text-white shadow-2xl md:h-full md:rounded-none md:rounded-l-[28px]">
                <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/15 md:hidden" />

                <CardHeader className="border-b border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge className="border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200">
                        Add bonus picks
                      </Badge>
                      <CardTitle className="mt-3 text-2xl uppercase tracking-[0.04em]">
                        {fighter.name}
                      </CardTitle>
                      <p className="mt-2 text-sm text-slate-400">
                        {fight.left.name} vs {fight.right.name} • {fight.weightClass}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      className="text-slate-300 hover:bg-white/5 hover:text-white"
                      onClick={onClose}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex h-[calc(85vh-92px)] flex-col gap-6 overflow-y-auto p-6 md:h-[calc(100vh-89px)]">
                  <div>
                    <p className="mb-3 text-sm font-medium text-white">Pick method</p>
                    <div className="flex flex-wrap gap-3">
                      {methodOptions.map((method) => {
                        const active = predictedMethod === method;

                        return (
                          <Button
                            key={method}
                            variant={active ? "default" : "outline"}
                            className={
                              active
                                ? "rounded-full border border-[#d20a11] bg-[#d20a11] text-white shadow-[0_0_0_1px_rgba(210,10,17,0.35)] hover:bg-[#b2080e]"
                                : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                            }
                            onClick={() => handleMethodClick(method)}
                          >
                            {method}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-medium text-white">Pick round</p>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({ length: maxRounds }, (_, index) => index + 1).map(
                        (round) => {
                          const active = predictedRound === round;

                          return (
                            <Button
                              key={round}
                              variant={active ? "default" : "outline"}
                              className={
                                active
                                  ? "rounded-full border border-[#d20a11] bg-[#d20a11] text-white shadow-[0_0_0_1px_rgba(210,10,17,0.35)] hover:bg-[#b2080e]"
                                  : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                              }
                              onClick={() => handleRoundClick(round)}
                            >
                              Round {round}
                            </Button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Bonus scoring</p>
                    <p className="mt-2 text-slate-400">
                      Correct winner = 3 pts • Correct method = +2 pts • Correct round = +1 pt
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      className="rounded-full text-slate-300 hover:bg-white/5 hover:text-white"
                      onClick={handleClear}
                    >
                      Clear bonus picks
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                      onClick={onClose}
                    >
                      Done
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};

export default PickDetailsModal;