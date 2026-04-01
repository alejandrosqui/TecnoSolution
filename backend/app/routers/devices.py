from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.device import Device
from app.models.user import User
from app.schemas.device import DeviceCreate, DeviceOut

router = APIRouter()


@router.post("/", response_model=DeviceOut)
async def create_device(
    data: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    device = Device(**data.model_dump())
    db.add(device)
    await db.commit()
    await db.refresh(device)
    return device


@router.get("/customer/{customer_id}", response_model=List[DeviceOut])
async def list_customer_devices(
    customer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Device)
        .where(Device.customer_id == customer_id)
        .order_by(Device.created_at.desc())
    )
    return result.scalars().all()
