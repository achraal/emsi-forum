from pydantic import BaseModel
from typing import Optional

class SurveyCreate(BaseModel):
    rating: int
    feedback: str = ""

class SurveyResponse(BaseModel):
    id: int
    rating: int
    feedback: Optional[str] = None

    class Config:
        from_attributes = True