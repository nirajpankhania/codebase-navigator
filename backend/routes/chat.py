from fastapi import APIRouter

from models.schemas import ChatRequest, ChatResponse
from services.rag import answer_question

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    result = await answer_question(request.question, request.repo_id)
    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
    )
