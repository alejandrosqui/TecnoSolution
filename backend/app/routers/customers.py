from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerOut

router = APIRouter()


@router.get("/", response_model=List[CustomerOut])
async def list_customers(
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import UserBranchAccess
    from app.models.company import Branch
    # Obtener companies del usuario logueado
    access_result = await db.execute(
        select(Branch.company_id).join(
            UserBranchAccess, UserBranchAccess.branch_id == Branch.id
        ).where(
            UserBranchAccess.user_id == current_user.id,
            UserBranchAccess.is_active == True,
        )
    )
    user_company_ids = [row[0] for row in access_result.all()]

    query = select(Customer).where(Customer.company_id.in_(user_company_ids))
    if search:
        query = query.where(
            Customer.full_name.ilike(f"%{search}%")
            | Customer.email.ilike(f"%{search}%")
            | Customer.phone.ilike(f"%{search}%")
        )
    query = query.order_by(Customer.created_at.desc()).limit(100)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=CustomerOut)
async def create_customer(
    data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    customer = Customer(
        company_id=data.company_id,
        branch_id=data.branch_id,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        address=data.address,
        notes=data.notes,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(
    customer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.get("/{customer_id}/orders")
async def get_customer_orders(
    customer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.work_order import WorkOrder
    from app.models.device import Device
    result = await db.execute(
        select(WorkOrder).where(WorkOrder.customer_id == customer_id)
        .order_by(WorkOrder.created_at.desc())
    )
    orders = result.scalars().all()
    enriched = []
    for order in orders:
        device_result = await db.execute(select(Device).where(Device.id == order.device_id))
        device = device_result.scalar_one_or_none()
        enriched.append({
            "id": str(order.id),
            "order_number": order.order_number,
            "status": order.status,
            "priority": order.priority,
            "problem_description": order.problem_description,
            "received_at": order.received_at.isoformat(),
            "device_brand": device.brand if device else None,
            "device_model": device.model if device else None,
            "device_type": device.device_type if device else None,
        })
    return enriched
@router.patch("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: UUID,
    data: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if data.full_name: customer.full_name = data.full_name
    if data.email is not None: customer.email = data.email
    if data.phone is not None: customer.phone = data.phone
    if data.address is not None: customer.address = data.address
    await db.commit()
    await db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.delete(customer)
    await db.commit()
    return {"ok": True}
