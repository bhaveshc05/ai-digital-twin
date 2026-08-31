import os
import uuid
import tempfile
import hashlib
import secrets
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    File,
    UploadFile,
    Form,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.session import get_db, SessionLocal
from database.models import (
    Student,
    KnowledgeChunk,
    Document,
    StudentMastery,
    MasterySnapshot,
    Test,
    TestQuestion,
)

from app.services.embedding_service import (
    get_embedding_service,
    EmbeddingService,
)
from app.services.mastery_service import update_mastery_score
from app.services.struggle_data_service import get_struggle_input_data
from app.services.struggle_service import get_top_struggles
from app.services.llm_service import get_llm_service
from app.services.rag_service import retrieve_relevant_chunks

from worker.celery_app import celery_app
from worker.tasks import process_chunk_embedding, process_pdf_task


router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================
# PASSWORD HELPERS
# ============================================================

def hash_password(password: str) -> str:
    """Secure password hashing using PBKDF2."""
    salt = secrets.token_hex(16)

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )

    return f"{salt}${hashed.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash."""
    try:
        salt, saved_hash = stored_hash.split("$")

        hashed = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        )

        return secrets.compare_digest(hashed.hex(), saved_hash)

    except Exception:
        return False


# ============================================================
# REQUEST SCHEMAS
# ============================================================

class StudentCreate(BaseModel):
    email: str
    full_name: str
    password: str

    board: Optional[str] = None
    grade: Optional[str] = None
    date_of_birth: Optional[str] = None
    exam_date: Optional[str] = None
    guardian_email: Optional[str] = None
    age: Optional[int] = None
    consent_status: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class ChunkCreate(BaseModel):
    student_id: str
    text_content: str
    topic_tags: Optional[List[str]] = None


class GenerateEmbeddingRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None
    provider: Optional[str] = None


class MasteryUpdateRequest(BaseModel):
    student_id: str
    subject: str
    topic: str
    is_correct: bool


class TestQuestionCreate(BaseModel):
    topic: str
    question_text: str
    correct_answer: str


class TestCreate(BaseModel):
    student_id: str
    title: str
    subject: str
    questions: List[TestQuestionCreate]


class TestAnswer(BaseModel):
    question_id: str
    answer: str


class TestSubmission(BaseModel):
    answers: List[TestAnswer]


class GenerateTestRequest(BaseModel):
    student_id: str
    document_ids: Optional[List[str]] = None
    document_id: Optional[str] = None  # backward compatibility
    topic: Optional[str] = None
    num_questions: int = 5


# ============================================================
# LOGIN
# ============================================================

@router.post("/login")
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.email == payload.email)
        .first()
    )

    if not student:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not student.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Password not configured for this account",
        )

    if not verify_password(payload.password, student.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "success": True,
        "user": {
            "student_id": str(student.student_id),
            "email": student.email,
            "full_name": student.full_name,
            "board": student.board,
            "grade": student.grade,
            "guardian_email": student.guardian_email,
        },
        "message": "Login successful",
    }


# ============================================================
# STUDENT ENDPOINTS
# ============================================================

@router.get("/students")
def list_students(
    db: Session = Depends(get_db),
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
                    str(s.date_of_birth) if s.date_of_birth else None
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
    db: Session = Depends(get_db),
):
    existing_student = (
        db.query(Student)
        .filter(Student.email == student.email)
        .first()
    )

    if existing_student:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_student = Student(
        email=student.email,
        full_name=student.full_name,
        password_hash=hash_password(student.password),
        board=student.board,
        grade=student.grade,
        date_of_birth=student.date_of_birth,
        exam_date=student.exam_date,
        guardian_email=student.guardian_email,
        age=student.age,
        consent_status=student.consent_status,
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "success": True,
        "student_id": str(new_student.student_id),
        "user": {
            "student_id": str(new_student.student_id),
            "email": new_student.email,
            "full_name": new_student.full_name,
            "board": new_student.board,
            "grade": new_student.grade,
            "guardian_email": new_student.guardian_email,
        },
        "message": "Student created successfully",
    }


