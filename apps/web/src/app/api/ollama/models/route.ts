import { NextResponse } from 'next/server'

export async function GET() {
  const upstream = process.env.OLLAMA_URL || 'http://localhost:11434'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  const candidates = ['/models', '/v1/models', '/api/models', '/models/', '/v1/models/']

  for (const p of candidates) {
    const url = `${upstream.replace(/\/$/, '')}${p.startsWith('/') ? p : `/${p}`}`
    try {
      const perReqController = new AbortController()
      const mergedSignal = perReqController.signal
      // tie to main controller
      const timeoutId = setTimeout(() => perReqController.abort(), 5000)
      const res = await fetch(url, { signal: mergedSignal })
      clearTimeout(timeoutId)
      const text = await res.text()
      if (!res.ok) {
        // if 404 try next candidate
        if (res.status === 404) continue
        try {
          const json = JSON.parse(text)
          return NextResponse.json({ error: json.error || 'Upstream error', upstream: json }, { status: 502 })
        } catch {
          return NextResponse.json({ error: `Upstream error: ${res.status}`, body: text }, { status: 502 })
        }
      }
      try {
        const json = JSON.parse(text)
        return NextResponse.json(json)
      } catch {
        return new NextResponse(text, { status: 200 })
      }
    } catch (err) {
      // on abort or network errors, try next candidate
      const msg = err instanceof Error ? err.message : String(err)
      if (msg && msg.includes('abort')) {
        // timeout; try next
        continue
      }
      // for other errors, return a descriptive message
      return NextResponse.json({ error: `Unable to reach Ollama at ${url}`, detail: msg }, { status: 502 })
    }
  }

  return NextResponse.json({ error: `No reachable Ollama models endpoint found at ${upstream}` }, { status: 502 })
}
