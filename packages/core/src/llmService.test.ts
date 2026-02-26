import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import {
  canonicalizeProvider,
  discoverStyles,
  enforcePaletteAccessibility,
  evaluatePaletteAccessibility,
  interpretColorIntent,
  PALETTE_KEYS,
  type Palette,
  routeToProvider,
  tweakPalette,
  validatePalette,
} from "./llmService";

// Mock @google/genai
mock.module("@google/genai", () => ({
  GoogleGenAI: class {
    constructor() {}
    models = {
      generateContent: async () => ({
        text: JSON.stringify({
          background: "#ffffff",
          surface: "#f8fafc",
          surfaceSecondary: "#f1f5f9",
          border: "#e2e8f0",
          primary: "#0f172a",
          onPrimary: "#ffffff",
          primaryContainer: "#334155",
          primaryHover: "#1e293b",
          accent: "#3b82f6",
          onAccent: "#ffffff",
          accentHover: "#2563eb",
          text: "#0f172a",
          textMedium: "#334155",
          textLow: "#64748b",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
          explain: "Gemini response",
        }),
      }),
    };
  },
}));

// Mock @github/copilot-sdk
mock.module("@github/copilot-sdk", () => ({
  CopilotClient: class {
    constructor() {}
    async start() {}
    async stop() {}
    async listModels() {
      return [{ id: "gpt-4o", name: "GPT-4o" }];
    }
    async createSession() {
      return {
        sendAndWait: async () => ({
          data: {
            content: JSON.stringify({
              background: "#ffffff",
              surface: "#f8fafc",
              surfaceSecondary: "#f1f5f9",
              border: "#e2e8f0",
              primary: "#0f172a",
              onPrimary: "#ffffff",
              primaryContainer: "#334155",
              primaryHover: "#1e293b",
              accent: "#3b82f6",
              onAccent: "#ffffff",
              accentHover: "#2563eb",
              text: "#0f172a",
              textMedium: "#334155",
              textLow: "#64748b",
              success: "#22c55e",
              warning: "#eab308",
              error: "#ef4444",
              explain: "Copilot response",
            }),
          },
        }),
        getMessages: async () => [],
        destroy: async () => {},
      };
    }
  },
}));

