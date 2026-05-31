"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ingestRepo } from "@/lib/api";

export function RepoForm() {
  const router = useRouter();
  const [url, setUrl]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setWarmingUp(false);
    const warmup = setTimeout(() => setWarmingUp(true), 8000);
    try {
      const { repo_id } = await ingestRepo(url);
      clearTimeout(warmup);
      const repoName = new URL(url).pathname.replace(/^\/|\/$/g, "");
      router.push(`/chat/${repo_id}?repo=${encodeURIComponent(repoName)}`);
    } catch (err) {
      clearTimeout(warmup);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setWarmingUp(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      {/* Input */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3.5 text-[#5a5545]">
          <GitHubIcon />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          disabled={loading}
          className="w-full border border-[#8a8575] bg-[#ccc7b2] py-3.5 pl-11 pr-4 font-mono text-sm text-[#1c1a14] placeholder-[#8a8575] transition-colors duration-200 [border-left:3px_solid_#1c1a14] focus:border-[#5a5545] focus:outline-none focus:ring-1 focus:ring-[#5a5545]/20 disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-[#c84848]/30 bg-[#c84848]/5 px-3 py-2 font-mono text-xs text-[#c84848]">
          <span>!</span>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="group relative flex w-full items-center justify-center gap-2 border border-[#1c1a14] bg-[#26211a] py-3.5 font-mono text-sm uppercase tracking-widest text-[#d8d3be] transition-all duration-200 hover:bg-[#3a3428] focus:outline-none focus:ring-1 focus:ring-[#5a5545]/30 disabled:cursor-not-allowed disabled:border-[#8a8575]/40 disabled:bg-[#ccc7b2] disabled:text-[#8a8575]"
      >
        {loading ? (
          <>
            <SpinnerIcon />
            {warmingUp ? "WAKING SERVER..." : "INITIALIZING..."}
          </>
        ) : (
          <>
            ▶&nbsp; INITIALIZE ANALYSIS
          </>
        )}
      </button>

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-[#8a8575]">
        PUBLIC GITHUB REPOSITORIES ONLY
      </p>
    </form>
  );
}

function GitHubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
