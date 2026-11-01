"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Award,
  Plus,
  Flame,
  CheckCircle2,
  Trash2,
  X,
  Target,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  category: string;
  isAchieved: boolean;
  achievedAt: string | null;
  icon: string;
  tracker?: {
    id: string;
    name: string;
    unit: string | null;
  } | null;
}

export default function MilestonesPage() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [trackers, setTrackers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [trackerId, setTrackerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch("/api/milestones");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setMilestones(data.all || []);
    } catch (err) {
      console.error("Milestones fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchMilestones();

    fetch("/api/trackers")
      .then((res) => res.json())
      .then((data) => setTrackers(data.trackers || []))
      .catch(() => {});
  }, [fetchMilestones]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          targetValue: parseFloat(targetValue),
          trackerId: trackerId || undefined,
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setTargetValue("");
        setTrackerId("");
        fetchMilestones();
      }
    } catch (err) {
      console.error("Create milestone error", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this milestone?")) return;
    try {
      await fetch(`/api/milestones?id=${id}`, { method: "DELETE" });
      fetchMilestones();
    } catch (err) {
      console.error("Delete milestone error", err);
    }
  };

  const unlocked = milestones.filter((m) => m.isAchieved);
  const inProgress = milestones.filter((m) => !m.isAchieved);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5" /> Achievement Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Milestones & Trophy Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Celebrate personal records, workout consistency, and long-term milestones
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Set Custom Goalpost
        </button>
      </div>

      {/* Unlocked Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            Unlocked Achievements ({unlocked.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 py-6">Loading trophy room...</div>
        ) : unlocked.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-400">
            No trophies unlocked yet. Keep logging your daily workouts and habits!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((m) => (
              <div
                key={m.id}
                className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Achieved
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-4">{m.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Unlocked:{" "}
                    {m.achievedAt
                      ? new Date(m.achievedAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    title="Remove Badge"
                    className="p-1 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-Progress Goalposts */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <h2 className="text-base font-bold text-white">
            In-Progress Targets ({inProgress.length})
          </h2>
        </div>

        {inProgress.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-slate-400">
            No active targets remaining. Set a new milestone goal to challenge yourself!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((m) => {
              const progress = Math.min(100, Math.round((m.currentValue / m.targetValue) * 100));
              return (
                <div key={m.id} className="glass-card rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                        <Award className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-purple-400">
                        {progress}%
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-3">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-medium">
                        <span>Progress</span>
                        <span>
                          {m.currentValue} / {m.targetValue}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Set Custom Milestone Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/50">
              <h3 className="text-base font-bold text-white">Create Custom Fitness Goal</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100kg Bench Press, Run 50km this month"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Motivation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dedicated strength training target"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Goal Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 100"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Linked Tracker (Optional)
                  </label>
                  <select
                    value={trackerId}
                    onChange={(e) => setTrackerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="">General / All Trackers</option>
                    {trackers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-500 hover:bg-purple-400 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Set Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
