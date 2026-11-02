"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  Plus,
  Minus,
  Dumbbell,
  Clock,
  Flame,
  Scale,
  Activity,
  Utensils,
  Ruler,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  STANDARD_BODY_MEASUREMENTS,
  calculateBMI,
  getBMICategory,
} from "@/lib/tracker-config";

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
  todayLog?: {
    id: string;
    value: number;
    notes: string | null;
    metadata?: any;
  } | null;
}

interface MealItem {
  id: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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

  // Training / Workout state
  const [workoutSets, setWorkoutSets] = useState<
    Array<{ set: number; reps: number; weight: number }>
  >([{ set: 1, reps: 10, weight: 60 }]);
  const [trainingDuration, setTrainingDuration] = useState<string>("");
  const [trainingDistance, setTrainingDistance] = useState<string>("");

  // Optional Measurements circumference state
  const [showBodyMeasurements, setShowBodyMeasurements] = useState(false);
  const [bodyMeasurements, setBodyMeasurements] = useState<Record<string, number>>({});
  const [heightValue, setHeightValue] = useState<string>("");

  // Optional Nutrition meal-level food logging state
  const [showMealLogging, setShowMealLogging] = useState(false);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [newMealType, setNewMealType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCalories, setNewFoodCalories] = useState<string>("");
  const [newFoodProtein, setNewFoodProtein] = useState<string>("");
  const [newFoodCarbs, setNewFoodCarbs] = useState<string>("");
  const [newFoodFat, setNewFoodFat] = useState<string>("");

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

  // Pre-fill existing log data if this tracker was already logged on this date
  useEffect(() => {
    if (!isOpen) return;
    const active = trackers.find((t) => t.id === trackerId);
    if (!active) return;

    if (active.todayLog) {
      setValue(active.todayLog.value);
      setNotes(active.todayLog.notes || "");

      // Parse metadata if present
      const meta = active.todayLog.metadata;
      if (meta) {
        try {
          const parsed = typeof meta === "string" ? JSON.parse(meta) : meta;
          if (Array.isArray(parsed)) {
            setWorkoutSets(parsed);
          } else if (typeof parsed === "object") {
            if (parsed.sets) setWorkoutSets(parsed.sets);
            if (parsed.duration) setTrainingDuration(String(parsed.duration));
            if (parsed.distance) setTrainingDistance(String(parsed.distance));
            if (parsed.bodyMeasurements) setBodyMeasurements(parsed.bodyMeasurements);
            if (parsed.meals) setMealItems(parsed.meals);
          }
        } catch {
          // ignore
        }
      }
    } else {
      setValue(active.type === "HABIT" ? 1 : "");
      setNotes("");
      setWorkoutSets([{ set: 1, reps: 10, weight: 60 }]);
      setTrainingDuration("");
      setTrainingDistance("");
      setBodyMeasurements({});
      setMealItems([]);
    }

    // Pre-populate Height if looking at Weight/BMI
    if (active.category === "Measurements" || active.systemCode === "WEIGHT") {
      const heightTracker = trackers.find((t) => t.systemCode === "HEIGHT");
      if (heightTracker?.todayLog?.value) {
        setHeightValue(String(heightTracker.todayLog.value));
      } else if (heightTracker?.targetValue) {
        setHeightValue(String(heightTracker.targetValue));
      }
    }
  }, [trackerId, trackers, isOpen]);

  if (!isOpen) return null;

  const currentTracker = trackers.find((t) => t.id === trackerId);

  // Helper meal addition
  const handleAddMealItem = () => {
    if (!newFoodName.trim()) return;
    const newItem: MealItem = {
      id: Math.random().toString(36).substring(2, 9),
      mealType: newMealType,
      name: newFoodName.trim(),
      calories: parseFloat(newFoodCalories) || 0,
      protein: parseFloat(newFoodProtein) || 0,
      carbs: parseFloat(newFoodCarbs) || 0,
      fat: parseFloat(newFoodFat) || 0,
    };
    const updated = [...mealItems, newItem];
    setMealItems(updated);
    setNewFoodName("");
    setNewFoodCalories("");
    setNewFoodProtein("");
    setNewFoodCarbs("");
    setNewFoodFat("");

    // Auto-update current tracker value if it's a macro
    if (currentTracker) {
      if (currentTracker.systemCode === "CALORIES") {
        setValue(updated.reduce((s, m) => s + m.calories, 0));
      } else if (currentTracker.systemCode === "PROTEIN") {
        setValue(updated.reduce((s, m) => s + m.protein, 0));
      } else if (currentTracker.systemCode === "CARBS") {
        setValue(updated.reduce((s, m) => s + m.carbs, 0));
      } else if (currentTracker.systemCode === "FAT") {
        setValue(updated.reduce((s, m) => s + m.fat, 0));
      }
    }
  };

