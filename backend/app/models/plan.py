import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Plan(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "plans"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    price_monthly: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    price_yearly: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    limits: Mapped[Optional["PlanLimits"]] = relationship("PlanLimits", back_populates="plan", uselist=False)
    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="plan")


class PlanLimits(UUIDMixin, Base):
    __tablename__ = "plan_limits"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False, unique=True
    )
    max_orders_per_month: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_branches: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_users_per_branch: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_storage_gb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_stock: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_warranties: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_advanced_reports: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_email_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_public_query: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    plan: Mapped["Plan"] = relationship("Plan", back_populates="limits")


class Subscription(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "subscriptions"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    current_period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    company: Mapped["Company"] = relationship("Company", back_populates="subscriptions")
    plan: Mapped["Plan"] = relationship("Plan", back_populates="subscriptions")


class UsageCounter(UUIDMixin, Base):
    __tablename__ = "usage_counters"
    __table_args__ = (
        UniqueConstraint("company_id", "branch_id", "metric", "period_year", "period_month",
                         name="uq_usage_counters"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("branches.id"), nullable=True
    )
    metric: Mapped[str] = mapped_column(String(50), nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    company: Mapped["Company"] = relationship("Company", back_populates="usage_counters")
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="usage_counters")
