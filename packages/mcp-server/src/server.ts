import { randomUUID } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  type CallToolResult,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import {
  canonicalizeProvider,
  discoverStyles,
  HttpError,
  type Palette,
  type Provider,
  type ProviderInput,
  routeToProvider,
  toHttpError,
  tweakPalette,
  validatePalette,
} from "@theme-ai/core";
import * as z from "zod";

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const idx = trimmed.indexOf("=");
  if (idx === -1) return;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!(key in process.env)) process.env[key] = val;
}

function tryLoadEnvFile(p: string) {
  try {
    if (fs.existsSync(p)) {
      const txt = fs.readFileSync(p, "utf8");
      for (const line of txt.split(/\r?\n/)) {
        parseEnvLine(line);
      }
    }
  } catch {
    // ignore
  }
}

function loadEnv() {
  // In Next.js, env is handled automatically.
  // We only manual load for standalone script runs.
  if (process.env.NEXT_RUNTIME) return;

  const paths = [".env", "../../.env", "../../../.env", "../../../../.env"];

  for (const p of paths) {
    tryLoadEnvFile(p);
  }
}

loadEnv();

const PORT = process.env.PORT ? Number(process.env.PORT) : 41234;
const DEBUG = process.env.DEBUG === "true";
export const SUPPORTED_PROVIDERS: Provider[] = [
  "gemini",
  "ollama",
  "openai",
  "copilot",
];
export const DEFAULT_PROVIDER =
  canonicalizeProvider(process.env.DEFAULT_PROVIDER || "") || "gemini";
export const DEFAULT_MODELS: Record<Provider, string> = {
  ollama:
    process.env.OLLAMA_DEFAULT_MODEL ||
    (DEFAULT_PROVIDER === "ollama" ? process.env.DEFAULT_MODEL : "") ||
    "",
  openai:
    process.env.OPENAI_DEFAULT_MODEL ||
    (DEFAULT_PROVIDER === "openai" ? process.env.DEFAULT_MODEL : "") ||
    "gpt-4o-mini",
  gemini:
    process.env.GEMINI_MODEL ||
    process.env.AISTUDIO_DEFAULT_MODEL ||
    (DEFAULT_PROVIDER === "gemini" ? process.env.DEFAULT_MODEL : "") ||
    "gemini-2.5-flash-lite",
  copilot:
    process.env.COPILOT_MODEL ||
    (DEFAULT_PROVIDER === "copilot" ? process.env.DEFAULT_MODEL : "") ||
    "gpt-4o",
};
const LEGACY_HEADERS = {
  Deprecation: "true",
  Link: '</mcp>; rel="successor-version"',
};

export function parseCorsAllowedOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => Boolean(entry) && entry !== "*");
}

const CORS_ALLOWED = parseCorsAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);

const logPrefix = "[MCP]";
function log(msg: string) {
  if (DEBUG) console.error(`${logPrefix} ${msg}`);
}

function getAllowedOrigin(reqOrigin?: string | null) {
  if (!reqOrigin) return null;
  return CORS_ALLOWED.includes(reqOrigin) ? reqOrigin : null;
}

function parseJson(
  req: http.IncomingMessage,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body) as Record<string, unknown>);
      } catch (error) {
        console.error("Failed to parse JSON request body:", error);
        reject(
          new HttpError(400, "Request body must be valid JSON", "INVALID_JSON"),
        );
      }
    });
    req.on("error", reject);
  });
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  payload: unknown,
  allowedOrigin: string | null,
  extraHeaders: Record<string, string> = {},
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (allowedOrigin) headers["Access-Control-Allow-Origin"] = allowedOrigin;
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function sendError(
  res: http.ServerResponse,
  error: unknown,
  allowedOrigin: string | null,
) {
  const httpError = toHttpError(error);
  sendJson(
    res,
    httpError.status,
    {
      error: httpError.message,
      code: httpError.code,
    },
    allowedOrigin,
  );
}

