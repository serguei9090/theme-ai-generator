import type {
  AssistantMessageRequest,
  AssistantMessageResponse,
} from "./assistantTypes";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function postAssistantMessage(
  payload: AssistantMessageRequest,
): Promise<AssistantMessageResponse> {
  try {
    const response = await fetch("/api/assistant/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        data.error || `Assistant request failed (${response.status})`,
      );
    }

    return (await response.json()) as AssistantMessageResponse;
  } catch (error) {
    return {
      kind: "error",
      reply: getErrorMessage(error),
    };
  }
}
