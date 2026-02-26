import { CopilotClient } from "@github/copilot-sdk";
import { GoogleGenAI } from "@google/genai";

export const PALETTE_KEYS = [
  "background",
  "surface",
  "surfaceSecondary",
  "border",
  "primary",
  "onPrimary",
  "primaryContainer",
  "primaryHover",
  "accent",
  "onAccent",
  "accentHover",
  "text",
  "textMedium",
  "textLow",
  "success",
  "warning",
  "error",
] as const;
export type PaletteKey = (typeof PALETTE_KEYS)[number];

export type Palette = Record<PaletteKey, string>;

export type Provider = "gemini" | "ollama" | "openai" | "copilot";
export type ProviderInput = Provider | "aistudio";

export type DirectorStyle = {
  id: string;
  title: string;
  rationale: string;
  moodPrompt: string;
};

export type PaletteResult = {
  palette: Palette;
  explain?: string;
  providerUsed: Provider | "deterministic";
  fallbackUsed: boolean;
};

export function canonicalizeProvider(input: unknown): Provider | null {
  if (input === "aistudio") return "gemini";
  if (
    input === "gemini" ||
    input === "ollama" ||
    input === "openai" ||
    input === "copilot"
  ) {
    return input;
  }
  return null;
}

export type RouteOptions = {
  provider?: ProviderInput;
  model?: string;
  allowFallback?: boolean;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
  history?: { role: "user" | "assistant"; text: string }[];
};

export type TweakRequest = {
  palette: Palette;
  index?: number;
  hex?: string;
  updates?: Partial<Record<PaletteKey, string>>;
  mood?: string;
  provider?: Provider;
  model?: string;
  allowFallback?: boolean;
  geminiApiKey?: string;
  openaiApiKey?: string;
  copilotApiKey?: string;
  history?: { role: "user" | "assistant"; text: string }[];
};

const HEX_REGEX = /^#[0-9a-f]{6}$/;

const SYSTEM_PROMPT = `You are a theme generation assistant for UI/UX and design systems. 
Follow the 60-30-10 Color Architecture:
- 60% FOUNDATION: background, surface, surfaceSecondary, border, text, textMedium, textLow
- 30% BRANDING: primary, onPrimary, primaryContainer, primaryHover
- 10% INTERACTION: accent, onAccent, accentHover, success, warning, error

RULES:
1. Return ONLY JSON with all 17 keys. Values MUST be 7-character lowercase hex codes.
2. ACCESSIBILITY: onPrimary and onAccent MUST be high-contrast (usually #ffffff or #0f172a) against primary and accent.
3. SATURATION: The accent color must have the highest saturation for 10% "pop" visibility.
4. Optionally include "explain" for human display. 
Never output markdown or extra text.`;

const DIRECTOR_SYSTEM_PROMPT = `You are a warm, expert Creative Director for product UI design systems.
Your job is to understand what a user is building and propose 3 distinct, thoughtful palette directions.
Return ONLY valid JSON with a top-level key "styles" containing exactly 3 objects.
Each object must have:
  - id: a short kebab-case identifier (e.g. "luxury-midnight")
  - title: a compelling 2-4 word name for the direction
  - rationale: 1-2 sentences explaining WHY this palette suits the product, written in first person as a director (e.g. "I'd lean into deep navy...")
  - moodPrompt: a terse palette-generation prompt optimised for an LLM colour tool
Do NOT include markdown, explanation, or any text outside the JSON.`;

type IntentPlan = {
  surface: "website" | "webapp" | "desktop" | "mobile" | "general";
  styleHints: string[];
  moodHints: string[];
  missingDetails: string[];
};

type JsonObject = Record<string, unknown>;

type CopilotAssistantEvent = {
  data?: {
    content?: string;
  };
};

type CopilotHistoryEvent = {
  type?: string;
  data?: {
    content?: string;
  };
};

