import type React from "react";
import { Badge } from "../atoms/badge";
import { Button, type ButtonProps } from "../atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../atoms/card";

export type MetricItem = {
  label: string;
  value: string;
  trend?: string;
  tone?: "default" | "secondary" | "accent" | "success" | "warning" | "error";
};

export type ActionItem = {
  label: string;
  variant?: ButtonProps["variant"];
};

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  status?: string;
  statusTone?:
    | "default"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "outline";
};

export type ScreenPattern = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
};

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
};

export function MockSectionTitle({
  eyebrow,
  title,
  description,
  trailing,
}: Readonly<SectionTitleProps>) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--sys-text-medium)]">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-1 text-base font-semibold text-[var(--sys-text)]">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-[var(--sys-text-medium)]">
            {description}
          </p>
        )}
      </div>
      {trailing}
    </div>
  );
}

type MetricGridProps = {
  metrics: MetricItem[];
  className?: string;
};

export function MetricGrid({ metrics, className }: Readonly<MetricGridProps>) {
  return (
    <div
      className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${className || ""}`}
    >
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-lg">{metric.value}</CardTitle>
          </CardHeader>
          {metric.trend && (
            <CardContent>
              <Badge variant={metric.tone || "default"}>{metric.trend}</Badge>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

type ActionRowProps = {
  actions: ActionItem[];
  className?: string;
};

export function ActionRow({ actions, className }: Readonly<ActionRowProps>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant || "default"}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

type PhoneFrameProps = {
  statusTime: string;
  label: string;
  children: React.ReactNode;
};

export function PhoneFrame({
  statusTime,
  label,
  children,
}: Readonly<PhoneFrameProps>) {
  return (
    <article className="mx-auto w-full max-w-[230px] rounded-[28px] border border-[var(--sys-border)] bg-[var(--sys-elevation-card)] p-2 shadow-sm transition-transform active:scale-[0.98]">
      <div className="rounded-[22px] border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-2">
        <div className="flex items-center justify-between px-1 text-[10px] text-[var(--sys-text-medium)]">
          <span>{statusTime}</span>
          <span>{label}</span>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </article>
  );
}

type ColorPillProps = {
  label: string;
  colorVar: string;
  onColorVar: string;
  className?: string;
};

export function ColorPill({
  label,
  colorVar,
  onColorVar,
  className,
}: Readonly<ColorPillProps>) {
  return (
    <div
      className={`group relative flex items-center justify-between gap-2 rounded-full border border-[var(--sys-border)] px-3 py-1.5 transition-all hover:scale-105 active:scale-95 ${className || ""}`}
      style={{
        backgroundColor: `var(${colorVar})`,
        color: `var(${onColorVar})`,
      }}
    >
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
      <div className="h-1.5 w-1.5 rounded-full bg-current opacity-30 group-hover:animate-ping" />
      <div className="absolute inset-0 pointer-events-none rounded-full bg-white/0 transition-colors group-hover:bg-white/10" />
    </div>
  );
}

type PulseIndicatorProps = {
  tone: "primary" | "success" | "warning" | "error";
  label?: string;
  className?: string;
};

export function PulseIndicator({
  tone,
  label,
  className,
}: Readonly<PulseIndicatorProps>) {
  const colorMap = {
    primary: "var(--sys-primary)",
    success: "var(--sys-success)",
    warning: "var(--sys-warning)",
    error: "var(--sys-error)",
  };

  const color = colorMap[tone];

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div className="relative flex h-2 w-2">
        <div
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: color }}
        />
        <div
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      {label && (
        <span className="text-[10px] font-medium text-[var(--sys-text-medium)]">
          {label}
        </span>
      )}
    </div>
  );
}
