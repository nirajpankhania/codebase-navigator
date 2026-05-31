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
      <div className="flex shrink-0 border-b border-[#c8a84b]/20 bg-[#26211a] px-4">
        <Tab active={active === "chat"} onClick={() => setActive("chat")}>
          <ChatIcon />
          QUERY INTERFACE
        </Tab>
        <Tab active={active === "graph"} onClick={() => setActive("graph")}>
          <GraphIcon />
          STRUCTURE MAP
        </Tab>
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

function Tab({
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
      className={`flex items-center gap-1.5 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors duration-150 ${
        active
          ? "border-b-2 border-[#c8a84b] text-[#c8a84b]"
          : "text-[#7a7560] hover:text-[#a89a7a]"
      }`}
    >
      {children}
    </button>
  );
}

function ChatIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
