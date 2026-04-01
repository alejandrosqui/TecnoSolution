import uuid
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Quote(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "quotes"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=False
    )
    quote_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0)
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pdf_storage_key: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )

    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="quotes")
    created_by_user: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    items: Mapped[List["QuoteItem"]] = relationship("QuoteItem", back_populates="quote")
    status_history: Mapped[List["QuoteStatusHistory"]] = relationship(
        "QuoteStatusHistory", back_populates="quote"
    )


class QuoteItem(UUIDMixin, Base):
    __tablename__ = "quote_items"

    quote_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quotes.id"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    item_type: Mapped[str] = mapped_column(String(20), nullable=False)

    quote: Mapped["Quote"] = relationship("Quote", back_populates="items")


class QuoteStatusHistory(UUIDMixin, Base):
    __tablename__ = "quote_status_history"

    quote_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("quotes.id"), nullable=False
    )
    old_status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    new_status: Mapped[str] = mapped_column(String(20), nullable=False)
    changed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    quote: Mapped["Quote"] = relationship("Quote", back_populates="status_history")
    changed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[changed_by])
