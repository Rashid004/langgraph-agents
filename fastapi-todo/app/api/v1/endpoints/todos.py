from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.crud import todo as crud
from app.models.todo import Todo
from app.schemas.todo import TodoCreate, TodoRead, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])


def get_todo_or_404(todo_id: int, db: Session = Depends(get_db)) -> Todo:
    todo = crud.get_by_id(db, todo_id)
    if todo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Todo not found")
    return todo


@router.get("", response_model=List[TodoRead])
def list_todos(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=100), db: Session = Depends(get_db)):
    return crud.get_all(db, skip, limit)


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(data: TodoCreate, db: Session = Depends(get_db)):
    return crud.create(db, data)


@router.get("/{todo_id}", response_model=TodoRead)
def read_todo(todo: Todo = Depends(get_todo_or_404)):
    return todo


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(data: TodoUpdate, todo: Todo = Depends(get_todo_or_404), db: Session = Depends(get_db)):
    return crud.update(db, todo, data)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo: Todo = Depends(get_todo_or_404), db: Session = Depends(get_db)):
    crud.delete(db, todo)
