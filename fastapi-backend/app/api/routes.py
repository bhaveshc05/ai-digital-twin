import sys
import os
import uuid
import base64
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

# Database
from database.session import get_db
from database.models import Student, KnowledgeChunk
from app.services.embedding_service import get_embedding_service, EmbeddingService
from worker.tasks import process_chunk_embedding
from worker.celery_app import celery_app


router = APIRouter()


# ============================================================
# Pydantic Request Schemas
# ============================================================

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


class GenerateEmbeddingRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None
    provider: Optional[str] = None


class MasteryUpdateRequest(BaseModel):
    student_id: str
    subject: str
    topic: str
    is_correct: bool


# ============================================================
# Test Request Schemas
# ============================================================

class TestQuestionCreate(BaseModel):
    topic: str
    question_text: str
    correct_answer: str


class TestCreate(BaseModel):
    student_id: str
    title: str
    subject: str
    questions: List[TestQuestionCreate]


# ============================================================
# Student Endpoints
# ============================================================

@router.get("/students")
def list_students(
    db: Session = Depends(get_db)
):
    students = db.query(Student).all()

    return {
        "students": [
            {
                "student_id": str(s.student_id),
                "email": s.email,
                "full_name": s.full_name,
                "board": s.board,
                "grade": s.grade,
                "date_of_birth": (
                    str(s.date_of_birth)
                    if s.date_of_birth
                    else None
                ),
                "guardian_email": s.guardian_email,
                "created_at": s.created_at,
            }
            for s in students
        ]
    }


@router.post("/students")
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    new_student = Student(
        email=student.email,
        full_name=student.full_name,
        board=student.board,
        grade=student.grade,
        guardian_email=student.guardian_email,
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
        "guardian_email": new_student.guardian_email,
    }


# ============================================================
# Student Mastery Endpoint
# ============================================================

