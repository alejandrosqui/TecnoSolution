import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, get_password_hash
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.company import Branch, Company
from datetime import datetime, timedelta
from app.models.plan import Plan, Subscription
from app.models.user import User, UserBranchAccess
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest
from app.schemas.user import UserOut

router = APIRouter()


class RegisterRequest(BaseModel):
    company_name: str
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[áàä]', 'a', slug)
    slug = re.sub(r'[éèë]', 'e', slug)
    slug = re.sub(r'[íìï]', 'i', slug)
    slug = re.sub(r'[óòö]', 'o', slug)
    slug = re.sub(r'[úùü]', 'u', slug)
    slug = re.sub(r'[ñ]', 'n', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check email not taken
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    # Generate unique slug
    base_slug = _slugify(data.company_name)
    slug = base_slug
    counter = 1
    while True:
        taken = await db.execute(select(Company).where(Company.slug == slug))
        if not taken.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create company
    company = Company(name=data.company_name, slug=slug, email=data.email)
    db.add(company)
    await db.flush()
    # Create default subscription (use first active plan or create basic)
    plan_result = await db.execute(select(Plan).where(Plan.is_active == True).limit(1))
    plan = plan_result.scalar_one_or_none()
    if plan:
        subscription = Subscription(
            company_id=company.id,
            plan_id=plan.id,
            status="active",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=365),
        )
        db.add(subscription)

    # Create default branch
    branch = Branch(company_id=company.id, name="Casa central", email=data.email)
    db.add(branch)
    await db.flush()

    # Create user
    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    await db.flush()

    # Grant admin access to branch
    access = UserBranchAccess(user_id=user.id, branch_id=branch.id, role="admin")
    db.add(access)

    await db.commit()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expire_minutes * 60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expire_minutes * 60,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.jwt_expire_minutes * 60,
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/context")
async def get_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBranchAccess, Branch, Company)
        .join(Branch, Branch.id == UserBranchAccess.branch_id)
        .join(Company, Company.id == Branch.company_id)
        .where(
            UserBranchAccess.user_id == current_user.id,
            UserBranchAccess.is_active == True,
        )
    )
    rows = result.all()
    branches = [
        {
            "branch_id": str(access.branch_id),
            "branch_name": branch.name,
            "company_id": str(branch.company_id),
            "company_name": company.name,
            "role": access.role,
        }
        for access, branch, company in rows
    ]
    return {"branches": branches}
