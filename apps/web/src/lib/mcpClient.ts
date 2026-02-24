export type Palette = {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  explain?: string
}

export async function generatePalette(mood: string, provider = 'ollama'): Promise<Palette> {
  const res = await fetch('http://localhost:41234/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, provider }),
  })
  if (!res.ok) throw new Error('Failed to fetch palette')
  return res.json()
}
