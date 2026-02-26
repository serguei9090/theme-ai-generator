"use client";
import { Plus, Sparkles, X } from "lucide-react";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { useChat } from "@/providers/chatContext";
import { Button } from "../atoms/button";
import { Popover, PopoverContent, PopoverTrigger } from "../atoms/popover";
import SettingsDialog from "../organisms/SettingsDialog";

const STYLE_CATEGORIES = [
  {
    name: "Apps & Products",
    prompts: [
      "Clean banking or fintech app",
      "Calm health and wellness tracker",
      "Dark mode developer tool or IDE",
      "Playful education web app",
    ],
  },
  {
    name: "Websites & Landing Pages",
    prompts: [
      "Luxury brand website",
      "Eco-friendly sustainable brand",
      "Modern e-commerce landing page",
      "Bold SaaS marketing site",
    ],
  },
  {
    name: "Dashboards & Admin",
    prompts: [
      "Minimal modern SaaS dashboard",
      "Data-heavy analytics dashboard",
      "Creative studio admin panel",
      "Dark operations control center",
    ],
  },
];

const PROMPT_TEMPLATES: Record<string, string> = {
  // ── Apps & Products ──────────────────────────────────────────────────────
  "Clean banking or fintech app":
    "Generate a complete UI color palette for a modern mobile banking and fintech application. Surface: mobile app. Audience: professionals managing personal finances. Mood: trustworthy, reliable, calm. Use deep navy or slate blue as the primary brand color, crisp white or very light grey backgrounds, and a vivid teal or green accent for CTAs and positive transaction states. Ensure WCAG-AA contrast on all text. Include clear error (red) and success (green) states for transaction feedback.",

  "Calm health and wellness tracker":
    "Generate a complete UI color palette for a health and wellness tracking web app. Surface: mobile-first web app. Audience: adults focused on mindfulness, fitness, or mental health. Mood: calm, organic, safe, motivating. Use soft sage green or muted teal as the primary brand color, warm off-white backgrounds, and a gentle amber or coral accent. Typography colors must be readable at small sizes. The palette should feel spa-like — never clinical or harsh.",

  "Dark mode developer tool or IDE":
    "Generate a complete UI color palette for a dark-mode developer tool or code editor. Surface: desktop application. Audience: professional software engineers spending 8+ hours daily in the tool. Mood: focused, technical, low eye strain. Use a very dark charcoal (#1a1b26 range) as background, mid-grey surfaces for sidebars and panels, and two distinct accents — a primary in electric violet or cyan for interactive elements and a secondary in amber for warnings. Text must be high-contrast against dark backgrounds.",

  "Playful education web app":
    "Generate a complete UI color palette for a gamified education platform targeting K-12 students. Surface: web app used on tablets and desktops. Audience: children aged 8–16 and their teachers. Mood: energetic, fun, encouraging, accessible. Use a warm and bold primary (purple, cobalt blue, or orange), a bright contrasting accent for reward states and CTAs, and light neutral backgrounds to keep text readable. The palette must feel dynamic and youthful without being overwhelming.",

  // ── Websites & Landing Pages ─────────────────────────────────────────────
  "Luxury brand website":
    "Generate a complete UI color palette for a luxury lifestyle brand marketing website. Surface: desktop-first website. Audience: high-income consumers aged 30–55. Mood: refined, premium, exclusive, timeless. Use near-black or deep charcoal as the primary text and UI color, warm champagne or ivory for backgrounds, and a restrained gold or bronze as the sole accent. The palette must feel expensive and editorial — no saturated colors, no flat digital blues.",

  "Eco-friendly sustainable brand":
    "Generate a complete UI color palette for an eco-friendly direct-to-consumer brand website. Surface: marketing website. Audience: environmentally conscious shoppers aged 25–45. Mood: natural, honest, optimistic, grounded. Use earth green or forest green as the primary brand color, warm linen or parchment backgrounds, and terracotta or muted ochre as the accent. Avoid plastics-looking bright white or neon accents. The palette must feel like it came from nature.",

  "Modern e-commerce landing page":
    "Generate a complete UI color palette for a modern high-conversion e-commerce landing page. Surface: marketing + shopping website. Audience: general consumers browsing on mobile. Mood: clear, energetic, trustworthy, action-oriented. Use a clean white or very light grey background, a bold and confident primary brand color (deep blue, vibrant red, or rich indigo), and a high-visibility accent specifically for 'Buy Now' and 'Add to Cart' CTAs. Ensure the CTA accent has maximum contrast against all backgrounds.",

  "Bold SaaS marketing site":
    "Generate a complete UI color palette for a bold B2B SaaS marketing website targeting technical decision-makers. Surface: desktop-first marketing website. Audience: CTOs, engineering leads, product managers. Mood: confident, modern, authoritative, innovative. Use a deep navy or dark indigo as the foundation, a clean white or near-white for content areas, and a vibrant electric blue or green accent for CTAs and key highlights. The palette should signal technical excellence and startup energy.",

  // ── Dashboards & Admin ───────────────────────────────────────────────────
  "Minimal modern SaaS dashboard":
    "Generate a complete UI color palette for a minimal SaaS product dashboard. Surface: web app, desktop viewport. Audience: business professionals using the tool daily for task and project management. Mood: clean, focused, productive, uncluttered. Use a pure white or very light cool-grey background, subtle border colors for card separation, a confident blue or indigo primary for navigation and key actions, and a minimal accent for notifications or badges. Avoid decoration — every color must have a functional purpose.",

  "Data-heavy analytics dashboard":
    "Generate a complete UI color palette for a complex analytics and business intelligence dashboard. Surface: desktop web app with dense data tables, charts, and KPI cards. Audience: data analysts and operations teams. Mood: professional, precise, trustworthy, dense-but-readable. Use a mid-grey or desaturated blue-grey background so charts pop, clear surface colors for cards and panels, a single primary for interactive controls, and a purposeful set of data colors (success green, warning amber, error red, neutral grey) for metric states.",

  "Creative studio admin panel":
    "Generate a complete UI color palette for a creative agency's internal project management and asset admin panel. Surface: desktop web app. Audience: designers, art directors, and project managers at a creative studio. Mood: sophisticated, inspiring, modern, slightly expressive. Use a dark graphite or near-black base to let content breathe, a muted terracotta, deep plum, or electric indigo as the primary brand accent, and warm neutrals for text. The palette should feel like a well-designed creative tool — premium but not sterile.",

  "Dark operations control center":
    "Generate a complete UI color palette for a dark-mode DevOps or infrastructure monitoring dashboard. Surface: desktop web app with real-time metrics, logs, and alert panels. Audience: site reliability engineers and DevOps teams. Mood: focused, high-alert, technical, mission-critical. Use deep charcoal or near-black backgrounds, carbon-grey surfaces for panels, and a sharp cyan or electric green as the primary data accent. Clear alert colors: vivid red for critical errors, amber for warnings, and muted green for healthy states. Maximum readability in low-light environments.",
};

