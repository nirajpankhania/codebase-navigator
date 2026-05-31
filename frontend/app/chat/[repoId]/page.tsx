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
    <div className="flex h-screen flex-col bg-[#d8d3be] text-[#e8e4d0]">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-4 border-b border-[#c8a84b]/20 bg-[#26211a] px-5 py-3">
        <Link
          href="/"
          className="flex items-center justify-center border border-[#c8a84b]/20 p-1.5 text-[#7a7560] transition-colors duration-200 hover:border-[#c8a84b]/40 hover:text-[#c8a84b]"
        >
          <BackIcon />
        </Link>

        <div className="h-4 w-px bg-[#2e2b1e]" />

        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center border border-[#c8a84b]/30 bg-[#c8a84b]/5 font-mono text-[9px] text-[#c8a84b]">
            ◆
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#e8e4d0]">
            Codebase Navigator
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2 border border-[#c8a84b]/20 bg-[#1a1610] px-3 py-1.5">
          <span className="animate-nier-pulse h-1.5 w-1.5 bg-[#c8a84b]" />
          <code className="max-w-[240px] truncate font-mono text-[11px] text-[#7a7560]">
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
