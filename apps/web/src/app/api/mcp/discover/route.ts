import {
  discoverStyles,
  type ProviderInput,
  toHttpError,
} from "@theme-ai/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const styles = await discoverStyles(body.message || "", {
      provider: body.provider as ProviderInput,
      model: body.model,
      geminiApiKey: body.geminiApiKey,
      openaiApiKey: body.openaiApiKey,
      history: body.history,
    });

    return NextResponse.json(styles);
  } catch (error) {
    const httpError = toHttpError(error);
    return NextResponse.json(
      { error: httpError.message || "Internal Server Error" },
      { status: httpError.status || 500 },
    );
  }
}
