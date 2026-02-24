"""Tests for authentication endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "new@swanythree.com",
        "username": "newuser",
        "password": "SecurePass123",
        "display_name": "New User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == "new@swanythree.com"
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    response = await client.post("/api/auth/register", json={
        "email": "test@swanythree.com",
        "username": "different",
        "password": "SecurePass123",
    })
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    response = await client.post("/api/auth/register", json={
        "email": "weak@test.com",
        "username": "weakuser",
        "password": "short",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    response = await client.post("/api/auth/login", json={
        "email": "test@swanythree.com",
        "password": "TestPassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["username"] == "testuser"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient, test_user):
    response = await client.post("/api/auth/login", json={
        "email": "test@swanythree.com",
        "password": "WrongPassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, auth_headers):
    response = await client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["email"] == "test@swanythree.com"


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code in (401, 403)
