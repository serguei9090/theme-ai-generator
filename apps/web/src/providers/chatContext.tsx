"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { toast } from "sonner";
import type {
  AssistantMessageResponse,
  ForcedTool,
  StyleOption,
} from "../lib/assistantTypes";
import type {
  Palette,
  Provider,
  ProviderModelDefaults,
} from "../lib/mcpClient";
import {
  getMcpHealth,
  interpretColorForKey,
  tweakThemePalette,
} from "../lib/mcpClient";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  explain?: string;
  palette?: Palette;
  palettes?: Palette[];
  styles?: StyleOption[];
  providerUsed?: string;
  toolUsed?:
    | "generate_palette"
    | "discover_styles"
    | "tweak_palette"
    | "director";
};

type SavedSession = {
  provider: Provider;
  model: string;
  appliedPalette: Palette;
  messages: Message[];
  lastPrompt: string;
  savedAt: string;
};

type ChatContextType = {
  provider: Provider;
  setProvider: (p: Provider) => void;
  model: string;
  setModel: (m: string) => void;
  directorModel: string;
  setDirectorModel: (m: string) => void;
  directorProvider: Provider;
  setDirectorProvider: (p: Provider) => void;
  geminiApiKey: string;
  setGeminiApiKey: (k: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (k: string) => void;
  copilotApiKey: string;
  setCopilotApiKey: (k: string) => void;
  providerDefaults: ProviderModelDefaults;
  messages: Message[];
  loading: boolean;
  loadingState: string | null;
  appliedPalette: Palette;
  pendingStyles: StyleOption[];
  conversationId: string | null;
  sendMessage: (text: string, forceTool?: ForcedTool) => Promise<void>;
  selectStyle: (styleId: string) => Promise<void>;
  applyPalette: (palette: Palette) => void;
  tweakOneColor: (key: keyof Palette, hex: string) => Promise<void>;
  tweakColorByPrompt: (key: keyof Palette, prompt: string) => Promise<void>;
  regenerateAllColors: () => Promise<void>;
  newChat: () => void;
  saveSession: () => void;
  restoreSession: () => void;
  chatInput: string;
  setChatInput: (s: string) => void;
  themeMode: "light" | "dark";
  setThemeMode: (m: "light" | "dark") => void;
};

const ChatContext = React.createContext<ChatContextType | null>(null);

const DEFAULT_PALETTE: Palette = {
  background: "#ffffff",
  surface: "#f8fafc",
  surfaceSecondary: "#f1f5f9",
  border: "#e2e8f0",
  primary: "#0f172a",
  onPrimary: "#ffffff",
  primaryContainer: "#cbd5e1",
  primaryHover: "#1e293b",
  accent: "#3b82f6",
  onAccent: "#ffffff",
  accentHover: "#2563eb",
  text: "#0f172a",
  textMedium: "#475569",
  textLow: "#94a3b8",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
};

const SETTINGS_STORAGE_KEY = "themeAI:settings";
const SESSION_STORAGE_KEY = "themeAI:savedSession";
const PROVIDERS = new Set<Provider>(["gemini", "ollama", "openai", "copilot"]);
const FALLBACK_PROVIDER_DEFAULTS: ProviderModelDefaults = {
  ollama: "mistral:latest",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash-lite",
  copilot: "gpt-4o",
};

export const PREDEFINED_MODELS: Record<
  Exclude<Provider, "ollama">,
  { label: string; value: string }[]
> = {
  gemini: [
    { label: "Gemini 2.5 Flash Lite", value: "gemini-2.5-flash-lite" },
    { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
    { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
    { label: "Gemini 3 Flash", value: "gemini-3-flash" },
    { label: "Gemini 3 Pro", value: "gemini-3-pro" },
    { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  ],
  openai: [
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "GPT-4o Mini", value: "gpt-4o-mini" },
    { label: "o1", value: "o1" },
    { label: "o3-mini", value: "o3-mini" },
  ],
  copilot: [
    { label: "GPT-4o", value: "gpt-4o" },
    { label: "GPT-4o Mini", value: "gpt-4o-mini" },
  ],
};

function isValidModelForProvider(model: string, provider: Provider): boolean {
  if (provider === "ollama") return true; // Ollama models are user-defined
  const list = PREDEFINED_MODELS[provider as "gemini" | "openai" | "copilot"];
  return list?.some((m) => m.value === model) ?? false;
}

function parseStorageSettings(raw: string | null) {
  const result = {
    storedProvider: null as Provider | null,
    directorProvider: null as Provider | null,
    storedModel: "",
    directorModel: "",
    geminiApiKey: "",
    openaiApiKey: "",
    copilotApiKey: "",
    storedPrompt: "",
  };
  if (!raw) return result;

  try {
    const settings = JSON.parse(raw);
    if (
      typeof settings.provider === "string" &&
      PROVIDERS.has(settings.provider as Provider)
    ) {
      result.storedProvider = settings.provider as Provider;
    }
    if (
      typeof settings.directorProvider === "string" &&
      PROVIDERS.has(settings.directorProvider as Provider)
    ) {
      result.directorProvider = settings.directorProvider as Provider;
    }
    if (typeof settings.model === "string") result.storedModel = settings.model;
    if (typeof settings.directorModel === "string") {
      result.directorModel = settings.directorModel;
    }
    if (typeof settings.geminiApiKey === "string") {
      result.geminiApiKey = settings.geminiApiKey;
    }
    if (typeof settings.openaiApiKey === "string") {
      result.openaiApiKey = settings.openaiApiKey;
    }
    if (typeof settings.copilotApiKey === "string") {
      result.copilotApiKey = settings.copilotApiKey;
    }
    if (
      typeof settings.defaultPrompt === "string" &&
      settings.defaultPrompt.trim()
    ) {
      result.storedPrompt = settings.defaultPrompt.trim();
    }
  } catch {
    // ignore invalid storage payloads
  }
  return result;
}

async function fetchMcpDefaults() {
  let resolvedDefaults = FALLBACK_PROVIDER_DEFAULTS;
  let serverDefaultProvider: Provider = "ollama";

  try {
    const health = await getMcpHealth();
    if (health.defaults?.provider && PROVIDERS.has(health.defaults.provider)) {
      serverDefaultProvider = health.defaults.provider;
    }

    if (health.defaults?.models) {
      resolvedDefaults = {
        ...FALLBACK_PROVIDER_DEFAULTS,
        ...health.defaults.models,
      };
    }
  } catch {
    // fall back to static defaults when MCP is unavailable
  }

  return { serverDefaultProvider, resolvedDefaults };
}

const FORCED_TOOL_LOADING: Record<ForcedTool, string> = {
  generate_palette: "Generating your palette...",
  discover_styles: "Discovering style directions...",
  tweak_palette: "Tweaking the palette...",
};

function getLoadingMessage(tool: ForcedTool | null | undefined): string {
  if (tool) return FORCED_TOOL_LOADING[tool];
  return "The Creative Director is drafting ideas...";
}

export function ChatProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [provider, setProvider] = React.useState<Provider>("gemini");
  const [model, setModel] = React.useState("gemini-2.5-flash-lite");
  const [directorProvider, setDirectorProvider] =
    React.useState<Provider>("gemini");
  const [directorModel, setDirectorModel] = React.useState(
    "gemini-2.5-flash-lite",
  );
  const [geminiApiKey, setGeminiApiKey] = React.useState("");
  const [openaiApiKey, setOpenaiApiKey] = React.useState("");
  const [copilotApiKey, setCopilotApiKey] = React.useState("");
  const [providerDefaults, setProviderDefaults] =
    React.useState<ProviderModelDefaults>(FALLBACK_PROVIDER_DEFAULTS);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [appliedPalette, setAppliedPalette] =
    React.useState<Palette>(DEFAULT_PALETTE);
  const [loading, setLoading] = React.useState(false);
  const [lastPrompt, setLastPrompt] = React.useState("");
  const [loadingState, setLoadingState] = React.useState<string | null>(null);
  const [chatInput, setChatInput] = React.useState("");
  const [conversationId, setConversationId] = React.useState<string | null>(
    null,
  );
  const [pendingStyles, setPendingStyles] = React.useState<StyleOption[]>([]);
  const [themeMode, setThemeMode] = React.useState<"light" | "dark">("light");

  const { data: session } = useSession();

  React.useEffect(() => {
    // Only auto-sync from session if we don't have a manual key saved in localStorage
    // This allows manual token overrides to persist across reloads
    if (session?.accessToken) {
      try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        // If there's no manual key in storage, or if the stored key is the one from the current session, sync it.
        // This ensures GitHub Login works, but typing a different key persists.
        if (
          !parsed?.copilotApiKey ||
          parsed.copilotApiKey === session.accessToken
        ) {
          setCopilotApiKey(session.accessToken);
        }
      } catch {
        // Fallback to sync if storage is corrupted
        setCopilotApiKey(session.accessToken);
      }
    }
  }, [session]);

  React.useEffect(() => {
    let cancelled = false;

    async function initializeSettings() {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const parsed = parseStorageSettings(raw);

      if (parsed.directorProvider) setDirectorProvider(parsed.directorProvider);
      if (parsed.directorModel) setDirectorModel(parsed.directorModel);
      if (parsed.geminiApiKey) setGeminiApiKey(parsed.geminiApiKey);
      if (parsed.openaiApiKey) setOpenaiApiKey(parsed.openaiApiKey);
      if (parsed.copilotApiKey) setCopilotApiKey(parsed.copilotApiKey);

      const { serverDefaultProvider, resolvedDefaults } =
        await fetchMcpDefaults();

      if (cancelled) return;

      const envDefaultProvider = process.env.NEXT_PUBLIC_DEFAULT_PROVIDER as
        | Provider
        | undefined;
      const envDefaultModel = process.env.NEXT_PUBLIC_DEFAULT_MODEL;

      const resolvedProvider =
        parsed.storedProvider ||
        serverDefaultProvider ||
        envDefaultProvider ||
        "gemini";

      let resolvedModel = parsed.storedModel.trim();

      // Validate the stored model against the provider
      if (
        resolvedModel &&
        !isValidModelForProvider(resolvedModel, resolvedProvider)
      ) {
        resolvedModel = ""; // Reset if invalid for this provider
      }

      if (!resolvedModel) {
        resolvedModel =
          resolvedDefaults[resolvedProvider] ||
          (resolvedProvider === envDefaultProvider ? envDefaultModel : "") ||
          "";
      }

      setProviderDefaults(resolvedDefaults);
      setProvider(resolvedProvider);
      setModel(resolvedModel);
      if (parsed.storedPrompt) {
        setLastPrompt(parsed.storedPrompt);
      }
    }

    void initializeSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushAssistantMessage = React.useCallback(
    (payload: Omit<Message, "id" | "role">) => {
      const id = `${Date.now()}-a`;
      setMessages((current) => [
        ...current,
        { id, role: "assistant", ...payload },
      ]);
    },
    [],
  );

  const sendMessage = React.useCallback(
    async (text: string, forceTool?: ForcedTool) => {
      const id = String(Date.now());
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: Message = { id: `${id}-u`, role: "user", text: trimmed };
      setMessages((s) => [...s, userMsg]);
      setLoading(true);
      setLoadingState(getLoadingMessage(forceTool));

      try {
        const res = await fetch("/api/assistant/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            forceTool: forceTool || undefined,
            history: messages.map((m) => ({ role: m.role, text: m.text })),
            conversationId: conversationId || undefined,
            paletteEngine: {
              provider,
              model: model || undefined,
              geminiApiKey: geminiApiKey || undefined,
              openaiApiKey: openaiApiKey || undefined,
              copilotApiKey: copilotApiKey || undefined,
            },
            director: {
              provider: directorProvider,
              model: directorModel,
              geminiApiKey: geminiApiKey || undefined,
              openaiApiKey: openaiApiKey || undefined,
              copilotApiKey: copilotApiKey || undefined,
            },
            currentPalette: appliedPalette,
          }),
        });

        if (!res.ok) throw new Error(`Assistant failed (${res.status})`);
        const result: AssistantMessageResponse = await res.json();

        if (result.kind === "error") {
          throw new Error(result.reply);
        }

        // Persist conversationId for session continuity
        if (result.conversationId) {
          setConversationId(result.conversationId);
        }

        if (result.palette) {
          setAppliedPalette(result.palette);
          setPendingStyles([]);
        }

        if (result.kind === "discovery" && result.styles) {
          setPendingStyles(result.styles);
        }

        pushAssistantMessage({
          text: result.reply,
          explain: result.explain,
          palette: result.palette,
          palettes: result.palettes,
          styles: result.styles,
          providerUsed: result.providerUsed,
          toolUsed: result.toolUsed,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error contacting assistant";
        pushAssistantMessage({ text: message });
      } finally {
        setLoading(false);
      }
    },
    [
      messages,
      conversationId,
      provider,
      model,
      geminiApiKey,
      openaiApiKey,
      directorProvider,
      directorModel,
      appliedPalette,
      pushAssistantMessage,
      copilotApiKey,
    ],
  );

  const selectStyle = React.useCallback(
    async (styleId: string) => {
      setLoading(true);
      setLoadingState("The Palette Engine is generating your colours...");
      try {
        const res = await fetch("/api/assistant/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `I select style: ${styleId}`,
            history: messages.map((m) => ({ role: m.role, text: m.text })),
            conversationId: conversationId || undefined,
            selection: { styleId },
            paletteEngine: {
              provider,
              model: model || undefined,
              geminiApiKey: geminiApiKey || undefined,
              openaiApiKey: openaiApiKey || undefined,
              copilotApiKey: copilotApiKey || undefined,
            },
            director: {
              provider: directorProvider,
              model: directorModel,
              geminiApiKey: geminiApiKey || undefined,
              openaiApiKey: openaiApiKey || undefined,
              copilotApiKey: copilotApiKey || undefined,
            },
            currentPalette: appliedPalette,
          }),
        });

        if (!res.ok) throw new Error(`Selection failed (${res.status})`);
        const result: AssistantMessageResponse = await res.json();

        if (result.kind === "error") {
          throw new Error(result.reply);
        }

        if (result.conversationId) {
          setConversationId(result.conversationId);
        }

        if (result.palette) {
          setAppliedPalette(result.palette);
          setPendingStyles([]);
        }

        pushAssistantMessage({
          text: result.reply,
          explain: result.explain,
          palette: result.palette,
          palettes: result.palettes,
          providerUsed: result.providerUsed,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error selecting style";
        pushAssistantMessage({ text: message });
      } finally {
        setLoading(false);
      }
    },
    [
      messages,
      conversationId,
      provider,
      model,
      geminiApiKey,
      openaiApiKey,
      copilotApiKey,
      directorProvider,
      directorModel,
      appliedPalette,
      pushAssistantMessage,
    ],
  );

  const applyPalette = React.useCallback((palette: Palette) => {
    setAppliedPalette(palette);
  }, []);

  const tweakOneColor = React.useCallback(
    async (key: keyof Palette, hex: string) => {
      setLoading(true);
      try {
        const result = await tweakThemePalette({
          palette: appliedPalette,
          updates: { [key]: hex },
          provider,
          model: model || undefined,
          geminiApiKey: geminiApiKey || undefined,
          openaiApiKey: openaiApiKey || undefined,
          copilotApiKey: copilotApiKey || undefined,
        });
        setAppliedPalette(result.palette);
        pushAssistantMessage({
          text: `Updated ${key} color.`,
          explain: result.explain,
          palette: result.palette,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to tweak color";
        pushAssistantMessage({ text: message });
      } finally {
        setLoading(false);
      }
    },
    [
      appliedPalette,
      provider,
      model,
      geminiApiKey,
      openaiApiKey,
      copilotApiKey,
      pushAssistantMessage,
    ],
  );

  const tweakColorByPrompt = React.useCallback(
    async (key: keyof Palette, prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setLoading(true);
      setLoadingState(`Interpreting your intent for "${key}"...`);
      try {
        // ── Step 1: Interpret the user's intent into a precise hex ───────────
        const intent = await interpretColorForKey({
          key,
          userPrompt: trimmed,
          currentPalette: appliedPalette,
          provider,
          model: model || undefined,
          geminiApiKey: geminiApiKey || undefined,
          openaiApiKey: openaiApiKey || undefined,
          copilotApiKey: copilotApiKey || undefined,
        });

        setLoadingState(`Applying ${intent.hex} to "${key}"...`);

        // ── Step 2: Apply the resolved hex deterministically via tweakThemePalette ──
        const result = await tweakThemePalette({
          palette: appliedPalette,
          updates: { [key]: intent.hex },
          provider,
          model: model || undefined,
          geminiApiKey: geminiApiKey || undefined,
          openaiApiKey: openaiApiKey || undefined,
          copilotApiKey: copilotApiKey || undefined,
        });

        setAppliedPalette(result.palette);
        pushAssistantMessage({
          text: `Updated ${key}: ${intent.interpretation}`,
          explain: result.explain,
          palette: result.palette,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to update color from prompt";
        pushAssistantMessage({ text: message });
      } finally {
        setLoading(false);
        setLoadingState(null);
      }
    },
    [
      appliedPalette,
      provider,
      model,
      geminiApiKey,
      openaiApiKey,
      copilotApiKey,
      pushAssistantMessage,
    ],
  );

  const regenerateAllColors = React.useCallback(async () => {
    const mood = lastPrompt || "modern dashboard";
    setLoading(true);
    try {
      const result = await tweakThemePalette({
        palette: appliedPalette,
        mood,
        provider,
        model: model || undefined,
        geminiApiKey: geminiApiKey || undefined,
        openaiApiKey: openaiApiKey || undefined,
        copilotApiKey: copilotApiKey || undefined,
      });
      setAppliedPalette(result.palette);
      pushAssistantMessage({
        text: `Regenerated full palette for "${mood}".`,
        explain: result.explain,
        palette: result.palette,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to regenerate palette";
      pushAssistantMessage({ text: message });
    } finally {
      setLoading(false);
    }
  }, [
    lastPrompt,
    appliedPalette,
    provider,
    model,
    geminiApiKey,
    openaiApiKey,
    copilotApiKey,
    pushAssistantMessage,
  ]);

  const newChat = React.useCallback(() => {
    setMessages([]);
    setPendingStyles([]);
    setConversationId(null);
  }, []);

  const saveSession = React.useCallback(() => {
    const payload: SavedSession = {
      provider,
      model,
      messages,
      appliedPalette,
      lastPrompt,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      toast.success("Session Saved", {
        description: "Current theme and settings backed up to browser storage.",
      });
    } catch {
      toast.error("Save Failed", {
        description: "Unable to persist session to browser storage.",
      });
    }
  }, [provider, model, messages, appliedPalette, lastPrompt]);

  const restoreSession = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        toast.error("No Session Found", {
          description: "No previously saved state exists.",
        });
        return;
      }
      const payload = JSON.parse(raw) as SavedSession;
      if (payload.provider) setProvider(payload.provider);
      if (payload.model) setModel(payload.model);
      if (payload.appliedPalette)
        setAppliedPalette({ ...DEFAULT_PALETTE, ...payload.appliedPalette });
      if (Array.isArray(payload.messages)) setMessages(payload.messages);
      if (typeof payload.lastPrompt === "string")
        setLastPrompt(payload.lastPrompt);
      toast.success("Session Restored", {
        description: `Back from ${payload.savedAt ? new Date(payload.savedAt).toLocaleString() : "unknown time"}.`,
      });
    } catch {
      toast.error("Restore Failed", {
        description: "The saved session data is corrupted.",
      });
    }
  }, []);

  const contextValue = React.useMemo(
    () => ({
      provider,
      setProvider,
      model,
      setModel,
      directorProvider,
      setDirectorProvider,
      directorModel,
      setDirectorModel,
      geminiApiKey,
      setGeminiApiKey,
      openaiApiKey,
      setOpenaiApiKey,
      copilotApiKey,
      setCopilotApiKey,
      providerDefaults,
      messages,
      loading,
      appliedPalette,
      pendingStyles,
      conversationId,
      sendMessage,
      selectStyle,
      applyPalette,
      tweakOneColor,
      tweakColorByPrompt,
      regenerateAllColors,
      newChat,
      saveSession,
      restoreSession,
      loadingState,
      chatInput,
      setChatInput,
      themeMode,
      setThemeMode,
    }),
    [
      provider,
      model,
      directorProvider,
      directorModel,
      geminiApiKey,
      openaiApiKey,
      copilotApiKey,
      providerDefaults,
      messages,
      loading,
      appliedPalette,
      pendingStyles,
      conversationId,
      chatInput,
      sendMessage,
      selectStyle,
      applyPalette,
      tweakOneColor,
      tweakColorByPrompt,
      regenerateAllColors,
      newChat,
      saveSession,
      restoreSession,
      loadingState,
      themeMode,
    ],
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = React.useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside ChatProvider");
  return ctx;
}
