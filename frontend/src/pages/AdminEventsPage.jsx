import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical } from "lucide-react";
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
import { fetchFighters } from "../api/fighters";
import {
  createEvent,
  createFight,
  deleteEvent,
  deleteFight,
  fetchAllEventsWithDetails,
  reorderEventFights,
  updateEvent,
} from "../api/results";

const emptyEventForm = {
  name: "",
  slug: "",
  tagline: "",
  date: "",
  lockTime: "",
  venue: "",
  location: "",
  status: "open",
};

const emptyFightForm = {
  leftFighterId: "",
  rightFighterId: "",
  weightClass: "",
  slotLabel: "Main Card",
  cardType: "main",
  order: "",
};

const selectClass =
  "h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-11 text-sm font-medium text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const getEventKey = (event) => String(event?.id || event?.eventId || "");
const getFightKey = (fight) => String(fight?.id || fight?.fightId || "");
const getFighterKey = (fighter) => String(fighter?.id || fighter?.fighterId || "");

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

const toLocalInputValue = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offsetMs = parsed.getTimezoneOffset() * 60 * 1000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoOrNull = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const sortFights = (fights = []) => {
  return [...fights].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return getFightKey(a).localeCompare(getFightKey(b));
  });
};

const reindexFights = (fights = []) =>
  fights.map((fight, index) => ({
    ...fight,
    order: index + 1,
  }));

const upsertEventInList = (events, nextEvent) => {
  const nextEventKey = getEventKey(nextEvent);
  const existing = events.some((event) => getEventKey(event) === nextEventKey);

  if (!existing) {
    return [...events, nextEvent];
  }

  return events.map((event) =>
    getEventKey(event) === nextEventKey ? nextEvent : event
  );
};

