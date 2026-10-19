import uuid, httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.core.security import get_password_hash, verify_password, create_access_token, pwd_context
from src.models.user import User
from src.schemas.user import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Vérification du domaine de l'email
    if not user.email.endswith("@emsi-edu.ma"):
        raise HTTPException(
            status_code=400,
            detail="Seules les adresses email de l'école (@emsi-edu.ma) sont autorisées."
        )

    # 2. Vérification si l'email existe déjà
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # 3. Génération d'un token QR unique et sécurisé (ex: EMSI-2026-uuid)
    unique_qr_token = f"EMSI-2026-{uuid.uuid4()}"

    # 4. Création de l'utilisateur avec hachage Argon2 et son token QR
    new_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
        qr_code_token=unique_qr_token  # <-- Attribué ici
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    if pwd_context.needs_update(user.hashed_password):
        user.hashed_password = get_password_hash(form_data.password)
        db.commit()

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# Remplacez ces valeurs par vos vrais identifiants Azure AD (Microsoft Entra ID)
MS_CLIENT_ID = "VOTRE_MICROSOFT_CLIENT_ID"
MS_CLIENT_SECRET = "VOTRE_MICROSOFT_CLIENT_SECRET" # Optionnel si application publique, requis si application confidentielle
MS_TENANT_ID = "common"  # ou votre Tenant ID spécifique EMSI

@router.post("/microsoft")
async def microsoft_auth(payload: dict, db: Session = Depends(get_db)):
    code = payload.get("code")
    redirect_uri = payload.get("redirect_uri")

    if not code or not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le code d'autorisation Microsoft et l'URI de redirection sont requis."
        )

    token_url = f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token"

    # 1. Échanger le code d'autorisation Microsoft contre un Access Token Microsoft
    token_data = {
        "client_id": MS_CLIENT_ID,
        "scope": "openid profile email User.Read",
        "code": code,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
        # "client_secret": MS_CLIENT_SECRET, # Décommentez si votre app Azure AD nécessite un secret
    }

    async with httpx.AsyncClient() as client:
        try:
            token_response = await client.post(token_url, data=token_data)
            token_json = token_response.json()

            if "access_token" not in token_json:
                print("Erreur Microsoft Token Response:", token_json)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Échec de l'authentification auprès des serveurs Microsoft."
                )

            ms_access_token = token_json["access_token"]

            # 2. Récupérer le profil de l'utilisateur via Microsoft Graph API
            graph_response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {ms_access_token}"}
            )
            graph_json = graph_response.json()

            # L'email peut se trouver dans 'mail' ou 'userPrincipalName'
            email = (graph_json.get("mail") or graph_json.get("userPrincipalName") or "").lower().strip()
            first_name = graph_json.get("givenName") or "Étudiant"
            last_name = graph_json.get("surname") or "EMSI"

        except httpx.HTTPError as e:
            print("Erreur HTTP Graph API:", str(e))
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erreur de communication avec les services Microsoft."
            )

    # 3. Valider que l'email appartient bien au domaine institutionnel EMSI
    if not email.endswith("@emsi-edu.ma"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé. Seules les adresses e-mail '@emsi-edu.ma' sont autorisées."
        )

    # 4. Vérifier si l'utilisateur existe déjà en base de données
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Création automatique de l'utilisateur s'il n'existe pas
        unique_qr_token = f"EMSI-2026-{uuid.uuid4()}"
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            role="student",  # Rôle par défaut
            hashed_password=get_password_hash(str(uuid.uuid4())), # Mot de passe aléatoire sécurisé (non utilisé via Microsoft)
            qr_code_token=unique_qr_token
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # S'assurer qu'il possède bien un token QR s'il a été créé avant
        if not user.qr_code_token:
            user.qr_code_token = f"EMSI-2026-{uuid.uuid4()}"
            db.commit()
            db.refresh(user)

    # 5. Générer le JWT interne de votre application FastAPI
    access_token = create_access_token(data={"sub": user.email})

    # 6. Renvoyer le token et le profil complet au frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "qr_code_token": user.qr_code_token
        }
    }