  const handleRemoveMealItem = (id: string) => {
    const updated = mealItems.filter((m) => m.id !== id);
    setMealItems(updated);
    if (currentTracker) {
      if (currentTracker.systemCode === "CALORIES") {
        setValue(updated.reduce((s, m) => s + m.calories, 0));
      } else if (currentTracker.systemCode === "PROTEIN") {
        setValue(updated.reduce((s, m) => s + m.protein, 0));
      } else if (currentTracker.systemCode === "CARBS") {
        setValue(updated.reduce((s, m) => s + m.carbs, 0));
      } else if (currentTracker.systemCode === "FAT") {
        setValue(updated.reduce((s, m) => s + m.fat, 0));
      }
    }
  };

  const totalMealCalories = mealItems.reduce((s, m) => s + m.calories, 0);
  const totalMealProtein = mealItems.reduce((s, m) => s + m.protein, 0);
  const totalMealCarbs = mealItems.reduce((s, m) => s + m.carbs, 0);
  const totalMealFat = mealItems.reduce((s, m) => s + m.fat, 0);

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
        finalValue = Number(value) >= 1 ? 1 : 0;
      } else if (currentTracker.type === "WORKOUT") {
        metadata = {
          sets: workoutSets,
          duration: trainingDuration ? parseFloat(trainingDuration) : null,
          distance: trainingDistance ? parseFloat(trainingDistance) : null,
        };
        finalValue = workoutSets.reduce((sum, s) => sum + s.reps * (s.weight || 1), 0);
        if (finalValue === 0 && trainingDuration) {
          finalValue = parseFloat(trainingDuration);
        }
      } else {
        finalValue = parseFloat(String(value));
        if (isNaN(finalValue)) {
          throw new Error("Please enter a valid number");
        }
      }

      // Attach body measurements if logging measurements
      if (currentTracker.category === "Measurements" || currentTracker.systemCode === "WEIGHT") {
        metadata = {
          ...(metadata || {}),
          bodyMeasurements,
          height: heightValue ? parseFloat(heightValue) : null,
        };
      }

      // Attach meals if logging nutrition
      if (currentTracker.category === "Nutrition" && mealItems.length > 0) {
        metadata = {
          ...(metadata || {}),
          meals: mealItems,
          totals: {
            calories: totalMealCalories,
            protein: totalMealProtein,
            carbs: totalMealCarbs,
            fat: totalMealFat,
          },
        };
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

      // If user logged meal items and wants to sync all 4 macro cards
      if (mealItems.length > 0 && currentTracker.category === "Nutrition") {
        const calTracker = trackers.find((t) => t.systemCode === "CALORIES");
        const proTracker = trackers.find((t) => t.systemCode === "PROTEIN");
        const carbTracker = trackers.find((t) => t.systemCode === "CARBS");
        const fatTracker = trackers.find((t) => t.systemCode === "FAT");

        const syncPromises: Promise<any>[] = [];
        if (calTracker && calTracker.id !== currentTracker.id && totalMealCalories > 0) {
          syncPromises.push(
            fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackerId: calTracker.id, date, value: totalMealCalories }),
            })
          );
        }
        if (proTracker && proTracker.id !== currentTracker.id && totalMealProtein > 0) {
          syncPromises.push(
            fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackerId: proTracker.id, date, value: totalMealProtein }),
            })
          );
        }
        if (carbTracker && carbTracker.id !== currentTracker.id && totalMealCarbs > 0) {
          syncPromises.push(
            fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackerId: carbTracker.id, date, value: totalMealCarbs }),
            })
          );
        }
        if (fatTracker && fatTracker.id !== currentTracker.id && totalMealFat > 0) {
          syncPromises.push(
            fetch("/api/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackerId: fatTracker.id, date, value: totalMealFat }),
            })
          );
        }
        await Promise.allSettled(syncPromises);
      }

      // If user updated height in measurements modal, sync height log as well
      if (
        (currentTracker.category === "Measurements" || currentTracker.systemCode === "WEIGHT") &&
        heightValue &&
        parseFloat(heightValue) > 0
      ) {
        const heightTracker = trackers.find((t) => t.systemCode === "HEIGHT");
        if (heightTracker && heightTracker.id !== currentTracker.id) {
          await fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackerId: heightTracker.id,
              date,
              value: parseFloat(heightValue),
            }),
          });
        }
      }

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

  // Group trackers by the 4 official categories for the select dropdown
  const categories = ["Nutrition", "Measurements", "Training", "Habits"];
  const groupedTrackers: Record<string, Tracker[]> = {};
  categories.forEach((c) => (groupedTrackers[c] = []));

  trackers.forEach((t) => {
    const cat = categories.includes(t.category) ? t.category : "Habits";
    groupedTrackers[cat].push(t);
  });

  // Real-time BMI calculation preview if weight and height are present
  const weightNum = parseFloat(String(value)) || 0;
  const heightNum = parseFloat(heightValue) || 0;
  const liveBMI = calculateBMI(weightNum, heightNum);
  const liveBMICategory = getBMICategory(liveBMI);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: currentTracker ? `${currentTracker.color}25` : "#10b98125",
                color: currentTracker?.color || "#10b981",
              }}
            >
              {currentTracker?.category === "Nutrition" ? (
                <Utensils className="w-4 h-4" />
              ) : currentTracker?.category === "Measurements" ? (
                <Scale className="w-4 h-4" />
              ) : currentTracker?.category === "Training" ? (
                <Dumbbell className="w-4 h-4" />
              ) : (
                <Activity className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Activity & Progress</h3>
              <p className="text-xs text-slate-400">
                {currentTracker ? `${currentTracker.category} • ${currentTracker.name}` : "Record daily metrics"}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          {/* Date & Categorized Tracker Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Logging Date
              </label>
              <input
                type="date"
                value={date}
                max={formatDate(new Date())}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Metric
              </label>
              <select
                value={trackerId}
                onChange={(e) => setTrackerId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
              >
                {categories.map((cat) => (
                  <optgroup key={cat} label={`── ${cat} ──`}>
                    {groupedTrackers[cat]?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.isEssential ? "★" : ""} ({t.unit || t.type})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Tracker Input Area */}
          {currentTracker && (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentTracker.color }}
                  />
                  {currentTracker.name}
                  {currentTracker.isEssential && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                      Essential
                    </span>
                  )}
                </span>
                <span className="text-slate-400 font-medium">
                  {currentTracker.targetValue
                    ? `Goal: ${currentTracker.targetValue} ${currentTracker.unit || ""}`
                    : `Category: ${currentTracker.category}`}
                </span>
              </div>

              {/* 1. Habit Type (Boolean) */}
              {currentTracker.type === "HABIT" && (
                <div className="flex items-center justify-center py-4">
                  <button
                    type="button"
                    onClick={() => setValue(value === 1 ? 0 : 1)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg ${
                      value === 1
                        ? "bg-emerald-500 text-slate-950 scale-105 shadow-emerald-500/25"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    {value === 1 ? "Completed Today! ✅" : "Click to Mark Completed"}
                  </button>
                </div>
              )}

              {/* 2. Counter Type */}
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
                  <div className="flex items-center gap-2 flex-wrap">
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

              {/* 3. Numeric & Measurements Type */}
              {currentTracker.type === "NUMERIC" && (
                <div className="space-y-3">
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
                      {currentTracker.unit || "units"}
                    </span>
                  </div>

                  {/* Weight / Height auto-BMI preview */}
                  {(currentTracker.systemCode === "WEIGHT" || currentTracker.name.toLowerCase().includes("weight")) && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Height for BMI computation:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="175"
                            value={heightValue}
                            onChange={(e) => setHeightValue(e.target.value)}
                            className="w-20 px-2 py-1 rounded bg-slate-950 border border-white/10 text-white text-xs font-bold text-center"
                          />
                          <span className="text-slate-500 font-semibold">cm</span>
                        </div>
                      </div>
                      {liveBMI > 0 && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                          <span className="text-slate-300 font-bold">
                            Calculated BMI: <strong className="text-white text-sm">{liveBMI}</strong>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-bold ${liveBMICategory.color} bg-white/5`}>
                            {liveBMICategory.label}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Duration Type */}
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
                  <div className="flex items-center gap-2 flex-wrap">
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

              {/* 5. Training / Workout Type */}
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
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
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

                  {/* Optional Cardio Duration & Distance */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        placeholder="e.g. 45"
                        value={trainingDuration}
                        onChange={(e) => setTrainingDuration(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Distance (km)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 5.2"
                        value={trainingDistance}
                        onChange={(e) => setTrainingDistance(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optional Meal-Level Food Logging for Nutrition */}
          {currentTracker?.category === "Nutrition" && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3">
              <button
                type="button"
                onClick={() => setShowMealLogging(!showMealLogging)}
                className="w-full flex items-center justify-between text-xs font-bold text-amber-300 hover:text-amber-200"
              >
                <span className="flex items-center gap-2">
                  <Utensils className="w-4 h-4" /> Optional Meal-Level Food Logging
                </span>
                {showMealLogging ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showMealLogging && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <select
                      value={newMealType}
                      onChange={(e: any) => setNewMealType(e.target.value)}
                      className="col-span-1 px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs font-semibold"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Food Item Name"
                      value={newFoodName}
                      onChange={(e) => setNewFoodName(e.target.value)}
                      className="col-span-1 sm:col-span-4 px-2.5 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <input
                      type="number"
                      placeholder="Calories"
                      value={newFoodCalories}
                      onChange={(e) => setNewFoodCalories(e.target.value)}
                      className="px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs font-semibold text-center"
                    />
                    <input
                      type="number"
                      placeholder="Protein (g)"
                      value={newFoodProtein}
                      onChange={(e) => setNewFoodProtein(e.target.value)}
                      className="px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs font-semibold text-center"
                    />
                    <input
                      type="number"
                      placeholder="Carbs (g)"
                      value={newFoodCarbs}
                      onChange={(e) => setNewFoodCarbs(e.target.value)}
                      className="px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs font-semibold text-center"
                    />
                    <input
                      type="number"
                      placeholder="Fat (g)"
                      value={newFoodFat}
                      onChange={(e) => setNewFoodFat(e.target.value)}
                      className="px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs font-semibold text-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMealItem}
                    className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Food to {newMealType}
                  </button>

                  {/* Meal list */}
                  {mealItems.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2 border-t border-white/5">
                      {mealItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded bg-slate-900 text-[11px] text-slate-300"
                        >
                          <div>
                            <strong className="text-white">[{item.mealType}]</strong> {item.name}
                            <span className="text-slate-400 ml-2">
                              {item.calories} kcal • {item.protein}P / {item.carbs}C / {item.fat}F
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMealItem(item.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-300 flex justify-between">
                        <span>Meal Totals:</span>
                        <span>
                          {totalMealCalories} kcal | {totalMealProtein}g P | {totalMealCarbs}g C | {totalMealFat}g F
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Optional Body Circumference Measurements */}
          {currentTracker?.category === "Measurements" && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3">
              <button
                type="button"
                onClick={() => setShowBodyMeasurements(!showBodyMeasurements)}
                className="w-full flex items-center justify-between text-xs font-bold text-cyan-300 hover:text-cyan-200"
              >
                <span className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Standard Body Measurements (Optional)
                </span>
                {showBodyMeasurements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showBodyMeasurements && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  {STANDARD_BODY_MEASUREMENTS.map((m) => (
                    <div key={m.key} className="space-y-1">
                      <label className="block text-[11px] text-slate-400 font-medium">
                        {m.name} ({m.unit})
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="—"
                        value={bodyMeasurements[m.key] || ""}
                        onChange={(e) =>
                          setBodyMeasurements({
                            ...bodyMeasurements,
                            [m.key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white text-xs font-bold text-center"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Daily Notes & Reflection (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Great energy, healthy deficit, new PR achieved"
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
              {loading ? "Saving Progress..." : "Save Daily Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
