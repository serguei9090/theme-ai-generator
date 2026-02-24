export type Provider = 'aistudio' | 'ollama' | 'openai'

export type Palette = {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

const HEX_REGEX = /^#[0-9a-f]{6}$/i

export function validatePalette(obj: any): obj is Palette {
  if (!obj || typeof obj !== 'object') return false
  const keys = ['primary', 'secondary', 'accent', 'background', 'text']
  if (!keys.every((k) => k in obj)) return false
  return keys.every((k) => typeof obj[k] === 'string' && HEX_REGEX.test(obj[k]))
}

export async function routeToProvider(provider: Provider, prompt: string): Promise<Palette> {
  // Validate input
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt cannot be empty')
  }
  if (prompt.length > 1024) {
    throw new Error('Prompt too long (max 1024 characters)')
  }

  // env defaults
  const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
  const OLLAMA_DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || ''
  const OLLAMA_TIMEOUT = Number(process.env.OLLAMA_TIMEOUT || '5000')

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ''
  const OPENAI_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'
  const OPENAI_DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini'
  const OPENAI_TIMEOUT = Number(process.env.OPENAI_TIMEOUT || '8000')

  const AISTUDIO_API_KEY = process.env.AISTUDIO_API_KEY || ''
  const AISTUDIO_URL = process.env.AISTUDIO_API_URL || ''
  const AISTUDIO_DEFAULT_MODEL = process.env.AISTUDIO_DEFAULT_MODEL || ''

  // system prompt instructing strict JSON output
  const systemPrompt = `You are a theme generation assistant for UI/UX and design systems. Given a user's mood or theme, return ONLY a JSON object with the following five 7-character lowercase hex color keys: primary, secondary, accent, background, text. Also include an optional "explain" string describing the mapping. Example output: {"primary":"#112233","secondary":"#445566","accent":"#778899","background":"#ffffff","text":"#000000","explain":"A cool, minimal theme"}. Do not output any other text, code fences, or commentary.`

  // helper: fetch with timeout (Bun/node global fetch ok)
  async function fetchWithTimeout(url: string, opts: any = {}, timeout = 5000) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal })
      clearTimeout(id)
      return res
    } finally {
      clearTimeout(id)
    }
  }

  // parse possible assistant output text into JSON object
  function extractJsonFromText(text: string) {
    const trimmed = text.trim()
    // try direct parse
    try { return JSON.parse(trimmed) } catch {}
    // try to find first { ... }
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = trimmed.slice(start, end + 1)
      try { return JSON.parse(candidate) } catch {}
    }
    return null
  }

  // Ollama adapter
  if (provider === 'ollama') {
    const model = OLLAMA_DEFAULT_MODEL || undefined
    const candidates = ['/api/generate', '/v1/generate', '/generate', '/v1/complete', '/api/completions']
    let lastErr: any = null
    for (const p of candidates) {
      const url = `${OLLAMA_URL.replace(/\/$/, '')}${p}`
      try {
        const body: any = { prompt: `${systemPrompt}\n\n${prompt}` }
        if (model) body.model = model
        const res = await fetchWithTimeout(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }, OLLAMA_TIMEOUT)
        if (!res.ok) {
          // try next candidate on 404
          if (res.status === 404) continue
          const txt = await res.text()
          throw new Error(`Ollama error ${res.status}: ${txt}`)
        }
        const data = await res.json()
        // try to extract text from a few common shapes
        let textOut: string | null = null
        if (typeof data === 'string') textOut = data
        else if (data.result && Array.isArray(data.result) && data.result[0] && data.result[0].content) textOut = data.result[0].content
        else if (data.output && Array.isArray(data.output) && data.output[0] && data.output[0].content) textOut = data.output[0].content
        else if (data.text) textOut = data.text
        else if (data.choices && data.choices[0]) {
          const c = data.choices[0]
          if (c.message && c.message.content) textOut = c.message.content
          else if (c.text) textOut = c.text
        }
        if (!textOut) {
          // fallback: stringify
          textOut = JSON.stringify(data)
        }
        const parsed = extractJsonFromText(textOut)
        if (!parsed) throw new Error(`Unable to parse JSON from Ollama response: ${textOut.slice(0, 400)}`)
        if (!validatePalette(parsed)) throw new Error('Ollama returned invalid palette JSON')
        return parsed as Palette
      } catch (e) {
        lastErr = e
        continue
      }
    }
    throw new Error(`Ollama adapter failed: ${lastErr?.message || String(lastErr)}`)
  }

  // OpenAI adapter
  if (provider === 'openai') {
    if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured in OPENAI_API_KEY')
    const body = {
      model: OPENAI_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
    }
    const res = await fetchWithTimeout(OPENAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify(body),
    }, OPENAI_TIMEOUT)
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`OpenAI error ${res.status}: ${txt}`)
    }
    const data = await res.json()
    // try to extract content
    let content: string | null = null
    if (data.choices && data.choices[0]) {
      const c = data.choices[0]
      if (c.message && c.message.content) content = c.message.content
      else if (c.text) content = c.text
    } else if (data.choices && Array.isArray(data.choices)) {
      content = data.choices.map((c: any) => c.text || (c.message && c.message.content) || '').join('\n')
    }
    if (!content) content = JSON.stringify(data)
    const parsed = extractJsonFromText(content)
    if (!parsed) throw new Error(`Unable to parse JSON from OpenAI response: ${content.slice(0, 400)}`)
    if (!validatePalette(parsed)) throw new Error('OpenAI returned invalid palette JSON')
    return parsed as Palette
  }

  // AIStudio adapter (treated like OpenAI-compatible)
  if (provider === 'aistudio') {
    const url = AISTUDIO_URL || OPENAI_URL
    const key = AISTUDIO_API_KEY || OPENAI_API_KEY
    if (!key) throw new Error('AIStudio/API key not configured')
    const body = {
      model: AISTUDIO_DEFAULT_MODEL || OPENAI_DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
    }
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    }, OPENAI_TIMEOUT)
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`AIStudio error ${res.status}: ${txt}`)
    }
    const data = await res.json()
    let content: string | null = null
    if (data.choices && data.choices[0]) {
      const c = data.choices[0]
      if (c.message && c.message.content) content = c.message.content
      else if (c.text) content = c.text
    } else if (data.choices && Array.isArray(data.choices)) {
      content = data.choices.map((c: any) => c.text || (c.message && c.message.content) || '').join('\n')
    }
    if (!content) content = JSON.stringify(data)
    const parsed = extractJsonFromText(content)
    if (!parsed) throw new Error(`Unable to parse JSON from AIStudio response: ${content.slice(0, 400)}`)
    if (!validatePalette(parsed)) throw new Error('AIStudio returned invalid palette JSON')
    return parsed as Palette
  }

  throw new Error(`LLM provider '${provider}' not implemented`)
}

