import uuid
from typing import List, Optional

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_superadmin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    branch_access: Mapped[List["UserBranchAccess"]] = relationship(
        "UserBranchAccess", back_populates="user"
    )


class UserBranchAccess(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "user_branch_access"
    __table_args__ = (
        UniqueConstraint("user_id", "branch_id", name="uq_user_branch_access"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("branches.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped["User"] = relationship("User", back_populates="branch_access")
    branch: Mapped["Branch"] = relationship("Branch", back_populates="user_access")