const SortableFightRow = ({ fight, onRemove, disabled = false }) => {
  const fightKey = getFightKey(fight);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fightKey,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between ${
        isDragging ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Drag to reorder fight"
          {...attributes}
          {...listeners}
          disabled={disabled}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div>
          <p className="text-lg font-semibold text-white">
            {fight.left?.name} vs {fight.right?.name}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {[
              fight.weightClass,
              fight.slotLabel,
              fight.cardType === "prelim" ? "Prelim" : "Main card",
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
          Order {fight.order ?? "TBC"}
        </Badge>

        <Button
          variant="ghost"
          className="rounded-full text-slate-200 hover:bg-white/5 hover:text-white"
          onClick={() => onRemove(fight)}
          disabled={disabled}
        >
          Remove
        </Button>
      </div>
    </div>
  );
};

const AdminEventsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [events, setEvents] = useState([]);
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingEvent, setSavingEvent] = useState(false);
  const [addingFight, setAddingFight] = useState(false);
  const [reorderingFights, setReorderingFights] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [fightForm, setFightForm] = useState(emptyFightForm);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [deleteFightOpen, setDeleteFightOpen] = useState(false);
  const [deletingFight, setDeletingFight] = useState(false);
  const [fightToDelete, setFightToDelete] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        const [eventsResponse, fightersResponse] = await Promise.all([
          fetchAllEventsWithDetails(),
          fetchFighters(),
        ]);

        if (cancelled) {
          return;
        }

        setEvents(eventsResponse || []);
        setFighters(fightersResponse || []);
        setSelectedEventId((current) => current || getEventKey(eventsResponse?.[0]) || "");
      } catch (error) {
        console.error("AdminEventsPage load error", error);

        if (!cancelled) {
          showToast({
            title: "Could not load admin data",
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

  const selectedEvent = useMemo(() => {
    return events.find((event) => getEventKey(event) === selectedEventId) || null;
  }, [events, selectedEventId]);

  useEffect(() => {
    if (!selectedEventId || !selectedEvent) {
      return;
    }

    setEventForm({
      name: selectedEvent.name || "",
      slug: selectedEvent.slug || "",
      tagline: selectedEvent.tagline || "",
      date: toLocalInputValue(selectedEvent.date),
      lockTime: toLocalInputValue(selectedEvent.lockTime),
      venue: selectedEvent.venue || "",
      location: selectedEvent.location || "",
      status: selectedEvent.status || "open",
    });
  }, [selectedEvent, selectedEventId]);

  const selectedEventFights = useMemo(() => {
    return sortFights(selectedEvent?.fights || []);
  }, [selectedEvent]);

  const handleStartNewEvent = () => {
    setSelectedEventId("");
    setEventForm(emptyEventForm);
    setFightForm(emptyFightForm);
  };

  const handleSaveEvent = async (event) => {
    event.preventDefault();

    if (!eventForm.name.trim()) {
      showToast({
        title: "Missing event name",
        description: "Give the card a name before saving it.",
        variant: "danger",
      });
      return;
    }

    try {
      setSavingEvent(true);

      const payload = {
        ...eventForm,
        date: toIsoOrNull(eventForm.date),
        lockTime: toIsoOrNull(eventForm.lockTime),
      };

      const savedEvent = selectedEventId
        ? await updateEvent(selectedEventId, payload)
        : await createEvent(payload);

      const normalizedEvent = {
        ...savedEvent,
        fights: selectedEvent?.fights || [],
      };

      setEvents((current) => upsertEventInList(current, normalizedEvent));
      setSelectedEventId(getEventKey(savedEvent));

      showToast({
        title: selectedEventId ? "Event updated" : "Event created",
        description: `${savedEvent.name} is ready to manage.`,
        variant: "success",
      });
    } catch (error) {
      console.error("AdminEventsPage save event error", error);
      showToast({
        title: "Could not save event",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleAddFight = async (event) => {
    event.preventDefault();

    if (!selectedEventId) {
      showToast({
        title: "Create the event first",
        description: "Save the event before adding fights.",
        variant: "danger",
      });
      return;
    }

    if (!fightForm.leftFighterId || !fightForm.rightFighterId) {
      showToast({
        title: "Choose both fighters",
        description: "Every fight needs two fighters.",
        variant: "danger",
      });
      return;
    }

    if (fightForm.leftFighterId === fightForm.rightFighterId) {
      showToast({
        title: "Invalid matchup",
        description: "A fighter cannot be matched with themselves.",
        variant: "danger",
      });
      return;
    }

    try {
      setAddingFight(true);

      const createdFight = await createFight(selectedEventId, {
        ...fightForm,
        order: fightForm.order === "" ? null : Number(fightForm.order),
      });

      setEvents((current) =>
        current.map((entry) => {
          if (getEventKey(entry) !== selectedEventId) {
            return entry;
          }

          return {
            ...entry,
            fights: sortFights([...(entry.fights || []), createdFight]),
          };
        })
      );

      setFightForm((current) => ({
        ...emptyFightForm,
        cardType: current.cardType,
        slotLabel: current.cardType === "prelim" ? "Prelim" : "Main Card",
      }));

      showToast({
        title: "Fight added",
        description: "The matchup is now on the card.",
        variant: "success",
      });
    } catch (error) {
      console.error("AdminEventsPage add fight error", error);
      showToast({
        title: "Could not add fight",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setAddingFight(false);
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    if (!selectedEventId || !active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const oldIndex = selectedEventFights.findIndex(
      (fight) => getFightKey(fight) === String(active.id)
    );
    const newIndex = selectedEventFights.findIndex(
      (fight) => getFightKey(fight) === String(over.id)
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousFights = selectedEventFights;
    const reordered = reindexFights(arrayMove(previousFights, oldIndex, newIndex));

    setEvents((current) =>
      current.map((entry) => {
        if (getEventKey(entry) !== selectedEventId) {
          return entry;
        }

        return {
          ...entry,
          fights: reordered,
        };
      })
    );

    try {
      setReorderingFights(true);
      await reorderEventFights(
        selectedEventId,
        reordered.map((fight) => getFightKey(fight))
      );
    } catch (error) {
      console.error("AdminEventsPage reorder fights error", error);

      setEvents((current) =>
        current.map((entry) => {
          if (getEventKey(entry) !== selectedEventId) {
            return entry;
          }

          return {
            ...entry,
            fights: previousFights,
          };
        })
      );

      showToast({
        title: "Could not reorder fights",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setReorderingFights(false);
    }
  };

  const handleDeleteFight = (fight) => {
    if (!selectedEventId || !fight) {
      return;
    }

    setFightToDelete(fight);
    setDeleteFightOpen(true);
  };

  const confirmDeleteFight = async () => {
    if (!selectedEventId || !fightToDelete) {
      return;
    }

    const fightKey = getFightKey(fightToDelete);

    if (!fightKey) {
      return;
    }

    try {
      setDeletingFight(true);

      await deleteFight(selectedEventId, fightKey);

      setEvents((current) =>
        current.map((entry) => {
          if (getEventKey(entry) !== selectedEventId) {
            return entry;
          }

          return {
            ...entry,
            fights: reindexFights(
              (entry.fights || []).filter((fight) => getFightKey(fight) !== fightKey)
            ),
          };
        })
      );

      showToast({
        title: "Fight removed",
        description: "The matchup has been removed from the card.",
        variant: "success",
      });

      setDeleteFightOpen(false);
      setFightToDelete(null);
    } catch (error) {
      console.error("AdminEventsPage delete fight error", error);
      showToast({
        title: "Could not delete fight",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setDeletingFight(false);
    }
  };

  const handleDeleteEvent = () => {
    if (!selectedEventId || !selectedEvent) {
      return;
    }

    setDeleteEventOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEventId || !selectedEvent) {
      return;
    }

    try {
      setDeletingEvent(true);

      await deleteEvent(selectedEventId);

      const remainingEvents = events.filter(
        (entry) => getEventKey(entry) !== selectedEventId
      );

      setEvents(remainingEvents);
      setSelectedEventId(getEventKey(remainingEvents[0]) || "");
      setFightForm(emptyFightForm);
      setDeleteEventOpen(false);

      if (!remainingEvents.length) {
        setEventForm(emptyEventForm);
      }

      showToast({
        title: "Event deleted",
        description: `${selectedEvent.name} has been removed.`,
        variant: "success",
      });
    } catch (error) {
      console.error("AdminEventsPage delete event error", error);
      showToast({
        title: "Could not delete event",
        description: error.message,
        variant: "danger",
      });
    } finally {
      setDeletingEvent(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Loading event builder...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Admin" title="Event builder" />

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
            onClick={() => navigate("/admin/results")}
          >
            Open results manager
          </Button>

          {selectedEventId ? (
            <Button
              variant="outline"
              className="rounded-full border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
              onClick={handleDeleteEvent}
            >
              Delete event
            </Button>
          ) : null}

          <Button
            className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={handleStartNewEvent}
          >
            New event
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Choose event</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="max-w-xl">
            <label
              htmlFor="admin-events-event-select"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
            >
              Select card
            </label>

            <div className="relative mt-2">
              <select
                id="admin-events-event-select"
                className={selectClass}
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                disabled={events.length === 0}
              >
                <option value="" disabled>
                  {events.length ? "Choose card" : "No cards available"}
                </option>

                {events.map((event) => {
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

          {selectedEvent ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                  {selectedEvent.status || "open"}
                </Badge>
                <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                  {selectedEventFights.length} fights
                </Badge>
              </div>
              <p className="mt-3">Locks {formatDateTimeDisplay(selectedEvent.lockTime)}</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              You’re creating a new event. Save it first, then add fights underneath.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Event details</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSaveEvent}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Event name</label>
              <input
                type="text"
                value={eventForm.name}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, name: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="UFC 301"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Slug</label>
              <input
                type="text"
                value={eventForm.slug}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, slug: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="ufc-301"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Event time</label>
              <input
                type="datetime-local"
                value={eventForm.date}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, date: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Lock time</label>
              <input
                type="datetime-local"
                value={eventForm.lockTime}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, lockTime: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Venue</label>
              <input
                type="text"
                value={eventForm.venue}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, venue: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="T-Mobile Arena"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Location</label>
              <input
                type="text"
                value={eventForm.location}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, location: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Las Vegas, NV"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-white">Tagline</label>
              <input
                type="text"
                value={eventForm.tagline}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, tagline: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Championship double-header"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Status</label>
              <select
                value={eventForm.status}
                onChange={(event) =>
                  setEventForm((current) => ({ ...current, status: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
              >
                <option value="open">Open</option>
                <option value="locked">Locked</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={savingEvent}
                className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e] disabled:opacity-70"
              >
                {savingEvent ? "Saving..." : selectedEventId ? "Save event" : "Create event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Add fight</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddFight}>
            <div>
              <label className="mb-2 block text-sm font-medium text-white">Left fighter</label>
              <select
                value={fightForm.leftFighterId}
                onChange={(event) =>
                  setFightForm((current) => ({ ...current, leftFighterId: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
              >
                <option value="">Choose fighter</option>
                {fighters.map((fighter) => {
                  const fighterKey = getFighterKey(fighter);

                  return (
                    <option key={fighterKey} value={fighterKey}>
                      {fighter.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Right fighter</label>
              <select
                value={fightForm.rightFighterId}
                onChange={(event) =>
                  setFightForm((current) => ({ ...current, rightFighterId: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
              >
                <option value="">Choose fighter</option>
                {fighters.map((fighter) => {
                  const fighterKey = getFighterKey(fighter);

                  return (
                    <option key={fighterKey} value={fighterKey}>
                      {fighter.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Weight class</label>
              <input
                type="text"
                value={fightForm.weightClass}
                onChange={(event) =>
                  setFightForm((current) => ({ ...current, weightClass: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Lightweight"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Slot label</label>
              <input
                type="text"
                value={fightForm.slotLabel}
                onChange={(event) =>
                  setFightForm((current) => ({ ...current, slotLabel: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="Main Event"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Card type</label>
              <select
                value={fightForm.cardType}
                onChange={(event) =>
                  setFightForm((current) => ({
                    ...current,
                    cardType: event.target.value,
                    slotLabel: event.target.value === "prelim" ? "Prelim" : current.slotLabel,
                  }))
                }
                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
              >
                <option value="main">Main card</option>
                <option value="prelim">Prelim</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white">Bout order</label>
              <input
                type="number"
                min="1"
                value={fightForm.order}
                onChange={(event) =>
                  setFightForm((current) => ({ ...current, order: event.target.value }))
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition focus:border-[#d20a11]/60"
                placeholder="1"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                disabled={addingFight || !selectedEventId}
                className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e] disabled:opacity-70"
              >
                {addingFight ? "Adding..." : "Add fight"}
              </Button>
            </div>
          </form>

          {!selectedEventId ? (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-slate-400">
              Save the event first, then you can add fights to the card.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-xl">Current card</CardTitle>
            <p className="text-sm text-slate-400">
              Drag fights by the handle to reorder them.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {selectedEventFights.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedEventFights.map((fight) => getFightKey(fight))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {selectedEventFights.map((fight) => (
                    <SortableFightRow
                      key={getFightKey(fight)}
                      fight={fight}
                      onRemove={handleDeleteFight}
                      disabled={reorderingFights || deletingFight}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-400">
              No fights added yet.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteEventOpen} onOpenChange={setDeleteEventOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">
              Delete event?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {selectedEvent ? (
                <>
                  This will permanently delete{" "}
                  <span className="font-medium text-white">{selectedEvent.name}</span>,
                  along with all fights and all picks for that card.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
              disabled={deletingEvent}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteEvent();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deletingEvent}
            >
              {deletingEvent ? "Deleting..." : "Delete event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteFightOpen}
        onOpenChange={(open) => {
          if (!deletingFight) {
            setDeleteFightOpen(open);
            if (!open) {
              setFightToDelete(null);
            }
          }
        }}
      >
        <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-white">
              Delete fight?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {fightToDelete ? (
                <>
                  This will remove{" "}
                  <span className="font-medium text-white">
                    {fightToDelete.left?.name} vs {fightToDelete.right?.name}
                  </span>{" "}
                  from the card.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/10 bg-transparent text-white hover:bg-white/10 hover:text-white"
              disabled={deletingFight}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteFight();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deletingFight}
            >
              {deletingFight ? "Deleting..." : "Delete fight"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminEventsPage;