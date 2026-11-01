"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity,
  LayoutDashboard,
  SlidersHorizontal,
  Trophy,
  FileBarChart2,
  Calendar,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Only check user if not on login/signup page
    if (pathname === "/login" || pathname === "/signup") return;

    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  if (pathname === "/login" || pathname === "/signup") {
    return null; // Clean auth page without navigation clutter
  }

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trackers", label: "Trackers", icon: SlidersHorizontal },
    { href: "/milestones", label: "Milestones", icon: Trophy },
    { href: "/reports", label: "Reports & Export", icon: FileBarChart2 },
    { href: "/history", label: "History", icon: Calendar },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              Fitt<span className="text-emerald-400">R</span>
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-emerald-400 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side: User Profile & Logout */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    pathname === "/profile"
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold"
                      : "bg-slate-900 border-white/5 text-slate-300 hover:border-emerald-500/30 hover:text-white hover:bg-slate-800"
                  }`}
                  title="View Profile & Settings"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200">{user.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-lg shadow-emerald-600/20"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/5 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          {user ? (
            <div className="pt-3 border-t border-white/10 flex items-center justify-between px-3">
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                <UserIcon className="w-4 h-4" />
                {user.name} (View Profile)
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-rose-400 hover:text-rose-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

