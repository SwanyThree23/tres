"""Tests for stream endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_stream(client: AsyncClient, auth_headers):
    response = await client.post("/api/streams/", json={
        "title": "Test Stream",
        "description": "Testing",
        "category": "gaming",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["stream"]["title"] == "Test Stream"
    assert "stream_key" in data["stream"]


@pytest.mark.asyncio
async def test_list_streams(client: AsyncClient):
    response = await client.get("/api/streams/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "streams" in data


@pytest.mark.asyncio
async def test_create_stream_unauthorized(client: AsyncClient):
    response = await client.post("/api/streams/", json={"title": "Test"})
    assert response.status_code in (401, 403)
