import sys
import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

# Ensure database module located at root can be imported
sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../..")
    )
)

from database.session import get_db, Base, engine
from database import models
from app.api.routes import router as api_router


app = FastAPI(title="AI Digital Twin API")


# Create database tables for all registered SQLAlchemy models
Base.metadata.create_all(bind=engine)


# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routes
app.include_router(
    api_router,
    prefix="/api/v1"
)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI Digital Twin FastAPI Backend is running!"
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Ping PostgreSQL
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )

