"""Test suite for Caregiver API endpoints.

Tests cover:
- PUT /api/caregivers/me - Update caregiver profile
- DELETE /api/caregivers/me - Delete caregiver account
"""

import pytest


class TestUpdateCaregiverProfile:
    """Tests for PUT /api/caregivers/me"""

    def test_update_first_name(self, authenticated_client):
        """Test updating caregiver first name."""
        client, caregiver = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "first_name": "Updated"
        })

        assert response.status_code == 200
        data = response.json()

        assert data["first_name"] == "Updated"
        assert data["last_name"] == caregiver.last_name  # Unchanged
        assert data["email"] == caregiver.email  # Unchanged

    def test_update_last_name(self, authenticated_client):
        """Test updating caregiver last name."""
        client, caregiver = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "last_name": "NewLastName"
        })

        assert response.status_code == 200
        data = response.json()

        assert data["last_name"] == "NewLastName"
        assert data["first_name"] == caregiver.first_name  # Unchanged

    def test_update_email(self, authenticated_client):
        """Test updating caregiver email."""
        client, _ = authenticated_client

        new_email = f"newemail.{pytest.__version__}@example.com"
        response = client.put("/api/caregivers/me", json={
            "email": new_email
        })

        assert response.status_code == 200
        data = response.json()

        assert data["email"] == new_email

    def test_update_password(self, authenticated_client, db_session):
        """Test updating caregiver password."""
        client, caregiver = authenticated_client

        new_password = "NewSecurePass123!"
        response = client.put("/api/caregivers/me", json={
            "password": new_password
        })

        assert response.status_code == 200

        # Verify can login with new password
        response = client.post("/api/auth/login", json={
            "email": caregiver.email,
            "password": new_password
        })

        assert response.status_code == 200

    def test_update_multiple_fields(self, authenticated_client):
        """Test updating multiple fields at once."""
        client, _ = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "first_name": "MultiUpdate",
            "last_name": "Test",
            "email": f"multiupdate.{pytest.__version__}@example.com"
        })

        assert response.status_code == 200
        data = response.json()

        assert data["first_name"] == "MultiUpdate"
        assert data["last_name"] == "Test"
        assert "multiupdate" in data["email"].lower()

    def test_update_with_invalid_email(self, authenticated_client):
        """Test update with invalid email format fails."""
        client, _ = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "email": "not-a-valid-email"
        })

        assert response.status_code in [400, 422]

    def test_update_with_weak_password(self, authenticated_client):
        """Test update with weak password fails."""
        client, _ = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "password": "weak"
        })

        assert response.status_code in [400, 422]

    def test_update_with_empty_first_name(self, authenticated_client):
        """Test update with empty first name fails."""
        client, _ = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "first_name": ""
        })

        assert response.status_code in [400, 422]

    def test_update_with_empty_last_name(self, authenticated_client):
        """Test update with empty last name fails."""
        client, _ = authenticated_client

        response = client.put("/api/caregivers/me", json={
            "last_name": ""
        })

        assert response.status_code in [400, 422]

    def test_update_no_fields(self, authenticated_client):
        """Test update with no fields returns current data."""
        client, caregiver = authenticated_client

        response = client.put("/api/caregivers/me", json={})

        assert response.status_code == 200
        data = response.json()

        # Should return unchanged data
        assert data["first_name"] == caregiver.first_name
        assert data["last_name"] == caregiver.last_name
        assert data["email"] == caregiver.email

    def test_update_without_authentication(self, client):
        """Test update without authentication fails."""
        response = client.put("/api/caregivers/me", json={
            "first_name": "ShouldFail"
        })

        assert response.status_code == 403

    def test_update_with_duplicate_email(
            self, authenticated_client, create_test_caregiver):
        """Test update with email that already exists fails."""
        client, _ = authenticated_client
        other_caregiver, _ = create_test_caregiver()

        response = client.put("/api/caregivers/me", json={
            "email": other_caregiver.email
        })

        assert response.status_code in [400, 409]  # Bad request or conflict


class TestDeleteCaregiverProfile:
    """Tests for DELETE /api/caregivers/me"""

    def test_delete_profile_success(self, authenticated_client, db_session):
        """Test successful profile deletion."""
        client, caregiver = authenticated_client

        response = client.delete("/api/caregivers/me")

        assert response.status_code == 204

        # Verify caregiver is deleted
        from app.models.caregiver import CaregiverModel
        deleted_caregiver = db_session.query(CaregiverModel).filter(
            CaregiverModel._id == caregiver.id
        ).first()

        assert deleted_caregiver is None

    def test_delete_profile_without_auth(self, client):
        """Test delete without authentication fails."""
        response = client.delete("/api/caregivers/me")

        assert response.status_code == 403

    def test_delete_profile_invalid_token(self, client):
        """Test delete with invalid token fails."""
        client.headers.update({"Authorization": "Bearer invalid.token"})

        response = client.delete("/api/caregivers/me")

        assert response.status_code == 401

    def test_delete_profile_cannot_use_after_deletion(
            self, authenticated_client):
        """Test that token is invalid after profile deletion."""
        client, caregiver = authenticated_client

        # Delete profile
        response = client.delete("/api/caregivers/me")
        assert response.status_code == 204

        # Try to use token after deletion
        response = client.get("/api/auth/me")
        assert response.status_code in [401, 404]
