# Mnesya Backend API Tests

Complete test suite for all Mnesya API endpoints.

## Test Results

**Last Run:** March 6, 2026  
**Status:** ✅ **296/296 tests passed** (166 API tests + 130 unit tests)  
**Execution Time:** 51.31 seconds

## Test Structure

Tests are organized by API in separate files:

```
backend/app/test/
├── __init__.py                      # Package marker
├── conftest.py                      # Shared fixtures and pytest configuration
├── test_authentication_api.py       # Tests for /api/auth (19 tests)
├── test_caregiver_api.py           # Tests for /api/caregivers (14 tests)
├── test_user_api.py                # Tests for /api/users (27 tests)
├── test_pairing_api.py             # Tests for /api/pairing (18 tests)
├── test_reminder_api.py            # Tests for /api/reminder (36 tests)
├── test_reminder_status_api.py     # Tests for /api/reminder-status (32 tests)
├── test_push_notification_api.py   # Tests for /api/push-notifications (20 tests)
└── test.py                         # Unit tests for models and schemas (130 tests)
```

## Unit Tests (test.py) - 130 tests ✅

In addition to API integration tests, `test.py` contains comprehensive unit tests for models, schemas, and business logic:

### Model Tests - 65 tests

#### TestUserModel - 18 tests
- First name and last name validation (required, length, whitespace)
- Birthday validation (future dates, unrealistic ages)
- Age calculation
- Model instantiation and property assignment

#### TestCaregiverModel - 26 tests
- Email format validation
- Password strength validation (length, complexity)
- Password hashing verification
- Credential verification (correct/incorrect passwords)
- Email uniqueness
- Model instantiation and property management

#### TestReminderModel - 14 tests
- Title validation (required, length, whitespace)
- Scheduled date validation
- User and caregiver relationships
- Optional description field
- Model instantiation

#### TestReminderStatusModel - 7 tests
- Status value validation (DONE, POSTPONED, UNABLE)
- Status timestamp generation
- Relationship with reminders
- Status history tracking

### Schema Tests - 49 tests

#### TestUserSchema - 8 tests
- UserCreate schema validation
- UserUpdate schema validation
- Required fields enforcement
- Date format validation

#### TestCaregiverSchema - 16 tests
- CaregiverCreate schema validation
- CaregiverUpdate schema validation
- Email format enforcement
- Password strength requirements
- Optional field handling

#### TestReminderSchema - 13 tests
- ReminderCreate schema validation
- ReminderUpdate schema validation
- Title and description validation
- Scheduled date format validation
- User ID validation

#### TestReminderStatusSchema - 12 tests
- ReminderStatusCreate schema validation
- ReminderStatusUpdate schema validation
- Status enum validation
- Timestamp handling

### Integration Tests - 16 tests

#### TestEdgeCases - 11 tests
- Boundary value testing
- Special character handling
- Null and empty value handling
- Timezone edge cases
- UUID validation edge cases

#### TestModelInteractions - 5 tests
- User-Caregiver relationships
- Reminder-User associations
- Status-Reminder tracking
- Cascade deletion behavior
- Multi-entity workflows

## Test Summary Table

### 1. Authentication API (`/api/auth`) - 19 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 1 | `test_register_success` | POST /register | ✅ | Successful registration of a new caregiver |
| 2 | `test_register_duplicate_email` | POST /register | ✅ | Rejection of registration with existing email |
| 3 | `test_register_invalid_email` | POST /register | ✅ | Email format validation |
| 4 | `test_register_weak_password` | POST /register | ✅ | Password strength validation |
| 5 | `test_register_missing_fields` | POST /register | ✅ | Required fields validation |
| 6 | `test_login_success` | POST /login | ✅ | Successful login with valid credentials |
| 7 | `test_login_wrong_password` | POST /login | ✅ | Rejection of incorrect password |
| 8 | `test_login_nonexistent_email` | POST /login | ✅ | Rejection of non-existent email |
| 9 | `test_login_missing_credentials` | POST /login | ✅ | Missing credentials validation |
| 10 | `test_login_empty_credentials` | POST /login | ✅ | Empty credentials validation |
| 11 | `test_get_me_success` | GET /me | ✅ | Profile retrieval with valid token |
| 12 | `test_get_me_no_token` | GET /me | ✅ | Rejection without authentication token |
| 13 | `test_get_me_invalid_token` | GET /me | ✅ | Rejection with invalid token |
| 14 | `test_logout_success` | POST /logout | ✅ | Successful logout |
| 15 | `test_logout_no_token` | POST /logout | ✅ | Logout rejection without token |
| 16 | `test_logout_revokes_token` | POST /logout | ✅ | Token revocation verification |
| 17 | `test_refresh_token_success` | POST /refresh | ✅ | Successful token refresh |
| 18 | `test_refresh_token_no_auth` | POST /refresh | ✅ | Rejection without authentication |
| 19 | `test_refresh_token_invalid` | POST /refresh | ✅ | Rejection with invalid token |