type CopilotSessionLike = {
  sendAndWait: (
    options: { prompt: string },
    timeout?: number,
  ) => Promise<CopilotAssistantEvent | undefined>;
  getMessages: () => Promise<CopilotHistoryEvent[]>;
  destroy: () => Promise<void>;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
function getAuthErrorMessage(msg: string, provider: string): string | null {
  const lowerMsg = msg.toLowerCase();
  if (
    lowerMsg.includes("not authenticated") ||
    lowerMsg.includes("unauthorized") ||
    lowerMsg.includes("invalid api key") ||
    lowerMsg.includes("401") ||
    lowerMsg.includes("auth failed")
  ) {
    if (provider === "copilot") {
      return "Copilot Auth Failed: Your session may have expired or you are not signed in via the 'gh' CLI. Please try running 'gh auth login' or updating your GITHUB_TOKEN.";
    }
    return `${provider.toUpperCase()} Auth Failed: Please check your API key and configuration.`;
  }
  return null;
}

function getRateLimitErrorMessage(
  msg: string,
  provider: string,
): string | null {
  const lowerMsg = msg.toLowerCase();
  if (
    msg.includes("429") ||
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("quota exceeded") ||
    lowerMsg.includes("resource_exhausted")
  ) {
    return `${provider.toUpperCase()} Rate Limit reached. Please try again in a minute or switch providers.`;
  }
  return null;
}

function parseGeminiError(msg: string): string | null {
  try {
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    const err = parsed.error;
    if (err?.status === "RESOURCE_EXHAUSTED" || err?.code === 429) {
      const retryDelay = err.details?.find(
        (d: { retryDelay?: string }) => d.retryDelay,
      )?.retryDelay;
      return `Gemini Rate Limit reached. ${retryDelay ? `Please retry in ${retryDelay}.` : "Please wait a moment before trying again."}`;
    }
    if (err?.message) return `Gemini Error: ${err.message}`;
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function handleLLMError(error: unknown, provider: string): string {
  const msg = getErrorMessage(error);

  const authError = getAuthErrorMessage(msg, provider);
  if (authError) return authError;

  if (provider === "gemini") {
    const geminiError = parseGeminiError(msg);
    if (geminiError) return geminiError;
  }

  const rateLimitError = getRateLimitErrorMessage(msg, provider);
  if (rateLimitError) return rateLimitError;

  return `${provider.toUpperCase()} error: ${msg}`;
}

function normalizeHex(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  return HEX_REGEX.test(value) ? value : null;
}

function _mixHex(hex1: string, hex2: string, weight = 0.5): string {
  const rgb1 = hexToRgb(hex1) || { r: 0, g: 0, b: 0 };
  const rgb2 = hexToRgb(hex2) || { r: 0, g: 0, b: 0 };
  const r = Math.round(rgb1.r * (1 - weight) + rgb2.r * weight);
  const g = Math.round(rgb1.g * (1 - weight) + rgb2.g * weight);
  const b = Math.round(rgb1.b * (1 - weight) + rgb2.b * weight);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex) || { r: 0, g: 0, b: 0 };
  const r = Math.max(0, Math.min(255, rgb.r + amount));
  const g = Math.max(0, Math.min(255, rgb.g + amount));
  const b = Math.max(0, Math.min(255, rgb.b + amount));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizePalette(input: unknown): Palette | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const normalized = {} as Palette;

  // Essential keys that logically must be returned by LLM
  const coreKeys: PaletteKey[] = [
    "background",
    "surface",
    "surfaceSecondary",
    "border",
    "primary",
    "onPrimary",
    "primaryContainer",
    "accent",
    "onAccent",
    "text",
    "textMedium",
    "textLow",
    "success",
    "warning",
    "error",
  ];

  for (const key of coreKeys) {
    const value = normalizeHex(record[key]);
    if (!value) return null;
    normalized[key] = value;
  }

  // Interaction states - calculate if missing
  normalized.primaryHover =
    normalizeHex(record.primaryHover) ||
    adjustBrightness(normalized.primary, -30);
  normalized.accentHover =
    normalizeHex(record.accentHover) ||
    adjustBrightness(normalized.accent, -30);

  return normalized;
}

function parseIntentPlan(prompt: string): IntentPlan {
  const normalized = prompt.toLowerCase();

  let surface: IntentPlan["surface"] = "general";
  if (normalized.includes("mobile")) {
    surface = "mobile";
  } else if (normalized.includes("desktop")) {
    surface = "desktop";
  } else if (
    normalized.includes("webapp") ||
    normalized.includes("dashboard")
  ) {
    surface = "webapp";
  } else if (normalized.includes("website") || normalized.includes("landing")) {
    surface = "website";
  }

  const styleTokens = [
    "luxury",
    "minimal",
    "corporate",
    "playful",
    "modern",
    "cyberpunk",
    "retro",
    "glassmorphism",
    "brutalist",
  ];
  const moodTokens = [
    "warm",
    "cool",
    "dark",
    "light",
    "calm",
    "bold",
    "premium",
    "energetic",
    "serious",
  ];

  const styleHints = styleTokens.filter((token) => normalized.includes(token));
  const moodHints = moodTokens.filter((token) => normalized.includes(token));

  const missingDetails: string[] = [];
  if (surface === "general") missingDetails.push("target UI surface");
  if (styleHints.length === 0) missingDetails.push("style direction");
  if (moodHints.length === 0) missingDetails.push("mood hints");

  return {
    surface,
    styleHints,
    moodHints,
    missingDetails,
  };
}

function buildReasoningPrompt(userPrompt: string, plan: IntentPlan) {
  return [
    `User request: ${userPrompt}`,
    "",
    "Reasoning plan (keep internal, do not output):",
    "1) Identify target UI context and intended brand perception.",
    "2) Propose a coherent palette strategy for hierarchy and readability.",
    "3) Ensure text/background and CTA readability across typical enterprise UI.",
    "4) Return strict JSON palette only (plus optional explain).",
    "",
    `Detected surface: ${plan.surface}`,
    `Style hints: ${plan.styleHints.join(", ") || "none provided"}`,
    `Mood hints: ${plan.moodHints.join(", ") || "none provided"}`,
    `Missing details to compensate: ${plan.missingDetails.join(", ") || "none"}`,
  ].join("\n");
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function relativeLuminance(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const normalized = value / 255;
    if (normalized <= 0.03928) return normalized / 12.92;
    return ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(a: string, b: string) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function evaluatePaletteAccessibility(palette: Palette) {
  return {
    textVsBackground: contrastRatio(palette.text, palette.background),
    onPrimaryVsPrimary: contrastRatio(palette.onPrimary, palette.primary),
    onAccentVsAccent: contrastRatio(palette.onAccent, palette.accent),
    textVsSurface: contrastRatio(palette.text, palette.surface),
  };
}

function chooseReadableTextColor(background: string) {
  const white = "#ffffff";
  const black = "#111111";
  return contrastRatio(background, white) >= contrastRatio(background, black)
    ? white
    : black;
}

export function enforcePaletteAccessibility(palette: Palette): Palette {
  const metrics = evaluatePaletteAccessibility(palette);
  if (metrics.textVsBackground >= 4.5) return palette;

  return {
    ...palette,
    text: chooseReadableTextColor(palette.background),
  };
}

export function validatePalette(input: unknown): input is Palette {
  if (!input || typeof input !== "object") return false;
  const record = input as Record<string, unknown>;
  for (const key of PALETTE_KEYS) {
    if (typeof record[key] !== "string") return false;
    if (!HEX_REGEX.test(record[key])) return false;
  }
  return true;
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = h / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (huePrime >= 0 && huePrime < 1) [r, g, b] = [chroma, x, 0];
  else if (huePrime < 2) [r, g, b] = [x, chroma, 0];
  else if (huePrime < 3) [r, g, b] = [0, chroma, x];
  else if (huePrime < 4) [r, g, b] = [0, x, chroma];
  else if (huePrime < 5) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  const m = lightness - chroma / 2;
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function deterministicPalette(seedInput: string): Palette {
  let seed = 0;
  for (let i = 0; i < seedInput.length; i++) {
    seed = (seed * 31 + (seedInput.codePointAt(i) ?? 0)) >>> 0;
  }

  const baseHue = seed % 360;
  const primary = hslToHex(baseHue, 70, 45);
  const accent = hslToHex((baseHue + 180) % 360, 78, 50);

  return {
    background: hslToHex((baseHue + 20) % 360, 5, 98),
    surface: hslToHex((baseHue + 20) % 360, 5, 95),
    surfaceSecondary: hslToHex((baseHue + 20) % 360, 5, 90),
    border: hslToHex((baseHue + 20) % 360, 5, 85),
    primary,
    onPrimary: contrastRatio(primary, "#ffffff") > 4.5 ? "#ffffff" : "#0f172a",
    primaryContainer: hslToHex(baseHue, 30, 90),
    primaryHover: hslToHex(baseHue, 70, 35),
    accent,
    onAccent: contrastRatio(accent, "#ffffff") > 4.5 ? "#ffffff" : "#0f172a",
    accentHover: hslToHex((baseHue + 180) % 360, 78, 40),
    text: "#0f172a",
    textMedium: "#334155",
    textLow: "#64748b",
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
  };
}

async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  timeout = 5000,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonObject;
}

function readPath(value: unknown, path: Array<string | number>): unknown {
  let current: unknown = value;
  for (const segment of path) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
      continue;
    }

    const obj = asObject(current);
    if (!obj) return undefined;
    current = obj[segment];
  }
  return current;
}

function readPathString(value: unknown, path: Array<string | number>) {
  const result = readPath(value, path);
  return typeof result === "string" ? result : undefined;
}

function extractJsonFromText(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {}

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parsePaletteText(text: string): {
  palette: Palette;
  explain?: string;
} {
  const parsed = extractJsonFromText(text);
  if (!parsed)
    throw new Error(
      `Unable to parse JSON from model response: ${text.slice(0, 400)}`,
    );

  const palette = normalizePalette(parsed);
  if (!palette) throw new Error("Model returned invalid palette JSON");

  const explain =
    typeof parsed.explain === "string" ? parsed.explain.trim() : undefined;
  return { palette, explain };
}

async function callOllama(
  prompt: string,
  model?: string,
  systemPrompt?: string,
): Promise<string> {
  const baseUrl = (process.env.OLLAMA_URL || "http://localhost:11434").replace(
    /\/$/,
    "",
  );
  // Discovery tasks need longer — LLMs reason before outputting JSON
  const timeout = Number(process.env.OLLAMA_TIMEOUT || "60000");
  const selectedModel = model || process.env.OLLAMA_DEFAULT_MODEL || "";
  if (!selectedModel) {
    throw new Error(
      "Ollama model is required. Set OLLAMA_DEFAULT_MODEL or pass model.",
    );
  }

  const sys = systemPrompt || SYSTEM_PROMPT;

  const requests: Array<{
    path: string;
    body: Record<string, unknown>;
    pick: (data: unknown) => string | undefined;
  }> = [
    {
      path: "/api/chat",
      body: {
        model: selectedModel,
        stream: false,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
      },
      pick: (data: unknown) =>
        readPathString(data, ["message", "content"]) ??
        readPathString(data, ["response"]),
    },
    {
      path: "/v1/chat/completions",
      body: {
        model: selectedModel,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt },
        ],
      },
      pick: (data: unknown) =>
        readPathString(data, ["choices", 0, "message", "content"]),
    },
    {
      path: "/api/generate",
      body: {
        model: selectedModel,
        stream: false,
        prompt: `${sys}\n\n${prompt}`,
      },
      pick: (data: unknown) =>
        readPathString(data, ["response"]) ?? readPathString(data, ["text"]),
    },
  ];

  let lastError: Error | null = null;
  for (const variant of requests) {
    const url = `${baseUrl}${variant.path}`;
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variant.body),
        },
        timeout,
      );

      if (!response.ok) {
        if (response.status === 404) continue;
        throw new Error(
          `Ollama error ${response.status}: ${await response.text()}`,
        );
      }

      const data: unknown = await response.json();
      const content = variant.pick(data);
      if (typeof content === "string" && content.trim()) return content;
      throw new Error("Ollama returned no text content");
    } catch (error) {
      lastError = new Error(getErrorMessage(error));
    }
  }

  throw new Error(
    `Ollama adapter failed: ${lastError?.message || "unknown error"}`,
  );
}

