import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class WorkOrder(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "work_orders"
    __table_args__ = (
        Index("idx_work_orders_order_number", "order_number"),
        Index("idx_work_orders_branch_status", "branch_id", "status"),
        Index("idx_work_orders_public_token", "public_token"),
    )

    order_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    branch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False
    )
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="received")
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    estimated_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    final_cost: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    estimated_ready_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    public_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    receptionist_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    deadline_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    alert_level: Mapped[str] = mapped_column(String(10), nullable=False, default="green")

    branch: Mapped["Branch"] = relationship("Branch", back_populates="work_orders")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="work_orders")
    device: Mapped["Device"] = relationship("Device", back_populates="work_orders")
    assigned_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to])
    receptionist: Mapped[Optional["User"]] = relationship("User", foreign_keys=[receptionist_id])

    status_history: Mapped[List["WorkOrderStatusHistory"]] = relationship(
        "WorkOrderStatusHistory", back_populates="work_order"
    )
    photos: Mapped[List["WorkOrderPhoto"]] = relationship("WorkOrderPhoto", back_populates="work_order")
    signature: Mapped[Optional["WorkOrderSignature"]] = relationship(
        "WorkOrderSignature", back_populates="work_order", uselist=False
    )
    items: Mapped[List["WorkOrderItem"]] = relationship("WorkOrderItem", back_populates="work_order")
    notes: Mapped[List["WorkOrderNote"]] = relationship("WorkOrderNote", back_populates="work_order")
    quotes: Mapped[List["Quote"]] = relationship("Quote", back_populates="work_order")
    stock_movements: Mapped[List["StockMovement"]] = relationship(
        "StockMovement", back_populates="work_order"
    )
    warranty: Mapped[Optional["Warranty"]] = relationship(
        "Warranty", back_populates="work_order", uselist=False
    )


class WorkOrderStatusHistory(UUIDMixin, Base):
    __tablename__ = "work_order_status_history"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False
    )
    old_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="status_history")
    changed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by])


class WorkOrderPhoto(UUIDMixin, Base):
    __tablename__ = "work_order_photos"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False
    )
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    photo_type: Mapped[str] = mapped_column(String(20), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="photos")
    uploaded_by_user: Mapped["User"] = relationship("User", foreign_keys=[uploaded_by])


class WorkOrderSignature(UUIDMixin, Base):
    __tablename__ = "work_order_signatures"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), unique=True, nullable=False
    )
    storage_key: Mapped[str] = mapped_column(Text, nullable=False)
    signed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    signer_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="signature")


class WorkOrderItem(UUIDMixin, Base):
    __tablename__ = "work_order_items"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)
    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=True
    )

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="items")
    product: Mapped[Optional["Product"]] = relationship("Product")


class WorkOrderNote(UUIDMixin, Base):
    __tablename__ = "work_order_notes"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="notes")
    author: Mapped["User"] = relationship("User", foreign_keys=[author_id])
