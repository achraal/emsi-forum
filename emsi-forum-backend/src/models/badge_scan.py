from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from src.core.database import Base

class BadgeScan(Base):
    __tablename__ = "badge_scans"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    student_email = Column(String, nullable=False)
    scanned_by_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    scanned_by_email = Column(String, nullable=False)
    scanned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notes = Column(Text, nullable=True)
    location = Column(String, default="Forum EMSI", nullable=True)