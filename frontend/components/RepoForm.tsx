"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ingestRepo } from "@/lib/api";

export function RepoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { repo_id } = await ingestRepo(url);
      const repoName = new URL(url).pathname.replace(/^\/|\/$/g, "");
      router.push(`/chat/${repo_id}?repo=${encodeURIComponent(repoName)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-3.5 text-slate-500">
          <GitHubIcon />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          disabled={loading}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3.5 pl-11 pr-4 text-slate-100 placeholder-slate-600 backdrop-blur-sm transition-colors duration-200 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-400">
          <ErrorIcon />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !url.trim()}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <SpinnerIcon />
            Ingesting repository...
          </>
        ) : (
          <>
            Analyze Repository
            <ArrowRightIcon />
          </>
        )}
      </button>
    </form>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
