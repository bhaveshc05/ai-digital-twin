from worker.celery_app import celery_app

try:
    @celery_app.task(name="process_chunk_embedding")
    def process_chunk_embedding(chunk_id: str, text: str):
        """
        Runs in the Celery worker process.
        """
        print(f"[Worker] Processing embedding for chunk_id: {chunk_id}")
        return {"status": "success", "chunk_id": chunk_id}
except AttributeError:
    class MockTask:
        def delay(self, chunk_id: str, text: str):
            class MockTaskResult:
                id = f"mock-task-{chunk_id}"
            return MockTaskResult()

    process_chunk_embedding = MockTask()