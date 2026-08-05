from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
from worker.tasks import process_chunk_embedding
from worker.celery_app import celery_app
import sys, os


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from database.session import get_db
from database.models import Student, KnowledgeChunk

router = APIRouter()

class StudentCreate(BaseModel):
    email: str
    full_name: str

class ChunkCreate(BaseModel):
    student_id: str
    text_content: str
    topic_tags: Optional[List[str]] = []

class EmbedRequest(BaseModel):
    chunk_id: str
    text_content: str

@router.get("/students")
def list_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return {"students": [{"student_id": str(s.student_id), "email": s.email, "full_name": s.full_name, "created_at": s.created_at} for s in students]}

@router.post("/students")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    new_student = Student(email=student.email, full_name=student.full_name)
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return {"student_id": str(new_student.student_id), "email": new_student.email, "full_name": new_student.full_name}

@router.get("/chunks")
def list_chunks(db: Session = Depends(get_db)):
    chunks = db.query(KnowledgeChunk).all()
    return {"chunks": [{"chunk_id": str(c.chunk_id), "student_id": str(c.student_id), "text_content": c.text_content, "topic_tags": c.topic_tags} for c in chunks]}

@router.post("/process-embedding")
def trigger_embedding(payload: EmbedRequest):
    task = process_chunk_embedding.delay(payload.chunk_id, payload.text_content)
    return {"task_id": task.id, "status": "queued"}

@router.get("/task-status/{task_id}")
def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": result.status,          # PENDING / STARTED / SUCCESS / FAILURE
        "result": result.result if result.ready() else None,
    }