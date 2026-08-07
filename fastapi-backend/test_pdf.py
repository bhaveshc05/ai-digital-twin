from app.services.pdf_processor import process_pdf

text = process_pdf("scanned_test_pdf.pdf")

print(text)