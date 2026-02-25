import { describe, expect, it } from "bun:test";
import {
  diagnoseServerIssue,
  generateThemePalette,
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
});
