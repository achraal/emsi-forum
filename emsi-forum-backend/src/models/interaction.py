from sqlalchemy import Column, Integer, ForeignKey, Boolean
from src.core.database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    enterprise_id = Column(Integer, ForeignKey("enterprises.id", ondelete="CASCADE"), nullable=False)

    # Les deux actions possibles
    visited = Column(Boolean, default=False)
    cv_dropped = Column(Boolean, default=False)