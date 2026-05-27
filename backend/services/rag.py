import os
import re

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
    [question_embedding] = await embed_chunks([question])
    chunks = similarity_search(repo_id, question_embedding, top_k=5)

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
