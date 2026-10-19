from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from src.core.database import get_db
from src.api.deps import get_current_admin
from src.models.user import User
from src.models.interaction import Interaction
from src.models.survey import Survey
from src.models.enterprise import Enterprise

router = APIRouter(prefix="/admin", tags=["Admin"])

# Accessible UNIQUEMENT par l'admin (Depends(get_current_admin))
@router.get("/kpis")
def get_dashboard_kpis(
        db: Session = Depends(get_db),
        admin: User = Depends(get_current_admin)
):
    total_students = db.query(func.count(User.id)).filter(User.role == "student").scalar()
    total_cvs = db.query(func.count(Interaction.id)).filter(Interaction.cv_dropped == True).scalar()
    avg_rating = db.query(func.avg(Survey.rating)).scalar() or 0.0

    top_visited = (
        db.query(Enterprise.name, func.count(Interaction.id).label("visits"))
        .join(Interaction, Enterprise.id == Interaction.enterprise_id)
        .filter(Interaction.visited == True)
        .group_by(Enterprise.id)
        .order_by(func.count(Interaction.id).desc())
        .limit(3)
        .all()
    )

    return {
        "total_students": total_students,
        "total_cvs_dropped": total_cvs,
        "average_forum_rating": round(avg_rating, 2),
        "top_enterprises": [{"name": e.name, "visits": e.visits} for e in top_visited]
    }