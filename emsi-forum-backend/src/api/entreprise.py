import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.core.database import get_db
from src.models.enterprise import Enterprise
from src.schemas.enterprise import EnterpriseCreate, EnterpriseUpdate, EnterpriseResponse
from src.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/enterprises", tags=["Enterprises"])

LOGO_DIR = "uploads/logos"
os.makedirs(LOGO_DIR, exist_ok=True)

@router.get("/", response_model=List[EnterpriseResponse])
def get_enterprises(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Enterprise).all()

@router.post("/", response_model=EnterpriseResponse, status_code=status.HTTP_201_CREATED)
def create_enterprise(
        enterprise: EnterpriseCreate,
        db: Session = Depends(get_db),
        admin = Depends(get_current_admin)
):
    db_enterprise = Enterprise(**enterprise.model_dump())
    db.add(db_enterprise)
    db.commit()
    db.refresh(db_enterprise)
    return db_enterprise

# Route pour uploader le logo de l'entreprise (Admin uniquement)
@router.post("/upload-logo", response_model=dict)
async def upload_logo(
        file: UploadFile = File(...),
        admin = Depends(get_current_admin)
):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les formats d'image (PNG, JPG, JPEG, WEBP) sont acceptés."
        )

    filename = f"logo_{uuid.uuid4().hex[:8]}_{file.filename}"
    file_path = os.path.join(LOGO_DIR, filename)

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    return {"logo_url": f"/{LOGO_DIR}/{filename}"}

@router.put("/{enterprise_id}", response_model=EnterpriseResponse)
def update_enterprise(
        enterprise_id: int,
        enterprise_data: EnterpriseUpdate,
        db: Session = Depends(get_db),
        admin = Depends(get_current_admin)
):
    db_enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not db_enterprise:
        raise HTTPException(status_code=404, detail="Entreprise introuvable.")

    for key, value in enterprise_data.model_dump(exclude_unset=True).items():
        setattr(db_enterprise, key, value)

    db.commit()
    db.refresh(db_enterprise)
    return db_enterprise

@router.delete("/{enterprise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enterprise(
        enterprise_id: int,
        db: Session = Depends(get_db),
        admin = Depends(get_current_admin)
):
    db_enterprise = db.query(Enterprise).filter(Enterprise.id == enterprise_id).first()
    if not db_enterprise:
        raise HTTPException(status_code=404, detail="Entreprise introuvable.")

    db.delete(db_enterprise)
    db.commit()
    return None