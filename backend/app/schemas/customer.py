from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class CustomerCreate(BaseModel):
    company_id: UUID
    branch_id: Optional[UUID] = None
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime
