"use client";

import { Settings } from "lucide-react";
import React from "react";
import type { Provider } from "@/lib/mcpClient";
import { useChat } from "@/providers/chatContext";
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
const PROVIDERS: Provider[] = ["gemini", "ollama", "openai", "copilot"];

const PREDEFINED_MODELS: Record<
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
    { label: "Claude 3.5 Sonnet", value: "claude-3.5-sonnet" },
    { label: "o1", value: "o1" },
  ],
};

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

      const parsed = JSON.parse(raw) as unknown;
      if (!isRecord(parsed)) return;

      if (
        typeof parsed.provider === "string" &&
        PROVIDERS.includes(parsed.provider as Provider)
      ) {
        setLocalProvider(parsed.provider as Provider);
      }

      if (typeof parsed.model === "string") {
        setModel(parsed.model);
      } else if (
        typeof parsed.provider === "string" &&
        PROVIDERS.includes(parsed.provider as Provider)
      ) {
        setModel(providerDefaults[parsed.provider as Provider] || "");
      }

      if (typeof parsed.defaultPrompt === "string") {
        setDefaultPrompt(parsed.defaultPrompt);
      }

      if (
        typeof parsed.directorProvider === "string" &&
        PROVIDERS.includes(parsed.directorProvider as Provider)
      ) {
        setDirectorProvider(parsed.directorProvider as Provider);
      }

      if (typeof parsed.directorModel === "string") {
        setDirectorModel(parsed.directorModel);
      } else if (
        typeof parsed.directorProvider === "string" &&
        PROVIDERS.includes(parsed.directorProvider as Provider)
      ) {
        setDirectorModel(
          providerDefaults[parsed.directorProvider as Provider] || "",
        );
      }

      if (typeof parsed.geminiApiKey === "string") {
        setLocalGeminiApiKey(parsed.geminiApiKey);
      }

      if (typeof parsed.openaiApiKey === "string") {
        setLocalOpenaiApiKey(parsed.openaiApiKey);
      }
      if (typeof parsed.copilotApiKey === "string") {
        setLocalCopilotApiKey(parsed.copilotApiKey);
      }

      if (typeof parsed.ollamaConnected === "boolean") {
        setOllamaConnected(parsed.ollamaConnected);
      }
    } catch {
      // ignore corrupted local data
    }
  }, [providerDefaults]);

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
          if (isRecord(data) && typeof data.error === "string") {
            const detail =
              typeof data.detail === "string" ? `: ${data.detail}` : "";
            setError(`${data.error}${detail}`);
          } else if (typeof data === "string") {
            setError(data);
          } else {
            setError(`Upstream returned status ${res.status}`);
          }
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
        setError(`Unable to fetch models: ${getErrorMessage(error)}`);
        setModels([]);
        setModel(providerDefaults.ollama || "");
        setOllamaConnected(false);
      } finally {
        setConnecting(false);
      }
    },
    [providerDefaults.ollama],
  );

  React.useEffect(() => {
    if (provider === "ollama" || directorProvider === "ollama") {
      const controller = new AbortController();
      fetchOllamaModels(controller.signal);
      return () => controller.abort();
    }

    setError(null);
    setModels([]);
    setOllamaConnected(false);
  }, [provider, directorProvider, fetchOllamaModels]);

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
    setModel(providerDefaults[nextProvider] || "");
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
              <span className="h-2 w-2 rounded-full bg-primary" />
              Frontend AI Config
            </h4>
            <p className="text-xs text-text-tertiary">
              Executes the actual color generation and accessibility grading.
            </p>

            <div>
              <label className="text-sm font-medium" htmlFor="provider-select">
                Provider
              </label>
              <select
                id="provider-select"
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
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
                        className="w-full rounded-md border px-3 py-2 text-sm"
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
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a model
                    </option>
                    {PREDEFINED_MODELS[
                      provider as Exclude<Provider, "ollama">
                    ]?.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                    {!PREDEFINED_MODELS[
                      provider as Exclude<Provider, "ollama">
                    ]?.some((m) => m.value === model) &&
                      model && <option value={model}>{model} (Custom)</option>}
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
                      htmlFor="openai-api-key-input"
                    >
                      OpenAI API Key (Optional)
                    </label>
                    <Input
                      id="openai-api-key-input"
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
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="copilot-api-key-input"
                    >
                      GitHub Token (Optional)
                    </label>
                    <Input
                      id="copilot-api-key-input"
                      type="password"
                      className="mt-2"
                      value={copilotApiKey}
                      onChange={(e) =>
                        setLocalCopilotApiKey(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      placeholder="ghp_..."
                    />
                    <p className="mt-1 text-[10px] text-text-tertiary">
                      Requires 'copilot' scope. If empty, uses server default.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-lg border border-border/50 bg-background/50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-accent" />
              MCP Server AI
            </h4>
            <p className="text-xs text-text-tertiary">
              Manages style discovery and high-level reasoning (Copilot SDK).
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
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                value={directorProvider}
                onChange={(e) => {
                  const nextProvider = e.target.value as Provider;
                  setDirectorProvider(nextProvider);
                  setDirectorModel(providerDefaults[nextProvider] || "");
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
                        className="w-full rounded-md border px-3 py-2 text-sm"
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
                    className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                    value={directorModel}
                    onChange={(e) => setDirectorModel(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a model
                    </option>
                    {PREDEFINED_MODELS[
                      directorProvider as Exclude<Provider, "ollama">
                    ]?.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                    {!PREDEFINED_MODELS[
                      directorProvider as Exclude<Provider, "ollama">
                    ]?.some((m) => m.value === directorModel) &&
                      directorModel && (
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
                  <div>
                    <label
                      className="text-sm font-medium"
                      htmlFor="director-copilot-api-key-input"
                    >
                      GitHub Token (Optional)
                    </label>
                    <Input
                      id="director-copilot-api-key-input"
                      type="password"
                      className="mt-2"
                      value={copilotApiKey}
                      onChange={(e) =>
                        setLocalCopilotApiKey(
                          (e.target as HTMLInputElement).value,
                        )
                      }
                      placeholder="ghp_..."
                    />
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
