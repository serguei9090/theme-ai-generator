import fs from 'fs/promises'
import http from 'http'

async function fetchPalette(mood: string, provider = 'mock') {
  const data = JSON.stringify({ mood, provider })
  return new Promise<any>((resolve, reject) => {
    const req = http.request(
      'http://localhost:41234/generate',
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => resolve(JSON.parse(body)))
      }
    )
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function injectIntoTailwindConfig(palette: any, filePath = './tailwind.config.ts') {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    // Very small heuristic replace: look for a `colors: {` block and replace between braces.
    const replaced = content.replace(/colors:\s*\{[\s\S]*?\}/m, `colors: ${JSON.stringify(palette)}`)
    await fs.writeFile(filePath, replaced, 'utf8')
    console.log('Updated', filePath)
  } catch (err: any) {
    console.error('Failed to patch tailwind config:', err.message)
  }
}

async function main() {
  const mood = process.argv[2] || 'Minimalist Corporate'
  console.log('Fetching palette for:', mood)
  const palette = await fetchPalette(mood, 'mock')
  console.log('Palette:', palette)
  // Optionally inject into tailwind.config.ts (disabled by default)
  // await injectIntoTailwindConfig(palette)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
