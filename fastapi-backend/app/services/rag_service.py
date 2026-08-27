from typing import List, Any

from sqlalchemy.orm import Session

from langchain_core.documents import Document as LCDocument
from langchain_core.retrievers import BaseRetriever

from database.models import KnowledgeChunk
from app.services.embedding_service import get_embedding_service


# ============================================================
# LANGCHAIN + PGVECTOR RETRIEVER
# ============================================================

class StudentPGVectorRetriever(BaseRetriever):
    """
    LangChain-compatible retriever using the existing
    PostgreSQL + pgvector KnowledgeChunk table.

    Flow:

        Query
          ↓
        LangChain Retriever
          ↓
        Embedding Service
          ↓
        Query Embedding
          ↓
        PostgreSQL + pgvector
          ↓
        Cosine Similarity
          ↓
        Top-K Relevant Chunks
          ↓
        LangChain Documents
    """

    db: Any
    student_id: Any
    top_k: int = 5

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager=None,
    ) -> List[LCDocument]:

        if not query or not query.strip():
            return []

        # ----------------------------------------------------
        # Get embedding service
        # ----------------------------------------------------

        embedding_service = get_embedding_service()

        # ----------------------------------------------------
        # Convert query into embedding
        # ----------------------------------------------------

        query_embedding = (
            embedding_service.generate_embedding(
                query.strip()
            )
        )

        # ----------------------------------------------------
        # PostgreSQL + pgvector similarity search
        # ----------------------------------------------------

        chunks = (
            self.db.query(KnowledgeChunk)
            .filter(
                KnowledgeChunk.student_id == self.student_id,
                KnowledgeChunk.embedding.isnot(None),
            )
            .order_by(
                KnowledgeChunk.embedding.cosine_distance(
                    query_embedding
                )
            )
            .limit(self.top_k)
            .all()
        )

        # ----------------------------------------------------
        # Convert database records to LangChain Documents
        # ----------------------------------------------------

        documents = []

        for chunk in chunks:

            metadata = {
                "chunk_id": str(chunk.chunk_id),
                "student_id": str(chunk.student_id),
                "document_id": (
                    str(chunk.document_id)
                    if chunk.document_id
                    else None
                ),
                "topic_tags": chunk.topic_tags or [],
            }

            documents.append(
                LCDocument(
                    page_content=chunk.text_content,
                    metadata=metadata,
                )
            )

        return documents


# ============================================================
# CREATE STUDENT RETRIEVER
# ============================================================

def get_student_retriever(
    db: Session,
    student_id,
    top_k: int = 5,
):
    """
    Create a LangChain retriever for one student.
    """

    return StudentPGVectorRetriever(
        db=db,
        student_id=student_id,
        top_k=top_k,
    )


# ============================================================
# RETRIEVE RELEVANT CHUNKS
# ============================================================

def retrieve_relevant_chunks(
    db: Session,
    student_id,
    query: str,
    top_k: int = 5,
):
    """
    Retrieve relevant student knowledge chunks using:

        LangChain
        +
        PostgreSQL
        +
        pgvector
        +
        cosine similarity

    This function keeps the same interface already used
    by routes.py.
    """

    if not query or not query.strip():
        return []

    # --------------------------------------------------------
    # Create LangChain retriever
    # --------------------------------------------------------

    retriever = get_student_retriever(
        db=db,
        student_id=student_id,
        top_k=top_k,
    )

    # --------------------------------------------------------
    # LangChain retrieval
    # --------------------------------------------------------

    documents = retriever.invoke(
        query.strip()
    )

    if not documents:
        return []

    # --------------------------------------------------------
    # Get original database chunk IDs
    # --------------------------------------------------------

    chunk_ids = []

    for document in documents:

        chunk_id = document.metadata.get(
            "chunk_id"
        )

        if chunk_id:
            chunk_ids.append(
                str(chunk_id)
            )

    if not chunk_ids:
        return []

    # --------------------------------------------------------
    # Fetch original KnowledgeChunk objects
    #
    # routes.py expects:
    #
    # chunk.text_content
    # --------------------------------------------------------

    chunks = (
        db.query(KnowledgeChunk)
        .filter(
            KnowledgeChunk.student_id == student_id,
            KnowledgeChunk.chunk_id.in_(chunk_ids),
        )
        .all()
    )

    # --------------------------------------------------------
    # Preserve LangChain retrieval ranking
    # --------------------------------------------------------

    chunk_map = {
        str(chunk.chunk_id): chunk
        for chunk in chunks
    }

    ordered_chunks = []

    for chunk_id in chunk_ids:

        chunk = chunk_map.get(
            str(chunk_id)
        )

        if chunk:
            ordered_chunks.append(
                chunk
            )

    return ordered_chunks