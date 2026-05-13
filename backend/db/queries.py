from db.client import get_client

_INSERT_BATCH = 100


def insert_chunks(repo_id: str, chunks: list[dict]) -> None:
    client = get_client()
    for i in range(0, len(chunks), _INSERT_BATCH):
        batch = chunks[i : i + _INSERT_BATCH]
        client.table("chunks").insert([{"repo_id": repo_id, **row} for row in batch]).execute()


def similarity_search(
    repo_id: str, embedding: list[float], top_k: int = 5
) -> list[dict]:
    client = get_client()
    result = client.rpc(
        "match_chunks",
        {
            "query_embedding": embedding,
            "filter_repo_id": repo_id,
            "match_count": top_k,
        },
    ).execute()
    return result.data or []
