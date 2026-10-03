import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#0b0b0c",
          subtle: "#121214",
        },
        card: {
          DEFAULT: "#161618",
          hover: "#1a1a1d",
          border: "rgba(255, 255, 255, 0.08)",
          "border-hover": "rgba(255, 255, 255, 0.16)",
        },
        surface: {
          DEFAULT: "#1e1e22",
          hover: "#26262b",
          border: "rgba(255, 255, 255, 0.12)",
        },
        // Border scale: two resting strengths, plus one for hover
        line: {
          subtle: "rgba(255, 255, 255, 0.06)",
          DEFAULT: "rgba(255, 255, 255, 0.10)",
          strong: "rgba(255, 255, 255, 0.16)",
        },
        brand: {
          DEFAULT: "#4f46e5",
          hover: "#4338ca",
          light: "#818cf8",
          glow: "rgba(99, 102, 241, 0.18)",
        },
        operational: {
          DEFAULT: "#10b981",
          glow: "rgba(16, 185, 129, 0.2)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          hover: "#dc2626",
          glow: "rgba(239, 68, 68, 0.18)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Outfit",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      animation: {
        "shimmer": "shimmer 2.5s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
        "accordion-down": "accordion-down 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        spotlight: {
          "0%": {
            opacity: "0",
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
