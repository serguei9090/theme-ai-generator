import { randomUUID } from "node:crypto";
import {
  discoverStyles,
  type Palette,
  type Provider,
  type ProviderInput,
  providerPrompt,
} from "@theme-ai/core";
import { executeGenerate, executeTweak } from "@theme-ai/mcp-server/src/server";
import type {
  AssistantMessageRequest,
  AssistantMessageResponse,
  StyleOption,
} from "./assistantTypes";
import { normalizeProvider } from "./mcpClient";

const PALETTE_KEYS = [
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
] as const;

type PaletteKey = (typeof PALETTE_KEYS)[number];

type ConversationState = {
  styles: StyleOption[];
  hasGeneratedPalette: boolean;
};

const conversations = new Map<string, ConversationState>();

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getConversationState(conversationId: string) {
  const state = conversations.get(conversationId);
  if (state) return state;

  const nextState: ConversationState = {
    styles: [],
    hasGeneratedPalette: false,
  };
  conversations.set(conversationId, nextState);
  return nextState;
}

const DIRECTOR_SYSTEM_PROMPT = `You are an expert Creative Director and Marketing Color Palette Specialist.
Your job is to chat with the user, understand their project (website, app, etc.) and what feeling or mood it should convey.
You can help everyone from normal to advanced users.

If you DO NOT have enough context, ask targeted, brief, and friendly questions. 
If you HAVE enough context OR the user gives you a specific color request, YOU MUST CALL A TOOL.

DO NOT output raw JSON unless you are calling a tool. If you are just chatting, reply with normal text. DO NOT mix text and JSON.

To call a tool, reply with exactly ONE of the following JSON blocks:

To generate one or more palettes (max 3):
{
  "tool": "generate_palette",
  "moodPrompt": "An optimized prompt for generating the color palette based on all context.",
  "count": 1
}

To suggest 3-4 distinct style directions (discovery):
{
  "tool": "discover_styles",
  "message": "A summary of what we know so far to generate options."
}

To tweak an existing palette (e.g. they asked to make the primary blue):
{
  "tool": "tweak_palette",
  "mood": "Specific update instructions to tweak the current palette, e.g., 'make the primary color blue'."
}

CRITICAL: You can generate a maximum of 3 palettes at once. If the user asks for more, generate 3 and explain the limit in your text.`;

type ToolCall =
  | { tool: "generate_palette"; moodPrompt: string; count?: number }
  | { tool: "discover_styles"; message: string }
  | { tool: "tweak_palette"; mood: string };

function extractToolCall(text: string): ToolCall | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (
        parsed.tool === "generate_palette" ||
        parsed.tool === "discover_styles" ||
        parsed.tool === "tweak_palette"
      ) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

async function callGenerateTool(args: {
  mood: string;
  provider: string;
  model?: string;
  allowFallback?: boolean;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
  history?: { role: "user" | "assistant"; text: string }[];
}) {
  const result = await executeGenerate(args);
  return { palette: result.palette };
}

async function callTweakTool(args: {
  palette: Palette;
  index?: number;
  hex?: string;
  updates?: Partial<Record<PaletteKey, string>>;
  mood?: string;
  provider: string;
  model?: string;
  allowFallback?: boolean;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
  history?: { role: "user" | "assistant"; text: string }[];
}) {
  const result = await executeTweak(args);
  return { palette: result.palette };
}

async function discoverStylesWithDirector(input: {
  message: string;
  provider?: string;
  model?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
  history?: { role: "user" | "assistant"; text: string }[];
}): Promise<StyleOption[]> {
  const styles = await discoverStyles(input.message, {
    provider: input.provider as ProviderInput,
    model: input.model,
    geminiApiKey: input.geminiApiKey,
    openaiApiKey: input.openaiApiKey,
    copilotApiKey: input.copilotApiKey,
    history: input.history,
  });

  return styles.map((s) => ({
    id: s.id,
    title: s.title,
    rationale: s.rationale,
    moodPrompt: s.moodPrompt,
  }));
}

