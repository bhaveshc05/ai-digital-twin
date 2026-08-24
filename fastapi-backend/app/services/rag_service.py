from sqlalchemy.orm import Session

from database.models import KnowledgeChunk
from app.services.embedding_service import get_embedding_service


def retrieve_relevant_chunks(
    db: Session,
    student_id,
    query: str,
    top_k: int = 5,
):
    """
    Retrieve the most relevant knowledge chunks
    using pgvector cosine similarity.
    """

    embedding_service = get_embedding_service()

    # Convert user's query/topic into an embedding
    query_embedding = embedding_service.generate_embedding(query)

    # pgvector cosine distance
    results = (
        db.query(KnowledgeChunk)
        .filter(
            KnowledgeChunk.student_id == student_id,
            KnowledgeChunk.embedding.isnot(None),
        )
        .order_by(
            KnowledgeChunk.embedding.cosine_distance(
                query_embedding
            )
        )
        .limit(top_k)
        .all()
    )

    return results