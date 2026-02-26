"use client";
import { ArrowUp } from "lucide-react";
import type { StyleOption } from "../../lib/assistantTypes";
import type { Palette } from "../../lib/mcpClient";
import { useChat } from "../../providers/chatContext";
import { Button } from "../atoms/button";
import { Textarea } from "../atoms/Textarea";

const PALETTE_KEYS: Array<keyof Palette> = [
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

function PalettePreview({
  palette,
  onApply,
  messageId,
}: Readonly<{
  palette: Palette;
  onApply: (p: Palette) => void;
  messageId: string;
}>) {
  return (
    <div className="mt-3 space-y-2 rounded-md border border-border/50 bg-white/50 p-2 shadow-sm">
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
      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs"
        onClick={() => onApply(palette)}
      >
        Apply Palette
      </Button>
    </div>
  );
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

  async function handleSend() {
    if (!chatInput.trim() || loading) return;
    await sendMessage(chatInput.trim());
    setChatInput("");
  }

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
            <div
              className={`max-w-sm rounded-lg px-4 py-2.5 ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-text border border-border"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
              {m.explain && (
                <p className="mt-2 text-xs text-text-secondary">{m.explain}</p>
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
        <div className="relative group">
          <Textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask for a palette, or say hi to start..."
            className="flex-1 pr-12 min-h-[44px]"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            variant="default"
            size="sm"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-md transition-all shadow-sm"
            disabled={loading || !chatInput.trim()}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
