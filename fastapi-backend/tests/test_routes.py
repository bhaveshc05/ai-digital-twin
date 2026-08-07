import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.api.routes import router, GenerateEmbeddingRequest
from app.services.embedding_service import get_embedding_service


def test_embedding_endpoint_logic():
    service = get_embedding_service()
    embedding = service.generate_embedding("Test physics concept for digital twin")
    
    assert len(embedding) == 1536
    assert isinstance(embedding[0], float)
    print("Embedding generation logic test passed!")


if __name__ == "__main__":
    test_embedding_endpoint_logic()
