"""
One-off script to seed syllabus_weights with starter values.

Run once after your DB is up:
    python -m database.seed_syllabus_weights

Weights are 0.0 - 1.0. Edit SEED_DATA to match your test data's
subjects/topics (must match StudentMastery.subject/topic exactly).
"""

from database.session import SessionLocal
from database.models import SyllabusWeight


SEED_DATA = [
    # (subject, topic, weight, board, grade)
    ("Physics", "Kinematics", 0.9, None, None),
    ("Physics", "Thermodynamics", 0.7, None, None),
    ("Physics", "Optics", 0.6, None, None),
    ("Math", "Calculus", 0.95, None, None),
    ("Math", "Trigonometry", 0.75, None, None),
    ("Math", "Probability", 0.65, None, None),
    ("Chemistry", "Organic Chemistry", 0.85, None, None),
    ("Chemistry", "Periodic Table", 0.5, None, None),
]


def seed():
    db = SessionLocal()

    try:
        for subject, topic, weight, board, grade in SEED_DATA:

            exists = (
                db.query(SyllabusWeight)
                .filter(
                    SyllabusWeight.subject == subject,
                    SyllabusWeight.topic == topic
                )
                .first()
            )

            if exists:
                continue

            db.add(SyllabusWeight(
                subject=subject,
                topic=topic,
                weight=weight,
                board=board,
                grade=grade
            ))

        db.commit()
        print(f"Seeded {len(SEED_DATA)} syllabus weight rows.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()