### 2. Caregiver API (`/api/caregivers`) - 14 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 20 | `test_update_first_name` | PUT /me | ✅ | First name update |
| 21 | `test_update_last_name` | PUT /me | ✅ | Last name update |
| 22 | `test_update_email` | PUT /me | ✅ | Email update |
| 23 | `test_update_password` | PUT /me | ✅ | Password update |
| 24 | `test_update_multiple_fields` | PUT /me | ✅ | Multiple fields update |
| 25 | `test_update_with_invalid_email` | PUT /me | ✅ | Email format validation |
| 26 | `test_update_with_weak_password` | PUT /me | ✅ | Password strength validation |
| 27 | `test_update_with_empty_first_name` | PUT /me | ✅ | Empty first name validation |
| 28 | `test_update_with_empty_last_name` | PUT /me | ✅ | Empty last name validation |
| 29 | `test_update_no_fields` | PUT /me | ✅ | Update without fields |
| 30 | `test_update_without_authentication` | PUT /me | ✅ | Rejection without authentication |
| 31 | `test_update_with_duplicate_email` | PUT /me | ✅ | Rejection of existing email |
| 32 | `test_delete_profile_success` | DELETE /me | ✅ | Successful account deletion |
| 33 | `test_delete_profile_without_auth` | DELETE /me | ✅ | Rejection without authentication |
| 34 | `test_delete_profile_invalid_token` | DELETE /me | ✅ | Rejection with invalid token |
| 35 | `test_delete_profile_cannot_use_after_deletion` | DELETE /me | ✅ | Verification of account unusability after deletion |

### 3. User API (`/api/users`) - 27 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 36 | `test_create_profile_success` | POST / | ✅ | Successful user profile creation |
| 37 | `test_create_profile_missing_first_name` | POST / | ✅ | Required first name validation |
| 38 | `test_create_profile_missing_last_name` | POST / | ✅ | Required last name validation |
| 39 | `test_create_profile_missing_birthday` | POST / | ✅ | Required birth date validation |
| 40 | `test_create_profile_invalid_birthday` | POST / | ✅ | Date format validation |
| 41 | `test_create_profile_future_birthday` | POST / | ✅ | Future birth date validation |
| 42 | `test_create_profile_without_auth` | POST / | ✅ | Rejection without authentication |
| 43 | `test_create_multiple_profiles` | POST / | ✅ | Multiple profiles creation |
| 44 | `test_get_all_profiles_empty` | GET / | ✅ | Empty profile list |
| 45 | `test_get_all_profiles_with_users` | GET / | ✅ | Retrieval of all profiles |
| 46 | `test_get_all_profiles_only_own` | GET / | ✅ | Profile isolation by caregiver |
| 47 | `test_get_all_profiles_without_auth` | GET / | ✅ | Rejection without authentication |
| 48 | `test_get_profile_success` | GET /{id} | ✅ | Specific profile retrieval |
| 49 | `test_get_profile_not_found` | GET /{id} | ✅ | Non-existent profile handling |
| 50 | `test_get_profile_unauthorized` | GET /{id} | ✅ | Unauthorized access rejection |
| 51 | `test_get_profile_invalid_id` | GET /{id} | ✅ | UUID format validation |
| 52 | `test_get_profile_without_auth` | GET /{id} | ✅ | Rejection without authentication |
| 53 | `test_update_first_name` | PUT /{id} | ✅ | First name update |
| 54 | `test_update_last_name` | PUT /{id} | ✅ | Last name update |
| 55 | `test_update_birthday` | PUT /{id} | ✅ | Birth date update |
| 56 | `test_update_multiple_fields` | PUT /{id} | ✅ | Multiple fields update |
| 57 | `test_update_not_found` | PUT /{id} | ✅ | Non-existent profile handling |
| 58 | `test_update_unauthorized` | PUT /{id} | ✅ | Unauthorized access rejection |
| 59 | `test_update_without_auth` | PUT /{id} | ✅ | Rejection without authentication |
| 60 | `test_delete_profile_success` | DELETE /{id} | ✅ | Successful profile deletion |
| 61 | `test_delete_profile_not_found` | DELETE /{id} | ✅ | Non-existent profile handling |
| 62 | `test_delete_profile_unauthorized` | DELETE /{id} | ✅ | Unauthorized access rejection |
| 63 | `test_delete_profile_without_auth` | DELETE /{id} | ✅ | Rejection without authentication |
| 64 | `test_delete_profile_cascades` | DELETE /{id} | ✅ | Cascade deletion verification |

