from app.services.pdf_processor import (
    process_pdf,
    chunk_text
)


file_path = "sample.pdf"

# Extract text
text = process_pdf(file_path)

print("Extracted text length:", len(text))

# Create chunks
chunks = chunk_text(
    text,
    chunk_size=100,
    chunk_overlap=20
)

print("Number of chunks:", len(chunks))

for i, chunk in enumerate(chunks):
    print("\n-----------------------------")
    print(f"Chunk {i + 1}")
    print("-----------------------------")
    print(chunk)