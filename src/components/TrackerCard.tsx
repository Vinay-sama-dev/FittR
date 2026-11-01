"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Plus,
  Scale,
  Droplets,
  Heart,
  TrendingUp,
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
  todayLog?: {
    id: string;
    value: number;
    notes: string | null;
    metadata: any;
  } | null;
}

interface TrackerCardProps {
  tracker: Tracker;
  onQuickLog: (trackerId: string) => void;
  onDirectToggleHabit?: (trackerId: string, currentCompleted: boolean) => void;
}

const iconMap: Record<string, any> = {
  Activity,
  Flame,
  Dumbbell,
  Scale,
  Clock,
  Droplets,
  Heart,
  TrendingUp,
};

export function TrackerCard({
  tracker,
  onQuickLog,
  onDirectToggleHabit,
}: TrackerCardProps) {
  const IconComponent = iconMap[tracker.icon] || Activity;
  const loggedValue = tracker.todayLog?.value ?? null;
  const isLogged = loggedValue !== null && loggedValue !== undefined;

  // Calculate percentage toward target
  let percentage = 0;
  let isTargetMet = false;

  if (tracker.type === "HABIT") {
    isTargetMet = isLogged && loggedValue >= 1;
    percentage = isTargetMet ? 100 : 0;
  } else if (tracker.targetValue && tracker.targetValue > 0) {
    if (isLogged) {
      percentage = Math.min(100, Math.round((loggedValue / tracker.targetValue) * 100));
      isTargetMet = loggedValue >= tracker.targetValue;
    }
  } else if (isLogged && loggedValue > 0) {
    percentage = 100;
    isTargetMet = true;
  }

  return (
    <div className="glass-card rounded-2xl p-5 transition-all hover:translate-y-[-2px] flex flex-col justify-between group">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
              style={{
                backgroundColor: `${tracker.color}15`,
                color: tracker.color,
                border: `1px solid ${tracker.color}30`,
              }}
            >
              <IconComponent className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {tracker.name}
              </h4>
              <span className="text-[11px] font-medium text-slate-400 capitalize">
                {tracker.category} • {tracker.type.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {isTargetMet ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Done
            </span>
          ) : isLogged ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Logged
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
              Pending
            </span>
          )}
        </div>

        {/* Value Display */}
        <div className="mt-3 mb-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">
              {isLogged ? loggedValue : "—"}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {tracker.unit || (tracker.type === "HABIT" ? "done" : "")}
            </span>
            {tracker.targetValue && (
              <span className="text-xs text-slate-500 ml-auto">
                Goal: <strong className="text-slate-300">{tracker.targetValue}</strong>{" "}
                {tracker.unit}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800/80 mt-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: tracker.color,
                boxShadow: `0 0 8px ${tracker.color}60`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {tracker.todayLog?.notes ? `"${tracker.todayLog.notes}"` : "Today"}
        </span>

        {tracker.type === "HABIT" && onDirectToggleHabit ? (
          <button
            onClick={() => onDirectToggleHabit(tracker.id, isTargetMet)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isTargetMet
                ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300"
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            {isTargetMet ? "Completed" : "Mark Done"}
          </button>
        ) : (
          <button
            onClick={() => onQuickLog(tracker.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {isLogged ? "Update" : "Log"}
          </button>
        )}
      </div>
    </div>
  );
}
