import pdfplumber
import pytesseract
from pdf2image import convert_from_path

# Path to Tesseract OCR
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def process_pdf(file_path):
    extracted_text = ""

    try:
        # Step 1: Extract text using pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"

        # Step 2: If no text found, use OCR
        if not extracted_text.strip():
            print("No text found. Running OCR...")

            images = convert_from_path(
                file_path,
                poppler_path=r"C:\Users\veena\OneDrive\Documents\Release-26.02.0-0\poppler-26.02.0\Library\bin"
          )

            for image in images:
                extracted_text += pytesseract.image_to_string(image)

        return extracted_text

    except Exception as e:
        return f"Error: {str(e)}"