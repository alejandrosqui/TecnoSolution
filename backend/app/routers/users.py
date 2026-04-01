from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import get_password_hash
from app.models.user import User, UserBranchAccess
from app.schemas.user import UserCreate, UserOut

router = APIRouter()


@router.get("/", response_model=List[UserOut])
async def list_users(
    branch_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if branch_id:
        result = await db.execute(
            select(User)
            .join(UserBranchAccess, UserBranchAccess.user_id == User.id)
            .where(UserBranchAccess.branch_id == branch_id, UserBranchAccess.is_active == True)
        )
    else:
        result = await db.execute(select(User))
    return result.scalars().all()


@router.post("/", response_model=UserOut)
async def create_user(
    data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


class RoleUpdate(BaseModel):
    branch_id: UUID
    role: str


@router.patch("/{user_id}/role")
async def update_user_role(
    user_id: UUID,
    data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBranchAccess).where(
            UserBranchAccess.user_id == user_id,
            UserBranchAccess.branch_id == data.branch_id,
        )
    )
    access = result.scalar_one_or_none()
    if not access:
        raise HTTPException(status_code=404, detail="User branch access not found")
    access.role = data.role
    await db.commit()
    return {"status": "updated", "role": data.role}
