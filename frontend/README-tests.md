# Mnesya Frontend Tests

Complete test suite for the Mnesya React Native application.

## Test Results

**Last Run:** March 6, 2026  
**Status:** ✅ **220/220 tests passed** (16 test suites)  
**Execution Time:** ~3.2 seconds

## Test Structure

Tests are colocated with their source files using `__tests__` subdirectories:

```
frontend/src/
├── __tests__/
│   ├── hooks/
│   │   └── useFormValidation.test.ts       # Form validation hook (18 tests)
│   └── utils/
│       └── validation.test.ts              # Validation utilities (42 tests)
├── components/
│   └── __tests__/
│       ├── UpdateCaregiverProfileModal.test.tsx  # Caregiver modal component (16 tests)
│       └── UpdateUserProfileModal.test.tsx       # User modal component (21 tests)
├── hooks/
│   └── __tests__/
│       ├── useCaregiverProfile.test.ts     # Caregiver profile hook (9 tests)
│       ├── useCaregiverReminders.test.ts   # Caregiver reminders hook (6 tests)
│       ├── useReminderStatus.test.ts       # Reminder status hook (6 tests)
│       ├── useUserProfile.test.ts          # User profile hook (7 tests)
│       ├── useUserProfiles.test.ts         # User profiles list hook (6 tests)
│       └── useUserReminders.test.ts        # User reminders hook (6 tests)
└── services/
    └── __tests__/
        ├── authService.test.ts             # Auth service (24 tests)
        ├── pairingService.test.ts          # Pairing service (7 tests)
        ├── profileService.test.ts          # Profile service (11 tests)
        ├── reminderService.test.ts         # Reminder service (16 tests)
        └── tokenService.test.ts            # Token service (11 tests)
```

## Test Suites Detail

### 1. `useFormValidation` hook — 18 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `initialises with empty values by default` | ✅ |
| 2 | `initialises with a provided initialValue` | ✅ |
| 3 | `starts with no errors` | ✅ |
| 4 | `starts with showErrors set to false` | ✅ |
| 5 | `updates the value of the targeted field` | ✅ |
| 6 | `sets an error when the field value is invalid` | ✅ |
| 7 | `clears the error when the field value becomes valid` | ✅ |
| 8 | `hides the error indicator when the user starts typing` | ✅ |
| 9 | `returns true when all fields are valid` | ✅ |
| 10 | `returns false when at least one field is invalid` | ✅ |
| 11 | `shows errors for each invalid field` | ✅ |
| 12 | `applies fallback required check for fields without a validate function` | ✅ |
| 13 | `marks valid fields as (showErrors = false) after validateAll` | ✅ |
| 14 | `clears all errors and showErrors flags` | ✅ |
| 15 | `sets the field value directly` | ✅ |
| 16 | `sets an error message and shows the error indicator` | ✅ |
| 17 | `validates all fields independently` | ✅ |
| 18 | `returns true when all fields are filled correctly` | ✅ |

---

### 2. Validation utilities (`src/__tests__/utils/validation.test.ts`) — 42 tests ✅

#### `cleanText`

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `collapses multiple spaces into a single space` | ✅ |
| 2 | `leaves single-spaced strings unchanged` | ✅ |
| 3 | `leaves strings with no spaces unchanged` | ✅ |
| 4 | `handles empty string` | ✅ |
| 5 | `handles mixed spacing` | ✅ |

#### `validateEmail`

| # | Test Name | Status |
|---|-----------|--------|
| 6 | `returns null for a valid email` | ✅ |
| 7 | `returns null for a valid email with subdomains` | ✅ |
| 8 | `returns null for an email with uppercase letters` | ✅ |
| 9 | `returns an error key for an email that is too short (< 5 chars)` | ✅ |
| 10 | `returns an error key for an email that exceeds 255 characters` | ✅ |
| 11 | `returns an error key when @ is missing` | ✅ |
| 12 | `returns an error key for missing domain` | ✅ |
| 13 | `returns an error key for missing TLD` | ✅ |
| 14 | `strips surrounding whitespace before validating` | ✅ |
| 15 | `returns an error for whitespace-only string` | ✅ |

