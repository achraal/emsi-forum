from pydantic import BaseModel
from typing import Optional

class EnterpriseBase(BaseModel):
    name: str
    category: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    target_profiles: Optional[str] = None

class EnterpriseCreate(EnterpriseBase):
    pass

class EnterpriseUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    target_profiles: Optional[str] = None

class EnterpriseResponse(EnterpriseBase):
    id: int

    class Config:
        from_attributes = True