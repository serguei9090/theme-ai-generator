import { type NextRequest, NextResponse } from "next/server";
import { handleAssistantMessage } from "@/lib/assistantOrchestrator";
import type {
  AssistantMessageRequest,
  AssistantMessageResponse,
} from "@/lib/assistantTypes";

export async function POST(req: NextRequest) {
  try {
    const body: AssistantMessageRequest = await req.json();
    const result: AssistantMessageResponse = await handleAssistantMessage(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Assistant API Error]:", error);
    return NextResponse.json(
      { kind: "error", reply: message },
      { status: 500 },
    );
  }
}
