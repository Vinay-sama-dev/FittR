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
  isArchived: boolean;
  sortOrder: number;
}

const AVAILABLE_ICONS = [
  { name: "Activity", label: "General Activity" },
  { name: "Flame", label: "Cardio & Burn" },
  { name: "Dumbbell", label: "Strength & Gym" },
  { name: "Scale", label: "Bodyweight" },
  { name: "Clock", label: "Duration" },
  { name: "Droplets", label: "Hydration" },
  { name: "Heart", label: "Health & Vitals" },
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
];

export default function TrackersPage() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Workout");
  const [type, setType] = useState("NUMERIC");
  const [unit, setUnit] = useState("kg");
  const [targetValue, setTargetValue] = useState<string>("");
  const [color, setColor] = useState("#10b981");
  const [icon, setIcon] = useState("Activity");
  const [submitting, setSubmitting] = useState(false);

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
    setCategory("Workout");
    setType("NUMERIC");
    setUnit("kg");
    setTargetValue("");
    setColor("#10b981");
    setIcon("Activity");
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
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTracker) {
        // Update
        const res = await fetch(`/api/trackers/${editingTracker.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
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
        }
      } else {
        // Create
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
        }
      }
    } catch (err) {
      console.error("Save tracker error", err);
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tracker and all its past logs?")) return;
    try {
      await fetch(`/api/trackers/${id}`, { method: "DELETE" });
      fetchTrackers();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  const activeTrackers = trackers.filter((t) => !t.isArchived);
  const archivedTrackers = trackers.filter((t) => t.isArchived);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Tracker Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Manage Custom Trackers
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Define the fitness metrics, habits, and workouts that matter to you
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

      {/* Active Trackers List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Active Trackers ({activeTrackers.length})</h2>

        {loading ? (
          <div className="text-xs text-slate-400 py-8">Loading trackers...</div>
        ) : activeTrackers.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-400">
            No active trackers. Click &apos;Create New Tracker&apos; to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrackers.map((t) => (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: `${t.color}20`,
                          color: t.color,
                          border: `1px solid ${t.color}40`,
                        }}
                      >
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{t.name}</h3>
                        <span className="text-[11px] text-slate-400">
                          {t.category} • {t.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 flex items-center justify-between">
                    <span>Target Goal:</span>
                    <strong className="text-white">
                      {t.targetValue ? `${t.targetValue} ${t.unit || ""}` : "Flexible / None"}
                    </strong>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(t)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleArchive(t.id, false)}
                    title="Archive Tracker"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    title="Delete Tracker"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <span className="text-[10px] text-slate-500">{t.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleArchive(t.id, true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/50">
              <h3 className="text-base font-bold text-white">
                {editingTracker ? "Edit Tracker" : "Create New Custom Tracker"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tracker Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Jog, Creatine, Bench Press"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Workout">Workout</option>
                    <option value="Habit">Habit & Lifestyle</option>
                    <option value="Body">Body & Weight</option>
                    <option value="Nutrition">Nutrition & Water</option>
                    <option value="Cardio">Cardio & Running</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tracker Type
                  </label>
                  <select
                    disabled={!!editingTracker}
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (e.target.value === "HABIT") setUnit("");
                      else if (e.target.value === "COUNTER") setUnit("reps");
                      else if (e.target.value === "DURATION") setUnit("min");
                      else if (e.target.value === "NUMERIC") setUnit("kg");
                      else if (e.target.value === "WORKOUT") setUnit("kg");
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="NUMERIC">Numeric (Target / Weight)</option>
                    <option value="HABIT">Habit (Daily Yes/No)</option>
                    <option value="COUNTER">Counter (Incremental Reps)</option>
                    <option value="DURATION">Duration (Minutes)</option>
                    <option value="WORKOUT">Workout (Sets x Reps)</option>
                  </select>
                </div>
              </div>

              {type !== "HABIT" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Measurement Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. kg, reps, km, min, ml"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Daily Target Value
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 75, 50, 30"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-4 h-4 text-slate-950 stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
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
                  {submitting ? "Saving..." : editingTracker ? "Update Tracker" : "Create Tracker"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
