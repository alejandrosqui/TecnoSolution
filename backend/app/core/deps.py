import uuid
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserBranchAccess

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


async def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return current_user


async def get_user_branch_role(
    branch_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Optional[str]:
    """Returns the role of the user in a specific branch, or None."""
    if current_user.is_superadmin:
        return "superadmin"
    result = await db.execute(
        select(UserBranchAccess).where(
            UserBranchAccess.user_id == current_user.id,
            UserBranchAccess.branch_id == branch_id,
            UserBranchAccess.is_active == True,
        )
    )
    access = result.scalar_one_or_none()
    return access.role if access else None
