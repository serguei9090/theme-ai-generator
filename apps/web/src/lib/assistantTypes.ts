import type { Palette, Provider } from "./mcpClient";

export type StyleOption = {
  id: string;
  title: string;
  rationale: string;
  moodPrompt: string;
};

export type AssistantMessageRequest = {
  message: string;
  history?: { role: "user" | "assistant"; text: string }[];
  conversationId?: string;
  selection?: { styleId: string };
  paletteEngine?: {
    provider: Provider;
    model?: string;
    geminiApiKey?: string;
    openaiApiKey?: string;
  };
  director?: {
    provider?: Provider;
    model?: string;
    geminiApiKey?: string;
    openaiApiKey?: string;
  };
  currentPalette?: Palette;
};

export type AssistantMessageResponse = {
  kind: "discovery" | "palette" | "tweak" | "text" | "error";
  reply: string;
  conversationId?: string;
  styles?: StyleOption[];
  palette?: Palette;
  explain?: string;
  providerUsed?: string;
  fallbackUsed?: boolean;
};
