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
    query = select(Customer)
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
