import { describe, expect, mock, test } from "bun:test";
import { postAssistantMessage } from "./assistantClient";
import type { AssistantMessageRequest } from "./assistantTypes";

describe("assistantClient", () => {
  const mockPayload: AssistantMessageRequest = {
    message: "hello",
    history: [],
    currentPalette: {
      background: "#ffffff",
      surface: "#f8fafc",
      surfaceSecondary: "#f1f5f9",
      border: "#e2e8f0",
      primary: "#0f172a",
      onPrimary: "#ffffff",
      primaryContainer: "#cbd5e1",
      primaryHover: "#1e293b",
      accent: "#3b82f6",
      onAccent: "#ffffff",
      accentHover: "#2563eb",
      text: "#0f172a",
      textMedium: "#475569",
      textLow: "#94a3b8",
      success: "#22c55e",
      warning: "#eab308",
      error: "#ef4444",
    },
    paletteEngine: {
      provider: "gemini",
    },
    director: {
      provider: "gemini",
    },
  };

  test("should successfully post a message and return the response", async () => {
    const mockResponse = {
      kind: "chat",
      reply: "Hello! How can I help you?",
    };

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response),
    );

    const result = await postAssistantMessage(mockPayload);

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    // biome-ignore lint/suspicious/noExplicitAny: Mock fetch cast required for checking arguments
    const fetchArgs = (globalThis.fetch as any).mock.calls[0];
    expect(fetchArgs[0]).toBe("/api/assistant/message");
    expect(fetchArgs[1].method).toBe("POST");
  });

  test("should handle API error response", async () => {
    const errorData = { error: "Too many requests" };

    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        json: () => Promise.resolve(errorData),
      } as Response),
    );

    const result = await postAssistantMessage(mockPayload);

    expect(result).toEqual({
      kind: "error",
      reply: "Too many requests",
    });
  });

  test("should handle non-JSON error response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Not JSON")),
      } as Response),
    );

    const result = await postAssistantMessage(mockPayload);

    expect(result).toEqual({
      kind: "error",
      reply: "Assistant request failed (500)",
    });
  });

  test("should handle network errors", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("Network failure")));

    const result = await postAssistantMessage(mockPayload);

    expect(result).toEqual({
      kind: "error",
      reply: "Network failure",
    });
  });
});
