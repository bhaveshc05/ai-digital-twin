import os
import json
import logging
import re
from typing import List, Dict

from dotenv import load_dotenv

# Load .env
load_dotenv()

logger = logging.getLogger(__name__)


class LLMService:

    def __init__(self):

        self.provider = os.getenv(
            "LLM_PROVIDER",
            "gemini"
        ).lower()

        self.llm = self._initialize_llm()

    # ============================================================
    # INITIALIZE GEMINI
    # ============================================================

    def _initialize_llm(self):

        gemini_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )

        if not gemini_key:

            logger.error(
                "GEMINI_API_KEY is missing."
            )

            return None

        try:

            from langchain_google_genai import ChatGoogleGenerativeAI

            logger.info(
                "Initializing Gemini..."
            )

            # IMPORTANT:
            # gemini-2.0-flash is no longer available
            # for your API. Use gemini-3.6-flash.

            llm = ChatGoogleGenerativeAI(
                model="gemini-3.6-flash",
                google_api_key=gemini_key,
                temperature=0.2
            )

            logger.info(
                "Gemini initialized successfully."
            )

            return llm

        except Exception as e:

            logger.error(
                f"Gemini initialization failed: {e}",
                exc_info=True
            )

            return None

    # ============================================================
    # EXTRACT TEXT FROM GEMINI RESPONSE
    # ============================================================

    def _extract_response_text(self, response) -> str:

        content = response.content

        # --------------------------------------------------------
        # Gemini/LangChain can return:
        #
        # [
        #   {
        #       "type": "text",
        #       "text": "..."
        #   }
        # ]
        # --------------------------------------------------------

        if isinstance(content, list):

            text_parts = []

            for item in content:

                if isinstance(item, dict):

                    text_value = item.get("text")

                    if text_value:
                        text_parts.append(
                            str(text_value)
                        )

                elif isinstance(item, str):

                    text_parts.append(item)

            return "".join(text_parts).strip()

        return str(content).strip()

    # ============================================================
    # CLEAN JSON RESPONSE
    # ============================================================

    def _extract_json_array(self, content: str):

        if not content:
            return None

        content = content.strip()

        # --------------------------------------------------------
        # Remove ```json
        # --------------------------------------------------------

        content = re.sub(
            r"```json",
            "",
            content,
            flags=re.IGNORECASE
        )

        # --------------------------------------------------------
        # Remove ```
        # --------------------------------------------------------

        content = content.replace(
            "```",
            ""
        )

        content = content.strip()

        # --------------------------------------------------------
        # Find first [ and last ]
        # --------------------------------------------------------

        start = content.find("[")

        end = content.rfind("]")

        if start == -1 or end == -1:

            logger.error(
                "No JSON array found in Gemini response."
            )

            return None

        json_text = content[
            start:end + 1
        ].strip()

        # --------------------------------------------------------
        # Parse JSON
        # --------------------------------------------------------

        try:

            return json.loads(
                json_text
            )

        except json.JSONDecodeError as e:

            logger.error(
                f"JSON parsing failed: {e}"
            )

            logger.error(
                f"Gemini JSON response:\n{json_text}"
            )

            return None

    # ============================================================
    # VALIDATE QUESTION
    # ============================================================

    def _validate_question(
        self,
        question: Dict
    ) -> bool:

        if not isinstance(
            question,
            dict
        ):
            return False

        topic = question.get(
            "topic"
        )

        question_text = question.get(
            "question_text"
        )

        correct_answer = question.get(
            "correct_answer"
        )

        if not topic:
            return False

        if not question_text:
            return False

        if not correct_answer:
            return False

        question_text = str(
            question_text
        ).strip()

        correct_answer = str(
            correct_answer
        ).strip()

        options = question.get("options")
        if not isinstance(options, list) or len(options) != 4:
            return False
            
        if not question.get("explanation"):
            return False
            
        if not question.get("source_citation"):
            return False

        return True

    # ============================================================
    # GENERATE TEST QUESTIONS
    # ============================================================

    def generate_test_questions(
        self,
        context_text: str,
        num_questions: int = 5,
    ) -> List[Dict]:

        # ========================================================
        # ALWAYS EXACTLY 5
        # ========================================================

        num_questions = 5

        # ========================================================
        # VALIDATE CONTEXT
        # ========================================================

        if not context_text:

            logger.error(
                "Context text is empty."
            )

            return []

        context_text = context_text.strip()

        if not context_text:

            logger.error(
                "Context text is empty after stripping."
            )

            return []

        # ========================================================
        # LIMIT CONTEXT SIZE
        # ========================================================

        if len(context_text) > 30000:

            logger.info(
                "Context is large. Limiting to 30000 characters."
            )

            context_text = context_text[:30000]

        # ========================================================
        # CHECK GEMINI
        # ========================================================

        if self.llm is None:

            logger.error(
                "Gemini LLM is not initialized."
            )

            return []

        # ========================================================
        # PROMPT
        # ========================================================

        prompt = f"""
You are an expert teacher and educational quiz generator.

Create EXACTLY 5 high-quality multiple-choice questions
using ONLY the study material provided below.

STRICT RULES:

1. Generate EXACTLY 5 questions.
2. Every question MUST be directly based on the study material.
3. Do NOT ask generic questions such as:
   - What is the main topic?
   - What does the document discuss?
   - What is a key takeaway?
4. Test actual concepts, definitions, facts, examples,
   applications, characteristics, comparisons, or relationships.
5. Each question MUST have exactly FOUR options.
6. Options MUST be an array of 4 string options.
7. There MUST be exactly ONE correct option.
8. Wrong options must be plausible but incorrect according
   to the study material.
9. Do NOT invent facts that are not present in the study material.
10. Do NOT repeat questions.
11. Keep questions clear and suitable for students.
12. Return EXACTLY 5 question objects.
13. Return ONLY valid JSON.
14. Do NOT use Markdown.
15. Do NOT use ```json.
16. Do NOT add explanations before or after the JSON.

IMPORTANT:

Each object MUST have the following structure:
- "topic": a short topic string (e.g., "Math", "History")
- "question_text": the question string
- "options": an array of 4 string options
- "correct_answer": the exact correct answer string (must match one of the options)
- "explanation": a short explanation of why the answer is correct
- "source_citation": a short citation of where in the text this was found

Return exactly this JSON structure:

[
  {{
    "topic": "Artificial Intelligence",
    "question_text": "What is Artificial Intelligence?",
    "options": ["Simulation of human intelligence in machines", "A type of database", "A programming language", "A computer network"],
    "correct_answer": "Simulation of human intelligence in machines",
    "explanation": "AI refers to simulating human intelligence.",
    "source_citation": "Page 1, Paragraph 2"
  }}
]

STUDY MATERIAL:

{context_text}
"""

        # ========================================================
        # CALL GEMINI
        # ========================================================

        try:

            logger.info(
                "Sending quiz generation request to Gemini..."
            )

            response = self.llm.invoke(
                prompt
            )

            logger.info(
                "Gemini response received."
            )

            # ====================================================
            # EXTRACT ACTUAL TEXT
            # ====================================================

            content = self._extract_response_text(
                response
            )

            logger.info(
                f"Gemini response length: {len(content)}"
            )

            logger.debug(
                f"Gemini raw response:\n{content}"
            )

            if not content:

                logger.error(
                    "Gemini returned empty content."
                )

                return []

            # ====================================================
            # EXTRACT JSON
            # ====================================================

            questions = self._extract_json_array(
                content
            )

            if questions is None:

                return []

            # ====================================================
            # CHECK ARRAY
            # ====================================================

            if not isinstance(
                questions,
                list
            ):

                logger.error(
                    "Gemini response is not a JSON array."
                )

                return []

            # ====================================================
            # VALIDATE QUESTIONS
            # ========================================================

            valid_questions = []

            for index, question in enumerate(
                questions
            ):

                if not self._validate_question(
                    question
                ):

                    logger.warning(
                        f"Question {index + 1} failed validation."
                    )

                    continue

                valid_questions.append(
                    {
                        "topic": str(
                            question["topic"]
                        ).strip(),

                        "question_text": str(
                            question["question_text"]
                        ).strip(),

                        "options": [str(opt).strip() for opt in question["options"]],

                        "correct_answer": str(
                            question["correct_answer"]
                        ).strip(),

                        "explanation": str(
                            question["explanation"]
                        ).strip(),

                        "source_citation": str(
                            question["source_citation"]
                        ).strip(),
                    }
                )

            # ====================================================
            # REMOVE DUPLICATES
            # ====================================================

            unique_questions = []

            seen_questions = set()

            for question in valid_questions:

                normalized = re.sub(
                    r"\s+",
                    " ",
                    question["question_text"].lower()
                )

                if normalized in seen_questions:
                    continue

                seen_questions.add(
                    normalized
                )

                unique_questions.append(
                    question
                )

            valid_questions = unique_questions

            # ====================================================
            # LOG RESULT
            # ====================================================

            logger.info(
                f"Gemini generated "
                f"{len(valid_questions)} valid questions."
            )

            # ====================================================
            # EXACTLY 5 REQUIRED
            # ====================================================

            if len(valid_questions) != 5:

                logger.error(
                    "Expected exactly 5 valid questions, "
                    f"but received {len(valid_questions)}."
                )

                return []

            return valid_questions[:5]

        # ========================================================
        # EXCEPTION
        # ========================================================

        except Exception as e:

            logger.error(
                f"Gemini question generation failed: {e}",
                exc_info=True
            )

            return []


# ============================================================
# SINGLETON
# ============================================================

_llm_service_instance = None


def get_llm_service() -> LLMService:

    global _llm_service_instance

    if _llm_service_instance is None:

        _llm_service_instance = LLMService()

    return _llm_service_instance