# ============================================================
# MASTERY UPDATE
# ============================================================

@router.post("/mastery/update")
def update_mastery(
    payload: MasteryUpdateRequest,
    db: Session = Depends(get_db),
):
    try:
        student_id = uuid.UUID(payload.student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    mastery = update_mastery_score(
        db=db,
        student_id=student_id,
        subject=payload.subject,
        topic=payload.topic,
        is_correct=payload.is_correct,
    )

    db.commit()
    db.refresh(mastery)

    return {
        "mastery_id": str(mastery.mastery_id),
        "student_id": str(mastery.student_id),
        "subject": mastery.subject,
        "topic": mastery.topic,
        "correct_answers": mastery.correct_answers,
        "total_questions": mastery.total_questions,
        "mastery_score": mastery.mastery_score,
        "mastery_percentage": round(mastery.mastery_score * 100, 2),
        "message": "Mastery score updated successfully",
    }


# ============================================================
# CREATE TEST
# ============================================================

@router.post("/tests")
def create_test(
    payload: TestCreate,
    db: Session = Depends(get_db),
):
    try:
        student_id = uuid.UUID(payload.student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if not payload.questions:
        raise HTTPException(
            status_code=400, detail="Test must contain at least one question"
        )

    new_test = Test(
        student_id=student_id,
        title=payload.title,
        subject=payload.subject,
    )

    db.add(new_test)
    db.flush()

    for question in payload.questions:
        db.add(
            TestQuestion(
                test_id=new_test.test_id,
                topic=question.topic,
                question_text=question.question_text,
                correct_answer=question.correct_answer,
            )
        )

    db.commit()
    db.refresh(new_test)

    return {
        "success": True,
        "test_id": str(new_test.test_id),
        "student_id": str(new_test.student_id),
        "title": new_test.title,
        "subject": new_test.subject,
        "questions": [
            {
                "question_id": str(q.question_id),
                "topic": q.topic,
                "question_text": q.question_text,
            }
            for q in new_test.questions
        ],
        "message": "Test created successfully",
    }


# ============================================================
# GENERATE EMBEDDINGS
# ============================================================

@router.post("/embeddings/generate")
def generate_embeddings(
    payload: GenerateEmbeddingRequest,
):
    service = (
        get_embedding_service()
        if not payload.provider
        else EmbeddingService(provider=payload.provider)
    )

    if payload.text:
        embedding = service.generate_embedding(payload.text)

        return {
            "provider": service.provider,
            "dimension": len(embedding),
            "embedding": embedding,
        }

    if payload.texts:
        embeddings = service.generate_embeddings_batch(payload.texts)

        return {
            "provider": service.provider,
            "count": len(embeddings),
            "dimension": len(embeddings[0]) if embeddings else 0,
            "embeddings": embeddings,
        }

    raise HTTPException(
        status_code=400,
        detail="Either 'text' or 'texts' must be provided.",
    )


# ============================================================
# KNOWLEDGE CHUNKS
# ============================================================

@router.post("/chunks")
def create_chunk(
    chunk: ChunkCreate,
    db: Session = Depends(get_db),
):
    try:
        student_id = uuid.UUID(chunk.student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    service = get_embedding_service()
    embedding = service.generate_embedding(chunk.text_content)

    new_chunk = KnowledgeChunk(
        student_id=student_id,
        text_content=chunk.text_content,
        topic_tags=chunk.topic_tags or [],
        embedding=embedding,
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
            len(new_chunk.embedding) if new_chunk.embedding is not None else 0
        ),
        "provider": service.provider,
        "created_at": new_chunk.created_at,
    }


@router.get("/chunks")
def list_chunks(
    db: Session = Depends(get_db),
):
    chunks = db.query(KnowledgeChunk).all()

    return {
        "chunks": [
            {
                "chunk_id": str(c.chunk_id),
                "student_id": str(c.student_id),
                "text_content": c.text_content,
                "topic_tags": c.topic_tags,
                "document_id": (
                    str(c.document_id)
                    if getattr(c, "document_id", None)
                    else None
                ),
            }
            for c in chunks
        ]
    }


@router.post("/process-embedding")
def trigger_embedding(
    payload: ChunkCreate,
):
    task = process_chunk_embedding.delay(
        payload.student_id,
        payload.text_content,
    )

    return {"task_id": task.id, "status": "queued"}


# ============================================================
# PDF UPLOAD (async, celery-backed)
# ============================================================

@router.post("/upload-pdf")
async def upload_pdf_file(
    file: UploadFile = File(...),
    student_id: Optional[str] = Form(None),
):
    """
    Upload a PDF and queue it for Celery processing.

    PDF -> Celery -> text extraction/OCR -> chunking -> embeddings -> pgvector
    """

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    if not student_id:
        raise HTTPException(status_code=400, detail="student_id is required.")

    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    db = SessionLocal()
    try:
        student = (
            db.query(Student)
            .filter(Student.student_id == student_uuid)
            .first()
        )

        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
    finally:
        db.close()

    temp_dir = tempfile.gettempdir()
    safe_filename = Path(file.filename).name
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{safe_filename}")

    try:
        with open(temp_path, "wb") as temp_file:
            temp_file.write(file_bytes)

        task = process_pdf_task.delay(
            temp_path,
            safe_filename,
            str(student_uuid),
        )

    except Exception as error:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Failed to queue PDF processing: {error}",
        )

    return {
        "status": "queued",
        "task_id": task.id,
        "filename": safe_filename,
        "student_id": str(student_uuid),
        "message": (
            "PDF queued for background extraction, chunking, and vector embedding."
        ),
    }


@router.get("/task-status/{task_id}")
def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)

    return {
        "task_id": task_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }


