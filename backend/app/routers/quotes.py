from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from datetime import date
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.quote import Quote, QuoteStatusHistory
from app.models.user import User

router = APIRouter()


class QuoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    work_order_id: UUID
    quote_number: str
    status: str
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total: Decimal
    valid_until: Optional[date]
    notes: Optional[str]


class QuoteStatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None


@router.get("/{quote_id}", response_model=QuoteOut)
async def get_quote(
    quote_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.patch("/{quote_id}/status")
async def update_quote_status(
    quote_id: UUID,
    data: QuoteStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Quote).where(Quote.id == quote_id))
    quote = result.scalar_one_or_none()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    old_status = quote.status
    quote.status = data.status

    history = QuoteStatusHistory(
        quote_id=quote.id,
        old_status=old_status,
        new_status=data.status,
        changed_by=current_user.id,
        comment=data.comment,
    )
    db.add(history)
    await db.commit()
    return {"status": "updated", "new_status": data.status}
