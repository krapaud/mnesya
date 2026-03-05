# Cours Backend — Projet Mnesya (Q&R)

> Format questions/réponses pour révision orale.

---

## Table des matières

- [Cours Backend — Projet Mnesya (Q\&R)](#cours-backend--projet-mnesya-qr)
  - [Table des matières](#table-des-matières)
  - [1. Architecture globale](#1-architecture-globale)
  - [2. Python \& typage](#2-python--typage)
  - [3. FastAPI](#3-fastapi)
  - [4. Pydantic](#4-pydantic)
  - [5. SQLAlchemy (ORM)](#5-sqlalchemy-orm)
  - [6. Alembic (migrations)](#6-alembic-migrations)
  - [7. PostgreSQL](#7-postgresql)
  - [8. Authentification JWT](#8-authentification-jwt)
  - [9. Hachage de mots de passe — Passlib \& Bcrypt](#9-hachage-de-mots-de-passe--passlib--bcrypt)
  - [10. APScheduler (worker de rappels)](#10-apscheduler-worker-de-rappels)
  - [11. Notifications push — Firebase \& Expo SDK (serveur)](#11-notifications-push--firebase--expo-sdk-serveur)
  - [12. Patterns architecturaux : Repository \& Facade](#12-patterns-architecturaux--repository--facade)
  - [13. Tests — Pytest](#13-tests--pytest)
  - [14. Docker \& Docker Compose](#14-docker--docker-compose)
  - [Récapitulatif — technologies et rôles](#récapitulatif--technologies-et-rôles)

---

## 1. Architecture globale

**Quelle est l'architecture globale du projet ?**
Architecture **client-serveur en 3 couches** : l'application mobile (React Native + Expo) communique en HTTP/REST Axios avec le backend FastAPI, qui lui-même communique avec PostgreSQL via SQLAlchemy ORM. Tous les services tournent dans des **conteneurs Docker** sur un réseau Bridge.

**Citez les entités métier du domaine.**

- **Caregiver** : aidant (tuteur) qui crée les rappels
- **User** (patient) : personne qui reçoit les rappels
- **Pairing** : liaison caregiver ↔ patient via un code à 6 chiffres
- **Reminder** : rappel de médicament avec heure, fréquence et statut
- **PushToken** : jeton de notification push lié à un appareil

**Quel est le rôle de chaque dossier dans `app/` ?**

- `api/` : endpoints FastAPI (routeurs HTTP)
- `models/` : modèles SQLAlchemy (tables DB)
- `schemas/` : modèles Pydantic (validation des données)
- `persistence/` : repositories (accès à la base de données)
- `services/` : facades (logique métier)

---

## 2. Python & typage

**Quels concepts Python sont utilisés dans le projet ?**

- **Type hints** : toutes les fonctions sont annotées (`str`, `Optional[str]`, `list[...]`) pour la lisibilité et la vérification statique
- **`datetime` / `timezone`** : gestion des dates en UTC pour les JWT et les rappels
- **`Optional` / `Union`** : types nullable dans les schémas Pydantic
- **`Generic[T]`** : rend le `BaseRepository` réutilisable pour toutes les entités

**Pourquoi utiliser `datetime.now(timezone.utc)` et non `datetime.utcnow()` ?**
`datetime.utcnow()` est déprécié depuis Python 3.12. Il retourne une date naïve (sans fuseau horaire), ce qui peut causer des bugs de comparaison. `datetime.now(timezone.utc)` retourne une date aware (avec timezone) et est la méthode recommandée.

**Qu'est-ce qu'un générateur Python (`yield`) et comment est-il utilisé ici ?**
Un générateur est une fonction qui produit des valeurs à la demande et peut reprendre son exécution après un `yield`. Dans le projet, `get_db()` utilise `yield` pour fournir une session DB à FastAPI : après la requête, le bloc `finally` est automatiquement exécuté pour fermer la session, même en cas d'erreur.

**Qu'est-ce que `Generic[T]` dans `BaseRepository` ?**
Un paramètre de type générique qui permet d'écrire une classe réutilisable pour n'importe quel modèle. `BaseRepository[UserModel]`, `BaseRepository[ReminderModel]`… partagent la même logique CRUD sans duplication.

---

## 3. FastAPI

**Qu'est-ce que FastAPI ?**
Un framework web Python moderne basé sur **ASGI** (Asynchronous Server Gateway Interface). Il génère automatiquement une documentation OpenAPI interactive (Swagger UI sur `/docs`) à partir des annotations Python.

**Qu'est-ce qu'un `APIRouter` et pourquoi l'utiliser ?**
Un sous-routeur qui regroupe les endpoints d'un domaine métier. Chaque fichier dans `api/` déclare son propre `APIRouter` avec un `prefix` (ex. `/api/auth`) et des `tags`. Ils sont tous montés dans `main.py` via `app.include_router(...)`. Cela structure le code et permet de séparer les responsabilités.

**Qu'est-ce que l'injection de dépendances (`Depends`) ?**
Un mécanisme déclaratif de FastAPI qui résout automatiquement les dépendances d'un endpoint avant de l'exécuter. Exemple : `Depends(get_db)` injecte une session DB, `Depends(get_caregiver_facade)` injecte une façade prête à l'emploi. Le graphe de dépendances est résolu à chaque requête.

**Quels codes de statut HTTP utilise-t-on dans le projet ?**

- `201 Created` : création réussie (POST)
- `200 OK` : lecture réussie (GET)
- `204 No Content` : suppression réussie (DELETE)
- `400 Bad Request` : données invalides ou règle métier violée
- `401 Unauthorized` : token absent ou invalide
- `404 Not Found` : ressource introuvable
- `429 Too Many Requests` : limite de taux dépassée (rate limiting SlowAPI)

**Comment sécurise-t-on les endpoints avec le JWT ?**
Via `HTTPBearer` de FastAPI Security. Chaque endpoint protégé déclare `Depends(verify_token)`. `HTTPBearer` extrait le token du header `Authorization: Bearer <token>`, la fonction `verify_token` le décode et retourne le payload. Si le token est absent ou invalide, FastAPI lève automatiquement une `HTTPException 401`.

**Qu'est-ce qu'Uvicorn et son option `--reload` ?**
Uvicorn est le serveur ASGI qui exécute l'application FastAPI. `--reload` surveille les fichiers sources et redémarre automatiquement le serveur à chaque modification — utilisé uniquement en développement.

**Qu'est-ce que le rate limiting et comment est-il implémenté dans le projet ?**
Le rate limiting consiste à limiter le nombre de requêtes qu'un client peut envoyer dans un intervalle de temps. Le projet utilise **SlowAPI**, une adaptation de Flask-Limiter pour FastAPI. Les endpoints sensibles sont protégés : inscription (3/min), connexion (5/min). Quand la limite est dépassée, FastAPI retourne **`429 Too Many Requests`** automatiquement. En mode test, la `key_func` retourne un UUID unique par requête pour bypasser le rate limit.

**Pourquoi bypasser le rate limiting dans les tests ?**
Les tests font de nombreuses requêtes rapides en automate. Sans bypass, ils déclencheraient des `429` et échoueraient aléatoirement. La variable d'environnement `TESTING=true` active la `_limiter_key_func` qui génère un UUID unique par requête — chaque requête a donc son propre compteur, jamais atteint.

---

## 4. Pydantic

**Qu'est-ce que Pydantic et à quoi sert-il dans FastAPI ?**
Bibliothèque de **validation de données**. Tous les corps de requête et réponses des endpoints sont des modèles Pydantic (`BaseModel`). FastAPI les utilise pour valider automatiquement les données entrantes et sérialiser les données sortantes.

**Comment valide-t-on un champ avec Pydantic v2 ?**
Avec le décorateur `@field_validator("nom_du_champ")` sur une méthode de classe. La méthode reçoit la valeur, peut la transformer ou lever une `ValueError` si elle est invalide.

**Qu'est-ce que `model_config = ConfigDict(from_attributes=True)` ?**
C'est le remplacement de l'ancien `orm_mode = True` de Pydantic v1. Il permet à Pydantic de lire les attributs d'un objet SQLAlchemy (via ses `@property`) plutôt que d'un dictionnaire. Sans ça, la conversion ORM → schéma de réponse est impossible.

**Qu'est-ce que Pydantic Settings ?**
Une extension (`pydantic-settings`) qui lit les variables d'environnement (ou un fichier `.env`) et les mappe directement sur les attributs d'une classe `BaseSettings`. Cela centralise toute la configuration de l'app et garantit que les variables obligatoires sont présentes au démarrage.

**Pourquoi distinguer un schéma de création et un schéma de réponse ?**

- Le schéma de **création** (`ReminderCreate`) ne contient que les champs fournis par le client — pas d'`id` ni de `created_at` (générés par le serveur).
- Le schéma de **réponse** (`ReminderResponse`) contient tout ce qu'on veut exposer au client, y compris l'`id` et les timestamps. Cela évite d'exposer accidentellement des champs sensibles (ex. le mot de passe haché).

---

## 5. SQLAlchemy (ORM)

**Qu'est-ce qu'un ORM ? Pourquoi SQLAlchemy ?**
Un ORM (Object-Relational Mapper) traduit des objets Python en requêtes SQL et vice-versa. SQLAlchemy permet d'interagir avec la base via des classes Python sans écrire de SQL brut. Le projet utilise **SQLAlchemy 2.0** avec la syntaxe déclarative classique (`Column`).

**Quel pattern particulier les modèles SQLAlchemy utilisent-ils dans ce projet ?**
Les colonnes sont déclarées **privées** (préfixe `_`) et exposées via des `@property` avec getters et setters. Cela permet d'ajouter de la **validation à la persistance** (ex. refuser une chaîne vide dans un setter) sans dépendre uniquement de Pydantic au niveau de l'API.

**Comment fonctionne le `BaseRepository` pour les opérations CRUD ?**

- `add(entity)` : fait un INSERT, commit, et rafraîchit l'objet. En cas d'erreur, fait un `rollback()` pour annuler la transaction.
- `get(id)` : fait un SELECT filtré sur la colonne `_id`.
- `update(id, data)` : récupère l'entité, parcourt le dictionnaire `data` et appelle `setattr(entity, key, value)` pour chaque champ — ce qui passe par les `@property.setter` et leur validation.
- `delete(id)` : récupère l'entité et appelle `db.delete()`.

**Quelles sont les relations entre les modèles ?**

- `UserModel` possède plusieurs `ReminderModel`, chaque `Reminder` possède plusieurs `ReminderStatusModel`
- `UserModel` possède plusieurs `PushTokenModel`
- `CaregiverModel` possède plusieurs `PairingCodeModel`, chaque `PairingCode` est lié à un `UserModel`

---

## 6. Alembic (migrations)

**Qu'est-ce qu'Alembic et pourquoi l'utiliser ?**
L'outil de **migration de base de données** pour SQLAlchemy. Il génère des scripts Python versionnés qui modifient le schéma de façon incrémentale et **réversible**. Chaque migration a une fonction `upgrade()` (applique le changement) et `downgrade()` (l'annule).

**Citez les commandes essentielles d'Alembic.**

- `alembic revision --autogenerate -m "description"` : génère un script de migration en détectant automatiquement les différences entre les modèles et la DB
- `alembic upgrade head` : applique toutes les migrations non encore appliquées
- `alembic downgrade -1` : annule la dernière migration
- `alembic current` : affiche la révision courante de la DB
- `alembic history` : liste l'historique des migrations

**À quoi sert le fichier `alembic/env.py` ?**
Il connecte Alembic à SQLAlchemy en important `Base.metadata` (la métadonnée de tous les modèles). C'est ce qui permet à `--autogenerate` de détecter les différences entre les modèles Python et le schéma réel de la base.

**Quel est le workflow au démarrage du conteneur backend ?**
`alembic upgrade head` est exécuté avant `uvicorn` : cela garantit que la base de données est toujours à jour avec le code avant que l'API commence à traiter des requêtes.

---

## 7. PostgreSQL

**Quels types PostgreSQL spécifiques utilise-t-on dans le projet ?**

| Type SQLAlchemy           | Type PG         | Usage                                             |
| ------------------------- | --------------- | ------------------------------------------------- |
| `UUID(as_uuid=True)`      | `uuid`          | Clés primaires de toutes les entités              |
| `DateTime(timezone=True)` | `timestamptz`   | `created_at`, `scheduled_time`                    |
| `Enum`                    | `enum` natif PG | Statut des rappels (`pending`, `taken`, `missed`) |
| `String(n)`               | `varchar(n)`    | Noms, emails, titres                              |
| `Boolean`                 | `boolean`       | `is_active`                                       |

**Pourquoi utiliser des UUID comme clés primaires plutôt que des entiers auto-incrémentés ?**

- **Pas de collision** lors de fusions de bases de données
- **ID non prédictible** : un attaquant ne peut pas deviner les IDs des autres utilisateurs
- **Génération possible côté client** : l'ID peut être créé avant même l'insertion en base

**Qu'est-ce que pgAdmin et comment y accède-t-on ?**
Une interface web d'administration PostgreSQL incluse dans Docker Compose. Elle est accessible à `http://localhost:5050` et permet de visualiser les tables, exécuter des requêtes SQL et inspecter les données.

---

## 8. Authentification JWT

**Qu'est-ce qu'un JWT ?**
JSON Web Token — un standard ouvert (RFC 7519) pour transmettre des informations vérifiables entre parties. Il est composé de 3 parties encodées en Base64 séparées par des points : **Header** (algorithme), **Payload** (données), **Signature** (HMAC-SHA256 du header+payload avec la `SECRET_KEY`).

**Quels claims contient le payload du JWT dans ce projet ?**

- `sub` (Subject) : identifiant de l'aidant (caregiver_id)
- `email` : email de l'aidant
- `exp` (Expiration) : timestamp Unix d'expiration
- `iat` (Issued At) : timestamp Unix de création

**Quel est le flux d'authentification complet ?**

1. Le client envoie `POST /api/auth/login` avec `{ email, password }`
2. Le serveur cherche le caregiver par email, compare le hash bcrypt du mot de passe
3. Si valide, génère un JWT signé avec `sub=caregiver_id` et le renvoie
4. Le client stocke le token et l'attache à chaque requête : `Authorization: Bearer eyJ...`
5. Le serveur décode le JWT, extrait le `sub`, et traite la requête

**Comment le token est-il vérifié à chaque requête ?**
La fonction `verify_token` (injectée via `Depends`) décode le token avec `jwt.decode()`. Si le token est invalide ou expiré, `python-jose` lève une `JWTError` qui est convertie en `HTTPException 401`. Si le claim `sub` est absent, on rejette aussi le token.

**Pourquoi signer le JWT avec une `SECRET_KEY` ?**
La signature garantit que le token n'a pas été modifié côté client. Sans elle, un attaquant pourrait modifier le payload (changer l'`id`) et usurper l'identité d'un autre utilisateur.

---

## 9. Hachage de mots de passe — Passlib & Bcrypt

**Pourquoi ne jamais stocker un mot de passe en clair ?**
Si la base de données est compromise, les mots de passe seraient lisibles directement. On stocke à la place un **hash irréversible** : une empreinte qu'on ne peut pas inverser, générée à partir du mot de passe.

**Qu'est-ce que bcrypt et pourquoi l'utilise-t-on pour les mots de passe ?**
Bcrypt est un algorithme de hachage **intentionnellement lent** (~100 hash/s), conçu pour les mots de passe. Il intègre un **salt** aléatoire (évite les attaques par table arc-en-ciel) et un **facteur de coût** ajustable. Sa lenteur est une fonctionnalité : elle rend les attaques par force brute impraticables même avec un GPU.

**Pourquoi bcrypt et pas SHA-256 ?**
SHA-256 est très rapide (~1 milliard de hash/s) — idéal pour l'intégrité de fichiers mais catastrophique pour les mots de passe car un attaquant peut tester des millions de combinaisons par seconde. Bcrypt (~100/s) rend cette attaque économiquement inviable.

**Comment utilise-t-on Passlib dans le projet ?**
Via `CryptContext(schemes=["bcrypt"])`. Deux opérations :

- `pwd_context.hash(password)` : à l'inscription, hache le mot de passe avant de le stocker
- `pwd_context.verify(password, hashed)` : à la connexion, compare en **temps constant** (évite les attaques temporelles) le mot de passe fourni avec le hash stocké

**Qu'est-ce qu'un salt et pourquoi est-il important ?**
Une valeur aléatoire ajoutée au mot de passe avant le hachage. Même si deux utilisateurs ont le même mot de passe, leurs hashes seront différents. Cela rend inutilisables les **tables arc-en-ciel** (dictionnaires de hashes précalculés).

---

## 10. APScheduler (worker de rappels)

**Qu'est-ce qu'APScheduler et quel est son rôle dans le projet ?**
APScheduler (Advanced Python Scheduler) exécute des tâches planifiées dans un processus Python. Dans le projet, il tourne dans un **conteneur Docker séparé** (`worker`) et est chargé d'envoyer les notifications push aux moments prévus.

**Quels jobs sont enregistrés et à quelle fréquence ?**
Trois jobs, chacun exécuté **toutes les 60 secondes** :

1. `send_user_notifications` : envoie les notifications initiales pour les rappels à T+0
2. `send_user_retry` : renvoie si l'utilisateur n'a pas répondu (T+5 min)
3. `send_caregiver_escalations` : alerte l'aidant si toujours pas de réponse (T+10 min)

**Pourquoi chaque job ouvre-t-il sa propre session DB ?**
Parce que les jobs s'exécutent dans des **threads secondaires**. Une session SQLAlchemy n'est pas thread-safe — la partager entre threads causerait des corruptions de données ou des erreurs de concurrence.

**Quelle est la différence entre `BackgroundScheduler` et `BlockingScheduler` ?**
`BackgroundScheduler` tourne dans un thread daemon sans bloquer le thread principal — c'est celui utilisé ici. `BlockingScheduler` bloque le thread principal jusqu'à interruption — il aurait empêché la boucle `while True` du worker de s'exécuter.

**Pourquoi le worker tourne-t-il dans un conteneur Docker séparé ?**

- **Ne pas bloquer** les requêtes HTTP du backend principal
- **Isoler les crashs** : si le scheduler plante, l'API continue de fonctionner
- **Scaler** les deux services indépendamment selon la charge

---

## 11. Notifications push — Firebase & Expo SDK (serveur)

**Quels sont les deux systèmes de push utilisés côté serveur ?**

- **Firebase Cloud Messaging (FCM)** : envoi direct via Google Firebase vers les appareils Android et iOS
- **Expo Push SDK (`exponent-server-sdk`)** : service intermédiaire d'Expo qui unifie FCM (Android) et APNs (iOS) derrière une seule API

**Quelle est la différence entre FCM et l'Expo Push API ?**
FCM envoie directement via les serveurs Google. L'Expo Push API est une couche d'abstraction : on envoie au serveur Expo qui dispatche ensuite vers FCM ou APNs selon l'appareil. L'avantage d'Expo est de n'avoir qu'une seule intégration côté serveur.

**Comment les tokens push des appareils sont-ils gérés ?**
Chaque appareil enregistré envoie son token Expo au backend via `POST /api/push-tokens`. Ce token est stocké dans la table `push_tokens` en base avec `user_id`, `token`, `locale` et `created_at`. Le worker récupère ces tokens pour chaque rappel à envoyer.

**Pourquoi stocker la `locale` dans le token push ?**
Pour envoyer la notification dans la langue de l'appareil de l'utilisateur. La traduction appropriate (`fr` ou `en`) est sélectionnée à l'envoi selon la `locale` stockée avec le token.

---

## 12. Patterns architecturaux : Repository & Facade

**Qu'est-ce que le pattern Repository ?**
Il abstrait l'accès aux données derrière une interface. Chaque entité a son propre repository héritant de `BaseRepository`. Avantages :

- Centralise toutes les requêtes SQL en un seul endroit
- Le reste de l'application (facades, API) ne connaît pas SQLAlchemy directement
- Facilite les tests : on peut substituer le repository par un mock

**Qu'est-ce que le pattern Facade ?**
Il orchestre plusieurs repositories et porte la **logique métier**. Exemple : `ReminderFacade.create_reminder()` crée un `ReminderModel` via le repository ET crée automatiquement un `ReminderStatusModel` avec le statut `PENDING` — c'est de la logique métier que l'API ne devrait pas gérer directement.

**Quelles sont les 4 couches de l'architecture backend ?**

1. **API** (`app/api/`) : reçoit les requêtes HTTP, valide via Pydantic, délègue à la Facade
2. **Facade** (`app/services/`) : contient la logique métier, orchestre les repositories
3. **Repository** (`app/persistence/`) : exécute les requêtes SQL via SQLAlchemy
4. **Base de données** (PostgreSQL) : stocke les données

**Pourquoi séparer Facade et Repository, plutôt que tout mettre dans l'API ?**
Séparer les responsabilités rend le code **testable**, **maintenable** et **réutilisable**. La logique métier dans la Facade peut être testée indépendamment du HTTP. Le Repository peut être remplacé (ex. pour les tests) sans toucher à la logique métier.

---

## 13. Tests — Pytest

**Quel est le framework de test utilisé et quelle est la particularité de la DB de test ?**
Pytest avec `TestClient` de FastAPI. La particularité : le projet utilise une **vraie base de données PostgreSQL de test** (pas de SQLite en mémoire). L'URL est lue depuis la variable d'environnement `TEST_DATABASE_URL`.

**Comment l'isolation entre tests est-elle garantie ?**
Avant chaque test, `create_all()` crée toutes les tables. Après chaque test, `drop_all()` les supprime. Chaque test repart donc d'une base vide — aucun état partagé entre tests.

**Comment la base de données de test est-elle injectée dans FastAPI ?**
Via `app.dependency_overrides[get_db] = override_get_db`. Cette API de FastAPI permet de remplacer n'importe quelle dépendance par une alternative pour les tests. Ici, `get_db` est remplacée par une version qui retourne la session de test.

**Qu'est-ce qu'une fixture Pytest et à quoi sert `scope="function"` ?**
Une fixture est une ressource partagée déclarée avec `@pytest.fixture`. `scope="function"` (par défaut) signifie qu'elle est **recréée pour chaque test** — garantit l'isolation. D'autres scopes existent : `"module"` (une fois par fichier), `"session"` (une fois pour toute la session).

**Pourquoi les tests sont-ils organisés en classes ?**
Pour regrouper les tests d'un même endpoint dans une classe (ex. `TestRegisterEndpoint`). Cela améliore la lisibilité, permet un setup partagé, et facilite l'exécution d'un groupe de tests ciblé.

**Citez les concepts clés des tests Pytest dans le projet.**

| Concept                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `@pytest.fixture`      | Ressource partagée entre tests (DB, client HTTP)   |
| `scope="function"`     | Fixture recréée à chaque test — isolation garantie |
| `TestClient`           | Client HTTP synchrone de FastAPI/Starlette         |
| `dependency_overrides` | Remplace une dépendance FastAPI par un mock        |
| `create_all/drop_all`  | Crée/supprime les tables avant/après chaque test   |

---

## 14. Docker & Docker Compose

**Qu'est-ce que Docker et Docker Compose ?**
Docker package une application et ses dépendances dans un **conteneur** isolé et reproductible — le même comportement sur toute machine. Docker Compose orchestre **plusieurs conteneurs** qui collaborent, en définissant leurs services, réseaux et volumes dans un fichier YAML.

**Quels services sont définis dans Docker Compose du projet ?**

| Service    | Image                | Rôle                       |
| ---------- | -------------------- | -------------------------- |
| `db`       | `postgres:13-alpine` | Base de données PostgreSQL |
| `backend`  | Dockerfile local     | API FastAPI                |
| `worker`   | Dockerfile local     | Scheduler APScheduler      |
| `frontend` | Dockerfile local     | App Expo/React Native      |
| `pgadmin`  | `dpage/pgadmin4`     | Interface admin DB         |

**Comment les conteneurs communiquent-ils entre eux ?**
Via un **réseau Bridge** interne. Chaque conteneur est joignable par son **nom de service** (ex. `db`, `backend`) plutôt que `localhost`. C'est pourquoi la `DATABASE_URL` utilise `@db:5432` et non `@localhost:5432`.

**Qu'est-ce qu'un health check et à quoi sert `depends_on` ?**
Un health check est une commande ejecutée périodiquement pour vérifier qu'un service est prêt (ex. `pg_isready` pour PostgreSQL). `depends_on` avec `condition: service_healthy` empêche le backend de démarrer avant que la DB soit opérationnelle — évite les erreurs de connexion au démarrage.

**Quelle est la différence entre un volume nommé et un bind mount ?**

- **Bind mount** (`../backend:/app`) : monte un dossier local dans le conteneur — permet le hot-reload en développement
- **Volume nommé** (`postgres_data:/var/lib/...`) : stockage géré par Docker, persiste entre les redémarrages des conteneurs

**Citez les commandes Docker Compose essentielles.**

- `docker compose up --build` : construit les images et démarre tous les services
- `docker compose logs -f backend` : suit les logs en temps réel
- `docker compose exec backend pytest` : exécute une commande dans un conteneur actif
- `docker compose down` : arrête et supprime les conteneurs
- `docker compose down -v` : idem + supprime les volumes (⚠️ efface les données)

---

## Récapitulatif — technologies et rôles

| Technologie         | Rôle                                                |
| ------------------- | --------------------------------------------------- |
| Python 3.11         | Langage                                             |
| FastAPI             | Framework REST + génération OpenAPI                 |
| Uvicorn             | Serveur ASGI                                        |
| Pydantic            | Validation des données entrantes/sortantes          |
| pydantic-settings   | Configuration via variables d'environnement         |
| SQLAlchemy          | ORM (accès base de données)                         |
| Alembic             | Migrations de base de données                       |
| PostgreSQL 13       | Base de données relationnelle                       |
| python-jose         | Création et vérification des JWT                    |
| passlib + bcrypt    | Hachage des mots de passe                           |
| APScheduler         | Tâches planifiées (worker de rappels)               |
| firebase-admin      | Notifications push via FCM                          |
| exponent-server-sdk | Notifications push via Expo Push API                |
| pytest              | Framework de tests                                  |
| pytest-cov          | Couverture de code                                  |
| slowapi             | Rate limiting (protection endpoints sensibles, 429) |
| Docker              | Conteneurisation                                    |
| Docker Compose      | Orchestration multi-services                        |
