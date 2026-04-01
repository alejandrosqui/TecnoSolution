from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class CompanyCreate(BaseModel):
    name: str
    slug: str
    email: str
    tax_id: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class CompanyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    email: Optional[str]
    is_active: bool
    created_at: datetime


class BranchCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class BranchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    name: str
    is_active: bool
    created_at: datetime
