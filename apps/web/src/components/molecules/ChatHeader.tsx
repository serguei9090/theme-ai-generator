"use client"
import React from 'react'
import { Button, Popover, PopoverTrigger, PopoverContent } from '../atoms'
import SettingsDialog from '../organisms/SettingsDialog'
import { useChat } from '@/lib/chatContext'

export default function ChatHeader() {
  const { newChat } = useChat()

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
      <div>
        <h3 className="text-sm font-semibold text-text">AI Theme Chat</h3>
        <p className="text-xs text-text-tertiary mt-0.5">Generate beautiful color palettes</p>
      </div>
      <SettingsDialog />
      <Button variant="ghost" onClick={newChat}>
        New
      </Button>
    </div>
  )
}
