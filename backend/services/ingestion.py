import asyncio
import os
import uuid

import httpx
import tiktoken

from db.queries import insert_chunks
from services.embedding import embed_chunks

_SUPPORTED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".js", ".jsx", ".md", ".txt",
    ".json", ".yaml", ".yml", ".toml", ".go", ".rs",
    ".java", ".rb", ".php", ".c", ".cpp", ".h", ".cs",
    ".html", ".css", ".scss", ".sh",
}
_SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "dist", "build", ".next"}
_MAX_FILE_BYTES = 200_000
_CHUNK_TOKENS = 400
_CHUNK_OVERLAP = 50
_FETCH_CONCURRENCY = 10


def _github_headers() -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/vnd.github+json"}
    if token := os.getenv("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _parse_owner_repo(repo_url: str) -> tuple[str, str]:
    url = repo_url.rstrip("/").removesuffix(".git")
    parts = url.split("/")
    return parts[-2], parts[-1]


async def _fetch_tree(owner: str, repo: str, client: httpx.AsyncClient) -> list[dict]:
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
    r = await client.get(url, headers=_github_headers())
    r.raise_for_status()
    return [
        item for item in r.json().get("tree", [])
        if item["type"] == "blob"
        and item.get("size", 0) <= _MAX_FILE_BYTES
        and not any(seg in _SKIP_DIRS for seg in item["path"].split("/"))
        and any(item["path"].endswith(ext) for ext in _SUPPORTED_EXTENSIONS)
    ]


async def _fetch_file(
    owner: str, repo: str, path: str, client: httpx.AsyncClient
) -> str:
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{path}"
    r = await client.get(url, headers=_github_headers())
    r.raise_for_status()
    return r.text


def _chunk_file(content: str, file_path: str) -> list[dict]:
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(content)
    chunks: list[dict] = []
    start = 0
    while start < len(tokens):
        end = min(start + _CHUNK_TOKENS, len(tokens))
        chunks.append({
            "file_path": file_path,
            "content": enc.decode(tokens[start:end]),
        })
        if end == len(tokens):
            break
        start += _CHUNK_TOKENS - _CHUNK_OVERLAP
    return chunks


async def ingest_repo(repo_url: str) -> str:
    owner, repo = _parse_owner_repo(repo_url)
    repo_id = str(uuid.uuid4())[:8]
    semaphore = asyncio.Semaphore(_FETCH_CONCURRENCY)

    async with httpx.AsyncClient(timeout=30) as client:
        tree = await _fetch_tree(owner, repo, client)

        async def fetch_safe(item: dict) -> list[dict]:
            async with semaphore:
                try:
                    content = await _fetch_file(owner, repo, item["path"], client)
                    return _chunk_file(content, item["path"])
                except Exception:
                    return []

        results = await asyncio.gather(*[fetch_safe(item) for item in tree])

    all_chunks = [chunk for file_chunks in results for chunk in file_chunks]
    if not all_chunks:
        return repo_id

    embeddings = await embed_chunks([c["content"] for c in all_chunks])
    enriched = [{**chunk, "embedding": emb} for chunk, emb in zip(all_chunks, embeddings)]
    insert_chunks(repo_id, enriched)
    return repo_id