### 4. Pairing API (`/api/pairing`) - 18 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 65 | `test_generate_code_success` | POST /generate | ✅ | Successful pairing code generation |
| 66 | `test_generate_code_returns_existing_active` | POST /generate | ✅ | Returns existing active code |
| 67 | `test_generate_code_user_not_found` | POST /generate | ✅ | Non-existent user handling |
| 68 | `test_generate_code_unauthorized_user` | POST /generate | ✅ | Unauthorized access rejection |
| 69 | `test_generate_code_without_auth` | POST /generate | ✅ | Rejection without authentication |
| 70 | `test_generate_code_invalid_user_id` | POST /generate | ✅ | UUID format validation |
| 71 | `test_generate_code_missing_user_id` | POST /generate | ✅ | Required user_id validation |
| 72 | `test_generate_code_expiration_time` | POST /generate | ✅ | Code expiration verification |
| 73 | `test_generate_code_uniqueness` | POST /generate | ✅ | Code uniqueness verification |
| 74 | `test_verify_code_success` | POST /verify | ✅ | Successful code verification |
| 75 | `test_verify_code_not_found` | POST /verify | ✅ | Non-existent code handling |
| 76 | `test_verify_code_expired` | POST /verify | ✅ | Expired code rejection |
| 77 | `test_verify_code_already_used` | POST /verify | ✅ | Already used code rejection |
| 78 | `test_verify_code_missing_code` | POST /verify | ✅ | Required code validation |
| 79 | `test_verify_code_empty_code` | POST /verify | ✅ | Empty code validation |
| 80 | `test_verify_code_case_insensitive` | POST /verify | ✅ | Case-insensitive verification |
| 81 | `test_verify_code_no_auth_required` | POST /verify | ✅ | No authentication required |

