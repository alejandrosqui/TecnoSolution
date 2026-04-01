from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.work_order import WorkOrder
from app.models.device import Device
from app.models.company import Branch
from app.schemas.work_order import WorkOrderPublicOut

router = APIRouter()

STATUS_DISPLAY = {
    "received": "Recibido",
    "queued": "En cola",
    "diagnosing": "En diagnóstico",
    "waiting_customer_approval": "Esperando aprobación",
    "quote_sent": "Presupuesto enviado",
    "approved": "Aprobado",
    "rejected": "Rechazado",
    "waiting_parts": "Esperando repuestos",
    "repairing": "En reparación",
    "repaired": "Reparado",
    "ready_for_pickup": "Listo para retirar",
    "delivered": "Entregado",
    "warranty": "En garantía",
    "cancelled": "Cancelado",
}


@router.get("/order/{order_number}", response_model=WorkOrderPublicOut)
async def get_public_order_status(
    order_number: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkOrder).where(WorkOrder.order_number == order_number)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    device_result = await db.execute(select(Device).where(Device.id == order.device_id))
    device = device_result.scalar_one_or_none()

    branch_result = await db.execute(select(Branch).where(Branch.id == order.branch_id))
    branch = branch_result.scalar_one_or_none()

    return WorkOrderPublicOut(
        order_number=order.order_number,
        status=order.status,
        status_display=STATUS_DISPLAY.get(order.status, order.status),
        received_at=order.received_at,
        estimated_ready_at=order.estimated_ready_at,
        device_brand=device.brand if device else "N/A",
        device_model=device.model if device else "N/A",
        branch_name=branch.name if branch else "N/A",
    )
