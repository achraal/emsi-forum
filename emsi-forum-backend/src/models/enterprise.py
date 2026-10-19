from sqlalchemy import Column, Integer, String, Text
from src.core.database import Base

class Enterprise(Base):
    __tablename__ = "enterprises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    # Catégorie de sponsor (ex: "Diamond", "Gold", "Silver")
    category = Column(String, index=True, nullable=True)
    # Lien vers le logo de l'entreprise
    logo_url = Column(String, nullable=True)

    # Introduction/Description de l'entreprise
    description = Column(Text, nullable=True)
    # Profils recherchés (ex: "Ingénieur d'état en développement", "Data Scientist")
    target_profiles = Column(Text, nullable=True)