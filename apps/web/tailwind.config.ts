import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: ['"SF Mono"', "Monaco", '"Roboto Mono"', "monospace"],
      },
      colors: {
        // GitHub-inspired palette
        primary: "#0969da",
        "primary-hover": "#0860ca",
        "primary-active": "#033d8b",
        secondary: "#6366f1",
        accent: "#0ea5e9",
        background: "#ffffff",
        surface: "#f6f8fa",
        border: "#d0d7de",
        "border-hover": "#b1bac4",
        text: "#24292f",
        "text-secondary": "#57606a",
        "text-tertiary": "#8c959f",
        success: "#1a7f0f",
        warning: "#9e6a03",
        danger: "#cf222e",
      },
      spacing: {
        "0.5": "0.125rem",
        "1.5": "0.375rem",
        "2.5": "0.625rem",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
