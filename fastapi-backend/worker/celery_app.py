import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

celery_app = Celery(
    "ai_digital_twin",
    broker=f"{REDIS_URL}/0",   # queue: where tasks wait to be picked up
    backend=f"{REDIS_URL}/1",  # result store: where task status/results live
    include=["worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)