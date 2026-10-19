from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.api.deps import get_current_user
from src.models.user import User
from src.models.badge_scan import BadgeScan
from src.schemas.badge_scan import ScanBadgeRequest, ScanBadgeResponse

router = APIRouter(prefix="/badge", tags=["Badge Scans"])

@router.post("/scan", response_model=ScanBadgeResponse)
def scan_student_badge(
        payload: ScanBadgeRequest,
        db: Session = Depends(get_db),
        current_scanner: User = Depends(get_current_user)  # Admin ou Recruteur connecté
):
    print("\n" + "="*50)
    print("🔍 [DEBUG SCAN] Tentative de scan reçue")
    print(f"👤 Scanner connecté : {current_scanner.email} (Rôle: {current_scanner.role})")
    print(f"🔑 Token QR reçu du frontend : '{payload.qr_token}'")
    print("="*50 + "\n")

    # 1. Vérifier si l'utilisateur qui scanne a les droits (Admin ou Recruteur)
    if current_scanner.role not in ["admin", "recruiter"]:
        print("❌ Erreur : Droits insuffisants pour ce rôle.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les administrateurs et recruteurs peuvent scanner des badges."
        )

    # 2. Chercher l'étudiant scanné via son token QR unique
    student = db.query(User).filter(User.qr_code_token == payload.qr_token).first()

    if not student:
        print(f"❌ ERREUR 404 : Aucun utilisateur trouvé en base avec le token '{payload.qr_token}'")

        # Afficher un aperçu des premiers tokens présents en base pour comparer
        sample_users = db.query(User.email, User.qr_code_token).limit(5).all()
        print("📋 Échantillon des tokens actuellement stockés en base :")
        for u in sample_users:
            print(f"   - Email: {u.email} | Token: {u.qr_code_token}")
        print("="*50 + "\n")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Étudiant introuvable avec ce token QR."
        )

    print(f"✅ SUCCÈS : Étudiant trouvé -> {student.first_name} {student.last_name} ({student.email})")

    # 3. Créer l'enregistrement de scan
    new_scan = BadgeScan(
        student_id=student.id,
        student_email=student.email,
        scanned_by_id=current_scanner.id,
        scanned_by_email=current_scanner.email,
        notes=payload.notes,
        location=payload.location
    )

    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)

    # 4. Renvoyer les infos complètes de l'étudiant scanné
    return {
        "message": "Badge scanné et validé avec succès",
        "scan_id": new_scan.id,
        "scanned_at": new_scan.scanned_at,
        "student": {
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email,
            "filiere": student.filiere,
            "promo": student.promo,
            "site": student.site,
            "cv_url": student.cv_url,
            "github_url": student.github_url,
            "skills": student.skills
        }
    }

@router.get("/my-scans")
def get_my_scanned_students(
        db: Session = Depends(get_db),
        current_scanner: User = Depends(get_current_user)
):
    scans = (
        db.query(BadgeScan)
        .filter(BadgeScan.scanned_by_id == current_scanner.id)
        .order_by(BadgeScan.scanned_at.desc())
        .all()
    )
    return scans

@router.get("/search-student")
def search_student_by_email(
        email: str = Query(..., description="Email ou partie de l'email à rechercher"),
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    # Vérifier les droits (Admin ou Recruteur)
    if current_user.role not in ["admin", "recruiter"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé."
        )

    # Recherche insensible à la casse sur l'email
    students = db.query(User).filter(User.email.ilike(f"%{email}%")).limit(10).all()

    return [
        {
            "id": s.id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "email": s.email,
            "filiere": s.filiere,
            "site": s.site,
            "qr_code_token": s.qr_code_token,
            "cv_url": s.cv_url
        }
        for s in students
    ]