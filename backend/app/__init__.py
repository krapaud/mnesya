from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from contextlib import asynccontextmanager
from typing import Generator
import secrets
import os

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

security = HTTPBasic()


def verify_docs_credentials(
        credentials: HTTPBasicCredentials = Depends(security)):
    """Protects Swagger and ReDoc with HTTP Basic Auth using environment variables."""
    correct_username = secrets.compare_digest(
        credentials.username, os.environ["DOCS_USERNAME"]
    )
    correct_password = secrets.compare_digest(
        credentials.password, os.environ["DOCS_PASSWORD"]
    )
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )


def create_app():
    app = FastAPI(
        title="Mnesya app",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:8081", "https://mnesya.com"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )

    @app.get("/docs", include_in_schema=False)
    async def custom_swagger(
            credentials: HTTPBasicCredentials = Depends(security)):
        verify_docs_credentials(credentials)
        return get_swagger_ui_html(
            openapi_url="/openapi.json", title="Mnesya API Docs")

    @app.get("/redoc", include_in_schema=False)
    async def custom_redoc(
            credentials: HTTPBasicCredentials = Depends(security)):
        verify_docs_credentials(credentials)
        return get_redoc_html(openapi_url="/openapi.json",
                              title="Mnesya API ReDoc")

    return app
