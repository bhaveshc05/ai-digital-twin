from sqlalchemy.orm import Session
from database.models import StudentMastery, MasterySnapshot

def calculate_mastery_score(
    correct_answers: int,
    total_questions: int
) -> float:
    """
    Calculate mastery score between 0 and 1.
    """

    if total_questions == 0:
        return 0.0

    return round(
        correct_answers / total_questions,
        4
    )


def update_mastery_score(
    db: Session,
    student_id,
    subject: str,
    topic: str,
    is_correct: bool
):
    """
    Update student's mastery score based on
    question performance.
    """

    # Find existing mastery record
    mastery = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id,
            StudentMastery.subject == subject,
            StudentMastery.topic == topic
        )
        .first()
    )

    # Create a new mastery record if one doesn't exist
    if mastery is None:
        mastery = StudentMastery(
            student_id=student_id,
            subject=subject,
            topic=topic,
            correct_answers=0,
            total_questions=0,
            mastery_score=0.0
        )

        db.add(mastery)

    # Every answered question increases total questions
    mastery.total_questions += 1

    # Increase correct answers if answer is correct
    if is_correct:
        mastery.correct_answers += 1

    # Recalculate mastery score
    mastery.mastery_score = calculate_mastery_score(
        mastery.correct_answers,
        mastery.total_questions
    )

    # Save changes
    db.commit()
    db.refresh(mastery)
    create_mastery_snapshot(db, mastery)

    return mastery

def create_mastery_snapshot(
    db: Session,
    mastery: StudentMastery
):
    """
    Insert a snapshot row capturing the current state
    of a mastery record. Called after every mastery update
    to preserve history.
    """

    snapshot = MasterySnapshot(
        student_id=mastery.student_id,
        subject=mastery.subject,
        topic=mastery.topic,
        correct_answers=mastery.correct_answers,
        total_questions=mastery.total_questions,
        mastery_score=mastery.mastery_score
    )

    db.add(snapshot)
    db.commit()

    return snapshot