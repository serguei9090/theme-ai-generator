import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../atoms/card";
import { Input } from "../atoms/input";
import { Progress } from "../atoms/progress";
import { Separator } from "../atoms/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../atoms/tabs";
import {
  ColorPill,
  type ListItem,
  MetricGrid,
  type MetricItem,
  MockSectionTitle,
  PulseIndicator,
} from "./_shared";

const SIDEBAR_ITEMS = [
  "Overview",
  "Revenue",
  "Forecasting",
  "Cohorts",
  "Ops Alerts",
  "Settings",
];
const DASHBOARD_METRICS: MetricItem[] = [
  { label: "ARR", value: "$2.8M", trend: "+12.4%", tone: "success" },
  { label: "Gross Margin", value: "72%", trend: "+1.8%", tone: "default" },
  { label: "Churn Risk", value: "High", trend: "+4.1%", tone: "error" },
  { label: "Activation", value: "61%", trend: "-2.4%", tone: "warning" },
];
const PIPELINE: ListItem[] = [
  {
    id: "acme",
    title: "Acme Global rollout",
    subtitle: "Enterprise segment",
    value: "$180k",
    status: "Negotiation",
    statusTone: "accent",
  },
  {
    id: "northwind",
    title: "Northwind renewal",
    subtitle: "Design Systems org",
    value: "$94k",
    status: "Review",
    statusTone: "secondary",
  },
  {
    id: "globex",
    title: "Globex expansion",
    subtitle: "Product Ops",
    value: "$76k",
    status: "Qualified",
    statusTone: "default",
  },
];
const ALERTS = [
  {
    title: "Contrast regression detected",
    detail: "2 components in Mobile App",
    percent: 60,
  },
  {
    title: "Pending design approval",
    detail: "Pricing page variant B",
    percent: 42,
  },
  {
    title: "Token rollout progress",
    detail: "Web + Desktop complete",
    percent: 86,
  },
];
const CHART_BARS = [
  { id: "q1", height: 35 },
  { id: "q2", height: 48 },
  { id: "q3", height: 42 },
  { id: "q4", height: 58 },
  { id: "q5", height: 64 },
  { id: "q6", height: 74 },
  { id: "q7", height: 68 },
];

export default function WebAppMockup() {
  return (
    <div className="rounded-xl border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-4 text-[var(--sys-text)]">
      <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
        <Card className="h-fit border-[var(--sys-border)] bg-[var(--sys-elevation-sidebar)] text-[var(--sys-text)]">
          <CardHeader>
            <CardTitle className="text-[var(--sys-text)]">Workspace</CardTitle>
            <CardDescription className="text-[var(--sys-text-medium)]">
              Enterprise Analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {SIDEBAR_ITEMS.map((item, index) => (
              <div
                key={item}
                className={`group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
                  index === 1
                    ? "bg-[var(--sys-primary)] text-[var(--sys-on-primary)] shadow-[0_0_12px_var(--sys-primary)]/20 active:scale-95"
                    : "text-[var(--sys-text-medium)] hover:bg-[var(--sys-primary-container)]/20 hover:text-[var(--sys-text)] active:scale-95"
                }`}
              >
                {index === 1 && (
                  <div className="h-1 w-1 rounded-full bg-[var(--sys-on-primary)] animate-pulse" />
                )}
                {item}
                {index === 1 && (
                  <div className="absolute inset-y-0 -left-1 w-0.5 rounded-full bg-[var(--sys-primary)] shadow-[0_0_8px_var(--sys-primary)]" />
                )}
              </div>
            ))}
          </CardContent>
          <Separator className="bg-[var(--sys-border)]/50" />
          <CardContent className="pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--sys-text-medium)] opacity-60">
              System Health
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--sys-success)] animate-bounce" />
              <span className="text-[var(--sys-success)]">
                All systems operational
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-[var(--sys-primary)]/20 bg-background/60 backdrop-blur-md">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="h-8 w-52 bg-background/40"
                  placeholder="Search teams, accounts, KPIs..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/40"
                >
                  Date Range
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/40"
                >
                  Segment
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="primary-success">Live sync</Badge>
                <Button size="sm">Create Report</Button>
              </div>
            </CardContent>
          </Card>

          <MetricGrid metrics={DASHBOARD_METRICS} className="transition-all" />

          <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
            <Card className="border-[var(--sys-border)] bg-[var(--sys-elevation-card)]">
              <CardHeader className="pb-3 border-b border-[var(--sys-border)]/30">
                <CardTitle className="text-sm">Style Guide</CardTitle>
              </CardHeader>
              <CardContent className="p-4 bg-[var(--sys-elevation-bg)]/20">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    label="Warning"
                    colorVar="--sys-warning"
                    onColorVar="--sys-text"
                  />
                  <ColorPill
                    label="Error"
                    colorVar="--sys-error"
                    onColorVar="--text-white"
                  />
                  <ColorPill
                    label="Secondary"
                    colorVar="--sys-surface-secondary"
                    onColorVar="--sys-text"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--sys-border)] bg-[var(--sys-elevation-card)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold">System Status</span>
                  <PulseIndicator tone="success" label="Optimal" />
                </div>
                <div className="space-y-3">
                  <div className="h-1 w-full rounded-full bg-[var(--sys-border)] overflow-hidden">
                    <div className="h-full w-[85%] bg-[var(--sys-primary)] animate-pulse" />
                  </div>
                  <div className="flex justify-between text-[10px] text-[var(--sys-text-medium)]">
                    <span>Performance</span>
                    <span>99.9% Up</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader>
                <MockSectionTitle
                  eyebrow="Revenue Intelligence"
                  title="Quarterly performance trend"
                  description="Simulated chart area with palette-aware layers"
                  trailing={<Badge variant="secondary">Updated 2m ago</Badge>}
                />
              </CardHeader>
              <CardContent>
                <div className="h-44 rounded-lg border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-3 shadow-inner">
                  <div className="flex h-full items-end gap-2">
                    {CHART_BARS.map((bar) => (
                      <div
                        key={bar.id}
                        className="flex-1 rounded-t-md opacity-80"
                        style={{
                          height: `${bar.height}%`,
                          backgroundColor: "var(--sys-accent)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <Separator className="my-3 opacity-50" />
                <Tabs defaultValue="pipeline">
                  <TabsList>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pipeline">
                    <div className="space-y-2 mt-3">
                      {PIPELINE.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium text-[var(--sys-text)]">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[var(--sys-text-medium)]">
                              {item.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[var(--sys-text)]">
                              {item.value}
                            </p>
                            <Badge variant={item.statusTone || "outline"}>
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="usage">
                    <div className="space-y-2 text-xs text-text-secondary">
                      <p>Daily active orgs: 1,284</p>
                      <p>Feature adoption: 63%</p>
                      <p>Saved theme variants: 4,812</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="cohorts">
                    <div className="space-y-2 text-xs text-text-secondary">
                      <p>Week 1 retention: 88%</p>
                      <p>Week 4 retention: 67%</p>
                      <p>Week 12 retention: 49%</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity & Alerts</CardTitle>
                <CardDescription>
                  Operational checkpoints for this release
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ALERTS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-md border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-[var(--sys-text)]">
                        {item.title}
                      </p>
                      <Badge variant="outline">{item.percent}%</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--sys-text-medium)]">
                      {item.detail}
                    </p>
                    <Progress className="mt-2" value={item.percent} />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  Open Incident Center
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
