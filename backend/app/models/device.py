import uuid
from typing import List, Optional

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Device(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "devices"
    __table_args__ = (
        Index("idx_devices_imei", "imei"),
        Index("idx_devices_serial_number", "serial_number"),
    )

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False
    )
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    device_type: Mapped[str] = mapped_column(String(20), nullable=False)
    imei: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    storage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    condition_on_receipt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    accessories_received: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="devices")
    work_orders: Mapped[List["WorkOrder"]] = relationship("WorkOrder", back_populates="device")
