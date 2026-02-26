"use client";
import {
  ArrowDownToLine,
  MessageSquare,
  Moon,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import React from "react";
import { Button } from "../components/atoms/button";
import ChatSidebar from "../components/organisms/ChatSidebar";
import PaletteControls from "../components/organisms/PaletteControls";
import DesktopAppMockup from "../components/templates/DesktopAppMockup";
import MobileAppMockup from "../components/templates/MobileAppMockup";
import WebAppMockup from "../components/templates/WebAppMockup";
import WebsiteMockup from "../components/templates/WebsiteMockup";
import { useChat } from "../providers/chatContext";
import ThemeProvider from "../providers/ThemeProvider";

type PreviewKind = "website" | "webapp" | "desktop" | "mobile";

type PreviewConfig = {
  id: PreviewKind;
  label: string;
  description: string;
  promptHint: string;
  render: () => React.ReactNode;
};

const PREVIEWS: PreviewConfig[] = [
  {
    id: "website",
    label: "Website",
    description:
      "Enterprise landing layout with hero, trust strip, feature grid, pricing, and CTA modules.",
    promptHint: "SaaS landing page with clean trust-focused visuals",
    render: () => <WebsiteMockup />,
  },
  {
    id: "webapp",
    label: "Web App",
    description:
      "Analytics workspace with side navigation, KPI cards, command bar, and operations panel.",
    promptHint: "Data-heavy B2B dashboard with confident accents",
    render: () => <WebAppMockup />,
  },
  {
    id: "desktop",
    label: "Desktop App",
    description:
      "Professional multi-pane desktop tool with explorer, editor tabs, inspector, and console.",
    promptHint: "Native-feel desktop productivity app with calm tones",
    render: () => <DesktopAppMockup />,
  },
  {
    id: "mobile",
    label: "Mobile App",
    description:
      "Four polished phone patterns: profile, commerce, social, and wallet/support flows.",
    promptHint: "Mobile fintech UI with strong readability and contrast",
    render: () => <MobileAppMockup />,
  },
];

function Workspace() {
  const { appliedPalette, themeMode, setThemeMode } = useChat();
  const [activePreview, setActivePreview] =
    React.useState<PreviewKind>("website");
  const [showControls, setShowControls] = React.useState(false);
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const currentPreview = PREVIEWS.find((entry) => entry.id === activePreview);

  // Early return if currentPreview is not found to satisfy TS
  if (!currentPreview) return null;

  return (
    <div className="flex min-h-screen flex-row bg-background">
      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <main className="flex-1 overflow-auto bg-gradient-to-b from-surface to-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Condensed Header */}
          <header className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
                Creative Theme Lab
              </p>
              <h1 className="text-2xl font-bold text-text">
                Color Palette Mockups
              </h1>
              <p className="mt-1 text-xs text-text-secondary max-w-md">
                Generate and refine 60-30-10 palettes for product surfaces.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <span className="text-[10px] font-medium text-text-secondary">
                    Live Preview
                  </span>
                </div>
                <Button
                  variant={showControls ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowControls(!showControls)}
                  className="hidden lg:flex h-8 gap-1.5 rounded-full text-xs transition-all active:scale-95"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {showControls ? "Hide Controls" : "Show Controls"}
                </Button>
              </div>
            </div>
          </header>

          {/* Collapsible Palette Controls */}
          {showControls && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
              <PaletteControls
                targetLabel={currentPreview.label}
                targetPromptHint={currentPreview.promptHint}
              />
            </div>
          )}

          <nav className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {PREVIEWS.map((entry) => {
                const active = entry.id === activePreview;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActivePreview(entry.id)}
                    className={[
                      "rounded-full border px-4 py-1.5 text-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white text-text-secondary hover:text-text",
                    ].join(" ")}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>

            {/* Global Theme Toggle */}
            <div className="flex items-center gap-1 rounded-full border border-border bg-white p-1 shadow-sm">
              <button
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  themeMode === "light"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-text-secondary hover:bg-surface"
                }`}
                onClick={() => setThemeMode("light")}
                aria-label="Light mode"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                  themeMode === "dark"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-text-secondary hover:bg-surface"
                }`}
                onClick={() => setThemeMode("dark")}
                aria-label="Dark mode"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>
          </nav>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-text">
                {currentPreview.label} Example
              </h2>
              {appliedPalette && (
                <button
                  type="button"
                  onClick={() => {
                    const json = JSON.stringify(appliedPalette, null, 2);
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${currentPreview.id}-palette.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title="Download palette as JSON"
                  aria-label="Download palette JSON"
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-text-secondary transition-colors hover:bg-surface hover:text-text"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-text-secondary">
              {currentPreview.description}
            </p>
            <ThemeProvider palette={appliedPalette}>
              {currentPreview.render()}
            </ThemeProvider>
          </div>
        </div>
      </main>

      {/* Mobile Interactive Dock */}
      {!isChatOpen && (
        <div className="fixed inset-x-0 bottom-6 z-[60] flex justify-center lg:hidden px-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-white/80 p-1.5 shadow-2xl backdrop-blur-md">
            <Button
              variant={isChatOpen ? "default" : "ghost"}
              size="sm"
              className="h-10 w-10 rounded-full p-0 transition-all active:scale-90"
              onClick={() => {
                setIsChatOpen(!isChatOpen);
                if (showControls) setShowControls(false);
              }}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-1 px-1">
              {PREVIEWS.map((preview) => (
                <button
                  key={preview.id}
                  type="button"
                  onClick={() => {
                    setActivePreview(preview.id);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold transition-all active:scale-90 ${
                    activePreview === preview.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-text-tertiary hover:bg-surface"
                  }`}
                  title={preview.label}
                >
                  {preview.label.charAt(0)}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            <Button
              variant={showControls ? "default" : "ghost"}
              size="sm"
              className="h-10 w-10 rounded-full p-0 transition-all active:scale-90"
              onClick={() => {
                setShowControls(!showControls);
                if (isChatOpen) setIsChatOpen(false);
              }}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return <Workspace />;
}
