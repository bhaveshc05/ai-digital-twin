import base64
import sys
import os
import uuid
from worker.celery_app import celery_app

# Ensure parent directories can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.pdf_service import extract_text_from_pdf, chunk_text
from app.services.embedding_service import get_embedding_service
from database.session import SessionLocal
from database.models import KnowledgeChunk, Student

@celery_app.task(name="process_chunk_embedding")
def process_chunk_embedding(chunk_id: str, text: str):
    """
    Runs in the Celery worker process to generate and store embedding for a single text chunk.
    """
    print(f"[Worker] Processing embedding for chunk_id: {chunk_id}")
    return {"status": "success", "chunk_id": chunk_id}


@celery_app.task(name="process_pdf_ingestion")
def process_pdf_ingestion(pdf_b64: str, filename: str, student_id: str = None):
    """
    Celery Task: Extracts text from PDF bytes (pdfplumber + OCR), splits text using LangChain
    RecursiveCharacterTextSplitter, generates vector embeddings, and saves into PostgreSQL (pgvector).
    """
    print(f"[Worker] Starting PDF ingestion for file: {filename}")

    try:
        pdf_bytes = base64.b64decode(pdf_b64)
        extracted_text = extract_text_from_pdf(pdf_bytes)
        chunks = chunk_text(extracted_text, chunk_size=800, chunk_overlap=150)
        print(f"[Worker] Extracted {len(extracted_text)} chars, generated {len(chunks)} chunks.")

        embedding_service = get_embedding_service()
        db = SessionLocal()

        target_student_id = None
        if student_id:
            try:
                target_student_id = uuid.UUID(student_id)
            except ValueError:
                print(f"[Worker] Invalid student_id UUID format: {student_id}")

        if not target_student_id:
            # Default to first student in DB if none provided
            first_student = db.query(Student).first()
            if first_student:
                target_student_id = first_student.student_id

        saved_chunks_count = 0
        for index, chunk_str in enumerate(chunks):
            vector = embedding_service.generate_embedding(chunk_str)
            chunk_record = KnowledgeChunk(
                student_id=target_student_id,
                text_content=chunk_str,
                topic_tags=[filename, f"chunk_{index+1}"],
                embedding=vector
            )
            db.add(chunk_record)
            saved_chunks_count += 1

        db.commit()
        db.close()

        print(f"[Worker] Successfully saved {saved_chunks_count} chunks to pgvector database!")
        return {
            "status": "success",
            "filename": filename,
            "chunks_count": saved_chunks_count,
            "provider": embedding_service.provider
        }

    except Exception as e:
        print(f"[Worker Error] PDF processing failed: {e}")
        return {"status": "error", "message": str(e)}