### 5. Reminder API (`/api/reminder`) - 36 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 82 | `test_create_reminder_success` | POST / | ✅ | Successful reminder creation |
| 83 | `test_create_reminder_minimal_data` | POST / | ✅ | Creation with minimal data |
| 84 | `test_create_reminder_without_user_access` | POST / | ✅ | Unauthorized access rejection |
| 85 | `test_create_reminder_missing_title` | POST / | ✅ | Required title validation |
| 86 | `test_create_reminder_missing_scheduled_at` | POST / | ✅ | Required date validation |
| 87 | `test_create_reminder_missing_user_id` | POST / | ✅ | Required user_id validation |
| 88 | `test_create_reminder_empty_title` | POST / | ✅ | Empty title validation |
| 89 | `test_create_reminder_title_too_long` | POST / | ✅ | Title length validation |
| 90 | `test_create_reminder_invalid_user_id` | POST / | ✅ | UUID format validation |
| 91 | `test_create_reminder_nonexistent_user` | POST / | ✅ | Non-existent user handling |
| 92 | `test_get_reminders_by_caregiver_success` | GET /caregiver | ✅ | Caregiver's reminders retrieval |
| 93 | `test_get_reminders_by_caregiver_empty` | GET /caregiver | ✅ | Empty reminders list |
| 94 | `test_get_reminders_by_caregiver_no_other_caregiver_reminders` | GET /caregiver | ✅ | Reminders isolation by caregiver |
| 95 | `test_get_reminders_by_user_success` | GET /user | ✅ | User's reminders retrieval |
| 96 | `test_get_reminders_by_user_empty` | GET /user | ✅ | Empty list for a user |
| 97 | `test_get_reminder_by_id_success` | GET /{id} | ✅ | Specific reminder retrieval |
| 98 | `test_get_reminder_by_id_not_found` | GET /{id} | ✅ | Non-existent reminder handling |
| 99 | `test_get_reminder_by_id_invalid_uuid` | GET /{id} | ✅ | UUID format validation |
| 100 | `test_update_reminder_title` | PUT /{id} | ✅ | Title update |
| 101 | `test_update_reminder_description` | PUT /{id} | ✅ | Description update |
| 102 | `test_update_reminder_scheduled_at` | PUT /{id} | ✅ | Date update |
| 103 | `test_update_reminder_multiple_fields` | PUT /{id} | ✅ | Multiple fields update |
| 104 | `test_update_reminder_empty_update` | PUT /{id} | ✅ | Update without fields |
| 105 | `test_update_reminder_not_found` | PUT /{id} | ✅ | Non-existent reminder handling |
| 106 | `test_update_reminder_without_access` | PUT /{id} | ✅ | Unauthorized access rejection |
| 107 | `test_update_reminder_empty_title` | PUT /{id} | ✅ | Empty title validation |
| 108 | `test_update_reminder_title_too_long` | PUT /{id} | ✅ | Title length validation |
| 109 | `test_delete_reminder_success` | DELETE /{id} | ✅ | Successful reminder deletion |
| 110 | `test_delete_reminder_not_found` | DELETE /{id} | ✅ | Non-existent reminder handling |
| 111 | `test_delete_reminder_without_access` | DELETE /{id} | ✅ | Unauthorized access rejection |
| 112 | `test_delete_reminder_invalid_uuid` | DELETE /{id} | ✅ | UUID format validation |
| 113 | `test_create_reminder_without_authentication` | POST / | ✅ | Rejection without authentication |
| 114 | `test_get_caregiver_reminders_without_authentication` | GET /caregiver | ✅ | Rejection without authentication |
| 115 | `test_get_user_reminders_without_authentication` | GET /user | ✅ | Rejection without authentication |
| 116 | `test_get_reminder_by_id_without_authentication` | GET /{id} | ✅ | Rejection without authentication |
| 117 | `test_update_reminder_without_authentication` | PUT /{id} | ✅ | Rejection without authentication |
| 118 | `test_delete_reminder_without_authentication` | DELETE /{id} | ✅ | Rejection without authentication |

### 6. Reminder Status API (`/api/reminder-status`) - 32 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 119 | `test_get_current_status_success` | GET /{reminder_id}/current | ✅ | Current status retrieval |
| 120 | `test_get_current_status_latest` | GET /{reminder_id}/current | ✅ | Latest status retrieval |
| 121 | `test_get_current_status_not_found` | GET /{reminder_id}/current | ✅ | Non-existent status handling |
| 122 | `test_get_current_status_nonexistent_reminder` | GET /{reminder_id}/current | ✅ | Non-existent reminder handling |
| 123 | `test_get_current_status_unauthenticated` | GET /{reminder_id}/current | ✅ | Rejection without authentication |
| 124 | `test_get_current_status_invalid_uuid` | GET /{reminder_id}/current | ✅ | UUID format validation |
| 125 | `test_get_status_history_success` | GET /{reminder_id}/history | ✅ | Status history retrieval |
| 126 | `test_get_status_history_empty` | GET /{reminder_id}/history | ✅ | Empty history |
| 127 | `test_get_status_history_single_status` | GET /{reminder_id}/history | ✅ | History with single status |
| 128 | `test_get_status_history_unauthenticated` | GET /{reminder_id}/history | ✅ | Rejection without authentication |
| 129 | `test_get_status_history_invalid_uuid` | GET /{reminder_id}/history | ✅ | UUID format validation |
| 130 | `test_update_status_to_done` | PUT /{reminder_id}/status | ✅ | Status update to DONE |
| 131 | `test_update_status_to_postponed` | PUT /{reminder_id}/status | ✅ | Status update to POSTPONED |
| 132 | `test_update_status_to_unable` | PUT /{reminder_id}/status | ✅ | Status update to UNABLE |
| 133 | `test_update_status_creates_new_entry` | PUT /{reminder_id}/status | ✅ | New entry creation |
| 134 | `test_update_status_lowercase_converted` | PUT /{reminder_id}/status | ✅ | Uppercase conversion |
| 135 | `test_update_status_invalid_value` | PUT /{reminder_id}/status | ✅ | Status value validation |
| 136 | `test_update_status_empty_value` | PUT /{reminder_id}/status | ✅ | Empty status validation |
| 137 | `test_update_status_missing_field` | PUT /{reminder_id}/status | ✅ | Required field validation |
| 138 | `test_update_status_nonexistent_reminder` | PUT /{reminder_id}/status | ✅ | Non-existent reminder handling |
| 139 | `test_update_status_unauthenticated` | PUT /{reminder_id}/status | ✅ | Rejection without authentication |
| 140 | `test_update_status_invalid_uuid` | PUT /{reminder_id}/status | ✅ | UUID format validation |
| 141 | `test_get_valid_statuses_success` | GET /statuses | ✅ | Valid statuses retrieval |
| 142 | `test_get_valid_statuses_no_auth_required` | GET /statuses | ✅ | No authentication required |
| 143 | `test_get_valid_statuses_returns_uppercase` | GET /statuses | ✅ | Returns statuses in uppercase |
| 144 | `test_get_valid_statuses_order` | GET /statuses | ✅ | Status order verification |
| 145 | `test_complete_status_lifecycle` | Multiple | ✅ | Complete lifecycle integration test |
| 146 | `test_multiple_reminders_different_statuses` | Multiple | ✅ | Integration test with multiple reminders |

