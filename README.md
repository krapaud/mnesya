# Mnesya - Elderly Care Assistance Application

## Overview

Mnesya is a mobile reminder application designed to assist elderly individuals and their caregivers. The app features two distinct interfaces optimized for each user type.

### User Interface (Elderly Person)

- Ultra-simplified interface with large buttons (minimum 16px text)
- Maximum 3 buttons per screen
- PIN-based authentication (4 digits, stored locally)
- Device pairing system for security
- Push notifications for reminders
- Simple response options: Done, Remind Later, Unable

### Caregiver Interface

- Full profile management
- Create and schedule reminders
- Real-time tracking of reminder status
- JWT-based secure authentication
- Multi-profile support

## Architecture

```text
mnesya/
├── backend/              # Python API (FastAPI)
│   ├── app/
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── core/        # Configuration and security
│   │   └── utils/       # Utilities
│   ├── worker/          # Asynchronous tasks and scheduler
│   └── migrations/      # Alembic migrations
│
├── frontend/            # Mobile app (React Native)
│   ├── src/
│   │   ├── screens/     # Screens (manager + user)
│   │   ├── components/  # Reusable components
│   │   ├── navigation/  # Navigation configuration
│   │   ├── services/    # API calls
│   │   ├── widgets/     # Native widget
│   │   └── utils/       # Utilities
│   ├── android/         # Android native code
│   └── ios/             # iOS native code
│
├── docker/              # Docker configuration
└── docs/                # Documentation
```

## Technologies

### Backend

- **API**: FastAPI (Python)
- **Database**: PostgreSQL
- **Push notifications**: Firebase Cloud Messaging (FCM)
- **Worker**: APScheduler (simple scheduler for MVP)

### Frontend

- **Framework**: React Native
- **Navigation**: React Navigation
- **Notifications**: Firebase
- **Voice**: react-native-voice

### Infrastructure

- **Containerization**: Docker Compose
- **Reverse Proxy**: NGINX
- **Deployment**: VPS or Cloud (AWS, Azure, GCP)

## Core Features

### Authentication & Security

**Caregiver Authentication:**

- JWT-based secure login
- Email/password registration
- Session management

**User Authentication:**

- Device pairing with 6-character code
- Local PIN validation (4 digits)
- PIN stored as bcrypt hash
- Limited attempts (3-5 max)
- Offline PIN validation capability

**Device Pairing Flow:**

1. Caregiver creates user profile and generates pairing code
2. Elderly user enters code on their device
3. Device is paired to profile (expires after 1 hour)
4. User sets 4-digit PIN locally
5. FCM device token registered for notifications

### Profile Management (Caregiver)

- Create user profiles (name, birthday, optional photo)
- Generate pairing codes for devices
- Manage multiple profiles
- View profile details and history

### Reminder System

**For Caregivers:**

- Create one-shot reminders with title and description
- Schedule specific date/time
- Track reminder status in real-time

**For Users:**

- Receive push notifications
- Respond with 3 action buttons:
  - ✅ Done
  - 🔔 Remind Later
  - ❌ Unable
- View upcoming reminders

### Tracking & History

- View complete reminder history per profile
- Monitor status: done, postponed, refused, pending
- Real-time updates on user actions

## Database Schema

### Main Tables

#### users

- `id`: Primary key
- `type`: Enum (caregiver, user)
- `email`: Caregiver email (unique)
- `password_hash`: Bcrypt hashed password
- `name`: User display name
- `device_token`: FCM token for push notifications
- `pairing_code`: 6-char alphanumeric code
- `pairing_code_expires_at`: Expiration timestamp
- `is_paired`: Boolean flag
- `created_at`, `updated_at`

#### profiles

- `id`: Primary key
- `caregiver_id`: Foreign key to users
- `user_id`: Foreign key to users
- `name`: Profile name
- `birthday`: Date of birth
- `photo_url`: Optional profile picture
- `created_at`, `updated_at`

#### reminders

- `id`: Primary key
- `profile_id`: Foreign key to profiles
- `title`: Reminder title
- `description`: Reminder details
- `scheduled_datetime`: When to trigger
- `created_at`, `updated_at`

#### reminder_status

