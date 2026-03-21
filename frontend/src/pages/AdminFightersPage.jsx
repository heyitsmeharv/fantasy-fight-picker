import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileSpreadsheet } from "lucide-react";
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
  importFighters,
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

const csvHeaders = [
  "fighterId",
  "slug",
  "name",
  "nickname",
  "record",
  "rank",
  "reach",
  "stance",
  "sigStrikes",
  "takedowns",
  "imageUrl",
  "displayWeightClass",
  "aliases",
];

const normalizeSearch = (value) => String(value || "").toLowerCase().trim();

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const parseCsv = (text) => {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows
    .map((entry) => entry.map((cell) => String(cell || "").trim()))
    .filter((entry) => entry.some((cell) => cell !== ""));
};

const toObjectsFromCsv = (text) => {
  const parsed = parseCsv(text);

  if (!parsed.length) {
    return [];
  }

  const headers = parsed[0].map((header) => header.trim());
  const dataRows = parsed.slice(1);

  return dataRows.map((cells) => {
    const row = {};

    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });

    return row;
  });
};

const buildPreviewRows = (rows, existingFighters) => {
  const byId = new Map(existingFighters.map((fighter) => [fighter.fighterId, fighter]));
  const bySlug = new Map(
    existingFighters
      .filter((fighter) => fighter.slug)
      .map((fighter) => [fighter.slug, fighter])
  );

  return rows.map((row, index) => {
    const fighterId = String(row?.fighterId || "").trim();
    const slug = slugify(row?.slug || row?.name || "");
    const matched = (fighterId && byId.get(fighterId)) || (slug && bySlug.get(slug)) || null;

    return {
      rowNumber: index + 2,
      action: matched ? "update" : "create",
      fighterId: matched?.fighterId || fighterId || slug,
      name: row?.name || "",
      displayWeightClass: row?.displayWeightClass || "Roster",
      rank: row?.rank || "Unranked",
      raw: row,
    };
  });
};

const AdminFightersPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedFighterId, setSelectedFighterId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [csvRows, setCsvRows] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvError, setCsvError] = useState("");

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
      // imageUrl: selectedFighter.imageUrl || "",
      imageUrl: "",
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

  const handleCsvFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const rows = toObjectsFromCsv(text);

      if (!rows.length) {
        setCsvRows([]);
        setCsvPreview([]);
        setCsvError("The file looks empty.");
        return;
      }

      const hasNameHeader = Object.prototype.hasOwnProperty.call(rows[0], "name");

      if (!hasNameHeader) {
        setCsvRows([]);
        setCsvPreview([]);
        setCsvError(`CSV must include at least: ${csvHeaders.join(", ")}`);
        return;
      }

      const preview = buildPreviewRows(rows, fighters);

      setCsvFileName(file.name);
      setCsvRows(rows);
      setCsvPreview(preview);
      setCsvError("");
    } catch (error) {
      console.error("CSV parse error", error);
      setCsvRows([]);
      setCsvPreview([]);
      setCsvError("Could not parse that CSV file.");
    }
  };

  const handleImport = async () => {
    if (!csvRows.length) {
      return;
    }

    try {
      setImporting(true);

      const result = await importFighters(csvRows);
      const refreshed = await fetchFighters();

      setFighters(refreshed);
      setCsvRows([]);
      setCsvPreview([]);
      setCsvFileName("");
      setCsvError("");

      showToast({
        title: "Fighters imported",
        description: `${result.created} created, ${result.updated} updated.`,
        variant: "success",
      });
    } catch (error) {
      console.error("CSV import error", error);
      showToast({
        title: "Could not import fighters",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setImporting(false);
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
            Open public fighters page
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
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-5 w-5 text-[#d20a11]" />
            CSV upload
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">Expected headers</p>
            <p className="mt-2 break-words text-slate-400">
              {csvHeaders.join(", ")}
            </p>
            <p className="mt-3 text-slate-400">
              Use <span className="text-white">aliases</span> as a pipe-separated field, for
              example: <span className="text-white">The Eagle|Dagestani King</span>
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFile}
              className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[#d20a11] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#b2080e]"
            />

            <Button
              className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleImport}
              disabled={!csvRows.length || importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Importing..." : "Import fighters"}
            </Button>
          </div>

          {csvFileName ? (
            <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
              Previewing {csvFileName}
            </Badge>
          ) : null}

          {csvError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {csvError}
            </div>
          ) : null}

          {csvPreview.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
              <table className="min-w-full text-sm">
                <thead className="border-b border-white/10 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left">Row</th>
                    <th className="px-4 py-3 text-left">Action</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Weight class</th>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Resolved ID</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((row) => (
                    <tr key={`${row.rowNumber}-${row.fighterId}`} className="border-b border-white/5">
                      <td className="px-4 py-3 text-slate-300">{row.rowNumber}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            row.action === "update"
                              ? "border border-amber-500/20 bg-amber-500/10 text-amber-200"
                              : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                          }
                        >
                          {row.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white">{row.name}</td>
                      <td className="px-4 py-3 text-slate-300">{row.displayWeightClass}</td>
                      <td className="px-4 py-3 text-slate-300">{row.rank}</td>
                      <td className="px-4 py-3 text-slate-400">{row.fighterId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

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