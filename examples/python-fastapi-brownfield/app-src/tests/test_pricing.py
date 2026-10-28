import pytest

from app.models import LineItem
from app.services.pricing import UnknownCoupon, calculate_total


def items():
    return [LineItem(sku="A", unit_price_cents=1500, quantity=2), LineItem(sku="B", unit_price_cents=1000, quantity=1)]


def test_total_without_coupon():
    assert calculate_total(items()).total_cents == 4000


def test_welcome10_takes_ten_percent():
    total = calculate_total(items(), "WELCOME10")
    assert (total.discount_cents, total.total_cents) == (400, 3600)


def test_unknown_coupon_is_refused():
    with pytest.raises(UnknownCoupon):
        calculate_total(items(), "NOPE")
