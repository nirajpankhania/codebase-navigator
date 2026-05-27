from pydantic import BaseModel


class IngestRequest(BaseModel):
    repo_url: str


class IngestResponse(BaseModel):
    repo_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    status: str
    message: str


class Source(BaseModel):
    file_path: str
    snippet: str


class ChatRequest(BaseModel):
    question: str
    repo_id: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
