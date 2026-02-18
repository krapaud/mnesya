"""Test suite for Authentication API endpoints.

Tests cover:
- POST /api/auth/register - Register new caregiver
- POST /api/auth/login - Login with credentials
- GET /api/auth/me - Get current caregiver profile
- POST /api/auth/logout - Logout (invalidate token)
- POST /api/auth/refresh - Refresh access token
"""

import pytest
from datetime import datetime, timedelta


class TestRegisterEndpoint:
    """Tests for POST /api/auth/register"""
    
    def test_register_success(self, client, sample_caregiver_data):
        """Test successful caregiver registration."""
        response = client.post("/api/auth/register", json=sample_caregiver_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "id" in data
        assert data["first_name"] == sample_caregiver_data["first_name"]
        assert data["last_name"] == sample_caregiver_data["last_name"]
        assert data["email"] == sample_caregiver_data["email"]
        assert "password" not in data  # Password should not be returned
        assert "created_at" in data
    
    def test_register_duplicate_email(self, client, create_test_caregiver):
        """Test registration with duplicate email fails."""
        caregiver, _ = create_test_caregiver()
        
        response = client.post("/api/auth/register", json={
            "first_name": "Another",
            "last_name": "Person",
            "email": caregiver.email,  # Duplicate email
            "password": "DifferentPass123!"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format."""
        response = client.post("/api/auth/register", json={
            "first_name": "Test",
            "last_name": "User",
            "email": "not-an-email",
            "password": "ValidPass123!"
        })
        
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password(self, client, sample_caregiver_data):
        """Test registration with weak password fails."""
        weak_passwords = [
            "short",  # Too short
            "nouppercase123!",  # No uppercase
            "NOLOWERCASE123!",  # No lowercase
            "NoNumbers!",  # No digits
            "NoSpecialChar123",  # No special character
        ]
        
        for weak_pass in weak_passwords:
            data = sample_caregiver_data.copy()
            data["password"] = weak_pass
            data["email"] = f"test.{weak_pass}@example.com"  # Unique email
            
            response = client.post("/api/auth/register", json=data)
            assert response.status_code in [400, 422], f"Weak password '{weak_pass}' should be rejected"
    
    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        incomplete_data = [
            {"last_name": "Doe", "email": "test@example.com", "password": "Pass123!"},  # Missing first_name
            {"first_name": "Jane", "email": "test@example.com", "password": "Pass123!"},  # Missing last_name
            {"first_name": "Jane", "last_name": "Doe", "password": "Pass123!"},  # Missing email
            {"first_name": "Jane", "last_name": "Doe", "email": "test@example.com"},  # Missing password
        ]
        
        for data in incomplete_data:
            response = client.post("/api/auth/register", json=data)
            assert response.status_code == 422  # Validation error


class TestLoginEndpoint:
    """Tests for POST /api/auth/login"""
    
    def test_login_success(self, client, create_test_caregiver):
        """Test successful login returns JWT token."""
        caregiver, password = create_test_caregiver()
        
        response = client.post("/api/auth/login", json={
            "email": caregiver.email,
            "password": password
        })
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    
    def test_login_wrong_password(self, client, create_test_caregiver):
        """Test login with wrong password fails."""
        caregiver, _ = create_test_caregiver()
        
        response = client.post("/api/auth/login", json={
            "email": caregiver.email,
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]
    
    def test_login_nonexistent_email(self, client):
        """Test login with non-existent email fails."""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePass123!"
        })
        
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]
    
    def test_login_missing_credentials(self, client):
        """Test login with missing credentials."""
        # Missing password
        response = client.post("/api/auth/login", json={
            "email": "test@example.com"
        })
        assert response.status_code == 422
        
        # Missing email
        response = client.post("/api/auth/login", json={
            "password": "Pass123!"
        })
        assert response.status_code == 422
    
    def test_login_empty_credentials(self, client):
        """Test login with empty credentials."""
        response = client.post("/api/auth/login", json={
            "email": "",
            "password": ""
        })
        assert response.status_code in [401, 422]


class TestGetMeEndpoint:
    """Tests for GET /api/auth/me"""
    
    def test_get_me_success(self, authenticated_client):
        """Test getting current user profile with valid token."""
        client, caregiver = authenticated_client
        
        response = client.get("/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(caregiver.id)
        assert data["first_name"] == caregiver.first_name
        assert data["last_name"] == caregiver.last_name
        assert data["email"] == caregiver.email
        assert "password" not in data
    
    def test_get_me_no_token(self, client):
        """Test getting profile without authentication token fails."""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 403  # Forbidden
    
    def test_get_me_invalid_token(self, client):
        """Test getting profile with invalid token fails."""
        client.headers.update({"Authorization": "Bearer invalid.token.here"})
        
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401


class TestLogoutEndpoint:
    """Tests for POST /api/auth/logout"""
    
    def test_logout_success(self, authenticated_client):
        """Test successful logout."""
        client, _ = authenticated_client
        
        response = client.post("/api/auth/logout")
        
        assert response.status_code == 200
        assert "message" in response.json()
    
    def test_logout_no_token(self, client):
        """Test logout without token."""
        response = client.post("/api/auth/logout")
        
        assert response.status_code == 403


class TestRefreshTokenEndpoint:
    """Tests for POST /api/auth/refresh"""
    
    def test_refresh_token_success(self, authenticated_client):
        """Test refreshing access token."""
        client, _ = authenticated_client
        
        response = client.post("/api/auth/refresh")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_refresh_token_no_auth(self, client):
        """Test refresh without authentication fails."""
        response = client.post("/api/auth/refresh")
        
        assert response.status_code == 403
    
    def test_refresh_token_invalid(self, client):
        """Test refresh with invalid token fails."""
        client.headers.update({"Authorization": "Bearer invalid.token"})
        
        response = client.post("/api/auth/refresh")
        
        assert response.status_code == 401
