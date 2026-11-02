"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Flame,
  Award,
  Plus,
  Calendar as CalendarIcon,
  Zap,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Utensils,
  Scale,
  Dumbbell,
  Ruler,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import confetti from "canvas-confetti";
import { TrackerCard } from "@/components/TrackerCard";
import { QuickLogModal } from "@/components/QuickLogModal";
import Link from "next/link";
import { formatDate, formatDisplayDate } from "@/lib/utils";
import { subDays, addDays } from "date-fns";

interface DashboardData {
  date: string;
  efficiency: {
    score: number;
    totalTrackers: number;
    completedTrackers: number;
    details: any[];
  };
  weeklyTrend: Array<{ date: string; label: string; score: number }>;
  streak: number;
  trackers: any[];
  weightComparison?: {
    current: number;
    previous: number;
    delta: number;
    previousDate: string;
  } | null;
  bmiCategory?: {
    label: string;
    color: string;
  } | null;
  recentMilestones: any[];
  pendingMilestones: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [selectedTrackerId, setSelectedTrackerId] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string>(() => formatDate(new Date()));
  const [dashboardCategory, setDashboardCategory] = useState<string>("All");

  const fetchDashboard = useCallback(async (dateToFetch?: string) => {
    try {
      const targetDate = dateToFetch || activeDate;
      const res = await fetch(`/api/dashboard?date=${targetDate}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [router, activeDate]);

  useEffect(() => {
    fetchDashboard(activeDate);
  }, [fetchDashboard, activeDate]);

  const handlePrevDay = () => {
    const [y, m, d] = activeDate.split("-").map(Number);
    const prev = formatDate(subDays(new Date(y, m - 1, d, 12), 1));
    setActiveDate(prev);
  };

  const handleNextDay = () => {
    const today = formatDate(new Date());
    if (activeDate >= today) return;
    const [y, m, d] = activeDate.split("-").map(Number);
    const next = formatDate(addDays(new Date(y, m - 1, d, 12), 1));
    setActiveDate(next);
  };

  const handleJumpToToday = () => {
    setActiveDate(formatDate(new Date()));
  };

  const handleOpenLog = (trackerId?: string) => {
    setSelectedTrackerId(trackerId || null);
    setQuickLogOpen(true);
  };

  const handleHabitToggle = async (trackerId: string, currentCompleted: boolean) => {
    try {
      const todayStr = activeDate;
      const nextVal = currentCompleted ? 0 : 1;

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackerId,
          date: todayStr,
          value: nextVal,
        }),
      });

      if (res.ok) {
        if (!currentCompleted) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
        fetchDashboard(activeDate);
      }
    } catch (err) {
      console.error("Toggle habit error", err);
    }
  };

  const handleCounterIncrement = async (trackerId: string, incrementBy: number = 1) => {
    try {
      const targetTracker = data?.trackers.find((t) => t.id === trackerId);
      const currentVal = targetTracker?.todayLog?.value ?? 0;

      // Prevent decrementing below zero
      if (incrementBy < 0 && currentVal <= 0) {
        return;
      }

      const todayStr = activeDate;

      // Optimistic instant UI update
      setData((prev) => {
        if (!prev) return prev;
        const updatedTrackers = prev.trackers.map((t) => {
          if (t.id === trackerId) {
            const val = t.todayLog?.value ?? 0;
            const newVal = Math.max(0, val + incrementBy);
            return {
              ...t,
              todayLog: {
                ...(t.todayLog || { id: "temp", notes: null, metadata: null }),
                value: newVal,
              },
            };
          }
          return t;
        });
        return { ...prev, trackers: updatedTrackers };
      });

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackerId,
          date: todayStr,
          value: incrementBy,
          mode: "increment",
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        // Check if goal was just reached (only celebrate on positive increment when crossing target)
        if (
          incrementBy > 0 &&
          targetTracker?.targetValue &&
          resData.log?.value >= targetTracker.targetValue &&
          currentVal < targetTracker.targetValue
        ) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
        fetchDashboard(activeDate);
      }
    } catch (err) {
      console.error("Counter increment error", err);
      fetchDashboard(activeDate);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Loading your fitness dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { efficiency, weeklyTrend, streak, trackers, recentMilestones, pendingMilestones } = data;

  const filteredTrackers =
    dashboardCategory === "All"
      ? trackers
      : trackers.filter((t: any) => t.category === dashboardCategory);

  const calTracker = trackers.find((t: any) => t.systemCode === "CALORIES");
  const proTracker = trackers.find((t: any) => t.systemCode === "PROTEIN");
  const carbTracker = trackers.find((t: any) => t.systemCode === "CARBS");
  const fatTracker = trackers.find((t: any) => t.systemCode === "FAT");
  const weightTracker = trackers.find((t: any) => t.systemCode === "WEIGHT");
  const heightTracker = trackers.find((t: any) => t.systemCode === "HEIGHT");
  const bmiTracker = trackers.find((t: any) => t.systemCode === "BMI");

  // Grade color
  let scoreColor = "text-emerald-400";
  let gradeText = "Exceptional Day!";
  if (efficiency.score < 50) {
    scoreColor = "text-amber-400";
    gradeText = "Getting Started";
  } else if (efficiency.score < 80) {
    scoreColor = "text-cyan-400";
    gradeText = "Strong Consistency!";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5" /> Live Fitness Hub
          </span>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {activeDate === formatDate(new Date()) ? "Today's Overview" : "Daily Overview"}
            </h1>
            {activeDate !== formatDate(new Date()) && (
              <button
                onClick={handleJumpToToday}
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
              >
                Jump to Today
              </button>
            )}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              title="Previous day"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              {formatDisplayDate(activeDate)}
              {activeDate === formatDate(new Date()) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Today
                </span>
              )}
            </span>
            <button
              onClick={handleNextDay}
              disabled={activeDate >= formatDate(new Date())}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next day"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/trackers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-white/5 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            Manage Trackers
          </Link>
          <button
            onClick={() => handleOpenLog()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Quick Log Activity
          </button>
        </div>
      </div>

      {/* KPI Stats Row: Efficiency Score, Active Streak, Active Trackers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Efficiency Gauge Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daily Efficiency Score
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live
            </span>
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className={`text-5xl font-black tracking-tight ${scoreColor}`}>
              {efficiency.score}%
            </span>
            <div>
              <p className="text-sm font-bold text-white">{gradeText}</p>
              <p className="text-xs text-slate-400">
                {efficiency.completedTrackers} of {efficiency.totalTrackers} goals met today
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${Math.max(5, efficiency.score)}%` }}
            />
          </div>
        </div>

        {/* Current Streak Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Streak
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tight">
              {streak}
            </span>
            <span className="text-sm font-bold text-orange-400">
              {streak === 1 ? "day streak" : "consecutive days"}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {streak > 0
              ? "Keep logging daily to protect your flame! 🔥"
              : "Log your first activity today to ignite your streak!"}
          </p>
        </div>

        {/* Weekly Adherence Mini Bar Chart */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              7-Day Adherence
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 rounded-lg bg-slate-900 border border-white/10 text-[11px] font-bold text-white">
                          {payload[0].payload.label}: {payload[0].value}%
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {weeklyTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.score >= 75 ? "#10b981" : entry.score >= 40 ? "#06b6d4" : "#334155"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
            <span>Weekly consistency</span>
            <span className="font-bold text-slate-200">
              {Math.round(weeklyTrend.reduce((a, b) => a + b.score, 0) / weeklyTrend.length)}% avg
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Trackers List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Active Trackers ({filteredTrackers.length})
            </h2>
            <p className="text-xs text-slate-400">
              Tap &apos;Log&apos; or check off habits to update today&apos;s score
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/trackers"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Customize Categories & Cards <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Four Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Nutrition", "Measurements", "Training", "Habits"].map((cat) => {
            const count =
              cat === "All"
                ? trackers.length
                : trackers.filter((t: any) => t.category === cat).length;
            const isActive = dashboardCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setDashboardCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5"
                }`}
              >
                {cat === "Nutrition" && <Utensils className="w-3 h-3" />}
                {cat === "Measurements" && <Scale className="w-3 h-3" />}
                {cat === "Training" && <Dumbbell className="w-3 h-3" />}
                {cat === "Habits" && <Flame className="w-3 h-3" />}
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Nutrition Deep-Dive Macro Widget */}
        {dashboardCategory === "Nutrition" && (
          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-amber-500/5 via-slate-900 to-slate-950 border border-amber-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Daily Macro Distribution</h3>
                  <p className="text-[11px] text-slate-400">
                    Energy intake & macronutrient ratio vs daily targets
                  </p>
                </div>
              </div>

              {calTracker && (
                <button
                  onClick={() => handleOpenLog(calTracker.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Log Meals & Macros
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Calories
                </span>
                <span className="text-2xl font-black text-white">
                  {calTracker?.todayLog?.value ?? 0}
                </span>
                <span className="text-xs text-slate-400 ml-1">/ {calTracker?.targetValue || 2000} kcal</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                  Protein
                </span>
                <span className="text-2xl font-black text-white">
                  {proTracker?.todayLog?.value ?? 0}g
                </span>
                <span className="text-xs text-slate-400 ml-1">/ {proTracker?.targetValue || 140}g</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block mb-1">
                  Carbs
                </span>
                <span className="text-2xl font-black text-white">
                  {carbTracker?.todayLog?.value ?? 0}g
                </span>
                <span className="text-xs text-slate-400 ml-1">/ {carbTracker?.targetValue || 220}g</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider block mb-1">
                  Fat
                </span>
                <span className="text-2xl font-black text-white">
                  {fatTracker?.todayLog?.value ?? 0}g
                </span>
                <span className="text-xs text-slate-400 ml-1">/ {fatTracker?.targetValue || 65}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Body Measurements & BMI Widget */}
        {dashboardCategory === "Measurements" && (
          <div className="glass-panel rounded-3xl p-6 bg-gradient-to-br from-cyan-500/5 via-slate-900 to-slate-950 border border-cyan-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Body Composition & Metrics</h3>
                  <p className="text-[11px] text-slate-400">
                    Weight trends, height, auto-computed BMI & circumferences
                  </p>
                </div>
              </div>

              {weightTracker && (
                <button
                  onClick={() => handleOpenLog(weightTracker.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Log Measurements
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                  Current Weight
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    {weightTracker?.todayLog?.value ? `${weightTracker.todayLog.value} kg` : "—"}
                  </span>
                  {data?.weightComparison && (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        data.weightComparison.delta <= 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {data.weightComparison.delta > 0 ? `+${data.weightComparison.delta}` : data.weightComparison.delta} kg
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                  Height
                </span>
                <span className="text-2xl font-black text-white">
                  {heightTracker?.todayLog?.value || heightTracker?.targetValue || 175} cm
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">
                  Body Mass Index (BMI)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    {bmiTracker?.todayLog?.value ?? "—"}
                  </span>
                  {data?.bmiCategory && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 ${data.bmiCategory.color}`}>
                      {data.bmiCategory.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {filteredTrackers.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center space-y-3">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No active trackers in this category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first custom tracker or configure targets for this category.
            </p>
            <Link
              href="/trackers"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" /> Add Tracker
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredTrackers.map((tracker: any) => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                onQuickLog={(id) => handleOpenLog(id)}
                onDirectToggleHabit={handleHabitToggle}
                onDirectIncrementCounter={handleCounterIncrement}
              />
            ))}
          </div>
        )}
      </div>

      {/* Milestones & Trophy Spotlight */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Milestones & Achievements</h3>
              <p className="text-xs text-slate-400">Your personal fitness trophy room</p>
            </div>
          </div>
          <Link
            href="/milestones"
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            View All Badges <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentMilestones.length > 0 ? (
            recentMilestones.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-slate-900 border border-purple-500/20 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{m.title}</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                      Unlocked
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {m.description}
                  </p>
                </div>
              </div>
            ))
          ) : pendingMilestones.length > 0 ? (
            pendingMilestones.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">{m.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {m.currentValue} / {m.targetValue}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.min(100, (m.currentValue / m.targetValue) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-xs text-slate-400">
              No milestones active yet. Head over to the Milestones page to create custom goalposts!
            </div>
          )}
        </div>
      </div>

      {/* Quick-Log Modal */}
      <QuickLogModal
        isOpen={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onSuccess={() => fetchDashboard(activeDate)}
        trackers={trackers}
        selectedTrackerId={selectedTrackerId}
        selectedDate={activeDate}
      />
    </div>
  );
}