export default function ChatHeader({
  onClose,
}: Readonly<{ onClose?: () => void }>) {
  const { newChat, loading, setChatInput } = useChat();
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePromptSelect = (label: string) => {
    setIsOpen(false);
    // Populate the input with a rich, context-complete prompt.
    // The [CALL: generate_palette] suffix is a hard directive recognized by the
    // DIRECTOR_SYSTEM_PROMPT — it ensures the LLM calls the tool immediately
    // without asking follow-up questions, regardless of how the user edits the text.
    const basePrompt = PROMPT_TEMPLATES[label] ?? label;
    setChatInput(`${basePrompt}\n\n[CALL: generate_palette]`);
  };

  return (
    <div className="flex flex-col border-b border-border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">AI Theme Chat</h3>
        <div className="flex items-center gap-1">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-text-tertiary hover:text-text rounded-full shrink-0"
                disabled={loading}
              >
                <Sparkles className="h-4 w-4" />
                <span className="sr-only">Ideas</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="max-h-[60vh] overflow-y-auto space-y-4">
                {STYLE_CATEGORIES.map((category) => (
                  <div key={category.name}>
                    <h4 className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                      {category.name}
                    </h4>
                    <div className="flex flex-col gap-[2px]">
                      {category.prompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          className="text-left rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-surface hover:text-text transition-colors"
                          onClick={() => handlePromptSelect(prompt)}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-text-tertiary hover:text-text rounded-full shrink-0"
                  onClick={newChat}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Start new chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Start new chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <SettingsDialog />
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-text-tertiary hover:text-text rounded-full shrink-0 lg:hidden ml-1"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-text-tertiary mt-0.5">
        Generate beautiful color palettes
      </p>
    </div>
  );
}
