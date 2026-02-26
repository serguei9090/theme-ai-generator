"use client";
import React from "react";
import type {
  AssistantMessageResponse,
  StyleOption,
} from "../lib/assistantTypes";
import type {
  Palette,
  Provider,
  ProviderModelDefaults,
} from "../lib/mcpClient";
import {
  generateThemePalette,
  getMcpHealth,
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
  sendMessage: (text: string) => Promise<void>;
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
  gemini: "gemini-2.0-flash",
  copilot: "gpt-5",
};

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

export function ChatProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [provider, setProvider] = React.useState<Provider>("ollama");
  const [model, setModel] = React.useState("");
  const [directorProvider, setDirectorProvider] =
    React.useState<Provider>("copilot");
  const [directorModel, setDirectorModel] = React.useState("gpt-5");
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
        "ollama";
      const resolvedModel =
        parsed.storedModel.trim() ||
        resolvedDefaults[resolvedProvider] ||
        (resolvedProvider === envDefaultProvider ? envDefaultModel : "") ||
        "";

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
    async (text: string) => {
      const id = String(Date.now());
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMsg: Message = { id: `${id}-u`, role: "user", text: trimmed };
      setMessages((s) => [...s, userMsg]);
      setLoading(true);
      setLoadingState("The Creative Director is drafting ideas...");

      try {
        const res = await fetch("/api/assistant/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: messages.map((m) => ({ role: m.role, text: m.text })),
            conversationId: conversationId || undefined,
            paletteEngine: {
              provider,
              model: model || undefined,
              geminiApiKey: geminiApiKey || undefined,
              openaiApiKey: openaiApiKey || undefined,
            },
            director: {
              provider: directorProvider,
              model: directorModel,
              geminiApiKey: geminiApiKey || undefined,
              openaiApiKey: openaiApiKey || undefined,
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
      pushAssistantMessage,
    ],
  );

  const tweakColorByPrompt = React.useCallback(
    async (key: keyof Palette, prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setLoading(true);
      try {
        const result = await generateThemePalette({
          mood: `Update only the ${key} color for this request: ${trimmed}. Keep palette harmony with this current palette: ${JSON.stringify(
            appliedPalette,
          )}.`,
          provider,
          model: model || undefined,
          geminiApiKey: geminiApiKey || undefined,
          openaiApiKey: openaiApiKey || undefined,
        });

        const nextPalette: Palette = {
          ...appliedPalette,
          [key]: result.palette[key],
        };

        setAppliedPalette(nextPalette);
        pushAssistantMessage({
          text: `Updated ${key} from prompt "${trimmed}".`,
          explain: result.explain,
          palette: nextPalette,
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to update color from prompt";
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
      pushAssistantMessage({ text: "Session saved to browser storage." });
    } catch {
      pushAssistantMessage({ text: "Unable to save session." });
    }
  }, [
    provider,
    model,
    messages,
    appliedPalette,
    lastPrompt,
    pushAssistantMessage,
  ]);

  const restoreSession = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        pushAssistantMessage({ text: "No saved session found." });
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
      pushAssistantMessage({
        text: `Restored saved session from ${payload.savedAt || "unknown time"}.`,
      });
    } catch {
      pushAssistantMessage({ text: "Unable to restore saved session." });
    }
  }, [pushAssistantMessage]);

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
