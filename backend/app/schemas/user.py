from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    phone: Optional[str]
    is_active: bool
    is_superadmin: bool
    created_at: datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    phone: Optional[str] = None
