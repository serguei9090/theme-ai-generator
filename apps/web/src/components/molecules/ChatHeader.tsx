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
      "Luxury style website",
      "Bright eco-friendly sustainable brand",
      "Modern e-commerce landing page",
    ],
  },
  {
    name: "Dashboards",
    prompts: [
      "Minimal modern dashboard",
      "Data-heavy analytics dashboard",
      "Creative studio admin panel",
    ],
  },
];

const PROMPT_TEMPLATES: Record<string, string> = {
  "Clean banking or fintech app":
    "Generate a professional color palette for a clean banking and fintech application. Focus on trustworthiness and reliability using deep trust blues, crisp whites, and a vibrant primary accent for call-to-actions. Ensure strong contrast for financial data.",
  "Calm health and wellness tracker":
    "Generate a soothing and accessible color palette for a health and wellness tracker. Use soft greens, calming teals, and light neutrals to evoke vitality and peace. Ensure the colors feel organic and accessible.",
  "Dark mode developer tool or IDE":
    "Generate a high-contrast dark mode palette for a developer tool. Focus on deep charcoal backgrounds with vibrant syntax-highlighting accents in violet, cyan, and emerald. Optimized for long-term eye comfort.",
  "Playful education web app":
    "Generate a vibrant and energetic color palette for an education web app. Use a playful multi-color approach with bright yellows, purples, and oranges to engage students. Bold and enthusiastic branding.",
  "Luxury style website":
    "Generate an elegant and sophisticated color palette for a luxury brand website. Use a palette of champagne, charcoal, and refined gold accents. Focus on high-end minimalism and premium spacing.",
  "Bright eco-friendly sustainable brand":
    "Generate a fresh, eco-friendly color palette for a sustainable brand. Use earth tones, forest greens, and sun-washed neutrals. Should feel natural, organic, and environmentally conscious.",
  "Modern e-commerce landing page":
    "Generate a high-conversion color palette for a modern e-commerce landing page. Clean white foundation with a bold primary branding color and high-impact accent for 'Add to Cart' buttons.",
  "Minimal modern dashboard":
    "Generate a clean, minimal palette for a modern SaaS dashboard. Focus on a light grey/white background, subtle borders, and a single strong primary color for data highlights and navigation.",
  "Data-heavy analytics dashboard":
    "Generate a professional palette for a complex analytics dashboard. Use a range of distinct, accessible colors for charts and graphs, balanced against a neutral, low-distraction background.",
  "Creative studio admin panel":
    "Generate an inspiring and modern palette for a creative studio admin tool. Use a sophisticated dark-grey base with artistic accents like terracotta, deep plum, or electric indigo.",
};

export default function ChatHeader({
  onClose,
}: Readonly<{ onClose?: () => void }>) {
  const { newChat, loading, setChatInput } = useChat();
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePromptSelect = (label: string) => {
    setIsOpen(false);
    // Populate the input with a rich, tool-triggering prompt instead of auto-sending
    const fullPrompt = PROMPT_TEMPLATES[label] ?? label;
    setChatInput(fullPrompt);
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
