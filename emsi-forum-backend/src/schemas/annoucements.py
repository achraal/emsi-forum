from sqlalchemy.orm import Session
from pydantic import BaseModel

class AnnouncementCreate(BaseModel):
    title: str
    message: str

class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    created_at: str

    class Config:
        from_attributes = True