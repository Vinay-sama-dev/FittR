"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in");
      }

      setIsSuccess(true);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      setLoading(false);
    }
  };

  // P0 & P1: Secure server-side demo authentication with rate limiting
  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to launch demo mode");
      }

      setIsSuccess(true);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Demo login failed");
    } finally {
      setDemoLoading(false);
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
            Welcome to Fitt<span className="text-emerald-400">R</span>
          </h1>
          {/* P2 UX: Concrete Value Statement */}
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Build lasting fitness habits, track custom metrics, and measure daily efficiency — all in one private dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* P2 Accessibility: aria-live region for error feedback */}
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
                <span className="font-semibold">Login successful! Redirecting to your dashboard...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
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
              {/* P0 UX: Forgot Password adjacent to password field */}
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-slate-300"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-medium focus-visible:ring-1 focus-visible:ring-emerald-400 rounded transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* P0 UX: Password visibility toggle with full WCAG ARIA */}
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
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

            {/* P1 UX: Clear submission states (loading spinner / text) */}
            <button
              type="submit"
              disabled={loading || demoLoading || isSuccess}
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
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Section (P1: Disclaimer, P2: Dedicated loading state) */}
          <div className="mt-5 pt-5 border-t border-white/5 space-y-2.5">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading || demoLoading || isSuccess}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
            >
              {demoLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                  <span>Launching Demo (Read-Only Sandbox)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Explore Demo (Instant Access)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              Explore with a shared demo account — please do not enter personal data. To track your own fitness,{" "}
              <Link
                href="/signup"
                className="text-emerald-400 hover:underline font-medium focus-visible:ring-1 focus-visible:ring-emerald-400 rounded"
              >
                create a free account
              </Link>.
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors focus-visible:ring-1 focus-visible:ring-emerald-400 rounded"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
