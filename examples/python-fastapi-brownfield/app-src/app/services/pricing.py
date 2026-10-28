"""Pricing rules. Every amount is an integer number of cents."""
from app.models import LineItem, OrderTotal

# Coupon code -> percentage off the subtotal.
COUPONS = {
    "WELCOME10": 10,
    "VIP20": 20,
}


class UnknownCoupon(ValueError):
    pass


def calculate_total(items: list[LineItem], coupon: str | None = None) -> OrderTotal:
    subtotal = sum(item.unit_price_cents * item.quantity for item in items)
    discount = 0
    if coupon is not None:
        if coupon not in COUPONS:
            raise UnknownCoupon(f"unknown coupon: {coupon}")
        discount = subtotal * COUPONS[coupon] // 100
    return OrderTotal(subtotal_cents=subtotal, discount_cents=discount, total_cents=subtotal - discount)
