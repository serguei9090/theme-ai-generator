import { listCopilotModels } from "@theme-ai/core";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = body.copilotApiKey;

    console.log(
      `[Copilot API] Fetching models with ${apiKey ? "provided key" : "default check"}`,
    );
    const models = await listCopilotModels(apiKey);
    console.log(`[Copilot API] Found ${models.length} models`);
    return NextResponse.json(models);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Copilot API Error] ${errorMsg}`, err);
    return NextResponse.json(
      {
        error: errorMsg,
        stack:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.stack
            : undefined,
      },
      { status: 500 },
    );
  }
}
