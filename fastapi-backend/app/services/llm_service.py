
import os
import json
import logging
import re
from typing import List, Dict, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class LLMService:
    """
    Gemini-based LLM service for generating MCQ test questions.
    """

    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        self.llm = self._initialize_llm()

    # ============================================================
    # INITIALIZE GEMINI
    # ============================================================

    def _initialize_llm(self):
        if self.provider != "gemini":
            logger.error(
                f"Unsupported LLM provider: {self.provider}"
            )
            return None

        gemini_key = (
            os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
        )

        if not gemini_key:
            logger.error(
                "GEMINI_API_KEY or GOOGLE_API_KEY is missing."
            )
            return None

        try:
            from langchain_google_genai import ChatGoogleGenerativeAI

            logger.info(
                "Initializing Gemini with gemini-3.6-flash..."
            )

            llm = ChatGoogleGenerativeAI(
                model="gemini-3.6-flash",
                google_api_key=gemini_key,
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
        """
        Extract plain text from LangChain Gemini response.
        Gemini may return content as a string or a list of
        dictionaries containing a 'text' field.
        """

        if response is None:
            return ""

        content = getattr(response, "content", "")

        if isinstance(content, str):
            return content.strip()

        if isinstance(content, list):
            text_parts = []

            for item in content:
                if isinstance(item, dict):
                    text_value = item.get("text")

                    if text_value:
                        text_parts.append(str(text_value))

                elif isinstance(item, str):
                    text_parts.append(item)

            return "".join(text_parts).strip()

        return str(content).strip()

    # ============================================================
    # EXTRACT JSON ARRAY
    # ============================================================

    def _extract_json_array(
        self,
        content: str
    ) -> Optional[List]:

        if not content:
            logger.error(
                "Gemini returned empty content."
            )
            return None

        content = content.strip()

        # Remove Markdown code fences if Gemini adds them
        content = re.sub(
            r"```json\s*",
            "",
            content,
            flags=re.IGNORECASE
        )

        content = content.replace(
            "```",
            ""
        ).strip()

        # Find JSON array
        start = content.find("[")
        end = content.rfind("]")

        if start == -1 or end == -1 or end <= start:
            logger.error(
                "No JSON array found in Gemini response."
            )
            logger.error(
                f"Gemini response:\n{content}"
            )
            return None

        json_text = content[start:end + 1].strip()

        try:
            parsed = json.loads(json_text)

            if not isinstance(parsed, list):
                logger.error(
                    "Parsed JSON is not a list."
                )
                return None

            return parsed

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

        if not isinstance(question, dict):
            return False

        topic = question.get("topic")
        question_text = question.get("question_text")
        options = question.get("options")
        correct_answer = question.get("correct_answer")
        explanation = question.get("explanation")
        source_citation = question.get("source_citation")

        # Required fields
        if not topic:
            return False

        if not question_text:
            return False

        if not correct_answer:
            return False

        if not explanation:
            return False

        if not source_citation:
            return False

        # Options must contain exactly four strings
        if not isinstance(options, list):
            return False

        if len(options) != 4:
            return False

        if not all(
            isinstance(option, str) and option.strip()
            for option in options
        ):
            return False

        # Correct answer must exactly match one option
        options_clean = [
            option.strip()
            for option in options
        ]

        correct_answer_clean = str(
            correct_answer
        ).strip()

        if correct_answer_clean not in options_clean:
            return False

        # Exactly one option should equal the correct answer
        if options_clean.count(correct_answer_clean) != 1:
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

        # --------------------------------------------------------
        # Safe question range
        # --------------------------------------------------------

        num_questions = max(
            1,
            min(num_questions, 15)
        )

        # --------------------------------------------------------
        # Validate context
        # --------------------------------------------------------

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

        # --------------------------------------------------------
        # Limit context size
        # --------------------------------------------------------

        if len(context_text) > 30000:
            logger.info(
                "Context exceeds 30000 characters. "
                "Truncating context."
            )

            context_text = context_text[:30000]

        # --------------------------------------------------------
        # Check Gemini
        # --------------------------------------------------------

        if self.llm is None:
            logger.error(
                "Gemini LLM is not initialized."
            )
            return []

        # --------------------------------------------------------
        # Prompt
        # --------------------------------------------------------

        prompt = f"""
You are an expert teacher and educational quiz generator.

Create EXACTLY {num_questions} high-quality multiple-choice
questions using ONLY the study material provided below.

STRICT RULES:

1. Generate EXACTLY {num_questions} questions.
2. Every question MUST be directly based on the study material.
3. Do NOT ask generic questions such as:
   - What is the main topic?
   - What does the document discuss?
   - What is a key takeaway?
4. Test actual concepts, definitions, facts, examples,
   applications, characteristics, comparisons, or relationships.
5. Each question MUST have exactly FOUR options.
6. Options MUST be an array containing exactly 4 strings.
7. There MUST be exactly ONE correct option.
8. The correct_answer MUST exactly match one of the options.
9. Wrong options must be plausible but incorrect according
   to the study material.
10. Do NOT invent facts that are not present in the study material.
11. Do NOT repeat questions.
12. Keep questions clear and suitable for students.
13. Return ONLY valid JSON.
14. Do NOT use Markdown.
15. Do NOT use ```json.
16. Do NOT add explanations before or after the JSON.

Each question object MUST contain:

- "topic"
- "question_text"
- "options"
- "correct_answer"
- "explanation"
- "source_citation"

Return exactly this structure:

[
  {{
    "topic": "Artificial Intelligence",
    "question_text": "What is Artificial Intelligence?",
    "options": [
      "Simulation of human intelligence in machines",
      "A type of database",
      "A programming language",
      "A computer network"
    ],
    "correct_answer":
      "Simulation of human intelligence in machines",
    "explanation":
      "AI refers to simulating human intelligence in machines.",
    "source_citation":
      "Page 1, Paragraph 2"
  }}
]

STUDY MATERIAL:

{context_text}
"""

        # --------------------------------------------------------
        # Call Gemini
        # --------------------------------------------------------

        try:
            logger.info(
                f"Sending request to Gemini for "
                f"{num_questions} questions..."
            )

            response = self.llm.invoke(prompt)

            logger.info(
                "Gemini response received."
            )

            # ----------------------------------------------------
            # Extract response text
            # ----------------------------------------------------

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

            # ----------------------------------------------------
            # Extract JSON
            # ----------------------------------------------------

            questions = self._extract_json_array(
                content
            )

            if questions is None:
                return []

            # ----------------------------------------------------
            # Validate number of questions
            # ----------------------------------------------------

            if len(questions) != num_questions:
                logger.error(
                    f"Gemini returned {len(questions)} questions "
                    f"but exactly {num_questions} were required."
                )
                return []

            # ----------------------------------------------------
            # Validate each question
            # ----------------------------------------------------

            valid_questions = []

            for index, question in enumerate(questions):

                if not self._validate_question(
                    question
                ):
                    logger.warning(
                        f"Question {index + 1} failed validation."
                    )
                    continue

                cleaned_question = {
                    "topic": str(
                        question["topic"]
                    ).strip(),

                    "question_text": str(
                        question["question_text"]
                    ).strip(),

                    "options": [
                        str(option).strip()
                        for option in question["options"]
                    ],

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

                valid_questions.append(
                    cleaned_question
                )

            # ----------------------------------------------------
            # Remove duplicate questions
            # ----------------------------------------------------

            unique_questions = []
            seen_questions = set()

            for question in valid_questions:

                normalized = re.sub(
                    r"\s+",
                    " ",
                    question["question_text"].lower()
                ).strip()

                if normalized in seen_questions:
                    logger.warning(
                        "Duplicate question detected and removed."
                    )
                    continue

                seen_questions.add(normalized)
                unique_questions.append(question)

            valid_questions = unique_questions

            # ----------------------------------------------------
            # Final exact-count validation
            # ----------------------------------------------------

            if len(valid_questions) != num_questions:
                logger.error(
                    f"Expected exactly {num_questions} valid questions "
                    f"after validation, but received "
                    f"{len(valid_questions)}."
                )
                return []

            logger.info(
                f"Successfully generated "
                f"{len(valid_questions)} valid questions."
            )

            return valid_questions

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

