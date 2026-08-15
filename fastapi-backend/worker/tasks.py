import os
import uuid
import logging

from worker.celery_app import celery_app
from database.session import SessionLocal
from database.models import Document, KnowledgeChunk

from app.services.pdf_service import (
    extract_text_from_pdf,
    chunk_text,
)

from app.services.embedding_service import (
    get_embedding_service,
)

logger = logging.getLogger(__name__)


# ============================================================
# OLD TEST / EMBEDDING TASK
# ============================================================

@celery_app.task(name="process_chunk_embedding")
def process_chunk_embedding(
    chunk_id: str,
    text: str
):
    """
    Test task for verifying Celery + Redis.
    """

    print(
        f"[Worker] Processing embedding "
        f"for chunk_id: {chunk_id}"
    )

    return {
        "status": "success",
        "chunk_id": chunk_id,
    }


# ============================================================
# ACTUAL PDF PROCESSING TASK
# ============================================================

@celery_app.task(name="process_pdf")
def process_pdf_task(
    file_path: str,
    filename: str,
    student_id: str,
):
    """
    Complete PDF processing pipeline:

    PDF
      ↓
    Text extraction / OCR
      ↓
    Chunking
      ↓
    Embedding generation
      ↓
    PostgreSQL + pgvector
    """

    db = SessionLocal()

    try:

        print("=" * 60)
        print("[Worker] PDF processing started")
        print(f"[Worker] File: {filename}")
        print(f"[Worker] Student ID: {student_id}")

        # --------------------------------------------------
        # 1. Read PDF
        # --------------------------------------------------

        with open(file_path, "rb") as f:
            pdf_bytes = f.read()

        print("[Worker] PDF loaded successfully")

        # --------------------------------------------------
        # 2. Extract text
        # --------------------------------------------------

        text = extract_text_from_pdf(pdf_bytes)

        if (
            not text
            or text.startswith("No extractable")
        ):
            raise ValueError(
                "No text could be extracted from the PDF."
            )

        print(
            f"[Worker] Text extracted: "
            f"{len(text)} characters"
        )

        # --------------------------------------------------
        # 3. Create document record
        # --------------------------------------------------

        student_uuid = uuid.UUID(student_id)

        document = Document(
            student_id=student_uuid,
            filename=filename,
        )

        db.add(document)
        db.flush()

        print(
            f"[Worker] Document created: "
            f"{document.document_id}"
        )

        # --------------------------------------------------
        # 4. Chunk text
        # --------------------------------------------------

        chunks = chunk_text(text)

        if not chunks:
            raise ValueError(
                "No chunks were generated from the PDF."
            )

        print(
            f"[Worker] Generated "
            f"{len(chunks)} chunks"
        )

        # --------------------------------------------------
        # 5. Generate embeddings
        # --------------------------------------------------

        embedding_service = (
            get_embedding_service()
        )

        embeddings = (
            embedding_service
            .generate_embeddings_batch(chunks)
        )

        print(
            f"[Worker] Generated "
            f"{len(embeddings)} embeddings"
        )

        # --------------------------------------------------
        # 6. Store chunks + embeddings
        # --------------------------------------------------

        for chunk, embedding in zip(
            chunks,
            embeddings
        ):

            knowledge_chunk = KnowledgeChunk(
                student_id=student_uuid,
                text_content=chunk,
                topic_tags=[],
                embedding=embedding,
                document_id=document.document_id,
            )

            db.add(knowledge_chunk)

        # --------------------------------------------------
        # 7. Commit
        # --------------------------------------------------

        db.commit()

        print(
            f"[Worker] Successfully stored "
            f"{len(chunks)} knowledge chunks"
        )

        print("[Worker] PDF processing completed")
        print("=" * 60)

        return {
            "status": "success",
            "filename": filename,
            "document_id": str(
                document.document_id
            ),
            "chunks_created": len(chunks),
            "embeddings_created": len(embeddings),
        }

    except Exception as e:

        db.rollback()

        logger.exception(
            "[Worker] PDF processing failed"
        )

        raise

    finally:

        db.close()

        # --------------------------------------------------
        # 8. Delete temporary PDF
        # --------------------------------------------------

        if os.path.exists(file_path):

            try:
                os.remove(file_path)

                print(
                    "[Worker] Temporary PDF deleted"
                )

            except Exception as cleanup_error:

                logger.warning(
                    "Could not delete temporary PDF: %s",
                    cleanup_error,
                )