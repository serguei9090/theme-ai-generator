import {
  canonicalizeProvider,
  interpretColorIntent,
  toHttpError,
  validatePalette,
} from "@theme-ai/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const key =
      typeof body.key === "string" && body.key.trim()
        ? body.key.trim()
        : undefined;
    const userPrompt =
      typeof body.userPrompt === "string" && body.userPrompt.trim()
        ? body.userPrompt.trim()
        : undefined;

    if (!key) {
      return NextResponse.json(
        { error: "key must be a non-empty string" },
        { status: 400 },
      );
    }
    if (!userPrompt) {
      return NextResponse.json(
        { error: "userPrompt must be a non-empty string" },
        { status: 400 },
      );
    }
    if (!validatePalette(body.currentPalette)) {
      return NextResponse.json(
        { error: "currentPalette must be a valid palette object" },
        { status: 400 },
      );
    }

    const provider = canonicalizeProvider(body.provider) ?? "gemini";

    const result = await interpretColorIntent({
      key,
      userPrompt,
      currentPalette: body.currentPalette,
      provider,
      model: typeof body.model === "string" ? body.model : undefined,
      geminiApiKey:
        typeof body.geminiApiKey === "string" ? body.geminiApiKey : undefined,
      openaiApiKey:
        typeof body.openaiApiKey === "string" ? body.openaiApiKey : undefined,
      copilotApiKey:
        typeof body.copilotApiKey === "string" ? body.copilotApiKey : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    const httpError = toHttpError(error);
    return NextResponse.json(
      { error: httpError.message || "Internal Server Error" },
      { status: httpError.status || 500 },
    );
  }
}
