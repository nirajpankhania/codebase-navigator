def insert_chunks(repo_id: str, chunks: list[dict]) -> None:
    # TODO: batch-insert chunks + vectors into pgvector table
    raise NotImplementedError


def similarity_search(
    repo_id: str, embedding: list[float], top_k: int = 5
) -> list[dict]:
    # TODO: run pgvector cosine similarity query filtered by repo_id
    raise NotImplementedError
