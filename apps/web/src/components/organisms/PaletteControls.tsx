import {
  ChevronDown,
  ChevronRight,
  PencilLine,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import React from "react";
import type { Palette } from "@/lib/mcpClient";
import { useChat } from "@/providers/chatContext";
import { Button } from "../atoms/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../atoms/dialog";

const GROUPS = [
  {
    id: "surfaces",
    name: "Surfaces",
    keys: ["background", "surface", "surfaceSecondary", "border"] as const,
  },
  {
    id: "branding",
    name: "Branding",
    keys: ["primary", "primaryContainer", "primaryHover"] as const,
  },
  {
    id: "actions",
    name: "Actions",
    keys: ["accent", "accentHover"] as const,
  },
  {
    id: "typography",
    name: "Typography",
    keys: ["text", "textMedium", "textLow", "onPrimary", "onAccent"] as const,
  },
  {
    id: "feedback",
    name: "Feedback",
    keys: ["success", "warning", "error"] as const,
  },
];

function normalizeHex(hex: string) {
  const value = hex.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(value) ? value : null;
}

function clampColorChannel(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(255, value));
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (value: number) =>
    clampColorChannel(value).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

type PaletteControlsProps = {
  targetLabel: string;
  targetPromptHint: string;
};

export default function PaletteControls({
  targetLabel,
  targetPromptHint,
}: PaletteControlsProps) {
  const {
    appliedPalette,
    tweakOneColor,
    tweakColorByPrompt,
    regenerateAllColors,
    sendMessage,
    loading,
  } = useChat();

  const [activeKey, setActiveKey] = React.useState<keyof Palette | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<"manual" | "prompt">(
    "manual",
  );
  const [manualHex, setManualHex] = React.useState(
    appliedPalette?.background || "#ffffff",
  );
  const [rgb, setRgb] = React.useState({ r: 255, g: 255, b: 255 });
  const [singlePrompt, setSinglePrompt] = React.useState("");
  const [isPromptDialogOpen, setIsPromptDialogOpen] = React.useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(),
  );

  const validManualHex = normalizeHex(manualHex);
  const canSendPrompt = !loading && regeneratePrompt.trim().length > 0;
  const canSendSinglePrompt = !loading && singlePrompt.trim().length > 0;

  const activeLabel = activeKey || "color";

  async function handleScopedRegenerate() {
    if (!canSendPrompt) return;
    const message = `[COMMAND]: GENERATE_PALETTE for ${targetLabel}. STYLE: ${regeneratePrompt.trim()}. DIRECT ACTION ONLY. NO CHAT.`;
    await sendMessage(message);
    setRegeneratePrompt("");
    setIsPromptDialogOpen(false);
  }

  function openEditor(key: keyof Palette) {
    const currentHex = appliedPalette[key];
    const parsedRgb = hexToRgb(currentHex);
    setActiveKey(key);
    setManualHex(currentHex);
    if (parsedRgb) setRgb(parsedRgb);
    setSinglePrompt("");
    setEditorMode("manual");
    setIsEditorOpen(true);
  }

  function updateRgbChannel(channel: "r" | "g" | "b", value: string) {
    const parsed = Number.parseInt(value, 10);
    const next = {
      ...rgb,
      [channel]: clampColorChannel(parsed),
    };
    setRgb(next);
    setManualHex(rgbToHex(next.r, next.g, next.b));
  }

  async function handleManualUpdate() {
    if (!activeKey || !validManualHex || loading) return;
    await tweakOneColor(activeKey, validManualHex);
    setIsEditorOpen(false);
  }

  function handlePromptUpdate() {
    if (!activeKey || !canSendSinglePrompt) return;
    const key = activeKey;
    const prompt = singlePrompt.trim();
    setSinglePrompt("");
    setIsEditorOpen(false);
    void tweakColorByPrompt(key, prompt);
  }

  const toggleGroup = (id: string) => {
    const next = new Set(expandedGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedGroups(next);
  };

  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-text">Palette Controls</h2>
        <p className="text-xs text-text-tertiary mt-1">
          Organize and refine your 60-30-10 colors.
        </p>
      </div>

      <div className="space-y-3">
        {GROUPS.map((group) => (
          <div
            key={group.id}
            className="overflow-hidden rounded-md border border-border"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between bg-surface px-3 py-2 text-xs font-semibold text-text hover:bg-surface/80"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center gap-2">
                {expandedGroups.has(group.id) ? (
                  <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
                )}
                {group.name}
              </div>
              <span className="text-[10px] font-normal text-text-tertiary">
                {group.keys.length} colors
              </span>
            </button>
            {expandedGroups.has(group.id) && (
              <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-4">
                {group.keys.map((key) => (
                  <div
                    key={key}
                    className="flex flex-col gap-1.5 rounded-md border border-border p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium text-text-secondary">
                        {key}
                      </p>
                      <button
                        type="button"
                        aria-label={`Edit ${key}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border bg-white text-text-secondary transition-colors hover:bg-surface hover:text-text"
                        onClick={() => openEditor(key)}
                        disabled={loading}
                      >
                        <PencilLine className="h-3 w-3" />
                      </button>
                    </div>
                    <div
                      className="h-6 w-full rounded border border-border/50"
                      style={{ backgroundColor: appliedPalette[key] }}
                    />
                    <p className="text-[9px] font-mono text-text-tertiary">
                      {appliedPalette[key].toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={loading}
          onClick={regenerateAllColors}
          className="bg-white hover:bg-surface"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          Surprise Me
        </Button>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => setIsPromptDialogOpen(true)}
          className="bg-white hover:bg-surface"
        >
          <WandSparkles className="mr-1.5 h-3.5 w-3.5" />
          Remix {targetLabel}
        </Button>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">Edit {activeLabel}</DialogTitle>
          <DialogHeader>
            <h3 className="text-lg font-semibold text-text">
              Edit {activeLabel}
            </h3>
            <p className="text-sm text-text-secondary">
              Choose manual controls or a focused prompt to update only this
              color.
            </p>
          </DialogHeader>

          <div className="mt-3 flex gap-2 rounded-lg border border-border p-1">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                editorMode === "manual"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:bg-surface"
              }`}
              onClick={() => setEditorMode("manual")}
            >
              <SlidersHorizontal className="mr-1 inline h-4 w-4" />
              Manual
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                editorMode === "prompt"
                  ? "bg-primary text-primary-foreground"
                  : "text-text-secondary hover:bg-surface"
              }`}
              onClick={() => setEditorMode("prompt")}
            >
              <WandSparkles className="mr-1 inline h-4 w-4" />
              Prompt
            </button>
          </div>

          {editorMode === "manual" ? (
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                <input
                  type="color"
                  className="h-14 w-14 cursor-pointer rounded-md border border-border bg-white p-1"
                  value={validManualHex || "#000000"}
                  onChange={(e) => {
                    const nextHex = e.target.value.toLowerCase();
                    setManualHex(nextHex);
                    const parsed = hexToRgb(nextHex);
                    if (parsed) setRgb(parsed);
                  }}
                />
                <div className="flex-1">
                  <label
                    className="text-xs font-medium uppercase tracking-wide text-text-tertiary"
                    htmlFor="manual-hex-input"
                  >
                    Hex
                  </label>
                  <input
                    id="manual-hex-input"
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm font-mono"
                    value={manualHex}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase();
                      setManualHex(value);
                      const parsed = hexToRgb(value);
                      if (parsed) setRgb(parsed);
                    }}
                    placeholder="#rrggbb"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(["r", "g", "b"] as const).map((channel) => (
                  <div key={channel}>
                    <label
                      className="text-xs font-medium uppercase tracking-wide text-text-tertiary"
                      htmlFor={`manual-${channel}-input`}
                    >
                      {channel}
                    </label>
                    <input
                      id={`manual-${channel}-input`}
                      type="number"
                      min={0}
                      max={255}
                      className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                      value={rgb[channel]}
                      onChange={(e) =>
                        updateRgbChannel(channel, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <label
                className="text-sm font-medium"
                htmlFor="single-color-prompt"
              >
                Prompt
              </label>
              <textarea
                id="single-color-prompt"
                className="mt-2 min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm"
                value={singlePrompt}
                onChange={(e) => setSinglePrompt(e.target.value)}
                placeholder={`Describe only the ${activeLabel} color update.`}
              />
            </div>
          )}

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={
                editorMode === "manual"
                  ? !validManualHex || loading
                  : !canSendSinglePrompt
              }
              onClick={
                editorMode === "manual"
                  ? handleManualUpdate
                  : handlePromptUpdate
              }
            >
              {editorMode === "manual" ? "Update Color" : "Send Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
        <DialogContent>
          <DialogTitle className="sr-only">
            Regenerate {targetLabel} Palette
          </DialogTitle>
          <DialogHeader>
            <h3 className="text-lg font-semibold text-text">
              Remix {targetLabel}
            </h3>
            <p className="text-sm text-text-secondary">
              Enter a style or mood to transform this view.
            </p>
          </DialogHeader>

          <div className="mt-2">
            <label className="text-sm font-medium" htmlFor="regenerate-prompt">
              Prompt
            </label>
            <input
              id="regenerate-prompt"
              className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm"
              value={regeneratePrompt}
              onChange={(e) => setRegeneratePrompt(e.target.value)}
              placeholder={targetPromptHint}
            />
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={!canSendPrompt} onClick={handleScopedRegenerate}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
