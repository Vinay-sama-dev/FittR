"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Activity,
  Edit2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { QuickLogModal } from "@/components/QuickLogModal";

interface DayLog {
  id: string;
  date: string;
  value: number;
  notes: string | null;
  tracker: {
    id: string;
    name: string;
    type: string;
    unit: string | null;
    color: string;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [logs, setLogs] = useState<DayLog[]>([]);
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logModalOpen, setLogModalOpen] = useState(false);

  const fetchDayData = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?date=${dateStr}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error("Fetch day logs error", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDayData(selectedDate);

    fetch("/api/trackers")
      .then((res) => res.json())
      .then((d) => setTrackers(d.trackers || []))
      .catch(() => {});
  }, [selectedDate, fetchDayData]);

  const changeDateByDays = (delta: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + delta);
    setSelectedDate(formatDate(dateObj));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-1">
            <CalendarIcon className="w-3.5 h-3.5" /> Historical Logbook
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Activity Timeline & Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Inspect past daily achievements or backfill missed entries
          </p>
        </div>

        <button
          onClick={() => setLogModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Log for this Day
        </button>
      </div>

      {/* Date Navigation Bar */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
        <button
          onClick={() => changeDateByDays(-1)}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <ChevronLeft className="w-4 h-4" /> Previous Day
        </button>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            max={formatDate(new Date())}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-950 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          onClick={() => changeDateByDays(1)}
          disabled={selectedDate >= formatDate(new Date())}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/5 transition-colors flex items-center gap-1 text-xs font-bold disabled:opacity-30 disabled:pointer-events-none"
        >
          Next Day <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day Logs List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center justify-between">
          <span>Entries for {selectedDate}</span>
          <span className="text-xs font-normal text-slate-400">
            {logs.length} activities recorded
          </span>
        </h2>

        {loading ? (
          <div className="text-xs text-slate-400 py-8">Loading history...</div>
        ) : logs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-3">
            <Activity className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No logs recorded for this day</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven&apos;t logged any workouts, habits, or metrics for {selectedDate}.
            </p>
            <button
              onClick={() => setLogModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              <Plus className="w-4 h-4" /> Backfill Activity Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="glass-card rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: `${log.tracker.color}20`,
                          color: log.tracker.color,
                          border: `1px solid ${log.tracker.color}40`,
                        }}
                      >
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">
                          {log.tracker.name}
                        </h3>
                        <span className="text-[11px] text-slate-400">
                          {log.tracker.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Logged Value:</span>
                    <span className="text-xl font-black text-white">
                      {log.value}{" "}
                      <span className="text-xs font-semibold text-slate-400">
                        {log.tracker.unit || ""}
                      </span>
                    </span>
                  </div>

                  {log.notes && (
                    <p className="mt-3 text-xs text-slate-400 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                      &quot;{log.notes}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick-Log Modal with selected date prefilled */}
      <QuickLogModal
        isOpen={logModalOpen}
        onClose={() => setLogModalOpen(false)}
        onSuccess={() => fetchDayData(selectedDate)}
        trackers={trackers}
        selectedDate={selectedDate}
      />
    </div>
  );
}

