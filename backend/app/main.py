from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.migration import run_migrations
import app.models  # Ensures models are registered with Base metadata
from app.routers import auth, habits, records


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create database tables automatically on startup if they do not exist
    Base.metadata.create_all(bind=engine)
    # 2. Run safe schema migrations (adding user_id to habits and linking existing data)
    run_migrations(engine)
    yield


app = FastAPI(
    title="HabitFlow — Digital Habit Tracker API",
    description="REST API service for managing daily habits, tracking completions, and multi-user authentication.",
    version="0.2.0",
    lifespan=lifespan,
)

# Allow CORS for local development (Vite default: http://localhost:5173, 5174)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(records.router)


@app.get("/", tags=["General"])
def root():
    return {
        "message": "Welcome to HabitFlow API",
        "health_check": "/api/health",
        "docs": "/docs",
    }


@app.get("/api/health", tags=["General"])
def health_check(db: Session = Depends(get_db)):
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "app": "HabitFlow — Digital Habit Tracker",
        "version": "0.1.0",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
