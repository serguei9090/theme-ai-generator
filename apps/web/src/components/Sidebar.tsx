"use client"
import React from 'react'
import { generatePalette } from '../lib/mcpClient'
import { Button } from './ui/button'
import { Input } from './ui/input'

export default function Sidebar({ onPalette }: { onPalette: (p: any) => void }) {
  const [mood, setMood] = React.useState('Minimalist Corporate')
  const [provider, setProvider] = React.useState('mock')
  const [loading, setLoading] = React.useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const palette = await generatePalette(mood, provider)
      onPalette(palette)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="w-80 border-r px-4 py-6">
      <h2 className="text-lg font-semibold mb-3">Theme Generator</h2>
      <label className="block text-sm mb-1">AI Provider</label>
      <select className="w-full mb-3" value={provider} onChange={(e) => setProvider(e.target.value)}>
        <option value="mock">mock</option>
        <option value="google">google</option>
        <option value="ollama">ollama</option>
        <option value="openai">openai</option>
      </select>

      <label className="block text-sm mb-1">Mood</label>
      <Input className="mb-3" value={mood} onChange={(e) => setMood((e.target as HTMLInputElement).value)} />

      <div className="flex gap-2 mb-4">
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating…' : 'Generate'}
        </Button>
        <Button variant="outline" onClick={() => setMood('Cyberpunk')}>
          Cyberpunk
        </Button>
        <Button variant="ghost" onClick={() => setMood('Minimalist Corporate')}>
          Minimalist
        </Button>
      </div>

      <div className="mt-4 text-sm text-zinc-600">Note: provider adapters are stubs; use `mock` locally.</div>
    </aside>
  )
}