async function callOpenAI(
  prompt: string,
  model?: string,
  apiKeyOverride?: string,
  systemPrompt?: string,
): Promise<string> {
  const apiKey =
    apiKeyOverride ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_KEY ||
    "";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const url =
    process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
  const timeout = Number(process.env.OPENAI_TIMEOUT || "9000");
  const selectedModel =
    model || process.env.OPENAI_DEFAULT_MODEL || "gpt-4o-mini";

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt || SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 400,
      }),
    },
    timeout,
  );

  if (!response.ok) {
    throw new Error(handleLLMError(await response.text(), "openai"));
  }
  const data: unknown = await response.json();
  const content =
    readPathString(data, ["choices", 0, "message", "content"]) ??
    readPathString(data, ["choices", 0, "text"]);
  if (typeof content !== "string" || !content.trim())
    throw new Error("OpenAI returned no text content");
  return content;
}

async function callGemini(
  prompt: string,
  model?: string,
  apiKeyOverride?: string,
  systemPrompt?: string,
): Promise<string> {
  const apiKey =
    apiKeyOverride ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.AISTUDIO_API_KEY ||
    "";
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const selectedModel =
    model ||
    process.env.GEMINI_MODEL ||
    process.env.AISTUDIO_DEFAULT_MODEL ||
    "gemini-2.5-flash-lite";
  const timeout = Number(process.env.GEMINI_TIMEOUT || "12000");

  const ai = new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    // @google/genai SDK v0.1+ syntax
    const result = await ai.models.generateContent({
      model: selectedModel,
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt || SYSTEM_PROMPT}\n\n${prompt}` }],
        },
      ],
      config: {
        temperature: 0.35,
        maxOutputTokens: 500,
      },
    });

    const content = result.text || "";
    if (!content.trim()) {
      throw new Error("Gemini returned no text content");
    }
    return content;
  } catch (error) {
    throw new Error(handleLLMError(error, "gemini"));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callCopilot(
  prompt: string,
  model?: string,
  apiKeyOverride?: string,
  systemPrompt?: string,
): Promise<string> {
  const timeout = Number(process.env.COPILOT_TIMEOUT || "120000");
  const selectedModel = model || process.env.COPILOT_MODEL || "gpt-4o";
  const githubToken =
    apiKeyOverride ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    undefined;

  const client = new CopilotClient({
    autoStart: false,
    githubToken,
    useLoggedInUser: !githubToken,
  });

  await client.start();
  let session: CopilotSessionLike | null = null;
  try {
    session = (await client.createSession({
      model: selectedModel,
    })) as CopilotSessionLike;
    const event = await session.sendAndWait(
      {
        prompt: `${systemPrompt || SYSTEM_PROMPT}\n\nUser request: ${prompt}`,
      },
      timeout,
    );

    const content = event?.data?.content;
    if (typeof content === "string" && content.trim()) return content;

    const history = await session.getMessages();
    const finalMessage = [...history]
      .reverse()
      .find((entry) => entry?.type === "assistant.message");
    const fallbackContent = finalMessage?.data?.content;
    if (typeof fallbackContent === "string" && fallbackContent.trim())
      return fallbackContent;

    throw new Error(
      handleLLMError("Copilot SDK returned no assistant content", "copilot"),
    );
  } catch (error) {
    throw new Error(handleLLMError(error, "copilot"));
  } finally {
    if (session) await session.destroy().catch(() => undefined);
    await client.stop().catch(() => undefined);
  }
}

export async function listCopilotModels(
  apiKeyOverride?: string,
): Promise<{ label: string; value: string }[]> {
  const githubToken =
    apiKeyOverride ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    undefined;

  // If the token is a placeholder, don't use it
  const finalToken = githubToken?.includes("your_") ? undefined : githubToken;

  const client = new CopilotClient({
    autoStart: false,
    githubToken: finalToken,
    useLoggedInUser: !finalToken,
  });

  try {
    try {
      await client.start();
      const models = await client.listModels();
      // Map SDK ModelInfo to the { label, value } format expected by the frontend
      return models.map((m: { name?: string; id: string }) => ({
        label: m.name || m.id,
        value: m.id,
      }));
    } catch (error) {
      throw new Error(handleLLMError(error, "copilot"));
    }
  } finally {
    await client.stop().catch(() => undefined);
  }
}

export async function providerPrompt(
  provider: Provider,
  prompt: string,
  model?: string,
  geminiApiKey?: string,
  openaiApiKey?: string,
  copilotApiKey?: string,
  systemPrompt?: string,
  history?: { role: "user" | "assistant"; text: string }[],
): Promise<string> {
  const historyText = history?.length
    ? "Previous conversation context:\n" +
      history
        .map(
          (m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.text}`,
        )
        .join("\n\n") +
      "\n\n---\n\nCurrent request:\n"
    : "";
  const fullPrompt = `${historyText}${prompt}`;

  if (process.env.PROVIDER_DEBUG === "true") {
    console.log(
      `[DEBUG] Tool Call -> Provider: ${provider}, Model: ${model || "default"}`,
    );
  }

  if (provider === "ollama") return callOllama(fullPrompt, model, systemPrompt);
  if (provider === "openai")
    return callOpenAI(fullPrompt, model, openaiApiKey, systemPrompt);
  if (provider === "gemini")
    return callGemini(fullPrompt, model, geminiApiKey, systemPrompt);
  if (provider === "copilot")
    return callCopilot(fullPrompt, model, copilotApiKey, systemPrompt);
  throw new Error(`LLM provider '${provider}' is not supported`);
}

