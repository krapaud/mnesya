"""Test suite for Reminder Status API endpoints.

Tests cover:
- GET /api/reminder-status/{reminder_id}/current - Get current status of a reminder
- GET /api/reminder-status/{reminder_id}/history - Get status history of a reminder
- PUT /api/reminder-status/{reminder_id} - Update reminder status
- GET /api/reminder-status/valid-statuses - Get list of valid status values
"""

import pytest
from datetime import datetime, timedelta, timezone
from uuid import uuid4
from app.models.reminder_status import ReminderStatusModel
from app.models.reminder_status_enum import ReminderStatusEnum


@pytest.fixture
def create_test_reminder_status(db_session):
    """Factory fixture to create test reminder statuses."""
    def _create_status(reminder_id, status=ReminderStatusEnum.PENDING.value):
        reminder_status = ReminderStatusModel()
        reminder_status.status = status
        reminder_status.reminder_id = reminder_id
        
        db_session.add(reminder_status)
        db_session.commit()
        db_session.refresh(reminder_status)
        
        return reminder_status
    
    return _create_status


class TestGetCurrentStatus:
    """Tests for GET /api/reminder-status/{reminder_id}/current"""
    
    def test_get_current_status_success(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test successfully retrieving the current status of a reminder."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        # Create initial status
        status = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(status.id)
        assert data["status"] == ReminderStatusEnum.PENDING.value
        assert data["reminder_id"] == str(reminder.id)
        assert "created_at" in data
        assert "updated_at" in data
    
    def test_get_current_status_latest(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test that current status returns the most recent entry."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        # Create multiple statuses
        create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.POSTPONED.value
        )
        latest_status = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.DONE.value
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == str(latest_status.id)
        assert data["status"] == ReminderStatusEnum.DONE.value
    
    def test_get_current_status_not_found(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder
    ):
        """Test retrieving status for reminder with no status entries."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        
        assert response.status_code == 404
        assert "no status found" in response.json()["detail"].lower()
    
    def test_get_current_status_nonexistent_reminder(self, authenticated_client):
        """Test retrieving status for non-existent reminder."""
        client, caregiver = authenticated_client
        fake_reminder_id = uuid4()
        
        response = client.get(f"/api/reminder-status/{fake_reminder_id}/current")
        
        assert response.status_code == 404
    
    def test_get_current_status_unauthenticated(
        self, 
        client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status,
        create_test_caregiver
    ):
        """Test that unauthenticated users cannot access status."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        create_test_reminder_status(reminder_id=reminder.id)
        
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        
        assert response.status_code == 403
    
    def test_get_current_status_invalid_uuid(self, authenticated_client):
        """Test retrieving status with invalid reminder ID format."""
        client, caregiver = authenticated_client
        
        response = client.get("/api/reminder-status/invalid-uuid/current")
        
        assert response.status_code == 422


class TestGetStatusHistory:
    """Tests for GET /api/reminder-status/{reminder_id}/history"""
    
    def test_get_status_history_success(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test successfully retrieving status history."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        # Create multiple statuses
        status1 = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        status2 = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.POSTPONED.value
        )
        status3 = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.DONE.value
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/history")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 3
        
        # Verify statuses are ordered from newest to oldest
        assert data[0]["id"] == str(status3.id)
        assert data[0]["status"] == ReminderStatusEnum.DONE.value
        assert data[1]["id"] == str(status2.id)
        assert data[1]["status"] == ReminderStatusEnum.POSTPONED.value
        assert data[2]["id"] == str(status1.id)
        assert data[2]["status"] == ReminderStatusEnum.PENDING.value
    
    def test_get_status_history_empty(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder
    ):
        """Test retrieving history for reminder with no status entries."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/history")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 0
    
    def test_get_status_history_single_status(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test retrieving history with only one status entry."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        status = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/history")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) == 1
        assert data[0]["id"] == str(status.id)
    
    def test_get_status_history_unauthenticated(
        self, 
        client, 
        create_test_user, 
        create_test_reminder,
        create_test_caregiver
    ):
        """Test that unauthenticated users cannot access history."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        response = client.get(f"/api/reminder-status/{reminder.id}/history")
        
        assert response.status_code == 403
    
    def test_get_status_history_invalid_uuid(self, authenticated_client):
        """Test retrieving history with invalid reminder ID format."""
        client, caregiver = authenticated_client
        
        response = client.get("/api/reminder-status/invalid-uuid/history")
        
        assert response.status_code == 422


class TestUpdateReminderStatus:
    """Tests for PUT /api/reminder-status/{reminder_id}"""
    
    def test_update_status_to_done(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test updating reminder status to DONE."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        # Create initial PENDING status
        create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        
        update_data = {"status": "DONE"}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == ReminderStatusEnum.DONE.value
        assert data["reminder_id"] == str(reminder.id)
        assert "id" in data
        assert "created_at" in data
    
    def test_update_status_to_postponed(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test updating reminder status to POSTPONED."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        create_test_reminder_status(reminder_id=reminder.id)
        
        update_data = {"status": "POSTPONED"}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == ReminderStatusEnum.POSTPONED.value
    
    def test_update_status_to_unable(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test updating reminder status to UNABLE."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        create_test_reminder_status(reminder_id=reminder.id)
        
        update_data = {"status": "UNABLE"}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == ReminderStatusEnum.UNABLE.value
    
    def test_update_status_creates_new_entry(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test that updating status creates a new entry (preserves history)."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        initial_status = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        
        update_data = {"status": "DONE"}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        new_status_id = response.json()["id"]
        
        # Verify new entry was created, not updated
        assert new_status_id != str(initial_status.id)
        
        # Verify history now has 2 entries
        history_response = client.get(f"/api/reminder-status/{reminder.id}/history")
        assert len(history_response.json()) == 2
    
    def test_update_status_lowercase_converted(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test that lowercase status values are converted to uppercase."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        create_test_reminder_status(reminder_id=reminder.id)
        
        update_data = {"status": "done"}  # lowercase
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "DONE"  # uppercase
    
    def test_update_status_invalid_value(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test that invalid status value returns 422 error."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        create_test_reminder_status(reminder_id=reminder.id)
        
        update_data = {"status": "INVALID_STATUS"}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 422
    
    def test_update_status_empty_value(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test that empty status value returns 422 error."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        create_test_reminder_status(reminder_id=reminder.id)
        
        update_data = {"status": ""}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 422
    
    def test_update_status_missing_field(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder
    ):
        """Test that missing status field returns 422 error."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json={}
        )
        
        assert response.status_code == 422
    
    def test_update_status_nonexistent_reminder(self, authenticated_client):
        """Test updating status for non-existent reminder fails with foreign key error."""
        client, caregiver = authenticated_client
        fake_reminder_id = uuid4()
        
        update_data = {"status": "DONE"}
        response = client.put(
            f"/api/reminder-status/{fake_reminder_id}",
            json=update_data
        )
        
        # Should fail with 500 due to foreign key constraint
        assert response.status_code == 500
        assert "failed" in response.json()["detail"].lower()
    
    def test_update_status_unauthenticated(
        self, 
        client, 
        create_test_user, 
        create_test_reminder,
        create_test_caregiver
    ):
        """Test that unauthenticated users cannot update status."""
        caregiver, _ = create_test_caregiver()
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        update_data = {"status": "DONE"}
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json=update_data
        )
        
        assert response.status_code == 403
    
    def test_update_status_invalid_uuid(self, authenticated_client):
        """Test updating status with invalid reminder ID format."""
        client, caregiver = authenticated_client
        
        update_data = {"status": "DONE"}
        response = client.put(
            "/api/reminder-status/invalid-uuid",
            json=update_data
        )
        
        assert response.status_code == 422


class TestGetValidStatuses:
    """Tests for GET /api/reminder-status/valid-statuses"""
    
    def test_get_valid_statuses_success(self, client):
        """Test successfully retrieving list of valid statuses."""
        response = client.get("/api/reminder-status/valid-statuses")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) == 4
        assert ReminderStatusEnum.PENDING.value in data
        assert ReminderStatusEnum.DONE.value in data
        assert ReminderStatusEnum.POSTPONED.value in data
        assert ReminderStatusEnum.UNABLE.value in data
    
    def test_get_valid_statuses_no_auth_required(self, client):
        """Test that endpoint doesn't require authentication."""
        # Make request without authentication
        response = client.get("/api/reminder-status/valid-statuses")
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_get_valid_statuses_returns_uppercase(self, client):
        """Test that all returned statuses are uppercase."""
        response = client.get("/api/reminder-status/valid-statuses")
        
        assert response.status_code == 200
        data = response.json()
        
        for status in data:
            assert status == status.upper()
    
    def test_get_valid_statuses_order(self, client):
        """Test that valid statuses are returned in expected order."""
        response = client.get("/api/reminder-status/valid-statuses")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify the expected statuses are present
        expected_statuses = [
            ReminderStatusEnum.PENDING.value,
            ReminderStatusEnum.DONE.value,
            ReminderStatusEnum.POSTPONED.value,
            ReminderStatusEnum.UNABLE.value
        ]
        
        assert set(data) == set(expected_statuses)


class TestReminderStatusIntegration:
    """Integration tests for complete status workflows"""
    
    def test_complete_status_lifecycle(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test complete lifecycle: create, update multiple times, view history."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        reminder = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        # 1. Create initial PENDING status
        initial_status = create_test_reminder_status(
            reminder_id=reminder.id,
            status=ReminderStatusEnum.PENDING.value
        )
        
        # 2. Get current status - should be PENDING
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        assert response.status_code == 200
        assert response.json()["status"] == ReminderStatusEnum.PENDING.value
        
        # 3. Update to POSTPONED
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json={"status": "POSTPONED"}
        )
        assert response.status_code == 200
        
        # 4. Get current status - should be POSTPONED
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        assert response.json()["status"] == ReminderStatusEnum.POSTPONED.value
        
        # 5. Update to DONE
        response = client.put(
            f"/api/reminder-status/{reminder.id}",
            json={"status": "DONE"}
        )
        assert response.status_code == 200
        
        # 6. Get current status - should be DONE
        response = client.get(f"/api/reminder-status/{reminder.id}/current")
        assert response.json()["status"] == ReminderStatusEnum.DONE.value
        
        # 7. Get history - should have 3 entries
        response = client.get(f"/api/reminder-status/{reminder.id}/history")
        history = response.json()
        
        assert len(history) == 3
        assert history[0]["status"] == ReminderStatusEnum.DONE.value
        assert history[1]["status"] == ReminderStatusEnum.POSTPONED.value
        assert history[2]["status"] == ReminderStatusEnum.PENDING.value
    
    def test_multiple_reminders_different_statuses(
        self, 
        authenticated_client, 
        create_test_user, 
        create_test_reminder,
        create_test_reminder_status
    ):
        """Test that different reminders can have different statuses independently."""
        client, caregiver = authenticated_client
        user = create_test_user(caregiver_id=caregiver.id)
        
        # Create two reminders
        reminder1 = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        reminder2 = create_test_reminder(
            caregiver_id=caregiver.id,
            user_id=user.id
        )
        
        # Set different statuses
        create_test_reminder_status(
            reminder_id=reminder1.id,
            status=ReminderStatusEnum.DONE.value
        )
        create_test_reminder_status(
            reminder_id=reminder2.id,
            status=ReminderStatusEnum.PENDING.value
        )
        
        # Verify each reminder has its own status
        response1 = client.get(f"/api/reminder-status/{reminder1.id}/current")
        response2 = client.get(f"/api/reminder-status/{reminder2.id}/current")
        
        assert response1.json()["status"] == ReminderStatusEnum.DONE.value
        assert response2.json()["status"] == ReminderStatusEnum.PENDING.value
