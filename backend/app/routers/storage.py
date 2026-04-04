import uuid
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.minio_client import minio_client, public_minio_client
from app.core.config import settings
from app.models.storage import StorageObject
from app.models.user import User
from app.models.company import Branch
from app.models.user import UserBranchAccess
from io import BytesIO

router = APIRouter()

@router.post("/work-orders/{work_order_id}/photos")
async def upload_work_order_photos(
    work_order_id: uuid.UUID,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Máximo 5 fotos por orden")

    # Obtener company_id del usuario
    access_result = await db.execute(
        select(Branch.company_id).join(
            UserBranchAccess, UserBranchAccess.branch_id == Branch.id
        ).where(
            UserBranchAccess.user_id == current_user.id,
            UserBranchAccess.is_active == True,
        ).limit(1)
    )
    company_id = access_result.scalar_one_or_none()
    if not company_id:
        raise HTTPException(status_code=403, detail="Sin acceso")

    uploaded = []
    for file in files:
        content = await file.read()
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        key = f"{company_id}/{work_order_id}/{uuid.uuid4()}.{ext}"

        minio_client.put_object(
            settings.minio_bucket_photos,
            key,
            BytesIO(content),
            length=len(content),
            content_type=file.content_type,
        )

        obj = StorageObject(
            company_id=company_id,
            bucket=settings.minio_bucket_photos,
            storage_key=key,
            original_filename=file.filename,
            mime_type=file.content_type or "image/jpeg",
            file_size=len(content),
            uploaded_by=current_user.id,
            ref_table="work_orders",
            ref_id=work_order_id,
        )
        db.add(obj)
        uploaded.append({"key": key, "filename": file.filename})

    await db.commit()
    return {"uploaded": uploaded, "count": len(uploaded)}


@router.get("/work-orders/{work_order_id}/photos")
async def get_work_order_photos(
    work_order_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StorageObject).where(
            StorageObject.ref_table == "work_orders",
            StorageObject.ref_id == work_order_id,
        )
    )
    photos = result.scalars().all()

    urls = []
    for photo in photos:
        # URL pública directa via proxy nginx /storage/
        url = f"https://tecnosolution.com.ar/storage/{photo.bucket}/{photo.storage_key}"
        urls.append({
            "id": str(photo.id),
            "filename": photo.original_filename,
            "url": url,
        })

    return {"photos": urls}
