"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { RepoGraph } from "@/components/RepoGraph";

interface ChatPageContentProps {
  repoId: string;
}

type Tab = "chat" | "graph";

export function ChatPageContent({ repoId }: ChatPageContentProps) {
  const [active, setActive] = useState<Tab>("chat");

  return (
    <div className="flex h-full flex-col bg-[#d8d3be]">
      {/* Tab bar */}
      <div className="flex shrink-0 border-b border-[#8a8575]/40 bg-[#d8d3be]">
        <TabBtn active={active === "chat"} onClick={() => setActive("chat")}>
          QUERY INTERFACE
        </TabBtn>
        <TabBtn active={active === "graph"} onClick={() => setActive("graph")}>
          STRUCTURE MAP
        </TabBtn>
      </div>

      <div className="min-h-0 flex-1">
        {active === "chat" ? (
          <ChatInterface repoId={repoId} />
        ) : (
          <RepoGraph repoId={repoId} />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors duration-150 ${
        active
          ? "bg-[#26211a] text-[#d8d3be]"
          : "text-[#5a5545] hover:text-[#1c1a14]"
      }`}
    >
      <span
        className={`inline-block h-[6px] w-[6px] shrink-0 ${
          active ? "bg-[#d8d3be]" : "border border-[#8a8575]"
        }`}
      />
      {children}
    </button>
  );
}
