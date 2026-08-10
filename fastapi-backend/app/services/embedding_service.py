import os
import math
import hashlib
import logging
from typing import List, Optional

from langchain_core.embeddings import Embeddings

logger = logging.getLogger(__name__)

TARGET_VECTOR_DIM = 1536


class FallbackEmbeddings(Embeddings):
    """
    Deterministic fallback embedding generator.

    Generates a 1536-dimensional normalized vector from the text hash.
    Used when no embedding API key is available or an API call fails.
    """

    def _generate_vector(self, text: str) -> List[float]:
        hash_bytes = hashlib.sha256(
            text.encode("utf-8")
        ).digest()

        vector = []

        for i in range(TARGET_VECTOR_DIM):
            byte_idx = (i * 2) % len(hash_bytes)

            val = (
                hash_bytes[byte_idx]
                + hash_bytes[(byte_idx + 1) % len(hash_bytes)] * 256
            ) / 65535.0

            angle = (i * 0.1) + val * math.pi

            vector.append(
                math.sin(angle) * math.cos(i * 0.05)
            )

        # Normalize vector
        magnitude = math.sqrt(
            sum(x * x for x in vector)
        )

        if magnitude > 0:
            vector = [
                x / magnitude
                for x in vector
            ]

        return vector

    def embed_documents(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        return [
            self._generate_vector(text)
            for text in texts
        ]

    def embed_query(
        self,
        text: str
    ) -> List[float]:
        return self._generate_vector(text)


class EmbeddingService:
    """
    Service for generating embeddings using:

    1. OpenAI
    2. Google Gemini
    3. Deterministic fallback embeddings

    The provider can be selected using EMBEDDING_PROVIDER.
    """

    def __init__(self, provider: Optional[str] = None):
        self.provider = (
            provider
            or os.getenv("EMBEDDING_PROVIDER", "auto")
        ).lower()

        self.embeddings_model = self._initialize_model()

    def _initialize_model(self) -> Embeddings:
        openai_key = os.getenv("OPENAI_API_KEY")

        gemini_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )

        # -----------------------------------------
        # OpenAI
        # -----------------------------------------
        if (
            self.provider == "openai"
            or (
                self.provider == "auto"
                and openai_key
            )
        ) and openai_key:

            try:
                from langchain_openai import OpenAIEmbeddings

                model_name = os.getenv(
                    "OPENAI_EMBEDDING_MODEL",
                    "text-embedding-3-small"
                )

                logger.info(
                    f"Initializing OpenAI embeddings: {model_name}"
                )

                return OpenAIEmbeddings(
                    model=model_name,
                    api_key=openai_key
                )

            except Exception as e:
                logger.warning(
                    f"OpenAI initialization failed: {e}"
                )

        # -----------------------------------------
        # Google Gemini
        # -----------------------------------------
        if (
            self.provider in ["gemini", "google"]
            or (
                self.provider == "auto"
                and gemini_key
            )
        ) and gemini_key:

            try:
                from langchain_google_genai import (
                    GoogleGenerativeAIEmbeddings
                )

                model_name = os.getenv(
                    "GEMINI_EMBEDDING_MODEL",
                    "text-embedding-004"
                )

                logger.info(
                    f"Initializing Google embeddings: {model_name}"
                )

                return GoogleGenerativeAIEmbeddings(
                    model=model_name,
                    google_api_key=gemini_key
                )

            except Exception as e:
                logger.warning(
                    f"Google embedding initialization failed: {e}"
                )

        # -----------------------------------------
        # Fallback
        # -----------------------------------------
        logger.info(
            "Using FallbackEmbeddings."
        )

        return FallbackEmbeddings()

    def _normalize_dimension(
        self,
        vector: List[float],
        target_dim: int = TARGET_VECTOR_DIM
    ) -> List[float]:
        """
        Ensures the returned vector has the required dimension.
        """

        current_dim = len(vector)

        if current_dim == target_dim:
            return vector

        # Truncate if larger
        if current_dim > target_dim:
            vector = vector[:target_dim]

            magnitude = math.sqrt(
                sum(x * x for x in vector)
            )

            if magnitude > 0:
                vector = [
                    x / magnitude
                    for x in vector
                ]

            return vector

        # Pad if smaller
        return vector + [
            0.0
        ] * (target_dim - current_dim)

    def generate_embedding(
        self,
        text: str
    ) -> List[float]:
        """
        Generate a 1536-dimensional embedding
        for a single text.
        """

        if not text or not text.strip():
            raise ValueError(
                "Text cannot be empty."
            )

        try:
            vector = self.embeddings_model.embed_query(
                text
            )

            return self._normalize_dimension(vector)

        except Exception as e:
            logger.error(
                f"Embedding generation failed: {e}"
            )

            logger.info(
                "Using fallback embedding."
            )

            fallback = FallbackEmbeddings()

            return fallback.embed_query(text)

    def generate_embeddings_batch(
        self,
        texts: List[str]
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts.
        """

        if not texts:
            return []

        valid_texts = [
            text for text in texts
            if text and text.strip()
        ]

        if not valid_texts:
            raise ValueError(
                "No valid text provided."
            )

        try:
            vectors = (
                self.embeddings_model
                .embed_documents(valid_texts)
            )

            return [
                self._normalize_dimension(vector)
                for vector in vectors
            ]

        except Exception as e:
            logger.error(
                f"Batch embedding generation failed: {e}"
            )

            logger.info(
                "Using fallback embeddings."
            )

            fallback = FallbackEmbeddings()

            return fallback.embed_documents(
                valid_texts
            )


# -----------------------------------------
# Shared singleton instance
# -----------------------------------------

_embedding_service_instance = None


def get_embedding_service() -> EmbeddingService:
    """
    Return the shared EmbeddingService instance.
    """

    global _embedding_service_instance

    if _embedding_service_instance is None:
        _embedding_service_instance = EmbeddingService()

    return _embedding_service_instance