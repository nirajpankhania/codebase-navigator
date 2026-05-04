import { RepoForm } from "@/components/RepoForm";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-white">
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Codebase Navigator
          </h1>
          <p className="mt-3 text-zinc-400">
            Paste a GitHub repo URL to start chatting with its codebase.
          </p>
        </div>
        <RepoForm />
      </div>
    </main>
  );
}
