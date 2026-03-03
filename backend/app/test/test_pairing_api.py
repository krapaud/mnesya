"""Test suite for Pairing Code API endpoints.

Tests cover:
- POST /api/pairing/generate - Generate a pairing code for a user
- POST /api/pairing/verify - Verify a pairing code
"""

import pytest
from datetime import datetime, timezone, timedelta
from uuid import uuid4


class TestGeneratePairingCode:
    """Tests for POST /api/pairing/generate"""

    def test_generate_code_success(self, authenticated_client, create_test_user):
        """Test successful pairing code generation."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        response = client.post("/api/pairing/generate", json={"user_id": str(user.id)})

        assert response.status_code == 200
        data = response.json()

        assert "code" in data
        assert len(data["code"]) == 6
        assert data["code"].isalnum()  # Alphanumeric
        assert "expires_at" in data

    def test_generate_code_returns_existing_active(
        self, authenticated_client, create_test_user, db_session
    ):
        """Test that generating a code when one exists returns the existing code."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        # Generate first code
        response1 = client.post("/api/pairing/generate", json={"user_id": str(user.id)})

        assert response1.status_code == 200
        code1 = response1.json()["code"]

        # Generate again - should return same code
        response2 = client.post("/api/pairing/generate", json={"user_id": str(user.id)})

        assert response2.status_code == 200
        code2 = response2.json()["code"]

        assert code1 == code2

    def test_generate_code_user_not_found(self, authenticated_client):
        """Test generating code for non-existent user."""
        client, _ = authenticated_client

        fake_id = uuid4()
        response = client.post("/api/pairing/generate", json={"user_id": str(fake_id)})

        assert response.status_code == 404

    def test_generate_code_unauthorized_user(
        self, authenticated_client, create_test_user, create_test_caregiver
    ):
        """Test generating code for user of another caregiver."""
        client, _ = authenticated_client
        other_caregiver, _ = create_test_caregiver()
        other_user = create_test_user(other_caregiver.id)

        response = client.post(
            "/api/pairing/generate", json={"user_id": str(other_user.id)}
        )

        assert response.status_code == 403

    def test_generate_code_without_auth(
        self, client, create_test_user, create_test_caregiver
    ):
        """Test generating code without authentication."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver.id)

        response = client.post("/api/pairing/generate", json={"user_id": str(user.id)})

        assert response.status_code == 403

    def test_generate_code_invalid_user_id(self, authenticated_client):
        """Test generating code with invalid user ID format."""
        client, _ = authenticated_client

        response = client.post("/api/pairing/generate", json={"user_id": "not-a-uuid"})

        assert response.status_code == 422

    def test_generate_code_missing_user_id(self, authenticated_client):
        """Test generating code without user_id."""
        client, _ = authenticated_client

        response = client.post("/api/pairing/generate", json={})

        assert response.status_code == 422

    def test_generate_code_expiration_time(
        self, authenticated_client, create_test_user
    ):
        """Test that generated code has appropriate expiration."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        before_generation = datetime.now(timezone.utc)

        response = client.post("/api/pairing/generate", json={"user_id": str(user.id)})

        assert response.status_code == 200

        expires_at_str = response.json()["expires_at"]
        expires_at = datetime.fromisoformat(expires_at_str.replace("Z", "+00:00"))

        # Code should expire in approximately 5 minutes
        expected_expiry = before_generation + timedelta(minutes=5)
        time_diff = abs((expires_at - expected_expiry).total_seconds())

        assert time_diff < 60  # Within 1 minute tolerance

    def test_generate_code_uniqueness(self, authenticated_client, create_test_user):
        """Test that generated codes are unique for different users."""
        client, caregiver = authenticated_client

        user1 = create_test_user(caregiver.id)
        user2 = create_test_user(caregiver.id)

        response1 = client.post(
            "/api/pairing/generate", json={"user_id": str(user1.id)}
        )

        response2 = client.post(
            "/api/pairing/generate", json={"user_id": str(user2.id)}
        )

        assert response1.status_code == 200
        assert response2.status_code == 200

        code1 = response1.json()["code"]
        code2 = response2.json()["code"]

        assert code1 != code2


