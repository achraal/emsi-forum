from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime
from sqlalchemy.sql import func
from src.core.database import Base

class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False, unique=True)

    rating = Column(Integer, nullable=False) # Note sur 5
    feedback = Column(Text, nullable=True) # Commentaire optionnel
    created_at = Column(DateTime(timezone=True), server_default=func.now())