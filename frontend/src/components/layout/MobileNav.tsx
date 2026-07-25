import Link from "next/link";

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 md:hidden border-t border-outline-variant bg-surface shadow-lg flex justify-around items-center h-16 px-2">
      <Link
        href="/dashboard"
        className="flex flex-col items-center justify-center text-on-surface-variant font-label-md hover:bg-surface-variant p-2 rounded-xl transition-all"
      >
        <span className="material-symbols-outlined">home</span>
        <span className="text-[10px]">Home</span>
      </Link>
      <Link
        href="/chat"
        className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-2xl px-4 py-1 font-label-md transition-transform active:scale-95"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          chat_bubble
        </span>
        <span className="text-[10px]">Chat</span>
      </Link>
      <Link
        href="/history"
        className="flex flex-col items-center justify-center text-on-surface-variant font-label-md hover:bg-surface-variant p-2 rounded-xl transition-all"
      >
        <span className="material-symbols-outlined">history</span>
        <span className="text-[10px]">History</span>
      </Link>
      <Link
        href="/settings"
        className="flex flex-col items-center justify-center text-on-surface-variant font-label-md hover:bg-surface-variant p-2 rounded-xl transition-all"
      >
        <span className="material-symbols-outlined">settings</span>
        <span className="text-[10px]">Settings</span>
      </Link>
    </nav>
  );
}
