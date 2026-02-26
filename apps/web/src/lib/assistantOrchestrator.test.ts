import { describe, expect, it, mock } from "bun:test";
import { handleAssistantMessage } from "./assistantOrchestrator";
import type { Palette } from "./mcpClient";

// Mock @theme-ai/core
mock.module("@theme-ai/core", () => ({
  providerPrompt: async (provider: any, prompt: any) => {
    if (prompt === "generate") {
      return JSON.stringify({
        tool: "generate_palette",
        moodPrompt: "Generated mood",
      });
    }
    if (prompt === "discover") {
      return JSON.stringify({
        tool: "discover_styles",
        message: "Discovery message",
      });
    }
    if (prompt === "tweak") {
      return JSON.stringify({
        tool: "tweak_palette",
        mood: "Tweak mood",
      });
    }
    return "Hello from assistant!";
  },
  discoverStyles: async () => [
    { id: "s1", title: "Style 1", rationale: "R1", moodPrompt: "M1" },
  ],
}));

// Mock @theme-ai/mcp-server/src/server
mock.module("@theme-ai/mcp-server/src/server", () => ({
  executeGenerate: async () => ({
    palette: { primary: "#000000" } as Palette,
  }),
  executeTweak: async () => ({
    palette: { primary: "#ffffff" } as Palette,
  }),
}));

describe("assistantOrchestrator", () => {
  it("handles simple text reply", async () => {
    const result = await handleAssistantMessage({
      message: "hello",
      conversationId: "test-conv",
    });
    expect(result.kind).toBe("text");
    expect(result.reply).toBe("Hello from assistant!");
  });

  it("handles generate_palette tool call", async () => {
    const result = await handleAssistantMessage({
      message: "generate",
      conversationId: "test-conv",
    });
    expect(result.kind).toBe("palette");
    expect(result.palette?.primary).toBe("#000000");
  });

  it("handles discover_styles tool call", async () => {
    const result = await handleAssistantMessage({
      message: "discover",
      conversationId: "test-conv",
    });
    expect(result.kind).toBe("discovery");
    expect(result.styles).toHaveLength(1);
    expect(result.styles?.[0].id).toBe("s1");
  });

  it("handles tweak_palette tool call", async () => {
    const result = await handleAssistantMessage({
      message: "tweak",
      conversationId: "test-conv",
      currentPalette: { primary: "#000000" } as any,
    });
    expect(result.kind).toBe("tweak");
    expect(result.palette?.primary).toBe("#ffffff");
  });

  it("handles style selection", async () => {
    // First, populate the styles in state by calling discover
    await handleAssistantMessage({
      message: "discover",
      conversationId: "test-conv-2",
    });

    const result = await handleAssistantMessage({
      message: "ignored",
      conversationId: "test-conv-2",
      selection: { styleId: "s1" },
    });
    expect(result.kind).toBe("palette");
    expect(result.palette?.primary).toBe("#000000");
  });
});
