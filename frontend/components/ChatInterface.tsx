"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "@/lib/api";
import type { Source } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface ChatInterfaceProps {
  repoId: string;
}

const SUGGESTIONS = [
  "What does this repo do?",
  "What are the main entry points?",
  "How is auth handled?",
];

export function ChatInterface({ repoId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const response = await sendMessage(question, repoId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer, sources: response.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.length === 0 ? (
          <EmptyState onSuggest={setInput} />
        ) : (
          messages.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}
        {loading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-slate-800 bg-slate-950/80 p-4 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this codebase..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-600 transition-colors duration-200 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-slate-700">
          Powered by GPT-4o-mini + text-embedding-3-small
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  const uniqueSources = message.sources
    ? Array.from(new Map(message.sources.map((s) => [s.file_path, s])).values())
    : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
          <BotSmallIcon />
        </div>
      )}
      <div className="flex max-w-[80%] flex-col gap-2">
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-slate-700 text-slate-100"
              : "rounded-bl-sm border border-slate-700/50 bg-slate-800/70 text-slate-200"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                code: ({ className, children, ...props }) => {
                  const isBlock = className?.includes("language-");
                  return isBlock ? (
                    <code className="block overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-300 my-2" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs text-violet-300" {...props}>
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
                h1: ({ children }) => <h1 className="mb-2 text-base font-semibold text-slate-100">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-2 text-sm font-semibold text-slate-100">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-1 text-sm font-medium text-slate-200">{children}</h3>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {uniqueSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {uniqueSources.map((source) => (
              <span
                key={source.file_path}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700/60 bg-slate-900 px-2 py-0.5 font-mono text-xs text-slate-500"
              >
                <FileIcon />
                {source.file_path}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-violet-400">
        <CodeIcon />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-200">
        Ready to explore
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">
        Ask anything about this repository — architecture, functions,
        dependencies, or how specific code works.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="cursor-pointer rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-500 transition-colors duration-150 hover:border-violet-500/30 hover:text-slate-300"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
        <BotSmallIcon />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-700/50 bg-slate-800/70 px-4 py-4">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-thinking-1" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-thinking-2" />
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-thinking-3" />
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function BotSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
    </svg>
  );
}
