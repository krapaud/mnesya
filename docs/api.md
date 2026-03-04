# API Reference — Mnesya

**Base URL (dev):** `http://localhost:8000`  
**Base URL (prod):** `https://mnesya.com`  
**Swagger UI:** `GET /docs` _(Basic Auth required — see `DOCS_USERNAME` / `DOCS_PASSWORD`)_  
**ReDoc:** `GET /redoc` _(same credentials)_  
**OpenAPI JSON:** `GET /openapi.json`

All endpoints expect and return `application/json`. Timestamps are ISO 8601 UTC.

---

## Authentication

Most endpoints require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are obtained via `POST /api/auth/login` or `POST /api/auth/register`.  
Two token types exist:

| Type      | Audience   | Lifetime | Obtained via               |
| --------- | ---------- | -------- | -------------------------- |
| Caregiver | Caregivers | 60 min   | `POST /api/auth/login`     |
| User      | Elderly    | 90 days  | `POST /api/pairing/verify` |

---

## Rate Limiting

| Endpoint                  | Limit      |
| ------------------------- | ---------- |
| `POST /api/auth/register` | 3 / minute |
| `POST /api/auth/login`    | 5 / minute |

Exceeded limits return `429 Too Many Requests`.

---

## Error Format

```json
{
  "detail": "Human-readable error message"
}
```

---

## Endpoints

### Authentication — `/api/auth`

#### `POST /api/auth/register`

Register a new caregiver account.

**Rate limit:** 3/minute  
**Auth:** None

**Request body:**

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "Str0ng!Pass#"
}
```

| Field        | Type   | Rules                                                     |
| ------------ | ------ | --------------------------------------------------------- |
| `first_name` | string | Required                                                  |
| `last_name`  | string | Required                                                  |
| `email`      | string | Valid email format, unique                                |
| `password`   | string | Min 8, max 72 chars, 1 uppercase, 1 digit, 1 special char |

**Response `201`:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "created_at": "2026-03-03T10:30:00Z"
}
```

**Errors:** `400` email already registered / validation error · `429` rate limit · `500`

---

#### `POST /api/auth/login`

Authenticate a caregiver and receive a JWT token.

**Rate limit:** 5/minute  
**Auth:** None

**Request body:**

```json
{
  "email": "john.doe@example.com",
  "password": "Str0ng!Pass#"
}
```

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Errors:** `401` invalid credentials · `429` rate limit · `500`

---

#### `GET /api/auth/me`

Get the currently authenticated caregiver's profile.

**Auth:** Bearer (caregiver)

**Response `200`:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "created_at": "2026-03-03T10:30:00Z"
}
```

**Errors:** `401` · `404` caregiver not found · `500`

---

#### `POST /api/auth/refresh`

Refresh the caregiver JWT token (issue a new 60-min token).

**Auth:** Bearer (caregiver)

**Response `200`:** same shape as `/login` response

**Errors:** `401` · `500`

---

#### `POST /api/auth/logout`

Confirm logout. The client must discard the token — no server-side revocation.

**Auth:** Bearer (caregiver)

**Response `200`:**

```json
{ "message": "Successfully logged out" }
```

**Errors:** `401`

---

### Caregiver Profile — `/api/caregivers`

#### `PUT /api/caregivers/me`

Update the authenticated caregiver's profile. All fields are optional (partial update).

**Auth:** Bearer (caregiver)

**Request body:**

```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "password": "NewPass!1",
  "current_password": "OldPass!1"
}
```

> `current_password` is required only when changing the password.

**Response `200`:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "created_at": "2026-03-03T10:30:00Z"
}
```

**Errors:** `400` validation · `401` · `403` wrong current_password · `404` · `409` email conflict · `500`

---

### User Profiles — `/api/users`

#### `POST /api/users`

Create a new user profile (elderly person) and auto-generate a pairing code.

**Auth:** Bearer (caregiver)

**Request body:**

```json
{
  "first_name": "Marie",
  "last_name": "Dupont",
  "birthday": "1950-05-15"
}
```

**Response `201`:**

```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "first_name": "Marie",
  "last_name": "Dupont",
  "birthday": "1950-05-15",
  "caregiver_ids": ["123e4567-e89b-12d3-a456-426614174000"],
  "pairing_code": "A3B7K2",
  "pairing_code_expires_at": "2026-03-04T10:30:00Z",
  "created_at": "2026-03-03T10:30:00Z",
  "updated_at": "2026-03-03T10:30:00Z"
}
```

**Errors:** `400` · `401` · `500`

