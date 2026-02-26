import { Badge } from "../atoms/badge";
import { Button } from "../atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../atoms/card";
import { Separator } from "../atoms/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../atoms/tabs";
import { ColorPill, PulseIndicator } from "./_shared";

const FILE_TREE = [
  "workspace/",
  "  design-system/",
  "    tokens.json",
  "    components.ts",
  "  docs/",
  "    release-plan.md",
  "    change-log.md",
];
const INSPECTOR_ROWS = [
  ["Primary", "#0969da"],
  ["Secondary", "#6366f1"],
  ["Accent", "#0ea5e9"],
  ["Background", "#ffffff"],
  ["Text", "#24292f"],
];
const LOGS = [
  { text: "[12:44:03] Sync completed for web shell", type: "success" },
  { text: "[12:44:11] 18/20 contrast checks passed", type: "warning" },
  { text: "[12:44:19] Awaiting approval from Design Ops", type: "default" },
];

export default function DesktopAppMockup() {
  return (
    <div className="rounded-xl border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-4 text-[var(--sys-text)]">
      <Card className="overflow-hidden border-[var(--sys-border)]">
        <div className="flex items-center justify-between border-b border-[var(--sys-border)] bg-[var(--sys-primary)] px-3 py-2 text-[var(--sys-on-primary)]">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full opacity-70"
              style={{ backgroundColor: "var(--sys-on-primary)" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full opacity-70"
              style={{ backgroundColor: "var(--sys-on-primary)" }}
            />
            <span
              className="h-2.5 w-2.5 rounded-full opacity-70"
              style={{ backgroundColor: "var(--sys-on-primary)" }}
            />
            <p className="ml-1 text-xs font-medium">Theme Studio Desktop</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline-on-dark">Live preview</Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-[var(--sys-on-primary)]/40 bg-[var(--sys-on-primary)]/10 text-[var(--sys-on-primary)] hover:bg-[var(--sys-on-primary)]/20"
            >
              Publish
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] px-3 py-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                File
              </Button>
              <Button variant="ghost" size="sm">
                Edit
              </Button>
              <Button variant="ghost" size="sm">
                View
              </Button>
              <Button variant="ghost" size="sm">
                Run
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Validate
              </Button>
              <Button size="sm">Generate Variant</Button>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[230px_1fr_260px]">
            <Card className="rounded-none border-0 border-r border-[var(--sys-border)] bg-[var(--sys-elevation-sidebar)]">
              <CardHeader className="pb-2">
                <CardTitle>Explorer</CardTitle>
                <CardDescription>Project assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {FILE_TREE.map((item, index) => (
                  <div
                    key={item}
                    className={`group flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs transition-all active:scale-[0.98] ${
                      index === 2
                        ? "bg-[var(--sys-primary-container)] text-[var(--sys-on-primary-container)] font-medium"
                        : "text-[var(--sys-text-medium)] hover:bg-[var(--sys-primary-container)]/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                        {item.includes(".") ? "📄" : "📁"}
                      </span>
                      {item}
                    </div>
                    {index === 2 && (
                      <div className="h-1.5 w-1.5 rounded-full bg-[var(--sys-primary)] shadow-[0_0_8px_var(--sys-primary)]" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 bg-[var(--sys-elevation-card)]">
              <CardHeader>
                <CardTitle>Palette Workspace</CardTitle>
                <CardDescription>
                  Tab-based editor with preview snippets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tokens">
                  <TabsList>
                    <TabsTrigger value="tokens">tokens.json</TabsTrigger>
                    <TabsTrigger value="preview">Preview.tsx</TabsTrigger>
                    <TabsTrigger value="notes">Notes.md</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tokens">
                    <div className="rounded-md border border-border bg-surface p-3 font-mono text-[11px] leading-relaxed text-text-secondary">
                      <p>{`{`}</p>
                      <p>{`  "primary": "#0969da",`}</p>
                      <p>{`  "secondary": "#6366f1",`}</p>
                      <p>{`  "accent": "#0ea5e9",`}</p>
                      <p>{`  "background": "#ffffff",`}</p>
                      <p>{`  "text": "#24292f"`}</p>
                      <p>{`}`}</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="preview">
                    <div className="space-y-2 rounded-md border border-border bg-surface p-3">
                      <div className="h-3 rounded bg-primary/60" />
                      <div className="h-3 w-4/5 rounded bg-secondary/60" />
                      <div className="h-3 w-3/5 rounded bg-accent/60" />
                      <div className="h-20 rounded-md border border-border bg-background" />
                    </div>
                  </TabsContent>
                  <TabsContent value="notes">
                    <div className="rounded-md border border-border bg-surface p-3 text-xs text-text-secondary">
                      <p>- Validate dark mode contrast before release.</p>
                      <p>- Keep accent saturation under 80% for charts.</p>
                      <p>- Align desktop and web button foregrounds.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 border-l border-[var(--sys-border)] bg-[var(--sys-elevation-sidebar)]">
              <CardHeader className="pb-2">
                <CardTitle>Inspector</CardTitle>
                <CardDescription>Token properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-[var(--sys-text-medium)]">
                    <span>Spotlight</span>
                    <PulseIndicator tone="primary" />
                  </div>
                  <ColorPill
                    label="Primary"
                    colorVar="--sys-primary"
                    onColorVar="--sys-on-primary"
                    className="shadow-[0_0_15px_var(--sys-primary)]/10"
                  />
                </div>
                <Separator className="opacity-30" />
                {INSPECTOR_ROWS.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-md border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] px-2 py-1.5 text-xs transition-all hover:border-[var(--sys-primary)]/30 hover:bg-[var(--sys-primary-container)]/5"
                  >
                    <span className="text-[var(--sys-text-medium)]">
                      {label}
                    </span>
                    <span className="font-mono text-[var(--sys-primary)]">
                      {value}
                    </span>
                  </div>
                ))}
                <Separator className="opacity-30" />
                <div className="space-y-1 text-[11px] text-[var(--sys-text-medium)]">
                  <p className="flex justify-between">
                    <span>WCAG score</span>{" "}
                    <span className="font-bold text-[var(--sys-success)]">
                      91/100
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span>Token drift</span>{" "}
                    <span className="font-mono">0.8%</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Sync target</span> <span>4 platforms</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t border-[var(--sys-border)] bg-[var(--sys-elevation-sidebar)] px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[var(--sys-text)]">
                Console
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--sys-text-medium)]">
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--sys-primary)] animate-pulse" />
                <span>Syncing...</span>
              </div>
            </div>
            <div className="mt-1 space-y-1 rounded-md border border-[var(--sys-border)] bg-[var(--sys-elevation-bg)] p-2 font-mono">
              {LOGS.map((log) => (
                <p
                  key={log.text}
                  className={`text-[10px] ${
                    log.type === "success"
                      ? "text-[var(--sys-success)]"
                      : log.type === "warning"
                        ? "text-[var(--sys-warning)]"
                        : "text-[var(--sys-text-medium)]"
                  }`}
                >
                  <span className="opacity-30 mr-1.5">{">"}</span>
                  {log.text}
                </p>
              ))}
              <div className="flex items-center gap-1">
                <span className="opacity-30 text-[10px]">{">"}</span>
                <div className="h-3 w-1.5 bg-[var(--sys-primary)] animate-[pulse_1s_infinite]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
