from sqlmodel import SQLModel, create_engine, Session
from pathlib import Path

from .config import SQLITE_PATH

engine = create_engine(f"sqlite:///{SQLITE_PATH}", echo=False)

def init_db():
    """Create tables if they do not exist."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Session:
    return Session(engine)
