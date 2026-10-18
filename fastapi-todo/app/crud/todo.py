from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoUpdate


def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Todo]:
    # order_by: Postgres gives no stable order without it
    return list(db.scalars(select(Todo).order_by(Todo.id).offset(skip).limit(limit)))


def get_by_id(db: Session, todo_id: int) -> Optional[Todo]:
    return db.get(Todo, todo_id)


def create(db: Session, data: TodoCreate) -> Todo:
    todo = Todo(**data.model_dump())
    db.add(todo)
    db.commit()
    db.refresh(todo)  # reload so todo.id is filled in
    return todo


def update(db: Session, todo: Todo, data: TodoUpdate) -> Todo:
    # exclude_unset: only change fields the client actually sent
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


def delete(db: Session, todo: Todo) -> None:
    db.delete(todo)
    db.commit()
