"""
Mnesya Backend — Performance / Load Tests (Locust)
===================================================

Usage (against local Docker stack):
  pip install locust
  cd backend
  locust -f performance_tests/locustfile.py --host http://localhost:8000

Web UI : http://localhost:8089

Typical scenarios:
  - Smoke      : 1–5 users, 1 min      → sanity check
  - Load       : 50 users, ramp 5/s    → normal traffic
  - Stress     : 200 users, ramp 10/s  → find breaking point
  - Spike      : 0→500 users in 5 s    → resilience check
"""

import random
import string
import uuid
from datetime import datetime, timedelta, timezone

from locust import HttpUser, TaskSet, between, task


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def random_email() -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"perf.test.{suffix}@example.com"


def random_password() -> str:
    """Generate a password that satisfies the caregiver model requirements."""
    return f"PerfTest1@{random.randint(1000, 9999)}"


def future_iso(minutes: int = 60) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


class AuthMixin:
    """Mixin that registers + logs in a caregiver before every task set."""

    token: str = ""
    caregiver_id: str = ""
    user_id: str = ""

    def setup_account(self):
        """Register a fresh caregiver and obtain a JWT."""
        email = random_email()
        password = random_password()

        # Register
        resp = self.client.post(
            "/api/auth/register",
            json={
                "first_name": "PerfTest",
                "last_name": "User",
                "email": email,
                "password": password,
            },
            name="/api/auth/register [setup]",
        )
        if resp.status_code != 201:
            return

        self.caregiver_id = resp.json().get("id", "")

        # Login
        resp = self.client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
            name="/api/auth/login [setup]",
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access_token", "")

    def auth_headers(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def create_user(self) -> str:
        """Create a user profile and return its id."""
        resp = self.client.post(
            "/api/users",
            json={
                "first_name": "Elder",
                "last_name": "Person",
                "birthday": "1950-01-01",
            },
            headers=self.auth_headers(),
            name="/api/users [setup]",
        )
        if resp.status_code == 201:
            return resp.json().get("id", "")
        return ""


# ---------------------------------------------------------------------------
# Task sets
# ---------------------------------------------------------------------------


class AuthTasks(TaskSet, AuthMixin):
    """Authentication endpoint load."""

    def on_start(self):
        self.setup_account()

    @task(3)
    def get_profile(self):
        self.client.get(
            "/api/auth/me",
            headers=self.auth_headers(),
            name="/api/auth/me",
        )

    @task(1)
    def register_and_login(self):
        """Full registration + login cycle — measures auth throughput."""
        email = random_email()
        password = random_password()
        r = self.client.post(
            "/api/auth/register",
            json={
                "first_name": "Perf",
                "last_name": "Reg",
                "email": email,
                "password": password,
            },
            name="/api/auth/register",
        )
        if r.status_code == 201:
            self.client.post(
                "/api/auth/login",
                json={"email": email, "password": password},
                name="/api/auth/login",
            )

    @task(2)
    def refresh_caregiver_token(self):
        """Caregiver token refresh — validates /api/auth/refresh throughput."""
        self.client.post(
            "/api/auth/refresh",
            headers=self.auth_headers(),
            name="/api/auth/refresh",
        )


class ReminderTasks(TaskSet, AuthMixin):
    """Reminder CRUD load — most business-critical path."""

    reminder_ids: list = []

    def on_start(self):
        self.reminder_ids = []
        self.setup_account()
        self.user_id = self.create_user()

    @task(5)
    def list_reminders(self):
        self.client.get(
            "/api/reminder/caregiver",
            headers=self.auth_headers(),
            name="/api/reminder/caregiver",
        )

    @task(3)
    def create_reminder(self):
        if not self.user_id:
            return
        resp = self.client.post(
            "/api/reminder",
            json={
                "title": "Perf Reminder",
                "description": "Load test reminder",
                "scheduled_at": future_iso(random.randint(10, 120)),
                "user_id": self.user_id,
            },
            headers=self.auth_headers(),
            name="/api/reminder [POST]",
        )
        if resp.status_code == 201:
            rid = resp.json().get("id")
            if rid:
                self.reminder_ids.append(rid)

    @task(2)
    def get_reminder(self):
        if not self.reminder_ids:
            return
        rid = random.choice(self.reminder_ids)
        self.client.get(
            f"/api/reminder/{rid}",
            headers=self.auth_headers(),
            name="/api/reminder/{id}",
        )

    @task(1)
    def update_reminder(self):
        if not self.reminder_ids:
            return
        rid = random.choice(self.reminder_ids)
        self.client.put(
            f"/api/reminder/{rid}",
            json={"title": "Updated Perf Title"},
            headers=self.auth_headers(),
            name="/api/reminder/{id} [PUT]",
        )

    @task(1)
    def get_user_reminders(self):
        if not self.user_id:
            return
        self.client.get(
            f"/api/reminder/user/{self.user_id}",
            headers=self.auth_headers(),
            name="/api/reminder/user/{id}",
        )


class UserTasks(TaskSet, AuthMixin):
    """User profile management load."""

    user_ids: list = []

    def on_start(self):
        self.user_ids = []
        self.setup_account()

    @task(4)
    def list_users(self):
        self.client.get(
            "/api/users",
            headers=self.auth_headers(),
            name="/api/users",
        )

    @task(2)
    def create_user(self):
        resp = self.client.post(
            "/api/users",
            json={
                "first_name": "Perf",
                "last_name": "Elder",
                "birthday": "1945-06-15",
            },
            headers=self.auth_headers(),
            name="/api/users [POST]",
        )
        if resp.status_code == 201:
            uid = resp.json().get("id")
            if uid:
                self.user_ids.append(uid)

    @task(3)
    def get_user(self):
        if not self.user_ids:
            return
        uid = random.choice(self.user_ids)
        self.client.get(
            f"/api/users/{uid}",
            headers=self.auth_headers(),
            name="/api/users/{id}",
        )


class PairingTasks(TaskSet, AuthMixin):
    """Pairing code generation load."""

    def on_start(self):
        self.setup_account()
        self.user_id = self.create_user()

    @task(1)
    def generate_pairing_code(self):
        if not self.user_id:
            return
        self.client.post(
            "/api/pairing/generate",
            json={"user_id": self.user_id},
            headers=self.auth_headers(),
            name="/api/pairing/generate",
        )

    @task(1)
    def verify_and_refresh_user_token(self):
        """Full pairing flow: generate → verify → refresh user token."""
        if not self.user_id:
            return
        # Generate a pairing code
        gen = self.client.post(
            "/api/pairing/generate",
            json={"user_id": self.user_id},
            headers=self.auth_headers(),
            name="/api/pairing/generate",
        )
        if gen.status_code != 200:
            return
        code = gen.json().get("code")
        if not code:
            return
        # Verify the code to get a user JWT
        verify = self.client.post(
            "/api/pairing/verify",
            json={"code": code},
            name="/api/pairing/verify",
        )
        if verify.status_code != 200:
            return
        user_token = verify.json().get("access_token")
        if not user_token:
            return
        # Refresh the user JWT
        self.client.post(
            "/api/pairing/refresh",
            headers={"Authorization": f"Bearer {user_token}"},
            name="/api/pairing/refresh",
        )


# ---------------------------------------------------------------------------
# User classes (Locust entrypoints)
# ---------------------------------------------------------------------------


class CaregiverUser(HttpUser):
    """Simulates an authenticated caregiver using the full API."""

    wait_time = between(0.5, 2.0)
    tasks = {
        AuthTasks: 1,
        ReminderTasks: 4,
        UserTasks: 2,
        PairingTasks: 1,
    }


class HeavyReminderUser(HttpUser):
    """Specialist user — heavily exercises the reminder endpoints."""

    wait_time = between(0.2, 1.0)
    tasks = [ReminderTasks]
