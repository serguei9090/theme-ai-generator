"use client"
import React from 'react'
import { useChat } from '../../lib/chatContext'
import { Input, Button } from '../atoms'

export default function ChatWindow() {
  const { messages, sendMessage } = useChat()
  const [value, setValue] = React.useState('')

  async function handleSend() {
    if (!value.trim()) return
    await sendMessage(value.trim())
    setValue('')
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-text-secondary text-sm">Start a conversation to generate themes</p>
              <p className="text-text-tertiary text-xs mt-1">Try: "Minimalist Corporate" or "Cyberpunk"</p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-lg px-4 py-2.5 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-surface text-text border border-border'}`}>
              <pre className="whitespace-pre-wrap text-sm font-sans">{m.text}</pre>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border p-4 bg-white">
        <div className="flex gap-2">
          <Input 
            value={value} 
            onChange={(e) => setValue((e.target as HTMLInputElement).value)} 
            placeholder="Ask for a mood or theme..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSend()
                e.preventDefault()
              }
            }}
          />
          <Button onClick={handleSend} size="sm">Send</Button>
        </div>
      </div>
    </div>
  )
}