#### `validatePassword`

| # | Test Name | Status |
|---|-----------|--------|
| 16 | `returns null for a fully valid password` | ✅ |
| 17 | `returns null for a password at the minimum length (8 chars)` | ✅ |
| 18 | `returns null for a long password up to 72 chars` | ✅ |
| 19 | `returns an error for a password shorter than 8 characters` | ✅ |
| 20 | `rejects a password longer than 72 characters` | ✅ |
| 21 | `returns an error when no digit is present` | ✅ |
| 22 | `returns an error when no uppercase letter is present` | ✅ |
| 23 | `returns an error when no lowercase letter is present` | ✅ |
| 24 | `returns an error when no special character is present` | ✅ |
| 25 | `accepts various valid special characters` | ✅ |
| 26 | `strips leading/trailing whitespace before validation` | ✅ |

#### `validateName`

| # | Test Name | Status |
|---|-----------|--------|
| 27 | `returns null for a valid name` | ✅ |
| 28 | `returns null for a name with exactly 100 chars` | ✅ |
| 29 | `returns an error for an empty string` | ✅ |
| 30 | `returns an error for whitespace-only input` | ✅ |
| 31 | `returns an error for a name exceeding 100 chars` | ✅ |
| 32 | `accepts names with spaces (first + last name style)` | ✅ |
| 33 | `accepts names with accented characters` | ✅ |

#### `validatePasswordConfirmation`

| # | Test Name | Status |
|---|-----------|--------|
| 34 | `returns null when both passwords are identical` | ✅ |
| 35 | `returns an error key when passwords differ` | ✅ |
| 36 | `is case-sensitive` | ✅ |
| 37 | `returns an error when confirm password is empty` | ✅ |
| 38 | `returns an error when the original password is empty` | ✅ |
| 39 | `returns null when both are empty strings` | ✅ |

---

### 3. `UpdateCaregiverProfileModal` component — 16 tests ✅

| # | Test Name | Category | Status |
|---|-----------|----------|--------|
| 1 | `should render modal when visible is true` | rendering | ✅ |
| 2 | `should not render modal content when visible is false` | rendering | ✅ |
| 3 | `should pre-fill form with initial data` | rendering | ✅ |
| 4 | `should render all form fields` | rendering | ✅ |
| 5 | `should show error when first name is empty` | form validation | ✅ |
| 6 | `should show error when email is invalid` | form validation | ✅ |
| 7 | `should validate all fields before submission` | form validation | ✅ |
| 8 | `should call onSave with updated data when form is valid` | form submission | ✅ |
| 9 | `should show loading state during submission` | form submission | ✅ |
| 10 | `should handle save error gracefully` | form submission | ✅ |
| 11 | `should not submit while already updating` | form submission | ✅ |
| 12 | `should call onClose when close button is pressed` | user interactions | ✅ |
| 13 | `should call onClose when cancel button is pressed` | user interactions | ✅ |
| 14 | `should update input values when user types` | user interactions | ✅ |
| 15 | `should handle null initialData gracefully` | edge cases | ✅ |
| 16 | `should reset form when initialData changes` | edge cases | ✅ |

---

### 4. `UpdateUserProfileModal` component — 21 tests ✅

| # | Test Name | Category | Status |
|---|-----------|----------|--------|
| 1 | `should render modal when visible is true` | rendering | ✅ |
| 2 | `should not render modal content when visible is false` | rendering | ✅ |
| 3 | `should pre-fill form with initial data` | rendering | ✅ |
| 4 | `should render all form fields including birthday` | rendering | ✅ |
| 5 | `should display formatted birthday date` | rendering | ✅ |
| 6 | `should show error when first name is empty` | form validation | ✅ |
| 7 | `should show error when last name is empty` | form validation | ✅ |
| 8 | `should show error when name exceeds 100 characters` | form validation | ✅ |
| 9 | `should open date picker when birthday button is pressed` | date picker | ✅ |
| 10 | `should update birthday when date is selected` | date picker | ✅ |
| 11 | `should call onSave with updated data in correct format` | form submission | ✅ |
| 12 | `should format birthday correctly for API` | form submission | ✅ |
| 13 | `should show loading state during submission` | form submission | ✅ |
| 14 | `should handle save error gracefully` | form submission | ✅ |
| 15 | `should disable buttons during submission` | form submission | ✅ |
| 16 | `should call onClose when close button is pressed` | user interactions | ✅ |
| 17 | `should call onClose when cancel button is pressed` | user interactions | ✅ |
| 18 | `should update input values when user types` | user interactions | ✅ |
| 19 | `should handle null initialData gracefully` | edge cases | ✅ |
| 20 | `should reset form when initialData changes` | edge cases | ✅ |
| 21 | `should handle invalid date strings gracefully` | edge cases | ✅ |

