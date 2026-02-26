import type { Palette, Provider } from "./mcpClient";

export type StyleOption = {
  id: string;
  title: string;
  rationale: string;
  moodPrompt: string;
};

export type ForcedTool =
  | "generate_palette"
  | "discover_styles"
  | "tweak_palette";

export type AssistantMessageRequest = {
  message: string;
  history?: { role: "user" | "assistant"; text: string }[];
  conversationId?: string;
  selection?: { styleId: string };
  forceTool?: ForcedTool;
  paletteEngine?: {
    provider: Provider;
    model?: string;
    geminiApiKey?: string;
    openaiApiKey?: string;
    copilotApiKey?: string;
  };
  director?: {
    provider?: Provider;
    model?: string;
    geminiApiKey?: string;
    openaiApiKey?: string;
    copilotApiKey?: string;
  };
  currentPalette?: Palette;
};

export type AssistantMessageResponse = {
  kind: "discovery" | "palette" | "tweak" | "text" | "error";
  toolUsed?:
    | "generate_palette"
    | "discover_styles"
    | "tweak_palette"
    | "director";
  reply: string;
  conversationId?: string;
  styles?: StyleOption[];
  palette?: Palette;
  palettes?: Palette[];
  explain?: string;
  providerUsed?: string;
  fallbackUsed?: boolean;
};