export async function routeToProvider(
  provider: Provider,
  prompt: string,
  options: RouteOptions = {},
): Promise<PaletteResult> {
  if (!prompt || prompt.trim().length === 0)
    throw new Error("Prompt cannot be empty");
  if (prompt.length > 1024)
    throw new Error("Prompt too long (max 1024 characters)");

  const plan = parseIntentPlan(prompt);
  const reasoningPrompt = buildReasoningPrompt(prompt, plan);

  try {
    const content = await providerPrompt(
      provider,
      reasoningPrompt,
      options.model,
      options.geminiApiKey,
      options.openaiApiKey,
      options.copilotApiKey,
      undefined,
      options.history,
    );
    const { palette, explain } = parsePaletteText(content);
    const adjustedPalette = enforcePaletteAccessibility(palette);
    const wasAdjusted = adjustedPalette.text !== palette.text;

    let finalExplain = explain || "";
    if (wasAdjusted) {
      finalExplain = `${finalExplain}${finalExplain ? " " : ""}Applied readability adjustment for text contrast.`;
    }

    return {
      palette: adjustedPalette,
      explain: finalExplain,
      providerUsed: provider,
      fallbackUsed: false,
    };
  } catch (error: unknown) {
    if (options.allowFallback === false) throw error;

    const fallbackPalette = enforcePaletteAccessibility(
      deterministicPalette(prompt),
    );
    return {
      palette: fallbackPalette,
      explain: `Fallback palette generated locally because ${provider} was unavailable.`,
      providerUsed: "deterministic",
      fallbackUsed: true,
    };
  }
}

