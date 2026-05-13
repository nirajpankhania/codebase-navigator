import type { ReactNode } from "react";
import { RepoForm } from "@/components/RepoForm";
import { ParticleCanvas } from "@/components/ParticleCanvas";

export default function HomePage() {
  return (
    <main className="relative bg-slate-950 text-slate-50 overflow-hidden">
      <ParticleCanvas />

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
        <div className="absolute -top-32 -right-20 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] rounded-full bg-violet-900/10 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-16 text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
          AI-Powered Codebase Chat
        </div>

        <h1 className="max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-50 leading-[1.1]">
          Understand any{" "}
          <span className="text-violet-400">codebase</span>
          <br />instantly
        </h1>

        <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
          Paste a GitHub URL. We fetch, chunk, and embed the entire repo so you
          can ask questions, trace logic, and explore code — in plain English.
        </p>

        <div className="mt-10 w-full max-w-xl">
          <RepoForm />
        </div>

        <p className="mt-4 text-xs text-slate-600">
          Works with any public GitHub repository
        </p>
      </section>

      {/* Features */}
      <section className="relative z-20 border-t border-slate-800 bg-slate-900/60 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold text-slate-100">How it works</h2>
            <p className="mt-2 text-slate-500">Three steps from URL to conversation</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard
              step="01"
              icon={<DownloadIcon />}
              title="Smart Ingestion"
              description={
                <>
                  Fetches every source file from GitHub and splits it into
                  meaningful, overlapping chunks using tiktoken.
                </>
              }
            />
            <FeatureCard
              step="02"
              icon={<EmbedIcon />}
              title="Vector Embeddings"
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
              title="RAG Chat"
              description={
                <>
                  Retrieves the most relevant context at query time and answers
                  with <Mono>gpt-4o-mini</Mono>.
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
  step,
  icon,
  title,
  description,
}: {
  step: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/70 p-6 transition-all duration-200 hover:border-violet-500/30 hover:bg-slate-900">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-violet-400 transition-colors duration-200 group-hover:bg-violet-500/10">
        {icon}
      </div>
      <div className="mb-2 font-mono text-xs font-medium uppercase tracking-wider text-violet-500/70">
        Step {step}
      </div>
      <h3 className="mb-2 font-semibold text-slate-100">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-slate-800 px-1 font-mono text-xs text-slate-300">
      {children}
    </code>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function EmbedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
