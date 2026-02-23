"""Pytest configuration and shared fixtures for API tests."""

import pytest
import sys
import os
from datetime import datetime, date, timezone, timedelta
from uuid import uuid4
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.main import app
from app import get_db, database as Base
from app.models.caregiver import CaregiverModel
from app.models.user import UserModel
from app.models.pairing_code import PairingCodeModel
from app.models.reminder import ReminderModel

# Test database URL
TEST_DATABASE_URL = "postgresql://mnesya_user:mnesya_password@db:5432/mnesya_test_db"


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    engine = create_engine(TEST_DATABASE_URL)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    
    yield session
    
    # Cleanup
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture
def sample_caregiver_data():
    """Sample caregiver data for testing."""
    return {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": f"jane.doe.{uuid4().hex[:8]}@example.com",
        "password": "SecurePass123!"
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "first_name": "John",
        "last_name": "Smith",
        "birthday": "1950-05-15"
    }


@pytest.fixture
def create_test_caregiver(db_session):
    """Factory fixture to create test caregivers."""
    def _create_caregiver(email=None, password="TestPass123!"):
        caregiver = CaregiverModel()
        caregiver.first_name = "Test"
        caregiver.last_name = "Caregiver"
        caregiver.email = email or f"test.{uuid4().hex[:8]}@example.com"
        caregiver.password = password  # Setter will validate and hash automatically
        
        db_session.add(caregiver)
        db_session.commit()
        db_session.refresh(caregiver)
        
        return caregiver, password
    
    return _create_caregiver


@pytest.fixture
def create_test_user(db_session):
    """Factory fixture to create test users."""
    def _create_user(caregiver_id=None):
        user = UserModel()
        user.first_name = "Test"
        user.last_name = "User"
        user.birthday = date(1950, 1, 1)
        
        if caregiver_id:
            user.add_caregiver(caregiver_id)
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        return user
    
    return _create_user


@pytest.fixture
def authenticated_client(client, create_test_caregiver):
    """Create an authenticated test client with a valid JWT token."""
    caregiver, password = create_test_caregiver()
    
    # Login to get token
    response = client.post(
        "/api/auth/login",
        json={"email": caregiver.email, "password": password}
    )
    
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    # Add auth header to client
    client.headers.update({"Authorization": f"Bearer {token}"})
    
    return client, caregiver


@pytest.fixture
def create_test_reminder(db_session):
    """Factory fixture to create test reminders."""
    def _create_reminder(caregiver_id=None, user_id=None, scheduled_at=None):
        reminder = ReminderModel()
        reminder.title = "Test Reminder"
        reminder.description = "This is a test reminder description"
        reminder.scheduled_at = scheduled_at or datetime.now(timezone.utc) + timedelta(days=1)
        reminder.caregiver_id = caregiver_id
        reminder.user_id = user_id
        
        db_session.add(reminder)
        db_session.commit()
        db_session.refresh(reminder)
        
        return reminder
    
    return _create_reminder


@pytest.fixture
def sample_reminder_data():
    """Sample reminder data for testing."""
    return {
        "title": "Take medication",
        "description": "Remember to take your morning medication",
        "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    }