function sendMcpProtocolError(
  res: http.ServerResponse,
  status: number,
  message: string,
) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message,
      },
      id: null,
    }),
  );
}

function getProvider(value: unknown): Provider {
  const normalized = canonicalizeProvider(value);
  if (normalized) return normalized;
  return DEFAULT_PROVIDER;
}

function parseAllowFallback(value: unknown) {
  if (typeof value === "boolean") return value;
  return true;
}

function isAddrInUseError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "EADDRINUSE"
  );
}

export async function executeGenerate(input: {
  mood: unknown;
  provider: unknown;
  model?: unknown;
  allowFallback?: unknown;
  geminiApiKey?: unknown;
  openaiApiKey?: unknown;
  copilotApiKey?: unknown;
  history?: unknown;
}) {
  if (typeof input.mood !== "string" || !input.mood.trim()) {
    throw new HttpError(400, "mood must be a non-empty string", "BAD_REQUEST");
  }

  const provider = getProvider(input.provider);
  const model =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : undefined;
  const allowFallback = parseAllowFallback(input.allowFallback);

  const result = await routeToProvider(provider, input.mood.trim(), {
    model,
    allowFallback,
    geminiApiKey:
      typeof input.geminiApiKey === "string" ? input.geminiApiKey : undefined,
    openaiApiKey:
      typeof input.openaiApiKey === "string" ? input.openaiApiKey : undefined,
    copilotApiKey:
      typeof input.copilotApiKey === "string" ? input.copilotApiKey : undefined,
    history: Array.isArray(input.history)
      ? (input.history as { role: "user" | "assistant"; text: string }[])
      : undefined,
  });

  if (!validatePalette(result.palette)) {
    throw new HttpError(500, "generated palette is invalid", "INTERNAL_ERROR");
  }

  return result;
}

export async function executeTweak(input: {
  palette: unknown;
  index?: unknown;
  hex?: unknown;
  updates?: unknown;
  mood?: unknown;
  provider: unknown;
  model?: unknown;
  allowFallback?: unknown;
  geminiApiKey?: unknown;
  openaiApiKey?: unknown;
  copilotApiKey?: unknown;
  history?: unknown;
}) {
  const provider = getProvider(input.provider);
  const model =
    typeof input.model === "string" && input.model.trim()
      ? input.model.trim()
      : undefined;
  const allowFallback = parseAllowFallback(input.allowFallback);
  const updatesInput =
    input.updates &&
    typeof input.updates === "object" &&
    !Array.isArray(input.updates)
      ? (input.updates as Partial<Record<keyof Palette, string>>)
      : undefined;

  if (!validatePalette(input.palette)) {
    throw new HttpError(
      400,
      "palette must be a valid palette object",
      "BAD_REQUEST",
    );
  }

  const result = await tweakPalette({
    palette: input.palette,
    index: typeof input.index === "number" ? input.index : undefined,
    hex: typeof input.hex === "string" ? input.hex : undefined,
    updates: updatesInput,
    mood: typeof input.mood === "string" ? input.mood : undefined,
    provider,
    model,
    allowFallback,
    geminiApiKey:
      typeof input.geminiApiKey === "string" ? input.geminiApiKey : undefined,
    openaiApiKey:
      typeof input.openaiApiKey === "string" ? input.openaiApiKey : undefined,
    copilotApiKey:
      typeof input.copilotApiKey === "string" ? input.copilotApiKey : undefined,
    history: Array.isArray(input.history)
      ? (input.history as { role: "user" | "assistant"; text: string }[])
      : undefined,
  });

  if (!validatePalette(result.palette)) {
    throw new HttpError(500, "tweaked palette is invalid", "INTERNAL_ERROR");
  }

  return result;
}

