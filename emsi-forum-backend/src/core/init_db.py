from sqlalchemy.orm import Session
from src.models.user import User
from src.models.enterprise import Enterprise
from src.core.security import get_password_hash

def init_db(db: Session):
    # 1. Vérifier / Créer le compte Admin par défaut
    admin_email = "admin@emsi.ma"
    existing_admin = db.query(User).filter(User.email == admin_email).first()

    if not existing_admin:
        admin_user = User(
            email=admin_email,
            hashed_password=get_password_hash("Admin123$"),  # Mot de passe par défaut
            first_name="Super",
            last_name="Admin",
            filiere="Administration",
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        print("Compte Administrateur par défaut créé : a****@emsi.ma / *********")

    # 2. Vérifier / Créer un exemple d'entreprise
    existing_enterprise = db.query(Enterprise).first()
    if not existing_enterprise:
        sample_enterprise = Enterprise(
            name="Capgemini Maroc",
            category="Diamond",
            logo_url="https://example.com/logo-capgemini.png",
            description="Leader mondial du conseil, de la transformation numérique et des services technologiques.",
            target_profiles="Ingénieur d'état en développement logiciel, Data Engineer, DevOps"
        )
        db.add(sample_enterprise)
        db.commit()
        print("Exemple d'entreprise ajouté : Capgemini Maroc")