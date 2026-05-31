"use client";

import { useEffect, useState, useCallback } from "react";
import { getIngestionStatus } from "@/lib/api";
import { BulletHell } from "@/components/BulletHell";
import { NierCorners } from "@/components/NierCorners";

interface IngestionGateProps {
  repoId: string;
  children: React.ReactNode;
}

type Phase = "pending" | "fetching" | "embedding" | "storing" | "done" | "ready" | "error";

const PHASE_ORDER: Phase[] = ["pending", "fetching", "embedding", "storing", "done"];

const PHASE_LABELS: Record<string, string> = {
  pending:   "PENDING",
  fetching:  "FETCH",
  embedding: "EMBED",
  storing:   "STORE",
};

function phaseIndex(p: Phase) {
  return PHASE_ORDER.indexOf(p);
}

export function IngestionGate({ repoId, children }: IngestionGateProps) {
  const [status, setStatus]   = useState<Phase>("pending");
  const [message, setMessage] = useState("Starting ingestion...");
  const [ready, setReady]     = useState(false);

  const poll = useCallback(async () => {
    try {
      const res   = await getIngestionStatus(repoId);
      const phase = res.status as Phase;
      setStatus(phase);
      setMessage(res.message);
      if (phase === "done" || phase === "ready") setReady(true);
    } catch {
      setReady(true);
    }
  }, [repoId]);

  useEffect(() => {
    poll();
    const iv = setInterval(async () => {
      try {
        const res   = await getIngestionStatus(repoId);
        const phase = res.status as Phase;
        setStatus(phase);
        setMessage(res.message);
        if (phase === "done" || phase === "ready") { setReady(true); clearInterval(iv); }
        else if (phase === "error") clearInterval(iv);
      } catch {
        setReady(true);
        clearInterval(iv);
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [repoId, poll]);

  if (ready) return <>{children}</>;

  if (status === "error") {
    return (
      <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden bg-[#cac6b6] px-4">
        <BulletHell />
        <div className="relative z-10 border border-[#c84848]/40 bg-[#26211a]/90 p-8 text-center backdrop-blur-sm">
          <NierCorners accent="#c84848" size={10} />
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#c84848]">
            ■ SYSTEM ERROR
          </p>
          <h2 className="mb-3 font-mono text-sm text-[#d8d3be]">INGESTION FAILED</h2>
          <p className="mb-6 max-w-sm font-mono text-xs text-[#8a8575]">{message}</p>
          <a
            href="/"
            className="border border-[#8a8575]/40 bg-[#1a1610] px-6 py-2 font-mono text-xs uppercase tracking-widest text-[#8a8575] transition-colors hover:border-[#c8a84b] hover:text-[#c8a84b]"
          >
            ← RETURN
          </a>
        </div>
      </div>
    );
  }

  const ci = phaseIndex(status);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#cac6b6]">
      <BulletHell />

      {/* HUD overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-6">
        <div className="relative border border-[#8a8575]/40 bg-[#26211a]/88 p-4 backdrop-blur-sm sm:p-5">
          <NierCorners accent="#c8a84b" size={10} />

          {/* Status line */}
          <div className="mb-2 flex items-center gap-3">
            <span className="animate-nier-pulse font-mono text-[10px] text-[#c8a84b]">■</span>
            <span className="font-mono text-xs uppercase tracking-widest text-[#e8e4d0]">
              INDEXING REPOSITORY
            </span>
          </div>

          {/* Message */}
          <p className="mb-4 font-mono text-[11px] text-[#8a8575] truncate">{message}</p>

          {/* Phase indicators */}
          <div className="mb-3 flex items-center gap-2">
            {PHASE_ORDER.slice(0, -1).map((phase, i) => (
              <div key={phase} className="flex items-center gap-2">
                <div
                  className={`flex h-5 w-14 items-center justify-center font-mono text-[9px] uppercase tracking-wider transition-colors duration-300 ${
                    i < ci
                      ? "bg-[#c8a84b] text-[#0a0a08]"
                      : i === ci
                      ? "border border-[#c8a84b] text-[#c8a84b]"
                      : "border border-[#2e2b1e] text-[#4a4535]"
                  }`}
                >
                  {i < ci ? "✓" : PHASE_LABELS[phase]}
                </div>
                {i < PHASE_ORDER.length - 2 && (
                  <div
                    className={`h-px w-3 transition-colors duration-500 ${
                      i < ci - 1 ? "bg-[#c8a84b]" : "bg-[#2e2b1e]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <p className="font-mono text-[9px] uppercase tracking-widest text-[#8a8575]">
            MOVE CURSOR TO DODGE · NEURAL SCAN IN PROGRESS
          </p>
        </div>
      </div>
    </div>
  );
}
