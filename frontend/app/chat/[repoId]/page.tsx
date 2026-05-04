import { ChatInterface } from "@/components/ChatInterface";

interface PageProps {
  params: { repoId: string };
}

export default function ChatPage({ params }: PageProps) {
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-700 px-6 py-4">
        <h1 className="text-lg font-semibold">Codebase Navigator</h1>
        <p className="text-sm text-zinc-400">Repo ID: {params.repoId}</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <ChatInterface repoId={params.repoId} />
      </div>
    </div>
  );
}