export async function handleAssistantMessage(
  request: AssistantMessageRequest,
): Promise<AssistantMessageResponse> {
  const conversationId = request.conversationId || randomUUID();
  const state = getConversationState(conversationId);

  const provider = normalizeProvider(request.paletteEngine?.provider);
  const model = request.paletteEngine?.model?.trim() || undefined;
  const geminiApiKey = request.paletteEngine?.geminiApiKey?.trim() || undefined;
  const openaiApiKey = request.paletteEngine?.openaiApiKey?.trim() || undefined;
  const copilotApiKey =
    request.paletteEngine?.copilotApiKey?.trim() || undefined;

  const directorProvider =
    normalizeProvider(request.director?.provider) || "gemini";
  const directorModel = request.director?.model?.trim() || undefined;
  const directorGeminiApiKey =
    request.director?.geminiApiKey?.trim() || undefined;
  const directorApiKey = request.director?.openaiApiKey?.trim() || undefined;
  const directorCopilotApiKey =
    request.director?.copilotApiKey?.trim() || undefined;

  const history = Array.isArray(request.history)
    ? request.history.slice(-10)
    : undefined;

  // 1. Check for Style Selection (Clicking the style option)
  const selectionId = request.selection?.styleId?.trim();
  if (selectionId) {
    const selectedStyle = state.styles.find((s) => s.id === selectionId);
    if (!selectedStyle) {
      return {
        kind: "error",
        reply: "That style is no longer available. Ask for new ideas.",
        conversationId,
      };
    }
    try {
      const result = await callGenerateTool({
        mood: selectedStyle.moodPrompt,
        provider,
        model,
        allowFallback: true,
        geminiApiKey,
        openaiApiKey,
        copilotApiKey,
        history,
      });
      state.hasGeneratedPalette = true;
      return {
        kind: "palette",
        reply: `Perfect choice — generating "${selectedStyle.title}". Need any tweaks?`,
        conversationId,
        palette: result.palette,
      };
    } catch (error) {
      return { kind: "error", reply: getErrorMessage(error), conversationId };
    }
  }

  const message = request.message?.trim();
  if (!message) {
    return {
      kind: "error",
      reply: "Message must not be empty",
      conversationId,
    };
  }

  // 2. Delegate to the Conversational LLM Agent
  try {
    const agentResponse = await providerPrompt(
      directorProvider as Provider,
      message,
      directorModel,
      directorGeminiApiKey,
      directorApiKey,
      directorCopilotApiKey,
      DIRECTOR_SYSTEM_PROMPT,
      history,
    );

    if (process.env.PROVIDER_DEBUG === "true") {
      console.log(
        `[DEBUG] Director Provider: ${directorProvider}, Model: ${directorModel}`,
      );
      console.log(`[DEBUG] AI Response: ${agentResponse}`);
    }

    const toolCall = extractToolCall(agentResponse);

    // If the LLM just wants to talk
    if (!toolCall) {
      return {
        kind: "text",
        reply: agentResponse,
        conversationId,
        providerUsed: directorProvider,
      };
    }

    // Agent called [generate_palette]
    if (toolCall.tool === "generate_palette") {
      const count = Math.min(Math.max(toolCall.count || 1, 1), 3);
      const palettes: Palette[] = [];

      // Sequence tool calls to ensure valid results
      for (let i = 0; i < count; i++) {
        // We slightly vary the mood for multiple options to get distinct results
        const variedMood =
          count > 1
            ? `${toolCall.moodPrompt} (Option ${i + 1})`
            : toolCall.moodPrompt;
        const gResult = await callGenerateTool({
          mood: variedMood,
          provider,
          model,
          allowFallback: true,
          geminiApiKey,
          openaiApiKey,
          copilotApiKey,
          history,
        });
        palettes.push(gResult.palette);
      }

      state.hasGeneratedPalette = true;

      let reply = "Here is your custom generated palette! How does it look?";
      if (count > 1) {
        reply = `I've generated ${count} options for you! Which one do you prefer?`;
      }

      // If the LLM requested more than 3, add a disclaimer
      if (typeof toolCall.count === "number" && toolCall.count > 3) {
        reply +=
          "\n\nNote: I can only generate a maximum of 3 palettes at once.";
      }

      return {
        kind: "palette",
        reply: reply.trim(),
        conversationId,
        palette: palettes[0],
        palettes: palettes,
        providerUsed: provider,
      };
    }

    // Agent called [discover_styles]
    if (toolCall.tool === "discover_styles") {
      const styles = await discoverStylesWithDirector({
        message: toolCall.message,
        provider: directorProvider,
        model: directorModel,
        geminiApiKey: directorGeminiApiKey,
        openaiApiKey: directorApiKey,
        copilotApiKey: directorCopilotApiKey,
        history,
      });
      state.styles = styles;
      return {
        kind: "discovery",
        reply:
          "I've explored some style directions for you. Which one feels right?",
        conversationId,
        styles: styles,
        providerUsed: directorProvider,
      };
    }

    // Agent called [tweak_palette]
    if (toolCall.tool === "tweak_palette") {
      if (!request.currentPalette) {
        return {
          kind: "text",
          reply:
            "I'd love to tweak that for you, but it looks like you don't have an active palette generated yet. Let's make one first!",
          conversationId,
        };
      }

      const tResult = await callTweakTool({
        palette: request.currentPalette as Palette,
        mood: toolCall.mood,
        provider,
        model,
        allowFallback: true,
        geminiApiKey,
        openaiApiKey,
        copilotApiKey,
        history,
      });
      return {
        kind: "tweak",
        reply: "Done! I've tweaked the palette as requested.",
        conversationId,
        palette: tResult.palette,
        providerUsed: provider,
      };
    }

    // Fallback if tool parsing fails
    return {
      kind: "text",
      reply: "I encountered an issue executing that tool.",
      conversationId,
    };
  } catch (error) {
    return {
      kind: "error",
      reply: `Agent AI error: ${getErrorMessage(error)}`,
      conversationId,
    };
  }
}
