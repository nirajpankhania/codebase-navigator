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
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex max-w-[660px] flex-col gap-3.5">
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
      </div>

      {/* Input bar */}
      <div className="shrink-0 border-t border-[#8a8575]/30 bg-[#ccc7b2]/90 p-4 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-[660px] items-center gap-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER QUERY..."
            disabled={loading}
            className="flex-1 border border-[#8a8575] bg-[#ccc7b2] px-3.5 py-[10px] font-mono text-[12px] text-[#1c1a14] placeholder-[#8a8575] placeholder:uppercase placeholder:tracking-[0.05em] transition-colors duration-200 [border-left:3px_solid_#8a8575] focus:[border-left:3px_solid_#5a5545] focus:border-[#5a5545] focus:bg-[#d8d3be] focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center gap-1.5 border border-[#26211a] bg-[#26211a] px-4 py-[10px] font-mono text-[10px] uppercase tracking-[0.14em] text-[#d8d3be] transition-colors duration-200 hover:bg-[#38322a] focus:outline-none disabled:cursor-not-allowed disabled:border-[#8a8575]/40 disabled:bg-[#ccc7b2] disabled:text-[#8a8575]"
          >
            SEND ▶
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
        <div className="mr-2 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center border border-[#8a8575] bg-[#ccc7b2] font-mono text-[8px] tracking-[0.06em] text-[#5a5545]">
          AI
        </div>
      )}
      <div className="flex max-w-[68%] flex-col gap-2">
        <div
          className={`relative text-sm leading-relaxed ${
            isUser
              ? "flex items-start gap-2 bg-[#26211a] px-3.5 py-2.5 text-[#d8d3be] [border-left:3px_solid_#d8d3be]"
              : "border border-[#8a8575]/50 bg-[#ccc7b2] px-3.5 py-2.5 text-[#1c1a14] [border-left:3px_solid_#8a8575]"
          }`}
        >
          {isUser && <span className="mt-1 inline-block h-[7px] w-[7px] shrink-0 bg-[#d8d3be]" />}
          {isUser ? (
            <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed">{message.content}</p>
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
      <div className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-[#1c1a14]">
        {displayed}
        <span className="animate-nier-cursor ml-0.5 inline-block h-3 w-1.5 bg-[#1c1a14]" />
      </div>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p:      ({ children }) => <p className="mb-3 font-mono text-[13px] leading-relaxed last:mb-0">{children}</p>,
        code:   ({ className, children, ...props }) => {
          const block = className?.includes("language-");
          return block ? (
            <code className="block overflow-x-auto border border-[#8a8575]/40 bg-[#ccc7b2] p-3 font-mono text-[11px] text-[#1c1a14] my-2" {...props}>{children}</code>
          ) : (
            <code className="border border-[#8a8575]/40 bg-[#ccc7b2] px-1.5 py-0.5 font-mono text-[11px] text-[#1c1a14]" {...props}>{children}</code>
          );
        },
        pre:    ({ children }) => <>{children}</>,
        ul:     ({ children }) => <ul className="mb-3 list-none pl-4 space-y-1 font-mono text-[13px] [&>li]:before:content-['·_'] [&>li]:before:text-[#5a5545]">{children}</ul>,
        ol:     ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1 font-mono text-[13px] text-[#5a5545] marker:text-[#5a5545]">{children}</ol>,
        li:     ({ children }) => <li className="font-mono text-[13px] text-[#2a2818]">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-[#1c1a14]">{children}</strong>,
        h1:     ({ children }) => <h1 className="mb-2 font-mono text-xs uppercase tracking-widest text-[#1c1a14]">{children}</h1>,
        h2:     ({ children }) => <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-[#1c1a14]">{children}</h2>,
        h3:     ({ children }) => <h3 className="mb-1 font-mono text-[11px] uppercase tracking-wider text-[#5a5545]">{children}</h3>,
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
            className="border border-[#8a8575]/50 bg-[#ccc7b2] px-3 py-1.5 font-mono text-[11px] text-[#5a5545] transition-colors hover:border-[#5a5545] hover:text-[#1c1a14]"
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
      <div className="mr-2 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center border border-[#8a8575] bg-[#ccc7b2] font-mono text-[8px] tracking-[0.06em] text-[#5a5545]">
        AI
      </div>
      <div className="border border-[#8a8575]/50 bg-[#ccc7b2] px-3.5 py-2.5 [border-left:3px_solid_#8a8575]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-end gap-[3px]" style={{ height: 16 }}>
            <span className="animate-thinking-1 inline-block w-[3px] origin-bottom bg-[#1c1a14]" style={{ height: 16 }} />
            <span className="animate-thinking-2 inline-block w-[3px] origin-bottom bg-[#1c1a14]" style={{ height: 16 }} />
            <span className="animate-thinking-3 inline-block w-[3px] origin-bottom bg-[#1c1a14]" style={{ height: 16 }} />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#8a8575]">PROCESSING QUERY...</span>
        </div>
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
