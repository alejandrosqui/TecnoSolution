from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    app_name: str = "TecnoSolution"
    app_env: str = "development"
    debug: bool = True
    secret_key: str
    allowed_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    database_url: str

    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    jwt_refresh_expire_days: int = 7

    # MinIO
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_photos: str = "work-order-photos"
    minio_bucket_docs: str = "documents"
    minio_secure: bool = False

    # Redis
    redis_url: str = "redis://localhost:6380/0"

    # Resend
    resend_api_key: Optional[str] = None
    from_email: str = "no-reply@tecnosolution.com"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