function processUpdates(
  base: Palette,
  updates: Partial<Record<string, string>>,
): PaletteResult {
  const merged: Palette = { ...base };
  for (const key of PALETTE_KEYS) {
    const update = updates[key];
    if (update === undefined) continue;
    const normalized = normalizeHex(update);
    if (!normalized) throw new Error(`invalid hex for key '${key}'`);
    merged[key] = normalized;
  }

  return {
    palette: merged,
    explain: "Updated selected color values.",
    providerUsed: "deterministic",
    fallbackUsed: false,
  };
}

function processIndex(
  base: Palette,
  index: number,
  hex: string,
): PaletteResult {
  if (index < 0 || index >= PALETTE_KEYS.length) {
    throw new Error(`index must be between 0 and ${PALETTE_KEYS.length - 1}`);
  }
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error("hex must match #rrggbb");

  const key = PALETTE_KEYS[index];
  return {
    palette: { ...base, [key]: normalized },
    explain: `Updated ${key}.`,
    providerUsed: "deterministic",
    fallbackUsed: false,
  };
}

export async function tweakPalette(
  input: TweakRequest,
): Promise<PaletteResult> {
  const base = normalizePalette(input.palette);
  if (!base)
    throw new Error(
      "palette must be a valid palette object with lowercase hex values",
    );

  if (input.updates && Object.keys(input.updates).length > 0) {
    return processUpdates(
      base,
      input.updates as Partial<Record<string, string>>,
    );
  }

  if (typeof input.index === "number" && input.hex) {
    return processIndex(base, input.index, input.hex);
  }

  if (input.mood?.trim()) {
    const provider = input.provider || "ollama";
    return routeToProvider(provider, input.mood.trim(), {
      model: input.model,
      allowFallback: input.allowFallback,
      geminiApiKey: input.geminiApiKey,
      openaiApiKey: input.openaiApiKey,
      history: input.history,
    });
  }

  throw new Error("Provide updates, or index+hex, or mood to tweak palette");
}

