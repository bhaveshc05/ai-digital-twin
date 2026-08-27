import os
import json
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.provider = (os.getenv("EMBEDDING_PROVIDER", "auto")).lower()
        self.llm = self._initialize_llm()

    def _initialize_llm(self):
        openai_key = os.getenv("OPENAI_API_KEY")
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

        if (self.provider == "openai" or (self.provider == "auto" and openai_key)) and openai_key:
            try:
                from langchain_openai import ChatOpenAI
                return ChatOpenAI(model="gpt-3.5-turbo", api_key=openai_key)
            except Exception as e:
                logger.warning(f"Failed to init OpenAI LLM: {e}")

        if (self.provider in ["gemini", "google"] or (self.provider == "auto" and gemini_key)) and gemini_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=gemini_key)
            except Exception as e:
                logger.warning(f"Failed to init Gemini LLM: {e}")
        
        return None

    def generate_test_questions(self, context_text: str, num_questions: int = 5) -> List[Dict]:
        if not self.llm:
            # Mock fallback if no LLM
            return [
                {
                    "topic": "General",
                    "question_text": "What is the main topic of the uploaded document?",
                    "options": ["The core concepts", "Unrelated topics", "Historical context", "None of the above"],
                    "correct_answer": "The core concepts",
                    "explanation": "The document primarily discusses the core concepts.",
                    "source_citation": "Page 1, Paragraph 1"
                },
                {
                    "topic": "Details",
                    "question_text": "Based on the text, what is a key takeaway?",
                    "options": ["Concept examples", "Nothing", "A joke", "A recipe"],
                    "correct_answer": "Concept examples",
                    "explanation": "The text provides several examples to illustrate the concept.",
                    "source_citation": "Page 2, Summary"
                }
            ]
        
        prompt = f'''
        You are a helpful tutor generating a quiz based on the following notes.
        Generate {num_questions} multiple choice questions (with 1 correct answer each).
        You MUST return the result ONLY as a JSON array of objects. Do not include markdown code blocks, just the raw JSON.
        Each object MUST have the following structure:
        - "topic": a short topic string (e.g., "Math", "History")
        - "question_text": the question string
        - "options": an array of 4 string options
        - "correct_answer": the exact correct answer string (must match one of the options)
        - "explanation": a short explanation of why the answer is correct
        - "source_citation": a short citation of where in the text this was found

        Notes:
        {context_text}
        '''
        
        try:
            response = self.llm.invoke(prompt)
            content = response.content
            # Try to parse JSON from the response
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0]
            elif '```' in content:
                content = content.split('```')[1].split('```')[0]
            
            return json.loads(content.strip())
        except Exception as e:
            logger.error(f"Error generating questions: {e}")
            return []

_llm_service_instance = None
def get_llm_service() -> LLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
