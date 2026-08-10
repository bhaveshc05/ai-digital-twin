import io
import logging
from typing import List
import pdfplumber

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    try:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
    except ImportError:
        RecursiveCharacterTextSplitter = None

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts text content from PDF bytes using pdfplumber.
    Falls back to pytesseract OCR if page text is empty/scanned and pytesseract is available.
    """
    extracted_text = []

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for index, page in enumerate(pdf.pages):
                page_text = page.extract_text() or ""
                page_text = page_text.strip()

                # If text is extremely short or empty, attempt OCR fallback
                if len(page_text) < 20:
                    try:
                        import pytesseract
                        from pdf2image import convert_from_bytes
                        logger.info(f"Page {index + 1} has insufficient text. Attempting Tesseract OCR...")
                        images = convert_from_bytes(pdf_bytes, first_page=index + 1, last_page=index + 1)
                        if images:
                            ocr_text = pytesseract.image_to_string(images[0]).strip()
                            if ocr_text:
                                page_text = ocr_text
                    except Exception as ocr_err:
                        logger.warning(f"OCR fallback skipped for page {index + 1}: {ocr_err}")

                if page_text:
                    extracted_text.append(f"--- Page {index + 1} ---\n{page_text}")

    except Exception as e:
        logger.error(f"Error parsing PDF with pdfplumber: {e}")
        raise RuntimeError(f"Failed to process PDF document: {str(e)}")

    full_text = "\n\n".join(extracted_text).strip()
    if not full_text:
        return "No extractable text found in the provided document."

    return full_text


def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """
    Splits document text into semantic chunks using LangChain RecursiveCharacterTextSplitter.
    """
    if RecursiveCharacterTextSplitter:
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        return splitter.split_text(text)

    # Fallback chunker if LangChain text splitter is not loaded
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - chunk_overlap
    return chunks
