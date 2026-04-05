from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.company import Company, Branch
from app.models.work_order import WorkOrder
from app.models.plan import Subscription
import datetime

router = APIRouter()

async def get_superadmin(current_user: User = Depends(get_current_user)):
    if not current_user.is_superadmin:
        raise HTTPException(status_code=403, detail="Superadmin only")
    return current_user

@router.get("/stats")
async def get_admin_stats(
    _=Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    # Total empresas
    companies_result = await db.execute(select(func.count()).select_from(Company))
    total_companies = companies_result.scalar()

    # Total usuarios
    users_result = await db.execute(select(func.count()).select_from(User))
    total_users = users_result.scalar()

    # Total órdenes
    orders_result = await db.execute(select(func.count()).select_from(WorkOrder))
    total_orders = orders_result.scalar()

    # Órdenes hoy
    today = datetime.datetime.utcnow().date()
    orders_today_result = await db.execute(
        select(func.count()).select_from(WorkOrder)
        .where(func.date(WorkOrder.created_at) == today)
    )
    orders_today = orders_today_result.scalar()

    return {
        "total_companies": total_companies,
        "total_users": total_users,
        "total_orders": total_orders,
        "orders_today": orders_today,
    }

@router.get("/companies")
async def get_admin_companies(
    _=Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).order_by(Company.created_at.desc()))
    companies = result.scalars().all()

    data = []
    for company in companies:
        # Contar órdenes
        orders_result = await db.execute(
            select(func.count()).select_from(WorkOrder)
            .join(Branch, Branch.id == WorkOrder.branch_id)
            .where(Branch.company_id == company.id)
        )
        total_orders = orders_result.scalar()

        # Contar usuarios
        users_result = await db.execute(
            select(func.count()).select_from(User)
            .join("branch_access")
            .where(Branch.company_id == company.id)
        )

        data.append({
            "id": str(company.id),
            "name": company.name,
            "email": company.email,
            "slug": company.slug,
            "created_at": company.created_at.isoformat(),
            "total_orders": total_orders,
        })

    return data

@router.get("/users")
async def get_admin_users(
    _=Depends(get_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()

    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "is_active": u.is_active,
            "is_superadmin": u.is_superadmin,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]
