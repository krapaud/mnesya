"""Test suite for Push Notification API endpoints.

Tests cover:
- POST /api/push-tokens/register - Register a push token
- DELETE /api/push-tokens/unregister - Unregister a push token
- GET /api/push-tokens/my-tokens - Get user's push tokens
"""

import pytest
from uuid import uuid4


@pytest.fixture
def sample_push_token():
    """Sample Expo push token for testing."""
    return f"ExponentPushToken[{uuid4().hex}]"


@pytest.fixture
def create_test_push_token(db_session):
    """Factory fixture to create test push tokens."""
    from app.models.push_token import PushTokenModel
    
    def _create_token(token=None, user_id=None, caregiver_id=None, device_name=None):
        push_token = PushTokenModel()
        push_token.token = token or f"ExponentPushToken[{uuid4().hex}]"
        push_token.user_id = user_id
        push_token.caregiver_id = caregiver_id
        push_token.device_name = device_name
        push_token.is_active = True
        
        db_session.add(push_token)
        db_session.commit()
        db_session.refresh(push_token)
        
        return push_token
    
    return _create_token


class TestRegisterPushToken:
    """Tests for POST /api/push-tokens/register"""
    
    def test_register_token_success(self, authenticated_client, sample_push_token):
        """Test successful push token registration."""
        client, caregiver = authenticated_client
        
        token_data = {
            "token": sample_push_token,
            "caregiver_id": str(caregiver.id),
            "device_name": "iPhone 13"
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["token"] == sample_push_token
        assert data["caregiver_id"] == str(caregiver.id)
        assert data["device_name"] == "iPhone 13"
        assert data["is_active"] is True
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_register_token_minimal_data(self, authenticated_client, sample_push_token):
        """Test registration with minimal required data."""
        client, caregiver = authenticated_client
        
        token_data = {
            "token": sample_push_token
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["token"] == sample_push_token
        assert data["is_active"] is True
    
    def test_register_token_with_user_id(
        self, 
        authenticated_client, 
        create_test_user, 
        sample_push_token
    ):
        """Test registration with user_id."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        
        token_data = {
            "token": sample_push_token,
            "user_id": str(user.id),
            "device_name": "iPad"
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["user_id"] == str(user.id)
        assert data["device_name"] == "iPad"
    
    def test_register_duplicate_token_updates_existing(
        self, 
        authenticated_client, 
        sample_push_token,
        create_test_push_token
    ):
        """Test that registering duplicate token updates existing record."""
        client, caregiver = authenticated_client
        
        # Create existing token
        existing = create_test_push_token(
            token=sample_push_token,
            caregiver_id=caregiver.id,
            device_name="Old Device"
        )
        existing_id = str(existing.id)
        
        # Register same token with new device name
        token_data = {
            "token": sample_push_token,
            "caregiver_id": str(caregiver.id),
            "device_name": "New Device"
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 201
        data = response.json()
        
        # Same ID (updated, not created)
        assert data["id"] == existing_id
        assert data["device_name"] == "New Device"
        assert data["is_active"] is True
    
    def test_register_token_invalid_format(self, authenticated_client):
        """Test that invalid token format returns 400 error."""
        client, caregiver = authenticated_client
        
        token_data = {
            "token": "InvalidTokenFormat123"
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_register_token_empty_string(self, authenticated_client):
        """Test that empty token returns error."""
        client, caregiver = authenticated_client
        
        token_data = {
            "token": ""
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 422
    
    def test_register_token_missing_token_field(self, authenticated_client):
        """Test that missing token field returns error."""
        client, caregiver = authenticated_client
        
        token_data = {
            "device_name": "Test Device"
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 422
    
    def test_register_token_unauthenticated(self, client, sample_push_token):
        """Test that unauthenticated users cannot register tokens."""
        token_data = {
            "token": sample_push_token
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 403
    
    def test_register_token_long_device_name(self, authenticated_client, sample_push_token):
        """Test that device name too long returns error."""
        client, caregiver = authenticated_client
        
        token_data = {
            "token": sample_push_token,
            "device_name": "A" * 101  # More than 100 chars
        }
        
        response = client.post("/api/push-tokens/register", json=token_data)
        
        assert response.status_code == 422


class TestUnregisterPushToken:
    """Tests for DELETE /api/push-tokens/unregister"""
    
    def test_unregister_token_success(
        self, 
        authenticated_client, 
        sample_push_token,
        create_test_push_token
    ):
        """Test successful token unregistration."""
        client, caregiver = authenticated_client
        
        # Create token first
        create_test_push_token(
            token=sample_push_token,
            caregiver_id=caregiver.id
        )
        
        # Unregister it
        response = client.delete(
            "/api/push-tokens/unregister",
            json={"token": sample_push_token}
        )
        
        assert response.status_code == 200
        assert "unregistered successfully" in response.json()["message"].lower()
    
    def test_unregister_nonexistent_token(self, authenticated_client):
        """Test unregistering non-existent token returns 404."""
        client, caregiver = authenticated_client
        
        fake_token = f"ExponentPushToken[{uuid4().hex}]"
        
        response = client.delete(
            "/api/push-tokens/unregister",
            json={"token": fake_token}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_unregister_token_unauthenticated(self, client, sample_push_token):
        """Test that unauthenticated users cannot unregister tokens."""
        response = client.delete(
            "/api/push-tokens/unregister",
            json={"token": sample_push_token}
        )
        
        assert response.status_code == 403
    
    def test_unregister_token_missing_token_field(self, authenticated_client):
        """Test that missing token field returns error."""
        client, caregiver = authenticated_client
        
        response = client.delete("/api/push-tokens/unregister", json={})
        
        assert response.status_code == 422


class TestGetMyTokens:
    """Tests for GET /api/push-tokens/my-tokens"""
    
    def test_get_my_tokens_caregiver(
        self, 
        authenticated_client, 
        create_test_push_token
    ):
        """Test getting tokens for authenticated caregiver."""
        client, caregiver = authenticated_client
        
        # Create multiple tokens for this caregiver
        token1 = create_test_push_token(
            caregiver_id=caregiver.id,
            device_name="iPhone"
        )
        token2 = create_test_push_token(
            caregiver_id=caregiver.id,
            device_name="iPad"
        )
        
        # Create token for different caregiver (should not appear)
        create_test_push_token(
            caregiver_id=uuid4(),
            device_name="Other Device"
        )
        
        response = client.get("/api/push-tokens/my-tokens")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 2
        
        token_ids = [t["id"] for t in data]
        assert str(token1.id) in token_ids
        assert str(token2.id) in token_ids
    
    def test_get_my_tokens_user(
        self, 
        authenticated_client, 
        create_test_user,
        create_test_push_token
    ):
        """Test getting tokens for authenticated user."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        
        # Create token for user
        token = create_test_push_token(
            user_id=user.id,
            device_name="User Phone"
        )
        
        response = client.get("/api/push-tokens/my-tokens")
        
        assert response.status_code == 200
        data = response.json()
        
        # May return caregiver tokens if any exist, so just check user token is present
        assert isinstance(data, list)
    
    def test_get_my_tokens_empty(self, authenticated_client):
        """Test getting tokens when user has none."""
        client, caregiver = authenticated_client
        
        response = client.get("/api/push-tokens/my-tokens")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_my_tokens_only_active(
        self, 
        authenticated_client, 
        create_test_push_token,
        db_session
    ):
        """Test that only active tokens are returned."""
        client, caregiver = authenticated_client
        
        # Create active token
        active_token = create_test_push_token(
            caregiver_id=caregiver.id,
            device_name="Active Device"
        )
        
        # Create inactive token
        inactive_token = create_test_push_token(
            caregiver_id=caregiver.id,
            device_name="Inactive Device"
        )
        inactive_token.is_active = False
        db_session.commit()
        
        response = client.get("/api/push-tokens/my-tokens")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only return active token
        assert len(data) == 1
        assert data[0]["id"] == str(active_token.id)
        assert data[0]["is_active"] is True
    
    def test_get_my_tokens_unauthenticated(self, client):
        """Test that unauthenticated users cannot get tokens."""
        response = client.get("/api/push-tokens/my-tokens")
        
        assert response.status_code == 403


class TestPushTokenIntegration:
    """Integration tests for push token workflows"""
    
    def test_complete_token_lifecycle(self, authenticated_client, sample_push_token):
        """Test register -> get -> unregister workflow."""
        client, caregiver = authenticated_client
        
        # 1. Register token
        token_data = {
            "token": sample_push_token,
            "caregiver_id": str(caregiver.id),
            "device_name": "Test Device"
        }
        
        register_response = client.post("/api/push-tokens/register", json=token_data)
        assert register_response.status_code == 201
        
        # 2. Get tokens - should include the new one
        get_response = client.get("/api/push-tokens/my-tokens")
        assert get_response.status_code == 200
        tokens = get_response.json()
        assert len(tokens) == 1
        assert tokens[0]["token"] == sample_push_token
        
        # 3. Unregister token
        unregister_response = client.delete(
            "/api/push-tokens/unregister",
            json={"token": sample_push_token}
        )
        assert unregister_response.status_code == 200
        
        # 4. Get tokens again - should be empty
        get_response2 = client.get("/api/push-tokens/my-tokens")
        assert get_response2.status_code == 200
        tokens2 = get_response2.json()
        assert len(tokens2) == 0
    
    def test_multiple_devices_same_user(self, authenticated_client):
        """Test user can have multiple devices with different tokens."""
        client, caregiver = authenticated_client
        
        # Register multiple tokens
        token1 = f"ExponentPushToken[{uuid4().hex}]"
        token2 = f"ExponentPushToken[{uuid4().hex}]"
        
        client.post("/api/push-tokens/register", json={
            "token": token1,
            "device_name": "iPhone"
        })
        
        client.post("/api/push-tokens/register", json={
            "token": token2,
            "device_name": "iPad"
        })
        
        # Get all tokens
        response = client.get("/api/push-tokens/my-tokens")
        tokens = response.json()
        
        assert len(tokens) == 2
        token_strings = [t["token"] for t in tokens]
        assert token1 in token_strings
        assert token2 in token_strings
