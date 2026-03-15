import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SectionHeading from "../components/common/SectionHeading";
import { useToast } from "../context/ToastContext";
import {
  createFighter,
  deleteFighter,
  fetchFighters,
  updateFighter,
} from "../api/fighters";

const emptyForm = {
  name: "",
  slug: "",
  nickname: "",
  record: "",
  rank: "Unranked",
  reach: "",
  stance: "",
  sigStrikes: "",
  takedowns: "",
  imageUrl: "",
  displayWeightClass: "Roster",
};

const normalizeSearch = (value) => String(value || "").toLowerCase().trim();

const AdminFightersPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFighterId, setSelectedFighterId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchFighters();

        if (!cancelled) {
          setFighters(data || []);
          setSelectedFighterId((current) => current || data?.[0]?.id || "");
        }
      } catch (error) {
        console.error("AdminFightersPage load error", error);

        if (!cancelled) {
          showToast({
            title: "Could not load fighters",
            description: error.message,
            variant: "danger",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const filteredFighters = useMemo(() => {
    const query = normalizeSearch(search);

    if (!query) {
      return fighters;
    }

    return fighters.filter((fighter) => {
      return [
        fighter.name,
        fighter.nickname,
        fighter.rank,
        fighter.displayWeightClass,
        fighter.record,
      ]
        .filter(Boolean)
        .some((value) => normalizeSearch(value).includes(query));
    });
  }, [fighters, search]);

  const selectedFighter = useMemo(() => {
    return fighters.find((fighter) => fighter.id === selectedFighterId) || null;
  }, [fighters, selectedFighterId]);

  useEffect(() => {
    if (!selectedFighterId || !selectedFighter) {
      return;
    }

    setForm({
      name: selectedFighter.name || "",
      slug: selectedFighter.slug || "",
      nickname: selectedFighter.nickname || "",
      record: selectedFighter.record || "",
      rank: selectedFighter.rank || "Unranked",
      reach: selectedFighter.reach || "",
      stance: selectedFighter.stance || "",
      sigStrikes: selectedFighter.sigStrikes || "",
      takedowns: selectedFighter.takedowns || "",
      imageUrl: selectedFighter.imageUrl || "",
      displayWeightClass: selectedFighter.displayWeightClass || "Roster",
    });
  }, [selectedFighter, selectedFighterId]);

  const handleNewFighter = () => {
    setSelectedFighterId("");
    setForm(emptyForm);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      showToast({
        title: "Missing fighter name",
        description: "Add a fighter name before saving.",
        variant: "danger",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
      };

      const savedFighter = selectedFighterId
        ? await updateFighter(selectedFighterId, payload)
        : await createFighter(payload);

      setFighters((current) => {
        const exists = current.some((fighter) => fighter.id === savedFighter.id);

        if (!exists) {
          return [...current, savedFighter].sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""))
          );
        }

        return current
          .map((fighter) => (fighter.id === savedFighter.id ? savedFighter : fighter))
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
      });

      setSelectedFighterId(savedFighter.id);

      showToast({
        title: selectedFighterId ? "Fighter updated" : "Fighter created",
        description: `${savedFighter.name} is ready to use on cards.`,
        variant: "success",
      });
    } catch (error) {
      console.error("AdminFightersPage save error", error);
      showToast({
        title: "Could not save fighter",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFighter) {
      return;
    }

    try {
      setDeleting(true);
      await deleteFighter(selectedFighter.id);

      const remaining = fighters.filter((fighter) => fighter.id !== selectedFighter.id);

      setFighters(remaining);
      setSelectedFighterId(remaining[0]?.id || "");
      setDeleteOpen(false);

      if (!remaining.length) {
        setForm(emptyForm);
      }

      showToast({
        title: "Fighter deleted",
        description: `${selectedFighter.name} has been removed.`,
        variant: "success",
      });
    } catch (error) {
      console.error("AdminFightersPage delete error", error);
      showToast({
        title: "Could not delete fighter",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Loading fighter manager...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Admin" title="Fighter manager" />

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
            onClick={() => navigate("/fighters")}
          >
            Open fighters page
          </Button>

          {selectedFighterId ? (
            <Button
              variant="outline"
              className="rounded-full border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
              onClick={() => setDeleteOpen(true)}
            >
              Delete fighter
            </Button>
          ) : null}

          <Button
            className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={handleNewFighter}
          >
            New fighter
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Search fighters</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
            placeholder="Search by name, nickname, weight class or rank"
          />

          <div className="flex flex-wrap gap-3">
            {filteredFighters.map((fighter) => {
              const active = fighter.id === selectedFighterId;

              return (
                <Button
                  key={fighter.id}
                  variant={active ? "default" : "outline"}
                  className={
                    active
                      ? "rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                      : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                  }
                  onClick={() => setSelectedFighterId(fighter.id)}
                >
                  {fighter.name}
                </Button>
              );
            })}
          </div>

          {!filteredFighters.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              No fighters match that search.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">
            {selectedFighterId ? "Edit fighter" : "Create fighter"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Islam Makhachev"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="islam-makhachev"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Nickname</label>
              <input
                type="text"
                value={form.nickname}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nickname: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="The Eagle"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Record</label>
              <input
                type="text"
                value={form.record}
                onChange={(event) =>
                  setForm((current) => ({ ...current, record: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="26-1-0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Rank</label>
              <input
                type="text"
                value={form.rank}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rank: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Champion or #1"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Weight class
              </label>
              <input
                type="text"
                value={form.displayWeightClass}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    displayWeightClass: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Lightweight"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Reach</label>
              <input
                type="text"
                value={form.reach}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reach: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder='70"'
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Stance</label>
              <input
                type="text"
                value={form.stance}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stance: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Orthodox"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">
                Sig. strikes
              </label>
              <input
                type="text"
                value={form.sigStrikes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sigStrikes: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="3.42"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Takedowns</label>
              <input
                type="text"
                value={form.takedowns}
                onChange={(event) =>
                  setForm((current) => ({ ...current, takedowns: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="2.31"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-white">Image URL</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, imageUrl: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e] disabled:opacity-70"
              >
                {saving ? "Saving..." : selectedFighterId ? "Save fighter" : "Create fighter"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">
              Delete fighter?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {selectedFighter ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-white">{selectedFighter.name}</span>.
                  Deletion is blocked if they appear on an upcoming card.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete fighter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFightersPage;