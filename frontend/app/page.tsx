import type { ReactNode } from "react";
import { RepoForm } from "@/components/RepoForm";
import { ParticleCanvas } from "@/components/ParticleCanvas";
import { NierCorners } from "@/components/NierCorners";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-[#d8d3be] text-[#1c1a14]">
      <ParticleCanvas />

      {/* Hero */}
      <section className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 pb-16 pt-20 text-center">

        {/* Badge */}
        <div className="relative mb-8 inline-flex items-center gap-2.5 border border-[#8a8575] bg-[#c0bba6] px-5 py-1.5">
          <NierCorners accent="rgba(138,133,117,0.55)" size={6} />
          <span className="animate-nier-pulse inline-block h-[7px] w-[7px] shrink-0 bg-[#1c1a14]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5a5545]">
            NEURAL SCAN INTERFACE
          </span>
          <span className="animate-nier-pulse inline-block h-[7px] w-[7px] shrink-0 bg-[#1c1a14]" style={{ animationDelay: "0.7s" }} />
        </div>

        {/* Title */}
        <div className="mb-6 select-none">
          <div className="font-mono text-[10px] uppercase tracking-[0.42em] text-[#8a8575]">
            SYSTEM // CODEBASE
          </div>
          <h1 className="mt-1 font-sans text-6xl font-bold leading-none tracking-tight text-[#1c1a14] sm:text-7xl lg:text-8xl">
            NAVIGATOR
          </h1>
        </div>

        <p className="mb-10 max-w-[400px] font-mono text-[11px] leading-[2] uppercase tracking-[0.05em] text-[#5a5545]">
          PASTE A GITHUB URL. WE FETCH, CHUNK AND EMBED<br/>
          THE ENTIRE REPO — THEN YOU QUERY IT IN PLAIN LANGUAGE.
        </p>

        <div className="w-full max-w-[480px]">
          <RepoForm />
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-20 border-t border-[#8a8575] bg-[#c0bba6] px-4 py-[72px]"
               style={{ backgroundImage: "linear-gradient(45deg,rgba(0,0,0,.02) 1px,transparent 1px),linear-gradient(-45deg,rgba(0,0,0,.02) 1px,transparent 1px)", backgroundSize: "24px 24px" }}>
        <div className="mx-auto max-w-[820px]">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-2 flex items-center justify-center gap-2.5 font-mono text-[9px] uppercase tracking-[0.32em] text-[#8a8575]">
              <span className="h-px w-9 bg-[#8a8575] opacity-70" />
              PROTOCOL
              <span className="h-px w-9 bg-[#8a8575] opacity-70" />
            </div>
            <div className="font-mono text-[13px] uppercase tracking-[0.18em] text-[#1c1a14]">
              HOW IT WORKS
            </div>
          </div>

          {/* Geo divider */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-px flex-1 bg-[#8a8575]" />
            <div className="h-[7px] w-[7px] rotate-45 bg-[#8a8575]" />
            <div className="h-px flex-1 bg-[#8a8575]" />
          </div>

          {/* List cards */}
          <div className="flex flex-col gap-1.5">
            <StepCard step="01" title="SMART INGESTION" selected={false} icon={<DownloadIcon />}>
              Fetches every source file from GitHub and splits it into meaningful overlapping chunks using tiktoken.
            </StepCard>
            <StepCard step="02" title="VECTOR EMBEDDINGS" selected icon={<EmbedIcon />}>
              Embeds each chunk with <Mono>text-embedding-3-small</Mono> and stores vectors in Supabase pgvector.
            </StepCard>
            <StepCard step="03" title="RAG QUERY" selected={false} icon={<ChatIcon />}>
              Retrieves the most relevant context at query time and answers with <Mono>gpt-4o-mini</Mono>.
            </StepCard>
          </div>
        </div>
      </section>
    </main>
  );
}

function StepCard({
  step, title, selected, icon, children,
}: {
  step: string;
  title: string;
  selected: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`relative flex items-stretch border transition-colors duration-150 ${
      selected
        ? "border-[#26211a] bg-[#26211a]"
        : "border-[#8a8575] bg-[#ccc7b2] hover:bg-[#c0bba6]"
    }`}>
      <NierCorners accent={selected ? "rgba(200,168,75,0.35)" : "rgba(138,133,117,0.55)"} size={8} />

      {/* Step column */}
      <div className={`flex w-16 shrink-0 flex-col items-center justify-center gap-1.5 border-r py-[18px] ${
        selected ? "border-white/10" : "border-[#8a8575]"
      }`}>
        <span className={`inline-block h-[7px] w-[7px] ${selected ? "bg-[#d8d3be]" : "border border-[#8a8575]"}`} />
        <span className={`font-mono text-lg font-semibold leading-none ${selected ? "text-[#d8d3be]" : "text-[#5a5545]"}`}>
          {step}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4">
        <div className={`mb-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] ${selected ? "text-[#d8d3be]" : "text-[#1c1a14]"}`}>
          {icon}
          {title}
        </div>
        <div className={`font-sans text-[12px] leading-[1.7] ${selected ? "text-[#d8d3be]/65" : "text-[#5a5545]"}`}>
          {children}
        </div>
      </div>

      {/* Icon column */}
      <div className={`flex w-14 shrink-0 items-center justify-center border-l ${
        selected ? "border-white/10 text-[#d8d3be]" : "border-[#8a8575] text-[#8a8575]"
      }`}>
        {icon}
      </div>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="border border-[#8a8575]/40 bg-[#b4af9a] px-[5px] py-[1px] font-mono text-[10px]">
      {children}
    </code>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EmbedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
