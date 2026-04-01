import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import UUIDMixin


class EmailEvent(UUIDMixin, Base):
    __tablename__ = "email_events"

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    template_name: Mapped[str] = mapped_column(String(100), nullable=False)
    template_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    logs: Mapped[List["NotificationLog"]] = relationship(
        "NotificationLog", back_populates="email_event"
    )


class NotificationLog(UUIDMixin, Base):
    __tablename__ = "notification_logs"

    email_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("email_events.id"), nullable=True
    )
    channel: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    email_event: Mapped[Optional["EmailEvent"]] = relationship(
        "EmailEvent", back_populates="logs"
    )
