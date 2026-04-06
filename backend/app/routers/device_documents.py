from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.device_document import DeviceDocument
from app.models.company import Branch
from app.core.minio_client import minio_client, public_minio_client
import uuid

router = APIRouter()

BUCKET = "documents"
DOC_TYPES = ["manual", "esquema", "calibracion", "garantia", "otro"]

async def get_company_id(current_user: User, db: AsyncSession) -> uuid.UUID:
    from app.models.user import UserBranchAccess
    result = await db.execute(
        select(Branch.company_id)
        .join(UserBranchAccess, UserBranchAccess.branch_id == Branch.id)
        .where(UserBranchAccess.user_id == current_user.id, UserBranchAccess.is_active == True)
        .limit(1)
    )
    company_id = result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(status_code=403, detail="No company found")
    return company_id

@router.get("/")
async def list_device_documents(
    brand: str,
    model: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_company_id(current_user, db)
    result = await db.execute(
        select(DeviceDocument)
        .where(
            DeviceDocument.company_id == company_id,
            DeviceDocument.brand.ilike(brand),
            DeviceDocument.model.ilike(model),
        )
        .order_by(DeviceDocument.created_at.desc())
    )
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "description": d.description,
            "doc_type": d.doc_type,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "mime_type": d.mime_type,
            "url": f"/storage/{BUCKET}/{d.storage_key}",
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]

@router.post("/")
async def upload_device_document(
    brand: str = Form(...),
    model: str = Form(...),
    name: str = Form(...),
    description: str = Form(None),
    doc_type: str = Form("manual"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = await get_company_id(current_user, db)
    content = await file.read()
    storage_key = f"device-docs/{company_id}/{brand}/{model}/{uuid.uuid4()}-{file.filename}"

    try:
        public_minio_client.put_object(
            BUCKET,
            storage_key,
            data=__import__('io').BytesIO(content),
            length=len(content),
            content_type=file.content_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    doc = DeviceDocument(
        company_id=company_id,
        brand=brand,
        model=model,
        name=name,
        description=description,
        doc_type=doc_type,
        storage_key=storage_key,
        file_name=file.filename,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return {"id": str(doc.id), "url": f"/storage/{BUCKET}/{storage_key}"}

@router.delete("/{doc_id}")
async def delete_device_document(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(DeviceDocument).where(DeviceDocument.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        public_minio_client.remove_object(BUCKET, doc.storage_key)
    except Exception:
        pass
    await db.delete(doc)
    await db.commit()
    return {"ok": True}
