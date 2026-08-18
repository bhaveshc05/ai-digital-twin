from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import SessionLocal
from app.services.struggle_service import get_top_struggles


router = APIRouter(
    prefix="/api/v1/struggles",
    tags=["Struggles"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/{student_id}")
def get_student_struggles(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Return Top 5 struggle topics for a student.
    """

    top_struggles = get_top_struggles(
        db=db,
        student_id=student_id,
        top_n=5
    )

    return {
        "student_id": student_id,
        "count": len(top_struggles),
        "top_struggles": top_struggles
    }