describe("llmService", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.OLLAMA_DEFAULT_MODEL = "llama3";
    process.env.PROVIDER_DEBUG = "false";
  });

  describe("pure functions", () => {
    describe("canonicalizeProvider", () => {
      it("canonicalizes aistudio to gemini", () => {
        expect(canonicalizeProvider("aistudio")).toBe("gemini");
      });

      it("accepts valid providers", () => {
        expect(canonicalizeProvider("gemini")).toBe("gemini");
        expect(canonicalizeProvider("ollama")).toBe("ollama");
        expect(canonicalizeProvider("openai")).toBe("openai");
        expect(canonicalizeProvider("copilot")).toBe("copilot");
      });

      it("returns null for invalid providers", () => {
        expect(canonicalizeProvider("unknown")).toBeNull();
        expect(canonicalizeProvider(123)).toBeNull();
        expect(canonicalizeProvider(null)).toBeNull();
      });
    });

    describe("validatePalette", () => {
      const validPalette: Palette = {
        background: "#ffffff",
        surface: "#f8fafc",
        surfaceSecondary: "#f1f5f9",
        border: "#e2e8f0",
        primary: "#0f172a",
        onPrimary: "#ffffff",
        primaryContainer: "#334155",
        primaryHover: "#1e293b",
        accent: "#3b82f6",
        onAccent: "#ffffff",
        accentHover: "#2563eb",
        text: "#0f172a",
        textMedium: "#334155",
        textLow: "#64748b",
        success: "#22c55e",
        warning: "#eab308",
        error: "#ef4444",
      };

      it("validates a correct palette", () => {
        expect(validatePalette(validPalette)).toBe(true);
      });

      it("rejects palette with missing keys", () => {
        const { background, ...incomplete } = validPalette;
        expect(validatePalette(incomplete)).toBe(false);
      });

      it("rejects palette with invalid hex codes", () => {
        const invalid = { ...validPalette, background: "invalid" };
        expect(validatePalette(invalid)).toBe(false);

        const tooShort = { ...validPalette, background: "#fff" };
        expect(validatePalette(tooShort)).toBe(false);
      });

      it("rejects non-object inputs", () => {
        expect(validatePalette(null)).toBe(false);
        expect(validatePalette(undefined)).toBe(false);
        expect(validatePalette("not a palette")).toBe(false);
      });
    });

    describe("accessibility functions", () => {
      const goodPalette: Palette = {
        background: "#ffffff",
        surface: "#f8fafc",
        surfaceSecondary: "#f1f5f9",
        border: "#e2e8f0",
        primary: "#0f172a",
        onPrimary: "#ffffff",
        primaryContainer: "#334155",
        primaryHover: "#1e293b",
        accent: "#3b82f6",
        onAccent: "#ffffff",
        accentHover: "#2563eb",
        text: "#0f172a",
        textMedium: "#334155",
        textLow: "#64748b",
        success: "#22c55e",
        warning: "#eab308",
        error: "#ef4444",
      };

      const badContrastPalette: Palette = {
        ...goodPalette,
        background: "#ffffff",
        text: "#eeeeee", // very low contrast against white
      };

      it("evaluatePaletteAccessibility returns contrast ratios", () => {
        const metrics = evaluatePaletteAccessibility(goodPalette);
        expect(metrics.textVsBackground).toBeGreaterThan(4.5);
        expect(metrics.onPrimaryVsPrimary).toBeGreaterThan(4.5);
      });

      it("enforcePaletteAccessibility fixes low contrast text", () => {
        const fixed = enforcePaletteAccessibility(badContrastPalette);
        expect(
          evaluatePaletteAccessibility(fixed).textVsBackground,
        ).toBeGreaterThan(4.5);
        expect(fixed.text).toBe("#111111"); // Should choose black for white background
      });

      it("enforcePaletteAccessibility leaves good contrast alone", () => {
        const fixed = enforcePaletteAccessibility(goodPalette);
        expect(fixed).toEqual(goodPalette);
      });
    });

    describe("interpretColorIntent", () => {
      it("interprets color intent successfully", async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async (_url: string, _init: any) => {
          return new Response(
            JSON.stringify({
              message: {
                content: JSON.stringify({
                  hex: "#2d6a4f",
                  interpretation: "Rich forest green for primary",
                }),
              },
            }),
            { status: 200 },
          );
        }) as typeof fetch;

        const result = await interpretColorIntent({
          key: "primary",
          userPrompt: "forest green",
          currentPalette: { primary: "#000000" } as any,
          provider: "ollama",
        });

        expect(result.hex).toBe("#2d6a4f");
        expect(result.interpretation).toBe("Rich forest green for primary");
        globalThis.fetch = originalFetch;
      });

      it("handles invalid JSON response", async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () => {
          return new Response(
            JSON.stringify({
              message: {
                content: "Not JSON",
              },
            }),
            { status: 200 },
          );
        }) as typeof fetch;

        expect(
          interpretColorIntent({
            key: "primary",
            userPrompt: "forest green",
            currentPalette: { primary: "#000000" } as any,
            provider: "ollama",
          }),
        ).rejects.toThrow(/unparseable response/);
        globalThis.fetch = originalFetch;
      });

      it("handles invalid hex in response", async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async (_url: string, _init: any) => {
          return new Response(
            JSON.stringify({
              message: {
                content: JSON.stringify({
                  hex: "invalid",
                }),
              },
            }),
            { status: 200 },
          );
        }) as typeof fetch;

        expect(
          interpretColorIntent({
            key: "primary",
            userPrompt: "forest green",
            currentPalette: { primary: "#000000" } as any,
            provider: "ollama",
          }),
        ).rejects.toThrow(/invalid hex/);
        globalThis.fetch = originalFetch;
      });
    });
  });

  describe("routeToProvider", () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("handles success path for ollama", async () => {
      globalThis.fetch = (async (_url: string, _init: any) => {
        return new Response(
          JSON.stringify({
            message: {
              content: JSON.stringify({
                background: "#ffffff",
                surface: "#f8fafc",
                surfaceSecondary: "#f1f5f9",
                border: "#e2e8f0",
                primary: "#0f172a",
                onPrimary: "#ffffff",
                primaryContainer: "#334155",
                primaryHover: "#1e293b",
                accent: "#3b82f6",
                onAccent: "#ffffff",
                accentHover: "#2563eb",
                text: "#0f172a",
                textMedium: "#334155",
                textLow: "#64748b",
                success: "#22c55e",
                warning: "#eab308",
                error: "#ef4444",
                explain: "Ollama response",
              }),
            },
          }),
          { status: 200 },
        );
      }) as typeof fetch;

      const result = await routeToProvider("ollama", "modern dashboard");
      expect(result.providerUsed).toBe("ollama");
      expect(result.explain).toBe("Ollama response");
      expect(validatePalette(result.palette)).toBe(true);
    });

    it("uses fallback on provider error", async () => {
      globalThis.fetch = (async () => {
        return new Response("Error", { status: 500 });
      }) as typeof fetch;

      const result = await routeToProvider("ollama", "modern dashboard");
      expect(result.providerUsed).toBe("deterministic");
      expect(result.fallbackUsed).toBe(true);
      expect(result.explain).toContain("Fallback palette generated locally");
    });

    it("throws when allowFallback is false", async () => {
      globalThis.fetch = (async () => {
        return new Response("Error", { status: 500 });
      }) as typeof fetch;

      expect(
        routeToProvider("ollama", "modern dashboard", { allowFallback: false }),
      ).rejects.toThrow();
    });

    it("works with gemini mock", async () => {
      const result = await routeToProvider("gemini", "modern dashboard");
      expect(result.providerUsed).toBe("gemini");
      expect(result.explain).toBe("Gemini response");
    });

    it("works with copilot mock", async () => {
      const result = await routeToProvider("copilot", "modern dashboard");
      expect(result.providerUsed).toBe("copilot");
      expect(result.explain).toBe("Copilot response");
    });
  });

  describe("tweakPalette", () => {
    const basePalette: Palette = {
      background: "#ffffff",
      surface: "#f8fafc",
      surfaceSecondary: "#f1f5f9",
      border: "#e2e8f0",
      primary: "#0f172a",
      onPrimary: "#ffffff",
      primaryContainer: "#334155",
      primaryHover: "#1e293b",
      accent: "#3b82f6",
      onAccent: "#ffffff",
      accentHover: "#2563eb",
      text: "#0f172a",
      textMedium: "#334155",
      textLow: "#64748b",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444",
    };

    it("tweaks by direct updates", async () => {
      const result = await tweakPalette({
        palette: basePalette,
        updates: { primary: "#ff0000" },
      });
      expect(result.palette.primary).toBe("#ff0000");
      expect(result.palette.background).toBe(basePalette.background);
    });

    it("tweaks by index and hex", async () => {
      const primaryIndex = PALETTE_KEYS.indexOf("primary");
      const result = await tweakPalette({
        palette: basePalette,
        index: primaryIndex,
        hex: "#00ff00",
      });
      expect(result.palette.primary).toBe("#00ff00");
    });

    it("tweaks by mood (calls routeToProvider)", async () => {
      // routeToProvider is mocked indirectly by mocking fetch/gemini/copilot
      // We'll use a mocked fetch to intercept the call
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (_url: string, _init: any) => {
        return new Response(
          JSON.stringify({
            message: {
              content: JSON.stringify({
                ...basePalette,
                primary: "#abcdef",
                explain: "Mood tweak",
              }),
            },
          }),
          { status: 200 },
        );
      }) as typeof fetch;

      const result = await tweakPalette({
        palette: basePalette,
        mood: "more playful",
        provider: "ollama",
      });
      expect(result.palette.primary).toBe("#abcdef");
      expect(result.explain).toBe("Mood tweak");
      globalThis.fetch = originalFetch;
    });

    it("throws on invalid palette input", async () => {
      expect(
        tweakPalette({
          palette: { ...basePalette, primary: "not-a-hex" } as any,
          updates: { accent: "#000000" },
        }),
      ).rejects.toThrow();
    });
  });

  describe("discoverStyles", () => {
    it("handles success path for ollama", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (_url: string, _init: any) => {
        return new Response(
          JSON.stringify({
            message: {
              content: JSON.stringify({
                styles: [
                  {
                    id: "test-style",
                    title: "Test Style",
                    rationale: "Rationale",
                    moodPrompt: "Mood",
                  },
                  {
                    id: "test-style-2",
                    title: "Test Style 2",
                    rationale: "Rationale 2",
                    moodPrompt: "Mood 2",
                  },
                  {
                    id: "test-style-3",
                    title: "Test Style 3",
                    rationale: "Rationale 3",
                    moodPrompt: "Mood 3",
                  },
                ],
              }),
            },
          }),
          { status: 200 },
        );
      }) as typeof fetch;

      const styles = await discoverStyles("modern app", {});
      expect(styles).toHaveLength(3);
      expect(styles[0].title).toBe("Test Style");
      globalThis.fetch = originalFetch;
    });

    it("uses fallback when LLM fails", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => {
        return new Response("Error", { status: 500 });
      }) as typeof fetch;

      const styles = await discoverStyles("modern app", {});
      expect(styles).toHaveLength(3);
      expect(styles[0].id).toContain("fallback");
      globalThis.fetch = originalFetch;
    });

    it("sanitizes and fills missing styles to exactly 3", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (_url: string, _init: any) => {
        return new Response(
          JSON.stringify({
            message: {
              content: JSON.stringify({
                styles: [
                  {
                    id: "only-one",
                    title: "Only One",
                    rationale: "Rationale",
                    moodPrompt: "Mood",
                  },
                ],
              }),
            },
          }),
          { status: 200 },
        );
      }) as typeof fetch;

      const styles = await discoverStyles("modern app", {});
      expect(styles).toHaveLength(3);
      expect(styles[0].id).toBe("only-one");
      expect(styles[1].id).toContain("fallback");
      globalThis.fetch = originalFetch;
    });
  });

  describe("internal parsing helpers (tested via routeToProvider)", () => {
    it("handles markdown wrapped JSON", async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async (_url: string, _init: any) => {
        return new Response(
          JSON.stringify({
            message: {
              content:
                "```json\n" +
                JSON.stringify({
                  background: "#ffffff",
                  surface: "#f8fafc",
                  surfaceSecondary: "#f1f5f9",
                  border: "#e2e8f0",
                  primary: "#0f172a",
                  onPrimary: "#ffffff",
                  primaryContainer: "#334155",
                  primaryHover: "#1e293b",
                  accent: "#3b82f6",
                  onAccent: "#ffffff",
                  accentHover: "#2563eb",
                  text: "#0f172a",
                  textMedium: "#334155",
                  textLow: "#64748b",
                  success: "#22c55e",
                  warning: "#eab308",
                  error: "#ef4444",
                  explain: "Markdown response",
                }) +
                "\n```",
            },
          }),
          { status: 200 },
        );
      }) as typeof fetch;

      const result = await routeToProvider("ollama", "modern dashboard");
      expect(result.explain).toBe("Markdown response");
      globalThis.fetch = originalFetch;
    });
  });
});
