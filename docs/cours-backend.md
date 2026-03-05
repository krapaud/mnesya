# Cours Backend — Projet Mnesya

> Technologies du backend : API REST FastAPI, base de données PostgreSQL, sécurité JWT, worker de rappels et notifications push.

---

## Table des matières

1. [Architecture globale](#1-architecture-globale)
2. [Python & typage](#2-python--typage)
3. [FastAPI](#3-fastapi)
4. [Pydantic](#4-pydantic)
5. [SQLAlchemy (ORM)](#5-sqlalchemy-orm)
6. [Alembic (migrations)](#6-alembic-migrations)
7. [PostgreSQL](#7-postgresql)
8. [Authentification JWT](#8-authentification-jwt)
9. [Hachage de mots de passe — Passlib & Bcrypt](#9-hachage-de-mots-de-passe--passlib--bcrypt)
10. [APScheduler (worker de rappels)](#10-apscheduler-worker-de-rappels)
11. [Notifications push — Firebase & Expo SDK (serveur)](#11-notifications-push--firebase--expo-sdk-serveur)
12. [Patterns architecturaux : Repository & Facade](#12-patterns-architecturaux--repository--facade)
13. [Tests — Pytest](#13-tests--pytest)
14. [Docker & Docker Compose](#14-docker--docker-compose)

---

## 1. Architecture globale

Le projet suit une architecture **client-serveur** classique en trois couches séparées :

```
┌─────────────────────────────────────────────────────┐
│               Application mobile                    │
│          React Native + Expo (TypeScript)           │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST (Axios)
┌────────────────────▼────────────────────────────────┐
│                Backend REST                         │
│            FastAPI (Python 3.x)                     │
│   └── APScheduler Worker (process séparé)           │
└────────────────────┬────────────────────────────────┘
                     │ SQLAlchemy ORM
┌────────────────────▼────────────────────────────────┐
│             Base de données                         │
│               PostgreSQL 13                         │
└─────────────────────────────────────────────────────┘
```

Les services tournent dans des **conteneurs Docker** communicant via un réseau interne Bridge.

### Domaine métier

- **Caregiver** : aidant (tuteur) qui crée les rappels
- **User** (patient) : personne qui reçoit les rappels
- **Pairing** : liaison caregiver ↔ patient via code à 6 chiffres
- **Reminder** : rappel de médicament avec heure, fréquence, statut
- **PushToken** : jeton de notification push lié à un appareil

### Structure du code backend

```
backend/
├── app/
│   ├── api/           # Endpoints FastAPI (routeurs)
│   ├── models/        # Modèles SQLAlchemy (tables DB)
│   ├── schemas/       # Modèles Pydantic (validation)
│   ├── persistence/   # Repositories (accès DB)
│   └── services/      # Facades (logique métier)
├── alembic/           # Migrations de base de données
└── worker/            # Scheduler APScheduler
```

---

## 2. Python & typage

### Concepts clés utilisés

| Concept                  | Usage dans le projet                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| Type hints               | Toutes les fonctions sont annotées (`str`, `Optional[str]`, `list[...]`) |
| `dataclasses` / Pydantic | Schémas de validation                                                    |
| `os.environ`             | Lecture des variables d'environnement                                    |
| `datetime` / `timezone`  | Gestion des dates UTC pour JWT et rappels                                |
| `Optional` / `Union`     | Types nullable dans les schémas                                          |
| `Generic[T]`             | Repository générique réutilisable                                        |

### Exemple tiré du projet

```python
from datetime import datetime, timedelta, timezone
from typing import Optional

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=60))
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm="HS256")
```

> **Bonne pratique** : toujours utiliser `datetime.now(timezone.utc)` plutôt que `datetime.utcnow()` (déprécié en Python 3.12).

### Générateurs Python (`yield`)

Utilisés pour les dépendances FastAPI qui nécessitent un nettoyage :

```python
def get_db():
    db = SessionLocal()
    try:
        yield db      # fourni la ressource
    finally:
        db.close()    # toujours exécuté, même en cas d'erreur
```

---

## 3. FastAPI

### Présentation

FastAPI est un framework web Python moderne, basé sur les **standards ASGI** (Asynchronous Server Gateway Interface). Il génère automatiquement une documentation OpenAPI (Swagger UI) à partir des annotations Python.

### Routeurs (`APIRouter`)

Chaque domaine métier a son propre routeur, tous montés dans `main.py` :

```python
# Dans main.py
app.include_router(authentication.router)
app.include_router(user.router)
app.include_router(reminder.router)
app.include_router(reminder_status_api.router)
app.include_router(push_notification.router)

# Dans authentication.py
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=CaregiverProfile, status_code=201)
async def register(request: RegisterRequest, ...):
    ...
```

### Injection de dépendances (`Depends`)

FastAPI utilise un système de DI (Dependency Injection) déclaratif :

```python
# Fournisseur de session DB
def get_db():
    db = SessionLocal()
    try:
        yield db          # yield = le générateur tient la session ouverte
    finally:
        db.close()

# Fournisseur de façade métier (utilise lui-même get_db)
def get_caregiver_facade(db: Session = Depends(get_db)) -> CaregiverFacade:
    return CaregiverFacade(db)

# Utilisation dans un endpoint
@router.get("/me")
async def get_profile(facade: CaregiverFacade = Depends(get_caregiver_facade)):
    ...
```

Le graphe de dépendances est résolu automatiquement par FastAPI à chaque requête.

### Codes de statut HTTP

```python
from fastapi import status

@router.post("/register", status_code=status.HTTP_201_CREATED)
@router.get("/me",        status_code=status.HTTP_200_OK)
@router.delete("/{id}",   status_code=status.HTTP_204_NO_CONTENT)
```

| Code | Signification         | Quand ?                                  |
| ---- | --------------------- | ---------------------------------------- |
| 200  | OK                    | Lecture réussie (GET)                    |
| 201  | Created               | Création réussie (POST)                  |
| 204  | No Content            | Suppression réussie (DELETE)             |
| 400  | Bad Request           | Données invalides ou règle métier violée |
| 401  | Unauthorized          | Token absent ou invalide                 |
| 404  | Not Found             | Ressource introuvable                    |
| 429  | Too Many Requests     | Limite de taux dépassée (rate limiting)  |
| 500  | Internal Server Error | Erreur serveur non prévue                |

### HTTPException

```python
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Reminder not found"
)

raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Email already registered"
)
```

### HTTPBearer (sécurité)

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials   # le JWT brut
    payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return payload
```

### Documentation enrichie des endpoints

FastAPI génère automatiquement `/docs` (Swagger UI) et `/redoc`. On peut enrichir la doc :

```python
@router.post(
    "/register",
    response_model=CaregiverProfile,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new caregiver account",
    description="Create a new caregiver account with email and password.",
    responses={
        201: {"description": "Caregiver successfully registered"},
        400: {"description": "Email already exists"},
    }
)
async def register(...):
    ...
```

### Rate Limiting — SlowAPI

Le projet utilise **SlowAPI** (adaptation de Flask-Limiter pour FastAPI) pour protéger certains endpoints sensibles contre les abus.

**Configuration centralisée (`app/limiter.py`) :**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address
import os, uuid

def _limiter_key_func(request):
    # En mode test, chaque requête a une clé unique → le rate limit ne s'applique jamais
    if os.environ.get("TESTING", "false").lower() == "true":
        return str(uuid.uuid4())
    return get_remote_address(request)

limiter = Limiter(key_func=_limiter_key_func)
```

**Enregistrement dans `main.py` :**

```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

Quand la limite est dépassée, FastAPI retourne automatiquement **`429 Too Many Requests`**.

**Application sur un endpoint :**

```python
from app.limiter import limiter
from fastapi import Request

# 3 inscriptions max par minute depuis la même IP
@router.post("/register")
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterRequest, ...):
    ...

# 5 connexions max par minute
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, ...):
    ...
```

> **Important :** Le paramètre `request: Request` est **obligatoire** pour que SlowAPI puisse lire l'adresse IP du client. Les tests bypasses le rate limit grâce à la `_limiter_key_func` qui génère une clé UUID unique par requête quand `TESTING=true`.

---

### Uvicorn

Uvicorn est le serveur ASGI qui exécute FastAPI. En développement :

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

`--reload` redémarre le serveur automatiquement à chaque modification de fichier.

---

## 4. Pydantic

### Présentation

Pydantic est la bibliothèque de **validation de données** utilisée par FastAPI. Tous les schémas d'entrée/sortie des endpoints sont des modèles Pydantic (version 2.x dans ce projet).

### `BaseModel`

```python
from pydantic import BaseModel, field_validator

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Email invalide")
        return v.lower()
```

### `model_config` avec `from_attributes`

Pour convertir un objet SQLAlchemy en schéma Pydantic (anciennement `orm_mode = True`) :

```python
from pydantic import BaseModel, ConfigDict

class CaregiverResponse(BaseModel):
    id: str
    first_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)
```

### Pydantic Settings

Pour la configuration de l'application via variables d'environnement :

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str

    class Config:
        env_file = ".env"
```

### Schémas de création vs réponse

Le projet distingue plusieurs schémas pour chaque entité :

```python
# Entrée : données nécessaires à la création
class ReminderCreate(BaseModel):
    title: str
    scheduled_time: datetime
    user_id: str

# Sortie : données renvoyées à l'API (inclut l'id et les timestamps)
class ReminderResponse(BaseModel):
    id: str
    title: str
    scheduled_time: datetime
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

### Schéma de jointure — `ActivityLogEntry`

Certains endpoints retournent des données **agrégées depuis plusieurs tables** (JOIN). Pour cela, le schéma est enrichi avec des champs provenant de tables liées (reminder, user).

Le repository effectue le JOIN et enrichit les objets avec des attributs dynamiques avant de les retourner. Le schéma Pydantic les lit ensuite via `from_attributes=True` :

```python
# app/schemas/reminder_status_schema.py
class ActivityLogEntry(BaseModel):
    """Entrée du journal d'activité (caregiver dashboard).

    Représente une interaction utilisateur sur un rappel (DONE, POSTPONED,
    UNABLE ou MISSED) survenue dans les 48 dernières heures.
    """
    status_id: UUID
    status: str              # DONE | POSTPONED | UNABLE | MISSED
    reminder_id: UUID
    reminder_title: str      # enrichi depuis ReminderModel
    user_first_name: str     # enrichi depuis UserModel
    user_last_name: str      # enrichi depuis UserModel
    occurred_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

L'endpoint correspondant est :

```
GET /api/reminder-status/caregiver/recent
```

Il est déclaré **avant** les routes paramétrées (`/{reminder_id}/...`) dans le routeur pour éviter que FastAPI n'interprète `"caregiver"` comme un UUID.

---

## 5. SQLAlchemy (ORM)

### Présentation

SQLAlchemy est le principal ORM (Object-Relational Mapper) Python. Le projet utilise **SQLAlchemy 2.0** avec la syntaxe déclarative classique (`Column`).

### Pattern de modèle utilisé dans le projet

Le projet utilise un pattern spécifique : les attributs de colonne sont **privés** (préfixe `_`) et exposés via des **@property**. Cela permet d'ajouter de la validation ou de la logique dans les setters.

```python
# app/models/user.py
import uuid
from sqlalchemy import Column, String, DateTime, Date
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from app import database

class UserModel(database):
    __tablename__ = 'user'

    # Colonnes privées : _nom = Column('nom_en_bdd', Type, ...)
    _id = Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    _first_name = Column('first_name', String(100), nullable=False)
    _last_name  = Column('last_name',  String(100), nullable=False)
    _birthday   = Column('birthday', Date, nullable=False)

    # ==================== Getters / Setters ====================

    @property
    def id(self):
        return self._id

    @property
    def first_name(self):
        return self._first_name

    @first_name.setter
    def first_name(self, value: str):
        if not value or not value.strip():
            raise ValueError("first_name cannot be empty")
        self._first_name = value.strip()

    @property
    def last_name(self):
        return self._last_name

    @last_name.setter
    def last_name(self, value: str):
        if not value or not value.strip():
            raise ValueError("last_name cannot be empty")
        self._last_name = value.strip()
```

> **Pourquoi ce pattern ?** Les setters permettent de valider les données avant persistance (ex. : ne pas accepter une chaîne vide), sans dépendre uniquement de Pydantic au niveau de l'API.

### Requêtes CRUD via BaseRepository

Les modèles ne contiennent que les données. Les opérations SQL passent par `BaseRepository` :

```python
# SELECT par ID — utilise self.model._id (colonne privée)
def get(self, entity_id: UUID) -> Optional[T]:
    return self.db.query(self.model).filter(
        self.model._id == entity_id
    ).first()

# INSERT avec rollback en cas d'erreur
def add(self, entity: T) -> T:
    try:
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity
    except Exception as e:
        self.db.rollback()
        raise e

# UPDATE via les property setters (validation incluse)
def update(self, entity_id: UUID, data: dict) -> Optional[T]:
    entity = self.get(entity_id)
    if entity:
        for key, value in data.items():
            if hasattr(entity, f'_{key}'):   # vérifie que la colonne existe
                setattr(entity, key, value)  # appelle le @property.setter
        self.db.commit()
        self.db.refresh(entity)
    return entity
```

### Relations entre modèles

```
UserModel ──────< ReminderModel ──────< ReminderStatusModel
    │
    └────────< PushTokenModel

CaregiverModel ──────< PairingCodeModel ──────> UserModel
```

---

## 6. Alembic (migrations)

### Présentation

Alembic est l'outil de **migration de base de données** pour SQLAlchemy. Il génère des scripts Python qui modifient le schéma de façon incrémentale et réversible.

### Commandes essentielles

```bash
# Créer une nouvelle migration (auto-détection des changements de modèles)
alembic revision --autogenerate -m "add_push_tokens_table"

# Appliquer toutes les migrations en attente
alembic upgrade head

# Revenir en arrière d'une migration
alembic downgrade -1

# Voir l'état courant
alembic current

# Historique des migrations
alembic history
```

### Structure d'une migration

```python
# versions/001_initial_schema.py
"""initial schema

Revision ID: 001
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('users')
```

### `env.py`

Le fichier `alembic/env.py` connecte Alembic à SQLAlchemy. Il importe `Base.metadata` pour que l'autogénération détecte les modèles :

```python
from app.models import Base
target_metadata = Base.metadata
```

### Workflow dans le projet

Au démarrage du conteneur Docker :

```bash
alembic upgrade head && uvicorn app.main:app ...
```

---

## 7. PostgreSQL

### Présentation

PostgreSQL est la base de données relationnelle du projet, version 13 via l'image Docker `postgres:13-alpine`.

### Types spécifiques à PostgreSQL

| Type SQLAlchemy           | Type PG           | Usage dans le projet                              |
| ------------------------- | ----------------- | ------------------------------------------------- |
| `UUID(as_uuid=True)`      | `uuid`            | Clés primaires de toutes les entités              |
| `DateTime(timezone=True)` | `timestamptz`     | `created_at`, `scheduled_time`                    |
| `Enum`                    | `enum` (natif PG) | Statut des rappels (`pending`, `taken`, `missed`) |
| `String(n)`               | `varchar(n)`      | Noms, emails, titres                              |
| `Boolean`                 | `boolean`         | `is_active`                                       |

### Clés primaires UUID

Le projet utilise des UUID au lieu d'entiers auto-incrémentés :

```python
import uuid
id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
```

Avantages :

- Pas de collision lors de fusions de données
- ID non prédictible (meilleure sécurité)
- Génération possible côté client

### Variables d'environnement

```
POSTGRES_USER=mnesya
POSTGRES_PASSWORD=secret
POSTGRES_DB=mnesya_db
DATABASE_URL=postgresql://mnesya:secret@db:5432/mnesya_db
```

### pgAdmin

Interface web d'administration PostgreSQL accessible à `http://localhost:5050` via Docker Compose.

---

## 8. Authentification JWT

### Présentation

JWT (JSON Web Token) est un standard ouvert (RFC 7519) pour transmettre des informations vérifiables entre parties. Le projet utilise la bibliothèque **python-jose**.

### Structure d'un JWT

Un JWT est composé de 3 parties encodées en Base64 séparées par des points :

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMTIzIiwiZXhwIjoxNzA5MDAwMDAwfQ.signature
      HEADER                          PAYLOAD                     SIGNATURE
```

- **Header** : algorithme de signature (`HS256`)
- **Payload** : données (`sub`, `exp`, `iat`, ...)
- **Signature** : HMAC-SHA256 du header+payload avec `SECRET_KEY`

### Claims standards

| Claim | Nom        | Signification                 |
| ----- | ---------- | ----------------------------- |
| `sub` | Subject    | Identifiant de l'utilisateur  |
| `exp` | Expiration | Timestamp d'expiration (Unix) |
| `iat` | Issued At  | Timestamp de création         |

### Création d'un token

```python
from jose import jwt
from datetime import datetime, timedelta, timezone

SECRET_KEY = "votre-secret-très-long-et-aléatoire"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["iat"] = datetime.now(timezone.utc)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# Utilisation après login
token = create_access_token({
    "sub": str(caregiver.id),
    "email": caregiver.email
})
```

### Vérification d'un token

```python
from jose import JWTError

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        if payload.get("sub") is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
```

### Flux d'authentification complet

```
Client                          Serveur
  │                                │
  │  POST /api/auth/login           │
  │  { email, password }            │
  ├───────────────────────────────► │
  │                                 │ 1. Cherche le caregiver par email
  │                                 │ 2. Compare hash bcrypt
  │                                 │ 3. Génère JWT (sub=caregiver_id)
  │  { access_token: "eyJ..." }     │
  ◄───────────────────────────────┤
  │                                │
  │  GET /api/reminders            │
  │  Authorization: Bearer eyJ... │
  ├───────────────────────────────► │
  │                                 │ 4. Décode JWT → payload
  │                                 │ 5. Extrait sub → caregiver_id
  │                                 │ 6. Récupère les rappels
  │  [{ reminder1 }, ...]           │
  ◄───────────────────────────────┤
```

---

## 9. Hachage de mots de passe — Passlib & Bcrypt

### Pourquoi ne jamais stocker un mot de passe en clair

Si la base de données est compromise, les mots de passe ne doivent pas être lisibles. On stocke un **hash irréversible** : une empreinte unique qu'on ne peut pas inverser.

### Bcrypt

Bcrypt est un algorithme de hachage lent conçu spécifiquement pour les mots de passe. Il intègre un **salt** aléatoire (évite les attaques par table arc-en-ciel) et un **facteur de coût** ajustable.

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hacher (lors de l'inscription)
hashed = pwd_context.hash("mon_mot_de_passe")
# Résultat : "$2b$12$SaltAléatoire...HashDu256bits"

# Vérifier (lors de la connexion) — compare en temps constant
is_valid = pwd_context.verify("mon_mot_de_passe", hashed)  # True
is_valid = pwd_context.verify("mauvais_mdp", hashed)       # False
```

### Pourquoi bcrypt et pas SHA-256 ?

| Algorithme | Vitesse                     | Usage recommandé            |
| ---------- | --------------------------- | --------------------------- |
| MD5        | Très rapide                 | À ne jamais utiliser        |
| SHA-256    | Très rapide (~1 milliard/s) | Intégrité de fichiers       |
| bcrypt     | Lent (~100/s)               | **Mots de passe** ✓         |
| argon2id   | Configurable                | Mots de passe (plus récent) |

La lenteur de bcrypt est une **fonctionnalité** : elle rend les attaques par force brute impraticables (même avec un GPU puissant).

---

## 10. APScheduler (worker de rappels)

### Présentation

APScheduler (Advanced Python Scheduler) permet d'exécuter des tâches planifiées dans un processus Python. Dans le projet, il tourne dans un **conteneur Docker séparé** (`worker`).

### BackgroundScheduler + IntervalTrigger

Le projet utilise `BackgroundScheduler` (non bloquant) avec `IntervalTrigger`. Trois jobs sont enregistrés, chacun s'exécutant **toutes les 60 secondes** :

```python
# worker/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

def start_scheduler():
    """Initialise et démarre le scheduler en arrière-plan."""
    my_scheduler = BackgroundScheduler()

    # Job 1 — Notifications initiales à T+0
    my_scheduler.add_job(
        send_user_notifications,
        IntervalTrigger(seconds=60),
        id="send_user_notifications",
    )

    # Job 2 — Relance si pas de réponse à T+5 min
    my_scheduler.add_job(
        lambda: send_user_retry(5),
        IntervalTrigger(seconds=60),
        id="send_user_retry_5min",
    )

    # Job 3 — Alerte aidant à T+10 min
    my_scheduler.add_job(
        send_caregiver_escalations,
        IntervalTrigger(seconds=60),
        id="send_caregiver_escalations",
    )

    my_scheduler.start()
    return my_scheduler
```

### Exemple d'un job — `send_user_notifications`

Chaque job ouvre **sa propre session DB** (pour éviter les problèmes de thread) :

```python
def send_user_notifications() -> None:
    """Envoie les notifications pour les rappels dus (T+0).

    Cherche les rappels dont l'heure est dans la fenêtre [now-90s, now].
    La fenêtre de 90s compense le jitter du scheduler (interval=60s).
    """
    from app import SessionLocal

    db = SessionLocal()
    try:
        reminder_repo = ReminderRepository(db)
        push_token_repo = PushTokenRepository(db)
        notification_service = NotificationService()

        reminders = reminder_repo.get_reminders_due_now(window_seconds=90)

        for reminder in reminders:
            tokens = [
                t.token
                for t in push_token_repo.get_active_tokens_by_user(reminder.user_id)
            ]
            if not tokens:
                continue
            notification_service.send_reminder_notification(
                tokens=tokens,
                reminder_title=reminder.title,
                reminder_description=reminder.description,
                reminder_id=str(reminder.id),
                extra_data={"isUserNotification": True},
            )
    except Exception as e:
        logger.error(f"[Scheduler] Error: {e}")
    finally:
        db.close()
```

### Différence BackgroundScheduler vs BlockingScheduler

| Scheduler             | Comportement                                    | Utilisation dans le projet |
| --------------------- | ----------------------------------------------- | -------------------------- |
| `BackgroundScheduler` | Tourne dans un thread daemon — ne bloque pas    | ✅ Utilisé                 |
| `BlockingScheduler`   | Bloque le thread principal jusqu'à interruption | ❌ Non utilisé             |

Le `BackgroundScheduler` est choisi ici car le process `worker` fait tourner une boucle `while True: time.sleep(60)` en main thread — le scheduler s'exécute en parallèle dans un thread secondaire.

### Pourquoi un conteneur séparé ?

- **Ne pas bloquer** les requêtes HTTP du backend
- **Isoler les crashs** : si le scheduler plante, l'API continue
- **Scaler** indépendamment du backend

---

## 11. Notifications push — Firebase & Expo SDK (serveur)

### Deux systèmes complémentaires

Le projet supporte deux fournisseurs de notifications push depuis le serveur.

### Firebase Cloud Messaging (FCM)

Utilisé pour envoyer des notifications aux appareils Android et iOS via Google Firebase.

```python
import firebase_admin
from firebase_admin import credentials, messaging

# Initialisation (une seule fois au démarrage de l'app)
cred = credentials.Certificate("firebase-credentials.json")
firebase_admin.initialize_app(cred)

# Envoi d'une notification à un appareil
message = messaging.Message(
    notification=messaging.Notification(
        title="Rappel médicament",
        body="Il est temps de prendre votre traitement"
    ),
    data={"reminder_id": "123"},  # données supplémentaires (silencieuses)
    token=device_fcm_token,       # token FCM de l'appareil cible
)
response = messaging.send(message)
```

### Expo Push Notifications (serveur)

Expo fournit un service intermédiaire unifiant FCM (Android) et APNs (iOS) :

```python
from exponent_server_sdk import PushClient, PushMessage

client = PushClient()
response = client.publish(PushMessage(
    to=expo_push_token,       # "ExponentPushToken[xxxxxxxxxx]"
    title="Rappel",
    body="Prenez votre médicament",
    data={"reminder_id": str(reminder.id)},
    sound="default",
))
```

### Stockage des tokens push

Les tokens push des appareils sont stockés en base dans la table `push_tokens` :

```python
class PushToken(Base):
    __tablename__ = "push_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    token = Column(String, nullable=False)
    locale = Column(String(10))  # "fr", "en"
    created_at = Column(DateTime(timezone=True))
```

---

## 12. Patterns architecturaux : Repository & Facade

### 12.1 Pattern Repository

Le Repository abstrait l'accès aux données. Chaque entité a son propre repository héritant de `BaseRepository`.

**Avantages :**

- Centralise les requêtes SQL en un seul endroit
- Facilite les tests (on peut substituer le repository)
- Le reste de l'application ne connaît pas SQLAlchemy directement

```python
# app/persistence/base_repository.py
from typing import Generic, TypeVar, Type, List, Optional
from sqlalchemy.orm import Session
from uuid import UUID

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def add(self, entity: T) -> T:
        """INSERT avec rollback automatique en cas d'erreur."""
        try:
            self.db.add(entity)
            self.db.commit()
            self.db.refresh(entity)
            return entity
        except Exception as e:
            self.db.rollback()
            raise e

    def get(self, entity_id: UUID) -> Optional[T]:
        """SELECT par ID — utilise la colonne privée _id."""
        return self.db.query(self.model).filter(
            self.model._id == entity_id
        ).first()

    def get_all(self) -> List[T]:
        return self.db.query(self.model).all()

    def update(self, entity_id: UUID, data: dict) -> Optional[T]:
        """UPDATE en passant par les @property.setter (validation incluse)."""
        try:
            entity = self.get(entity_id)
            if entity:
                for key, value in data.items():
                    if hasattr(entity, f'_{key}'):        # colonne existe ?
                        setattr(entity, key, value)       # appelle le setter
                self.db.commit()
                self.db.refresh(entity)
            return entity
        except Exception as e:
            self.db.rollback()
            raise e

    def delete(self, entity_id: UUID) -> bool:
        try:
            entity = self.get(entity_id)
            if entity:
                self.db.delete(entity)
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.db.rollback()
            raise e
```

### 12.2 Pattern Facade

La Facade orchestre plusieurs repositories et porte la logique métier.

```python
# app/services/reminder_facade.py
class ReminderFacade:
    def __init__(self, db: Session):
        self.reminder_repo = ReminderRepository(db)
        self.reminder_status_repo = ReminderStatusRepository(db)

    def create_reminder(self, data: ReminderCreate) -> ReminderModel:
        reminder = ReminderModel(...)
        saved = self.reminder_repo.add(reminder)

        # Crée automatiquement un statut PENDING pour le rappel
        status = ReminderStatusModel(reminder_id=saved.id, status=ReminderStatusEnum.PENDING)
        self.reminder_status_repo.add(status)
        return saved

    def postpone_reminder(self, reminder_id: UUID) -> ReminderStatusModel:
        """Reporte le rappel de 5 minutes — crée un statut POSTPONED."""
        ...
```

### Couches de l'architecture

```
┌──────────────────────────────────┐
│  API  (FastAPI routers)          │  ← Reçoit les requêtes HTTP
│  app/api/                        │
└─────────────┬────────────────────┘
              │ appelle
┌─────────────▼────────────────────┐
│  Facade  (logique métier)        │  ← Orchestre les opérations
│  app/services/                   │
└─────────────┬────────────────────┘
              │ appelle
┌─────────────▼────────────────────┐
│  Repository  (accès données)     │  ← Requêtes SQL via SQLAlchemy
│  app/persistence/                │
└─────────────┬────────────────────┘
              │ via SQLAlchemy ORM
┌─────────────▼────────────────────┐
│  Base de données (PostgreSQL)    │
└──────────────────────────────────┘
```

---

## 13. Tests — Pytest

### Présentation

Pytest est le framework de test Python. Le projet utilise `TestClient` de FastAPI (basé sur Starlette) et une **vraie base de données PostgreSQL de test** — il n'y a pas de SQLite en mémoire.

### Configuration

```ini
# pytest.ini
[pytest]
asyncio_mode = auto
testpaths = app/test
```

### Base de données de test — PostgreSQL réelle

L'URL de connexion est lue depuis la variable d'environnement `TEST_DATABASE_URL` :

```python
# app/test/conftest.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import get_db, database as Base

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://mnesya_user:changeme@db:5432/mnesya_test_db"
)
```

Avant chaque test, les tables sont créées (`create_all`) et détruites après (`drop_all`), garantissant l'isolation :

```python
@pytest.fixture(scope="function")
def db_session():
    """Crée une session DB fraîche pour chaque test."""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)           # crée toutes les tables

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)             # nettoie après le test


@pytest.fixture(scope="function")
def client(db_session):
    """Client HTTP avec injection de la DB de test via dependency_overrides."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
```

### Fixtures de données

Les données de test sont créées via des fixtures dédiées dans `conftest.py` :

```python
@pytest.fixture
def sample_caregiver_data():
    return {
        "first_name": "Alice",
        "last_name": "Dupont",
        "email": f"alice_{uuid4()}@example.com",
        "password": "SecurePass123!"
    }

@pytest.fixture
def create_test_caregiver(client, sample_caregiver_data):
    def _create():
        response = client.post("/api/auth/register", json=sample_caregiver_data)
        data = response.json()
        return data, sample_caregiver_data["password"]
    return _create
```

### Écriture des tests — Organisés en classes

```python
# app/test/test_authentication_api.py
class TestRegisterEndpoint:
    """Tests for POST /api/auth/register"""

    def test_register_success(self, client, sample_caregiver_data):
        response = client.post("/api/auth/register", json=sample_caregiver_data)

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["email"] == sample_caregiver_data["email"]
        assert "password" not in data      # jamais exposé dans la réponse

    def test_register_duplicate_email(self, client, create_test_caregiver):
        caregiver, _ = create_test_caregiver()

        response = client.post("/api/auth/register", json={
            "first_name": "Other",
            "last_name": "Person",
            "email": caregiver["email"],   # même email → 400
            "password": "OtherPass123!"
        })

        assert response.status_code == 400

    def test_register_weak_password(self, client, sample_caregiver_data):
        """Plusieurs mots de passe faibles → tous refusés."""
        for weak_pass in ["short", "nouppercase123!", "NOLOWER123!", "NoNumber!"]:
            data = sample_caregiver_data.copy()
            data["password"] = weak_pass
            response = client.post("/api/auth/register", json=data)
            assert response.status_code in [400, 422]
```

### Lancer les tests

```bash
# Depuis le dossier backend/
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/mnesya_test pytest

# Avec couverture
pytest --cov=app --cov-report=html
```

### Concepts clés

| Concept                | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `@pytest.fixture`      | Ressource partagée entre tests (DB, client HTTP)           |
| `scope="function"`     | Fixture recréée à chaque test — isolation garantie         |
| `TestClient`           | Client HTTP synchrone généré par FastAPI/Starlette         |
| `dependency_overrides` | Remplace une dépendance FastAPI par un mock dans les tests |
| `create_all/drop_all`  | Crée/supprime les tables avant/après chaque test           |

---

## 14. Docker & Docker Compose

### Présentation

Docker permet de packager une application et ses dépendances dans un **conteneur** isolé et reproductible. Docker Compose orchestre plusieurs conteneurs.

### Dockerfile backend

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
```

### Services Docker Compose du projet

| Service    | Image                | Rôle                       |
| ---------- | -------------------- | -------------------------- |
| `db`       | `postgres:13-alpine` | Base de données PostgreSQL |
| `backend`  | Dockerfile local     | API FastAPI                |
| `worker`   | Dockerfile local     | Scheduler APScheduler      |
| `frontend` | Dockerfile local     | App Expo/React Native      |
| `pgadmin`  | `dpage/pgadmin4`     | Interface admin DB         |

### Réseau Bridge

```yaml
networks:
  mnesya-network:
    driver: bridge
```

Les conteneurs se parlent par leur **nom de service** (ex: `db`, `backend`) au lieu de `localhost` :

```
DATABASE_URL=postgresql://user:pass@db:5432/mnesya_db
#                                    ^^─── nom du service Docker
```

### Health checks

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
    interval: 5s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    db:
      condition: service_healthy # attend que la DB soit prête
```

### Volumes

```yaml
volumes:
  - ../backend:/app # code source (hot-reload en dev)
  - postgres_data:/var/lib/postgresql/data # persistance des données DB
```

### Commande de démarrage backend

```yaml
command: sh -c "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
```

1. Applique les migrations Alembic
2. Démarre le serveur FastAPI

### Commandes utiles

```bash
# Démarrer tous les services
docker compose up --build

# Voir les logs en temps réel
docker compose logs -f backend
docker compose logs -f worker

# Exécuter une commande dans un conteneur
docker compose exec backend alembic upgrade head
docker compose exec backend pytest

# Stopper et supprimer les conteneurs
docker compose down

# Supprimer aussi les volumes (⚠️ efface les données)
docker compose down -v
```

### Variables d'environnement

Un fichier `.env` (copié depuis `.env.example`) est chargé automatiquement par Docker Compose. Les variables sont référencées avec `${VARIABLE}` dans le `docker-compose.yml` :

```yaml
environment:
  DATABASE_URL: ${DATABASE_URL}
  SECRET_KEY: ${SECRET_KEY}
```

---

## Récapitulatif backend

| Technologie         | Version | Rôle                          |
| ------------------- | ------- | ----------------------------- |
| Python              | 3.11    | Langage                       |
| FastAPI             | 0.104   | Framework REST + OpenAPI      |
| Uvicorn             | 0.24    | Serveur ASGI                  |
| Pydantic            | 2.5     | Validation des données        |
| pydantic-settings   | 2.1     | Configuration via `.env`      |
| SQLAlchemy          | 2.0     | ORM                           |
| Alembic             | 1.12    | Migrations DB                 |
| PostgreSQL          | 13      | Base de données               |
| python-jose         | 3.3     | JWT (création + vérification) |
| passlib + bcrypt    | 1.7     | Hachage mots de passe         |
| APScheduler         | 3.10    | Tâches planifiées (worker)    |
| firebase-admin      | 6.3     | Notifications push FCM        |
| exponent-server-sdk | 2.1     | Notifications push Expo       |
| httpx               | 0.25    | Client HTTP async             |
| pytest              | 7.4     | Framework de tests            |
| pytest-asyncio      | 0.21    | Tests asynchrones             |
| pytest-cov          | 4.1     | Couverture de code            |
| slowapi             | 0.1     | Rate limiting (429)           |
| Docker              | —       | Conteneurisation              |
| Docker Compose      | —       | Orchestration multi-services  |
