import Link from "next/link";
import { ChatPageContent } from "@/components/ChatPageContent";
import { IngestionGate } from "@/components/IngestionGate";

interface PageProps {
  params: { repoId: string };
  searchParams: { repo?: string };
}

export default function ChatPage({ params, searchParams }: PageProps) {
  const repoLabel = searchParams.repo ?? params.repoId;

  return (
    <div className="flex h-screen flex-col bg-[#d8d3be] text-[#d8d3be]">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-4 border-b border-white/8 bg-[#26211a] px-5 py-3">
        <Link
          href="/"
          className="flex items-center justify-center border border-white/15 p-1.5 text-[#7a7560] transition-colors duration-200 hover:border-white/30 hover:text-[#d8d3be]"
        >
          <BackIcon />
        </Link>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-white/15 font-mono text-[9px] text-[#d8d3be]/60">
            ◆
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#d8d3be]">
            Codebase Navigator
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 border border-white/10 bg-black/20 px-3 py-1.5">
          <span className="animate-nier-pulse inline-block h-1.5 w-1.5 bg-[#d8d3be]/60" />
          <code className="max-w-[240px] truncate font-mono text-[11px] text-[#d8d3be]/50">
            {repoLabel}
          </code>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <IngestionGate repoId={params.repoId}>
          <ChatPageContent repoId={params.repoId} />
        </IngestionGate>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
