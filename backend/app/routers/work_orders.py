import datetime as dt
import secrets
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from app.core.email import send_status_email
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

async def _next_order_number(db: AsyncSession, company_id: UUID) -> str:
    year = dt.datetime.utcnow().year
    # Prefijo único por empresa (últimos 4 chars del UUID)
    prefix = f"WO-{year}-{str(company_id)[-4:].upper()}-"
    result = await db.execute(
        select(WorkOrder.order_number)
        .join(Branch, Branch.id == WorkOrder.branch_id)
        .where(
            Branch.company_id == company_id,
            WorkOrder.order_number.like(f"{prefix}%"),
        )
        .order_by(WorkOrder.order_number.desc())
        .limit(1)
    )
    last = result.scalar()
    if last:
        last_num = int(last.split("-")[-1])
    else:
        last_num = 0
    return f"{prefix}{last_num + 1:06d}"


@router.get("/", response_model=List[WorkOrderOut])
async def list_work_orders(
    branch_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.user import UserBranchAccess
    from app.models.customer import Customer
    from app.models.device import Device
    access_result = await db.execute(
        select(UserBranchAccess.branch_id).where(
            UserBranchAccess.user_id == current_user.id,
            UserBranchAccess.is_active == True,
        )
    )
    user_branch_ids = [row[0] for row in access_result.all()]

    query = select(WorkOrder).where(WorkOrder.branch_id.in_(user_branch_ids))
    if branch_id:
        query = query.where(WorkOrder.branch_id == branch_id)
    if status:
        query = query.where(WorkOrder.status == status)
    query = query.order_by(WorkOrder.created_at.desc()).limit(100)
    result = await db.execute(query)
    orders = result.scalars().all()

    # Enriquecer con datos de cliente y dispositivo
    enriched = []
    for order in orders:
        customer_result = await db.execute(select(Customer).where(Customer.id == order.customer_id))
        customer = customer_result.scalar_one_or_none()
        device_result = await db.execute(select(Device).where(Device.id == order.device_id))
        device = device_result.scalar_one_or_none()
        order_dict = {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status,
            "priority": order.priority,
            "customer_id": order.customer_id,
            "device_id": order.device_id,
            "branch_id": order.branch_id,
            "assigned_to": order.assigned_to,
            "problem_description": order.problem_description,
            "diagnosis_notes": order.diagnosis_notes,
            "final_cost": order.final_cost,
            "received_at": order.received_at,
            "created_at": order.created_at,
            "public_token": order.public_token,
            "customer_name": customer.full_name if customer else None,
            "customer_phone": customer.phone if customer else None,
            "device_brand": device.brand if device else None,
            "device_model": device.model if device else None,
            "device_type": device.device_type if device else None,
        }
        enriched.append(WorkOrderOut(**order_dict))
    return enriched


@router.post("/", response_model=WorkOrderOut)
async def create_work_order(
    data: WorkOrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.company import Branch, Company
    from app.models.plan import Subscription
    import datetime as dt_module

    result = await db.execute(select(Branch).where(Branch.id == data.branch_id))
    branch = result.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    await check_order_limit(branch.company_id, data.branch_id, db)

    # Obtener settings de la empresa para el deadline por defecto
    company_result = await db.execute(select(Company).where(Company.id == branch.company_id))
    company = company_result.scalar_one_or_none()
    default_hours = getattr(company, 'default_diagnosis_hours', 48) or 48

    # Calcular deadline
    hours = data.estimated_hours or default_hours
    deadline = dt_module.datetime.utcnow() + dt_module.timedelta(hours=hours)

    order = WorkOrder(
        order_number=await _next_order_number(db, branch.company_id),
        branch_id=data.branch_id,
        customer_id=data.customer_id,
        device_id=data.device_id,
        assigned_to=current_user.id,
        receptionist_id=current_user.id,
        status="received",
        priority=data.priority,
        problem_description=data.problem_description,
        estimated_cost=data.estimated_cost,
        received_at=dt_module.datetime.utcnow(),
        deadline_at=deadline,
        alert_level="green",
        public_token=secrets.token_urlsafe(16),
    )
    db.add(order)
    await db.flush()

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

    return WorkOrderOut(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        priority=order.priority,
        customer_id=order.customer_id,
        device_id=order.device_id,
        branch_id=order.branch_id,
        assigned_to=order.assigned_to,
        receptionist_id=order.receptionist_id,
        problem_description=order.problem_description,
        diagnosis_notes=order.diagnosis_notes,
        final_cost=order.final_cost,
        received_at=order.received_at,
        created_at=order.created_at,
        deadline_at=order.deadline_at,
        alert_level=order.alert_level,
        public_token=order.public_token,
    )

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
    try:
        from app.models.customer import Customer
        from app.models.company import Branch, Company
        customer_result = await db.execute(select(Customer).where(Customer.id == order.customer_id))
        customer = customer_result.scalar_one_or_none()
        branch_result = await db.execute(
            select(Company).join(Branch, Branch.company_id == Company.id)
            .where(Branch.id == order.branch_id)
        )
        company = branch_result.scalar_one_or_none()
        status_display = {
            "received": "Recibido", "queued": "En cola", "diagnosing": "En diagnóstico",
            "waiting_customer_approval": "Esperando aprobación", "quote_sent": "Presupuesto enviado",
            "approved": "Aprobado", "rejected": "Rechazado", "waiting_parts": "Esperando repuestos",
            "repairing": "En reparación", "repaired": "Reparado",
            "ready_for_pickup": "Listo para retirar", "delivered": "Entregado",
            "warranty": "En garantía", "cancelled": "Cancelado",
        }.get(data.status, data.status)
        if customer and customer.email:
            await send_status_email(
                to_email=customer.email,
                customer_name=customer.full_name,
                order_number=order.order_number,
                status_display=status_display,
                company_name=company.name if company else "TecnoSolution",
                public_token=order.public_token,
            )
    except Exception as e:
        print(f"EMAIL ERROR: {e}")
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


@router.get("/{work_order_id}/quotes")
async def list_quotes_for_order(
    work_order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Quote)
        .where(Quote.work_order_id == work_order_id)
        .order_by(Quote.created_at.desc())
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
