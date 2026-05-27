import Link from "next/link";
import { ChatInterface } from "@/components/ChatInterface";

interface PageProps {
  params: { repoId: string };
  searchParams: { repo?: string };
}

export default function ChatPage({ params, searchParams }: PageProps) {
  const repoLabel = searchParams.repo ?? params.repoId;
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-50">
      <header className="flex shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-950/80 px-5 py-3.5 backdrop-blur-sm">
        <Link
          href="/"
          className="flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-200"
        >
          <BackIcon />
        </Link>

        <div className="h-5 w-px bg-slate-800" />

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
            <BotIcon />
          </div>
          <span className="font-medium text-slate-100">Codebase Navigator</span>
        </div>

        <div className="ml-auto flex items-center gap-2 rounded-md border border-slate-700/60 bg-slate-900 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <code className="max-w-[240px] truncate font-mono text-xs text-slate-400">
            {repoLabel}
          </code>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatInterface repoId={params.repoId} />
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
    </svg>
  );
}
