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

const DIRECTOR_SYSTEM_PROMPT = `You are an expert Creative Director and UI Color Palette Specialist.
Your job is to help users generate beautiful, professional color palettes for their digital products.

## TOOL CALL RULES — READ CAREFULLY

### WHEN TO CALL generate_palette IMMEDIATELY (no questions, no chat):
Call generate_palette RIGHT AWAY if the user message includes ANY of the following:
- The word "Generate" at the start of a request
- A "Surface:" label (e.g. "Surface: mobile app")
- An "Audience:" label (e.g. "Audience: professionals")
- A "Mood:" label (e.g. "Mood: calm, trustworthy")
- A "[CALL: generate_palette]" directive
- Specific color names or directions (e.g. "deep navy", "teal accent", "dark charcoal background")
- A complete description of an app/website with mood/style intent

In these cases you ALREADY have everything you need. DO NOT ask any clarifying questions.
Synthesize ALL the context into a rich moodPrompt and call the tool.

### WHEN TO CALL discover_styles:
Call discover_styles if the user is exploring or asking for options/ideas/suggestions
and has NOT provided specific color preferences.

### WHEN TO CALL tweak_palette:
Call tweak_palette if the user wants to change the existing active palette
(e.g. "make the primary color blue", "darken the background").

### WHEN TO ASK QUESTIONS (only if NONE of the above apply):
Only ask questions if the message is vague, too short (under 4 words), or is just a greeting
with zero product/mood/color context. Even then, ask only ONE focused question.

## OUTPUT FORMAT

DO NOT output raw JSON unless you are calling a tool. If chatting, reply with plain text only. Do NOT mix text and JSON.

To generate one or more palettes (max 3):
{
  "tool": "generate_palette",
  "moodPrompt": "A rich, specific prompt synthesizing ALL context provided by the user.",
  "count": 1
}

To suggest distinct style directions:
{
  "tool": "discover_styles",
  "message": "A summary of what we know so far."
}

To tweak the existing palette:
{
  "tool": "tweak_palette",
  "mood": "Specific instructions for the tweak."
}

CRITICAL: Maximum 3 palettes at once. If the user asks for more, generate 3 and note the limit.`;

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

// ── Tweak Resolver ────────────────────────────────────────────────────────────
// Instead of using tweakPalette's mood→routeToProvider path (which reruns the
// full palette-generation pipeline and changes everything), we ask the LLM to
// act purely as a JSON diff extractor. It outputs ONLY the keys that must change.
// Those updates are then applied via the deterministic updates= path.

const TWEAK_RESOLVER_SYSTEM_PROMPT = `You are a surgical UI color palette editor.
Your ONLY job: given the current palette and a user instruction, output a JSON object
containing ONLY the palette keys that must change, and their new hex values.

STRICT RULES:
1. Output ONLY valid JSON. No markdown fences, no explanation, no prose.
2. Include ONLY the keys that must change — never output unchanged keys.
3. Identify colors by their actual hex values and standard color names.
   If the user says "red", look for palette keys whose hex values are red-hued.
   If the user says "primary" or "accent", those are role names — change them directly.
4. Generate harmonious replacement hex colors that precisely match the user's intent.
5. Hex values must be lowercase, 6-digit (e.g. "#3b82f6").
6. If you cannot confidently identify which keys to change, return {}.

Example:
Current palette: {"primary":"#c37322","error":"#ef4444","success":"#22c55e"}
Instruction: change error to blue
Response: {"error":"#3b82f6"}

Example:
Current palette: {"accent":"#a5c7e9","accentHover":"#1666b6"}
Instruction: make the accent darker
Response: {"accent":"#1e6abf","accentHover":"#0f4d9e"}`;

