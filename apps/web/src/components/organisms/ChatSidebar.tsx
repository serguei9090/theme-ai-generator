"use client";
import ChatHeader from "../molecules/ChatHeader";
import ChatWindow from "../molecules/ChatWindow";

function SidebarContent({ onClose }: Readonly<{ onClose?: () => void }>) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader onClose={onClose} />
      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  );
}

type ChatSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChatSidebar({
  isOpen,
  onClose,
}: Readonly<ChatSidebarProps>) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 w-full h-full bg-black/20 backdrop-blur-sm lg:hidden transition-opacity border-none cursor-default"
          onClick={onClose}
          aria-label="Close Chat"
        />
      )}

      <aside
        className={`fixed inset-x-0 bottom-0 z-[70] flex flex-col bg-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:inset-auto lg:h-screen lg:w-96 lg:translate-y-0 lg:border-r ${
          isOpen
            ? "translate-y-0 h-[80dvh]"
            : "translate-y-full h-0 lg:h-screen"
        } rounded-t-3xl border-t lg:rounded-none lg:border-t-0 shadow-2xl`}
      >
        {/* Mobile Pull Tab */}
        <div className="flex w-full items-center justify-center p-3 lg:hidden">
          <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>

        <div className="flex h-full min-h-0 flex-col px-1 lg:px-0">
          <SidebarContent onClose={onClose} />
        </div>
      </aside>
    </>
  );
}
