"use client";
import React from "react";
import ChatSidebar from "../components/organisms/ChatSidebar";
import PaletteControls from "../components/organisms/PaletteControls";
import DesktopAppMockup from "../components/templates/DesktopAppMockup";
import MobileAppMockup from "../components/templates/MobileAppMockup";
import WebAppMockup from "../components/templates/WebAppMockup";
import WebsiteMockup from "../components/templates/WebsiteMockup";
import { ChatProvider, useChat } from "../providers/chatContext";
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
  const { appliedPalette } = useChat();
  const [activePreview, setActivePreview] =
    React.useState<PreviewKind>("website");
  const currentPreview = PREVIEWS.find((entry) => entry.id === activePreview);
  if (!currentPreview) return null;

  return (
    <ThemeProvider palette={appliedPalette}>
      <div className="flex min-h-screen flex-col bg-background lg:flex-row">
        <ChatSidebar />
        <main className="flex-1 overflow-auto bg-gradient-to-b from-surface to-background p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <section className="mb-6 rounded-2xl border border-border bg-white/80 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
                Creative Theme Lab
              </p>
              <h1 className="mt-2 text-3xl font-bold text-text">
                Color Palette Mockups
              </h1>
              <p className="mt-2 text-text-secondary">
                Generate a palette in chat, refine each color with manual or
                prompt-based edits, then preview the result across product
                surfaces before shipping.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  Real-time preview
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  MCP-driven generation
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                  Per-color edit tools
                </span>
              </div>
            </section>

            <nav className="mb-4 flex flex-wrap gap-2">
              {PREVIEWS.map((entry) => {
                const active = entry.id === activePreview;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setActivePreview(entry.id)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white text-text-secondary hover:text-text"
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </nav>

            <div className="mb-6">
              <PaletteControls
                targetLabel={currentPreview.label}
                targetPromptHint={currentPreview.promptHint}
              />
            </div>

            <div className="rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <h2 className="mb-1 text-sm font-semibold text-text">
                {currentPreview.label} Example
              </h2>
              <p className="mb-3 text-xs text-text-secondary">
                {currentPreview.description}
              </p>
              {currentPreview.render()}
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default function Home() {
  return (
    <ChatProvider>
      <Workspace />
    </ChatProvider>
  );
}
