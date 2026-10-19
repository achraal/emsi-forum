import os
import re
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.models.user import User
from src.schemas.user import UserResponse, UserUpdate
from src.api.deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])

UPLOAD_DIR = "uploads/cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def sanitize_filename(name: str) -> str:
    """Nettoie le nom et prénom pour éviter des erreurs dans les chemins système."""
    return re.sub(r'[^a-zA-Z0-9_-]', '_', name.strip())

@router.get("/", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/", response_model=UserResponse)
def update_profile(
        profile_data: UserUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/upload-cv", response_model=UserResponse)
async def upload_cv(
        file: UploadFile = File(...),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if file.content_type != "application/pdf" or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Format non autorisé. Seuls les fichiers PDF (.pdf) sont acceptés."
        )

    # Suppression de l'ancien CV physique
    if current_user.cv_url:
        old_path = current_user.cv_url.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    # Génération du nom sous la forme CV_Nom_Prenom_<uuid>.pdf
    safe_last_name = sanitize_filename(current_user.last_name or "Nom")
    safe_first_name = sanitize_filename(current_user.first_name or "Prenom")
    short_uid = uuid.uuid4().hex[:6]

    filename = f"CV_{safe_last_name}_{safe_first_name}_{short_uid}.pdf"
    file_path = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    current_user.cv_url = f"/{UPLOAD_DIR}/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/delete-cv", response_model=UserResponse)
def delete_cv(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    if current_user.cv_url:
        file_path = current_user.cv_url.lstrip("/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        current_user.cv_url = None
        db.commit()
        db.refresh(current_user)

    return current_user

@router.get("/cv/download")
def download_my_cv(current_user: User = Depends(get_current_user)):
    if not current_user.cv_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun CV n'a été téléversé pour cet utilisateur."
        )

    file_path = current_user.cv_url.lstrip("/")

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier introuvable sur le serveur."
        )

    safe_last_name = sanitize_filename(current_user.last_name or "Nom")
    safe_first_name = sanitize_filename(current_user.first_name or "Prenom")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"CV_{safe_last_name}_{safe_first_name}.pdf"
    )

@router.get("/my-qr-token")
def get_my_qr_token(current_user: User = Depends(get_current_user)):
    """Expose le token QR unique de l'étudiant connecté."""
    return {
        "qr_code_token": current_user.qr_code_token or f"EMSI-{current_user.id}-SECURE-QR",
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name
    }