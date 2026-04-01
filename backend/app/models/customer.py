import uuid
from typing import List, Optional

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Customer(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "customers"
    __table_args__ = (
        Index("idx_customers_company_id", "company_id"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("branches.id"), nullable=True
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    devices: Mapped[List["Device"]] = relationship("Device", back_populates="customer")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="customer")
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="customers")
