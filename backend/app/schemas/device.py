from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime


class DeviceCreate(BaseModel):
    customer_id: UUID
    brand: str
    model: str
    device_type: str
    imei: Optional[str] = None
    serial_number: Optional[str] = None
    color: Optional[str] = None
    condition_on_receipt: Optional[str] = None
    accessories_received: Optional[str] = None
    notes: Optional[str] = None


class DeviceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    brand: str
    model: str
    device_type: str
    imei: Optional[str]
    serial_number: Optional[str]
    created_at: datetime
