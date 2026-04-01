import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.plan import Subscription, PlanLimits, UsageCounter


async def get_active_subscription(company_id: uuid.UUID, db: AsyncSession) -> Subscription:
    result = await db.execute(
        select(Subscription).where(
            Subscription.company_id == company_id,
            Subscription.status == "active",
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=402, detail="No active subscription found")
    return sub


async def check_order_limit(company_id: uuid.UUID, branch_id: uuid.UUID, db: AsyncSession):
    """
    Verifica que la empresa no haya superado el límite de órdenes del plan.
    Levanta HTTPException 402 si está al límite.
    """
    sub = await get_active_subscription(company_id, db)

    result = await db.execute(
        select(PlanLimits).where(PlanLimits.plan_id == sub.plan_id)
    )
    limits = result.scalar_one_or_none()
    if not limits or limits.max_orders_per_month is None:
        return  # ilimitado

    now = datetime.utcnow()
    result = await db.execute(
        select(UsageCounter).where(
            UsageCounter.company_id == company_id,
            UsageCounter.metric == "orders_count",
            UsageCounter.period_year == now.year,
            UsageCounter.period_month == now.month,
        )
    )
    counter = result.scalar_one_or_none()
    current_count = counter.count if counter else 0

    if current_count >= limits.max_orders_per_month:
        raise HTTPException(
            status_code=402,
            detail=f"Plan limit reached: {limits.max_orders_per_month} orders/month. Upgrade your plan.",
        )


async def increment_order_counter(company_id: uuid.UUID, db: AsyncSession):
    """Incrementa el contador de órdenes del mes actual."""
    now = datetime.utcnow()
    result = await db.execute(
        select(UsageCounter).where(
            UsageCounter.company_id == company_id,
            UsageCounter.metric == "orders_count",
            UsageCounter.period_year == now.year,
            UsageCounter.period_month == now.month,
        )
    )
    counter = result.scalar_one_or_none()
    if counter:
        counter.count += 1
    else:
        db.add(
            UsageCounter(
                company_id=company_id,
                metric="orders_count",
                period_year=now.year,
                period_month=now.month,
                count=1,
            )
        )
    await db.commit()