---

#### `GET /api/users`

List all user profiles managed by the authenticated caregiver.

**Auth:** Bearer (caregiver)

**Response `200`:** array of user objects (same shape as above, without `pairing_code`)

---

#### `GET /api/users/me`

Get the currently authenticated user's profile (elderly user token).

**Auth:** Bearer (user)

**Response `200`:** user object

---

#### `GET /api/users/{profile_id}`

Get a specific user profile by ID.

**Auth:** Bearer (caregiver)  
**Path param:** `profile_id` — UUID

**Response `200`:** user object  
**Errors:** `401` · `403` no access · `404` · `500`

---

#### `PUT /api/users/{profile_id}`

Update a user profile. All fields are optional.

**Auth:** Bearer (caregiver)

**Request body:**

```json
{
  "first_name": "Marie",
  "last_name": "Martin",
  "birthday": "1952-08-20"
}
```

**Response `200`:** updated user object  
**Errors:** `400` · `401` · `403` · `404` · `500`

---

#### `DELETE /api/users/{profile_id}`

Permanently delete a user profile, all associated reminders, and pairing codes.

**Auth:** Bearer (caregiver)

**Response `204`:** no content  
**Errors:** `401` · `403` · `404` · `500`

---

### Pairing — `/api/pairing`

#### `POST /api/pairing/generate`

Generate a pairing code for a user. Returns existing active code if one already exists.

**Auth:** Bearer (caregiver)

**Request body:**

```json
{ "user_id": "456e7890-e89b-12d3-a456-426614174000" }
```

**Response `200`:**

```json
{
  "code": "A3B7K2",
  "expires_at": "2026-03-03T10:35:00Z"
}
```

> Code is 6 characters (uppercase + digits), valid for **5 minutes**, single use.

**Errors:** `400` · `401` · `403` caregiver doesn't own this user · `404` user not found · `500`

---

#### `POST /api/pairing/verify`

Verify a pairing code and receive a 90-day user token.

**Auth:** None

**Request body:**

