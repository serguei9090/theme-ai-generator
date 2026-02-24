"use client"
import React from 'react'
import ChatSidebar from '../components/organisms/ChatSidebar'
import ThemeProvider from '../components/ThemeProvider'
import WebsiteMockup from '../components/mockups/WebsiteMockup'
import WebAppMockup from '../components/mockups/WebAppMockup'
import MobileAppMockup from '../components/mockups/MobileAppMockup'
import DesktopAppMockup from '../components/mockups/DesktopAppMockup'

export default function Home() {
  const defaultPalette = { primary: '#0969da', secondary: '#6366f1', accent: '#0ea5e9', background: '#ffffff', text: '#24292f' }

  return (
    <div className="flex min-h-screen bg-background">
      <ChatSidebar />
      <main className="flex-1 p-8 bg-surface overflow-auto">
        <ThemeProvider palette={defaultPalette}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text">Color Palette Mockups</h1>
            <p className="text-text-secondary mt-2">Preview how generated palettes look across different UI components</p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-lg bg-white p-4 border border-border shadow-sm">
              <h2 className="text-sm font-semibold text-text mb-3">Website</h2>
              <WebsiteMockup />
            </div>
            <div className="rounded-lg bg-white p-4 border border-border shadow-sm">
              <h2 className="text-sm font-semibold text-text mb-3">Web App</h2>
              <WebAppMockup />
            </div>
            <div className="rounded-lg bg-white p-4 border border-border shadow-sm">
              <h2 className="text-sm font-semibold text-text mb-3">Mobile App</h2>
              <MobileAppMockup />
            </div>
            <div className="rounded-lg bg-white p-4 border border-border shadow-sm">
              <h2 className="text-sm font-semibold text-text mb-3">Desktop App</h2>
              <DesktopAppMockup />
            </div>
          </div>
        </ThemeProvider>
      </main>
    </div>
  )
}
