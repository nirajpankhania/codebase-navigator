"use client";

import { useEffect, useState, useCallback } from "react";
import { getIngestionStatus } from "@/lib/api";

interface IngestionGateProps {
  repoId: string;
  children: React.ReactNode;
}

type Phase = "pending" | "fetching" | "embedding" | "storing" | "done" | "ready" | "error";

const PHASE_ORDER: Phase[] = ["pending", "fetching", "embedding", "storing", "done"];

function phaseIndex(phase: Phase): number {
  return PHASE_ORDER.indexOf(phase);
}

export function IngestionGate({ repoId, children }: IngestionGateProps) {
  const [status, setStatus] = useState<Phase>("pending");
  const [message, setMessage] = useState("Starting ingestion...");
  const [ready, setReady] = useState(false);

  const poll = useCallback(async () => {
    try {
      const res = await getIngestionStatus(repoId);
      const phase = res.status as Phase;
      setStatus(phase);
      setMessage(res.message);
      if (phase === "done" || phase === "ready") {
        setReady(true);
      }
    } catch {
      // If status endpoint errors, assume ready (e.g. old repo from prev session)
      setReady(true);
    }
  }, [repoId]);

  useEffect(() => {
    poll();
    const interval = setInterval(async () => {
      try {
        const res = await getIngestionStatus(repoId);
        const phase = res.status as Phase;
        setStatus(phase);
        setMessage(res.message);
        if (phase === "done" || phase === "ready") {
          setReady(true);
          clearInterval(interval);
        } else if (phase === "error") {
          clearInterval(interval);
        }
      } catch {
        setReady(true);
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [repoId, poll]);

  if (ready) return <>{children}</>;

  if (status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <ErrorIcon />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-200">Ingestion failed</h2>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>
        </div>
        <a
          href="/"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          Try another repo
        </a>
      </div>
    );
  }

  const currentIndex = phaseIndex(status);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
        <SpinnerIcon />
      </div>

      <div className="text-center">
        <h2 className="text-base font-semibold text-slate-200">Indexing repository</h2>
        <p className="mt-1 text-sm text-slate-400">{message}</p>
      </div>

      <div className="flex items-center gap-2">
        {PHASE_ORDER.slice(0, -1).map((phase, i) => (
          <div key={phase} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300 ${
                i < currentIndex
                  ? "bg-violet-600 text-white"
                  : i === currentIndex
                  ? "border-2 border-violet-500 bg-violet-500/10 text-violet-400"
                  : "border border-slate-700 bg-slate-900 text-slate-600"
              }`}
            >
              {i < currentIndex ? <CheckIcon /> : i + 1}
            </div>
            {i < PHASE_ORDER.length - 2 && (
              <div
                className={`h-px w-8 transition-colors duration-300 ${
                  i < currentIndex - 1 ? "bg-violet-600" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600">This usually takes 20–60 seconds</p>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
