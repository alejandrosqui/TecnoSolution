import datetime as dt
import secrets
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.middleware.plan_limits import check_order_limit, increment_order_counter
from app.models.company import Branch
from app.models.quote import Quote, QuoteItem
from app.models.user import User
from app.models.work_order import WorkOrder, WorkOrderStatusHistory
from app.schemas.work_order import WorkOrderCreate, WorkOrderOut, WorkOrderStatusUpdate

router = APIRouter()


class QuoteItemBody(BaseModel):
    description: str
    quantity: Decimal
    unit_price: Decimal
    item_type: str = "service"


class QuoteCreateBody(BaseModel):
    items: List[QuoteItemBody]
    tax_rate: Decimal = Decimal("0")
    valid_until: Optional[dt.date] = None
    notes: Optional[str] = None


async def _next_order_number(db: AsyncSession) -> str:
    year = dt.datetime.utcnow().year
    result = await db.execute(
        select(func.count(WorkOrder.id)).where(
            func.extract("year", WorkOrder.created_at) == year
        )
    )
    count = result.scalar() or 0
    return f"WO-{year}-{count + 1:06d}"


@router.get("/", response_model=List[WorkOrderOut])
async def list_work_orders(
    branch_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(WorkOrder)
    if branch_id:
        query = query.where(WorkOrder.branch_id == branch_id)
    if status:
        query = query.where(WorkOrder.status == status)
    query = query.order_by(WorkOrder.created_at.desc()).limit(100)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=WorkOrderOut)
async def create_work_order(
    data: WorkOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Branch).where(Branch.id == data.branch_id))
    branch = result.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    await check_order_limit(branch.company_id, data.branch_id, db)

    order = WorkOrder(
        order_number=await _next_order_number(db),
        branch_id=data.branch_id,
        customer_id=data.customer_id,
        device_id=data.device_id,
        assigned_to=current_user.id,
        status="received",
        priority=data.priority,
        problem_description=data.problem_description,
        estimated_cost=data.estimated_cost,
        received_at=dt.datetime.utcnow(),
        public_token=secrets.token_urlsafe(16),
    )
    db.add(order)
    await db.flush()  # obtener order.id antes del historial

    history = WorkOrderStatusHistory(
        work_order_id=order.id,
        old_status=None,
        new_status="received",
        changed_by=current_user.id,
        comment="Orden creada",
    )
    db.add(history)

    await db.commit()
    await db.refresh(order)
    await increment_order_counter(branch.company_id, db)

    return order


@router.get("/{order_id}", response_model=WorkOrderOut)
async def get_work_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")
    return order


@router.patch("/{order_id}/status")
async def update_work_order_status(
    order_id: UUID,
    data: WorkOrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Work order not found")

    old_status = order.status
    order.status = data.status

    history = WorkOrderStatusHistory(
        work_order_id=order.id,
        old_status=old_status,
        new_status=data.status,
        changed_by=current_user.id,
        comment=data.comment,
    )
    db.add(history)
    await db.commit()
    return {"status": "updated", "new_status": data.status}


@router.get("/{order_id}/history")
async def get_work_order_history(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkOrderStatusHistory)
        .where(WorkOrderStatusHistory.work_order_id == order_id)
        .order_by(WorkOrderStatusHistory.created_at.asc())
    )
    return result.scalars().all()


@router.post("/{work_order_id}/quotes")
async def create_quote_for_order(
    work_order_id: UUID,
    data: QuoteCreateBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """POST /api/work-orders/{id}/quotes"""
    result = await db.execute(select(WorkOrder).where(WorkOrder.id == work_order_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Work order not found")

    subtotal = sum(i.quantity * i.unit_price for i in data.items)
    tax_amount = subtotal * data.tax_rate / 100
    total = subtotal + tax_amount

    year = dt.datetime.utcnow().year
    count_result = await db.execute(select(func.count(Quote.id)))
    count = count_result.scalar() or 0

    quote = Quote(
        work_order_id=work_order_id,
        quote_number=f"Q-{year}-{count + 1:06d}",
        status="draft",
        subtotal=subtotal,
        tax_rate=data.tax_rate,
        tax_amount=tax_amount,
        total=total,
        valid_until=data.valid_until,
        notes=data.notes,
        created_by=current_user.id,
    )
    db.add(quote)
    await db.flush()

    for item in data.items:
        db.add(QuoteItem(
            quote_id=quote.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.quantity * item.unit_price,
            item_type=item.item_type,
        ))

    await db.commit()
    await db.refresh(quote)
    return quote
