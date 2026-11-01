"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate recovery request submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 700);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#080c14] to-[#080c14]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-7 h-7 text-emerald-400 stroke-[2.5]" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recover access to your personal fitness records
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-bold text-white">Check Your Inbox</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, password reset instructions have been dispatched.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-400 text-left flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  As the primary host, you can also update your credentials anytime directly via your Supabase project dashboard.
                </span>
              </div>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your registered email address and we&apos;ll send you instructions to recover your account.
              </p>

              <div>
                <label htmlFor="recovery-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
              >
                {loading ? "Sending Instructions..." : "Send Reset Link"}
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
