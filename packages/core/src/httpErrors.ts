export type ErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "CORS_FORBIDDEN"
  | "UPSTREAM_FAILURE"
  | "UPSTREAM_TIMEOUT"
  | "RATE_LIMIT_EXCEEDED"
  | "SERVICE_MISCONFIGURED"
  | "INTERNAL_ERROR";

export class HttpError extends Error {
  status: number;
  code: ErrorCode;

  constructor(status: number, message: string, code: ErrorCode) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function hasPattern(text: string, pattern: RegExp) {
  return pattern.test(text.toLowerCase());
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof SyntaxError) {
    return new HttpError(
      400,
      "Request body must be valid JSON",
      "INVALID_JSON",
    );
  }

  const message = getErrorMessage(error);

  if (
    hasPattern(
      message,
      /(prompt cannot be empty|prompt too long|must be|invalid hex|index must|provide updates|not supported|ambiguous)/,
    )
  ) {
    return new HttpError(400, message, "BAD_REQUEST");
  }

  if (
    hasPattern(message, /(not configured|model is required|missing api key)/)
  ) {
    return new HttpError(503, message, "SERVICE_MISCONFIGURED");
  }

  if (hasPattern(message, /(timed out|timeout|abort|aborted)/)) {
    return new HttpError(504, message, "UPSTREAM_TIMEOUT");
  }

  if (
    hasPattern(
      message,
      /(rate limit|too many requests|429|exhausted|quota exceeded)/,
    )
  ) {
    return new HttpError(
      429,
      "AI model rate limit reached. Please wait or check your API quota.",
      "RATE_LIMIT_EXCEEDED",
    );
  }

  if (
    hasPattern(
      message,
      /(adapter failed|returned no text|upstream|openai error|gemini error|ollama error|copilot sdk returned no assistant content|unable to parse json from model response)/,
    )
  ) {
    return new HttpError(502, message, "UPSTREAM_FAILURE");
  }

  return new HttpError(500, "Internal server error", "INTERNAL_ERROR");
}
