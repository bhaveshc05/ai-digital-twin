import uuid
import os
import sys
import base64
import hashlib
import secrets

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

# ------------------------------------------------------------
# Ensure project root can be imported
# ------------------------------------------------------------

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../..")
    )
)

# ------------------------------------------------------------
# Database
# ------------------------------------------------------------

from database.session import get_db

from database.models import (
    Student,
    KnowledgeChunk,
    Document,
    StudentMastery,
    MasterySnapshot,
    Test,
    TestQuestion,
)

# ------------------------------------------------------------
# Services
# ------------------------------------------------------------

from app.services.embedding_service import (
    get_embedding_service,
    EmbeddingService,
)

from app.services.mastery_service import (
    update_mastery_score,
)

from app.services.llm_service import (
    get_llm_service,
)

# ------------------------------------------------------------
# Celery
# ------------------------------------------------------------

from worker.celery_app import celery_app

from worker.tasks import (
    process_chunk_embedding,
    process_pdf_ingestion,
    process_pdf_task,
)

# ------------------------------------------------------------
# Router
# ------------------------------------------------------------

router = APIRouter()


# ============================================================
# PASSWORD HELPERS
# ============================================================

def hash_password(password: str) -> str:
    """
    Secure password hashing using PBKDF2.
    """

    salt = secrets.token_hex(16)

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )

    return f"{salt}${hashed.hex()}"


def verify_password(
    password: str,
    stored_hash: str,
) -> bool:
    """
    Verify password against stored hash.
    """

    try:
        salt, saved_hash = stored_hash.split("$")

        hashed = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        )

        return secrets.compare_digest(
            hashed.hex(),
            saved_hash,
        )

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
    document_id: Optional[str] = None
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
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not student.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Password not configured for this account",
        )

    if not verify_password(
        payload.password,
        student.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

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
# CREATE STUDENT / SIGNUP
# ============================================================

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
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    new_student = Student(
        email=student.email,
        full_name=student.full_name,
        password_hash=hash_password(student.password),
        board=student.board,
        grade=student.grade,
        guardian_email=student.guardian_email,
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
# LIST STUDENTS
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
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id",
        )

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

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
        "mastery_percentage": round(
            mastery.mastery_score * 100,
            2,
        ),
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
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id",
        )

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    if not payload.questions:
        raise HTTPException(
            status_code=400,
            detail="Test must contain at least one question",
        )

    new_test = Test(
        student_id=student_id,
        title=payload.title,
        subject=payload.subject,
    )

    db.add(new_test)
    db.flush()

    for question in payload.questions:
        new_question = TestQuestion(
            test_id=new_test.test_id,
            topic=question.topic,
            question_text=question.question_text,
            correct_answer=question.correct_answer,
        )

        db.add(new_question)

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
                "question_id": str(question.question_id),
                "topic": question.topic,
                "question_text": question.question_text,
            }
            for question in new_test.questions
        ],
        "message": "Test created successfully",
    }


# ============================================================
# TEST SUBMISSION + AUTOMATIC MASTERY UPDATE
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
        raise HTTPException(
            status_code=400,
            detail="Invalid test_id",
        )

    test = (
        db.query(Test)
        .filter(Test.test_id == test_uuid)
        .first()
    )

    if not test:
        raise HTTPException(
            status_code=404,
            detail="Test not found",
        )

    if not payload.answers:
        raise HTTPException(
            status_code=400,
            detail="No answers submitted",
        )

    submitted_answers = {
        answer.question_id: answer.answer.strip()
        for answer in payload.answers
    }

    results = []
    correct_count = 0

    for question in test.questions:

        question_id = str(question.question_id)

        submitted_answer = submitted_answers.get(
            question_id
        )

        is_correct = (
            submitted_answer is not None
            and submitted_answer.lower()
            == question.correct_answer.strip().lower()
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
                "mastery_percentage": round(
                    mastery.mastery_score * 100,
                    2,
                ),
            }
        )

    total_questions = len(test.questions)

    score_percentage = (
        correct_count / total_questions * 100
        if total_questions
        else 0
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
        "score_percentage": round(
            score_percentage,
            2,
        ),
        "results": results,
        "message": (
            "Test submitted successfully "
            "and mastery updated"
        ),
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
        else EmbeddingService(
            provider=payload.provider
        )
    )

    if payload.text:

        embedding = service.generate_embedding(
            payload.text
        )

        return {
            "provider": service.provider,
            "dimension": len(embedding),
            "embedding": embedding,
        }

    if payload.texts:

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
            "embeddings": embeddings,
        }

    raise HTTPException(
        status_code=400,
        detail=(
            "Either 'text' or 'texts' field "
            "must be provided."
        ),
    )


# ============================================================
# CREATE KNOWLEDGE CHUNK
# ============================================================

@router.post("/chunks")
def create_chunk(
    chunk: ChunkCreate,
    db: Session = Depends(get_db),
):
    try:
        student_id = uuid.UUID(chunk.student_id)

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id",
        )

    student = (
        db.query(Student)
        .filter(Student.student_id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found",
        )

    service = get_embedding_service()

    embedding = service.generate_embedding(
        chunk.text_content
    )

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
            len(new_chunk.embedding)
            if new_chunk.embedding is not None
            else 0
        ),
        "provider": service.provider,
        "created_at": new_chunk.created_at,
    }


