"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setIsSuccess(true);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Sign up failed");
      setLoading(false);
    }
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
            Create Your Account
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Start tracking custom fitness metrics, daily habits, and milestones with full data privacy.
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* P2 Accessibility: aria-live region */}
          <div aria-live="polite" aria-atomic="true">
            {error && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {isSuccess && (
              <div
                role="status"
                className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-semibold">Account created! Redirecting to your dashboard...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="Create a secure password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isSuccess}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
            >
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Success! Redirecting...</span>
                </>
              ) : loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:ring-1 focus-visible:ring-emerald-400 rounded"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
