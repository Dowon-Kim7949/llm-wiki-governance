"""HTTP entry point. Routers are registered here; no business rule lives in this file."""
from fastapi import FastAPI

from app.routers import orders

app = FastAPI(title="order-service")
app.include_router(orders.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
