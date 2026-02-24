"use client"
import React from 'react'
import ChatHeader from '../molecules/ChatHeader'
import ChatWindow from '../molecules/ChatWindow'
import { ChatProvider, useChat } from '../../lib/chatContext'

function SidebarContent() {
  const { provider, setProvider } = useChat()
  return (
    <div className="flex h-full flex-col">
      <ChatHeader provider={provider} setProvider={setProvider} />
      <div className="flex-1">
        <ChatWindow />
      </div>
    </div>
  )
}

export default function ChatSidebar() {
  return (
    <aside className="w-96 border-r bg-white">
      <ChatProvider>
        <SidebarContent />
      </ChatProvider>
    </aside>
  )
}
