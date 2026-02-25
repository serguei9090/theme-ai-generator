import {
  DEFAULT_MODELS,
  DEFAULT_PROVIDER,
  SUPPORTED_PROVIDERS,
} from "@theme-ai/mcp-server/src/server";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    providers: [...SUPPORTED_PROVIDERS, "aistudio"],
    defaults: {
      provider: DEFAULT_PROVIDER,
      models: DEFAULT_MODELS,
    },
  });
}
