from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.stock import Product, StockMovement
from app.models.user import User

router = APIRouter()


class ProductCreate(BaseModel):
    branch_id: UUID
    name: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    unit_cost: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    min_stock_alert: Optional[Decimal] = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    branch_id: UUID
    name: str
    sku: Optional[str]
    brand: Optional[str]
    category: Optional[str]
    unit_cost: Optional[Decimal]
    sale_price: Optional[Decimal]
    stock_quantity: Decimal
    is_active: bool


class StockMovementCreate(BaseModel):
    movement_type: str
    quantity: Decimal
    unit_cost: Optional[Decimal] = None
    reference: Optional[str] = None
    work_order_id: Optional[UUID] = None


@router.get("/", response_model=List[ProductOut])
async def list_products(
    branch_id: Optional[UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active == True)
    if branch_id:
        query = query.where(Product.branch_id == branch_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ProductOut)
async def create_product(
    data: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    product = Product(
        branch_id=data.branch_id,
        name=data.name,
        sku=data.sku,
        brand=data.brand,
        category=data.category,
        unit_cost=data.unit_cost,
        sale_price=data.sale_price,
        min_stock_alert=data.min_stock_alert,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/{product_id}/movements")
async def add_stock_movement(
    product_id: UUID,
    data: StockMovementCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movement = StockMovement(
        product_id=product_id,
        work_order_id=data.work_order_id,
        movement_type=data.movement_type,
        quantity=data.quantity,
        unit_cost=data.unit_cost,
        reference=data.reference,
        created_by=current_user.id,
    )
    db.add(movement)

    product.stock_quantity = float(product.stock_quantity) + float(data.quantity)
    await db.commit()
    return {"status": "ok", "new_stock": product.stock_quantity}
