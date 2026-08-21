from datetime import datetime, timezone

from sqlalchemy.orm import Session

from database.models import StudentMastery, SyllabusWeight


DEFAULT_SYLLABUS_WEIGHT = 1.0


def get_struggle_input_data(
    db: Session,
    student_id: str
):

    mastery_records = (
        db.query(StudentMastery)
        .filter(
            StudentMastery.student_id == student_id
        )
        .all()
    )

    # Pull all syllabus weights once and index by (subject, topic)
    # rather than querying per-row.
    weight_rows = db.query(SyllabusWeight).all()

    weight_lookup = {
        (row.subject, row.topic): row.weight
        for row in weight_rows
    }

    now = datetime.now(timezone.utc)
    results = []

    for record in mastery_records:

        syllabus_weight = weight_lookup.get(
            (record.subject, record.topic),
            DEFAULT_SYLLABUS_WEIGHT
        )

        last_updated = record.updated_at

        days_since_practice = None
        if last_updated is not None:
            days_since_practice = (
                now - last_updated
            ).total_seconds() / 86400

        results.append({
            "subject": record.subject,
            "topic": record.topic,
            "mastery_score": record.mastery_score,
            "syllabus_weight": syllabus_weight,
            "last_updated_at": last_updated,
            "days_since_practice": days_since_practice,
        })

    return results