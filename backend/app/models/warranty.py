import uuid
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Warranty(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "warranties"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), unique=True, nullable=False
    )
    warranty_months: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    starts_at: Mapped[date] = mapped_column(Date, nullable=False)
    expires_at: Mapped[date] = mapped_column(Date, nullable=False)
    terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="warranty")
    claims: Mapped[List["WarrantyClaim"]] = relationship("WarrantyClaim", back_populates="warranty")


class WarrantyClaim(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "warranty_claims"

    warranty_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("warranties.id"), nullable=False
    )
    new_work_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    warranty: Mapped["Warranty"] = relationship("Warranty", back_populates="claims")
    new_work_order: Mapped[Optional["WorkOrder"]] = relationship(
        "WorkOrder", foreign_keys=[new_work_order_id]
    )
