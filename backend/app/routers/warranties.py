from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.warranty import Warranty, WarrantyClaim
from app.models.work_order import WorkOrder
from app.models.user import User

router = APIRouter()

class WarrantyCreate(BaseModel):
    work_order_id: UUID
    warranty_months: int = 3
    starts_at: date
    terms: Optional[str] = None

class WarrantyClaimCreate(BaseModel):
    description: str

class WarrantyClaimOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    description: str
    status: str
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime

class WarrantyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    work_order_id: UUID
    warranty_months: int
    starts_at: date
    expires_at: date
    terms: Optional[str]
    is_active: bool
    claims: List[WarrantyClaimOut] = []
    order_number: Optional[str] = None
    customer_name: Optional[str] = None
    device_name: Optional[str] = None

@router.get("/", response_model=List[WarrantyOut])
async def list_warranties(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Warranty)
        .options(
            selectinload(Warranty.claims),
            selectinload(Warranty.work_order).selectinload(WorkOrder.customer),
            selectinload(Warranty.work_order).selectinload(WorkOrder.device),
        )
        .order_by(Warranty.expires_at.asc())
    )
    warranties = result.scalars().all()
    out = []
    for w in warranties:
        wo = w.work_order
        item = WarrantyOut(
            id=w.id,
            work_order_id=w.work_order_id,
            warranty_months=w.warranty_months,
            starts_at=w.starts_at,
            expires_at=w.expires_at,
            terms=w.terms,
            is_active=w.is_active,
            claims=[WarrantyClaimOut.model_validate(c) for c in w.claims],
            order_number=wo.order_number if wo else None,
            customer_name=wo.customer.full_name if wo and wo.customer else None,
            device_name=f"{wo.device.brand} {wo.device.model}" if wo and wo.device else None,
        )
        out.append(item)
    return out

@router.post("/", response_model=WarrantyOut)
async def create_warranty(
    data: WarrantyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import timedelta
    from dateutil.relativedelta import relativedelta
    expires = data.starts_at + relativedelta(months=data.warranty_months)
    warranty = Warranty(
        work_order_id=data.work_order_id,
        warranty_months=data.warranty_months,
        starts_at=data.starts_at,
        expires_at=expires,
        terms=data.terms,
    )
    db.add(warranty)
    await db.commit()
    await db.refresh(warranty)
    return WarrantyOut(
        id=warranty.id,
        work_order_id=warranty.work_order_id,
        warranty_months=warranty.warranty_months,
        starts_at=warranty.starts_at,
        expires_at=warranty.expires_at,
        terms=warranty.terms,
        is_active=warranty.is_active,
        claims=[],
    )

@router.post("/{warranty_id}/claims", response_model=WarrantyClaimOut)
async def add_claim(
    warranty_id: UUID,
    data: WarrantyClaimCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Warranty).where(Warranty.id == warranty_id))
    warranty = result.scalar_one_or_none()
    if not warranty:
        raise HTTPException(status_code=404, detail="Garantía no encontrada")
    claim = WarrantyClaim(
        warranty_id=warranty_id,
        description=data.description,
        status="open",
    )
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    return claim
