from datetime import datetime, timezone
from math import exp

from sqlalchemy.orm import Session

from database.models import StudentMastery


# ============================================================
# SYLLABUS WEIGHTS
# ============================================================

# Temporary syllabus weights.
# These can later be moved to a database table.
SYLLABUS_WEIGHTS = {
    "Variables": 1.0,
    "Functions": 1.2,
    "Loops": 1.1,
    "OOP": 1.5,
    "Recursion": 1.8,
    "Data Structures": 1.7,
    "Algorithms": 1.8,
}


# ============================================================
# TIME DECAY
# ============================================================

def calculate_time_decay(last_practiced_at):
    """
    Calculate time decay based on how long ago
    the student practiced the topic.

    More days without practice
    -> higher time decay
    -> higher struggle score.
    """

    # If there is no practice/update date,
    # consider the topic neglected.
    if not last_practiced_at:
        return 1.5

    now = datetime.now(timezone.utc)

    # Handle timezone-naive datetime.
    if last_practiced_at.tzinfo is None:
        last_practiced_at = last_practiced_at.replace(
            tzinfo=timezone.utc
        )

    days_since_practice = (
        now - last_practiced_at
    ).total_seconds() / 86400

    # Prevent negative values if the database
    # timestamp is slightly ahead of current time.
    days_since_practice = max(
        0,
        days_since_practice
    )

    # Time decay:
    #
    # 0 days  -> approximately 1.0
    # More days -> approaches 2.0
    #
    decay = (
        1
        + (
            1
            - exp(
                -days_since_practice / 30
            )
        )
    )

    return round(decay, 4)


# ============================================================
# STRUGGLE SCORE
# ============================================================

def calculate_struggle_score(
    mastery,
    syllabus_weight,
    time_decay,
):
    """
    Struggle Score formula:

        (1 - Mastery)
        × Syllabus Weight
        × Time Decay

    Mastery is expected to be between 0 and 1.
    """

    # Keep mastery inside valid range.
    mastery = max(
        0.0,
        min(1.0, float(mastery))
    )

    weakness = 1 - mastery

    score = (
        weakness
        * syllabus_weight
        * time_decay
    )

    return round(score, 4)


# ============================================================
# TOP STRUGGLES
# ============================================================

def get_top_struggles(
    db: Session,
    student_id,
    top_n=5,
):
    """
    Get the student's mastery records,
    calculate struggle scores,
    rank them,
    and return Top N weak topics.
    """

    records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id
            == student_id
        )
        .all()
    )

    struggles = []

    for record in records:

        # ----------------------------------------------------
        # Mastery
        # ----------------------------------------------------

        mastery = record.mastery_score or 0.0

        mastery = max(
            0.0,
            min(1.0, float(mastery))
        )

        # ----------------------------------------------------
        # Syllabus Weight
        # ----------------------------------------------------

        syllabus_weight = SYLLABUS_WEIGHTS.get(
            record.topic,
            1.0,
        )

        # ----------------------------------------------------
        # Last Practice Time
        # ----------------------------------------------------

        # Use updated_at if your model has it.
        #
        # If updated_at does not exist, fallback to
        # created_at if available.
        last_practiced_at = getattr(
            record,
            "updated_at",
            None,
        )

        if last_practiced_at is None:
            last_practiced_at = getattr(
                record,
                "created_at",
                None,
            )

        # ----------------------------------------------------
        # Time Decay
        # ----------------------------------------------------

        time_decay = calculate_time_decay(
            last_practiced_at
        )

        # ----------------------------------------------------
        # Struggle Score
        # ----------------------------------------------------

        struggle_score = calculate_struggle_score(
            mastery=mastery,
            syllabus_weight=syllabus_weight,
            time_decay=time_decay,
        )

        struggles.append(
            {
                "topic": record.topic,
                "subject": record.subject,
                "mastery": round(mastery, 4),
                "mastery_percentage": round(
                    mastery * 100,
                    2,
                ),
                "syllabus_weight": syllabus_weight,
                "time_decay": time_decay,
                "struggle_score": struggle_score,
            }
        )

    # ========================================================
    # RANKING
    # ========================================================

    struggles.sort(
        key=lambda item: item["struggle_score"],
        reverse=True,
    )

    # ========================================================
    # TOP N
    # ========================================================

    return struggles[:top_n]