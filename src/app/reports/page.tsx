"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileBarChart2,
  Download,
  Calendar,
  Filter,
  Printer,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  TrendingUp,
  Activity,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface Tracker {
  id: string;
  name: string;
}

interface ReportData {
  range: string;
  rangeLabel: string;
  startDate: string;
  endDate: string;
  totalDaysLogged: number;
  averageEfficiency: number;
  efficiencyHistory: Array<{ date: string; score: number }>;
  trackerSummaries: Array<{
    id: string;
    name: string;
    category: string;
    type: string;
    unit: string;
    targetValue: number | null;
    totalLogged: number;
    firstValue: number | null;
    latestValue: number | null;
    delta: number;
    averageValue: number;
    maxValue: number;
    minValue: number;
    targetMetDays: number;
    completionRate: number;
  }>;
  achievedMilestones: Array<{
    id: string;
    title: string;
    description: string | null;
    achievedAt: string;
  }>;
  logs: Array<{
    id: string;
    date: string;
    value: number;
    notes: string | null;
    tracker: { name: string; unit: string | null };
  }>;
}

export default function ReportsPage() {
  const router = useRouter();
  const [range, setRange] = useState<string>("weekly");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [availableTrackers, setAvailableTrackers] = useState<Tracker[]>([]);
  const [selectedTrackers, setSelectedTrackers] = useState<string[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch trackers for filter
  useEffect(() => {
    fetch("/api/trackers")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.trackers) {
          setAvailableTrackers(data.trackers);
        }
      })
      .catch(() => {});
  }, [router]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("range", range);
      if (range === "custom" && customStart && customEnd) {
        params.set("startDate", customStart);
        params.set("endDate", customEnd);
      }
      if (selectedTrackers.length > 0) {
        params.set("trackers", selectedTrackers.join(","));
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Report fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [range, customStart, customEnd, selectedTrackers, router]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadCSV = () => {
    const params = new URLSearchParams();
    params.set("range", range);
    params.set("format", "csv");
    if (range === "custom" && customStart && customEnd) {
      params.set("startDate", customStart);
      params.set("endDate", customEnd);
    }
    if (selectedTrackers.length > 0) {
      params.set("trackers", selectedTrackers.join(","));
    }

    window.open(`/api/reports?${params.toString()}`, "_blank");
  };

  const handleDownloadJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fittr-report-${report.range}-${report.startDate}-to-${report.endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const toggleTrackerFilter = (id: string) => {
    if (selectedTrackers.includes(id)) {
      setSelectedTrackers(selectedTrackers.filter((t) => t !== id));
    } else {
      setSelectedTrackers([...selectedTrackers, id]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header (Hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
            <FileBarChart2 className="w-3.5 h-3.5" /> Analytics & Reports
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Download & Custom Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Generate and export tailored fitness performance reports in PDF, CSV, or JSON
          </p>
        </div>

        {/* Download Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            <Printer className="w-4 h-4" />
            Download PDF Report
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Download CSV
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-white/5 text-xs transition-all"
            title="Download JSON Backup"
          >
            <FileCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Filter Toolbar (Hidden on print) */}
      <div className="no-print glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-white/5">
            {[
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
              { id: "quarterly", label: "Quarterly" },
              { id: "custom", label: "Custom Range" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRange(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === tab.id
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {range === "custom" && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>From</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>To</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/10 text-white text-xs"
                />
              </div>
              <button
                onClick={fetchReport}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        {/* Tracker Filter Multi-Select Pills */}
        {availableTrackers.length > 0 && (
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Include Trackers:
            </span>
            <button
              onClick={() => setSelectedTrackers([])}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                selectedTrackers.length === 0
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-slate-900 text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              All Trackers
            </button>
            {availableTrackers.map((t) => {
              const active = selectedTrackers.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTrackerFilter(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                    active
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-slate-900 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Printable Report Document Body */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">
          Generating fitness report...
        </div>
      ) : !report ? (
        <div className="text-center py-16 text-xs text-slate-400">
          No report data found.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-6 sm:p-10 space-y-8 bg-slate-950/90 border border-white/10 shadow-2xl printable-document">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-black text-white">
                  Fitt<span className="text-emerald-400">R</span>
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase">
                  Official Fitness Report
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-200">{report.rangeLabel}</h2>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>
                Period: <strong className="text-white">{report.startDate}</strong> to{" "}
                <strong className="text-white">{report.endDate}</strong>
              </p>
              <p className="mt-0.5">
                Generated: {new Date().toLocaleDateString()} at{" "}
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Executive Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Average Daily Efficiency
              </span>
              <p className="text-3xl font-black text-emerald-400 mt-2">
                {report.averageEfficiency}%
              </p>
              <span className="text-[11px] text-slate-500">Across logged days in timeframe</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Days Actively Logged
              </span>
              <p className="text-3xl font-black text-white mt-2">
                {report.totalDaysLogged}
              </p>
              <span className="text-[11px] text-slate-500">Unique days with entries</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase">
                Trackers Analyzed
              </span>
              <p className="text-3xl font-black text-cyan-400 mt-2">
                {report.trackerSummaries.length}
              </p>
              <span className="text-[11px] text-slate-500">Active metrics in scope</span>
            </div>
          </div>

          {/* Efficiency Trend Line Chart (if entries exist) */}
          {report.efficiencyHistory.length > 1 && (
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Efficiency Score Progression
              </h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.efficiencyHistory}>
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2 rounded-lg bg-slate-900 border border-white/10 text-xs font-bold text-white">
                              {payload[0].payload.date}: {payload[0].value}% Score
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tracker Performance Breakdown Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Tracker Performance & Deltas
            </h3>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Tracker</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5 text-center">Entries</th>
                    <th className="p-3.5 text-right">Start</th>
                    <th className="p-3.5 text-right">Latest</th>
                    <th className="p-3.5 text-right">Delta (Change)</th>
                    <th className="p-3.5 text-right">Average</th>
                    <th className="p-3.5 text-right">Target Met %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.trackerSummaries.map((ts) => (
                    <tr key={ts.id} className="hover:bg-white/[0.02]">
                      <td className="p-3.5 font-bold text-white">{ts.name}</td>
                      <td className="p-3.5 text-slate-400">{ts.category}</td>
                      <td className="p-3.5 text-slate-400">
                        {ts.targetValue ? `${ts.targetValue} ${ts.unit}` : "Flexible"}
                      </td>
                      <td className="p-3.5 text-center font-bold">{ts.totalLogged}</td>
                      <td className="p-3.5 text-right font-medium text-slate-300">
                        {ts.firstValue !== null ? `${ts.firstValue} ${ts.unit}` : "—"}
                      </td>
                      <td className="p-3.5 text-right font-bold text-white">
                        {ts.latestValue !== null ? `${ts.latestValue} ${ts.unit}` : "—"}
                      </td>
                      <td className="p-3.5 text-right font-bold">
                        <span
                          className={
                            ts.delta > 0
                              ? "text-emerald-400"
                              : ts.delta < 0
                              ? "text-cyan-400"
                              : "text-slate-400"
                          }
                        >
                          {ts.delta > 0 ? `+${ts.delta}` : ts.delta} {ts.unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-300">
                        {ts.averageValue} {ts.unit}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        {ts.completionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Achieved Milestones in this period (if any) */}
          {report.achievedMilestones.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" /> Milestones Unlocked During This Period
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.achievedMilestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-3 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-white">{m.title}</h4>
                      <p className="text-[11px] text-slate-400">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Activity Log Table */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Activity Log History ({report.logs.length} entries)
            </h3>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 sticky top-0 text-slate-400 font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Tracker</th>
                    <th className="p-3">Logged Value</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 text-slate-400">{log.date}</td>
                      <td className="p-3 font-semibold text-white">{log.tracker.name}</td>
                      <td className="p-3 font-bold text-emerald-400">
                        {log.value} {log.tracker.unit || ""}
                      </td>
                      <td className="p-3 text-slate-400">{log.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