### 7. Push Notification API (`/api/push-notifications`) - 20 tests ✅

| # | Test Name | Endpoint | Status | Description |
|---|------------|----------|--------|-------------|
| 147 | `test_register_token_success` | POST /register | ✅ | Successful push token registration |
| 148 | `test_register_token_minimal_data` | POST /register | ✅ | Registration with minimal data |
| 149 | `test_register_token_with_user_id` | POST /register | ✅ | Registration with user_id |
| 150 | `test_register_duplicate_token_updates_existing` | POST /register | ✅ | Existing token update |
| 151 | `test_register_token_invalid_format` | POST /register | ✅ | Token format validation |
| 152 | `test_register_token_empty_string` | POST /register | ✅ | Empty token validation |
| 153 | `test_register_token_missing_token_field` | POST /register | ✅ | Required token validation |
| 154 | `test_register_token_unauthenticated` | POST /register | ✅ | Rejection without authentication |
| 155 | `test_register_token_long_device_name` | POST /register | ✅ | Long device name handling |
| 156 | `test_unregister_token_success` | POST /unregister | ✅ | Successful token unregistration |
| 157 | `test_unregister_nonexistent_token` | POST /unregister | ✅ | Non-existent token handling |
| 158 | `test_unregister_token_unauthenticated` | POST /unregister | ✅ | Rejection without authentication |
| 159 | `test_unregister_token_missing_token_field` | POST /unregister | ✅ | Required token validation |
| 160 | `test_get_my_tokens_caregiver` | GET /my-tokens | ✅ | Caregiver's tokens retrieval |
| 161 | `test_get_my_tokens_user` | GET /my-tokens | ✅ | User's tokens retrieval |
| 162 | `test_get_my_tokens_empty` | GET /my-tokens | ✅ | Empty tokens list |
| 163 | `test_get_my_tokens_only_active` | GET /my-tokens | ✅ | Active tokens only retrieval |
| 164 | `test_get_my_tokens_unauthenticated` | GET /my-tokens | ✅ | Rejection without authentication |
| 165 | `test_complete_token_lifecycle` | Multiple | ✅ | Complete lifecycle integration test |
| 166 | `test_multiple_devices_same_user` | Multiple | ✅ | Integration test with multiple devices |


## Tested APIs - Summary

### 1. Authentication API (`/api/auth`) - 19 tests
- **POST /register** - New caregiver registration
- **POST /login** - Login with email/password
- **GET /me** - Get current caregiver profile
- **POST /logout** - Logout
- **POST /refresh** - Refresh JWT token

### 2. Caregiver API (`/api/caregivers`) - 14 tests
- **PUT /me** - Update caregiver profile
- **DELETE /me** - Delete caregiver account

