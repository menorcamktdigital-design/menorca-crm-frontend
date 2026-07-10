"use client";

import LiveDot from "@/components/ui/LiveDot";
import StatsBar from "./StatsBar";
import TabBar from "./TabBar";
import SearchInput from "./SearchInput";
import ContactList from "./ContactList";

export default function Sidebar() {
  return (
    <aside className="flex h-full w-full flex-col border-r border-gray-200 bg-white md:w-[380px] md:shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg">
            🏠
          </span>
          <h1 className="text-lg font-bold text-gray-900">Agente Menorca</h1>
        </div>
        <LiveDot />
      </div>

      <StatsBar />
      <TabBar />
      <SearchInput />
      <ContactList />
    </aside>
  );
}
