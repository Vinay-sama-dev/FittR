"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Archive,
  RotateCcw,
  Activity,
  Flame,
  Dumbbell,
  Scale,
  Clock,
  Droplets,
  Heart,
  TrendingUp,
  X,
  Check,
  Lock,
  ArrowUp,
  ArrowDown,
  Utensils,
  Ruler,
  Info,
} from "lucide-react";

interface Tracker {
  id: string;
  name: string;
  category: string;
  type: string;
  unit: string | null;
  targetValue: number | null;
  color: string;
  icon: string;
  isEssential?: boolean;
  systemCode?: string | null;
  isArchived: boolean;
  sortOrder: number;
}

const AVAILABLE_ICONS = [
  { name: "Activity", label: "General Activity" },
  { name: "Flame", label: "Calories & Burn" },
  { name: "Dumbbell", label: "Strength & Gym" },
  { name: "Scale", label: "Bodyweight" },
  { name: "Clock", label: "Duration" },
  { name: "Droplets", label: "Hydration" },
  { name: "Heart", label: "Cardio & Vitals" },
  { name: "TrendingUp", label: "Performance" },
];

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#f97316", // Orange
  "#ec4899", // Pink
  "#eab308", // Yellow
  "#3b82f6", // Blue
  "#ef4444", // Red
];

const CATEGORIES = ["All", "Nutrition", "Measurements", "Training", "Habits"] as const;

