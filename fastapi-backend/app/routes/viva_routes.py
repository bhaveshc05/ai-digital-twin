import asyncio
import json
import logging
import time
import uuid
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.session import get_db
from database.models import (
    Student,
    Document,
    KnowledgeChunk,
)

from app.services.viva_service import get_viva_service


logger = logging.getLogger(__name__)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/viva",
    tags=["Viva"],
)


# ============================================================
# IN-MEMORY VIVA SESSION STORE
# ============================================================

viva_sessions: Dict[str, Dict[str, Any]] = {}


# ============================================================
# CONSTANTS
# ============================================================

MAX_VIVA_MINUTES = 20
MAX_QUESTIONS = 10


# ============================================================
# REQUEST MODELS
# ============================================================

class StartVivaRequest(BaseModel):
    student_id: str
    document_ids: Optional[list[str]] = None
    document_id: Optional[str] = None
    topic: Optional[str] = None
    max_questions: int = 5


class EndVivaRequest(BaseModel):
    session_id: str


# ============================================================
# CONTEXT / RAG
# ============================================================

def get_context(
    db: Session,
    student_id: str,
    document_ids=None,
    document_id=None,
    topic=None,
) -> str:

    context_parts = []

    selected_ids = list(
        dict.fromkeys(document_ids or [])
    )

    if document_id and document_id not in selected_ids:
        selected_ids.append(document_id)

    # --------------------------------------------------------
    # Selected PDFs
    # --------------------------------------------------------

    if selected_ids:

        documents = (
            db.query(Document)
            .filter(
                Document.student_id == student_id,
                Document.document_id.in_(selected_ids),
            )
            .all()
        )

        found_ids = {
            str(document.document_id)
            for document in documents
        }

        missing = [
            doc_id
            for doc_id in selected_ids
            if str(doc_id) not in found_ids
        ]

        if missing:
            raise HTTPException(
                status_code=404,
                detail=(
                    "One or more selected documents "
                    "were not found for this student."
                ),
            )

        for document in documents:

            chunks = (
                db.query(KnowledgeChunk)
                .filter(
                    KnowledgeChunk.student_id == student_id,
                    KnowledgeChunk.document_id
                    == document.document_id,
                )
                .all()
            )

            if chunks:

                context_parts.append(
                    f"\n[SOURCE: {document.filename}]\n"
                )

                context_parts.extend(
                    chunk.text_content
                    for chunk in chunks
                    if chunk.text_content
                )

    # --------------------------------------------------------
    # Topic fallback
    # --------------------------------------------------------

    elif topic:

        chunks = (
            db.query(KnowledgeChunk)
            .filter(
                KnowledgeChunk.student_id == student_id,
            )
            .limit(20)
            .all()
        )

        context_parts.extend(
            chunk.text_content
            for chunk in chunks
            if chunk.text_content
        )

    return "\n".join(context_parts).strip()


# ============================================================
# CREATE SESSION
# ============================================================

def create_session(
    student_id: str,
    context: str,
    max_questions: int,
    topic: Optional[str] = None,
):

    session_id = str(uuid.uuid4())

    session = {
        "session_id": session_id,
        "student_id": student_id,
        "topic": topic or "General",
        "context": context,
        "status": "active",

        "started_at": time.time(),
        "last_activity": time.time(),

        "question_number": 0,
        "current_question": None,
        "current_topic": topic or "General",

        "exchanges": [],

        "max_questions": min(
            max(1, max_questions),
            MAX_QUESTIONS,
        ),

        "websocket": None,
    }

    viva_sessions[session_id] = session

    return session


# ============================================================
# SESSION TIMEOUT
# ============================================================

def session_expired(session):

    elapsed = (
        time.time()
        - session["started_at"]
    )

    return elapsed >= MAX_VIVA_MINUTES * 60


# ============================================================
# SAFE WEBSOCKET SEND
# ============================================================

async def safe_send(
    websocket: WebSocket,
    payload: Dict[str, Any],
):

    try:

        await websocket.send_json(payload)

        return True

    except Exception as exc:

        logger.warning(
            "WebSocket send failed: %s",
            exc,
        )

        return False


# ============================================================
# START VIVA
# ============================================================

