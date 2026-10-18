from typing import Iterator

from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db  # the endpoint runs here
    finally:
        db.close()  # runs after the response, even on errors
