"use client";

import { SessionProvider } from "next-auth/react";
import type React from "react";
import { Toaster } from "sonner";
import { ChatProvider } from "./chatContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ChatProvider>
        {children}
        <Toaster richColors position="top-right" />
      </ChatProvider>
    </SessionProvider>
  );
}
