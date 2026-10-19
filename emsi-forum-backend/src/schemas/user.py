from typing import Optional
from pydantic import BaseModel, EmailStr

# --- Schéma de base contenant les champs communs ---
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    filiere: Optional[str] = None
    promo: Optional[str] = None
    site: Optional[str] = None
    classe: Optional[str] = None
    github_url: Optional[str] = None
    skills: Optional[str] = None
    role: str = "student"


# 1. Schéma pour la création d'un utilisateur (Signup)
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


# 2. Schéma pour la mise à jour du profil
class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    filiere: Optional[str] = None
    promo: Optional[str] = None
    site: Optional[str] = None
    classe: Optional[str] = None
    github_url: Optional[str] = None
    skills: Optional[str] = None


# 3. Schéma pour la réponse des données utilisateur
class UserResponse(UserBase):
    id: int
    cv_url: Optional[str] = None

    class Config:
        from_attributes = True


# 4. Schéma pour le retour du Token JWT
class Token(BaseModel):
    access_token: str
    token_type: str


# 5. Schéma pour les données encodées dans le Token
class TokenData(BaseModel):
    email: Optional[str] = None