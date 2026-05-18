from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from models import Todo
from schemas import TodoCreate, TodoResponse
from auth import get_current_user
from typing import List

router = APIRouter(prefix="/todos", tags=["todos"])

@router.get("/", response_model=List[TodoResponse])
async def get_todos(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request)
    todos = db.query(Todo).filter(Todo.user_id == user["id"]).all()
    return todos

@router.post("/", response_model=TodoResponse)
async def create_todo(todo: TodoCreate, request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request)
    new_todo = Todo(title=todo.title, user_id=user["id"])
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    return new_todo

@router.patch("/{todo_id}/complete", response_model=TodoResponse)
async def complete_todo(todo_id: int, request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request)
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    if todo.user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    todo.completed = True
    db.commit()
    db.refresh(todo)
    return todo