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
  type ListItem,
  MetricGrid,
  type MetricItem,
  MockSectionTitle,
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
  { label: "Gross Margin", value: "72%", trend: "+1.8%", tone: "secondary" },
  { label: "Churn Risk", value: "3.2%", trend: "Stable", tone: "accent" },
  { label: "Activation", value: "61%", trend: "+4.1%", tone: "default" },
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
    <div className="rounded-xl border border-border bg-background p-4 text-text">
      <div className="grid gap-4 xl:grid-cols-[220px_1fr]">
        <Card className="h-fit bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription className="text-primary-foreground/75">
              Enterprise Analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SIDEBAR_ITEMS.map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-2 py-1.5 text-xs ${
                  index === 1
                    ? "bg-white/20 text-primary-foreground"
                    : "text-primary-foreground/80"
                }`}
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="h-8 w-52"
                  placeholder="Search teams, accounts, KPIs..."
                />
                <Button variant="outline" size="sm">
                  Date Range
                </Button>
                <Button variant="outline" size="sm">
                  Segment
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Live sync</Badge>
                <Button size="sm">Create Report</Button>
              </div>
            </CardContent>
          </Card>

          <MetricGrid metrics={DASHBOARD_METRICS} />

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
                <div className="h-44 rounded-lg border border-border bg-surface p-3">
                  <div className="flex h-full items-end gap-2">
                    {CHART_BARS.map((bar) => (
                      <div
                        key={bar.id}
                        className="flex-1 rounded-t-md bg-accent/70"
                        style={{ height: `${bar.height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <Separator className="my-3" />
                <Tabs defaultValue="pipeline">
                  <TabsList>
                    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
                    <TabsTrigger value="usage">Usage</TabsTrigger>
                    <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pipeline">
                    <div className="space-y-2">
                      {PIPELINE.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2"
                        >
                          <div>
                            <p className="text-xs font-medium">{item.title}</p>
                            <p className="text-[11px] text-text-secondary">
                              {item.subtitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold">
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
                    className="rounded-md border border-border bg-white p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">{item.title}</p>
                      <Badge variant="outline">{item.percent}%</Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-text-secondary">
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