export default function TrackersPage() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Habits");
  const [type, setType] = useState("NUMERIC");
  const [unit, setUnit] = useState("kg");
  const [targetValue, setTargetValue] = useState<string>("");
  const [color, setColor] = useState("#10b981");
  const [icon, setIcon] = useState("Activity");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTrackers = useCallback(async () => {
    try {
      const res = await fetch("/api/trackers?includeArchived=true");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setTrackers(data.trackers || []);
    } catch (err) {
      console.error("Error fetching trackers", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchTrackers();
  }, [fetchTrackers]);

  const openCreateModal = () => {
    setEditingTracker(null);
    setName("");
    setCategory(selectedCategory !== "All" ? selectedCategory : "Habits");
    setType("NUMERIC");
    setUnit(selectedCategory === "Nutrition" ? "g" : "reps");
    setTargetValue("");
    setColor("#10b981");
    setIcon("Activity");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (t: Tracker) => {
    setEditingTracker(t);
    setName(t.name);
    setCategory(t.category);
    setType(t.type);
    setUnit(t.unit || "");
    setTargetValue(t.targetValue ? String(t.targetValue) : "");
    setColor(t.color);
    setIcon(t.icon);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingTracker) {
        // Update tracker configuration
        const res = await fetch(`/api/trackers/${editingTracker.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editingTracker.isEssential ? undefined : name, // Essential cards keep canonical names
            category,
            unit,
            targetValue: targetValue ? parseFloat(targetValue) : null,
            color,
            icon,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchTrackers();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || "Failed to update tracker");
        }
      } else {
        // Create new tracker
        const res = await fetch("/api/trackers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            type,
            unit: type === "HABIT" ? null : unit,
            targetValue: targetValue ? parseFloat(targetValue) : null,
            color,
            icon,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchTrackers();
        } else {
          const d = await res.json();
          setErrorMsg(d.error || "Failed to create tracker");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Save tracker error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await fetch(`/api/trackers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !currentArchived }),
      });
      fetchTrackers();
    } catch (err) {
      console.error("Archive error", err);
    }
  };

  const handleDelete = async (t: Tracker) => {
    if (t.isEssential) {
      alert(`"${t.name}" is an essential mandatory tracker and cannot be deleted.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete "${t.name}" and all its historical logs?`)) return;
    try {
      const res = await fetch(`/api/trackers/${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Failed to delete tracker");
      }
      fetchTrackers();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  // Move tracker position up or down
  const handleMove = async (index: number, direction: "up" | "down", list: Tracker[]) => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const current = list[index];
    const target = list[targetIdx];

    const updatedReorder = [
      { id: current.id, sortOrder: target.sortOrder },
      { id: target.id, sortOrder: current.sortOrder },
    ];

    try {
      await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reorder: updatedReorder }),
      });
      fetchTrackers();
    } catch (err) {
      console.error("Reorder error", err);
    }
  };

  const activeTrackers = trackers.filter((t) => !t.isArchived);
  const archivedTrackers = trackers.filter((t) => t.isArchived);

  const filteredTrackers =
    selectedCategory === "All"
      ? activeTrackers
      : activeTrackers.filter((t) => t.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Tracker Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Manage Four Tracker Categories
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Nutrition, Measurements, Training, and Habits — fully interconnected with historical analytics
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Create New Tracker
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const count =
            cat === "All"
              ? activeTrackers.length
              : activeTrackers.filter((t) => t.category === cat).length;
          const isActive = selectedCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
              }`}
            >
              {cat === "Nutrition" && <Utensils className="w-3.5 h-3.5" />}
              {cat === "Measurements" && <Scale className="w-3.5 h-3.5" />}
              {cat === "Training" && <Dumbbell className="w-3.5 h-3.5" />}
              {cat === "Habits" && <Flame className="w-3.5 h-3.5" />}
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Category Descriptive Banner */}
      {selectedCategory === "Nutrition" && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="text-white block font-bold mb-0.5">Nutrition Module</strong>
            Mandatory core metrics: <strong>Calories, Protein, Carbohydrates, and Fat</strong>. Essential cards cannot be deleted, but daily targets and units are configurable. Additional custom nutrition metrics can be added below.
          </div>
        </div>
      )}

      {selectedCategory === "Measurements" && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-cyan-400" />
          <div>
            <strong className="text-white block font-bold mb-0.5">Body Measurements Module</strong>
            Mandatory metrics: <strong>Weight, Height, and auto-computed BMI</strong>. Essential metrics cannot be deleted. Standard body circumferences (Neck, Chest, Waist, Hips, Arms, Legs) can be logged and compared over time.
          </div>
        </div>
      )}

      {selectedCategory === "Training" && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
          <div>
            <strong className="text-white block font-bold mb-0.5">Training Module</strong>
            Completely user-customizable. Create, edit, reorder, archive, or delete exercises and routines. Full logging support for sets, reps, weights, duration, and distance.
          </div>
        </div>
      )}

      {selectedCategory === "Habits" && (
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-400" />
          <div>
            <strong className="text-white block font-bold mb-0.5">Habits Module</strong>
            Completely user-customizable. Support for Boolean checkmarks, counter steppers (+ / -), duration timers, and quantity habits with streak tracking.
          </div>
        </div>
      )}

      {/* Active Trackers Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">
          Active Trackers in {selectedCategory} ({filteredTrackers.length})
        </h2>

        {loading ? (
          <div className="text-xs text-slate-400 py-8">Loading trackers...</div>
        ) : filteredTrackers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-400">
            No active trackers in this category. Click &apos;Create New Tracker&apos; to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrackers.map((t, idx) => (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between group transition-all hover:border-white/20"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-md"
                        style={{
                          backgroundColor: `${t.color}20`,
                          color: t.color,
                          border: `1px solid ${t.color}40`,
                        }}
                      >
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{t.name}</h3>
                          {t.isEssential && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              Essential
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 capitalize">
                          {t.category} • {t.type.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {/* Reordering arrows */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMove(idx, "up", filteredTrackers)}
                        disabled={idx === 0}
                        title="Move Up"
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down", filteredTrackers)}
                        disabled={idx === filteredTrackers.length - 1}
                        title="Move Down"
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 flex items-center justify-between">
                    <span>Configured Goal:</span>
                    <strong className="text-white">
                      {t.targetValue ? `${t.targetValue} ${t.unit || ""}` : "Flexible / None"}
                    </strong>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Order #{t.sortOrder}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(t)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleToggleArchive(t.id, false)}
                      title="Archive Tracker"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    {t.isEssential ? (
                      <span
                        title="Essential metric cannot be deleted"
                        className="p-1.5 text-slate-600 cursor-not-allowed"
                      >
                        <Lock className="w-4 h-4" />
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDelete(t)}
                        title="Delete Tracker"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived Trackers List */}
      {archivedTrackers.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-white/5">
          <h2 className="text-sm font-bold text-slate-400">
            Archived Trackers ({archivedTrackers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedTrackers.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-300">{t.name}</h4>
                  <span className="text-[10px] text-slate-500">
                    {t.category} • {t.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleArchive(t.id, true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  {!t.isEssential && (
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create or Edit Tracker */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="text-base font-bold text-white">
                {editingTracker
                  ? `Configure ${editingTracker.name}`
                  : `Create New ${category} Tracker`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              {/* Tracker Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tracker Name
                </label>
                <input
                  type="text"
                  required
                  disabled={editingTracker?.isEssential}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Daily Protein, Bench Press, Hydration"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
                {editingTracker?.isEssential && (
                  <span className="text-[10px] text-amber-400 mt-1 block">
                    Essential card names are preserved to protect historical analytics.
                  </span>
                )}
              </div>

              {/* Category & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    disabled={editingTracker?.isEssential}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="Nutrition">Nutrition</option>
                    <option value="Measurements">Measurements</option>
                    <option value="Training">Training</option>
                    <option value="Habits">Habits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Logging Type
                  </label>
                  <select
                    disabled={!!editingTracker}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="NUMERIC">Numeric (e.g. Weight, Calories)</option>
                    <option value="HABIT">Boolean Habit (Completed / Pending)</option>
                    <option value="COUNTER">Counter (Reps, Glasses, Steps)</option>
                    <option value="DURATION">Duration (Minutes, Seconds)</option>
                    <option value="WORKOUT">Workout (Exercise Sets & Reps)</option>
                  </select>
                </div>
              </div>

              {/* Measurement Unit & Target Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Measurement Unit
                  </label>
                  <input
                    type="text"
                    disabled={type === "HABIT"}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. kg, kcal, g, reps, min"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Daily Target Goal
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g. 2000, 140, 75"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        color === c ? "scale-110 ring-2 ring-white" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-400/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingTracker ? "Save Changes" : "Create Tracker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
