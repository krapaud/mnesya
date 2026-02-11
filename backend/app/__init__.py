from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from contextlib import asynccontextmanager
from typing import Generator

# ==================== Database setup ====================
database = declarative_base()
engine = None
SessionLocal = None

def init_app(database_url: str):
    global engine, SessionLocal
    engine = create_engine(database_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    database.metadata.create_all(bind=engine)

def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    db = SessionLocal()
    try: 
        yield db
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    if engine:
        engine.dispose()

def create_app():
    app = FastAPI(title="Mnesya app", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:8081", "https://mnesya.com"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )

    return app
