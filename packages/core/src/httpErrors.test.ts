import { describe, expect, it } from "bun:test";
import { HttpError, toHttpError } from "./httpErrors";

describe("httpErrors", () => {
  describe("HttpError class", () => {
    it("creates an instance with correct properties", () => {
      const error = new HttpError(404, "Not Found", "NOT_FOUND");
      expect(error.status).toBe(404);
      expect(error.message).toBe("Not Found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.name).toBe("HttpError");
    });
  });

  describe("toHttpError", () => {
    it("returns the error if it is already an HttpError", () => {
      const original = new HttpError(403, "Forbidden", "CORS_FORBIDDEN");
      const result = toHttpError(original);
      expect(result).toBe(original);
    });

    it("maps SyntaxError to 400 INVALID_JSON", () => {
      const error = new SyntaxError("Unexpected token");
      const result = toHttpError(error);
      expect(result.status).toBe(400);
      expect(result.code).toBe("INVALID_JSON");
    });

    it("maps validation patterns to 400 BAD_REQUEST", () => {
      const result = toHttpError("prompt cannot be empty");
      expect(result.status).toBe(400);
      expect(result.code).toBe("BAD_REQUEST");

      const result2 = toHttpError("index must be between 0 and 16");
      expect(result2.status).toBe(400);
    });

    it("maps configuration issues to 503 SERVICE_MISCONFIGURED", () => {
      const result = toHttpError("OPENAI_API_KEY is not configured");
      expect(result.status).toBe(503);
      expect(result.code).toBe("SERVICE_MISCONFIGURED");
    });

    it("maps timeout patterns to 504 UPSTREAM_TIMEOUT", () => {
      const result = toHttpError("The operation was aborted");
      expect(result.status).toBe(504);
      expect(result.code).toBe("UPSTREAM_TIMEOUT");
    });

    it("maps rate limit patterns to 429 RATE_LIMIT_EXCEEDED", () => {
      const result = toHttpError("Gemini Rate Limit reached");
      expect(result.status).toBe(429);
      expect(result.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("maps upstream failure patterns to 502 UPSTREAM_FAILURE", () => {
      const result = toHttpError("Ollama adapter failed: error 500");
      expect(result.status).toBe(502);
      expect(result.code).toBe("UPSTREAM_FAILURE");
    });

    it("defaults to 500 INTERNAL_ERROR for unknown errors", () => {
      const result = toHttpError(new Error("Something went wrong"));
      expect(result.status).toBe(500);
      expect(result.code).toBe("INTERNAL_ERROR");
      expect(result.message).toBe("Internal server error");
    });

    it("handles non-Error objects", () => {
      const result = toHttpError("Unknown string error");
      expect(result.status).toBe(500);
    });
  });
});