- `id`: Primary key
- `reminder_id`: Foreign key to reminders
- `status`: Enum (done, postponed, refused, pending)
- `timestamp`: When action occurred
- `created_at`

## Security & Privacy

- JWT tokens for caregiver authentication
- Bcrypt password hashing
- Local PIN validation (offline capable)
- Device pairing with expiring codes
- GDPR-compliant data handling
- Role-based access control (caregivers only see their profiles)
- API rate limiting
- Secure HTTPS communication

## Development Phases

### Phase 1: MVP (Current - 5-6 weeks)

**Scope:**

- Authentication (caregiver JWT + user PIN/pairing)
- Profile management (create, view, list)
- One-shot reminders only
- Push notifications via Firebase
- User response interface (3 buttons)
- Basic tracking and history
- 15 total screens (6 onboarding, 6 caregiver, 3 user)

**MVP Constraints:**

- ✅ Large clickable areas
- ✅ Minimum 16px text
- ✅ Maximum 3 buttons per screen
- ✅ Linear navigation flow
- ❌ No recurring reminders
- ❌ No statistics/graphs
- ❌ No widgets
- ❌ No voice features

### Phase 2: Enhanced Features (Post-MVP)

- Edit/delete profiles and reminders
- Recurring reminders (daily, weekly)
- Automatic re-reminders
- Alert system for caregivers
- Statistics and analytics

### Phase 3: Advanced Features (Future)

- Weather integration
- Text-to-Speech notifications
- Voice journal with transcription
- Home screen widget
- Geolocation and safety features
- Emergency mode
- Daily routine management

## Installation and Deployment

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- Firebase account (for push notifications)

### Configuration

1. Clone repository
2. Copy `.env.example` to `.env` and configure
3. Configure Firebase credentials
4. Launch with Docker Compose

```bash
docker-compose up -d
```

### Mobile Development

```bash
cd frontend
npm install
npx react-native run-android
# or
npx react-native run-ios
```

## API Endpoints

### Authentication (5 endpoints)

- `POST /auth/register` - Manager registration
- `POST /auth/login` - Manager login (JWT)
- `POST /auth/generate-pairing-code` - Generate device pairing code (manager
  only)
- `POST /auth/pair-device` - Pair device with user profile using code
- `POST /auth/validate-pin` - Validate PIN for paired device (returns JWT)

### Profiles (3 endpoints)

- `GET /profiles` - List all profiles
- `POST /profiles` - Create profile
- `GET /profiles/{id}` - Profile details

### Reminders (6 endpoints)

- `GET /reminders` - List reminders (by profile)
- `POST /reminders` - Create one-shot reminder
- `GET /reminders/{id}` - Reminder details
- `POST /reminders/{id}/validate` - Mark as done
- `POST /reminders/{id}/postpone` - Postpone reminder
- `POST /reminders/{id}/refuse` - Refuse reminder

### History (1 endpoint)

- `GET /history/{profile_id}` - Reminder history for profile

### Device Management (2 endpoints)

- `GET /devices/{user_id}` - List paired devices for user
- `DELETE /devices/{device_id}` - Unpair device (manager only)

Total: 17 MVP endpoints

---

## MVP Development Timeline

**Team:** 2 developers (Mickael - Frontend, Jordann - Backend)  
**Duration:** 5-6 weeks  
**Target:** Functional MVP with 15 screens

### Week 1: Foundation & Authentication

- Docker setup and database schema
- Backend: 5 authentication endpoints
- Frontend: Welcome, login, register screens
- Frontend: Device pairing and PIN screens

### Week 2: Profile Management

- Backend: 3 profile endpoints
- Frontend: Profile list and creation forms
- Pairing code generation interface

### Week 3-4: Reminder System

- Backend: 6 reminder endpoints
- Worker: APScheduler setup
- Frontend: Create reminder form
- Frontend: User notification interface (3 buttons)
- Firebase Cloud Messaging integration

### Week 5: Integration & Testing

- End-to-end testing
- Push notification debugging
- Security testing
- Bug fixes

### Week 6: Polish & Deployment

- UI/UX refinements
- User acceptance testing
- Documentation
- Deployment preparation

## Team

**Developers:**

- Mickael - Frontend (React Native)
- Jordann - Backend (Python/FastAPI)

**Project Type:** Academic project - 2025

## License

Educational purposes only.
