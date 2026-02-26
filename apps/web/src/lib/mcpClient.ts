export type Palette = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  primaryHover: string;
  accent: string;
  onAccent: string;
  accentHover: string;
  text: string;
  textMedium: string;
  textLow: string;
  success: string;
  warning: string;
  error: string;
};

export type Provider = "gemini" | "ollama" | "openai" | "copilot";
export type ProviderInput = Provider | "aistudio";
export type ProviderModelDefaults = Record<Provider, string>;

export type McpHealthResponse = {
  status: "ok" | string;
  providers: Provider[];
  defaults?: {
    provider?: Provider;
    models?: Partial<ProviderModelDefaults>;
  };
};

export type PaletteResponse = {
  palette: Palette;
  explain?: string;
  providerUsed: Provider | "deterministic";
  fallbackUsed: boolean;
};

export type GenerateRequest = {
  mood: string;
  provider?: ProviderInput;
  model?: string;
  allowFallback?: boolean;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
};

export type TweakRequest = {
  palette: Palette;
  index?: number;
  hex?: string;
  updates?: Partial<Palette>;
  mood?: string;
  provider?: ProviderInput;
  model?: string;
  allowFallback?: boolean;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
};

export function normalizeProvider(
  provider: ProviderInput | undefined,
): Provider {
  if (provider === "aistudio") return "gemini";
  if (
    provider === "gemini" ||
    provider === "ollama" ||
    provider === "openai" ||
    provider === "copilot"
  ) {
    return provider;
  }
  return "ollama";
}

export function resolveMcpBaseUrl(
  configured = process.env.NEXT_PUBLIC_MCP_URL,
) {
  const value = configured?.trim();
  if (value) return value.replace(/\/$/, "");
  return "/api/mcp";
}

function isAbortFailure(message: string) {
  return message.toLowerCase().includes("operation was aborted");
}

export async function diagnoseServerIssue(message: string) {
  if (!isAbortFailure(message)) return message;
  const baseUrl = resolveMcpBaseUrl();

  try {
    const healthRes = await fetch(`${baseUrl}/health`, {
      method: "GET",
    });

    if (healthRes.status === 404) {
      return `${message}. MCP server appears outdated (no /health endpoint). Restart the server with "bun run mcp:dev".`;
    }
  } catch {
    return `${message}. Could not reach MCP health endpoint. Verify MCP server is reachable from the web app.`;
  }

  return `${message}. Ollama likely timed out; verify Ollama is running and increase OLLAMA_TIMEOUT (e.g. 20000) in the root .env.`;
}

async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const baseUrl = resolveMcpBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorBody = await res.json();
      if (errorBody?.error && typeof errorBody.error === "string")
        errorMsg = errorBody.error;
    } catch {}
    throw new Error(await diagnoseServerIssue(errorMsg));
  }

  return res.json();
}

export async function generateThemePalette(
  request: GenerateRequest,
): Promise<PaletteResponse> {
  const provider = normalizeProvider(request.provider);
  return postJson<PaletteResponse>("/generate", {
    mood: request.mood,
    provider,
    model: request.model,
    allowFallback: request.allowFallback ?? true,
    geminiApiKey: request.geminiApiKey,
    openaiApiKey: request.openaiApiKey,
    copilotApiKey: request.copilotApiKey,
  });
}

export async function tweakThemePalette(
  request: TweakRequest,
): Promise<PaletteResponse> {
  const provider = normalizeProvider(request.provider);
  return postJson<PaletteResponse>("/tweak", {
    palette: request.palette,
    index: request.index,
    hex: request.hex,
    updates: request.updates,
    mood: request.mood,
    provider,
    model: request.model,
    allowFallback: request.allowFallback ?? true,
    geminiApiKey: request.geminiApiKey,
    openaiApiKey: request.openaiApiKey,
    copilotApiKey: request.copilotApiKey,
  });
}

export async function getMcpHealth(): Promise<McpHealthResponse> {
  const baseUrl = resolveMcpBaseUrl();
  const res = await fetch(`${baseUrl}/health`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Unable to load MCP health (${res.status})`);
  }
  return res.json();
}

// Backward-compatible helper used by legacy components.
export async function generatePalette(
  mood: string,
  provider: ProviderInput = "ollama",
): Promise<Palette> {
  const response = await generateThemePalette({ mood, provider });
  return response.palette;
}
