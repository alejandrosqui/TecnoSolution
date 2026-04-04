from typing import List, Optional
from uuid import UUID
from io import BytesIO
import uuid as uuid_lib

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_superadmin
from app.core.minio_client import minio_client
from app.core.config import settings
from app.models.company import Company, Branch
from app.models.user import User, UserBranchAccess
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


@router.get("/my/settings")
async def get_my_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Company).join(Branch, Branch.company_id == Company.id)
        .join(UserBranchAccess, UserBranchAccess.branch_id == Branch.id)
        .where(UserBranchAccess.user_id == current_user.id)
        .limit(1)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": str(company.id),
        "name": company.name,
        "email": company.email,
        "phone": company.phone,
        "address": company.address,
        "tax_id": company.tax_id,
        "logo_url": company.logo_url,
        "favicon_url": company.favicon_url,
        "banner_url": company.banner_url,
        "slogan": company.slogan,
        "primary_color": company.primary_color,
        "secondary_color": company.secondary_color,
	"default_diagnosis_hours": company.default_diagnosis_hours,
	"default_repair_hours": company.default_repair_hours,
	"default_waiting_days": company.default_waiting_days,
	"default_pickup_days": company.default_pickup_days,
	"pickup_alert_enabled": company.pickup_alert_enabled,
	"policies": company.policies,
    }


@router.patch("/my/settings")
async def update_my_settings(
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    tax_id: Optional[str] = Form(None),
    slogan: Optional[str] = Form(None),
    primary_color: Optional[str] = Form(None),
    secondary_color: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    favicon: Optional[UploadFile] = File(None),
    banner: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    default_diagnosis_hours: Optional[int] = Form(None),
    default_repair_hours: Optional[int] = Form(None),
    default_waiting_days: Optional[int] = Form(None),
    default_pickup_days: Optional[int] = Form(None),
    pickup_alert_enabled: Optional[str] = Form(None),
    policies: Optional[str] = Form(None),
):
    result = await db.execute(
        select(Company).join(Branch, Branch.company_id == Company.id)
        .join(UserBranchAccess, UserBranchAccess.branch_id == Branch.id)
        .where(UserBranchAccess.user_id == current_user.id)
        .limit(1)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if name: company.name = name
    if email: company.email = email
    if phone: company.phone = phone
    if address: company.address = address
    if tax_id: company.tax_id = tax_id
    if slogan: company.slogan = slogan
    if primary_color: company.primary_color = primary_color
    if secondary_color: company.secondary_color = secondary_color
    if default_diagnosis_hours: company.default_diagnosis_hours = default_diagnosis_hours
    if default_repair_hours: company.default_repair_hours = default_repair_hours
    if default_waiting_days: company.default_waiting_days = default_waiting_days
    if default_pickup_days: company.default_pickup_days = default_pickup_days
    if pickup_alert_enabled is not None: company.pickup_alert_enabled = pickup_alert_enabled == 'true'
    if policies is not None: company.policies = policies

    async def upload_image(file: UploadFile, field: str):
        content = await file.read()
        ext = file.filename.split(".")[-1] if "." in file.filename else "png"
        key = f"{company.id}/branding/{field}-{uuid_lib.uuid4()}.{ext}"
        minio_client.put_object(
            settings.minio_bucket_docs,
            key,
            BytesIO(content),
            length=len(content),
            content_type=file.content_type or "image/png",
        )
        return f"https://tecnosolution.com.ar/storage/{settings.minio_bucket_docs}/{key}"

    if logo: company.logo_url = await upload_image(logo, "logo")
    if favicon: company.favicon_url = await upload_image(favicon, "favicon")
    if banner: company.banner_url = await upload_image(banner, "banner")

    await db.commit()
    await db.refresh(company)
    return {"ok": True, "logo_url": company.logo_url, "favicon_url": company.favicon_url}


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
