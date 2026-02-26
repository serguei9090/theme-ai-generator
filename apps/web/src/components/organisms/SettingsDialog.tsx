"use client";

import { Github, Settings } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import { toast } from "sonner";
import type { Provider } from "@/lib/mcpClient";
import { PREDEFINED_MODELS, useChat } from "@/providers/chatContext";
import { Button } from "../atoms/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../atoms/dialog";
import { Input } from "../atoms/input";

const SETTINGS_STORAGE_KEY = "themeAI:settings";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getModelName(model: unknown): string | null {
  if (typeof model === "string" && model.trim()) return model;
  if (!isRecord(model)) return null;

  if (typeof model.name === "string" && model.name.trim()) return model.name;
  if (typeof model.model === "string" && model.model.trim()) return model.model;
  if (typeof model.id === "string" && model.id.trim()) return model.id;
  return null;
}

function parseModelList(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => getModelName(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.models)) {
    return payload.models
      .map((entry) => getModelName(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  if (payload.object === "list" && Array.isArray(payload.data)) {
    return payload.data
      .map((entry) => getModelName(entry))
      .filter((entry): entry is string => Boolean(entry));
  }

  return [];
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function SettingsDialog() {
  const {
    provider: globalProvider,
    setProvider: setGlobalProvider,
    model: globalModel,
    setModel: setGlobalModel,
    directorProvider: globalDirectorProvider,
    setDirectorProvider: setGlobalDirectorProvider,
    directorModel: globalDirectorModel,
    setDirectorModel: setGlobalDirectorModel,
    geminiApiKey: globalGeminiApiKey,
    setGeminiApiKey: setGlobalGeminiApiKey,
    openaiApiKey: globalOpenaiApiKey,
    setOpenaiApiKey: setGlobalOpenaiApiKey,
    copilotApiKey: globalCopilotApiKey,
    setCopilotApiKey: setGlobalCopilotApiKey,
    providerDefaults,
    saveSession,
    restoreSession,
    loading,
  } = useChat();

  const { data: session } = useSession();

  const [provider, setLocalProvider] = React.useState<Provider>(globalProvider);
  const [model, setModel] = React.useState(globalModel);
  const [directorProvider, setDirectorProvider] = React.useState<Provider>(
    globalDirectorProvider,
  );
  const [directorModel, setDirectorModel] = React.useState(globalDirectorModel);
  const [geminiApiKey, setLocalGeminiApiKey] =
    React.useState(globalGeminiApiKey);
  const [openaiApiKey, setLocalOpenaiApiKey] =
    React.useState(globalOpenaiApiKey);
  const [copilotApiKey, setLocalCopilotApiKey] =
    React.useState(globalCopilotApiKey);
  const [ollamaConnected, setOllamaConnected] = React.useState(false);
  const [models, setModels] = React.useState<string[]>([]);
  const [connecting, setConnecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copilotModels, setCopilotModels] = React.useState<
    { label: string; value: string }[]
  >([]);
  const [defaultPrompt, setDefaultPrompt] = React.useState("");

  React.useEffect(() => {
    setLocalProvider(globalProvider);
    setModel(globalModel || providerDefaults[globalProvider] || "");
    setDirectorProvider(globalDirectorProvider);
    setDirectorModel(globalDirectorModel);
    setLocalGeminiApiKey(globalGeminiApiKey);
    setLocalOpenaiApiKey(globalOpenaiApiKey);
    setLocalCopilotApiKey(globalCopilotApiKey);
  }, [
    globalProvider,
    globalModel,
    globalDirectorProvider,
    globalDirectorModel,
    globalGeminiApiKey,
    globalOpenaiApiKey,
    globalCopilotApiKey,
    providerDefaults,
  ]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (typeof parsed.defaultPrompt === "string") {
        setDefaultPrompt(parsed.defaultPrompt);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchOllamaModels = React.useCallback(
    async (signal?: AbortSignal) => {
      setConnecting(true);
      setError(null);

      try {
        const res = await fetch("/api/ollama/models", { signal });
        const text = await res.text();
        let data: unknown;

        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        if (!res.ok) {
          let errorMessage = "";
          if (isRecord(data) && typeof data.error === "string") {
            const detail =
              typeof data.detail === "string" ? `: ${data.detail}` : "";
            errorMessage = `${data.error}${detail}`;
          } else if (typeof data === "string") {
            errorMessage = data;
          } else {
            errorMessage = `Upstream returned status ${res.status}`;
          }
          setError(errorMessage);
          toast.error("Ollama Error", { description: errorMessage });
          setModels([]);
          setModel("");
          setOllamaConnected(false);
          return;
        }

        const parsedModels = parseModelList(data);
        if (parsedModels.length === 0) {
          setError("No models found on Ollama");
          setModels([]);
          setModel(providerDefaults.ollama || "");
          setDirectorModel(providerDefaults.ollama || "");
          setOllamaConnected(false);
          return;
        }

        setModels(parsedModels);
        setModel((prev) => prev || parsedModels[0]);
        setDirectorModel((prev) => prev || parsedModels[0]);
        setOllamaConnected(true);
      } catch (error: unknown) {
        if (signal?.aborted) return;
        setError(`Unable to fetch models: ${getErrorMessage(error)}`);
        setModels([]);
        setModel(providerDefaults.ollama || "");
        setOllamaConnected(false);
      } finally {
        if (!signal?.aborted) {
          setConnecting(false);
        }
      }
    },
    [providerDefaults.ollama],
  );

  const fetchCopilotModels = React.useCallback(
    async (signal?: AbortSignal) => {
      setConnecting(true);
      setError(null);

      try {
        const res = await fetch("/api/copilot/models", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ copilotApiKey }),
          signal,
        });
        const text = await res.text();
        let data: unknown;

        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        if (!res.ok) {
          let errorMessage = "";
          if (isRecord(data) && typeof data.error === "string") {
            const detail =
              typeof data.detail === "string" ? `: ${data.detail}` : "";
            errorMessage = `${data.error}${detail}`;
          } else if (typeof data === "string") {
            errorMessage = data;
          } else {
            errorMessage = `Upstream returned status ${res.status}`;
          }

          setError(errorMessage);
          toast.error("Copilot Error", { description: errorMessage });
          setCopilotModels([]);
          setModel("");
          return;
        }

        if (
          Array.isArray(data) &&
          data.every(
            (item) =>
              isRecord(item) &&
              typeof item.label === "string" &&
              typeof item.value === "string",
          )
        ) {
          const parsedModels = data as { label: string; value: string }[];
          if (parsedModels.length === 0) {
            setError("No models found for Copilot");
            setCopilotModels([]);
            setModel(providerDefaults.copilot || "");
            setDirectorModel(providerDefaults.copilot || "");
            return;
          }
          setCopilotModels(parsedModels);
          setModel((prev) => prev || parsedModels[0].value);
          setDirectorModel((prev) => prev || parsedModels[0].value);
        } else {
          setError("Invalid model list format from Copilot API");
          setCopilotModels([]);
          setModel(providerDefaults.copilot || "");
          setDirectorModel(providerDefaults.copilot || "");
        }
      } catch (error: unknown) {
        if (signal?.aborted) return;
        const errorMessage = `Unable to fetch models: ${getErrorMessage(error)}`;
        setError(errorMessage);
        toast.error("Copilot Model Fetch Failed", {
          description: errorMessage,
        });
        setCopilotModels([]);
        setModel(providerDefaults.copilot || "");
      } finally {
        if (!signal?.aborted) {
          setConnecting(false);
        }
      }
    },
    [providerDefaults.copilot, copilotApiKey],
  );

  React.useEffect(() => {
    const ctrl = new AbortController();
    const needsOllama = provider === "ollama" || directorProvider === "ollama";
    const needsCopilot =
      provider === "copilot" || directorProvider === "copilot";

    if (needsOllama) {
      fetchOllamaModels(ctrl.signal);
    }
    if (needsCopilot) {
      fetchCopilotModels(ctrl.signal);
    }

    if (!needsOllama && !needsCopilot) {
      setError(null);
      setModels([]);
      setOllamaConnected(false);
      setCopilotModels([]);
    }

    return () => ctrl.abort();
  }, [provider, directorProvider, fetchOllamaModels, fetchCopilotModels]);

  function handleToggleOllamaConnection() {
    if (ollamaConnected) {
      setOllamaConnected(false);
      setModels([]);
      setModel(providerDefaults.ollama || "");
      setError(null);
      return;
    }
    void fetchOllamaModels();
  }

  function handleProviderChange(nextProvider: Provider) {
    setLocalProvider(nextProvider);
    // Reset model to first available or default
    const nextModels =
      PREDEFINED_MODELS[nextProvider as keyof typeof PREDEFINED_MODELS] || [];
    const defaultModel =
      nextModels[0]?.value || providerDefaults[nextProvider] || "";
    setModel(defaultModel);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-text-tertiary hover:text-text rounded-full shrink-0"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogHeader>
          <h3 className="text-lg font-semibold">Settings</h3>
          <p className="text-sm text-text-tertiary">
            Configure session and AI models
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <section className="space-y-4 rounded-lg border border-border/50 bg-background/50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-secondary">
              Session
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={restoreSession}
                disabled={loading}
              >
                Restore Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveSession}
                disabled={loading}
              >
                Save Session
              </Button>
            </div>
            <div className="pt-2">
              <label
                className="text-sm font-medium"
                htmlFor="default-prompt-input"
              >
                Default Prompt (Initial State)
              </label>
              <Input
                id="default-prompt-input"
                className="mt-2"
                value={defaultPrompt}
                onChange={(e) =>
                  setDefaultPrompt((e.target as HTMLInputElement).value)
                }
                placeholder="e.g. Minimalist Corporate"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-border/50 bg-background/50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-accent" />
              Assistant Director (Chat AI)
            </h4>
            <p className="text-xs text-text-tertiary">
              <b>The Brain:</b> This AI talks to you in the sidebar and decides
              when to change colors.
            </p>
            <div>
              <label
                className="text-sm font-medium"
                htmlFor="director-provider-select"
              >
                Provider
              </label>
              <select
                id="director-provider-select"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text"
                value={directorProvider}
                onChange={(e) => {
                  const nextProvider = e.target.value as Provider;
                  setDirectorProvider(nextProvider);
                  // Reset model to first available or default
                  const nextModels =
                    PREDEFINED_MODELS[
                      nextProvider as keyof typeof PREDEFINED_MODELS
                    ] || [];
                  const defaultModel =
                    nextModels[0]?.value ||
                    providerDefaults[nextProvider] ||
                    "";
                  setDirectorModel(defaultModel);
                }}
              >
                <option value="gemini">Google Gemini (GenAI SDK)</option>
                <option value="ollama">Ollama (Local LLM)</option>
                <option value="openai">OpenAI (Direct API)</option>
                <option value="copilot">GitHub Copilot (Official SDK)</option>
              </select>
            </div>

            {directorProvider === "ollama" && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Ollama</p>
                  <div
                    className={`rounded-full px-2 py-1 text-sm ${ollamaConnected ? "bg-success text-white" : "bg-border text-text"}`}
                  >
                    {ollamaConnected ? "Connected" : "Disconnected"}
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={handleToggleOllamaConnection} size="sm">
                      {connecting
                        ? "Connecting..."
                        : ollamaConnected
                          ? "Disconnect"
                          : "Connect"}
                    </Button>
                    <div className="flex-1">
                      <label
                        className="sr-only"
                        htmlFor="director-ollama-model-select"
                      >
                        Ollama model
                      </label>
                      <select
                        id="director-ollama-model-select"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text"
                        value={directorModel}
                        onChange={(e) => setDirectorModel(e.target.value)}
                        disabled={!ollamaConnected || models.length === 0}
                      >
                        {models.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              </div>
            )}

            {directorProvider !== "ollama" && (
              <div className="space-y-4">
                <div>
                  <label
                    className="text-sm font-medium"
                    htmlFor="director-model-select"
                  >
                    Model
                  </label>
                  <select
                    id="director-model-select"
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text"
                    value={directorModel}
                    onChange={(e) => setDirectorModel(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a model
                    </option>
                    {connecting ? (
                      <option disabled>Discovering models...</option>
                    ) : directorProvider === "copilot" &&
                      copilotModels.length > 0 ? (
                      copilotModels.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))
                    ) : (
                      PREDEFINED_MODELS[
                        directorProvider as Exclude<Provider, "ollama">
                      ]?.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))
                    )}
                    {directorProvider === "copilot" &&
                      !connecting &&
                      copilotModels.length === 0 && (
                        <option disabled>
                          No models found. Please authenticate below.
                        </option>
                      )}
                    {!PREDEFINED_MODELS[
                      directorProvider as Exclude<Provider, "ollama">
                    ]?.some((m) => m.value === directorModel) &&
                      !copilotModels.some((m) => m.value === directorModel) &&
                      directorModel &&
                      !connecting && (
                        <option value={directorModel}>
                          {directorModel} (Custom)
                        </option>
                      )}
                  </select>
                </div>
                {directorProvider === "gemini" && (
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="director-gemini-api-key-input"
                    >
                      Gemini API Key (Optional)
                    </label>
                    <Input
                      id="director-gemini-api-key-input"
                      type="password"
                      className="mt-2"
                      value={geminiApiKey}
                      onChange={(e) =>
                        setLocalGeminiApiKey(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      placeholder="AIza..."
                    />
                  </div>
                )}
                {directorProvider === "openai" && (
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="director-api-key-input"
                    >
                      OpenAI API Key (Optional)
                    </label>
                    <Input
                      id="director-api-key-input"
                      type="password"
                      className="mt-2"
                      value={openaiApiKey}
                      onChange={(e) =>
                        setLocalOpenaiApiKey(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      placeholder="sk-..."
                    />
                  </div>
                )}
                {directorProvider === "copilot" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium">
                        GitHub Authentication
                      </div>

                      {session ? (
                        <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {session.user?.name || "Authenticated"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => signOut()}
                          >
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => signIn("github")}
                        >
                          <Github className="h-4 w-4" />
                          Login with GitHub
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <label
                        className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary"
                        htmlFor="director-copilot-api-key"
                      >
                        Manual Token Override
                      </label>
                      <Input
                        id="director-copilot-api-key"
                        type="password"
                        className="h-8 shadow-none"
                        value={copilotApiKey}
                        onChange={(e) =>
                          setLocalCopilotApiKey(
                            (e.target as HTMLInputElement).value,
                          )
                        }
                        placeholder="ghp_... or tired_..."
                      />
                      <p className="text-[10px] text-text-tertiary leading-tight">
                        Enter a direct Copilot token (CLI/OAuth) to override
                        account login.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-border/50 bg-background/50 p-4 opacity-80">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Palette Engine (Tool AI)
            </h4>
            <p className="text-xs text-text-tertiary">
              <b>The Workhorse:</b> Only used for technical generation tasks
              triggered by the Director.
            </p>

            <div>
              <label className="text-sm font-medium" htmlFor="provider-select">
                Provider
              </label>
              <select
                id="provider-select"
                className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text"
                value={provider}
                onChange={(e) =>
                  handleProviderChange(e.target.value as Provider)
                }
              >
                <option value="gemini">Google Gemini (GenAI SDK)</option>
                <option value="ollama">Ollama (Local LLM)</option>
                <option value="openai">OpenAI (Direct API)</option>
                <option value="copilot">GitHub Copilot (Official SDK)</option>
              </select>
            </div>

            {provider === "ollama" && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Ollama</p>
                  <div
                    className={`rounded-full px-2 py-1 text-sm ${ollamaConnected ? "bg-success text-white" : "bg-border text-text"}`}
                  >
                    {ollamaConnected ? "Connected" : "Disconnected"}
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={handleToggleOllamaConnection} size="sm">
                      {connecting
                        ? "Connecting..."
                        : ollamaConnected
                          ? "Disconnect"
                          : "Connect"}
                    </Button>
                    <div className="flex-1">
                      <label className="sr-only" htmlFor="ollama-model-select">
                        Ollama model
                      </label>
                      <select
                        id="ollama-model-select"
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={!ollamaConnected || models.length === 0}
                      >
                        {models.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              </div>
            )}

            {provider !== "ollama" && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="model-select">
                    Model
                  </label>
                  <select
                    id="model-select"
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a model
                    </option>
                    {connecting ? (
                      <option disabled>Discovering models...</option>
                    ) : provider === "copilot" && copilotModels.length > 0 ? (
                      copilotModels.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))
                    ) : (
                      PREDEFINED_MODELS[
                        provider as Exclude<Provider, "ollama">
                      ]?.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))
                    )}
                    {provider === "copilot" &&
                      !connecting &&
                      copilotModels.length === 0 && (
                        <option disabled>
                          No models found. Please authenticate below.
                        </option>
                      )}
                    {!PREDEFINED_MODELS[
                      provider as Exclude<Provider, "ollama">
                    ]?.some((m) => m.value === model) &&
                      !copilotModels.some((m) => m.value === model) &&
                      model &&
                      !connecting && (
                        <option value={model}>{model} (Custom)</option>
                      )}
                  </select>
                </div>

                {provider === "gemini" && (
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="gemini-api-key-input"
                    >
                      Gemini API Key (Optional)
                    </label>
                    <Input
                      id="gemini-api-key-input"
                      type="password"
                      className="mt-2"
                      value={geminiApiKey}
                      onChange={(e) =>
                        setLocalGeminiApiKey(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      placeholder="AIza..."
                    />
                  </div>
                )}
                {provider === "openai" && (
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="api-key-input"
                    >
                      OpenAI API Key (Optional)
                    </label>
                    <Input
                      id="api-key-input"
                      type="password"
                      className="mt-2"
                      value={openaiApiKey}
                      onChange={(e) =>
                        setLocalOpenaiApiKey(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      placeholder="sk-..."
                    />
                  </div>
                )}
                {provider === "copilot" && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium">
                        GitHub Authentication
                      </div>

                      {session ? (
                        <div className="flex items-center justify-between rounded-md border border-success/30 bg-success/5 p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {session.user?.name || "Authenticated"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => signOut()}
                          >
                            Sign Out
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => signIn("github")}
                        >
                          <Github className="h-4 w-4" />
                          Login with GitHub
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <label
                        className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary"
                        htmlFor="copilot-api-key"
                      >
                        Manual Token Override
                      </label>
                      <Input
                        id="copilot-api-key"
                        type="password"
                        className="h-8 shadow-none"
                        value={copilotApiKey || ""}
                        onChange={(e) =>
                          setLocalCopilotApiKey(
                            (e.target as HTMLInputElement).value,
                          )
                        }
                        placeholder="ghp_... or tired_..."
                      />
                      <p className="text-[10px] text-text-tertiary leading-tight">
                        Enter a direct Copilot token (CLI/OAuth) to override
                        account login.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="mt-6 pt-2 border-t border-border">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => {
                const settings = {
                  provider,
                  model,
                  directorProvider,
                  directorModel,
                  geminiApiKey,
                  openaiApiKey,
                  copilotApiKey,
                  ollamaConnected,
                  defaultPrompt,
                };
                try {
                  localStorage.setItem(
                    SETTINGS_STORAGE_KEY,
                    JSON.stringify(settings),
                  );
                } catch {
                  // ignore storage errors
                }
                setGlobalProvider(provider);
                setGlobalModel(model);
                setGlobalDirectorProvider(directorProvider);
                setGlobalDirectorModel(directorModel);
                setGlobalGeminiApiKey(geminiApiKey);
                setGlobalOpenaiApiKey(openaiApiKey);
                setGlobalCopilotApiKey(copilotApiKey);
              }}
            >
              Save Details
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
