import uuid

from fastapi import APIRouter, BackgroundTasks, HTTPException

from models.schemas import IngestRequest, IngestResponse
from services.ingestion import ingest_repo
from services.progress import set_progress

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest, background_tasks: BackgroundTasks) -> IngestResponse:
    if not request.repo_url.startswith("https://github.com/"):
        raise HTTPException(
            status_code=400, detail="URL must be a valid GitHub repository URL"
        )

    repo_id = str(uuid.uuid4())[:8]
    set_progress(repo_id, "pending", "Starting ingestion...")
    background_tasks.add_task(ingest_repo, request.repo_url, repo_id)

    return IngestResponse(
        repo_id=repo_id,
        status="pending",
        message=f"Ingestion started for {request.repo_url}",
    )
