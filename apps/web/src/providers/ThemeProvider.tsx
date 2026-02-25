import React from "react";
import type { Palette } from "../lib/mcpClient";

type Props = {
  children: React.ReactNode;
  palette: Palette;
};

function parseHex(hex: string) {
  const value = hex.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(value)) return null;
  return {
    r: Number.parseInt(value.slice(1, 3), 16),
    g: Number.parseInt(value.slice(3, 5), 16),
    b: Number.parseInt(value.slice(5, 7), 16),
  };
}

function hexToRgba(hex: string, alpha: number) {
  const parsed = parseHex(hex);
  if (!parsed) return `rgba(36, 41, 47, ${alpha})`;
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${alpha})`;
}

function linearizedChannel(value: number) {
  const normalized = value / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const parsed = parseHex(hex);
  if (!parsed) return 0;
  return (
    0.2126 * linearizedChannel(parsed.r) +
    0.7152 * linearizedChannel(parsed.g) +
    0.0722 * linearizedChannel(parsed.b)
  );
}

function contrastRatio(a: string, b: string) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function chooseForeground(background: string, preferredText: string) {
  const preferred = parseHex(preferredText) ? preferredText : "#24292f";
  if (contrastRatio(background, preferred) >= 4.5) return preferred;

  const white = "#ffffff";
  const black = "#111827";
  return contrastRatio(background, white) >= contrastRatio(background, black)
    ? white
    : black;
}

function mixHex(base: string, tint: string, amount: number) {
  const baseRgb = parseHex(base);
  const tintRgb = parseHex(tint);
  if (!baseRgb || !tintRgb) return base;
  const clampAmount = Math.max(0, Math.min(1, amount));
  const blend = (from: number, to: number) =>
    Math.round(from + (to - from) * clampAmount)
      .toString(16)
      .padStart(2, "0");
  return `#${blend(baseRgb.r, tintRgb.r)}${blend(baseRgb.g, tintRgb.g)}${blend(
    baseRgb.b,
    tintRgb.b,
  )}`;
}

export function ThemeProvider({ children, palette }: Props) {
  React.useEffect(() => {
    if (!palette) return;
    const root = document.documentElement;
    const onPrimary = chooseForeground(palette.primary, palette.text);
    const onSecondary = chooseForeground(palette.secondary, palette.text);
    const onAccent = chooseForeground(palette.accent, palette.text);
    const surface = mixHex(palette.background, palette.text, 0.04);
    const border = hexToRgba(palette.text, 0.18);

    root.style.setProperty("--color-primary", palette.primary);
    root.style.setProperty("--color-secondary", palette.secondary);
    root.style.setProperty("--color-accent", palette.accent);
    root.style.setProperty("--color-background", palette.background);
    root.style.setProperty("--color-text", palette.text);
    root.style.setProperty("--primary", palette.primary);
    root.style.setProperty("--secondary", palette.secondary);
    root.style.setProperty("--accent", palette.accent);
    root.style.setProperty("--background", palette.background);
    root.style.setProperty("--foreground", palette.text);
    root.style.setProperty("--surface", surface);
    root.style.setProperty("--text", palette.text);
    root.style.setProperty("--primary-foreground", onPrimary);
    root.style.setProperty("--secondary-foreground", onSecondary);
    root.style.setProperty("--accent-foreground", onAccent);
    root.style.setProperty("--muted", surface);
    root.style.setProperty("--card", palette.background);
    root.style.setProperty("--card-foreground", palette.text);
    root.style.setProperty("--popover", palette.background);
    root.style.setProperty("--popover-foreground", palette.text);
    root.style.setProperty("--border", border);
    root.style.setProperty("--input", border);
    root.style.setProperty("--text-secondary", hexToRgba(palette.text, 0.72));
    root.style.setProperty("--text-tertiary", hexToRgba(palette.text, 0.56));
  }, [palette]);

  return <>{children}</>;
}

export default ThemeProvider;
