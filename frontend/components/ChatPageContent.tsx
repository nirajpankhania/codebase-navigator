"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { RepoGraph } from "@/components/RepoGraph";

interface ChatPageContentProps {
  repoId: string;
}

type Tab = "chat" | "graph";

export function ChatPageContent({ repoId }: ChatPageContentProps) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 gap-1 border-b border-slate-800 bg-slate-950 px-5 pt-2">
        <TabButton active={activeTab === "chat"} onClick={() => setActiveTab("chat")}>
          <ChatIcon />
          Chat
        </TabButton>
        <TabButton active={activeTab === "graph"} onClick={() => setActiveTab("graph")}>
          <GraphIcon />
          Architecture
        </TabButton>
      </div>

      <div className="min-h-0 flex-1">
        {activeTab === "chat" ? (
          <ChatInterface repoId={repoId} />
        ) : (
          <RepoGraph repoId={repoId} />
        )}
      </div>
    </div>
  );
}

function TabButton({
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
      className={`flex items-center gap-1.5 rounded-t-md px-4 py-2 text-sm font-medium transition-colors duration-150 ${
        active
          ? "border-b-2 border-violet-500 text-violet-300"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
