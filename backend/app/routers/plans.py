from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.plan import Plan, Subscription
from app.models.user import User, UserBranchAccess
from app.schemas.plan import PlanOut, SubscriptionOut

router = APIRouter()


@router.get("/", response_model=List[PlanOut])
async def list_plans(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Plan).where(Plan.is_active == True))
    return result.scalars().all()


@router.get("/current", response_model=SubscriptionOut)
async def get_current_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get company_id from user's first active branch access
    access_result = await db.execute(
        select(UserBranchAccess).where(
            UserBranchAccess.user_id == current_user.id,
            UserBranchAccess.is_active == True,
        )
    )
    access = access_result.scalar_one_or_none()
    if not access:
        raise HTTPException(status_code=404, detail="No branch access found for user")

    from app.models.company import Branch
    branch_result = await db.execute(select(Branch).where(Branch.id == access.branch_id))
    branch = branch_result.scalar_one_or_none()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    result = await db.execute(
        select(Subscription).where(
            Subscription.company_id == branch.company_id,
            Subscription.status == "active",
        )
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    return subscription
