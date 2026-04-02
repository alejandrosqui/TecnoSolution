# FastAPI application entrypoint
# Registers all routers, middleware, and startup/shutdown events

from fastapi import FastAPI

from app.core.config import settings
from app.routers import auth, companies, users, customers, work_orders, quotes, products, plans, public, devices

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",

)

# Mount routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(work_orders.router, prefix="/api/work-orders", tags=["Work Orders"])
app.include_router(quotes.router, prefix="/api/quotes", tags=["Quotes"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(plans.router, prefix="/api/plans", tags=["Plans"])
app.include_router(devices.router, prefix="/api/devices", tags=["Devices"])
app.include_router(public.router, prefix="/api/public", tags=["Public"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
