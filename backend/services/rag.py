async def answer_question(question: str, repo_id: str) -> dict:
    """Retrieve relevant chunks and generate an answer via gpt-4o-mini."""
    # TODO: embed the question via embedding.embed_chunks()
    # TODO: similarity search via db.queries.similarity_search()
    # TODO: build prompt with retrieved chunks as context
    # TODO: call openai.chat.completions.create() with gpt-4o-mini
    return {
        "answer": f"Placeholder answer for: {question}",
        "sources": [],
    }