# ============================================================
# LIST KNOWLEDGE CHUNKS
# ============================================================

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
            }
            for c in chunks
        ]
    }


# ============================================================
# CELERY EMBEDDING
# ============================================================

@router.post("/process-embedding")
def trigger_embedding(
    payload: ChunkCreate,
):
    task = process_chunk_embedding.delay(
        payload.student_id,
        payload.text_content,
    )

    return {
        "task_id": task.id,
        "status": "queued",
    }


# ============================================================
# PDF UPLOAD
# ============================================================

@router.post("/upload-pdf")
async def upload_pdf_file(
    file: UploadFile = File(...),
    student_id: Optional[str] = Form(None),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    if not student_id:
        raise HTTPException(
            status_code=400,
            detail="student_id is required.",
        )

    try:
        uuid.UUID(student_id)

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid student_id.",
        )

    upload_dir = Path("uploads")

    upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    file_id = uuid.uuid4()

    safe_filename = Path(
        file.filename
    ).name

    file_path = (
        upload_dir
        / f"{file_id}_{safe_filename}"
    )

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    task = process_pdf_task.delay(
        str(file_path),
        safe_filename,
        student_id,
    )

    return {
        "status": "success",
        "filename": safe_filename,
        "message": (
            "PDF uploaded successfully. "
            "Background processing started."
        ),
        "size": len(file_bytes),
        "task_id": task.id,
    }


# ============================================================
# TASK STATUS
# ============================================================

@router.get("/task-status/{task_id}")
def get_task_status(
    task_id: str,
):
    if task_id == "inline-complete":
        return {
            "task_id": task_id,
            "status": "SUCCESS",
            "result": {
                "status": "success",
            },
        }

    result = celery_app.AsyncResult(
        task_id
    )

    return {
        "task_id": task_id,
        "status": result.status,
        "result": (
            result.result
            if result.ready()
            else None
        ),
    }


# ============================================================
# DOCUMENTS
# ============================================================

@router.get("/documents/{student_id}")
def get_documents(
    student_id: str,
    db: Session = Depends(get_db),
):
    docs = (
        db.query(Document)
        .filter(
            Document.student_id == student_id
        )
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
# GET MASTERY
# ============================================================

@router.get("/mastery/{student_id}")
def get_mastery(
    student_id: str,
    db: Session = Depends(get_db),
):
    records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id
        )
        .all()
    )

    return {
        "mastery": [
            {
                "subject": record.subject,
                "topic": record.topic,
                "score": record.mastery_score,
                "percentage": round(
                    record.mastery_score * 100,
                    2,
                ),
                "correct_answers": (
                    record.correct_answers
                ),
                "total_questions": (
                    record.total_questions
                ),
            }
            for record in records
        ]
    }


# ============================================================
# STUDENT TESTS
# ============================================================

@router.get("/tests/{student_id}")
def get_tests(
    student_id: str,
    db: Session = Depends(get_db),
):
    tests = (
        db.query(Test)
        .filter(
            Test.student_id == student_id
        )
        .all()
    )

    return {
        "tests": [
            {
                "test_id": str(test.test_id),
                "title": test.title,
                "subject": test.subject,
            }
            for test in tests
        ]
    }


# ============================================================
# GENERATE TEST
# ============================================================

@router.post("/tests/generate")
def generate_test(
    req: GenerateTestRequest,
    db: Session = Depends(get_db),
):
    llm = get_llm_service()

    context = ""

    if req.document_id:

        chunks = (
            db.query(KnowledgeChunk)
            .filter(
                KnowledgeChunk.document_id
                == req.document_id
            )
            .all()
        )

        context = " ".join(
            chunk.text_content
            for chunk in chunks
        )

    elif req.topic:

        chunks = (
            db.query(KnowledgeChunk)
            .filter(
                KnowledgeChunk.student_id
                == req.student_id
            )
            .limit(10)
            .all()
        )

        context = " ".join(
            chunk.text_content
            for chunk in chunks
        )

    questions = llm.generate_test_questions(
        context,
        req.num_questions,
    )

    return {
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
    query = (
        db.query(MasterySnapshot)
        .filter(
            MasterySnapshot.student_id
            == student_id
        )
    )

    if subject:
        query = query.filter(
            MasterySnapshot.subject == subject
        )

    if topic:
        query = query.filter(
            MasterySnapshot.topic == topic
        )

    history = (
        query
        .order_by(
            MasterySnapshot.snapshot_at.asc()
        )
        .all()
    )

    return {
        "history": [
            {
                "snapshot_id": str(
                    snapshot.snapshot_id
                ),
                "subject": snapshot.subject,
                "topic": snapshot.topic,
                "correct_answers": (
                    snapshot.correct_answers
                ),
                "total_questions": (
                    snapshot.total_questions
                ),
                "mastery_score": (
                    snapshot.mastery_score
                ),
                "mastery_percentage": round(
                    snapshot.mastery_score * 100,
                    2,
                ),
                "snapshot_at": (
                    snapshot.snapshot_at
                ),
            }
            for snapshot in history
        ]
    }