@router.post("/start")
def start_viva(
    payload: StartVivaRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Validate student UUID
    # --------------------------------------------------------

    try:

        student_uuid = uuid.UUID(
            payload.student_id
        )

    except (ValueError, AttributeError):

        raise HTTPException(
            status_code=400,
            detail="Invalid student_id.",
        )

    # --------------------------------------------------------
    # Validate student
    # --------------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.student_id == student_uuid
        )
        .first()
    )

    if not student:

        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    # --------------------------------------------------------
    # Get RAG context
    # --------------------------------------------------------

    context = get_context(
        db=db,
        student_id=payload.student_id,
        document_ids=payload.document_ids,
        document_id=payload.document_id,
        topic=payload.topic,
    )

    if not context:

        raise HTTPException(
            status_code=404,
            detail=(
                "No processed study material was found. "
                "Please upload and process a PDF first."
            ),
        )

    # --------------------------------------------------------
    # Create session
    # --------------------------------------------------------

    session = create_session(
        student_id=payload.student_id,
        context=context,
        max_questions=payload.max_questions,
        topic=payload.topic,
    )

    # --------------------------------------------------------
    # Generate first question
    # --------------------------------------------------------

    viva_service = get_viva_service()

    try:

        question = viva_service.generate_question(
            context=context,
            question_number=1,
        )

    except Exception as exc:

        logger.exception(
            "Initial viva question generation failed: %s",
            exc,
        )

        viva_sessions.pop(
            session["session_id"],
            None,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to generate the first viva question.",
        )

    session["question_number"] = 1

    session["current_question"] = (
        question.get("question", "")
    )

    session["current_topic"] = (
        question.get("topic", "General")
    )

    return {
        "success": True,
        "session_id": session["session_id"],
        "status": session["status"],
        "question": question,
        "question_number": 1,
        "message": "Viva session started successfully.",
    }


# ============================================================
# END VIVA
# ============================================================

@router.post("/end")
def end_viva(
    payload: EndVivaRequest,
):

    session = viva_sessions.get(
        payload.session_id
    )

    if not session:

        raise HTTPException(
            status_code=404,
            detail="Viva session not found.",
        )

    session["status"] = "completed"
    session["websocket"] = None

    viva_service = get_viva_service()

    try:

        summary = viva_service.generate_summary(
            session["exchanges"]
        )

    except Exception as exc:

        logger.exception(
            "Viva summary generation failed: %s",
            exc,
        )

        summary = {
            "message": "Viva completed.",
            "error": "Summary generation failed.",
        }

    return {
        "success": True,
        "session_id": session["session_id"],
        "status": "completed",
        "summary": summary,
        "transcript": session["exchanges"],
    }


# ============================================================
# GET VIVA SESSION
# ============================================================

@router.get("/{session_id}")
def get_viva_session(
    session_id: str,
):

    session = viva_sessions.get(
        session_id
    )

    if not session:

        raise HTTPException(
            status_code=404,
            detail="Viva session not found.",
        )

    return {
        "success": True,
        "session_id": session_id,
        "status": session["status"],
        "question_number": session["question_number"],
        "current_question": session["current_question"],
        "current_topic": session["current_topic"],
        "exchanges": session["exchanges"],
    }


# ============================================================
# WEBSOCKET
# ============================================================

