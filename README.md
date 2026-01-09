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

### MVP Scope

- **15 screens total**:
  - 2 Onboarding screens (Welcome Screen shared for both profile types)
  - 7 Caregiver screens (Login, Register, Dashboard, Create Profile, Generate Code, Create Reminder, Reminders List)
  - 6 User screens (Enter Code, Set PIN, Enter PIN Daily, Home, Notification, Profile)
- **Estimated duration**: 5-6 weeks with 2 developers
- **Detailed User Stories**: See [Technical Documentation _ Mnesya-2.md](Technical%20Documentation%20_%20Mnesya-2.md) (MoSCoW method, US-001 to US-027)

## Features

### Profile Management (Caregiver)

- ✅ Caregiver account creation (email/password)
- ✅ Secure login
- ✅ User profile creation (first name, last name, date of birth, optional photo)
- ✅ 6-character pairing code generation (valid 24h)
- ✅ View all managed profiles

### Reminder Management (Caregiver)

- ✅ Simple reminder creation (title, message, date, time)
- ✅ Chronological reminder view
- ✅ Status tracking (Done, Pending, Postponed, Unable)
- ✅ Tab navigation (Home | Reminders | Profile)

### User Interface (Elderly Person)

- ✅ Pairing via 6-character code
- ✅ 4-digit PIN code creation and usage
- ✅ Simple home screen with next reminder
- ✅ Full-screen notification at reminder time
- ✅ 3 available actions:
  - **✓ Done** (Green)
  - **⏰ Remind me later** (Orange, reminder in 5 min)
  - **✗ Unable** (Red, urgent alert to caregiver)

## Architecture

### Components

```text
┌─────────────────────┐         ┌─────────────────────┐
│  Frontend Mobile    │         │  Frontend Mobile    │
│   (Caregiver)       │         │  (User)             │
│  React Native       │         │  React Native       │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           └───────────┬───────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   Backend API  │
              │  Python/FastAPI│
              └────────┬───────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │PostgreSQL│  │APScheduler│ │   FCM    │
    │ Database │  │  Worker   │  │(Notifs)  │
    └──────────┘  └──────────┘  └──────────┘
```

### Main Data Flows

1. **Caregiver Registration/Login**: Frontend → FastAPI (Validation, Hashing) → PostgreSQL
2. **Profile/Reminder Creation**: Frontend → FastAPI (Business logic, code generation) → PostgreSQL
3. **User Pairing**: Frontend (Code entry) → FastAPI (Validation/expiration) → PostgreSQL
4. **Reminder Trigger**: APScheduler → FastAPI → FCM → User Frontend
5. **Status Update**: User Frontend → FastAPI → PostgreSQL + FCM (if "Unable")

## Technologies

### Frontend

- **Framework** : React Native (iOS/Android)
- **Gestion d'état** : React Hooks
- **Navigation** : React Navigation
- **Notifications** : Firebase Cloud Messaging (FCM)

### Backend

- **Framework** : Python 3.x avec FastAPI
- **Base de données** : PostgreSQL
- **ORM** : SQLAlchemy avec Alembic pour les migrations
- **Authentification** : JWT (JSON Web Tokens)
- **Tâches asynchrones** : APScheduler
- **Notifications push** : Firebase Cloud Messaging (FCM)

### Infrastructure

- **Containerisation** : Docker & Docker Compose
- **CI/CD** : GitHub Actions / GitLab CI
- **Environnements** : Dev, Staging, Production

## Installation

### Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.9+
- PostgreSQL 13+
- Docker and Docker Compose (optional but recommended)

### Installation with Docker

```bash
# Clone the repository
git clone <repository-url>
cd mnesya

# Start the environment with Docker Compose
docker-compose up -d
```

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

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# iOS (Mac only)
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## Project Structure

```text
mnesya/
├── backend/                    # Backend API Python/FastAPI
│   ├── app/
│   │   ├── main.py            # Application entry point
│   │   ├── core/              # Configuration and security
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/            # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── caregiver.py
│   │   │   ├── profile.py
│   │   │   ├── pairing_code.py
│   │   │   ├── reminder.py
│   │   │   └── reminder_completion.py
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── caregiver.py
│   │   │   ├── pairing.py
│   │   │   ├── profile.py
│   │   │   ├── reminder.py
│   │   │   └── user.py
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── auth.py
│   │   │   ├── caregiver.py
│   │   │   ├── profile.py
│   │   │   ├── reminder.py
│   │   │   └── user.py
│   │   ├── services/          # Business logic
│   │   │   ├── user_service.py
│   │   │   ├── caregiver_service.py
│   │   │   ├── profile_service.py
│   │   │   ├── reminder_service.py
│   │   │   └── notification_service.py
│   │   └── utils/             # Utilities
│   │       ├── dependencies.py
│   │       └── exceptions.py
│   ├── migrations/            # Alembic migrations
│   ├── worker/                # APScheduler tasks
│   └── alembic.ini
├── frontend/                  # React Native Mobile Application
│   ├── src/
│   │   ├── App.js            # Root component
│   │   ├── components/       # Reusable components
│   │   │   ├── Button.js
│   │   │   └── Card.js
│   │   ├── navigation/       # Navigation configuration
│   │   │   └── AppNavigator.js
│   │   ├── screens/          # Application screens
│   │   │   ├── LoginScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── ProfileScreen.js
│   │   │   └── ReminderScreen.js
│   │   ├── services/         # API services
│   │   │   ├── api.js
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
