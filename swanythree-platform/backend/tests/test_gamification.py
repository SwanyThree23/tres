"""Tests for gamification system."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient, auth_headers):
    response = await client.get("/api/gamification/profile", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["profile"]["level"] == 1
    assert data["profile"]["total_xp"] == 0


@pytest.mark.asyncio
async def test_get_leaderboard(client: AsyncClient):
    response = await client.get("/api/gamification/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "leaderboard" in data


@pytest.mark.asyncio
async def test_get_badges(client: AsyncClient):
    response = await client.get("/api/gamification/badges")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