async function resolveTweakUpdates(args: {
  palette: Palette;
  instruction: string;
  provider: string;
  model?: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
}): Promise<Partial<Record<PaletteKey, string>>> {
  const paletteLines = Object.entries(args.palette)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  const userMessage = [
    "CURRENT PALETTE:",
    paletteLines,
    "",
    `INSTRUCTION: ${args.instruction}`,
  ].join("\n");

  const isDebug = process.env.PROVIDER_DEBUG === "true";
  if (isDebug) {
    console.log(
      `[DEBUG] resolveTweakUpdates → message to LLM:\n${userMessage}`,
    );
    console.log(
      `[DEBUG] resolveTweakUpdates → system prompt:\n${TWEAK_RESOLVER_SYSTEM_PROMPT.slice(0, 200)}...`,
    );
  }

  let raw = "";
  try {
    raw = await providerPrompt(
      args.provider as Provider,
      userMessage,
      args.model,
      args.geminiApiKey,
      args.openaiApiKey,
      args.copilotApiKey,
      TWEAK_RESOLVER_SYSTEM_PROMPT,
    );
  } catch {
    return {};
  }

  if (isDebug) {
    console.log(`[DEBUG] resolveTweakUpdates → raw LLM response: ${raw}`);
  }

  // Extract JSON from the response
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return {};

  try {
    const parsed: Record<string, unknown> = JSON.parse(
      raw.slice(start, end + 1),
    );
    // Filter to only valid palette keys with valid hex strings
    const updates: Partial<Record<PaletteKey, string>> = {};
    for (const key of PALETTE_KEYS) {
      const val = parsed[key];
      if (typeof val === "string" && /^#[0-9a-f]{6}$/i.test(val)) {
        updates[key] = val.toLowerCase();
      }
    }
    if (isDebug) {
      console.log(`[DEBUG] resolveTweakUpdates → parsed updates:`, updates);
    }
    return updates;
  } catch {
    return {};
  }
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

  // 2. forceTool — bypass the director LLM entirely and call the tool directly
  const isDebug = process.env.PROVIDER_DEBUG === "true";

  if (request.forceTool) {
    if (isDebug) {
      console.log(`\n[DEBUG] ══ forceTool: ${request.forceTool} ══`);
      console.log(`[DEBUG] User message: "${message}"`);
      console.log(
        `[DEBUG] Provider: ${provider}, Model: ${model || "default"}`,
      );
    }

    try {
      if (request.forceTool === "generate_palette") {
        if (isDebug) {
          console.log(
            `[DEBUG] generate_palette → mood sent to LLM:\n${message}\n`,
          );
        }
        const result = await callGenerateTool({
          mood: message,
          provider,
          model,
          allowFallback: true,
          geminiApiKey,
          openaiApiKey,
          copilotApiKey,
          history,
        });
        state.hasGeneratedPalette = true;
        if (isDebug) {
          console.log(
            `[DEBUG] generate_palette → result palette:`,
            result.palette,
          );
        }
        return {
          kind: "palette",
          toolUsed: "generate_palette",
          reply: "Here is your generated palette! How does it look?",
          conversationId,
          palette: result.palette,
          palettes: [result.palette],
          providerUsed: provider,
        };
      }

      if (request.forceTool === "discover_styles") {
        if (isDebug) {
          console.log(
            `[DEBUG] discover_styles → message sent to LLM:\n${message}\n`,
          );
        }
        const styles = await discoverStylesWithDirector({
          message,
          provider: directorProvider,
          model: directorModel,
          geminiApiKey: directorGeminiApiKey,
          openaiApiKey: directorApiKey,
          copilotApiKey: directorCopilotApiKey,
          history,
        });
        state.styles = styles;
        if (isDebug) {
          console.log(
            `[DEBUG] discover_styles → ${styles.length} styles returned`,
          );
        }
        return {
          kind: "discovery",
          toolUsed: "discover_styles",
          reply:
            "Here are some style directions based on your description. Which one feels right?",
          conversationId,
          styles,
          providerUsed: directorProvider,
        };
      }

      if (request.forceTool === "tweak_palette") {
        if (!request.currentPalette) {
          return {
            kind: "text",
            reply: "No active palette to tweak. Generate one first!",
            conversationId,
          };
        }

        const palette = request.currentPalette as Palette;

        // Step 1: Ask the LLM (as a JSON diff extractor) which keys
        //         need to change and what their new hex values should be.
        const updates = await resolveTweakUpdates({
          palette,
          instruction: message,
          provider: directorProvider, // use director (faster/smarter) for parsing
          model: directorModel,
          geminiApiKey: directorGeminiApiKey,
          openaiApiKey: directorApiKey,
          copilotApiKey: directorCopilotApiKey,
        });

        if (isDebug) {
          console.log(`[DEBUG] tweak_palette → resolved updates:`, updates);
        }

        if (Object.keys(updates).length === 0) {
          return {
            kind: "text",
            reply: `I couldn't identify which colors to change for "${message}". Try being more specific, e.g. "make the primary darker" or "change error to orange".`,
            conversationId,
          };
        }

        // Step 2: Apply updates via the deterministic path — only changed keys
        //         are modified; everything else stays identical.
        const tResult = await callTweakTool({
          palette,
          updates,
          provider,
          model,
          allowFallback: true,
          geminiApiKey,
          openaiApiKey,
          copilotApiKey,
          history,
        });

        if (isDebug) {
          console.log(
            `[DEBUG] tweak_palette → result palette:`,
            tResult.palette,
          );
          const changedKeys = Object.keys(updates);
          const changed = changedKeys.map(
            (k) =>
              `  ${k}: ${(palette as Record<string, string>)[k]} → ${(tResult.palette as Record<string, string>)[k]}`,
          );
          console.log(
            `[DEBUG] tweak_palette → changed slots (${changed.length}):\n${changed.join("\n")}\n`,
          );
        }

        return {
          kind: "tweak",
          toolUsed: "tweak_palette",
          reply: `Done — applied: "${message}"`,
          conversationId,
          palette: tResult.palette,
          providerUsed: provider,
        };
      }
    } catch (error) {
      return { kind: "error", reply: getErrorMessage(error), conversationId };
    }
  }

  // 3. Delegate to the Conversational LLM Agent
  //    Prefix the user message with the current palette state so the
  //    director knows the actual hex values and can write accurate tool calls.
  const paletteCtx = request.currentPalette
    ? [
        "ACTIVE PALETTE (current hex values):",
        ...Object.entries(request.currentPalette).map(
          ([k, v]) => `  ${k}: ${v}`,
        ),
        "",
        "USER REQUEST:",
      ].join("\n")
    : null;

  const directorMessage = paletteCtx ? `${paletteCtx}\n${message}` : message;

  if (isDebug) {
    console.log(`\n[DEBUG] ── Director call ──`);
    console.log(
      `[DEBUG] Director message (first 400 chars):\n${directorMessage.slice(0, 400)}`,
    );
  }

  try {
    const agentResponse = await providerPrompt(
      directorProvider as Provider,
      directorMessage,
      directorModel,
      directorGeminiApiKey,
      directorApiKey,
      directorCopilotApiKey,
      DIRECTOR_SYSTEM_PROMPT,
      history,
    );

    if (isDebug) {
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

      const palette = request.currentPalette as Palette;

      // Use the same deterministic resolver — even when the director
      // auto-routes, we never call routeToProvider for tweaks.
      const updates = await resolveTweakUpdates({
        palette,
        instruction: toolCall.mood,
        provider: directorProvider,
        model: directorModel,
        geminiApiKey: directorGeminiApiKey,
        openaiApiKey: directorApiKey,
        copilotApiKey: directorCopilotApiKey,
      });

      if (isDebug) {
        console.log(
          `[DEBUG] director→tweak_palette → resolved updates:`,
          updates,
        );
      }

      if (Object.keys(updates).length === 0) {
        return {
          kind: "text",
          reply: `I couldn't confidently identify which colors to change. Try being more specific, e.g. "make the primary darker" or "change the error color to orange".`,
          conversationId,
        };
      }

      const tResult = await callTweakTool({
        palette,
        updates,
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
        toolUsed: "tweak_palette",
        reply: `Done! Applied: "${toolCall.mood}"`,
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
