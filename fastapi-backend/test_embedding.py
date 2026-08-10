from app.services.embedding_service import get_embedding_service

service = get_embedding_service()

text = "Artificial Intelligence is a branch of computer science."

embedding = service.generate_embedding(text)

print("Embedding generated successfully")
print("Vector dimension:", len(embedding))
print("First 5 values:", embedding[:5])