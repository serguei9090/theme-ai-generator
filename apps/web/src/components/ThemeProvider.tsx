import React from 'react'
import type { Palette } from '../lib/mcpClient'

type Props = {
  children: React.ReactNode
  palette: Palette
}

export function ThemeProvider({ children, palette }: Props) {
  React.useEffect(() => {
    if (!palette) return
    const root = document.documentElement
    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-secondary', palette.secondary)
    root.style.setProperty('--color-accent', palette.accent)
    root.style.setProperty('--color-background', palette.background)
    root.style.setProperty('--color-text', palette.text)
  }, [palette])

  return <>{children}</>
}

export default ThemeProvider
