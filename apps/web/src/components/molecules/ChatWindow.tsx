"use client";
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronDown,
  Compass,
  Palette,
  Sliders,
  Wand2,
} from "lucide-react";
import React from "react";
import type { ForcedTool, StyleOption } from "../../lib/assistantTypes";
import type { Palette as PaletteType } from "../../lib/mcpClient";
import { useChat } from "../../providers/chatContext";
import { Button } from "../atoms/button";
import { Popover, PopoverContent, PopoverTrigger } from "../atoms/popover";
import { Textarea } from "../atoms/Textarea";

const PALETTE_KEYS: Array<keyof PaletteType> = [
  "background",
  "surface",
  "surfaceSecondary",
  "border",
  "primary",
  "onPrimary",
  "primaryContainer",
  "primaryHover",
  "accent",
  "onAccent",
  "accentHover",
  "text",
  "textMedium",
  "textLow",
  "success",
  "warning",
  "error",
];

function StyleCard({
  style,
  onSelect,
  disabled,
}: Readonly<{
  style: StyleOption;
  onSelect: (id: string) => void;
  disabled: boolean;
}>) {
  return (
    <button
      type="button"
      aria-label={`Select style: ${style.title}`}
      disabled={disabled}
      onClick={() => onSelect(style.id)}
      className={[
        "group w-full text-left rounded-lg border border-border bg-surface px-3 py-2.5",
        "transition-all duration-150 hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      <p className="text-xs font-semibold text-text group-hover:text-primary transition-colors">
        {style.title}
      </p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary line-clamp-2">
        {style.rationale}
      </p>
    </button>
  );
}

// ── Download helper ──────────────────────────────────────────────────────────
function downloadPalette(palette: PaletteType, filename = "palette.json") {
  const json = JSON.stringify(palette, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function PalettePreview({
  palette,
  onApply,
  messageId,
}: Readonly<{
  palette: PaletteType;
  onApply: (p: PaletteType) => void;
  messageId: string;
}>) {
  return (
    <div className="mt-3 w-full space-y-2 rounded-md border border-border/50 bg-white/50 p-2 shadow-sm">
      <div className="grid grid-cols-5 gap-1">
        {PALETTE_KEYS.map((key) => (
          <div key={`${messageId}-${key}`} className="space-y-1">
            <div
              className="h-6 rounded border border-border"
              style={{ background: palette[key] }}
            />
            <p className="text-[10px] leading-none text-center">
              {key.slice(0, 1).toUpperCase()}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-xs"
          onClick={() => onApply(palette)}
        >
          Apply Palette
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 shrink-0 p-0"
          onClick={() => downloadPalette(palette)}
          aria-label="Download palette JSON"
          title="Download palette as JSON"
        >
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

type ToolOption = {
  id: ForcedTool;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const TOOL_OPTIONS: ToolOption[] = [
  {
    id: "generate_palette",
    label: "Generate Palette",
    description: "Create a brand-new palette from your description",
    icon: <Palette className="h-3.5 w-3.5" />,
  },
  {
    id: "discover_styles",
    label: "Discover Styles",
    description: "Get 3 curated style directions to choose from",
    icon: <Compass className="h-3.5 w-3.5" />,
  },
  {
    id: "tweak_palette",
    label: "Tweak Palette",
    description: "Adjust the current active palette",
    icon: <Sliders className="h-3.5 w-3.5" />,
  },
];

type ToolUsed =
  | "generate_palette"
  | "discover_styles"
  | "tweak_palette"
  | "director";

const TOOL_BADGE_CLASS: Record<ToolUsed, string> = {
  generate_palette: "bg-primary/10 text-primary",
  tweak_palette: "bg-accent/10 text-accent",
  discover_styles: "bg-success/10 text-success",
  director: "bg-surface text-text-tertiary",
};

const TOOL_BADGE_LABEL: Record<ToolUsed, string> = {
  generate_palette: "🎨 Generate Palette",
  tweak_palette: "⚙️ Tweak Palette",
  discover_styles: "🧭 Discover Styles",
  director: "🤖 Director (Auto)",
};

function getMessageClass(m: {
  role: string;
  palette?: unknown;
  palettes?: unknown[];
}): string {
  const base = "rounded-lg px-4 py-2.5";
  if (m.role === "user")
    return `${base} bg-primary text-primary-foreground max-w-sm`;
  const surface = "bg-surface text-text border border-border";
  const hasPalette =
    Boolean(m.palette) || (Array.isArray(m.palettes) && m.palettes.length > 0);
  // Palette messages always fill the full chat column so both manual edits
  // and AI-generated tweaks look identical regardless of reply text length.
  return hasPalette
    ? `${base} ${surface} w-full`
    : `${base} ${surface} max-w-sm`;
}

export default function ChatWindow() {
  const {
    messages,
    sendMessage,
    applyPalette,
    loading,
    loadingState,
    chatInput,
    setChatInput,
    selectStyle,
  } = useChat();

  const [forcedTool, setForcedTool] = React.useState<ForcedTool | null>(null);
  const [toolPickerOpen, setToolPickerOpen] = React.useState(false);

  async function handleSend() {
    if (!chatInput.trim() || loading) return;
    await sendMessage(chatInput.trim(), forcedTool ?? undefined);
    setChatInput("");
    // Reset forced tool after each send so the next message is free-form
    setForcedTool(null);
  }

  const activeTool = TOOL_OPTIONS.find((t) => t.id === forcedTool);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-sm">
              <p className="text-text-secondary text-sm">
                Say hi, describe your product, or pick a quick start.
              </p>
              <p className="text-text-tertiary text-xs mt-1">
                Example: &quot;Luxury travel website with elegant gold
                accents&quot;
              </p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={getMessageClass(m)}>
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
              {m.explain && (
                <p className="mt-2 text-xs text-text-secondary">{m.explain}</p>
              )}

              {m.providerUsed && (
                <div className="mt-3 flex items-center gap-1.5 opacity-50">
                  <span className="h-1 w-1 rounded-full bg-text-tertiary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                    {m.providerUsed}
                  </span>
                </div>
              )}

              {m.toolUsed && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${TOOL_BADGE_CLASS[m.toolUsed as ToolUsed] ?? ""}`}
                  >
                    {TOOL_BADGE_LABEL[m.toolUsed as ToolUsed]}
                  </span>
                </div>
              )}

              {/* Multiple Palettes Support */}
              {m.palettes && m.palettes.length > 0 ? (
                <div className="mt-1 space-y-3">
                  {m.palettes.map((p, idx) => (
                    <div key={`${m.id}-p-${idx + 1}`}>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Option {idx + 1}
                      </p>
                      <PalettePreview
                        palette={p}
                        onApply={applyPalette}
                        messageId={`${m.id}-${idx}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Single Palette Fallback */
                m.palette && (
                  <PalettePreview
                    palette={m.palette}
                    onApply={applyPalette}
                    messageId={m.id}
                  />
                )
              )}

              {m.styles && m.styles.length > 0 && (
                <ul className="mt-3 space-y-2" aria-label="Style options">
                  {m.styles.map((style) => (
                    <li key={style.id}>
                      <StyleCard
                        style={style}
                        onSelect={selectStyle}
                        disabled={loading}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-xs rounded-lg px-4 py-2.5 bg-surface text-text border border-border text-sm flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              {loadingState || "Generating palette..."}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-white p-4">
        <div className="flex flex-col gap-0 rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-colors">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask for a palette, or say hi to start..."
            className="min-h-[44px] resize-none border-0 bg-transparent px-3 pt-3 pb-1 text-sm shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-1">
            {/* ── Tool Selector ── */}
            <Popover open={toolPickerOpen} onOpenChange={setToolPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors border border-transparent hover:border-border hover:bg-surface disabled:opacity-40"
                  style={{
                    color: forcedTool
                      ? "var(--color-primary)"
                      : "var(--color-text-tertiary)",
                  }}
                >
                  <Wand2 className="h-3.5 w-3.5 shrink-0" />
                  {activeTool ? (
                    <span className="max-w-[120px] truncate">
                      {activeTool.label}
                    </span>
                  ) : (
                    <span>Auto</span>
                  )}
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-1.5"
                align="start"
                side="top"
                sideOffset={8}
              >
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  Force Tool
                </p>
                {/* Auto option (clears the forced tool) */}
                <button
                  type="button"
                  onClick={() => {
                    setForcedTool(null);
                    setToolPickerOpen(false);
                  }}
                  className={`flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface ${
                    forcedTool == null
                      ? "bg-primary/8 text-primary"
                      : "text-text-secondary"
                  }`}
                >
                  <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium leading-tight">
                      Auto (Let AI decide)
                    </p>
                    <p className="text-[11px] text-text-tertiary leading-snug mt-0.5">
                      Director LLM routes to the best tool
                    </p>
                  </div>
                </button>
                <div className="my-1 border-t border-border/60" />
                {TOOL_OPTIONS.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      setForcedTool(tool.id);
                      setToolPickerOpen(false);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface ${
                      forcedTool === tool.id
                        ? "bg-primary/8 text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">{tool.icon}</span>
                    <div>
                      <p className="text-xs font-medium leading-tight">
                        {tool.label}
                      </p>
                      <p className="text-[11px] text-text-tertiary leading-snug mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* ── Keyboard hint + Send ── */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-tertiary select-none hidden sm:inline">
                Enter to send · Shift+Enter for new line
              </span>
              <Button
                onClick={handleSend}
                variant="default"
                size="sm"
                className="h-8 w-8 rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-30 shrink-0"
                disabled={loading || !chatInput.trim()}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
