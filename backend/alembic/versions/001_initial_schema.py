"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-31 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. plans
    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(50), unique=True, nullable=False),
        sa.Column("price_monthly", sa.Numeric(10, 2), nullable=True),
        sa.Column("price_yearly", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 2. plan_limits
    op.create_table(
        "plan_limits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=False, unique=True),
        sa.Column("max_orders_per_month", sa.Integer, nullable=True),
        sa.Column("max_branches", sa.Integer, nullable=True),
        sa.Column("max_users_per_branch", sa.Integer, nullable=True),
        sa.Column("max_storage_gb", sa.Integer, nullable=True),
        sa.Column("has_stock", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("has_warranties", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("has_advanced_reports", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("has_email_notifications", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("has_public_query", sa.Boolean, nullable=False, server_default=sa.text("true")),
    )

    # 3. companies
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("tax_id", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 4. branches
    op.create_table(
        "branches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 5. subscriptions
    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'active'")),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 6. usage_counters
    op.create_table(
        "usage_counters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True),
        sa.Column("metric", sa.String(50), nullable=False),
        sa.Column("period_year", sa.Integer, nullable=False),
        sa.Column("period_month", sa.Integer, nullable=False),
        sa.Column("count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.UniqueConstraint("company_id", "branch_id", "metric", "period_year", "period_month", name="uq_usage_counters"),
    )

    # 7. users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("is_superadmin", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_users_email", "users", ["email"])

    # 8. user_branch_access
    op.create_table(
        "user_branch_access",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "branch_id", name="uq_user_branch_access"),
    )

    # 9. customers
    op.create_table(
        "customers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=True),
        sa.Column("full_name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_customers_company_id", "customers", ["company_id"])

    # 10. devices
    op.create_table(
        "devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("brand", sa.String(100), nullable=False),
        sa.Column("model", sa.String(200), nullable=False),
        sa.Column("device_type", sa.String(20), nullable=False),
        sa.Column("imei", sa.String(20), nullable=True),
        sa.Column("serial_number", sa.String(100), nullable=True),
        sa.Column("color", sa.String(50), nullable=True),
        sa.Column("storage", sa.String(50), nullable=True),
        sa.Column("condition_on_receipt", sa.Text, nullable=True),
        sa.Column("accessories_received", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_devices_imei", "devices", ["imei"])
    op.create_index("idx_devices_serial_number", "devices", ["serial_number"])

    # 11. products (needed before work_order_items which FK products)
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("sku", sa.String(100), nullable=True, unique=True),
        sa.Column("brand", sa.String(100), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("unit_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("sale_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("stock_quantity", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("min_stock_alert", sa.Numeric(10, 2), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_products_branch_id", "products", ["branch_id"])

    # 12. work_orders
    op.create_table(
        "work_orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_number", sa.String(30), unique=True, nullable=False),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("branches.id"), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("customers.id"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("devices.id"), nullable=False),
        sa.Column("assigned_to", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'received'")),
        sa.Column("priority", sa.String(20), nullable=False, server_default=sa.text("'normal'")),
        sa.Column("problem_description", sa.Text, nullable=False),
        sa.Column("diagnosis_notes", sa.Text, nullable=True),
        sa.Column("resolution_notes", sa.Text, nullable=True),
        sa.Column("estimated_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("final_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("received_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("estimated_ready_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("public_token", sa.String(64), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_work_orders_order_number", "work_orders", ["order_number"])
    op.create_index("idx_work_orders_branch_status", "work_orders", ["branch_id", "status"])
    op.create_index("idx_work_orders_public_token", "work_orders", ["public_token"])

    # 13. work_order_status_history
    op.create_table(
        "work_order_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("old_status", sa.String(50), nullable=True),
        sa.Column("new_status", sa.String(50), nullable=False),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 14. work_order_photos
    op.create_table(
        "work_order_photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("storage_key", sa.Text, nullable=False),
        sa.Column("file_name", sa.String(500), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("photo_type", sa.String(20), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 15. work_order_signatures
    op.create_table(
        "work_order_signatures",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), unique=True, nullable=False),
        sa.Column("storage_key", sa.Text, nullable=False),
        sa.Column("signed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("signer_name", sa.String(200), nullable=True),
    )

    # 16. work_order_items
    op.create_table(
        "work_order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("item_type", sa.String(20), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=True),
    )

    # 17. work_order_notes
    op.create_table(
        "work_order_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("author_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("is_internal", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 18. quotes
    op.create_table(
        "quotes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=False),
        sa.Column("quote_number", sa.String(30), unique=True, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'draft'")),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("tax_rate", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("tax_amount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column("valid_until", sa.Date, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("pdf_storage_key", sa.Text, nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 19. quote_items
    op.create_table(
        "quote_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("quote_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quotes.id"), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("item_type", sa.String(20), nullable=False),
    )

    # 20. quote_status_history
    op.create_table(
        "quote_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("quote_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("quotes.id"), nullable=False),
        sa.Column("old_status", sa.String(20), nullable=True),
        sa.Column("new_status", sa.String(20), nullable=False),
        sa.Column("changed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 21. stock_movements
    op.create_table(
        "stock_movements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=True),
        sa.Column("movement_type", sa.String(50), nullable=False),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False),
        sa.Column("unit_cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("reference", sa.String(200), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 22. warranties
    op.create_table(
        "warranties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), unique=True, nullable=False),
        sa.Column("warranty_months", sa.Integer, nullable=False, server_default=sa.text("3")),
        sa.Column("starts_at", sa.Date, nullable=False),
        sa.Column("expires_at", sa.Date, nullable=False),
        sa.Column("terms", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 23. warranty_claims
    op.create_table(
        "warranty_claims",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("warranty_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("warranties.id"), nullable=False),
        sa.Column("new_work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=True),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 24. storage_objects
    op.create_table(
        "storage_objects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("bucket", sa.String(100), nullable=False),
        sa.Column("storage_key", sa.String(500), unique=True, nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("ref_table", sa.String(100), nullable=True),
        sa.Column("ref_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 25. email_events
    op.create_table(
        "email_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("template_name", sa.String(100), nullable=False),
        sa.Column("template_data", postgresql.JSONB, nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # 26. notification_logs
    op.create_table(
        "notification_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email_event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("email_events.id"), nullable=True),
        sa.Column("channel", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("notification_logs")
    op.drop_table("email_events")
    op.drop_table("storage_objects")
    op.drop_table("warranty_claims")
    op.drop_table("warranties")
    op.drop_table("stock_movements")
    op.drop_table("quote_status_history")
    op.drop_table("quote_items")
    op.drop_table("quotes")
    op.drop_table("work_order_notes")
    op.drop_table("work_order_items")
    op.drop_table("work_order_signatures")
    op.drop_table("work_order_photos")
    op.drop_table("work_order_status_history")
    op.drop_table("work_orders")
    op.drop_table("products")
    op.drop_table("devices")
    op.drop_table("customers")
    op.drop_table("user_branch_access")
    op.drop_index("idx_users_email", table_name="users")
    op.drop_table("users")
    op.drop_table("usage_counters")
    op.drop_table("subscriptions")
    op.drop_table("branches")
    op.drop_table("companies")
    op.drop_table("plan_limits")
    op.drop_table("plans")
