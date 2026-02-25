import { toHttpError } from "@theme-ai/core";
import { executeTweak } from "@theme-ai/mcp-server/src/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await executeTweak({
      palette: body.palette,
      index: body.index,
      hex: body.hex,
      updates: body.updates,
      mood: body.mood,
      provider: body.provider,
      model: body.model,
      allowFallback: body.allowFallback,
      geminiApiKey: body.geminiApiKey,
      openaiApiKey: body.openaiApiKey,
      history: body.history,
    });

    return NextResponse.json({
      palette: result.palette,
      explain: result.explain,
      providerUsed: result.providerUsed,
      fallbackUsed: result.fallbackUsed,
    });
  } catch (error) {
    const httpError = toHttpError(error);
    return NextResponse.json(
      { error: httpError.message || "Internal Server Error" },
      { status: httpError.status || 500 },
    );
  }
}
