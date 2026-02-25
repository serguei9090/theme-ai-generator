"use client";
import ChatHeader from "../molecules/ChatHeader";
import ChatWindow from "../molecules/ChatWindow";

function SidebarContent() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader />
      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  );
}

export default function ChatSidebar() {
  return (
    <aside className="w-full h-[50dvh] lg:h-screen border-b bg-white lg:sticky lg:top-0 lg:w-[24rem] lg:min-w-[24rem] lg:flex-none lg:border-b-0 lg:border-r">
      <SidebarContent />
    </aside>
  );
}
