"use client";

import { useUIStore } from "@/store/uiStore";

const TABS = [
  { id: "chats", label: "Chats", icon: "💬" },
  { id: "leads", label: "Leads", icon: "👥" },
] as const;

export default function TabBar() {
  const tab = useUIStore((s) => s.tab);
  const setTab = useUIStore((s) => s.setTab);

  return (
    <div className="flex border-b border-gray-200">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            tab === t.id
              ? "border-b-2 border-[#00a884] text-[#00a884]"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <span>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}
