from sqlalchemy import Column, Integer, String, Text
from src.core.database import Base

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    filiere = Column(String, nullable=True)
    promo = Column(String, nullable=True)
    site = Column(String, nullable=True)
    classe = Column(String, nullable=True)
    cv_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    skills = Column(Text, nullable=True)
    role = Column(String, default="student", nullable=False)
    expo_push_token = Column(String, nullable=True)
    qr_code_token = Column(String, unique=True, index=True, nullable=True)