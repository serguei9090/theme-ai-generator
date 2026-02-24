import http from 'http'
import fs from 'fs'
import { routeToProvider, validatePalette } from './llmService'

// Load .env file if present (simple parser, no new deps)
function loadEnv(file = new URL('../.env', import.meta.url).pathname) {
  try {
    if (!fs.existsSync(file)) return
    const txt = fs.readFileSync(file, 'utf8')
    for (const line of txt.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      if (!(key in process.env)) process.env[key] = val
    }
  } catch (e) {
    // ignore
  }
}

loadEnv()

const PORT = process.env.PORT ? Number(process.env.PORT) : 41234
const DEBUG = process.env.DEBUG === 'true'
const CORS_ALLOWED = (process.env.CORS_ALLOWED_ORIGINS || '*').split(',').map((s) => s.trim()).filter(Boolean)

function log(msg: string) {
  if (DEBUG) console.log(`[MCP] ${msg}`)
}

function getAllowedOrigin(reqOrigin?: string | null) {
  if (!CORS_ALLOWED || CORS_ALLOWED.length === 0) return '*'
  if (CORS_ALLOWED.includes('*')) return '*'
  if (reqOrigin && CORS_ALLOWED.includes(reqOrigin)) return reqOrigin
  return null
}

function parseJson(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

const server = http.createServer(async (req, res) => {
  const origin = (req.headers && (req.headers.origin as string)) || null
  const allowed = getAllowedOrigin(origin)

  log(`${req.method} ${req.url} from origin: ${origin || '(none)'} -> allowed: ${allowed || 'NO'}`)

  // CORS preflight handling
  if (req.method === 'OPTIONS') {
    const headers: Record<string, string> = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
    }
    if (allowed) headers['Access-Control-Allow-Origin'] = allowed
    log(`OPTIONS response with headers: ${JSON.stringify(headers)}`)
    res.writeHead(204, headers)
    res.end()
    return
  }

  if (req.method === 'POST' && req.url === '/generate') {
    try {
      const body = await parseJson(req)
      const mood = body.mood || 'modern'
      const provider = body.provider || 'ollama'

      // Validate inputs
      if (typeof mood !== 'string' || typeof provider !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'mood and provider must be strings' }))
        return
      }

      const palette = await routeToProvider(provider as any, mood)

      // Validate output
      if (!validatePalette(palette)) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (allowed) headers['Access-Control-Allow-Origin'] = allowed
        res.writeHead(500, headers)
        res.end(JSON.stringify({ error: 'generated palette is invalid' }))
        return
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (allowed) headers['Access-Control-Allow-Origin'] = allowed
      res.writeHead(200, headers)
      res.end(JSON.stringify(palette))
    } catch (err: any) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (allowed) headers['Access-Control-Allow-Origin'] = allowed
      res.writeHead(400, headers)
      res.end(JSON.stringify({ error: err.message || 'invalid request' }))
    }
    return
  }

  // default 404 with optional CORS
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (allowed) headers['Access-Control-Allow-Origin'] = allowed
  res.writeHead(404, headers)
  res.end(JSON.stringify({ error: 'not found' }))
})

server.on('error', (err: any) => {
  if (err && err.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`Failed to start server. Port ${PORT} is already in use.`)
    process.exit(1)
  }
  throw err
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MCP server listening on http://localhost:${PORT}`)
  console.log(`CORS allowed origins: ${CORS_ALLOWED.join(', ')}`)
  if (DEBUG) console.log(`[MCP] DEBUG mode enabled`)
})