@router.websocket("/ws/{session_id}")
async def viva_websocket(
    websocket: WebSocket,
    session_id: str,
):

    # --------------------------------------------------------
    # Validate session BEFORE accepting WebSocket
    # --------------------------------------------------------

    session = viva_sessions.get(
        session_id
    )

    if not session:

        await websocket.close(
            code=4004,
            reason="Viva session not found",
        )

        return

    # --------------------------------------------------------
    # Accept connection
    # --------------------------------------------------------

    await websocket.accept()

    # --------------------------------------------------------
    # Handle reconnect
    # --------------------------------------------------------

    old_websocket = session.get(
        "websocket"
    )

    if old_websocket is not None:

        try:
            await old_websocket.close(
                code=4000,
                reason="Replaced by new connection",
            )
        except Exception:
            pass

    session["websocket"] = websocket
    session["last_activity"] = time.time()

    logger.info(
        "Viva WebSocket connected: %s",
        session_id,
    )

    # --------------------------------------------------------
    # Connection confirmation
    # --------------------------------------------------------

    await safe_send(
        websocket,
        {
            "type": "connection",
            "status": "connected",
            "session_id": session_id,
            "message": "Viva WebSocket connected successfully.",
        },
    )

    # --------------------------------------------------------
    # Send current question
    # Useful after reconnect
    # --------------------------------------------------------

    if (
        session["status"] == "active"
        and session["current_question"]
    ):

        await safe_send(
            websocket,
            {
                "type": "question",
                "question": session["current_question"],
                "question_number": session["question_number"],
                "topic": session["current_topic"],
                "status": "waiting_for_answer",
            },
        )

    # ========================================================
    # MESSAGE LOOP
    # ========================================================

    try:

        while True:

            # ------------------------------------------------
            # Timeout
            # ------------------------------------------------

            if session_expired(session):

                session["status"] = "completed"

                viva_service = get_viva_service()

                try:

                    summary = (
                        viva_service.generate_summary(
                            session["exchanges"]
                        )
                    )

                except Exception:

                    summary = {
                        "message": "Viva timed out."
                    }

                await safe_send(
                    websocket,
                    {
                        "type": "session_timeout",
                        "status": "completed",
                        "summary": summary,
                        "transcript": session[
                            "exchanges"
                        ],
                    },
                )

                break

            # ------------------------------------------------
            # Receive message
            # ------------------------------------------------

            raw_message = (
                await websocket.receive_text()
            )

            session["last_activity"] = time.time()

            # ------------------------------------------------
            # Parse JSON
            # ------------------------------------------------

            try:

                message = json.loads(
                    raw_message
                )

            except json.JSONDecodeError:

                await safe_send(
                    websocket,
                    {
                        "type": "error",
                        "code": "INVALID_JSON",
                        "message": (
                            "Message must be valid JSON."
                        ),
                    },
                )

                continue

            if not isinstance(message, dict):

                await safe_send(
                    websocket,
                    {
                        "type": "error",
                        "code": "INVALID_MESSAGE",
                        "message": (
                            "WebSocket message must be a JSON object."
                        ),
                    },
                )

                continue

            message_type = message.get(
                "type"
            )

            # =================================================
            # PING
            # =================================================

            if message_type == "ping":

                await safe_send(
                    websocket,
                    {
                        "type": "pong",
                        "timestamp": time.time(),
                    },
                )

                continue

            # =================================================
            # END SESSION
            # =================================================

            if message_type == "end":

                session["status"] = "completed"

                viva_service = get_viva_service()

                try:

                    summary = (
                        viva_service.generate_summary(
                            session["exchanges"]
                        )
                    )

                except Exception:

                    summary = {
                        "message": "Viva completed."
                    }

                await safe_send(
                    websocket,
                    {
                        "type": "session_ended",
                        "status": "completed",
                        "summary": summary,
                        "transcript": session[
                            "exchanges"
                        ],
                    },
                )

                break

            # =================================================
            # STUDENT ANSWER / TRANSCRIPT
            # =================================================

            if message_type in (
                "answer",
                "transcript",
            ):

                answer = str(
                    message.get(
                        "text",
                        message.get(
                            "answer",
                            "",
                        ),
                    )
                ).strip()

                if not answer:

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": "EMPTY_ANSWER",
                            "message": (
                                "No answer was received."
                            ),
                        },
                    )

                    continue

                # ------------------------------------------------
                # Active question check
                # ------------------------------------------------

                if not session["current_question"]:

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": "NO_ACTIVE_QUESTION",
                            "message": (
                                "There is no active viva question."
                            ),
                        },
                    )

                    continue

                question = session[
                    "current_question"
                ]

                topic = session[
                    "current_topic"
                ]

                question_number = session[
                    "question_number"
                ]

                # ------------------------------------------------
                # Evaluation started
                # ------------------------------------------------

                await safe_send(
                    websocket,
                    {
                        "type": "evaluation_started",
                        "question_number": question_number,
                    },
                )

                # ------------------------------------------------
                # Evaluate answer
                # ------------------------------------------------

                viva_service = get_viva_service()

                try:

                    evaluation = (
                        await asyncio.to_thread(
                            viva_service.evaluate_answer,
                            session["context"],
                            question,
                            answer,
                            topic,
                        )
                    )

                except Exception as exc:

                    logger.exception(
                        "Viva evaluation error: %s",
                        exc,
                    )

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": "EVALUATION_FAILED",
                            "message": (
                                "Unable to evaluate the answer."
                            ),
                        },
                    )

                    continue

                # ------------------------------------------------
                # Save exchange
                # ------------------------------------------------

                exchange = {
                    "question_number": question_number,
                    "question": question,
                    "answer": answer,
                    "topic": topic,
                    "evaluation": evaluation,
                    "timestamp": time.time(),
                }

                session["exchanges"].append(
                    exchange
                )

                # ------------------------------------------------
                # Send evaluation
                # ------------------------------------------------

                await safe_send(
                    websocket,
                    {
                        "type": "evaluation",
                        "question_number": question_number,
                        "question": question,
                        "answer": answer,
                        "evaluation": evaluation,
                    },
                )

                # ------------------------------------------------
                # Maximum questions reached
                # ------------------------------------------------

                if (
                    question_number
                    >= session["max_questions"]
                ):

                    session["status"] = "completed"

                    try:

                        summary = (
                            viva_service.generate_summary(
                                session["exchanges"]
                            )
                        )

                    except Exception:

                        summary = {
                            "message": "Viva completed."
                        }

                    await safe_send(
                        websocket,
                        {
                            "type": "session_completed",
                            "status": "completed",
                            "summary": summary,
                            "transcript": session[
                                "exchanges"
                            ],
                        },
                    )

                    break

                # ------------------------------------------------
                # Generate next follow-up
                # ------------------------------------------------

                next_question_number = (
                    question_number + 1
                )

                try:

                    next_question = (
                        await asyncio.to_thread(
                            viva_service.generate_question,
                            context=session["context"],
                            previous_question=question,
                            previous_answer=answer,
                            question_number=next_question_number,
                        )
                    )

                except TypeError:

                    # Compatibility fallback if your current
                    # viva_service uses positional arguments.
                    try:

                        next_question = (
                            await asyncio.to_thread(
                                viva_service.generate_question,
                                session["context"],
                                question,
                                answer,
                                next_question_number,
                            )
                        )

                    except Exception as exc:

                        logger.exception(
                            "Follow-up generation error: %s",
                            exc,
                        )

                        await safe_send(
                            websocket,
                            {
                                "type": "error",
                                "code": (
                                    "QUESTION_GENERATION_FAILED"
                                ),
                                "message": (
                                    "Unable to generate the next question."
                                ),
                            },
                        )

                        continue

                except Exception as exc:

                    logger.exception(
                        "Follow-up generation error: %s",
                        exc,
                    )

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": (
                                "QUESTION_GENERATION_FAILED"
                            ),
                            "message": (
                                "Unable to generate the next question."
                            ),
                        },
                    )

                    continue

                # ------------------------------------------------
                # Validate generated question
                # ------------------------------------------------

                if not isinstance(
                    next_question,
                    dict,
                ):

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": (
                                "INVALID_QUESTION_RESPONSE"
                            ),
                            "message": (
                                "Examiner returned an invalid question."
                            ),
                        },
                    )

                    continue

                generated_question = (
                    next_question.get(
                        "question"
                    )
                )

                if not generated_question:

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": (
                                "EMPTY_QUESTION"
                            ),
                            "message": (
                                "Examiner generated an empty question."
                            ),
                        },
                    )

                    continue

                # ------------------------------------------------
                # Update session state
                # ------------------------------------------------

                session["question_number"] = (
                    next_question_number
                )

                session["current_question"] = (
                    generated_question
                )

                session["current_topic"] = (
                    next_question.get(
                        "topic",
                        "General",
                    )
                )

                # ------------------------------------------------
                # Send next question
                # ------------------------------------------------

                await safe_send(
                    websocket,
                    {
                        "type": "question",
                        "question": generated_question,
                        "question_number": next_question_number,
                        "topic": session["current_topic"],
                        "status": "waiting_for_answer",
                    },
                )

                continue

            # =================================================
            # AUDIO
            # =================================================

            if message_type == "audio":

                audio_data = message.get(
                    "data"
                )

                if not audio_data:

                    await safe_send(
                        websocket,
                        {
                            "type": "error",
                            "code": "EMPTY_AUDIO",
                            "message": (
                                "Audio data was not received."
                            ),
                        },
                    )

                    continue

                # ------------------------------------------------
                # Member 3 / Whisper integration point
                # ------------------------------------------------

                await safe_send(
                    websocket,
                    {
                        "type": "audio_received",
                        "message": (
                            "Audio received successfully. "
                            "Waiting for speech-to-text processing."
                        ),
                    },
                )

                continue

            # =================================================
            # UNKNOWN MESSAGE
            # =================================================

            await safe_send(
                websocket,
                {
                    "type": "error",
                    "code": "UNKNOWN_MESSAGE_TYPE",
                    "message": (
                        f"Unsupported message type: "
                        f"{message_type}"
                    ),
                },
            )

    # ========================================================
    # DISCONNECT
    # ========================================================

    except WebSocketDisconnect:

        logger.info(
            "Viva WebSocket disconnected: %s",
            session_id,
        )

        # Keep active session alive so React can reconnect.
        if session["status"] == "active":

            session["websocket"] = None

            logger.info(
                "Viva session kept alive for reconnect: %s",
                session_id,
            )

    # ========================================================
    # UNEXPECTED ERROR
    # ========================================================

    except Exception as exc:

        logger.exception(
            "Unexpected Viva WebSocket error: %s",
            exc,
        )

        session["websocket"] = None

        try:

            await safe_send(
                websocket,
                {
                    "type": "error",
                    "code": "WEBSOCKET_ERROR",
                    "message": (
                        "Unexpected server error."
                    ),
                },
            )

        except Exception:
            pass

    # ========================================================
    # CLEANUP
    # ========================================================

    finally:

        # Only clear the socket if this connection is still
        # the active connection.
        if session.get("websocket") is websocket:

            session["websocket"] = None

