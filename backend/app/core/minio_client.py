from minio import Minio
from app.core.config import settings

minio_client = Minio(
    settings.minio_endpoint,
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=settings.minio_secure,
)

public_minio_client = Minio(
    "tecnosolution.com.ar",
    access_key=settings.minio_access_key,
    secret_key=settings.minio_secret_key,
    secure=True,
)

def ensure_buckets():
    for bucket in [settings.minio_bucket_photos, settings.minio_bucket_docs]:
        if not minio_client.bucket_exists(bucket):
            minio_client.make_bucket(bucket)
