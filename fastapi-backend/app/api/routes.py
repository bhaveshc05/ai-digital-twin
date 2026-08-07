from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel
import sys, os
from app.services.pdf_processor import process_pdf
from fastapi import UploadFile, File
import shutil

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

@router.post("/chunks")
def create_chunk(chunk: ChunkCreate, db: Session = Depends(get_db)):
    new_chunk = KnowledgeChunk(student_id=chunk.student_id, text_content=chunk.text_content, topic_tags=chunk.topic_tags)
    db.add(new_chunk)
    db.commit()
    db.refresh(new_chunk)
    return {"chunk_id": str(new_chunk.chunk_id), "student_id": str(new_chunk.student_id), "text_content": new_chunk.text_content, "topic_tags": new_chunk.topic_tags}

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


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    extracted_text = process_pdf(file_path)

    return {
        "filename": file.filename,
        "text": extracted_text
    }