# ============================================================
# TEST SUBMISSION
# ============================================================

@router.post("/tests/{test_id}/submit")
def submit_test(
    test_id: str,
    payload: TestSubmission,
    db: Session = Depends(get_db),
):
    try:
        test_uuid = uuid.UUID(test_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid test_id")

    test = db.query(Test).filter(Test.test_id == test_uuid).first()

    if not test:
        raise HTTPException(status_code=404, detail="Test not found")

    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers submitted")

    submitted_answers = {
        answer.question_id: answer.answer.strip() for answer in payload.answers
    }

    results = []
    correct_count = 0

    for question in test.questions:
        question_id = str(question.question_id)
        submitted_answer = submitted_answers.get(question_id)

        is_correct = (
            submitted_answer is not None
            and submitted_answer.lower() == question.correct_answer.strip().lower()
        )

        if is_correct:
            correct_count += 1

        mastery = update_mastery_score(
            db=db,
            student_id=test.student_id,
            subject=test.subject,
            topic=question.topic,
            is_correct=is_correct,
        )

        results.append(
            {
                "question_id": question_id,
                "topic": question.topic,
                "question_text": question.question_text,
                "submitted_answer": submitted_answer,
                "correct_answer": question.correct_answer,
                "is_correct": is_correct,
                "mastery_score": mastery.mastery_score,
                "mastery_percentage": round(mastery.mastery_score * 100, 2),
            }
        )

    total_questions = len(test.questions)
    score_percentage = (
        (correct_count / total_questions) * 100 if total_questions > 0 else 0
    )

    db.commit()

    return {
        "success": True,
        "test_id": str(test.test_id),
        "student_id": str(test.student_id),
        "title": test.title,
        "subject": test.subject,
        "score": correct_count,
        "total_questions": total_questions,
        "score_percentage": round(score_percentage, 2),
        "results": results,
        "message": "Test submitted successfully and mastery updated",
    }


# ============================================================
# DOCUMENTS
# ============================================================

@router.get("/documents/{student_id}")
def get_documents(
    student_id: str,
    db: Session = Depends(get_db),
):
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    docs = (
        db.query(Document)
        .filter(Document.student_id == student_uuid)
        .order_by(Document.created_at.desc())
        .all()
    )

    return {
        "documents": [
            {
                "document_id": str(d.document_id),
                "filename": d.filename,
                "created_at": d.created_at,
            }
            for d in docs
        ]
    }


# ============================================================
# STUDENT MASTERY
# ============================================================

@router.get("/mastery/{student_id}")
def get_mastery(
    student_id: str,
    db: Session = Depends(get_db),
):
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    records = (
        db.query(StudentMastery)
        .filter(StudentMastery.student_id == student_uuid)
        .all()
    )

    return {
        "mastery": [
            {
                "mastery_id": str(r.mastery_id),
                "subject": r.subject,
                "topic": r.topic,
                "score": r.mastery_score,
                "percentage": round(r.mastery_score * 100, 2),
                "correct_answers": r.correct_answers,
                "total_questions": r.total_questions,
            }
            for r in records
        ]
    }


# ============================================================
# STUDENT STRUGGLES
# ============================================================

@router.get("/struggles/{student_id}")
def get_student_struggles(
    student_id: str,
    db: Session = Depends(get_db),
):
    """
    Calculate and return the Top 5 topics where the student is
    most likely to lose marks.

    Struggle Score = (1 - Mastery) x Syllabus Weight x Time Decay
    """
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    student = (
        db.query(Student)
        .filter(Student.student_id == student_uuid)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    struggles = get_top_struggles(db=db, student_id=student_uuid, top_n=5)

    return {
        "success": True,
        "student_id": str(student_uuid),
        "count": len(struggles),
        "top_struggles": struggles,
    }


# ============================================================
# STUDENT TESTS
# ============================================================

@router.get("/tests/{student_id}")
def get_tests(
    student_id: str,
    db: Session = Depends(get_db),
):
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    tests = (
        db.query(Test)
        .filter(Test.student_id == student_uuid)
        .all()
    )

    return {
        "tests": [
            {
                "test_id": str(t.test_id),
                "title": t.title,
                "subject": t.subject,
            }
            for t in tests
        ]
    }


# ============================================================
# GENERATE TEST
# (supports explicit document selection AND RAG/topic fallback)
# ============================================================

@router.post("/tests/generate")
def generate_test(
    req: GenerateTestRequest,
    db: Session = Depends(get_db),
):
    try:
        student_uuid = uuid.UUID(req.student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    student = (
        db.query(Student)
        .filter(Student.student_id == student_uuid)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if req.num_questions < 1:
        raise HTTPException(
            status_code=400, detail="num_questions must be at least 1"
        )

    llm = get_llm_service()
    context_parts: List[str] = []

    # Only PDFs belonging to the logged-in student are accepted, so one
    # student cannot request another student's notes.
    document_ids = list(dict.fromkeys(req.document_ids or []))
    if req.document_id and req.document_id not in document_ids:
        document_ids.append(req.document_id)

    if document_ids:
        # ----------------------------------------------------
        # OPTION 1: Generate from one or more explicit documents
        # ----------------------------------------------------
        try:
            document_uuids = [uuid.UUID(doc_id) for doc_id in document_ids]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document_id")

        documents = (
            db.query(Document)
            .filter(
                Document.student_id == student_uuid,
                Document.document_id.in_(document_uuids),
            )
            .all()
        )

        found_ids = {str(document.document_id) for document in documents}
        missing_ids = [
            doc_id for doc_id in document_ids if doc_id not in found_ids
        ]

        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail="One or more selected PDFs were not found for this student.",
            )

        for document in documents:
            chunks = (
                db.query(KnowledgeChunk)
                .filter(
                    KnowledgeChunk.student_id == student_uuid,
                    KnowledgeChunk.document_id == document.document_id,
                )
                .all()
            )

            if chunks:
                filename = document.filename or "Uploaded Notes"
                context_parts.append(f"\n[SOURCE DOCUMENT: {filename}]\n")
                context_parts.extend(
                    c.text_content for c in chunks if c.text_content
                )

    elif req.topic:
        # ----------------------------------------------------
        # OPTION 2: RAG retrieval scoped to a topic
        # ----------------------------------------------------
        try:
            chunks = retrieve_relevant_chunks(
                db=db,
                student_id=student_uuid,
                query=req.topic,
                top_k=10,
            )
            context_parts.extend(c.text_content for c in chunks if c.text_content)
        except Exception as e:
            logger.error(
                f"Failed to retrieve chunks for topic '{req.topic}': {e}",
                exc_info=True,
            )
            raise HTTPException(
                status_code=500, detail="Failed to retrieve study material."
            )

    else:
        # ----------------------------------------------------
        # OPTION 3: General study material via RAG
        # ----------------------------------------------------
        try:
            chunks = retrieve_relevant_chunks(
                db=db,
                student_id=student_uuid,
                query="general study material",
                top_k=10,
            )
            context_parts.extend(c.text_content for c in chunks if c.text_content)
        except Exception as e:
            logger.error(
                f"Failed to retrieve general study material chunks: {e}",
                exc_info=True,
            )
            raise HTTPException(
                status_code=500, detail="Failed to retrieve study material."
            )

    context = " ".join(context_parts).strip()

    if not context:
        raise HTTPException(
            status_code=404,
            detail=(
                "No processed content was found for the selected PDF(s)/topic. "
                "Please wait for PDF processing to finish or add more notes."
            ),
        )

    try:
        questions = llm.generate_test_questions(context, req.num_questions)
    except Exception as exc:
        logger.exception("Test question generation failed")
        raise HTTPException(
            status_code=502, detail=f"Test generation failed: {exc}"
        ) from exc

    if not questions:
        raise HTTPException(
            status_code=502,
            detail=(
                "No questions were generated. Check the LLM API quota/key and "
                "make sure the selected PDFs/topic contain readable processed text."
            ),
        )

    return {
        "success": True,
        "student_id": str(student_uuid),
        "topic": req.topic,
        "num_questions": req.num_questions,
        "document_ids": document_ids,
        "questions": questions,
    }


# ============================================================
# MASTERY HISTORY
# ============================================================

@router.get("/mastery-history/{student_id}")
def get_mastery_history(
    student_id: str,
    subject: Optional[str] = None,
    topic: Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    query = db.query(MasterySnapshot).filter(
        MasterySnapshot.student_id == student_uuid
    )

    if subject:
        query = query.filter(MasterySnapshot.subject == subject)

    if topic:
        query = query.filter(MasterySnapshot.topic == topic)

    history = query.order_by(MasterySnapshot.snapshot_at.asc()).all()

    return {
        "history": [
            {
                "snapshot_id": str(s.snapshot_id),
                "subject": s.subject,
                "topic": s.topic,
                "correct_answers": s.correct_answers,
                "total_questions": s.total_questions,
                "mastery_score": s.mastery_score,
                "mastery_percentage": round(s.mastery_score * 100, 2),
                "snapshot_at": s.snapshot_at,
            }
            for s in history
        ]
    }


# ============================================================
# STRUGGLE DATA
# ============================================================

@router.get("/struggle-data/{student_id}")
def get_struggle_data(
    student_id: str,
    db: Session = Depends(get_db),
):
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student_id")

    data = get_struggle_input_data(db, student_uuid)

    return {
        "student_id": student_id,
        "topics": [
            {
                "subject": row["subject"],
                "topic": row["topic"],
                "mastery_score": row["mastery_score"],
                "syllabus_weight": row["syllabus_weight"],
                "last_updated_at": row["last_updated_at"],
                "days_since_practice": row["days_since_practice"],
            }
            for row in data
        ],
    }