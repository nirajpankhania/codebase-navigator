from fastapi import APIRouter

from db.queries import get_file_paths

router = APIRouter()


def _build_graph(file_paths: list[str]) -> dict:
    nodes: dict[str, dict] = {}
    links: list[dict] = []
    seen_links: set[str] = set()

    nodes["root"] = {"id": "root", "label": "root", "type": "directory", "extension": None, "depth": 0}

    for path in file_paths:
        parts = path.split("/")

        for i in range(len(parts) - 1):
            dir_id = "/".join(parts[: i + 1])
            if dir_id not in nodes:
                nodes[dir_id] = {
                    "id": dir_id,
                    "label": parts[i],
                    "type": "directory",
                    "extension": None,
                    "depth": i + 1,
                }
            parent_id = "/".join(parts[:i]) if i > 0 else "root"
            key = f"{parent_id}=>{dir_id}"
            if key not in seen_links:
                seen_links.add(key)
                links.append({"source": parent_id, "target": dir_id})

        ext = ""
        if "." in parts[-1]:
            ext = "." + parts[-1].rsplit(".", 1)[-1]

        if path not in nodes:
            nodes[path] = {
                "id": path,
                "label": parts[-1],
                "type": "file",
                "extension": ext,
                "depth": len(parts),
            }

        parent_id = "/".join(parts[:-1]) if len(parts) > 1 else "root"
        key = f"{parent_id}=>{path}"
        if key not in seen_links:
            seen_links.add(key)
            links.append({"source": parent_id, "target": path})

    return {"nodes": list(nodes.values()), "links": links}


@router.get("/graph/{repo_id}")
async def graph(repo_id: str) -> dict:
    file_paths = get_file_paths(repo_id)
    if not file_paths:
        return {"nodes": [], "links": []}
    return _build_graph(file_paths)