@router.post("/mastery/update")
def update_mastery(
    payload: MasteryUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update a student's mastery score based on
    one question's performance.
    """

    # Convert student_id from string to UUID
    try:
        student_id = uuid.UUID(payload.student_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id"
        )

    # Check whether student exists
    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Update mastery using mastery service
    mastery = update_mastery_score(
        db=db,
        student_id=student_id,
        subject=payload.subject,
        topic=payload.topic,
        is_correct=payload.is_correct
    )

    return {
        "mastery_id": str(mastery.mastery_id),
        "student_id": str(mastery.student_id),
        "subject": mastery.subject,
        "topic": mastery.topic,
        "correct_answers": mastery.correct_answers,
        "total_questions": mastery.total_questions,
        "mastery_score": mastery.mastery_score,
        "mastery_percentage": round(
            mastery.mastery_score * 100,
            2
        ),
        "message": "Mastery score updated successfully"
    }


# ============================================================
# Test Creation Endpoint
# ============================================================

@router.post("/tests")
def create_test(
    payload: TestCreate,
    db: Session = Depends(get_db)
):
    """
    Create a test and its questions.
    """

    # Convert student_id to UUID
    try:
        student_id = uuid.UUID(payload.student_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id"
        )

    # Check student exists
    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Make sure test has at least one question
    if not payload.questions:
        raise HTTPException(
            status_code=400,
            detail="Test must contain at least one question"
        )

    # Create test
    new_test = Test(
        student_id=student_id,
        title=payload.title,
        subject=payload.subject
    )

    db.add(new_test)

    # Flush so test_id is available
    db.flush()

    # Create questions
    for question in payload.questions:

        new_question = TestQuestion(
            test_id=new_test.test_id,
            topic=question.topic,
            question_text=question.question_text,
            correct_answer=question.correct_answer
        )

        db.add(new_question)

    db.commit()
    db.refresh(new_test)

    return {
        "test_id": str(new_test.test_id),
        "student_id": str(new_test.student_id),
        "title": new_test.title,
        "subject": new_test.subject,
        "questions": [
            {
                "question_id": str(question.question_id),
                "topic": question.topic,
                "question_text": question.question_text
            }
            for question in new_test.questions
        ],
        "message": "Test created successfully"
    }


# ============================================================
# Embedding Endpoints
# ============================================================

@router.post("/embeddings/generate")
def generate_embeddings(
    payload: GenerateEmbeddingRequest
):
    """
    Generate vector embeddings using LangChain.
    Supports OpenAI, Gemini, or fallback mode.
    """

    service = (
        get_embedding_service()
        if not payload.provider
        else EmbeddingService(provider=payload.provider)
    )

    if payload.text:

        embedding = service.generate_embedding(
            payload.text
        )

        return {
            "provider": service.provider,
            "dimension": len(embedding),
            "embedding": embedding
        }

    elif payload.texts:

        embeddings = service.generate_embeddings_batch(
            payload.texts
        )

        return {
            "provider": service.provider,
            "count": len(embeddings),
            "dimension": (
                len(embeddings[0])
                if embeddings
                else 0
            ),
            "embeddings": embeddings
        }

    else:

        raise HTTPException(
            status_code=400,
            detail=(
                "Either 'text' or 'texts' field "
                "must be provided."
            )
        )


# ============================================================
# Knowledge Chunk Endpoints
# ============================================================

@router.post("/chunks")
def create_chunk(
    chunk: ChunkCreate,
    db: Session = Depends(get_db)
):
    """
    Create a knowledge chunk and automatically
    generate and store its vector embedding.
    """

    try:
        student_id = uuid.UUID(chunk.student_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id"
        )

    # Check student exists
    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    service = get_embedding_service()

    embedding = service.generate_embedding(
        chunk.text_content
    )

    new_chunk = KnowledgeChunk(
        student_id=student_id,
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
        "embedding_dimension": (
            len(new_chunk.embedding)
            if new_chunk.embedding is not None
            else 0
        ),
        "provider": service.provider,
        "created_at": new_chunk.created_at
    }


@router.get("/chunks")
def list_chunks(
    db: Session = Depends(get_db)
):
    chunks = db.query(KnowledgeChunk).all()

    return {
        "chunks": [
            {
                "chunk_id": str(c.chunk_id),
                "student_id": str(c.student_id),
                "text_content": c.text_content,
                "topic_tags": c.topic_tags
            }
            for c in chunks
        ]
    }


# ============================================================
# Celery Embedding Endpoints
# ============================================================

@router.post("/process-embedding")
def trigger_embedding(
    payload: ChunkCreate
):
    task = process_chunk_embedding.delay(
        payload.student_id,
        payload.text_content
    )

    return {
        "task_id": task.id,
        "status": "queued"
    }


# ============================================================
# PDF Upload Endpoint
# ============================================================

@router.post("/upload-pdf")
async def upload_pdf_file(
    file: UploadFile = File(...),
    student_id: Optional[str] = Form(None)
):
    """
    Accepts a PDF document upload, encodes bytes,
    and queues an asynchronous background task
    (Celery/Redis) for text extraction (pdfplumber + OCR),
    LangChain text splitting, vector embedding,
    and pgvector storage.
    """

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported."
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    b64_content = base64.b64encode(
        file_bytes
    ).decode("utf-8")

    # Queue background task
    try:
        task = process_pdf_ingestion.delay(
            b64_content,
            file.filename,
            student_id
        )

        task_id = task.id

    except Exception as err:

        # Fallback inline processing if Celery broker is offline
        print(
            "[Fallback] Executing inline PDF processing "
            f"because Celery broker unavailable: {err}"
        )

        res = process_pdf_ingestion(
            b64_content,
            file.filename,
            student_id
        )

        return {
            "status": "success",
            "task_id": "inline-complete",
            "filename": file.filename,
            "result": res
        }

    return {
        "status": "queued",
        "task_id": task_id,
        "filename": file.filename,
        "message": (
            "PDF queued for background extraction, "
            "chunking, and vector embedding!"
        )
    }


# ============================================================
# Celery Task Status Endpoint
# ============================================================

@router.post("/upload-pdf")
async def upload_pdf_file(
    file: UploadFile = File(...),
    student_id: Optional[str] = Form(None)
):
    """
    Accepts a PDF document upload, encodes bytes, and queues an asynchronous background task (Celery/Redis)
    for text extraction (pdfplumber + OCR), LangChain text splitting, vector embedding, and pgvector storage.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    b64_content = base64.b64encode(file_bytes).decode("utf-8")

    # Queue background task
    try:
        task = process_pdf_ingestion.delay(b64_content, file.filename, student_id)
        task_id = task.id
    except Exception as err:
        # Fallback inline processing if Celery broker is offline
        print(f"[Fallback] Executing inline PDF processing because Celery broker unavailable: {err}")
        res = process_pdf_ingestion(b64_content, file.filename, student_id)
        return {
            "status": "success",
            "task_id": "inline-complete",
            "filename": file.filename,
            "result": res
        }

    return {
        "status": "queued",
        "task_id": task_id,
        "filename": file.filename,
        "message": "PDF queued for background extraction, chunking, and vector embedding!"
    }

@router.get("/task-status/{task_id}")
def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)

    return {
        "task_id": task_id,
        "status": result.status,
        "result": (
            result.result
            if result.ready()
            else None
        )
    }