### 3. User API (`/api/users`) - 27 tests
- **POST /** - Create a new user profile
- **GET /** - Get all caregiver profiles
- **GET /{profile_id}** - Get a specific profile
- **PUT /{profile_id}** - Update a profile
- **DELETE /{profile_id}** - Delete a profile

### 4. Pairing API (`/api/pairing`) - 18 tests
- **POST /generate** - Generate a pairing code
- **POST /verify** - Verify a pairing code

### 5. Reminder API (`/api/reminder`) - 36 tests
- **POST /** - Create a new reminder
- **GET /caregiver** - Get all caregiver reminders
- **GET /user** - Get all user reminders
- **GET /{reminder_id}** - Get a specific reminder
- **PUT /{reminder_id}** - Update a reminder
- **DELETE /{reminder_id}** - Delete a reminder

### 6. Reminder Status API (`/api/reminder-status`) - 32 tests
- **GET /{reminder_id}/current** - Get current status of a reminder
- **GET /{reminder_id}/history** - Get status history of a reminder
- **PUT /{reminder_id}/status** - Update reminder status
- **GET /statuses** - Get list of valid statuses

### 7. Push Notification API (`/api/push-notifications`) - 20 tests
- **POST /register** - Register a push notification token
- **POST /unregister** - Unregister a push notification token
- **GET /my-tokens** - Get all active tokens of current user


## Running Tests

### With Docker Compose (Complete test suite with isolated DB)

```bash
cd docker
docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from tests
```

This command:
- Launches an isolated PostgreSQL test database
- Builds the backend Docker image
- Runs all tests with coverage
- Stops and cleans up containers automatically

### In a running backend container

#### All tests
```bash
docker exec mnesya-backend pytest app/test/
```

#### Tests for a specific API
```bash
# Authentication tests
docker exec mnesya-backend pytest app/test/test_authentication_api.py

# Caregiver tests
docker exec mnesya-backend pytest app/test/test_caregiver_api.py

# User tests
docker exec mnesya-backend pytest app/test/test_user_api.py

# Pairing tests
docker exec mnesya-backend pytest app/test/test_pairing_api.py

# Reminder tests
docker exec mnesya-backend pytest app/test/test_reminder_api.py

# Reminder tests status
docker exec mnesya-backend pytest app/test/test_reminder_status_api.py

# Push notification tests
docker exec mnesya-backend pytest app/test/test_push_notification_api.py

# Unit tests (models, schemas, business logic)
docker exec mnesya-backend pytest app/test/test.py
```

#### Tests for a specific class
```bash
docker exec mnesya-backend pytest app/test/test_authentication_api.py::TestLoginEndpoint
```

#### A specific test
```bash
docker exec mnesya-backend pytest app/test/test_authentication_api.py::TestLoginEndpoint::test_login_success
```

#### With verbose and print output
```bash
docker exec mnesya-backend pytest app/test/ -v -s
```

#### With coverage
```bash
docker exec mnesya-backend pytest app/test/ --cov=app --cov-report=html
```

### Without Docker (local environment)

```bash
cd backend
pytest app/test/ -v --tb=short --cov=app --cov-report=term-missing
```

## Test Coverage

Each endpoint is tested for:

✅ **Success cases** - The happy path works
✅ **Authentication** - Fails without token/with invalid token
✅ **Authorization** - Prevents access to other users' resources
✅ **Validation** - Rejects invalid data
✅ **Edge cases** - Handles special cases (expired, used, etc.)
✅ **Errors** - Returns appropriate HTTP codes

## Test Conventions

- Each test class corresponds to an endpoint
- Descriptive test names: `test_<action>_<scenario>`
- Clear assertions with explicit error messages
- Automatic cleanup via fixtures
- Complete isolation between tests

## Dependencies

Tests require:
- pytest
- fastapi[test]
- sqlalchemy
- passlib
- jose[cryptography]

Installed via backend `requirements.txt`.

## Test Database

Tests use a separate PostgreSQL database:
- URL: `postgresql://mnesya_user:mnesya_password@db:5432/mnesya_test_db`
- Created and cleaned automatically for each test
- Complete isolation from production database

## Usage Example

```python
def test_my_feature(authenticated_client, sample_user_data):
    """Test for a new feature."""
    client, caregiver = authenticated_client
    
    # Create a user
    response = client.post("/api/users", json=sample_user_data)
    assert response.status_code == 200
    
    user_id = response.json()["user"]["id"]
    
    # Test the feature
    response = client.get(f"/api/users/{user_id}")
    assert response.status_code == 200
```

## CI/CD

Tests can be integrated into a CI/CD pipeline:

```yaml
test:
  script:
    - docker-compose up -d
    - docker exec mnesya-backend pytest app/test/ --cov=app
```
