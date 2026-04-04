from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime

class WorkOrderCreate(BaseModel):
    customer_id: UUID
    device_id: UUID
    branch_id: UUID
    problem_description: str
    priority: str = "normal"
    estimated_cost: Optional[Decimal] = None
    estimated_hours: Optional[int] = None  # horas estimadas para completar

class WorkOrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_number: str
    status: str
    priority: str
    customer_id: UUID
    device_id: UUID
    branch_id: UUID
    assigned_to: Optional[UUID]
    receptionist_id: Optional[UUID] = None
    problem_description: str
    diagnosis_notes: Optional[str]
    final_cost: Optional[Decimal]
    received_at: datetime
    created_at: datetime
    estimated_ready_at: Optional[datetime] = None
    deadline_at: Optional[datetime] = None
    alert_level: Optional[str] = "green"
    public_token: Optional[str] = None
    # Campos enriquecidos
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    device_brand: Optional[str] = None
    device_model: Optional[str] = None
    device_type: Optional[str] = None

class WorkOrderStatusUpdate(BaseModel):
    status: str
    comment: Optional[str] = None
    estimated_hours: Optional[int] = None  # el técnico puede setear el plazo al cambiar estado

class WorkOrderPublicOut(BaseModel):
    order_number: str
    status: str
    status_display: str
    received_at: datetime
    estimated_ready_at: Optional[datetime]
    device_brand: str
    device_model: str
    branch_name: str