# ============================================================
# Test Submission Request Schemas
# ============================================================

class TestAnswer(BaseModel):
    question_id: str
    answer: str


class TestSubmission(BaseModel):
    answers: List[TestAnswer]


# ============================================================
# Test Submission Endpoint
# ============================================================

@router.post("/tests/{test_id}/submit")
def submit_test(
    test_id: str,
    payload: TestSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit a test, calculate the score,
    and automatically update student mastery.
    """

    # Convert test_id to UUID
    try:
        test_uuid = uuid.UUID(test_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid test_id"
        )

    # Find test
    test = (
        db.query(Test)
        .filter(Test.test_id == test_uuid)
        .first()
    )

    if test is None:
        raise HTTPException(
            status_code=404,
            detail="Test not found"
        )

    # Make sure answers were submitted
    if not payload.answers:
        raise HTTPException(
            status_code=400,
            detail="No answers submitted"
        )

    # Create dictionary of submitted answers
    submitted_answers = {
        answer.question_id: answer.answer.strip()
        for answer in payload.answers
    }

    results = []
    correct_count = 0

    # Check every question in the test
    for question in test.questions:

        question_id = str(question.question_id)

        submitted_answer = submitted_answers.get(
            question_id
        )

        is_correct = False

        if submitted_answer is not None:
            is_correct = (
                submitted_answer.lower()
                == question.correct_answer.strip().lower()
            )

        if is_correct:
            correct_count += 1

        # Update mastery
        mastery = update_mastery_score(
            db=db,
            student_id=test.student_id,
            subject=test.subject,
            topic=question.topic,
            is_correct=is_correct
        )

        results.append({
            "question_id": question_id,
            "topic": question.topic,
            "question_text": question.question_text,
            "submitted_answer": submitted_answer,
            "correct_answer": question.correct_answer,
            "is_correct": is_correct,
            "mastery_score": mastery.mastery_score,
            "mastery_percentage": round(
                mastery.mastery_score * 100,
                2
            )
        })

    # Calculate final score
    total_questions = len(test.questions)

    score_percentage = (
        (correct_count / total_questions) * 100
        if total_questions > 0
        else 0
    )

    # Save changes
    db.commit()

    # Return result
    return {
        "test_id": str(test.test_id),
        "student_id": str(test.student_id),
        "title": test.title,
        "subject": test.subject,
        "score": correct_count,
        "total_questions": total_questions,
        "score_percentage": round(
            score_percentage,
            2
        ),
        "results": results,
        "message": (
            "Test submitted successfully "
            "and mastery updated"
        )
    }