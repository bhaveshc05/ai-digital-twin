from worker.celery_app import celery_app

@celery_app.task(name="process_chunk_embedding")
def process_chunk_embedding(chunk_id: str, text: str):
    """
    Runs in the Celery worker process, not in the FastAPI request/response cycle.
    """
    print(f"[Worker] Processing embedding for chunk_id: {chunk_id}")
    # placeholder — actual OCR/embedding logic plugs in here later (F1 continued)
    return {"status": "success", "chunk_id": chunk_id}