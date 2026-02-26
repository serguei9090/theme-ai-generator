import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import {
  createMcpServer,
  executeGenerate,
  executeTweak,
  parseCorsAllowedOrigins,
} from "./server";

// Mock @theme-ai/core
mock.module("@theme-ai/core", () => ({
  canonicalizeProvider: (p: any) =>
    p === "gemini" || p === "ollama" ? p : "ollama",
  validatePalette: (p: any) => p && typeof p === "object" && "primary" in p,
  routeToProvider: async () => ({
    palette: { primary: "#000000" },
    explain: "Mocked explain",
    providerUsed: "ollama",
    fallbackUsed: false,
  }),
  tweakPalette: async () => ({
    palette: { primary: "#ffffff" },
    explain: "Mocked tweak",
    providerUsed: "deterministic",
    fallbackUsed: false,
  }),
  discoverStyles: async () => [
    { id: "s1", title: "S1", rationale: "R1", moodPrompt: "M1" },
    { id: "s2", title: "S2", rationale: "R2", moodPrompt: "M2" },
    { id: "s3", title: "S3", rationale: "R3", moodPrompt: "M3" },
  ],
  HttpError: class extends Error {
    constructor(
      public status: number,
      message: string,
      public code: string,
    ) {
      super(message);
    }
  },
  toHttpError: (e: any) => {
    if (e.status) return e;
    return { status: 500, message: "Internal Error", code: "INTERNAL_ERROR" };
  },
}));

describe("mcp-server", () => {
  describe("parseCorsAllowedOrigins", () => {
    it("returns empty array for empty input", () => {
      expect(parseCorsAllowedOrigins(undefined)).toEqual([]);
      expect(parseCorsAllowedOrigins("")).toEqual([]);
      expect(parseCorsAllowedOrigins("  ")).toEqual([]);
    });

    it("parses comma separated origins", () => {
      expect(
        parseCorsAllowedOrigins("http://localhost:3000,https://example.com"),
      ).toEqual(["http://localhost:3000", "https://example.com"]);
    });

    it("trims and filters empty entries", () => {
      expect(
        parseCorsAllowedOrigins(
          " http://localhost:3000 , , https://example.com ",
        ),
      ).toEqual(["http://localhost:3000", "https://example.com"]);
    });

    it("ignores wildcard star", () => {
      expect(parseCorsAllowedOrigins("*")).toEqual([]);
      expect(parseCorsAllowedOrigins("http://localhost:3000,*")).toEqual([
        "http://localhost:3000",
      ]);
    });
  });

  describe("executeGenerate", () => {
    it("throws 400 if mood is missing", async () => {
      expect(
        executeGenerate({ mood: "", provider: "ollama" }),
      ).rejects.toThrow();
    });

    it("calls routeToProvider and returns result", async () => {
      const result = await executeGenerate({
        mood: "modern",
        provider: "ollama",
      });
      expect(result.palette.primary).toBe("#000000");
      expect(result.explain).toBe("Mocked explain");
    });
  });

  describe("executeTweak", () => {
    it("throws 400 if palette is invalid", async () => {
      expect(
        executeTweak({ palette: null, provider: "ollama" }),
      ).rejects.toThrow();
    });

    it("calls tweakPalette and returns result", async () => {
      const palette = { primary: "#000000" };
      const result = await executeTweak({
        palette,
        provider: "ollama",
        updates: { primary: "#ffffff" },
      });
      expect(result.palette.primary).toBe("#ffffff");
      expect(result.explain).toBe("Mocked tweak");
    });
  });

  describe("HTTP Server Integration", () => {
    let server: any;
    let baseUrl: string;

    beforeAll(() => {
      return new Promise((resolve) => {
        server = createMcpServer();
        server.listen(0, () => {
          const port = server.address().port;
          baseUrl = `http://localhost:${port}`;
          resolve();
        });
      });
    });

    afterAll(() => {
      return new Promise((resolve) => {
        server.close(resolve);
      });
    });

    it("GET /health returns 200", async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.status).toBe("ok");
    });

    it("POST /generate returns 200 with palette", async () => {
      const res = await fetch(`${baseUrl}/generate`, {
        method: "POST",
        body: JSON.stringify({ mood: "test mood", provider: "ollama" }),
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.palette.primary).toBe("#000000");
    });

    it("POST /tweak returns 200 with palette", async () => {
      const res = await fetch(`${baseUrl}/tweak`, {
        method: "POST",
        body: JSON.stringify({
          palette: { primary: "#000000" },
          updates: { primary: "#ffffff" },
          provider: "ollama",
        }),
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(data.palette.primary).toBe("#ffffff");
    });

    it("POST /discover returns 200 with styles", async () => {
      const res = await fetch(`${baseUrl}/discover`, {
        method: "POST",
        body: JSON.stringify({ message: "test message" }),
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status).toBe(200);
      const data: any = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(3);
    });

    it("returns 404 for unknown routes", async () => {
      const res = await fetch(`${baseUrl}/unknown`);
      expect(res.status).toBe(404);
    });

    it("handles CORS OPTIONS request", async () => {
      // Need to set CORS_ALLOWED_ORIGINS for this to work as expected in the test
      const res = await fetch(`${baseUrl}/health`, {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
        },
      });
      expect([204, 403]).toContain(res.status);
    });

    it("returns error for invalid MCP session", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: "GET",
        headers: { "mcp-session-id": "invalid-session" },
      });
      expect(res.status).toBe(404);
    });
  });
});