---

### 5. `useCaregiverProfile` hook — 9 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should start in loading state and fetch caregiver data` | ✅ |
| 2 | `should handle loading error` | ✅ |
| 3 | `should call onLogout when receiving 401 error` | ✅ |
| 4 | `should reload caregiver data when reload is called` | ✅ |
| 5 | `should handle reload error without clearing existing data` | ✅ |
| 6 | `should set error message on generic API failure` | ✅ |
| 7 | `should trigger logout on 403 forbidden error` | ✅ |
| 8 | `should not trigger logout on non-auth errors` | ✅ |
| 9 | `should handle multiple rapid reload calls` | ✅ |

---

### 6. `useCaregiverReminders` hook — 6 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should fetch and return reminders` | ✅ |
| 2 | `should return an empty list when no reminders` | ✅ |
| 3 | `should set error on fetch failure` | ✅ |
| 4 | `should refetch reminders when reload is called` | ✅ |
| 5 | `should call onAuthError when error includes 401` | ✅ |
| 6 | `should not call onAuthError on non-auth errors` | ✅ |

---

### 7. `useReminderStatus` hook — 6 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should fetch and return the reminder status` | ✅ |
| 2 | `should set error on fetch failure` | ✅ |
| 3 | `should use the reminder ID passed as argument` | ✅ |
| 4 | `should refetch the status when reload is called` | ✅ |
| 5 | `should call onAuthError when error includes 401` | ✅ |
| 6 | `should not call onAuthError on non-auth errors` | ✅ |

---

### 8. `useUserProfile` hook — 7 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should fetch and return the profile` | ✅ |
| 2 | `should set error on fetch failure` | ✅ |
| 3 | `should update the profile and refresh the local state` | ✅ |
| 4 | `should set error and rethrow on update failure` | ✅ |
| 5 | `should delete the profile and set userData to null` | ✅ |
| 6 | `should set error and rethrow on delete failure` | ✅ |
| 7 | `should refetch the profile when reload is called` | ✅ |

---

### 9. `useUserProfiles` hook — 6 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should start in loading state and fetch profiles` | ✅ |
| 2 | `should set error message on API failure` | ✅ |
| 3 | `should return an empty list when no profiles exist` | ✅ |
| 4 | `should refetch profiles when reload is called` | ✅ |
| 5 | `should call onAuthError when error message includes 401` | ✅ |
| 6 | `should not call onAuthError on non-auth errors` | ✅ |

---

### 10. `useUserReminders` hook — 6 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should fetch and return reminders for the user` | ✅ |
| 2 | `should return an empty list when no reminders` | ✅ |
| 3 | `should set error on fetch failure` | ✅ |
| 4 | `should refetch reminders when reload is called` | ✅ |
| 5 | `should call onAuthError when error includes 401` | ✅ |
| 6 | `should not call onAuthError on non-auth errors` | ✅ |

---

### 11. `authService` — 24 tests ✅

