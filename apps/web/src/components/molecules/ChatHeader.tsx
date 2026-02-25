"use client";
import { Plus, Sparkles } from "lucide-react";
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

export default function ChatHeader() {
  const { newChat, loading, setChatInput } = useChat();

  return (
    <div className="flex flex-col border-b border-border bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text">AI Theme Chat</h3>
        <div className="flex items-center gap-1">
          <Popover>
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
                          onClick={() => setChatInput(prompt)}
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
        </div>
      </div>
      <p className="text-xs text-text-tertiary mt-0.5">
        Generate beautiful color palettes
      </p>
    </div>
  );
}
