import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        foreground: "#f8fafc",
        card: {
          DEFAULT: "rgba(15, 23, 42, 0.75)",
          foreground: "#f8fafc",
        },
        border: "rgba(255, 255, 255, 0.08)",
        primary: {
          DEFAULT: "#10b981", // Emerald 500
          foreground: "#ffffff",
          glow: "rgba(16, 185, 129, 0.35)",
        },
        accent: {
          DEFAULT: "#06b6d4", // Cyan 500
          foreground: "#ffffff",
          glow: "rgba(6, 182, 212, 0.35)",
        },
        purple: {
          DEFAULT: "#8b5cf6",
          glow: "rgba(139, 92, 246, 0.35)",
        },
        orange: {
          DEFAULT: "#f97316",
          glow: "rgba(249, 115, 22, 0.35)",
        },
        muted: {
          DEFAULT: "#1e293b",
          foreground: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
