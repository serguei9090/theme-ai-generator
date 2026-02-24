"use client"

import React from 'react'
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogHeader, DialogFooter, DialogTitle } from '../ui/dialog'
import { Button, Input } from '../atoms'
import { useChat } from '@/lib/chatContext'

export default function SettingsDialog() {
  const [provider, setLocalProvider] = React.useState('ollama')
  const [ollamaConnected, setOllamaConnected] = React.useState(false)
  const [ollamaModel, setOllamaModel] = React.useState('')
  const [models, setModels] = React.useState<string[]>([])
  const [connecting, setConnecting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [defaultPrompt, setDefaultPrompt] = React.useState('')
  const { setProvider: setGlobalProvider } = useChat()

  // load saved settings
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('themeAI:settings')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.provider) {
        setLocalProvider(parsed.provider)
        setGlobalProvider(parsed.provider)
      }
      setDefaultPrompt(parsed.defaultPrompt || '')
      if (parsed.ollamaModel) setOllamaModel(parsed.ollamaModel)
      if (parsed.ollamaConnected) setOllamaConnected(Boolean(parsed.ollamaConnected))
    } catch (e) {
      // ignore
    }
  }, [setGlobalProvider])

  async function fetchOllamaModels(signal?: AbortSignal) {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/ollama/models', { signal })
      const text = await res.text()
      let data: any = null
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }

      if (!res.ok) {
        if (data && typeof data === 'object' && data.error) {
          setError(data.error + (data.detail ? `: ${data.detail}` : ''))
        } else if (typeof data === 'string') {
          setError(data)
        } else {
          setError(`Upstream returned status ${res.status}`)
        }
        setModels([])
        setOllamaModel('')
        setOllamaConnected(false)
        return
      }

      const payload = data
      let parsed: string[] = []
      if (Array.isArray(payload)) {
        if (payload.length === 0) parsed = []
        else if (typeof payload[0] === 'string') parsed = payload as string[]
        else if (typeof payload[0] === 'object') parsed = (payload as any[]).map((d) => d.name || d.model || JSON.stringify(d))
      } else if (payload && Array.isArray((payload as any).models)) {
        parsed = (payload as any).models.map((m: any) => (typeof m === 'string' ? m : m.name || m.model))
      } else if (payload && payload.object === 'list' && Array.isArray((payload as any).data)) {
        parsed = (payload as any).data.map((d: any) => d.id || d.name || d.model)
      }

      if (parsed.length === 0) {
        setError('No models found on Ollama')
        setModels([])
        setOllamaModel('')
        setOllamaConnected(false)
      } else {
        setModels(parsed)
        setOllamaModel((prev) => prev || parsed[0])
        setOllamaConnected(true)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Unable to fetch models: ${msg}`)
      setModels([])
      setOllamaModel('')
      setOllamaConnected(false)
    } finally {
      setConnecting(false)
    }
  }

  React.useEffect(() => {
    if (provider === 'ollama') {
      const controller = new AbortController()
      fetchOllamaModels(controller.signal)
      return () => controller.abort()
    }
    setError(null)
    setModels([])
    setOllamaModel('')
    setOllamaConnected(false)
  }, [provider])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost">Settings</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogHeader>
          <h3 className="text-lg font-semibold">Settings</h3>
          <p className="text-sm text-text-tertiary">Configure AI provider and models</p>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium">Provider</label>
            <select className="mt-2 w-full rounded-md border px-3 py-2" value={provider} onChange={(e) => setLocalProvider(e.target.value)}>
              <option value="mock">mock</option>
              <option value="aistudio">aistudio</option>
              <option value="ollama">ollama</option>
              <option value="openai">openai</option>
            </select>
          </div>

          {provider === 'ollama' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Ollama</label>
                <div className={`px-2 py-1 rounded-full text-sm ${ollamaConnected ? 'bg-success text-white' : 'bg-border text-text'}`}>
                  {ollamaConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button onClick={() => (ollamaConnected ? (setOllamaConnected(false), setModels([]), setOllamaModel(''), setError(null)) : fetchOllamaModels())} size="sm">
                    {connecting ? 'Connecting…' : ollamaConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                  <div className="flex-1">
                    <select className="w-full rounded-md border px-3 py-2" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} disabled={!ollamaConnected || models.length === 0}>
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Default prompt</label>
            <Input value={defaultPrompt} onChange={(e) => setDefaultPrompt((e.target as HTMLInputElement).value)} placeholder="e.g. Minimalist Corporate" />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => {
                const settings = {
                  provider,
                  ollamaModel,
                  ollamaConnected,
                  defaultPrompt,
                }
                try {
                  localStorage.setItem('themeAI:settings', JSON.stringify(settings))
                } catch {}
                setGlobalProvider(provider)
              }}
            >
              Save
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