async function handleDiscover(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigin: string | null,
) {
  const body = await parseJson(req);
  const message = typeof body.message === "string" ? body.message : "";
  const styles = await discoverStyles(message, {
    provider: body.provider as ProviderInput,
    model: body.model as string,
    geminiApiKey: body.geminiApiKey as string,
    openaiApiKey: body.openaiApiKey as string,
    history: Array.isArray(body.history)
      ? (body.history as { role: "user" | "assistant"; text: string }[])
      : undefined,
  });
  sendJson(res, 200, styles, allowedOrigin, LEGACY_HEADERS);
}

function createProtocolServer() {
  const server = new McpServer({
    name: "theme-ai-mcp-server",
    version: "0.2.0",
  });

  const providerSchema = z
    .enum(["ollama", "gemini", "openai", "copilot", "aistudio"])
    .optional();

  const paletteSchema = z.object({
    background: z.string(),
    surface: z.string(),
    surfaceSecondary: z.string(),
    border: z.string(),
    primary: z.string(),
    onPrimary: z.string(),
    primaryContainer: z.string(),
    primaryHover: z.string(),
    accent: z.string(),
    onAccent: z.string(),
    accentHover: z.string(),
    text: z.string(),
    textMedium: z.string(),
    textLow: z.string(),
    success: z.string(),
    warning: z.string(),
    error: z.string(),
  });

  server.registerTool(
    "generate_theme_palette",
    {
      title: "Generate Theme Palette",
      description:
        "Generate a strict 5-color theme palette from a mood prompt.",
      inputSchema: z.object({
        mood: z.string().describe("Mood or style prompt"),
        provider: providerSchema,
        model: z.string().optional(),
        allowFallback: z.boolean().optional(),
        geminiApiKey: z.string().optional(),
        openaiApiKey: z.string().optional(),
      }),
    },
    async ({
      mood,
      provider,
      model,
      allowFallback,
      geminiApiKey,
      openaiApiKey,
    }): Promise<CallToolResult> => {
      const result = await executeGenerate({
        mood,
        provider,
        model,
        allowFallback,
        geminiApiKey,
        openaiApiKey,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result.palette) }],
        structuredContent: result.palette,
      };
    },
  );

  server.registerTool(
    "tweak_color",
    {
      title: "Tweak Theme Palette",
      description:
        "Tweak one or more colors in an existing palette via updates/index/hex or mood.",
      inputSchema: z.object({
        palette: paletteSchema,
        index: z.number().optional(),
        hex: z.string().optional(),
        updates: paletteSchema.partial().optional(),
        mood: z.string().optional(),
        provider: providerSchema,
        model: z.string().optional(),
        allowFallback: z.boolean().optional(),
        geminiApiKey: z.string().optional(),
        openaiApiKey: z.string().optional(),
      }),
    },
    async ({
      palette,
      index,
      hex,
      updates,
      mood,
      provider,
      model,
      allowFallback,
      geminiApiKey,
      openaiApiKey,
    }): Promise<CallToolResult> => {
      const result = await executeTweak({
        palette,
        index,
        hex,
        updates,
        mood,
        provider,
        model,
        allowFallback,
        geminiApiKey,
        openaiApiKey,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result.palette) }],
        structuredContent: result.palette,
      };
    },
  );

  server.registerTool(
    "discover_theme_styles",
    {
      title: "Discover Theme Styles",
      description:
        "Drafts 3 creative directions/styles for a user request to help them choose.",
      inputSchema: {
        message: z.string().describe("User request or mood"),
        provider: providerSchema,
        model: z.string().optional(),
        geminiApiKey: z.string().optional(),
        openaiApiKey: z.string().optional(),
      },
    },
    async ({
      message,
      provider,
      model,
      geminiApiKey,
      openaiApiKey,
    }): Promise<CallToolResult> => {
      const styles = await discoverStyles(message, {
        provider: provider as ProviderInput,
        model,
        geminiApiKey,
        openaiApiKey,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(styles) }],
      };
    },
  );

  return server;
}

