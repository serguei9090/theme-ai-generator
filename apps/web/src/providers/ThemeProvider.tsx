import type React from "react";
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

function _hexToRgba(hex: string, alpha: number) {
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

import { useChat } from "./chatContext";

export function ThemeProvider({ children, palette }: Props) {
  const { themeMode } = useChat();
  if (!palette) return <>{children}</>;

  const isDark = themeMode === "dark";
  const bgIsLight = luminance(palette.background) > 0.5;

  // We only "flip" if the user-selected mode doesn't match the colors they generated.
  // If they generated a light theme but clicked "Dark", we swap high-level neutrals.
  const needsInversion = (isDark && bgIsLight) || (!isDark && !bgIsLight);

  // Derived Neutral Ramp
  const effectiveBg = needsInversion ? palette.text : palette.background;
  const effectiveText = needsInversion ? palette.background : palette.text;
  const effectiveSurface = needsInversion
    ? mixHex(effectiveBg, effectiveText, 0.05)
    : palette.surface;
  const effectiveSurfaceSecondary = needsInversion
    ? mixHex(effectiveBg, effectiveText, 0.1)
    : palette.surfaceSecondary;
  const effectiveBorder = needsInversion
    ? mixHex(effectiveBg, effectiveText, 0.15)
    : palette.border;

  // Contrast-aware Foreground Selection
  const onPrimary = chooseForeground(palette.primary, palette.onPrimary);
  const onAccent = chooseForeground(palette.accent, palette.onAccent);
  const onPrimaryContainer = chooseForeground(
    palette.primaryContainer,
    palette.onPrimary,
  );
  const onSuccess = chooseForeground(palette.success, "#ffffff");
  const onWarning = chooseForeground(palette.warning, palette.text);
  const onError = chooseForeground(palette.error, "#ffffff");

  const style = {
    // 60-30-10 System Tokens
    "--sys-background": effectiveBg,
    "--sys-surface": effectiveSurface,
    "--sys-surface-secondary": effectiveSurfaceSecondary,
    "--sys-border": effectiveBorder,

    "--sys-primary": palette.primary,
    "--sys-on-primary": onPrimary,
    "--sys-primary-container": palette.primaryContainer,
    "--sys-on-primary-container": onPrimaryContainer,
    "--sys-primary-hover": palette.primaryHover,

    "--sys-accent": palette.accent,
    "--sys-on-accent": onAccent,
    "--sys-accent-hover": palette.accentHover,

    "--sys-success": palette.success,
    "--sys-on-success": onSuccess,
    "--sys-warning": palette.warning,
    "--sys-on-warning": onWarning,
    "--sys-error": palette.error,
    "--sys-on-error": onError,

    // Elevation Aliases (for platform logic)
    "--sys-elevation-bg": effectiveBg,
    "--sys-elevation-card": effectiveSurface,
    "--sys-elevation-sidebar": effectiveSurfaceSecondary,

    // Legacy / Shadcn Fallbacks
    "--background": effectiveBg,
    "--foreground": effectiveText,
    "--card": effectiveSurface,
    "--card-foreground": effectiveText,
    "--popover": effectiveSurface,
    "--popover-foreground": effectiveText,
    "--primary": palette.primary,
    "--primary-foreground": onPrimary,
    "--secondary": effectiveSurfaceSecondary,
    "--secondary-foreground": effectiveText,
    "--muted": effectiveSurfaceSecondary,
    "--muted-foreground": effectiveText,
    "--accent": palette.accent,
    "--accent-foreground": onAccent,
    "--destructive": palette.error,
    "--destructive-foreground": onError,
    "--border": effectiveBorder,
    "--input": effectiveBorder,
    "--ring": palette.primary,

    // Custom Typography tokens (System & Global Aliases)
    "--sys-text": effectiveText,
    "--sys-text-medium": needsInversion
      ? mixHex(effectiveText, effectiveBg, 0.3)
      : palette.textMedium,
    "--sys-text-low": needsInversion
      ? mixHex(effectiveText, effectiveBg, 0.5)
      : palette.textLow,

    "--text": effectiveText,
    "--text-primary": effectiveText,
    "--text-secondary": needsInversion
      ? mixHex(effectiveText, effectiveBg, 0.3)
      : palette.textMedium,
    "--text-tertiary": needsInversion
      ? mixHex(effectiveText, effectiveBg, 0.5)
      : palette.textLow,

    // Accessibility / Contrast-aware Typography
    "--text-on-primary": onPrimary,
    "--text-on-accent": onAccent,
    "--text-white": "#ffffff",
    "--text-inverse": effectiveBg,
  } as React.CSSProperties;

  return (
    <div style={style} className={themeMode}>
      {children}
    </div>
  );
}

export default ThemeProvider;
