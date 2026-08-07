import sys
import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
import sys, os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
from database.session import get_db
from database.models import Student, KnowledgeChunk
from app.services.embedding_service import get_embedding_service, EmbeddingService
from worker.tasks import process_chunk_embedding
from worker.celery_app import celery_app

router = APIRouter()

# ── Pydantic Request Schemas ──

class StudentCreate(BaseModel):
    email: str
    full_name: str
    board: Optional[str] = None
    grade: Optional[str] = None
    guardian_email: Optional[str] = None

class ChunkCreate(BaseModel):
    student_id: str
    text_content: str
    topic_tags: Optional[List[str]] = []

@router.get("/students")
def list_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return {"students": [{
        "student_id": str(s.student_id),
        "email": s.email,
        "full_name": s.full_name,
        "board": s.board,
        "grade": s.grade,
        "date_of_birth": str(s.date_of_birth) if s.date_of_birth else None,
        "guardian_email": s.guardian_email,
        "created_at": s.created_at
    } for s in students]}

@router.post("/students")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    new_student = Student(
        email=student.email,
        full_name=student.full_name,
        board=student.board,
        grade=student.grade,
        guardian_email=student.guardian_email
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return {
        "student_id": str(new_student.student_id),
        "email": new_student.email,
        "full_name": new_student.full_name,
        "board": new_student.board,
        "grade": new_student.grade,
        "guardian_email": new_student.guardian_email
    }

# ── LangChain Embedding Endpoints ──

@router.post("/embeddings/generate")
def generate_embeddings(payload: GenerateEmbeddingRequest):
    """
    Generate vector embeddings using LangChain (supporting OpenAI, Gemini, or Fallback mode).
    """
    service = get_embedding_service() if not payload.provider else EmbeddingService(provider=payload.provider)

    if payload.text:
        embedding = service.generate_embedding(payload.text)
        return {
            "provider": service.provider,
            "dimension": len(embedding),
            "embedding": embedding
        }
    elif payload.texts:
        embeddings = service.generate_embeddings_batch(payload.texts)
        return {
            "provider": service.provider,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0,
            "embeddings": embeddings
        }
    else:
        raise HTTPException(status_code=400, detail="Either 'text' or 'texts' field must be provided.")

@router.post("/chunks")
def create_chunk(chunk: ChunkCreate, db: Session = Depends(get_db)):
    """
    Creates a new knowledge chunk, automatically generating a vector embedding using LangChain
    and storing it in PostgreSQL with pgvector.
    """
    service = get_embedding_service()
    embedding = service.generate_embedding(chunk.text_content)

    new_chunk = KnowledgeChunk(
        student_id=uuid.UUID(chunk.student_id),
        text_content=chunk.text_content,
        topic_tags=chunk.topic_tags,
        embedding=embedding
    )
    db.add(new_chunk)
    db.commit()
    db.refresh(new_chunk)

    return {
        "chunk_id": str(new_chunk.chunk_id),
        "student_id": str(new_chunk.student_id),
        "text_content": new_chunk.text_content,
        "topic_tags": new_chunk.topic_tags,
        "embedding_dimension": len(new_chunk.embedding) if new_chunk.embedding is not None else 0,
        "provider": service.provider,
        "created_at": new_chunk.created_at
    }

@router.get("/chunks")
def list_chunks(db: Session = Depends(get_db)):
    chunks = db.query(KnowledgeChunk).all()
    return {"chunks": [{"chunk_id": str(c.chunk_id), "student_id": str(c.student_id), "text_content": c.text_content, "topic_tags": c.topic_tags} for c in chunks]}
