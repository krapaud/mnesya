"""Test suite for User/Profile API endpoints.

Tests cover:
- POST /api/users - Create a new user profile
- GET /api/users - Get all user profiles for caregiver
- GET /api/users/{profile_id} - Get specific user profile
- PUT /api/users/{profile_id} - Update user profile
- DELETE /api/users/{profile_id} - Delete user profile
"""

import pytest
from datetime import date


class TestCreateUserProfile:
    """Tests for POST /api/users"""

    def test_create_profile_success(
            self, authenticated_client, sample_user_data):
        """Test successful user profile creation."""
        client, caregiver = authenticated_client

        response = client.post("/api/users", json=sample_user_data)

        assert response.status_code == 200
        data = response.json()

        assert "user" in data
        assert "pairing_code" in data

        user = data["user"]
        assert "id" in user
        assert user["first_name"] == sample_user_data["first_name"]
        assert user["last_name"] == sample_user_data["last_name"]
        assert user["birthday"] == sample_user_data["birthday"]

        # Check pairing code
        pairing = data["pairing_code"]
        assert "code" in pairing
        assert len(pairing["code"]) == 6
        assert "expires_at" in pairing

    def test_create_profile_missing_first_name(self, authenticated_client):
        """Test profile creation without first name fails."""
        client, _ = authenticated_client

        response = client.post("/api/users", json={
            "last_name": "Smith",
            "birthday": "1950-05-15"
        })

        assert response.status_code == 422

    def test_create_profile_missing_last_name(self, authenticated_client):
        """Test profile creation without last name fails."""
        client, _ = authenticated_client

        response = client.post("/api/users", json={
            "first_name": "John",
            "birthday": "1950-05-15"
        })

        assert response.status_code == 422

    def test_create_profile_missing_birthday(self, authenticated_client):
        """Test profile creation without birthday fails."""
        client, _ = authenticated_client

        response = client.post("/api/users", json={
            "first_name": "John",
            "last_name": "Smith"
        })

        assert response.status_code == 422

    def test_create_profile_invalid_birthday(self, authenticated_client):
        """Test profile creation with invalid birthday format."""
        client, _ = authenticated_client

        response = client.post("/api/users", json={
            "first_name": "John",
            "last_name": "Smith",
            "birthday": "not-a-date"
        })

        assert response.status_code == 422

    def test_create_profile_future_birthday(self, authenticated_client):
        """Test profile creation with future birthday fails."""
        client, _ = authenticated_client

        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=365)).isoformat()

        response = client.post("/api/users", json={
            "first_name": "John",
            "last_name": "Smith",
            "birthday": future_date
        })

        assert response.status_code in [400, 422]

    def test_create_profile_without_auth(self, client, sample_user_data):
        """Test profile creation without authentication fails."""
        response = client.post("/api/users", json=sample_user_data)

        assert response.status_code == 403

    def test_create_multiple_profiles(self, authenticated_client):
        """Test creating multiple profiles for same caregiver."""
        client, caregiver = authenticated_client

        profiles_data = [
            {"first_name": "User1", "last_name": "Test", "birthday": "1950-01-01"},
            {"first_name": "User2", "last_name": "Test", "birthday": "1960-02-02"},
            {"first_name": "User3", "last_name": "Test", "birthday": "1970-03-03"},
        ]

        created_ids = []
        for profile_data in profiles_data:
            response = client.post("/api/users", json=profile_data)
            assert response.status_code == 200
            created_ids.append(response.json()["user"]["id"])

        # Verify all unique
        assert len(set(created_ids)) == len(created_ids)


class TestGetAllUserProfiles:
    """Tests for GET /api/users"""

    def test_get_all_profiles_empty(self, authenticated_client):
        """Test getting profiles when none exist."""
        client, _ = authenticated_client

        response = client.get("/api/users")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_all_profiles_with_users(
            self, authenticated_client, create_test_user):
        """Test getting all profiles for caregiver."""
        client, caregiver = authenticated_client

        # Create test users
        user1 = create_test_user(caregiver.id)
        user2 = create_test_user(caregiver.id)
        user3 = create_test_user(caregiver.id)

        response = client.get("/api/users")

        assert response.status_code == 200
        data = response.json()

        assert len(data) == 3
        user_ids = [u["id"] for u in data]
        assert str(user1.id) in user_ids
        assert str(user2.id) in user_ids
        assert str(user3.id) in user_ids

    def test_get_all_profiles_only_own(
            self, authenticated_client, create_test_user, create_test_caregiver):
        """Test that caregiver only sees their own users."""
        client, caregiver = authenticated_client
        other_caregiver, _ = create_test_caregiver()

        # Create users for authenticated caregiver
        my_user = create_test_user(caregiver.id)

        # Create users for other caregiver
        other_user = create_test_user(other_caregiver.id)

        response = client.get("/api/users")

        assert response.status_code == 200
        data = response.json()

        user_ids = [u["id"] for u in data]
        assert str(my_user.id) in user_ids
        assert str(other_user.id) not in user_ids

    def test_get_all_profiles_without_auth(self, client):
        """Test getting profiles without authentication fails."""
        response = client.get("/api/users")

        assert response.status_code == 403


