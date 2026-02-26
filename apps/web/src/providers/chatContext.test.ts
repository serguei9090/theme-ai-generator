import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  fetchMcpDefaults,
  getLoadingMessage,
  isValidModelForProvider,
  parseStorageSettings,
} from "./chatContext";

describe("chatContext helpers", () => {
  describe("isValidModelForProvider", () => {
    it("returns true for any model with ollama provider", () => {
      expect(isValidModelForProvider("random-model", "ollama")).toBe(true);
    });

    it("returns true for valid gemini models", () => {
      expect(isValidModelForProvider("gemini-2.5-flash", "gemini")).toBe(true);
    });

    it("returns false for invalid gemini models", () => {
      expect(isValidModelForProvider("gpt-4o", "gemini")).toBe(false);
    });

    it("returns true for valid openai models", () => {
      expect(isValidModelForProvider("gpt-4o-mini", "openai")).toBe(true);
    });

    it("returns false for invalid openai models", () => {
      expect(isValidModelForProvider("gemini-pro", "openai")).toBe(false);
    });
  });

  describe("parseStorageSettings", () => {
    it("returns empty result for null input", () => {
      const result = parseStorageSettings(null);
      expect(result.storedModel).toBe("");
      expect(result.storedProvider).toBeNull();
    });

    it("parses valid settings", () => {
      const settings = {
        provider: "openai",
        model: "gpt-4o",
        directorProvider: "gemini",
        directorModel: "gemini-2.5-pro",
        geminiApiKey: "g-key",
        openaiApiKey: "o-key",
        defaultPrompt: "modern dashboard",
      };
      const result = parseStorageSettings(JSON.stringify(settings));
      expect(result.storedProvider).toBe("openai");
      expect(result.storedModel).toBe("gpt-4o");
      expect(result.directorProvider).toBe("gemini");
      expect(result.directorModel).toBe("gemini-2.5-pro");
      expect(result.geminiApiKey).toBe("g-key");
      expect(result.openaiApiKey).toBe("o-key");
      expect(result.storedPrompt).toBe("modern dashboard");
    });

    it("ignores invalid provider", () => {
      const settings = { provider: "invalid-provider" };
      const result = parseStorageSettings(JSON.stringify(settings));
      expect(result.storedProvider).toBeNull();
    });

    it("handles corrupted JSON", () => {
      const result = parseStorageSettings("{invalid json");
      expect(result.storedProvider).toBeNull();
    });
  });

  describe("getLoadingMessage", () => {
    it("returns specific message for generate_palette", () => {
      expect(getLoadingMessage("generate_palette")).toBe(
        "Generating your palette...",
      );
    });

    it("returns default message when no tool is provided", () => {
      expect(getLoadingMessage(null)).toBe(
        "The Creative Director is drafting ideas...",
      );
    });
  });

  describe("fetchMcpDefaults", () => {
    beforeEach(() => {
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              defaults: {
                provider: "openai",
                models: { openai: "gpt-4o" },
              },
            }),
        } as Response),
      );
    });

    it("fetches defaults from MCP health endpoint", async () => {
      const result = await fetchMcpDefaults();
      expect(result.serverDefaultProvider).toBe("openai");
      expect(result.resolvedDefaults.openai).toBe("gpt-4o");
    });

    it("falls back to defaults on fetch failure", async () => {
      globalThis.fetch = mock(() => Promise.reject(new Error("Network Error")));
      const result = await fetchMcpDefaults();
      expect(result.serverDefaultProvider).toBe("ollama");
      expect(result.resolvedDefaults.gemini).toBe("gemini-2.5-flash-lite");
    });
  });
});
