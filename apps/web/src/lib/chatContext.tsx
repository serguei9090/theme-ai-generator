"use client"
import React from 'react'
import type { Palette } from '../lib/mcpClient'
import { generatePalette } from '../lib/mcpClient'

type Message = { id: string; role: 'user' | 'assistant'; text: string; palette?: Palette }

type ChatContextType = {
  provider: string
  setProvider: (p: string) => void
  messages: Message[]
  sendMessage: (text: string) => Promise<void>
  newChat: () => void
}

const ChatContext = React.createContext<ChatContextType | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = React.useState('ollama')
  const [messages, setMessages] = React.useState<Message[]>([])

  async function sendMessage(text: string) {
    const id = String(Date.now())
    const userMsg: Message = { id: id + '-u', role: 'user', text }
    setMessages((s) => [...s, userMsg])

    try {
      const palette = await generatePalette(text, provider)
      const assistant: Message = { id: id + '-a', role: 'assistant', text: JSON.stringify(palette, null, 2), palette }
      setMessages((s) => [...s, assistant])
    } catch (err) {
      const assistant: Message = { id: id + '-a', role: 'assistant', text: 'Error generating palette' }
      setMessages((s) => [...s, assistant])
    }
  }

  function newChat() {
    setMessages([])
  }

  return (
    <ChatContext.Provider value={{ provider, setProvider, messages, sendMessage, newChat }}>{children}</ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = React.useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside ChatProvider')
  return ctx
}