```json
{ "code": "A3B7K2" }
```

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 7776000,
  "user_id": "456e7890-e89b-12d3-a456-426614174000",
  "first_name": "Marie",
  "last_name": "Dupont"
}
```

**Errors:** `400` invalid/expired/already used code · `500`

---

#### `POST /api/pairing/refresh`

Refresh a user (elderly) token. Verifies the existing token and issues a new 90-day one.

**Auth:** Bearer (user)

**Request body:** _(empty)_

**Response `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 7776000
}
```

> The frontend calls this automatically when the token expires in < 7 days.

**Errors:** `401` · `500`

---

### Reminders — `/api/reminder`

#### `GET /api/reminder/caregiver`

List all reminders created by the authenticated caregiver.

**Auth:** Bearer (caregiver)

**Response `200`:** array of reminder objects:

```json
[
  {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "title": "Take medication",
    "description": "Take blood pressure medication with water",
    "scheduled_at": "2026-03-03T14:00:00Z",
    "caregiver_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "456e7890-e89b-12d3-a456-426614174000",
    "user_first_name": "Marie",
    "user_last_name": "Dupont",
    "created_at": "2026-03-03T10:30:00Z",
    "updated_at": "2026-03-03T10:30:00Z"
  }
]
```

---

#### `GET /api/reminder`

List reminders for the authenticated user (elderly person).

**Auth:** Bearer (user)

**Response `200`:** array of reminder objects

---

#### `GET /api/reminder/{reminder_id}`

Get a single reminder by ID.

**Auth:** Bearer (caregiver or user)

**Response `200`:** reminder object  
**Errors:** `401` · `404` · `500`

---

#### `POST /api/reminder`

Create a new reminder.

**Auth:** Bearer (caregiver)

**Request body:**

```json
{
  "title": "Take medication",
  "description": "Take blood pressure medication with water",
  "scheduled_at": "2026-03-03T14:00:00Z",
  "user_id": "456e7890-e89b-12d3-a456-426614174000"
}
```

**Response `201`:** reminder object  
**Errors:** `400` · `401` · `403` · `500`

---

#### `PUT /api/reminder/{reminder_id}`

Update an existing reminder (partial update).

**Auth:** Bearer (caregiver)

**Request body:** any subset of `title`, `description`, `scheduled_at`

**Response `200`:** updated reminder object  
**Errors:** `400` · `401` · `403` · `404` · `500`

---

#### `DELETE /api/reminder/{reminder_id}`

Delete a reminder.

**Auth:** Bearer (caregiver)

**Response `204`:** no content  
**Errors:** `401` · `403` · `404` · `500`

---

### Reminder Status — `/api/reminder-status`

#### `GET /api/reminder-status/{reminder_id}/current`

Get the current (most recent) status of a reminder.

**Auth:** Bearer (caregiver or user)

**Response `200`:**

```json
{
  "id": "abc12345-e89b-12d3-a456-426614174000",
  "status": "PENDING",
  "reminder_id": "789e0123-e89b-12d3-a456-426614174000",
  "created_at": "2026-03-03T14:00:00Z",
  "updated_at": "2026-03-03T14:00:00Z"
}
```

**Errors:** `401` · `404` · `500`

---

#### `GET /api/reminder-status/{reminder_id}/history`

Get the complete status history of a reminder (newest first).

**Auth:** Bearer (caregiver or user)

**Response `200`:** array of status objects

---

#### `PUT /api/reminder-status/{reminder_id}`

Set a new status on a reminder. Creates a new entry — history is preserved.

**Auth:** Bearer (caregiver or user)

**Request body:**

```json
{ "status": "DONE" }
```

| Value       | Meaning                          |
| ----------- | -------------------------------- |
| `PENDING`   | Scheduled, awaiting action       |
| `DONE`      | Completed by the user            |
| `POSTPONED` | Deferred by the user             |
| `UNABLE`    | User could not complete the task |

**Response `200`:** new status entry object  
**Errors:** `400` invalid status · `401` · `500`

---

#### `GET /api/reminder-status/valid-statuses`

Returns the list of valid status values.

**Auth:** None

**Response `200`:**

```json
["PENDING", "DONE", "POSTPONED", "UNABLE"]
```

---

### Push Notifications — `/api/push-tokens`

#### `POST /api/push-tokens/register`

Register or update a device push notification token.

**Auth:** Bearer (caregiver or user)

**Request body:**

```json
{
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "device_name": "iPhone 13",
  "user_id": "456e7890-e89b-12d3-a456-426614174000",
  "caregiver_id": null
}
```

> Either `user_id` or `caregiver_id` must be provided.

**Response `201`:**

```json
{
  "id": "def45678-e89b-12d3-a456-426614174000",
  "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "user_id": "456e7890-e89b-12d3-a456-426614174000",
  "caregiver_id": null,
  "device_name": "iPhone 13",
  "is_active": true,
  "created_at": "2026-03-03T10:30:00Z"
}
```

**Errors:** `400` invalid token format · `401` · `500`

---

#### `DELETE /api/push-tokens`

Deactivate a push notification token (e.g. on logout).

**Auth:** Bearer (caregiver or user)

**Request body:**

```json
{ "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" }
```

**Response `200`:** `{ "message": "Token deactivated" }`  
**Errors:** `401` · `404` · `500`

---

#### `GET /api/push-tokens/user/{user_id}`

List all active push tokens for a specific user.

**Auth:** Bearer (caregiver)

**Response `200`:** array of push token objects

---

## Data Models

### Caregiver

| Field        | Type     | Notes    |
| ------------ | -------- | -------- |
| `id`         | UUID     |          |
| `first_name` | string   |          |
| `last_name`  | string   |          |
| `email`      | string   | Unique   |
| `created_at` | datetime | ISO 8601 |

### User

| Field           | Type     | Notes                 |
| --------------- | -------- | --------------------- |
| `id`            | UUID     |                       |
| `first_name`    | string   |                       |
| `last_name`     | string   |                       |
| `birthday`      | date     | `YYYY-MM-DD`          |
| `caregiver_ids` | UUID[]   | Associated caregivers |
| `created_at`    | datetime |                       |
| `updated_at`    | datetime |                       |

### Reminder

| Field          | Type     | Notes    |
| -------------- | -------- | -------- |
| `id`           | UUID     |          |
| `title`        | string   |          |
| `description`  | string   | Optional |
| `scheduled_at` | datetime | ISO 8601 |
| `caregiver_id` | UUID     |          |
| `user_id`      | UUID     |          |
| `created_at`   | datetime |          |
| `updated_at`   | datetime |          |

### ReminderStatus

| Field         | Type     | Notes                                    |
| ------------- | -------- | ---------------------------------------- |
| `id`          | UUID     |                                          |
| `reminder_id` | UUID     |                                          |
| `status`      | enum     | `PENDING`, `DONE`, `POSTPONED`, `UNABLE` |
| `created_at`  | datetime |                                          |
| `updated_at`  | datetime |                                          |