| # | Test Name | Category | Status |
|---|-----------|----------|--------|
| 1 | `should successfully login and save token` | login | ✅ |
| 2 | `should throw error on invalid credentials` | login | ✅ |
| 3 | `should handle network errors during login` | login | ✅ |
| 4 | `should save token even if expires_in is very large` | login | ✅ |
| 5 | `should successfully register a new user` | register | ✅ |
| 6 | `should throw error when email already exists` | register | ✅ |
| 7 | `should handle validation errors during registration` | register | ✅ |
| 8 | `should handle registration with special characters in names` | register | ✅ |
| 9 | `should successfully logout and delete token` | logout | ✅ |
| 10 | `should handle logout when no token exists` | logout | ✅ |
| 11 | `should propagate errors from deleteToken` | logout | ✅ |
| 12 | `should successfully fetch current user profile` | getCurrentUser | ✅ |
| 13 | `should throw error when not authenticated` | getCurrentUser | ✅ |
| 14 | `should handle network errors when fetching profile` | getCurrentUser | ✅ |
| 15 | `should correctly parse profile with all fields` | getCurrentUser | ✅ |
| 16 | `should successfully complete login and fetch user workflow` | integration | ✅ |
| 17 | `should complete full user lifecycle: register, login, fetch profile, logout` | integration | ✅ |
| 18 | `should successfully update caregiver profile` | updateCaregiverProfile | ✅ |
| 19 | `should handle email already in use error` | updateCaregiverProfile | ✅ |
| 20 | `should handle validation errors during update` | updateCaregiverProfile | ✅ |
| 21 | `should handle unauthorized error when token is invalid` | updateCaregiverProfile | ✅ |
| 22 | `should update only provided fields` | updateCaregiverProfile | ✅ |
| 23 | `should handle network errors during update` | updateCaregiverProfile | ✅ |
| 24 | `should update profile with special characters in names` | updateCaregiverProfile | ✅ |

---

### 12. `pairingService` — 7 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should generate and return a pairing code` | ✅ |
| 2 | `should throw on unauthorized` | ✅ |
| 3 | `should throw when user not found` | ✅ |
| 4 | `should verify code and return auth data` | ✅ |
| 5 | `should throw on invalid code` | ✅ |
| 6 | `should throw on expired code` | ✅ |
| 7 | `should return user name info in response` | ✅ |

---

### 13. `profileService` — 11 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should create a profile and return the data` | ✅ |
| 2 | `should throw on API error` | ✅ |
| 3 | `should return a list of profiles` | ✅ |
| 4 | `should return an empty list when no profiles exist` | ✅ |
| 5 | `should throw on network error` | ✅ |
| 6 | `should return a single profile by ID` | ✅ |
| 7 | `should throw on not found` | ✅ |
| 8 | `should update and return the updated profile` | ✅ |
| 9 | `should throw on unauthorized` | ✅ |
| 10 | `should delete a profile without returning data` | ✅ |
| 11 | `should throw on not found` | ✅ |

---

### 14. `reminderService` — 16 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should create a reminder and return the data` | ✅ |
| 2 | `should throw on API error` | ✅ |
| 3 | `should return a single reminder by ID` | ✅ |
| 4 | `should throw when reminder not found` | ✅ |
| 5 | `should return all reminders for the user` | ✅ |
| 6 | `should return an empty list when no reminders` | ✅ |
| 7 | `should return all reminders created by the caregiver` | ✅ |
| 8 | `should return an empty list when no reminders` | ✅ |
| 9 | `should update and return the updated reminder` | ✅ |
| 10 | `should throw on unauthorized` | ✅ |
| 11 | `should delete a reminder without returning data` | ✅ |
| 12 | `should throw on not found` | ✅ |
| 13 | `should return the current status of a reminder` | ✅ |
| 14 | `should throw when reminder not found` | ✅ |
| 15 | `should update and return the new status` | ✅ |
| 16 | `should throw on invalid status` | ✅ |

---

