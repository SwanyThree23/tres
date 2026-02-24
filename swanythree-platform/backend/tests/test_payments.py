"""Tests for payment endpoints — verify 90/10 split math."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_calculate_fees(client: AsyncClient, auth_headers):
    response = await client.get("/api/payments/calculate-fees?amount=1000", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    gross = data["gross_amount"]
    platform_fee = data["platform_fee"]
    processor_fee = data["processor_fee"]
    creator_amount = data["creator_amount"]

    assert platform_fee == round(gross * 0.10, 2)
    assert creator_amount == round(gross - platform_fee - processor_fee, 2)


@pytest.mark.asyncio
async def test_tip_requires_auth(client: AsyncClient):
    response = await client.post("/api/payments/tip", json={
        "stream_id": "fake-id",
        "amount": 500,
    })
    assert response.status_code in (401, 403)
