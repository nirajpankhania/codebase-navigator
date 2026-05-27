_store: dict[str, dict[str, str]] = {}


def set_progress(repo_id: str, status: str, message: str) -> None:
    _store[repo_id] = {"status": status, "message": message}


def get_progress(repo_id: str) -> dict[str, str] | None:
    return _store.get(repo_id)
