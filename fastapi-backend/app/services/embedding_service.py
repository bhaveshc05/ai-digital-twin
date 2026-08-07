from sentence_transformers import SentenceTransformer

# Load the model once
model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embedding(text: str):
    """
    Generate embedding vector for the given text.
    """
    embedding = model.encode(text)
    return embedding.tolist()