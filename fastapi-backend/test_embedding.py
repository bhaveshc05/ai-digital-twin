from app.services.embedding_service import generate_embedding

text = "Artificial Intelligence is changing the world."

embedding = generate_embedding(text)

print("Embedding Length:", len(embedding))
print(embedding[:10])  # Print first 10 values