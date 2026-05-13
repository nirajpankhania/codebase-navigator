"use client";

import { useState, useRef, useEffect } from "react";
import { sendMessage } from "@/lib/api";
import type { ChatResponse } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
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
      const response: ChatResponse = await sendMessage(question, repoId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
          <BotSmallIcon />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-slate-700 text-slate-100"
            : "rounded-bl-sm border border-slate-700/50 bg-slate-800/70 text-slate-200"
        }`}
      >
        <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
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
