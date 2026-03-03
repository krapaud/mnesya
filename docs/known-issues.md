# Known Issues — Mnesya

This document tracks confirmed bugs, limitations, and planned improvements. See the [Security Audit](security-audit.md) for security-specific issues.

---

## Open Issues

### 🔴 ISSUE-001 — No password reset flow

**Area:** Authentication  
**Severity:** High (UX blocker)  
**Status:** Open

**Description:** There is no "Forgot password" feature. A caregiver who loses their password cannot recover their account without direct database access.

**Workaround:** An admin must manually update the password hash in the database.

**Planned fix:** Add `POST /api/auth/forgot-password` (sends reset email) + `POST /api/auth/reset-password` endpoint.

---

### 🟠 ISSUE-002 — Caregiver JWT has no server-side revocation

**Area:** Security / Authentication  
**Severity:** Medium  
**Status:** Open (see MED-2 in [security-audit.md](security-audit.md))

**Description:** Logging out a caregiver does not invalidate the JWT server-side. If the token is stolen, it remains valid for up to 60 minutes.

**Workaround:** Token lifetime is 60 minutes — exposure window is limited.

**Planned fix:** Token blacklist in Redis or a `revoked_tokens` DB table, checked on every protected request.

---

### 🟠 ISSUE-003 — No image upload for user profiles

**Area:** Profile management  
**Severity:** Medium (feature gap)  
**Status:** Open

**Description:** The data model supports an optional photo field, but the API and frontend do not yet implement file upload. The `UserProfileDetail` screen shows a placeholder avatar.

**Workaround:** None.

**Planned fix:** Add `PUT /api/users/{id}/photo` with multipart/form-data, store in object storage (S3 or equivalent), return a URL.

---

### 🟠 ISSUE-004 — Reminder status cannot be corrected by the user

**Area:** Reminder lifecycle  
**Severity:** Medium (UX)  
**Status:** Open

**Description:** Once an elderly user taps a response button (Done / Later / Unable), there is no way to undo or change the status from the user screen.

**Workaround:** The caregiver can update the status from their dashboard.

**Planned fix:** Add a confirmation dialog before recording the status, and a short undo window (e.g. 10 seconds).

---

### 🟡 ISSUE-005 — Push notifications require the app to be opened once

**Area:** Notifications / Onboarding  
**Severity:** Low  
**Status:** Open

**Description:** The Expo push token is registered when the app is first opened. If a user installs the app and never opens it, they will not receive push notifications.

**Workaround:** Completed during the pairing flow — users must open the app to enter the pairing code, which triggers token registration.

**Planned fix:** Ensure token registration occurs immediately during pairing and is retried on subsequent launches.

---

### 🟡 ISSUE-006 — No offline support

**Area:** General  
**Severity:** Low  
**Status:** Open (by design for MVP)

**Description:** The app is entirely online. If the device has no network connection, no data is shown and actions fail silently.

**Workaround:** None.

**Planned fix:** Add offline-first caching (AsyncStorage or SQLite) for read operations and an in-app "no connection" banner.

---

### 🟡 ISSUE-007 — Reminder list performance degrades with large datasets

**Area:** Backend / API  
**Severity:** Low  
**Status:** Open

**Description:** `GET /api/reminder/caregiver` returns all reminders without pagination. For caregivers managing many users over a long period, the response size and query time will grow linearly.

**Workaround:** None in the current version.

**Planned fix:** Add `limit` / `offset` (or cursor-based) pagination parameters. Add a DB index on `(caregiver_id, scheduled_at)`.

---

### 🟡 ISSUE-008 — Docker frontend container not working on ARM (Apple Silicon)

**Area:** Developer Experience  
**Severity:** Low  
**Status:** Open

**Description:** The frontend Dockerfile uses npm packages that include native binaries. On Apple Silicon (M1/M2/M3) machines, `docker compose up frontend` may fail with architecture-related errors.

**Workaround:** Run the frontend locally without Docker:

```bash
cd frontend
npm install && npm run ios
```

**Planned fix:** Add `platform: linux/amd64` to the frontend service in `docker-compose.yml` or rebuild native dependencies for `linux/arm64`.

---

### 🔵 INFO-001 — Swagger UI / ReDoc require Basic Auth

**Area:** Developer Experience  
**Status:** By design

**Description:** The `/docs` and `/redoc` endpoints are protected with HTTP Basic Auth (`DOCS_USERNAME` / `DOCS_PASSWORD`). This is intentional — the interactive docs expose all endpoints and must not be public.

**Note:** The static API reference is available in [docs/api.md](api.md) without authentication.

---

## Resolved Issues

| ID          | Summary                                        | Fixed in                          |
| ----------- | ---------------------------------------------- | --------------------------------- |
| ISSUE-SEC-1 | Pairing code used `random` (non-cryptographic) | `fix/security-bugfixes-and-tests` |
| ISSUE-SEC-2 | Pairing token valid 365 days                   | `fix/security-bugfixes-and-tests` |
| ISSUE-SEC-3 | Password max length 20 chars                   | `fix/security-bugfixes-and-tests` |
| ISSUE-SEC-4 | `datetime.utcnow()` timezone-naive             | `fix/security-bugfixes-and-tests` |
| ISSUE-SEC-5 | No rate limiting on auth endpoints             | `feat/back/slow-api`              |
| ISSUE-SEC-6 | User token never refreshed (90-day expiry)     | `feat/user-token-refresh`         |

---

## Reporting a New Issue

Open an issue on GitHub: [https://github.com/krapaud/mnesya/issues](https://github.com/krapaud/mnesya/issues)

Include:

- Steps to reproduce
- Expected behaviour
- Actual behaviour
- App version / branch
- Device / OS (for frontend issues)
