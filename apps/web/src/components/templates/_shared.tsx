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
  tone?: "default" | "secondary" | "accent" | "success";
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
  statusTone?: "default" | "secondary" | "accent" | "success" | "outline";
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
}: SectionTitleProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">
            {eyebrow}
          </p>
        )}
        <h3 className="mt-1 text-base font-semibold text-text">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-text-secondary">{description}</p>
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

export function MetricGrid({ metrics, className }: MetricGridProps) {
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

export function ActionRow({ actions, className }: ActionRowProps) {
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

export function PhoneFrame({ statusTime, label, children }: PhoneFrameProps) {
  return (
    <article className="mx-auto w-full max-w-[230px] rounded-[28px] border border-border bg-white p-2 shadow-sm">
      <div className="rounded-[22px] border border-border bg-background p-2">
        <div className="flex items-center justify-between px-1 text-[10px] text-text-secondary">
          <span>{statusTime}</span>
          <span>{label}</span>
        </div>
        <div className="mt-2">{children}</div>
      </div>
    </article>
  );
}
