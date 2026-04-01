from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class PlanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    slug: str
    price_monthly: Optional[Decimal]
    is_active: bool


class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_id: UUID
    plan_id: UUID
    status: str
    current_period_start: datetime
    current_period_end: datetime
