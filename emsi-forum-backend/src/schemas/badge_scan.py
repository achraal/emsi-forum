from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ScanBadgeRequest(BaseModel):
    qr_token: str  # <-- Remplacé student_id par qr_token
    notes: Optional[str] = None
    location: Optional[str] = "Forum EMSI"

class ScanBadgeResponse(BaseModel):
    message: str
    scan_id: int
    scanned_at: datetime
    student: dict