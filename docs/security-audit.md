# Security Audit Report — Mnesya

**Date :** March 3, 2026  
**Branches covered :**

- `fix/security-bugfixes-and-tests` → merged into `dev` (#30)
- `feat/user-token-refresh` → merged into `dev` (#31)
- `feat/back/slow-api` → pending merge

**Auditor :** GitHub Copilot (static analysis + code review)

---

## Executive Summary

| Severity      | Before | After fix |
| ------------- | ------ | --------- |
| 🔴 Critical   | 3      | 0         |
| 🟠 High       | 4      | 0         |
| 🟡 Medium     | 5      | 1         |
| 🟢 Low / Info | 3      | 3         |

---

## Vulnerabilities fixed in this session

### 🔴 CRIT-1 — Pairing code generated with `random` (non-cryptographic)

**File :** `backend/app/api/pairing.py`  
**Before :** `random.choice(chars)` — predictable if the PRNG seed is known  
**After :** `secrets.choice(chars)` — cryptographically secure module  
**Impact :** An attacker able to observe timing or previous codes could have predicted upcoming codes and accessed a user profile without authorization.

---

### 🔴 CRIT-2 — Pairing token valid for 365 days

**File :** `backend/app/api/pairing.py`  
**Before :** `ACCESS_TOKEN_EXPIRE_DAYS = 365`  
**After :** `ACCESS_TOKEN_EXPIRE_DAYS = 90`  
**Impact :** A compromised token remained valid for a full year. A malicious user who intercepted a pairing link could control the application for 365 days.

---

### 🔴 CRIT-3 — Maximum password length too restrictive (20 characters)

**Files :** `backend/app/models/caregiver.py`, `frontend/src/utils/validation.ts`  
**Before :** max 20 chars  
**After :** max 72 chars (effective bcrypt limit)  
**Impact :** Users could not set strong passwords. This restriction made client-side brute-force attacks easier.

---

### 🟠 HIGH-1 — `datetime.utcnow()` (deprecated, timezone-naive)

**Files** : `reminder_facade.py`, `reminder_repository.py` (4 occurrences)  
**Before :** `datetime.utcnow()` & `datetime.now()`  
**After :** `datetime.now(timezone.utc)`  
**Impact :** In production, comparisons between naive and aware datetime objects could raise `TypeError` or silently misfire scheduled reminders (reminders never sent or sent outside the intended window).

---

### 🟠 HIGH-2 — Special character set too restrictive

**File :** `backend/app/models/caregiver.py`  
**Before :** `['$', '@', '#', '%', '*', '!', '~', '&']` (8 characters)  
**After :** `set('$@#%*!~&^()-_+=[]{}|;:,.<>?/\\')` — 30+ characters  
**Impact :** Password managers generate passwords containing `-`, `_`, `+`, etc. Rejecting these characters pushed users toward weaker passwords.

---

### 🟠 HIGH-3 — Frontend/backend validation mismatch

**File :** `frontend/src/utils/validation.ts`  
**Before :** max 20 chars, special characters restricted to `[$@#%*!~&]`  
**After :** synchronised with the backend (max 72 chars, extended set)  
**Impact :** Passwords accepted by the backend were rejected by the UI (and vice-versa), causing login failures that were impossible to diagnose.

---

### 🟠 HIGH-4 — Duplicate imports in `conftest.py`

**File :** `backend/app/test/conftest.py`  
**Before :** imports duplicated before and after `sys.path.insert`  
**After :** imports deduplicated and correctly ordered  
**Impact :** Silently shadowed import errors, potentially causing stale references in tests.

---

### 🟡 MED-1 — No rate limiting on authentication endpoints _(fixed in `feat/back/slow-api`, pending merge)_

**Files :** `backend/app/api/authentication.py`, `backend/app/limiter.py` (new)  
**Before :** No brute-force protection on `/api/auth/login` and `/api/auth/register`.  
**After :** `slowapi==0.1.9` added — `3/minute` on `register`, `5/minute` on `login`.  
**Implementation details :**

- `app/limiter.py` — isolated `Limiter` instance to avoid circular import
- Test mode (`TESTING=true`) uses a UUID key per request → no rate limiting in CI
- `request: Request` added as the first parameter (required by slowapi)
- Body parameter renamed to `body: RegisterRequest / body: LoginRequest` to avoid name collision

```python
@router.post("/register")
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterRequest, ...):
    ...

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, ...):
    ...
```

---

### 🟡 MED-3 — No proactive refresh of the user token _(fixed in `feat/user-token-refresh`)_

**Files :** `frontend/src/services/api.ts`, `backend/app/api/pairing.py`, `frontend/src/services/pairingService.ts`  
**Before :** The user token (90-day JWT) was never renewed without a full re-pairing. A token expiring mid-session would block the app with no explicit error message.  
**After :**

- `POST /api/pairing/refresh` endpoint added on the backend — verifies the incoming JWT and issues a new 90-day token
- Proactive Axios interceptor: if the token expires in < 7 days, it calls `/api/pairing/refresh` automatically before each request
- `decodeJwtPayload()` helper decodes the token locally (no network call) to compare the expiry date

```typescript
// frontend/src/services/api.ts
axiosInstance.interceptors.request.use(async (config) => {
  const payload = decodeJwtPayload(userToken);
  const sevenDays = 7 * 24 * 3600;
  if (payload.exp - Date.now() / 1000 < sevenDays) {
    const refreshed = await refreshUserToken(userToken);
    // store and use the new token
  }
  return config;
});
```

---

## Remaining vulnerabilities (to be addressed)

### 🟡 MED-2 — No caregiver JWT revocation (no token blacklist)

**File :** `backend/app/api/authentication.py`  
**Description :** A client-side logout does not revoke the caregiver JWT server-side. If a token is compromised before expiry (60 min), it remains valid.

> **Note :** The user token (90-day JWT via pairing) now has proactive refresh — see MED-3 fixed above. The remaining issue concerns caregiver tokens only.

**Recommendation :** Implement a blacklist in Redis or a DB table for caregiver tokens invalidated on logout. The 60-min lifetime limits exposure in case of compromise.

---

## Bon état de sécurité (éléments positifs)

| Élément                                                                 | Statut |
| ----------------------------------------------------------------------- | ------ |
| Mots de passe hachés avec bcrypt                                        | ✅     |
| JWT signé HS256 avec `SECRET_KEY` env                                   | ✅     |
| Vérification d'ownership caregiver→user                                 | ✅     |
| Vérification d'ownership caregiver→reminder                             | ✅     |
| Validation email côté modèle (SQLAlchemy)                               | ✅     |
| Variables sensibles dans `.env` (non commités)                          | ✅     |
| Docs API protégées par Basic Auth                                       | ✅     |
| Pas d'exposition du mot de passe hashé dans les réponses API            | ✅     |
| Refresh proactif du token utilisateur (intercepteur Axios)              | ✅     |
| Endpoint `/api/pairing/refresh` vérifie la signature JWT avant émission | ✅     |

---

## Code coverage (post-fix)

| Module                         | Coverage |
| ------------------------------ | -------- |
| `app/api/authentication.py`    | 86%      |
| `app/api/pairing.py`           | 93%      |
| `app/api/reminder.py`          | 72%      |
| `app/api/push_notification.py` | 79%      |
| `app/models/caregiver.py`      | 82%      |
| **TOTAL**                      | **65%**  |

**Recommended target :** ≥ 80% on business-critical modules.
