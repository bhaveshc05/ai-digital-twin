from sqlalchemy.orm import Session
from database.models import StudentMastery, MasterySnapshot

# BKT Default Parameters
BKT_P_L0 = 0.30  # Initial probability of knowledge
BKT_P_TRANSIT = 0.10  # Probability of learning the skill
BKT_P_GUESS = 0.25  # Probability of guessing correctly (e.g. 4 options = 0.25)
BKT_P_SLIP = 0.10  # Probability of slipping (making a mistake despite knowing)

def update_bkt_probability(current_p: float, is_correct: bool) -> float:
    """
    Update mastery probability using Bayesian Knowledge Tracing.
    """
    if is_correct:
        # P(L|Correct) = P(L)*(1 - Slip) / [ P(L)*(1 - Slip) + (1 - P(L))*Guess ]
        p_l_given_obs = (current_p * (1 - BKT_P_SLIP)) / (
            (current_p * (1 - BKT_P_SLIP)) + ((1 - current_p) * BKT_P_GUESS)
        )
    else:
        # P(L|Incorrect) = P(L)*Slip / [ P(L)*Slip + (1 - P(L))*(1 - Guess) ]
        p_l_given_obs = (current_p * BKT_P_SLIP) / (
            (current_p * BKT_P_SLIP) + ((1 - current_p) * (1 - BKT_P_GUESS))
        )
    
    # P(L_new) = P(L|obs) + (1 - P(L|obs)) * P_Transit
    new_p = p_l_given_obs + (1 - p_l_given_obs) * BKT_P_TRANSIT
    
    return round(new_p, 4)

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
            mastery_score=BKT_P_L0  # Initialize with Prior Probability
        )
        db.add(mastery)

    # Every answered question increases total questions
    mastery.total_questions += 1

    # Increase correct answers if answer is correct
    if is_correct:
        mastery.correct_answers += 1

    # Apply BKT algorithm
    mastery.mastery_score = update_bkt_probability(
        mastery.mastery_score,
        is_correct
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