### 15. `tokenService` — 11 tests ✅

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should save token to SecureStore with correct key` | ✅ |
| 2 | `should handle empty string token` | ✅ |
| 3 | `should handle long token strings` | ✅ |
| 4 | `should retrieve token from SecureStore` | ✅ |
| 5 | `should return null when no token is stored` | ✅ |
| 6 | `should handle SecureStore errors gracefully` | ✅ |
| 7 | `should remove token from SecureStore` | ✅ |
| 8 | `should handle deletion when no token exists` | ✅ |
| 9 | `should handle SecureStore deletion errors` | ✅ |
| 10 | `should save and retrieve the same token` | ✅ |
| 11 | `should return null after token deletion` | ✅ |

---

### 16. Validation utilities (`src/utils/__tests__/validation.test.ts`) — 17 tests ✅

> Subset of tests covering the same validators as `src/__tests__/utils/validation.test.ts` — primarily used for regression in the utils folder.

| # | Test Name | Status |
|---|-----------|--------|
| 1 | `should return null for valid email` | ✅ |
| 2 | `should return error for email too short` | ✅ |
| 3 | `should return error for email without @` | ✅ |
| 4 | `should return error for email without domain` | ✅ |
| 5 | `should return error for email too long` | ✅ |
| 6 | `should return null for valid password` | ✅ |
| 7 | `should return error for password too short` | ✅ |
| 8 | `should return error for password without digit` | ✅ |
| 9 | `should return error for password without uppercase` | ✅ |
| 10 | `should return error for password without lowercase` | ✅ |
| 11 | `should return error for password without special character` | ✅ |
| 12 | `should return error for password too long` | ✅ |
| 13 | `should return null for valid name` | ✅ |
| 14 | `should return error for empty name` | ✅ |
| 15 | `should return error for name too long` | ✅ |
| 16 | `should return null when passwords match` | ✅ |
| 17 | `should return error when passwords do not match` | ✅ |

---

## Test Summary Table

| Category | File | Tests |
|----------|------|-------|
| Hook — form validation | `src/__tests__/hooks/useFormValidation.test.ts` | 18 |
| Util — validation | `src/__tests__/utils/validation.test.ts` | 42 |
| Component — caregiver modal | `src/components/__tests__/UpdateCaregiverProfileModal.test.tsx` | 16 |
| Component — user modal | `src/components/__tests__/UpdateUserProfileModal.test.tsx` | 21 |
| Hook — caregiver profile | `src/hooks/__tests__/useCaregiverProfile.test.ts` | 9 |
| Hook — caregiver reminders | `src/hooks/__tests__/useCaregiverReminders.test.ts` | 6 |
| Hook — reminder status | `src/hooks/__tests__/useReminderStatus.test.ts` | 6 |
| Hook — user profile | `src/hooks/__tests__/useUserProfile.test.ts` | 7 |
| Hook — user profiles list | `src/hooks/__tests__/useUserProfiles.test.ts` | 6 |
| Hook — user reminders | `src/hooks/__tests__/useUserReminders.test.ts` | 6 |
| Service — auth | `src/services/__tests__/authService.test.ts` | 24 |
| Service — pairing | `src/services/__tests__/pairingService.test.ts` | 7 |
| Service — profile | `src/services/__tests__/profileService.test.ts` | 11 |
| Service — reminder | `src/services/__tests__/reminderService.test.ts` | 16 |
| Service — token | `src/services/__tests__/tokenService.test.ts` | 11 |
| Util — validation (utils/) | `src/utils/__tests__/validation.test.ts` | 17 |
| **Total** | **16 suites** | **220** |

## Running Tests

### All tests

```bash
cd frontend
npx jest
```

### Verbose output (with individual test names)

```bash
npx jest --verbose
```

### A specific test suite

```bash
# Services
npx jest src/services/__tests__/authService.test.ts
npx jest src/services/__tests__/pairingService.test.ts
npx jest src/services/__tests__/profileService.test.ts
npx jest src/services/__tests__/reminderService.test.ts
npx jest src/services/__tests__/tokenService.test.ts

# Hooks
npx jest src/hooks/__tests__/useCaregiverProfile.test.ts
npx jest src/hooks/__tests__/useCaregiverReminders.test.ts
npx jest src/hooks/__tests__/useReminderStatus.test.ts
npx jest src/hooks/__tests__/useUserProfile.test.ts
npx jest src/hooks/__tests__/useUserProfiles.test.ts
npx jest src/hooks/__tests__/useUserReminders.test.ts

# Components
npx jest src/components/__tests__/UpdateCaregiverProfileModal.test.tsx
npx jest src/components/__tests__/UpdateUserProfileModal.test.tsx

# Utilities
npx jest src/__tests__/utils/validation.test.ts
npx jest src/__tests__/hooks/useFormValidation.test.ts
```

### A specific test by name

```bash
npx jest -t "should successfully login and save token"
```

### With coverage report

```bash
npx jest --coverage
```
