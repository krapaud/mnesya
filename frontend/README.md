# Mnesya — Frontend

React Native / Expo mobile application for Mnesya — a reminder app for elderly people and their caregivers.

---

## Requirements

| Tool        | Version                                       |
| ----------- | --------------------------------------------- |
| Node.js     | ≥ 20                                          |
| npm         | ≥ 10                                          |
| Expo CLI    | ≥ 0.18                                        |
| iOS/Android | Simulator or physical device with **Expo Go** |

---

## Installation

```bash
# 1 — Clone the repo
git clone https://github.com/krapaud/mnesya.git
cd mnesya/frontend

# 2 — Install dependencies
npm install

# 3 — Configure environment
cp .env.example .env.local
# Edit .env.local and set EXPO_PUBLIC_API_URL to your backend address:
#   Local machine:  http://<your-local-ip>:8000   (use `ifconfig getifaddr en0` on macOS)
#   Docker stack:   http://localhost:8000
```

---

## Environment Variables

| Variable              | Required | Default                 | Description          |
| --------------------- | -------- | ----------------------- | -------------------- |
| `EXPO_PUBLIC_API_URL` | ✅       | `http://localhost:8000` | Backend API base URL |

> On a physical device, `localhost` won't resolve. Use your machine's LAN IP instead.

---

## Available Commands

| Command                 | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm start`             | Start Expo dev server (scan QR code with Expo Go) |
| `npm run ios`           | Launch on iOS simulator (iPhone 17 Pro)           |
| `npm run android`       | Launch on Android emulator                        |
| `npm run web`           | Launch in browser (limited native features)       |
| `npm test`              | Run Jest test suite                               |
| `npm run test:watch`    | Run tests in watch mode                           |
| `npm run test:coverage` | Run tests and generate coverage report            |
| `npm run format`        | Format source files with Prettier                 |

---

## Project Structure

```
src/
├── App.tsx                  # Root component, navigation setup
├── i18n.ts                  # i18next configuration (FR / EN)
├── components/              # Shared UI components
│   ├── ActivityLogModal.tsx         # Caregiver activity log modal (last 48 h)
│   ├── ChangePasswordModal.tsx
│   ├── ConfirmationModal.tsx        # Generic confirm/info modal
│   ├── FilterPickerModal.tsx
│   ├── MenuModal.tsx
│   ├── PairingCodeModal.tsx
│   ├── PlatformDatePicker.tsx       # Fully translated calendar picker
│   ├── PlatformTimePicker.tsx
│   ├── RateLimitModal.tsx           # HTTP 429 feedback modal
│   ├── ReminderCard.tsx
│   ├── UpdateCaregiverProfileModal.tsx
│   └── UpdateUserProfileModal.tsx
├── config/                  # App configuration (API, constants)
├── contexts/                # React contexts (auth state)
├── hooks/                   # Custom hooks
│   ├── useActivityLog.ts            # Activity log fetch + unread badge logic
│   ├── useAuth.ts                   # Auth state (login/logout/register, 429 detection)
│   ├── useCaregiverProfile.ts
│   ├── useCaregiverReminders.ts
│   ├── useFormValidation.ts
│   ├── useReminderStatus.ts
│   ├── useUserProfile.ts
│   ├── useUserProfiles.ts
│   └── useUserReminders.ts
├── locales/                 # Translation files (en.json, fr.json)
├── navigation/              # React Navigation stack definitions
├── screens/                 # All screens (flat)
│   ├── WelcomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── CreateProfileScreen.tsx
│   ├── CreateReminderScreen.tsx
│   ├── DashboardScreen.tsx          # Bell icon + ActivityLogModal + unread badge
│   ├── CaregiverProfileScreen.tsx
│   ├── RemindersListScreen.tsx
│   ├── UserHomeScreen.tsx
│   ├── UserPairingScreen.tsx
│   ├── UserProfileDetailScreen.tsx
│   └── ReminderNotificationScreen.tsx
├── services/                # API service layer
│   ├── api.ts               # Axios instance + token refresh interceptor
│   ├── authService.ts
│   ├── pairingService.ts
│   ├── reminderService.ts   # includes getCaregiverActivityLog()
│   └── ...
├── styles/                  # Global styles and theme
├── types/                   # TypeScript interfaces and declarations
└── utils/                   # Validation helpers, formatters
```

---

## Authentication Flow

### Caregiver

1. Register / Login → receives a 60-min JWT
2. Token stored in `expo-secure-store`
3. Axios interceptor attaches token to every request
4. Token refreshed via `POST /api/auth/refresh` when needed

### Elderly user

1. Receives a 6-character pairing code from caregiver
2. Enters code in `UserPairingScreen`
3. Device receives a 90-day JWT
4. Axios interceptor proactively refreshes via `POST /api/pairing/refresh` when < 7 days remaining

---

## Internationalization

The app is fully bilingual (French / English) using **i18next + react-i18next**.  
Translation files are in `src/locales/`.  
Language is detected automatically from device locale.  
All user-facing strings must use `t('key')` — no hardcoded text.

---

## Running Tests

```bash
npm test                  # single run
npm run test:watch        # watch mode
npm run test:coverage     # HTML coverage report in coverage/
```

Tests use **Jest** + **@testing-library/react-native**.  
Mock files are in `__mocks__/`.

---

## Linting

ESLint v9 is configured in `eslint.config.js`. The project must have **0 errors and 0 warnings** before any commit.

```bash
npx eslint src/
```

---

## Docker (optional)

The frontend can be run as a Docker container for the full stack:

```bash
cd ../docker
cp .env.example .env   # fill in values
docker compose up frontend
```

Ports exposed: `19000` (dev server), `19001`, `19002`.

---

## Key Dependencies

| Package                                | Purpose                        |
| -------------------------------------- | ------------------------------ |
| `expo` ~54                             | Framework                      |
| `react-native` 0.81.5                  | Core                           |
| `@react-navigation/native`             | Navigation                     |
| `axios`                                | HTTP client                    |
| `expo-secure-store`                    | Secure token storage           |
| `expo-notifications`                   | Push notifications             |
| `i18next` + `react-i18next`            | Internationalisation           |
| `react-native-confirmation-code-field` | 6-character pairing code input |
