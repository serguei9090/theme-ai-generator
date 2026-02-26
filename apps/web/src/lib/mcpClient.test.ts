import { describe, expect, it } from "bun:test";
import {
  diagnoseServerIssue,
  generateThemePalette,
  normalizeProvider,
  resolveMcpBaseUrl,
} from "./mcpClient";

describe("mcpClient", () => {
  it("defaults MCP base URL to internal proxy when env is not set", () => {
    expect(resolveMcpBaseUrl(undefined)).toBe("/api/mcp");
    expect(resolveMcpBaseUrl("")).toBe("/api/mcp");
  });

  it("normalizes configured MCP base URL", () => {
    expect(resolveMcpBaseUrl("http://localhost:41234/")).toBe(
      "http://localhost:41234",
    );
  });

  it("returns a helpful stale-server message when health endpoint is missing", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response("", {
          status: 404,
        }),
      )) as typeof fetch;

    const result = await diagnoseServerIssue(
      "Ollama adapter failed: The operation was aborted.",
    );
    expect(result).toContain("MCP server appears outdated");
    globalThis.fetch = originalFetch;
  });

  it("uses proxy endpoint by default for generate requests", async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl = "";
    globalThis.fetch = (async (input, _init) => {
      requestedUrl = String(input);
      return new Response(
        JSON.stringify({
          palette: {
            primary: "#0969da",
            secondary: "#6366f1",
            accent: "#0ea5e9",
            background: "#ffffff",
            text: "#24292f",
          },
          providerUsed: "deterministic",
          fallbackUsed: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof fetch;

    await generateThemePalette({ mood: "modern ui" });
    expect(requestedUrl).toContain("/api/mcp/generate");
    globalThis.fetch = originalFetch;
  });

  describe("normalizeProvider", () => {
    it("canonicalizes aistudio to gemini", () => {
      expect(normalizeProvider("aistudio")).toBe("gemini");
    });

    it("defaults to ollama for invalid input", () => {
      expect(normalizeProvider(undefined)).toBe("ollama");
      // biome-ignore lint/suspicious/noExplicitAny: Intentional invalid input for test
      expect(normalizeProvider("unknown" as any)).toBe("ollama");
    });

    it("preserves valid providers", () => {
      expect(normalizeProvider("openai")).toBe("openai");
      expect(normalizeProvider("gemini")).toBe("gemini");
      expect(normalizeProvider("copilot")).toBe("copilot");
    });
  });

  it("handles fetch errors and diagnostics", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: "operation was aborted" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      )) as typeof fetch;

    try {
      await generateThemePalette({ mood: "fail" });
    } catch (error) {
      expect((error as Error).message).toContain("Ollama likely timed out");
    }
    globalThis.fetch = originalFetch;
  });
});
