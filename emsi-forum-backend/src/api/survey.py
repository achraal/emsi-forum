from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from src.core.database import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.models.survey import Survey
from src.schemas.survey import SurveyCreate, SurveyResponse

router = APIRouter(prefix="/survey", tags=["Survey"])

@router.get("/", response_model=Optional[SurveyResponse])
def get_user_survey(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    survey = db.query(Survey).filter(Survey.user_id == current_user.id).first()
    return survey

@router.post("/")
def submit_survey(
        data: SurveyCreate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    survey = db.query(Survey).filter(Survey.user_id == current_user.id).first()
    if survey:
        survey.rating = data.rating
        survey.feedback = data.feedback
    else:
        survey = Survey(user_id=current_user.id, rating=data.rating, feedback=data.feedback)
        db.add(survey)

    db.commit()
    return {"message": "Merci pour votre retour !"}