"""Order endpoints. Thin: validation is pydantic's, pricing is app.services.pricing."""
from fastapi import APIRouter, HTTPException

from app.models import OrderRequest, OrderTotal
from app.services.pricing import UnknownCoupon, calculate_total

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/quote", response_model=OrderTotal)
def quote_order(request: OrderRequest) -> OrderTotal:
    try:
        return calculate_total(request.items, request.coupon)
    except UnknownCoupon as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
