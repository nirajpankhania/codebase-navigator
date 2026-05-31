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
        <div className="relative mb-8 border border-[#8a8575]/50 bg-[#ccc7b2] px-5 py-1.5">
          <NierCorners accent="#5a5545" size={6} />
          <span className="font-mono text-[11px] uppercase tracking-widest text-[#5a5545]">
            <span className="animate-nier-pulse inline-block">◆</span>
            {" "}NEURAL SCAN INTERFACE{" "}
            <span className="animate-nier-pulse inline-block" style={{ animationDelay: "0.6s" }}>◆</span>
          </span>
        </div>

        {/* Title */}
        <div className="mb-6 select-none">
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#8a8575]">
            SYSTEM // CODEBASE
          </div>
          <h1 className="mt-1 font-sans text-6xl font-bold leading-none tracking-tight text-[#1c1a14] sm:text-7xl lg:text-8xl">
            NAVIGATOR
          </h1>
        </div>

        <p className="mb-10 max-w-md font-mono text-[13px] leading-relaxed text-[#5a5545]">
          PASTE A GITHUB URL. WE FETCH, CHUNK, AND EMBED THE ENTIRE
          REPOSITORY SO YOU CAN ASK QUESTIONS IN PLAIN LANGUAGE.
        </p>

        <div className="w-full max-w-xl">
          <RepoForm />
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-20 border-t border-[#8a8575]/30 bg-[#ccc7b2]/60 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 flex flex-col items-center gap-2 text-center">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.4em] text-[#8a8575]">
              ── PROTOCOL ──
            </div>
            <h2 className="font-mono text-lg uppercase tracking-widest text-[#1c1a14]">
              HOW IT WORKS
            </h2>
            <div className="h-px w-24 bg-[#8a8575]/50" />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <FeatureCard
              step="01"
              icon={<DownloadIcon />}
              title="SMART INGESTION"
              description={
                <>
                  Fetches every source file from GitHub and splits it into
                  meaningful overlapping chunks using tiktoken.
                </>
              }
            />
            <FeatureCard
              step="02"
              icon={<EmbedIcon />}
              title="VECTOR EMBEDDINGS"
              description={
                <>
                  Embeds each chunk with{" "}
                  <Mono>text-embedding-3-small</Mono> and stores vectors in
                  Supabase pgvector.
                </>
              }
            />
            <FeatureCard
              step="03"
              icon={<ChatIcon />}
              title="RAG QUERY"
              description={
                <>
                  Retrieves the most relevant context at query time and
                  answers with <Mono>gpt-4o-mini</Mono>.
                </>
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  step, icon, title, description,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="group relative border border-[#8a8575]/40 bg-[#d0cbb6] p-6 transition-colors duration-200 hover:border-[#5a5545]/60">
      <NierCorners accent="#5a554580" size={8} />

      <div className="mb-4 inline-flex h-9 w-9 items-center justify-center border border-[#8a8575]/50 bg-[#ccc7b2] text-[#1c1a14] transition-colors duration-200 group-hover:border-[#5a5545]/70">
        {icon}
      </div>

      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#8a8575]">
        STEP {step}
      </div>
      <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-[#1c1a14]">{title}</h3>
      <p className="font-mono text-[11px] leading-relaxed text-[#5a5545]">{description}</p>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="border border-[#8a8575]/40 bg-[#ccc7b2] px-1.5 py-0.5 font-mono text-[10px] text-[#1c1a14]">
      {children}
    </code>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EmbedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
