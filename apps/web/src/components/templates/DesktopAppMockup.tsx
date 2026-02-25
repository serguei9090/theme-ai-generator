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
  "[12:44:03] Sync completed for web shell",
  "[12:44:11] Generated accessibility report (18/20 passed)",
  "[12:44:19] Awaiting approval from Design Ops",
];

export default function DesktopAppMockup() {
  return (
    <div className="rounded-xl border border-border bg-background p-4 text-text">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-primary px-3 py-2 text-primary-foreground">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/70" />
            <p className="ml-1 text-xs font-medium">Theme Studio Desktop</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Live preview</Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20"
            >
              Publish
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
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
            <Card className="rounded-none border-0 border-r border-border bg-white">
              <CardHeader className="pb-2">
                <CardTitle>Explorer</CardTitle>
                <CardDescription>Project assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {FILE_TREE.map((line) => (
                  <p
                    key={line}
                    className={`rounded px-2 py-1 text-xs ${
                      line.includes("tokens.json")
                        ? "bg-primary/15 font-medium"
                        : "text-text-secondary"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 bg-white">
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
                      <div className="h-20 rounded-md border border-border bg-white" />
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

            <Card className="rounded-none border-0 border-l border-border bg-white">
              <CardHeader className="pb-2">
                <CardTitle>Inspector</CardTitle>
                <CardDescription>Token properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {INSPECTOR_ROWS.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-md border border-border bg-surface px-2 py-1.5 text-xs"
                  >
                    <span>{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
                <Separator />
                <div className="space-y-1 text-[11px] text-text-secondary">
                  <p>WCAG score: 91/100</p>
                  <p>Token drift: 0.8%</p>
                  <p>Sync target: 4 platforms</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t border-border bg-surface px-3 py-2">
            <p className="text-xs font-medium">Console</p>
            <div className="mt-1 space-y-1 rounded-md border border-border bg-white p-2">
              {LOGS.map((line) => (
                <p key={line} className="text-[11px] text-text-secondary">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
