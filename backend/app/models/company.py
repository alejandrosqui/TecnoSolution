import uuid
from typing import List, Optional

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Company(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    tax_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    branches: Mapped[List["Branch"]] = relationship("Branch", back_populates="company")
    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="company")
    usage_counters: Mapped[List["UsageCounter"]] = relationship("UsageCounter", back_populates="company")


class Branch(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "branches"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    company: Mapped["Company"] = relationship("Company", back_populates="branches")
    user_access: Mapped[List["UserBranchAccess"]] = relationship(
        "UserBranchAccess", back_populates="branch"
    )
    customers: Mapped[List["Customer"]] = relationship("Customer", back_populates="branch")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="branch")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="branch")
    usage_counters: Mapped[List["UsageCounter"]] = relationship("UsageCounter", back_populates="branch")
