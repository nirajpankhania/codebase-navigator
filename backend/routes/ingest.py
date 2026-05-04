from fastapi import APIRouter, HTTPException

from models.schemas import IngestRequest, IngestResponse
from services.ingestion import ingest_repo

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest) -> IngestResponse:
    if not request.repo_url.startswith("https://github.com/"):
        raise HTTPException(
            status_code=400, detail="URL must be a valid GitHub repository URL"
        )

    repo_id = await ingest_repo(request.repo_url)
    return IngestResponse(
        repo_id=repo_id,
        status="queued",
        message=f"Ingestion started for {request.repo_url}",
    )
