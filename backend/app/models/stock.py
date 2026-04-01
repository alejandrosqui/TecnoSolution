import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Product(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (Index("idx_products_branch_id", "branch_id"),)

    branch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    unit_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    sale_price: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    stock_quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    min_stock_alert: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    branch: Mapped["Branch"] = relationship("Branch", back_populates="products")
    stock_movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement", back_populates="product"
    )


class StockMovement(UUIDMixin, Base):
    __tablename__ = "stock_movements"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    work_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True
    )
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    product: Mapped["Product"] = relationship("Product", back_populates="stock_movements")
    work_order: Mapped[Optional["WorkOrder"]] = relationship(
        "WorkOrder", back_populates="stock_movements"
    )
    created_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by])
