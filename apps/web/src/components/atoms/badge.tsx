"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-text",
        secondary: "border-transparent bg-secondary/20 text-text",
        accent: "border-transparent bg-accent/20 text-text",
        outline: "border-border bg-background text-text-secondary",
        success: "border-transparent bg-success/20 text-text",
        warning: "border-transparent bg-warning/20 text-text",
        error: "border-transparent bg-error/20 text-text",
        destructive: "border-transparent bg-destructive/15 text-destructive",

        // High Contrast variants
        primary:
          "border-transparent bg-[var(--sys-primary)] text-[var(--sys-on-primary)]",
        "primary-accent":
          "border-transparent bg-[var(--sys-accent)] text-[var(--sys-on-accent)]",
        "primary-success":
          "border-transparent bg-[var(--sys-success)] text-[var(--sys-on-success)]",

        // Context-aware variants (for headers/colored containers)
        "outline-on-dark":
          "border-[var(--sys-on-primary)]/40 bg-[var(--sys-on-primary)]/10 text-[var(--sys-on-primary)]",
        "outline-on-primary-container":
          "border-[var(--sys-on-primary-container)]/30 bg-[var(--sys-on-primary-container)]/10 text-[var(--sys-on-primary-container)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
