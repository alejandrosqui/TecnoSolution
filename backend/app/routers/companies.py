from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_superadmin
from app.models.company import Company, Branch
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyOut, BranchCreate, BranchOut

router = APIRouter()


@router.post("/", response_model=CompanyOut)
async def create_company(
    data: CompanyCreate,
    current_user: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    company = Company(
        name=data.name,
        slug=data.slug,
        email=data.email,
        tax_id=data.tax_id,
        phone=data.phone,
        address=data.address,
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/{company_id}/branches", response_model=BranchOut)
async def create_branch(
    company_id: UUID,
    data: BranchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    branch = Branch(
        company_id=company_id,
        name=data.name,
        address=data.address,
        phone=data.phone,
        email=data.email,
    )
    db.add(branch)
    await db.commit()
    await db.refresh(branch)
    return branch


@router.get("/{company_id}/branches", response_model=List[BranchOut])
async def list_branches(
    company_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Branch).where(Branch.company_id == company_id))
    return result.scalars().all()
