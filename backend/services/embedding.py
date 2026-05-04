import os

from openai import AsyncOpenAI

_client: AsyncOpenAI | None = None
_BATCH_SIZE = 512  # well under the 2048-input OpenAI limit


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _client


async def embed_chunks(texts: list[str]) -> list[list[float]]:
    client = _get_client()
    embeddings: list[list[float]] = []
    for i in range(0, len(texts), _BATCH_SIZE):
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=texts[i : i + _BATCH_SIZE],
        )
        embeddings.extend(item.embedding for item in response.data)
    return embeddings
