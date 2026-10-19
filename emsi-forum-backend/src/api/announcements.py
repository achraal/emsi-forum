from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from exponent_server_sdk import PushClient, PushMessage, PushServerError
from src.core.database import get_db
from src.api.deps import get_current_user, get_current_admin
from src.models.user import User
from src.models.announcement import Announcement
from src.schemas.annoucements import AnnouncementCreate, AnnouncementResponse

router = APIRouter(prefix="/announcements", tags=["Announcements"])

# Fonction utilitaire pour envoyer les pushs en arrière-plan
def send_push_notifications(tokens: List[str], title: str, message: str):
    for token in tokens:
        try:
            PushClient().publish(
                PushMessage(to=token, title=title, body=message)
            )
        except PushServerError as exc:
            print(f"Erreur d'envoi push au token {token}: {exc}")

@router.post("/")
def create_announcement(
        data: AnnouncementCreate,
        background_tasks: BackgroundTasks, # Permet de ne pas bloquer la réponse API pendant l'envoi
        db: Session = Depends(get_db),
        admin: User = Depends(get_current_admin) # Sécurité : Admin uniquement
):
    # 1. Sauvegarder l'annonce dans la base de données
    announcement = Announcement(title=data.title, message=data.message)
    db.add(announcement)
    db.commit()

    # 2. Récupérer tous les tokens des utilisateurs (qui ont accepté les notifications)
    users_with_tokens = db.query(User.expo_push_token).filter(User.expo_push_token.isnot(None)).all()
    tokens = [u[0] for u in users_with_tokens]

    # 3. Lancer l'envoi des notifications en tâche de fond
    if tokens:
        background_tasks.add_task(send_push_notifications, tokens, data.title, data.message)

    return {"message": "Annonce créée et notifications envoyées !"}

@router.get("/")
def get_announcements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

# Route pour que l'app mobile enregistre son token
@router.put("/token")
def update_push_token(token_data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.expo_push_token = token_data.get("token")
    db.commit()
    return {"status": "Token mis à jour"}