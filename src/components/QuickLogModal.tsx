"use client";

import { useState, useEffect } from "react";
import { X, Check, Plus, Minus, Dumbbell, Clock, Flame, Scale, Activity } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Tracker {
  id: string;
  name: string;
  type: string;
  unit: string | null;
  targetValue: number | null;
  color: string;
  icon: string;
}

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trackers: Tracker[];
  selectedTrackerId?: string | null;
  selectedDate?: string;
}

export function QuickLogModal({
  isOpen,
  onClose,
  onSuccess,
  trackers,
  selectedTrackerId,
  selectedDate,
}: QuickLogModalProps) {
  const [trackerId, setTrackerId] = useState<string>("");
  const [date, setDate] = useState<string>(formatDate(new Date()));
  const [value, setValue] = useState<number | string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Workout specific sets state
  const [workoutSets, setWorkoutSets] = useState<Array<{ set: number; reps: number; weight: number }>>([
    { set: 1, reps: 10, weight: 60 },
  ]);

  useEffect(() => {
    if (selectedTrackerId) {
      setTrackerId(selectedTrackerId);
    } else if (trackers.length > 0 && !trackerId) {
      setTrackerId(trackers[0].id);
    }
    if (selectedDate) {
      setDate(selectedDate);
    } else {
      setDate(formatDate(new Date()));
    }
  }, [selectedTrackerId, selectedDate, trackers, trackerId]);

  if (!isOpen) return null;

  const currentTracker = trackers.find((t) => t.id === trackerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let finalValue: number = 0;
      let metadata: any = null;

      if (!currentTracker) {
        throw new Error("Please select a tracker");
      }

      if (currentTracker.type === "HABIT") {
        finalValue = Number(value) > 0 ? 1 : 1; // Default to 1 (completed)
      } else if (currentTracker.type === "WORKOUT") {
        metadata = workoutSets;
        // Total volume or max weight for workout value
        finalValue = workoutSets.reduce((sum, s) => sum + s.reps * (s.weight || 1), 0);
      } else {
        finalValue = parseFloat(String(value));
        if (isNaN(finalValue)) {
          throw new Error("Please enter a valid number");
        }
      }

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackerId: currentTracker.id,
          date,
          value: finalValue,
          notes: notes.trim() || undefined,
          metadata: metadata || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log entry");
      }

      // Reset & close
      setValue("");
      setNotes("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save log");
    } finally {
      setLoading(false);
    }
  };

  const addWorkoutSet = () => {
    const lastSet = workoutSets[workoutSets.length - 1];
    setWorkoutSets([
      ...workoutSets,
      {
        set: workoutSets.length + 1,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 50,
      },
    ]);
  };

  const removeWorkoutSet = (index: number) => {
    if (workoutSets.length <= 1) return;
    setWorkoutSets(workoutSets.filter((_, i) => i !== index));
  };

  const updateWorkoutSet = (index: number, field: "reps" | "weight", val: number) => {
    const updated = [...workoutSets];
    updated[index] = { ...updated[index], [field]: val };
    setWorkoutSets(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Activity</h3>
              <p className="text-xs text-slate-400">Record your daily fitness progress</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {/* Date & Tracker Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                max={formatDate(new Date())}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tracker
              </label>
              <select
                value={trackerId}
                onChange={(e) => {
                  setTrackerId(e.target.value);
                  setValue("");
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {trackers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Tracker Input Area */}
          {currentTracker && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  {currentTracker.name}
                </span>
                <span>
                  {currentTracker.targetValue
                    ? `Target: ${currentTracker.targetValue} ${currentTracker.unit || ""}`
                    : `Type: ${currentTracker.type}`}
                </span>
              </div>

              {/* Habit Type */}
              {currentTracker.type === "HABIT" && (
                <div className="flex items-center justify-center py-4">
                  <button
                    type="button"
                    onClick={() => setValue(value === 1 ? 0 : 1)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                      value === 1
                        ? "bg-emerald-500 text-slate-950 scale-105 shadow-emerald-500/25"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    {value === 1 ? "Marked as Completed! ✅" : "Click to Mark Completed"}
                  </button>
                </div>
              )}

              {/* Counter Type */}
              {currentTracker.type === "COUNTER" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Enter count"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-base focus:outline-none focus:border-emerald-500 font-bold"
                    />
                    <span className="text-xs font-semibold text-slate-400 px-2">
                      {currentTracker.unit || "reps"}
                    </span>
                  </div>
                  {/* Quick Increment buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Quick add:</span>
                    {[1, 5, 10, 25].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() =>
                          setValue((prev) => (parseFloat(String(prev || 0)) || 0) + inc)
                        }
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 border border-emerald-500/20"
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Numeric Type */}
              {currentTracker.type === "NUMERIC" && (
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder={`e.g. ${currentTracker.targetValue || "75"}`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-base focus:outline-none focus:border-emerald-500 font-bold"
                  />
                  <span className="text-sm font-bold text-slate-300 px-2">
                    {currentTracker.unit || "kg"}
                  </span>
                </div>
              )}

              {/* Duration Type */}
              {currentTracker.type === "DURATION" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-base focus:outline-none focus:border-emerald-500 font-bold"
                    />
                    <span className="text-sm font-bold text-slate-300 px-2">
                      {currentTracker.unit || "minutes"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Presets:</span>
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setValue(mins)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-xs font-bold text-cyan-400 border border-cyan-500/20"
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Type */}
              {currentTracker.type === "WORKOUT" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Exercise Sets & Reps</span>
                    <button
                      type="button"
                      onClick={addWorkoutSet}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Set
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {workoutSets.map((ws, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-white/5 text-xs"
                      >
                        <span className="w-12 text-slate-400 font-bold">Set {ws.set}</span>
                        <div className="flex-1 flex items-center gap-1">
                          <input
                            type="number"
                            value={ws.reps}
                            onChange={(e) =>
                              updateWorkoutSet(idx, "reps", parseInt(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 rounded bg-slate-950 border border-white/10 text-white text-center font-bold"
                          />
                          <span className="text-slate-500 text-[11px]">reps @</span>
                          <input
                            type="number"
                            step="any"
                            value={ws.weight}
                            onChange={(e) =>
                              updateWorkoutSet(idx, "weight", parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 rounded bg-slate-950 border border-white/10 text-white text-center font-bold"
                          />
                          <span className="text-slate-500 text-[11px]">kg</span>
                        </div>
                        {workoutSets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeWorkoutSet(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes / Reflection (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Felt great, new PR, slept 8 hours"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg shadow-emerald-400/20 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
