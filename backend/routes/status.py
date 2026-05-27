from fastapi import APIRouter

from models.schemas import StatusResponse
from services.progress import get_progress

router = APIRouter()


@router.get("/status/{repo_id}", response_model=StatusResponse)
async def status(repo_id: str) -> StatusResponse:
    progress = get_progress(repo_id)
    if progress is None:
        return StatusResponse(status="ready", message="Repository is ready to chat.")
    return StatusResponse(status=progress["status"], message=progress["message"])