class TestGetSpecificUserProfile:
    """Tests for GET /api/users/{profile_id}"""

    def test_get_profile_success(self, authenticated_client, create_test_user):
        """Test getting specific user profile."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        response = client.get(f"/api/users/{user.id}")

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == str(user.id)
        assert data["first_name"] == user.first_name
        assert data["last_name"] == user.last_name

    def test_get_profile_not_found(self, authenticated_client):
        """Test getting non-existent profile."""
        client, _ = authenticated_client

        from uuid import uuid4
        fake_id = uuid4()

        response = client.get(f"/api/users/{fake_id}")

        assert response.status_code == 404

    def test_get_profile_unauthorized(
            self, authenticated_client, create_test_user, create_test_caregiver):
        """Test getting profile that belongs to another caregiver."""
        client, _ = authenticated_client
        other_caregiver, _ = create_test_caregiver()

        # Create user for other caregiver
        other_user = create_test_user(other_caregiver.id)

        response = client.get(f"/api/users/{other_user.id}")

        assert response.status_code in [403, 404]

    def test_get_profile_invalid_id(self, authenticated_client):
        """Test getting profile with invalid UUID."""
        client, _ = authenticated_client

        response = client.get("/api/users/not-a-uuid")

        assert response.status_code == 422

    def test_get_profile_without_auth(
            self, client, create_test_user, create_test_caregiver):
        """Test getting profile without authentication."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver.id)

        response = client.get(f"/api/users/{user.id}")

        assert response.status_code == 403


class TestUpdateUserProfile:
    """Tests for PUT /api/users/{profile_id}"""

    def test_update_first_name(self, authenticated_client, create_test_user):
        """Test updating user first name."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        response = client.put(f"/api/users/{user.id}", json={
            "first_name": "UpdatedName"
        })

        assert response.status_code == 200
        data = response.json()

        assert data["first_name"] == "UpdatedName"
        assert data["last_name"] == user.last_name  # Unchanged

    def test_update_last_name(self, authenticated_client, create_test_user):
        """Test updating user last name."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        response = client.put(f"/api/users/{user.id}", json={
            "last_name": "NewLastName"
        })

        assert response.status_code == 200
        assert response.json()["last_name"] == "NewLastName"

    def test_update_birthday(self, authenticated_client, create_test_user):
        """Test updating user birthday."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        new_birthday = "1955-12-25"
        response = client.put(f"/api/users/{user.id}", json={
            "birthday": new_birthday
        })

        assert response.status_code == 200
        assert response.json()["birthday"] == new_birthday

    def test_update_multiple_fields(
            self, authenticated_client, create_test_user):
        """Test updating multiple fields."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)

        response = client.put(f"/api/users/{user.id}", json={
            "first_name": "MultiUpdate",
            "last_name": "TestUser",
            "birthday": "1960-06-15"
        })

        assert response.status_code == 200
        data = response.json()

        assert data["first_name"] == "MultiUpdate"
        assert data["last_name"] == "TestUser"
        assert data["birthday"] == "1960-06-15"

    def test_update_not_found(self, authenticated_client):
        """Test updating non-existent profile."""
        client, _ = authenticated_client

        from uuid import uuid4
        fake_id = uuid4()

        response = client.put(f"/api/users/{fake_id}", json={
            "first_name": "ShouldFail"
        })

        assert response.status_code == 404

    def test_update_unauthorized(
            self, authenticated_client, create_test_user, create_test_caregiver):
        """Test updating profile of another caregiver."""
        client, _ = authenticated_client
        other_caregiver, _ = create_test_caregiver()
        other_user = create_test_user(other_caregiver.id)

        response = client.put(f"/api/users/{other_user.id}", json={
            "first_name": "ShouldFail"
        })

        assert response.status_code in [403, 404]

    def test_update_without_auth(
            self, client, create_test_user, create_test_caregiver):
        """Test updating without authentication."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver.id)

        response = client.put(f"/api/users/{user.id}", json={
            "first_name": "ShouldFail"
        })

        assert response.status_code == 403


class TestDeleteUserProfile:
    """Tests for DELETE /api/users/{profile_id}"""

    def test_delete_profile_success(
            self, authenticated_client, create_test_user, db_session):
        """Test successful profile deletion."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)
        user_id = user.id

        response = client.delete(f"/api/users/{user_id}")

        assert response.status_code == 204

        # Verify user is deleted
        from app.models.user import UserModel
        deleted_user = db_session.query(UserModel).filter(
            UserModel._id == user_id
        ).first()

        assert deleted_user is None

    def test_delete_profile_not_found(self, authenticated_client):
        """Test deleting non-existent profile."""
        client, _ = authenticated_client

        from uuid import uuid4
        fake_id = uuid4()

        response = client.delete(f"/api/users/{fake_id}")

        assert response.status_code == 404

    def test_delete_profile_unauthorized(
            self, authenticated_client, create_test_user, create_test_caregiver):
        """Test deleting profile of another caregiver."""
        client, _ = authenticated_client
        other_caregiver, _ = create_test_caregiver()
        other_user = create_test_user(other_caregiver.id)

        response = client.delete(f"/api/users/{other_user.id}")

        assert response.status_code in [403, 404]

    def test_delete_profile_without_auth(
            self, client, create_test_user, create_test_caregiver):
        """Test deleting without authentication."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver.id)

        response = client.delete(f"/api/users/{user.id}")

        assert response.status_code == 403

    def test_delete_profile_cascades(
            self, authenticated_client, create_test_user, db_session):
        """Test that deleting profile also deletes related data."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver.id)
        user_id = user.id

        # Create a pairing code for the user
        from app.models.pairing_code import PairingCodeModel
        from datetime import datetime, timezone, timedelta

        pairing_code = PairingCodeModel()
        pairing_code.code = "TEST12"
        pairing_code.user_id = user_id
        pairing_code.caregiver_id = caregiver.id
        pairing_code.expires_at = datetime.now(
            timezone.utc) + timedelta(hours=24)

        db_session.add(pairing_code)
        db_session.commit()

        # Delete the user
        response = client.delete(f"/api/users/{user_id}")
        assert response.status_code == 204

        # Verify pairing codes are also deleted
        remaining_codes = db_session.query(PairingCodeModel).filter(
            PairingCodeModel._user_id == user_id
        ).all()

        assert len(remaining_codes) == 0