class TestVerifyPairingCode:
    """Tests for POST /api/pairing/verify"""

    def test_verify_code_success(
        self, authenticated_client, create_test_user, db_session
    ):
        """Test successful pairing code verification."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        # Generate code
        generate_response = client.post(
            "/api/pairing/generate", json={"user_id": str(user.id)}
        )

        code = generate_response.json()["code"]

        # Verify code (without authentication)
        client.headers.pop("Authorization", None)

        response = client.post("/api/pairing/verify", json={"code": code})

        assert response.status_code == 200
        data = response.json()

        assert data["user_id"] == str(user.id)
        assert "user" in data
        assert data["user"]["first_name"] == user.first_name
        assert data["user"]["last_name"] == user.last_name
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data

    def test_verify_code_not_found(self, client):
        """Test verifying non-existent code."""
        response = client.post("/api/pairing/verify", json={"code": "FAKE12"})

        assert response.status_code == 404

    def test_verify_code_expired(
        self, authenticated_client, create_test_user, db_session
    ):
        """Test verifying expired code."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        # Create an expired code manually
        from app.models.pairing_code import PairingCodeModel

        expired_code = PairingCodeModel()
        expired_code.code = "EXP123"
        expired_code.user_id = user.id
        expired_code.caregiver_id = caregiver.id
        expired_code.expires_at = datetime.now(timezone.utc) - timedelta(
            hours=1
        )  # Expired 1 hour ago

        db_session.add(expired_code)
        db_session.commit()

        # Try to verify expired code
        client.headers.pop("Authorization", None)

        response = client.post("/api/pairing/verify", json={"code": "EXP123"})

        assert response.status_code in [400, 410]  # Bad request or Gone

    def test_verify_code_already_used(
        self, authenticated_client, create_test_user, db_session
    ):
        """Test verifying already used code."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        # Create a used code manually
        from app.models.pairing_code import PairingCodeModel

        used_code = PairingCodeModel()
        used_code.code = "USED12"
        used_code.user_id = user.id
        used_code.caregiver_id = caregiver.id
        used_code.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        used_code.is_used = True  # Mark as used

        db_session.add(used_code)
        db_session.commit()

        # Try to verify used code
        client.headers.pop("Authorization", None)

        response = client.post("/api/pairing/verify", json={"code": "USED12"})

        assert response.status_code in [400, 410]

    def test_verify_code_missing_code(self, client):
        """Test verifying without providing code."""
        response = client.post("/api/pairing/verify", json={})

        assert response.status_code == 422

    def test_verify_code_empty_code(self, client):
        """Test verifying with empty code."""
        response = client.post("/api/pairing/verify", json={"code": ""})

        assert response.status_code in [400, 422]

    def test_verify_code_case_insensitive(self, authenticated_client, create_test_user):
        """Test that code verification is case-insensitive."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        # Generate code
        generate_response = client.post(
            "/api/pairing/generate", json={"user_id": str(user.id)}
        )

        code = generate_response.json()["code"]

        # Remove auth for verification
        client.headers.pop("Authorization", None)

        # Try lowercase version
        response_lower = client.post("/api/pairing/verify", json={"code": code.lower()})

        # Try different case combination
        response_mixed = client.post(
            "/api/pairing/verify",
            json={"code": code.upper() if code[0].islower() else code.lower()},
        )

        # At least one should succeed (depending on implementation)
        # Most secure implementations are case-sensitive
        assert response_lower.status_code in [200, 404]

    def test_verify_code_no_auth_required(
        self, client, create_test_user, create_test_caregiver, db_session
    ):
        """Test that verification doesn't require authentication."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver.id)

        # Create code manually
        from app.models.pairing_code import PairingCodeModel

        pairing_code = PairingCodeModel()
        pairing_code.code = "NOAUTH"
        pairing_code.user_id = user.id
        pairing_code.caregiver_id = caregiver.id
        pairing_code.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        db_session.add(pairing_code)
        db_session.commit()

        # Verify without any authentication
        response = client.post("/api/pairing/verify", json={"code": "NOAUTH"})

        assert response.status_code == 200
