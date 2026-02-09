# Mnesya

Mobile reminder application for elderly people and their caregivers.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Tests](#tests)

## About

Mnesya is a mobile reminder application designed to help elderly people (Users) and their caregivers, with a focus on simple and accessible use.

### Main Users

- **User (Elderly Person)**: Receives and responds to reminders
- **Caregiver**: Configures and manages profiles and reminders

### MVP Guiding Principles

- Ultra-simple interface for elderly people
- Large clickable areas and readable text (minimum 16px)
- Maximum 3 buttons per screen
- Linear journey without complex navigation

### MVP Scope - Current Implementation (Feb 9, 2026)

- **12 screens implemented** (UI Complete - Frontend 120%):
  - 1 Shared screen: WelcomeScreen
  - 7 Caregiver screens: LoginScreen, RegisterScreen, DashboardScreen, CreateProfileScreen, CreateReminderScreen, RemindersListScreen, UserProfileDetailScreen
  - 4 User screens: UserPairingScreen, UserHomeScreen, ReminderNotificationScreen, UserProfileScreen
- **Internationalization**: Full bilingual support (FR/EN) with i18next
- **Enhanced Notifications**: 4 automatic repetitions (0, +2, +5, +10 min) + caregiver alerts
- **Current status**: Frontend complete (120%), Backend ~50% (models, persistence, services implemented; API routes and Expo Push pending)
- **Estimated duration**: 5-6 weeks with 2 developers
- **Detailed User Stories**: See [Technical Documentation _ Mnesya.pdf](docs/Technical%20Documentation%20_%20Mnesya.pdf) (MoSCoW method, US-001 to US-027)

## Features

### Profile Management (Caregiver)

- ✅ Caregiver account creation (email/password) - UI Complete, Backend Models Ready
- ✅ Secure login - UI Complete, Backend Models Ready
- ✅ User profile creation (first name, last name, date of birth, optional photo) - UI Complete, Backend Models Ready
- ⚠️ 6-character pairing code generation (valid 24h) - UI Complete, Backend Implementation Pending
- ✅ View all managed profiles - UI Complete
- ✅ Bilingual interface (French/English) with i18next

### Reminder Management (Caregiver)

- ✅ Simple reminder creation (title, message, date, time) - UI Complete, Backend Models Ready
- ✅ Chronological reminder view with filters (date, profile, status) - UI Complete
- ✅ Status tracking (Done, Pending, Postponed, Unable) - UI Complete
- ✅ Tab navigation (Home | Reminders | Profile) - Implemented
- ✅ Reminder deletion with automatic notification cleanup - Implemented

### User Interface (Elderly Person)

- ✅ Pairing via 6-character code - UI Complete
- ⚠️ 4-digit PIN code creation and usage - Planned
- ✅ Simple home screen with next reminder - UI Complete
- ✅ Full-screen notification at reminder time - Implemented with Expo Notifications
- ✅ Enhanced notification system:
  - **4 automatic repetitions** (immediate, +2 min, +5 min, +10 min)
  - **Automatic caregiver alert** if no response after 10 minutes
  - **Smart notification cancellation** when user responds
  - **Badge count management** on app icon
- ✅ 3 available actions:
  - **✓ Done** (Green) - Cancels all remaining notifications
  - **⏰ Remind me later** (Orange) - Triggers next repetition
  - **✗ Unable** (Red) - Sends immediate alert to caregiver
- ✅ Bilingual notifications (French/English)

## Architecture

### Components

```text
┌─────────────────────┐         ┌─────────────────────┐
│  Frontend Mobile    │         │  Frontend Mobile    │
│   (Caregiver)       │         │  (User)             │
│  React Native +     │         │  React Native +     │
│  Expo Notifications │         │  Expo Notifications │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           └───────────┬───────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   Backend API  │ ✅ Models & Services
              │  Python/FastAPI│ ⚠️ Routes Pending
              └────────┬───────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │PostgreSQL│  │APScheduler│ │Expo Push │
    │ Database │  │  Worker   │  │  Service │
    │ ✅ Ready │  │ ✅ Config │  │⚠️ Pending│
    └──────────┘  └──────────┘  └──────────┘
```

### Main Data Flows (Current Implementation)

1. **Caregiver Registration/Login** (⚠️ Pending): Frontend UI → FastAPI (Validation, Hashing) → PostgreSQL
   - Frontend: ✅ UI Complete
   - Backend: ✅ Models Ready, ⚠️ Routes Pending

2. **Profile/Reminder Creation** (⚠️ Pending): Frontend → FastAPI (Business logic) → PostgreSQL
   - Frontend: ✅ UI Complete with local data
   - Backend: ✅ Models & Services Ready, ⚠️ API Routes Pending

3. **User Pairing** (⚠️ Pending): Frontend (Code entry) → FastAPI (Validation/expiration) → PostgreSQL
   - Frontend: ✅ UI Complete
   - Backend: ⚠️ Pairing logic not yet implemented

4. **Reminder Trigger** (✅ LOCAL Only): Caregiver creates → Local Expo Notifications (4 repetitions: 0, +2, +5, +10 min)
   - Current: ✅ Fully implemented with local scheduling
   - Future: ⚠️ Backend → Expo Push Service → User device (cross-device notifications)

5. **Status Update** (✅ UI / ⚠️ Backend): User responds → Local state update + notification cancellation
   - Current: ✅ Local response handling with smart cancellation
   - Future: ⚠️ User Frontend → FastAPI → PostgreSQL + Expo Push (caregiver alert)

## Technologies

### Frontend - Fully Implemented

- **Framework** : React Native 0.81.5 with Expo 54 (iOS/Android)
- **Language**: TypeScript 5.9
- **State Management** : React Hooks + AsyncStorage
- **Navigation** : React Navigation 7 (Stack + Bottom Tabs)
- **Internationalization**: i18next 25.8 + react-i18next 16.5 (FR/EN)
- **Notifications** : Expo Notifications 0.32 (local scheduling with 4 automatic repetitions + caregiver alerts)
- **UI Components**:
  - Custom date/time pickers (cross-platform)
  - Haptic feedback (expo-haptics)
  - 6-character code input (react-native-confirmation-code-field)
  - PIN view (react-native-pin-view)

### Backend - Implementation in Progress

- **Framework** : Python 3.9+ with FastAPI 0.104.1
- **Database** : PostgreSQL 13+ with psycopg2-binary
- **ORM** : SQLAlchemy 2.0.23 with Alembic 1.12.1 (2 migrations created)
- **Authentication** : JWT with python-jose (planned)
- **Async Tasks** : APScheduler 3.10.4 (configured)
- **Push Notifications** : Firebase Admin SDK 6.3.0 (to be replaced with Expo Push)
- **Current Implementation Status**:
  - ✅ 4 SQLAlchemy Models implemented (Caregiver, User, Reminder, ReminderStatus)
  - ✅ 5 Persistence Repositories (BaseRepository + 4 domain-specific)
  - ✅ 4 Service Facades (caregiver, user, reminder, reminder_status)
  - ✅ 4 Pydantic Schemas (caregiver_schema, user_schema, reminder_schema, reminder_status_schema)
  - ✅ FastAPI app initialization (main.py with health endpoints)
  - ✅ Database configuration and connection
  - ✅ Alembic migrations configured
  - ✅ Docker Compose full setup (PostgreSQL + Backend + Worker)
  - ✅ requirements.txt with all dependencies
  - ✅ pytest configuration
  - ⚠️ API Routes/Endpoints - Pending implementation
  - ⚠️ Expo Push Notification Service integration - Pending
  - ⚠️ JWT Authentication implementation - Pending
  - ⚠️ Pairing code logic - Pending

### Infrastructure

- **Containerisation** : Docker & Docker Compose ✅ (Fully configured with PostgreSQL, Backend, Worker services)
- **CI/CD** : GitHub Actions / GitLab CI (not yet configured)
- **Environments** : Dev, Staging, Production (to be configured)

## Installation

### Current Status (Feb 9, 2026)

**Frontend**: ✅ Fully operational and ready for development/testing  
**Backend**: ✅ Docker configured, Models & Services ready, API routes pending  
**Docker**: ✅ Fully configured with PostgreSQL, Backend, and Worker services

### Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.9+ (if manual installation)
- PostgreSQL 13+ (if manual installation)
- Docker and Docker Compose (recommended)

### Installation with Docker ✅ Recommended

```bash
# Clone the repository
git clone <repository-url>
cd mnesya

# Start the full environment (PostgreSQL + Backend + Worker)
cd docker
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f backend
```

The backend will be available at `http://localhost:8000`  
Health endpoint: `http://localhost:8000/health`

### Manual Installation

#### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your configurations

# Initialize the database
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

#### Frontend Setup - Operational ✅

```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS (Mac only)
npm run ios

# Run on Android
npm run android
```

## Project Structure

```text
mnesya/
├── backend/                    # Backend API Python/FastAPI
│   ├── app/
│   │   ├── main.py            # ✅ FastAPI application entry point
│   │   ├── config.py          # ✅ Database and app configuration
│   │   ├── __init__.py        # ✅ App factory and database initialization
│   │   ├── models/            # ✅ SQLAlchemy ORM models
│   │   │   ├── caregiver.py   # ✅ Caregiver entity (auth + user management)
│   │   │   ├── user.py        # ✅ User entity (elderly individuals)
│   │   │   ├── reminder.py    # ✅ Reminder entity (scheduled tasks)
│   │   │   └── reminder_status.py # ✅ Status tracking
│   │   ├── persistence/       # ✅ Repository pattern (data access layer)
│   │   │   ├── base_repository.py # Generic CRUD operations
│   │   │   ├── caregiver_repository.py
│   │   │   ├── user_repository.py
│   │   │   ├── reminder_repository.py
│   │   │   └── reminder_status_repository.py
│   │   ├── services/          # ✅ Business logic (facade pattern)
│   │   │   ├── caregiver_facade.py    # Caregiver operations
│   │   │   ├── user_facade.py         # User operations
│   │   │   ├── reminder_facade.py     # Reminder CRUD
│   │   │   └── reminder_status_facade.py # Status tracking
│   │   ├── schemas/           # ✅ Pydantic validation schemas
│   │   │   ├── caregiver_schema.py
│   │   │   ├── user_schema.py
│   │   │   ├── reminder_schema.py
│   │   │   └── reminder_status_schema.py
│   │   └── test/              # ✅ Test suite
│   ├── alembic/               # ✅ Database migrations
│   │   ├── versions/          # 2 migrations created
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── alembic.ini            # ✅ Alembic configuration
│   ├── requirements.txt       # ✅ Python dependencies
│   └── pytest.ini             # ✅ Test configuration
├── frontend/                  # ✅ React Native + Expo + TypeScript Mobile App
│   ├── src/
│   │   ├── App.tsx            # Root component with i18n
│   │   ├── i18n.ts            # i18next configuration
│   │   ├── components/        # Reusable UI components
│   │   │   ├── PlatformDatePicker.tsx
│   │   │   ├── PlatformTimePicker.tsx
│   │   │   └── PlatformProfilePicker.tsx
│   │   ├── locales/           # Internationalization
│   │   │   ├── en.json        # English translations
│   │   │   └── fr.json        # French translations
│   │   ├── navigation/        # Navigation configuration
│   │   │   ├── AppNavigator.tsx    # Main stack navigator
│   │   │   ├── CaregiverTabs.tsx   # Caregiver bottom tabs
│   │   │   └── UserTabs.tsx        # User bottom tabs
│   │   ├── screens/           # Application screens (12 total)
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── CreateProfileScreen.tsx
│   │   │   ├── CreateReminderScreen.tsx
│   │   │   ├── RemindersListScreen.tsx
│   │   │   ├── UserProfileDetailScreen.tsx
│   │   │   ├── UserPairingScreen.tsx
│   │   │   ├── UserHomeScreen.tsx
│   │   │   ├── ReminderNotificationScreen.tsx
│   │   │   └── UserProfileScreen.tsx
│   │   ├── styles/            # Common styles
│   │   │   └── commonStyles.ts
│   │   ├── types/             # TypeScript definitions
│   │   │   ├── index.ts
│   │   │   ├── interfaces.ts
│   │   │   └── declaration.d.ts
│   │   ├── utils/             # Utilities
│   │   │   ├── animations.ts  # Bell swing animation
│   │   │   └── notifications.ts # Expo Notifications setup
│   │   └── data/              # Mock data for testing
│   │       └── fakeData.ts
│   ├── assets/                # Images and icons
│   │   ├── icon.png
│   │   ├── splash.png
│   │   ├── adaptive-icon.png
│   │   ├── favicon.png
│   │   └── mnesya-logo.png
│   ├── archives/              # Legacy components
│   ├── app.json
│   ├── babel.config.js
│   ├── tsconfig.json
│   ├── index.tsx
│   └── package.json
├── docker/                    # ✅ Docker configuration
│   ├── Dockerfile             # Backend container configuration
│   ├── docker-compose.yml     # PostgreSQL + Backend + Worker services
│   └── README.md              # Docker usage instructions
├── docs/                      # Documentation
│   ├── Technical Documentation _ Mnesya.pdf
│   ├── Project Planning.pdf
│   ├── Team Formation and Idea Development Outline.pdf
│   ├── bug-report.md          # Bug tracking and solutions
│   ├── trello-status.md       # Trello vs actual implementation
│   ├── trello-status.txt      # Trello cards for import
│   ├── test-warnings-resolution.md # Backend test documentation
│   └── img/
├── README.md
└── .gitignore
```
│   │   │   ├── authService.js
│   │   │   └── reminderService.js
│   │   ├── utils/            # Constants and helpers
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   └── widgets/          # Specialized widgets
│   │       └── ReminderCard.js
│   ├── android/              # Native Android project
│   ├── ios/                  # Native iOS project
│   ├── assets/               # Images and static resources
│   ├── app.json
│   ├── babel.config.js
│   └── package.json
├── docker/                    # Docker configuration
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
├── docs/                      # Documentation
│   ├── Technical Documentation _ Mnesya.pdf
│   ├── Project Planning.pdf
│   ├── Team Formation and Idea Development Outline.pdf
│   └── img/
├── README.md
├── MVP_COMPLIANCE_REPORT.md
└── .gitignore
```

## API Documentation

### Authentication and Users

| Endpoint         | Method | Description                 | Auth |
|------------------|--------|-----------------------------|----- |
| `/auth/register` | POST   | Caregiver registration      | No   |
| `/auth/login`    | POST   | Login                       | No   |
| `/pairing`       | POST   | User pairing                | No   |

### Profile Management (Caregiver)

| Endpoint    | Method | Description           | Auth             |
|-------------|--------|-----------------------|----------------- |
| `/profiles` | POST   | Create a profile      | Yes (Caregiver)  |
| `/profiles` | GET    | List profiles         | Yes (Caregiver)  |

### Reminder Management

| Endpoint                 | Method | Description            | Auth          |
|--------------------------|--------|------------------------|-------------- |
| `/reminders`             | POST   | Create a reminder      | Yes (Caregiver) |
| `/reminders`             | GET    | List reminders         | Yes (Caregiver) |
| `/reminders/{id}/status` | PUT    | Update status          | Yes (User)      |

### Request Examples

#### Caregiver Registration

```json
POST /auth/register
{
  "email": "caregiver@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Reminder Creation

```json
POST /reminders
{
  "profile_id": 10,
  "title": "Take medications",
  "message": "Don't forget to take your morning medications",
  "scheduled_datetime": "2025-12-30T09:00:00"
}
```

#### Status Update

```json
PUT /reminders/50/status
{
  "status": "Done"
}
```

**Possible statuses**:
- `Done`: Task completed ✓
- `Pending`: Reminder not yet processed ⏳
- `Postponed`: Reminder in 5 minutes ⏰
- `Unable`: Task impossible, alert caregiver ✗

## Development

### Git Branching Strategy

The project uses a simplified Gitflow workflow:

- **main**: Stable branch, reflects Production code
- **dev**: Main development/staging branch
- **feature/\***: Isolated work branches (e.g., `feature/auth-login`)

### Workflow

1. Create a `feature/*` branch from `dev`
2. Develop and commit
3. Create a Pull Request to `dev`
4. Mandatory Code Review by the other developer
5. Merge into `dev`
6. Once validated in Staging, PR from `dev` to `main`

### Commit Conventions

```text
feat(api): add POST /reminders endpoint
fix(frontend): resolve navigation issue
docs: update README
```

### Design System

#### Typography

- **Headings (H1)**: 24px, Bold
- **Body text**: 16px minimum, Regular
- **Buttons**: 18px, Medium

#### Spacing

- Minimum button height: **56px**
- Minimum clickable areas: 44x44px

#### Color Palette

- **Primary Blue**: #4A90E2 (main actions)
- **Success Green**: #7ED321 ("Done" button)
- **Warning Orange**: #F5A623 ("Remind later" button)
- **Error Red**: #D0021B ("Unable" button)
- High contrast for accessibility (WCAG AA)

#### UX Constraints

- Maximum 3 buttons per screen
- Linear journey without complex navigation

## Tests

### Backend (Python/FastAPI)

```bash
cd backend

# Unit tests
pytest tests/unit/

# Integration tests
pytest tests/integration/

# Code coverage
pytest --cov=app tests/
```

#### Test Types

- **Unit tests**: Service classes (AuthService, ProfileService, ReminderService)
- **Integration tests**: API endpoints and database interaction
- **Tool**: Pytest

### Frontend (React Native)

```bash
cd frontend

# Unit tests
npm test

# E2E tests
npm run test:e2e
```

#### Frontend Test Types

- **Unit tests**: Isolated React Native components
- **E2E tests**: Critical user journeys (pairing, reminder response)
- **Tools**: Jest (components), Detox/Appium (E2E)

### Manual Tests

Acceptance criteria checklist to verify before each Production deployment:

#### Functional

- ☐ A caregiver can create an account and log in
- ☐ A caregiver can create a user profile
- ☐ A caregiver can generate a 24h valid pairing code
- ☐ A user can pair with the code
- ☐ A user can create and use a 4-digit PIN code
- ☐ A caregiver can create a one-shot reminder
- ☐ A user receives a full-screen notification at reminder time
- ☐ A user can respond Done/Remind Later/Unable
- ☐ The caregiver sees the status updated in real-time
- ☐ "Remind later" triggers a new reminder in 5 minutes
- ☐ "Unable" sends an urgent notification to the caregiver

#### Design

- ☐ All texts are readable (minimum 16px)
- ☐ All buttons respect 56px minimum height
- ☐ Maximum 3 actions per screen
- ☐ Clear and linear navigation
- ☐ Contrasted colors (WCAG AA accessibility test)

#### Technical

- ☐ The application works offline (local data via AsyncStorage)
- ☐ Notifications work in the background (FCM)
- ☐ The pairing code expires after 24h (Backend verification)
- ☐ The PIN is encrypted locally (React Native Keychain/Crypto)
- ☐ Real-time synchronization between caregiver and user (via FCM + API polling)

### CI/CD

Automated pipeline:

1. **On PR**: Execution of automated tests (Unit/Integration) Backend and Frontend
2. **Staging Deployment**: If tests pass, automatic deployment of the `dev` branch
3. **Production Deployment**: Manual/semi-automatic deployment from `main` after final validation

## MVP Exclusions

Features **not included** in v1.0 (postponed post-MVP):

- ❌ Recurring reminders (daily, weekly, monthly)
- ❌ Graphical calendar view
- ❌ Statistics and graphs
- ❌ Voice messages in reminders
- ❌ Home screen widget
- ❌ Emergency button
- ❌ Advanced settings (custom notification sounds, vibrations, etc.)
- ❌ Images in reminders (US-021, classified COULD HAVE)

These features are documented in the User Stories (US-020 to US-028) as **WON'T HAVE** for the MVP.

---

Developed with ❤️ to make life easier for elderly people and their caregivers
