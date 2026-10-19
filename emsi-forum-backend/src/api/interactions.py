from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from src.core.database import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.models.interaction import Interaction

router = APIRouter(prefix="/interactions", tags=["Interactions"])

class InteractionUpdate(BaseModel):
    enterprise_id: int
    visited: bool
    cv_dropped: bool

@router.post("/")
def update_interaction(
        data: InteractionUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Chercher si l'interaction existe déjà
    interaction = db.query(Interaction).filter(
        Interaction.user_id == current_user.id,
        Interaction.enterprise_id == data.enterprise_id
    ).first()

    if interaction:
        # Mettre à jour si elle existe
        interaction.visited = data.visited
        interaction.cv_dropped = data.cv_dropped
    else:
        # Créer une nouvelle interaction sinon
        interaction = Interaction(
            user_id=current_user.id,
            enterprise_id=data.enterprise_id,
            visited=data.visited,
            cv_dropped=data.cv_dropped
        )
        db.add(interaction)

    db.commit()
    db.refresh(interaction)
    return interaction

@router.get("/")
def get_my_interactions(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    return db.query(Interaction).filter(Interaction.user_id == current_user.id).all()