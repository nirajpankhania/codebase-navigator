import os
import re

import asyncio

from openai import AsyncOpenAI

from db.queries import similarity_search
from services.embedding import embed_chunks

_client: AsyncOpenAI | None = None

_SYSTEM_PROMPT = (
    "You are an expert code assistant. Answer the user's question using only the "
    "provided source code excerpts. "
    "IMPORTANT: Do NOT include any source citations, file names, or references like "
    "'(Source: ...)', '[file.py]', or 'as seen in ...' anywhere in your answer. "
    "Source attribution is handled separately by the UI. Just answer the question directly. "
    "If the excerpts don't contain enough information to answer, say so clearly."
)


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


async def answer_question(question: str, repo_id: str) -> dict:
    # Run two searches in parallel: one for the question, one anchored on
    # overview/readme content so broad questions always get useful context.
    overview_query = "project overview description purpose readme what does this do"
    [question_embedding, overview_embedding] = await embed_chunks([question, overview_query])

    primary, overview = await asyncio.gather(
        asyncio.to_thread(similarity_search, repo_id, question_embedding, 10),
        asyncio.to_thread(similarity_search, repo_id, overview_embedding, 4),
    )

    seen: set[str] = set()
    chunks: list[dict] = []
    for c in primary + overview:
        key = f"{c['file_path']}:{c['content'][:50]}"
        if key not in seen:
            seen.add(key)
            chunks.append(c)

    if not chunks:
        return {
            "answer": "No indexed content found for this repository. Try ingesting it first.",
            "sources": [],
        }

    context = "\n\n".join(
        f"### {c['file_path']}\n{c['content']}" for c in chunks
    )

    response = await _get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0.2,
    )

    raw_answer = response.choices[0].message.content or ""
    answer = re.sub(r"\s*\(Source:[^)]*\)", "", raw_answer).strip()
    sources = [
        {"file_path": c["file_path"], "snippet": c["content"][:200]}
        for c in chunks
    ]
    return {"answer": answer, "sources": sources}