export async function discoverStyles(
  message: string,
  options: RouteOptions,
): Promise<DirectorStyle[]> {
  // Honour the configured director provider; default to ollama if nothing specified.
  const provider = (options.provider as Provider) || "ollama";
  const model = options.model || undefined;

  try {
    const content = await providerPrompt(
      provider,
      message,
      model,
      options.geminiApiKey,
      options.openaiApiKey,
      options.copilotApiKey,
      DIRECTOR_SYSTEM_PROMPT,
      options.history,
    );

    const parsed = parseJson(content);
    return sanitizeDirectorStyles(parsed, message);
  } catch (error) {
    console.error("[MCP] Discovery failed, using fallback:", error);
    return getFallbackStyles(message);
  }
}

function sanitizeDirectorStyles(
  input: unknown,
  prompt: string,
): DirectorStyle[] {
  let parsedList: unknown[] = [];
  if (Array.isArray(input)) {
    parsedList = input;
  } else if (input && typeof input === "object" && "styles" in input) {
    const nested = (input as Record<string, unknown>).styles;
    if (Array.isArray(nested)) {
      parsedList = nested;
    }
  }

  if (!Array.isArray(parsedList)) return getFallbackStyles(prompt);

  const cleaned = parsedList
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const title = typeof record.title === "string" ? record.title.trim() : "";
      const rationale =
        typeof record.rationale === "string" ? record.rationale.trim() : "";
      const moodPrompt =
        typeof record.moodPrompt === "string" ? record.moodPrompt.trim() : "";
      const idRaw =
        typeof record.id === "string" ? record.id.trim().toLowerCase() : "";

      if (!title || !rationale || !moodPrompt) return null;
      const id =
        idRaw ||
        `${
          title
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, "-")
            .replaceAll(/(?:^-)|(?:-$)/g, "") || `style-${index + 1}`
        }`;
      return { id, title, rationale, moodPrompt } satisfies DirectorStyle;
    })
    .filter((entry): entry is DirectorStyle => Boolean(entry));

  if (cleaned.length < 3) {
    const fallback = getFallbackStyles(prompt);
    for (const item of fallback) {
      if (cleaned.length >= 3) break;
      if (!cleaned.some((existing) => existing.id === item.id)) {
        cleaned.push(item);
      }
    }
  }

  return cleaned.slice(0, 3);
}

function getFallbackStyles(prompt: string): DirectorStyle[] {
  return [
    {
      id: "fallback-modern",
      title: "Clean Modern",
      rationale: "Optimized for readability and professional focus.",
      moodPrompt: `${prompt} with modern professional UI contrast`,
    },
    {
      id: "fallback-vibrant",
      title: "Vibrant Hub",
      rationale: "High energy accents to drive engagement and visual interest.",
      moodPrompt: `${prompt} with high energy accents and modern contrast`,
    },
    {
      id: "fallback-elegant",
      title: "Elegant Dark",
      rationale: "Premium feel with deep tones and golden highlights.",
      moodPrompt: `${prompt} with premium dark theme and refined highlights`,
    },
  ];
}

function parseJson(text: string): unknown {
  try {
    const cleaned = text.replaceAll(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
