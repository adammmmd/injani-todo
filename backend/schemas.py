from pydantic import BaseModel

class TodoCreate(BaseModel):
    title: str

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    user_id: str

    class Config:
        from_attributes = True