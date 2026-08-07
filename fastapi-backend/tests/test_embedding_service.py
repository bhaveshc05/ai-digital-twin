import os
import sys

# Ensure app package can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.services.embedding_service import EmbeddingService, FallbackEmbeddings, TARGET_VECTOR_DIM


def test_fallback_embeddings():
    fallback = FallbackEmbeddings()
    vector = fallback.embed_query("Physics and Quantum Mechanics")
    assert isinstance(vector, list)
    assert len(vector) == TARGET_VECTOR_DIM
    assert isinstance(vector[0], float)

    # Verify normalization (unit length ~ 1.0)
    magnitude = sum(x * x for x in vector)
    assert abs(magnitude - 1.0) < 1e-4


def test_embedding_service_single_and_batch():
    service = EmbeddingService(provider="fallback")
    
    # Test single embedding
    vec = service.generate_embedding("Organic Chemistry Reaction Mechanisms")
    assert len(vec) == TARGET_VECTOR_DIM
    
    # Test batch embedding
    texts = [
        "Calculus and Differential Equations",
        "Cellular Biology and Genetics"
    ]
    batch_vecs = service.generate_embeddings_batch(texts)
    assert len(batch_vecs) == 2
    assert len(batch_vecs[0]) == TARGET_VECTOR_DIM
    assert len(batch_vecs[1]) == TARGET_VECTOR_DIM


def test_embedding_service_deterministic():
    service = EmbeddingService(provider="fallback")
    vec1 = service.generate_embedding("Same text test input")
    vec2 = service.generate_embedding("Same text test input")
    assert vec1 == vec2


if __name__ == "__main__":
    test_fallback_embeddings()
    test_embedding_service_single_and_batch()
    test_embedding_service_deterministic()
    print("ALL EMBEDDING SERVICE TESTS PASSED SUCCESSFULLY!")
