"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendMessage } from "@/lib/api";
import type { Source } from "@/lib/api";
import { NierCorners } from "@/components/NierCorners";

interface Message {
  id: number;
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

let _msgId = 0;

export function ChatInterface({ repoId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { id: _msgId++, role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await sendMessage(q, repoId);
      setMessages((prev) => [
        ...prev,
        { id: _msgId++, role: "assistant", content: res.answer, sources: res.sources },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: _msgId++, role: "assistant", content: err instanceof Error ? err.message : "Request failed." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) handleSubmit(e);
  }

  return (
    <div className="flex h-full flex-col bg-[#d8d3be]">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.length === 0 ? (
          <EmptyState onSuggest={setInput} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg.id} message={msg} isNewest={i === messages.length - 1} />
          ))
        )}
        {loading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-[#8a8575]/30 bg-[#ccc7b2]/90 p-4 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER QUERY..."
            disabled={loading}
            className="flex-1 border border-[#8a8575] bg-[#ccc7b2] px-4 py-3 font-mono text-sm text-[#1c1a14] placeholder-[#8a8575] transition-colors duration-200 focus:border-[#5a5545] focus:outline-none focus:ring-1 focus:ring-[#5a5545]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 border border-[#c8a84b]/60 bg-[#c8a84b]/10 px-5 py-3 font-mono text-xs uppercase tracking-widest text-[#c8a84b] transition-all duration-200 hover:bg-[#c8a84b]/20 focus:outline-none disabled:cursor-not-allowed disabled:border-[#2e2b1e] disabled:bg-transparent disabled:text-[#4a4535]"
          >
            SEND
            <SendIcon />
          </button>
        </form>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-[#8a8575]">
          GPT-4o-mini · text-embedding-3-small
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message, isNewest }: { message: Message; isNewest: boolean }) {
  const isUser = message.role === "user";
  const uniqueSources = message.sources
    ? Array.from(new Map(message.sources.map((s) => [s.file_path, s])).values())
    : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-3 mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-[#c8a84b]/40 bg-[#c8a84b]/5 font-mono text-[9px] text-[#c8a84b]">
          2B
        </div>
      )}
      <div className="flex max-w-[82%] flex-col gap-2">
        <div
          className={`relative px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-[#26211a] text-[#d8d3be] border-r-2 border-[#c8a84b]/60"
              : "border border-[#8a8575]/40 bg-[#ccc7b2] text-[#1c1a14]"
          }`}
        >
          {!isUser && <NierCorners accent="#c8a84b40" size={8} />}
          {isUser ? (
            <p className="whitespace-pre-wrap font-mono text-xs">{message.content}</p>
          ) : (
            <TypewriterContent content={message.content} animate={isNewest} />
          )}
        </div>

        {uniqueSources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {uniqueSources.map((s) => (
              <span
                key={s.file_path}
                className="inline-flex items-center gap-1 border border-[#8a8575]/40 bg-[#ccc7b2] px-2 py-0.5 font-mono text-[10px] text-[#5a5545]"
              >
                <FileIcon />
                {s.file_path}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypewriterContent({ content, animate }: { content: string; animate: boolean }) {
  const [displayed, setDisplayed] = useState(animate ? "" : content);
  const [done, setDone]           = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    let i = 0;
    const iv = setInterval(() => {
      i += 7;
      if (i >= content.length) {
        setDisplayed(content);
        setDone(true);
        clearInterval(iv);
      } else {
        setDisplayed(content.slice(0, i));
      }
    }, 16);
    return () => clearInterval(iv);
  }, [content, animate]);

  if (!done) {
    return (
      <div className="whitespace-pre-wrap font-mono text-xs text-[#1c1a14]">
        {displayed}
        <span className="animate-nier-cursor ml-0.5 inline-block h-3 w-1.5 bg-[#c8a84b]" />
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p:      ({ children }) => <p className="mb-3 text-xs last:mb-0">{children}</p>,
        code:   ({ className, children, ...props }) => {
          const block = className?.includes("language-");
          return block ? (
            <code className="block overflow-x-auto border border-[#8a8575]/40 bg-[#ccc7b2] p-3 font-mono text-[11px] text-[#1c1a14] my-2" {...props}>{children}</code>
          ) : (
            <code className="border border-[#8a8575]/40 bg-[#ccc7b2] px-1.5 py-0.5 font-mono text-[11px] text-[#1c1a14]" {...props}>{children}</code>
          );
        },
        pre:    ({ children }) => <>{children}</>,
        ul:     ({ children }) => <ul className="mb-3 list-none pl-4 space-y-1 text-xs [&>li]:before:content-['·_'] [&>li]:before:text-[#c8a84b]">{children}</ul>,
        ol:     ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1 text-xs text-[#7a7560] marker:text-[#c8a84b]">{children}</ol>,
        li:     ({ children }) => <li className="text-[#2a2818] text-xs">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-[#1c1a14]">{children}</strong>,
        h1:     ({ children }) => <h1 className="mb-2 font-mono text-xs uppercase tracking-widest text-[#c8a84b]">{children}</h1>,
        h2:     ({ children }) => <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-[#c8a84b]">{children}</h2>,
        h3:     ({ children }) => <h3 className="mb-1 font-mono text-[11px] uppercase tracking-wider text-[#c8a84b]/80">{children}</h3>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-6 border border-[#8a8575]/50 bg-[#ccc7b2] p-6">
        <NierCorners accent="#5a5545" size={8} />
        <div className="font-mono text-[11px] uppercase tracking-widest text-[#5a5545]">
          ◆ NAVIGATOR ONLINE
        </div>
      </div>

      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#1c1a14]">
        AWAITING QUERY
      </p>
      <p className="mb-8 max-w-sm font-mono text-[11px] text-[#5a5545]">
        Ask anything about this repository — architecture, functions,
        dependencies, or how specific logic works.
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="border border-[#8a8575]/50 bg-[#ccc7b2] px-3 py-1.5 font-mono text-[11px] text-[#5a5545] transition-colors hover:border-[#c8a84b]/50 hover:text-[#c8a84b]"
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
      <div className="mr-3 mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-[#c8a84b]/40 bg-[#c8a84b]/5 font-mono text-[9px] text-[#c8a84b]">
        2B
      </div>
      <div className="flex items-end gap-1 border border-[#2e2b1e] bg-[#111108] px-4 py-3.5">
        <span className="animate-thinking-1 inline-block h-3 w-1 bg-[#c8a84b]" />
        <span className="animate-thinking-2 inline-block h-3 w-1 bg-[#c8a84b]" />
        <span className="animate-thinking-3 inline-block h-3 w-1 bg-[#c8a84b]" />
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
