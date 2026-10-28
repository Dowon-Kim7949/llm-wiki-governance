"""Request and response shapes shared by the routers and the pricing service."""
from pydantic import BaseModel, Field


class LineItem(BaseModel):
    sku: str
    unit_price_cents: int = Field(ge=0)
    quantity: int = Field(ge=1)


class OrderRequest(BaseModel):
    items: list[LineItem]
    coupon: str | None = None


class OrderTotal(BaseModel):
    subtotal_cents: int
    discount_cents: int
    total_cents: int
