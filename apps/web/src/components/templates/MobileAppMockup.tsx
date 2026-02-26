"use client";

import { Avatar, AvatarFallback } from "../atoms/avatar";
import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import { Card, CardContent } from "../atoms/card";
import { Progress } from "../atoms/progress";
import {
  ColorPill,
  PhoneFrame,
  PulseIndicator,
  type ScreenPattern,
} from "./_shared";

const SCREEN_PATTERNS: ScreenPattern[] = [
  {
    id: "profile",
    title: "Profile Dashboard",
    subtitle: "Creator metrics and content buckets",
    cta: "View Portfolio",
  },
  {
    id: "styleguide",
    title: "Project Tokens",
    subtitle: "Verified architectural palette",
    cta: "Export Theme",
  },
  {
    id: "home",
    title: "Engagement Overview",
    subtitle: "Real-time user feedback",
    cta: "See Details",
  },
  {
    id: "wallet",
    title: "Wallet & Support",
    subtitle: "Balance and transactions",
    cta: "Open Support",
  },
];

const TIMES = ["9:41", "10:30", "11:18", "12:02"];

export default function MobileAppMockup() {
  return (
    <div className="w-full rounded-xl border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-4 text-[var(--sys-text)]">
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SCREEN_PATTERNS.map((screen, idx) => (
          <PhoneFrame
            key={screen.id}
            statusTime={TIMES[idx]}
            label={screen.id.charAt(0).toUpperCase() + screen.id.slice(1)}
          >
            <div className="space-y-3">
              <Card className="border-0 bg-[var(--sys-primary)] text-[var(--sys-on-primary)] shadow-sm transition-transform active:scale-[0.98]">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-[var(--sys-on-primary)]/10 text-[var(--sys-on-primary)] border border-[var(--sys-on-primary)]/20 shadow-inner">
                          {screen.id === "profile" ? "MH" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold leading-none">
                          {screen.title}
                        </p>
                        <p className="mt-1 text-[9px] text-[var(--sys-on-primary)] opacity-80 leading-tight">
                          {screen.subtitle}
                        </p>
                      </div>
                    </div>
                    {screen.id === "styleguide" && (
                      <PulseIndicator
                        tone="primary"
                        className="bg-[var(--sys-on-primary)]/20 p-1 rounded-full"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {screen.id === "styleguide" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <ColorPill
                    label="Primary"
                    colorVar="--sys-primary"
                    onColorVar="--sys-on-primary"
                  />
                  <ColorPill
                    label="Accent"
                    colorVar="--sys-accent"
                    onColorVar="--sys-on-accent"
                  />
                  <ColorPill
                    label="Success"
                    colorVar="--sys-success"
                    onColorVar="--sys-on-success"
                  />
                  <ColorPill
                    label="Error"
                    colorVar="--sys-error"
                    onColorVar="--text-white"
                  />
                  <div className="col-span-2 mt-1 rounded-lg bg-[var(--sys-primary-container)]/10 p-2 text-[9px] text-[var(--sys-primary)] flex items-center gap-2 border border-[var(--sys-primary)]/20">
                    <div className="h-1 w-1 rounded-full bg-current animate-pulse" />
                    <span>Dynamic AA/AAA Contrast Pass</span>
                  </div>
                </div>
              )}

              {screen.id === "home" && (
                <Card className="border-[var(--sys-border)] bg-[var(--sys-elevation-card)] transition-all active:scale-[0.98] hover:border-[var(--sys-primary)]/40">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold">
                        Trend Analysis
                      </span>
                      <Badge variant="success" className="h-4 px-1 text-[8px]">
                        +12%
                      </Badge>
                    </div>
                    <div className="flex h-10 items-end justify-between gap-1 overflow-hidden rounded bg-[var(--sys-primary-container)]/10 p-1">
                      {[40, 60, 45, 80, 55, 95].map((h, i) => (
                        <div
                          key={`trend-bar-${i}-${h}`}
                          className="w-full rounded-t-sm bg-[var(--sys-primary)]/40 transition-all hover:bg-[var(--sys-primary)]"
                          style={{ height: `${h}%` }}
                        >
                          {i === 5 && (
                            <div className="h-1 w-full bg-[var(--sys-primary)] animate-pulse" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {screen.id === "profile" && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SCREEN_PATTERNS.map((p) => (
                    <div
                      key={`${p.id}-mini`}
                      className="space-y-1 group relative aspect-square overflow-hidden rounded-lg border border-[var(--sys-border)] bg-[var(--sys-elevation-sidebar)] transition-all active:scale-95"
                    >
                      <div
                        className={`absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40 bg-[var(--sys-primary)]`}
                      />
                      <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white bg-green-500 shadow-sm" />
                    </div>
                  ))}
                </div>
              )}

              {screen.id === "wallet" && (
                <div className="space-y-1.5 mt-1">
                  {[
                    { label: "Design Tools", val: "$49.00", p: 70 },
                    { label: "API Usage", val: "$12.20", p: 35 },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-[var(--sys-border)] bg-[var(--sys-elevation-card)] p-2"
                    >
                      <div className="flex justify-between text-[9px] mb-1">
                        <span>{item.label}</span>
                        <span className="font-bold">{item.val}</span>
                      </div>
                      <Progress value={item.p} className="h-1" />
                    </div>
                  ))}
                </div>
              )}

              <Button
                size="sm"
                className="w-full h-8 text-xs transition-transform active:scale-95 shadow-sm mt-auto"
              >
                {screen.cta}
              </Button>
            </div>
          </PhoneFrame>
        ))}
      </div>
    </div>
  );
}