type McpSessionContext = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
};

const mcpSessions = new Map<string, McpSessionContext>();

async function initializeMcpSession() {
  const mcpServer = createProtocolServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      mcpSessions.set(sessionId, { transport, server: mcpServer });
    },
  });

  transport.onclose = () => {
    const sessionId = transport.sessionId;
    if (sessionId && mcpSessions.has(sessionId)) {
      mcpSessions.delete(sessionId);
    }
    void mcpServer.close().catch(() => undefined);
  };

  await mcpServer.connect(transport);
  return transport;
}

async function handleMcpPost(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  let body: Record<string, unknown>;
  try {
    body = await parseJson(req);
  } catch (error) {
    sendMcpProtocolError(res, 400, toHttpError(error).message);
    return;
  }

  try {
    if (sessionId) {
      const existing = mcpSessions.get(sessionId);
      if (!existing) {
        sendMcpProtocolError(res, 404, "Invalid MCP session ID");
        return;
      }
      await existing.transport.handleRequest(req, res, body);
      return;
    }

    if (!isInitializeRequest(body)) {
      sendMcpProtocolError(
        res,
        400,
        "Bad Request: No valid session ID provided",
      );
      return;
    }

    const transport = await initializeMcpSession();
    await transport.handleRequest(req, res, body);
  } catch (error) {
    log(`MCP POST error: ${String(error)}`);
    sendMcpProtocolError(res, 500, "Internal server error");
  }
}

async function handleMcpGet(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  if (!sessionId) {
    sendMcpProtocolError(res, 400, "Missing MCP session ID");
    return;
  }

  const existing = mcpSessions.get(sessionId);
  if (!existing) {
    sendMcpProtocolError(res, 404, "Invalid MCP session ID");
    return;
  }

  try {
    await existing.transport.handleRequest(req, res);
  } catch (error) {
    log(`MCP GET error: ${String(error)}`);
    sendMcpProtocolError(res, 500, "Internal server error");
  }
}

async function handleMcpDelete(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId =
    typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  if (!sessionId) {
    sendMcpProtocolError(res, 400, "Missing MCP session ID");
    return;
  }

  const existing = mcpSessions.get(sessionId);
  if (!existing) {
    sendMcpProtocolError(res, 404, "Invalid MCP session ID");
    return;
  }

  try {
    await existing.transport.handleRequest(req, res);
    mcpSessions.delete(sessionId);
    await existing.server.close();
  } catch (error) {
    log(`MCP DELETE error: ${String(error)}`);
    sendMcpProtocolError(res, 500, "Internal server error");
  }
}

async function handleGenerate(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigin: string | null,
) {
  const body = await parseJson(req);

  const result = await executeGenerate({
    mood: body.mood,
    provider: body.provider,
    model: body.model,
    allowFallback: body.allowFallback,
    geminiApiKey: body.geminiApiKey,
    openaiApiKey: body.openaiApiKey,
    history: body.history,
  });

  if (req.url === "/tools/generate_theme_palette") {
    sendJson(res, 200, result.palette, allowedOrigin, LEGACY_HEADERS);
    return;
  }

  sendJson(
    res,
    200,
    {
      palette: result.palette,
      explain: result.explain,
      providerUsed: result.providerUsed,
      fallbackUsed: result.fallbackUsed,
    },
    allowedOrigin,
    LEGACY_HEADERS,
  );
}

async function handleTweak(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigin: string | null,
) {
  const body = await parseJson(req);

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

  if (req.url === "/tools/tweak_color") {
    sendJson(res, 200, result.palette, allowedOrigin, LEGACY_HEADERS);
    return;
  }

  sendJson(
    res,
    200,
    {
      palette: result.palette,
      explain: result.explain,
      providerUsed: result.providerUsed,
      fallbackUsed: result.fallbackUsed,
    },
    allowedOrigin,
    LEGACY_HEADERS,
  );
}

