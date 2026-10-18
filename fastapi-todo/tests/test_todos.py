from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_db
from app.db.base import Base
from app.main import app

# in-memory SQLite so tests never touch Neon; no `with TestClient` so lifespan (Neon create_all) is skipped
engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestSession = sessionmaker(bind=engine)
Base.metadata.create_all(engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_todo_crud_flow():
    r = client.post("/api/v1/todos", json={"title": "learn fastapi"})
    assert r.status_code == 201
    todo_id = r.json()["id"]

    assert client.patch(f"/api/v1/todos/{todo_id}", json={"completed": True}).json()["completed"] is True
    assert len(client.get("/api/v1/todos").json()) == 1
    assert client.delete(f"/api/v1/todos/{todo_id}").status_code == 204
    assert client.get(f"/api/v1/todos/{todo_id}").status_code == 404


def test_invalid_input_rejected():
    assert client.post("/api/v1/todos", json={"title": ""}).status_code == 422
    todo_id = client.post("/api/v1/todos", json={"title": "x"}).json()["id"]
    assert client.patch(f"/api/v1/todos/{todo_id}", json={"title": None}).status_code == 422
