const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface StatusResponse {
  status: string;
  message: string;
}

export interface IngestResponse {
  repo_id: string;
  status: string;
  message: string;
}

export interface Source {
  file_path: string;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export async function ingestRepo(repoUrl: string): Promise<IngestResponse> {
  const res = await fetch(`${API_URL}/api/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Ingestion failed");
  }
  return res.json();
}

export interface GraphNode {
  id: string;
  label: string;
  type: "directory" | "file";
  extension: string | null;
  depth: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export async function getGraph(repoId: string): Promise<GraphData> {
  const res = await fetch(`${API_URL}/api/graph/${repoId}`);
  if (!res.ok) throw new Error("Failed to fetch graph");
  return res.json();
}

export async function getIngestionStatus(repoId: string): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status/${repoId}`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function sendMessage(
  question: string,
  repoId: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, repo_id: repoId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail ?? "Chat request failed");
  }
  return res.json();
}