async function handleRoute(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  allowedOrigin: string | null,
) {
  if (req.url === "/mcp") {
    if (req.method === "POST") {
      await handleMcpPost(req, res);
      return;
    }
    if (req.method === "GET") {
      await handleMcpGet(req, res);
      return;
    }
    if (req.method === "DELETE") {
      await handleMcpDelete(req, res);
      return;
    }
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(
      res,
      200,
      {
        status: "ok",
        providers: [...SUPPORTED_PROVIDERS, "aistudio"],
        defaults: {
          provider: DEFAULT_PROVIDER,
          models: DEFAULT_MODELS,
        },
        protocol: {
          mcpEndpoint: "/mcp",
        },
      },
      allowedOrigin,
    );
    return;
  }

  if (req.method === "POST" && req.url) {
    switch (req.url) {
      case "/tools/generate_theme_palette":
      case "/generate":
        await handleGenerate(req, res, allowedOrigin);
        return;
      case "/tools/tweak_color":
      case "/tweak":
        await handleTweak(req, res, allowedOrigin);
        return;
      case "/tools/discover_theme_styles":
      case "/discover":
        await handleDiscover(req, res, allowedOrigin);
        return;
    }
  }

  throw new HttpError(404, "not found", "NOT_FOUND");
}

export function createMcpServer() {
  return http.createServer(async (req, res) => {
    const originHeader = req.headers.origin;
    const origin = typeof originHeader === "string" ? originHeader : null;
    const allowedOrigin = getAllowedOrigin(origin);

    log(
      `${req.method} ${req.url} from origin: ${origin || "(none)"} -> allowed: ${allowedOrigin || "NO"}`,
    );

    if (origin && !allowedOrigin) {
      sendError(
        res,
        new HttpError(
          403,
          "origin is not allowed by CORS policy",
          "CORS_FORBIDDEN",
        ),
        null,
      );
      return;
    }

    if (req.method === "OPTIONS") {
      if (!origin || !allowedOrigin) {
        sendError(
          res,
          new HttpError(
            403,
            "origin is not allowed by CORS policy",
            "CORS_FORBIDDEN",
          ),
          null,
        );
        return;
      }

      res.writeHead(204, {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, mcp-session-id",
        "Access-Control-Max-Age": "600",
      });
      res.end();
      return;
    }

    try {
      await handleRoute(req, res, allowedOrigin);
    } catch (error) {
      sendError(res, error, allowedOrigin);
    }
  });
}

export async function startMcpServer(port = PORT) {
  const server = createMcpServer();

  server.on("error", (error) => {
    if (isAddrInUseError(error)) {
      console.error(`Failed to start server. Port ${port} is already in use.`);
      process.exit(1);
    }
    throw error;
  });

  server.listen(port, () => {
    console.error(`MCP HTTP server listening on http://localhost:${port}`);
    console.error(`MCP Streamable HTTP endpoint: http://localhost:${port}/mcp`);
    console.error(
      `CORS allowed origins: ${CORS_ALLOWED.length ? CORS_ALLOWED.join(", ") : "(none configured)"}`,
    );
    if (DEBUG) console.error("[MCP] DEBUG mode enabled");
  });

  return server;
}

export async function runStdioServer() {
  const mcpServer = createProtocolServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("MCP Server running on stdio transport");
}

const entryScriptPath = process.argv[1]?.replaceAll("\\", "/") || "";
const shouldRunStandalone =
  (entryScriptPath.endsWith("server.ts") ||
    entryScriptPath.endsWith("server.js")) &&
  !process.env.NEXT_RUNTIME;

if (shouldRunStandalone) {
  const isHttp =
    process.argv.includes("--transport") && process.argv.includes("http");
  if (isHttp) {
    startMcpServer();
  } else {
    runStdioServer();
  }
}
