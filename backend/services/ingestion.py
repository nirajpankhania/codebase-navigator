import uuid


async def ingest_repo(repo_url: str) -> str:
    """Fetch, chunk, and embed a GitHub repo. Returns a repo_id."""
    repo_id = str(uuid.uuid4())[:8]
    # TODO: fetch repo file tree via GitHub API (fall back to git clone)
    # TODO: split files into overlapping text chunks
    # TODO: call embedding.embed_chunks()
    # TODO: store chunks + vectors via db.queries.insert_chunks()
    return repo_id
