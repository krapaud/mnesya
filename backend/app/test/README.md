# Tests API Mnesya Backend

Suite complète de tests pour tous les endpoints de l'API Mnesya.

## Structure des Tests

Les tests sont organisés par API dans des fichiers séparés :

```
backend/app/test/
├── __init__.py                      # Package marker
├── conftest.py                      # Fixtures partagées et configuration pytest
├── test_authentication_api.py       # Tests pour /api/auth
├── test_caregiver_api.py           # Tests pour /api/caregivers
├── test_user_api.py                # Tests pour /api/users
├── test_pairing_api.py             # Tests pour /api/pairing
├── test_reminder_api.py            # Tests pour /api/reminder
├── test_reminder_status_api.py     # Tests pour /api/reminder-status
└── test.py                         # Tests existants (modèles, schemas, etc.)
```

## APIs Testées

### 1. Authentication API (`/api/auth`)
- **POST /register** - Inscription d'un nouveau caregiver
- **POST /login** - Connexion avec email/password
- **GET /me** - Obtenir le profil du caregiver actuel
- **POST /logout** - Déconnexion
- **POST /refresh** - Rafraîchir le token JWT

### 2. Caregiver API (`/api/caregivers`)
- **PUT /me** - Mettre à jour le profil du caregiver
- **DELETE /me** - Supprimer le compte caregiver

### 3. User API (`/api/users`)
- **POST /** - Créer un nouveau profil utilisateur
- **GET /** - Obtenir tous les profils du caregiver
- **GET /{profile_id}** - Obtenir un profil spécifique
- **PUT /{profile_id}** - Mettre à jour un profil
- **DELETE /{profile_id}** - Supprimer un profil

### 4. Pairing API (`/api/pairing`)
- **POST /generate** - Générer un code de jumelage
- **POST /verify** - Vérifier un code de jumelage

### 5. Reminder API (`/api/reminder`)
- **POST /** - Créer un nouveau reminder
- **GET /caregiver** - Obtenir tous les reminders du caregiver
- **GET /user** - Obtenir tous les reminders de l'utilisateur
- **GET /{reminder_id}** - Obtenir un reminder spécifique
- **PUT /{reminder_id}** - Mettre à jour un reminder
- **DELETE /{reminder_id}** - Supprimer un reminder

### 6. Reminder Status API (`/api/reminder-status`)
- **GET /{reminder_id}/current** - Obtenir le statut actuel d'un reminder
- **GET /{reminder_id}/history** - Obtenir l'historique des statuts d'un reminder
- **PUT /{reminder_id}** - Mettre à jour le statut d'un reminder
- **GET /valid-statuses** - Obtenir la liste des statuts valides

## Exécuter les Tests

### Tous les tests
```bash
docker exec mnesya-backend pytest app/test/
```

### Tests d'une API spécifique
```bash
# Tests d'authentification
docker exec mnesya-backend pytest app/test/test_authentication_api.py

# Tests caregiver
docker exec mnesya-backend pytest app/test/test_caregiver_api.py

# Tests user
docker exec mnesya-backend pytest app/test/test_user_api.py

# Tests pairing
docker exec mnesya-backend pytest app/test/test_pairing_api.py

# Tests reminder
docker exec mnesya-backend pytest app/test/test_reminder_api.py

# Tests reminder status
docker exec mnesya-backend pytest app/test/test_reminder_status_api.py
```

### Tests d'une classe spécifique
```bash
docker exec mnesya-backend pytest app/test/test_authentication_api.py::TestLoginEndpoint
```

### Un test spécifique
```bash
docker exec mnesya-backend pytest app/test/test_authentication_api.py::TestLoginEndpoint::test_login_success
```

### Avec verbose et affichage des print
```bash
docker exec mnesya-backend pytest app/test/ -v -s
```

### Avec coverage
```bash
docker exec mnesya-backend pytest app/test/ --cov=app --cov-report=html
```

## Fixtures Disponibles

Les fixtures suivantes sont disponibles dans tous les tests (définies dans `conftest.py`) :

### `client`
Client de test FastAPI avec base de données de test

### `db_session`
Session de base de données de test (nettoyée après chaque test)

### `authenticated_client`
Client avec authentication JWT valide
Retourne: `(client, caregiver)`

### `sample_caregiver_data`
Données d'exemple pour créer un caregiver

### `sample_user_data`
Données d'exemple pour créer un utilisateur

### `create_test_caregiver`
Factory pour créer des caregivers de test
Usage: `caregiver, password = create_test_caregiver()`

### `create_test_user`
Factory pour créer des utilisateurs de test
Usage: `user = create_test_user(caregiver_id)`

### `create_test_reminder`
Factory pour créer des reminders de test
Usage: `reminder = create_test_reminder(caregiver_id, user_id, scheduled_at)`

### `sample_reminder_data`
Données d'exemple pour créer un reminder

## Couverture des Tests

Chaque endpoint est testé pour :

✅ **Cas de succès** - Le chemin heureux fonctionne
✅ **Authentification** - Échoue sans token/avec token invalide
✅ **Authorization** - Empêche l'accès aux ressources d'autres utilisateurs
✅ **Validation** - Rejette les données invalides
✅ **Cas limites** - Gère les cas particuliers (expired, used, etc.)
✅ **Erreurs** - Retourne les codes HTTP appropriés

## Conventions de Test

- Chaque classe de test correspond à un endpoint
- Noms de test descriptifs : `test_<action>_<scenario>`
- Assertions claires avec messages d'erreur explicites
- Cleanup automatique via fixtures
- Isolation complète entre les tests

## Dépendances

Les tests requièrent :
- pytest
- fastapi[test]
- sqlalchemy
- passlib
- jose[cryptography]

Installées via `requirements.txt` du backend.

## Base de Données de Test

Les tests utilisent une base de données PostgreSQL séparée :
- URL: `postgresql://mnesya_user:mnesya_password@db:5432/mnesya_test_db`
- Créée et nettoyée automatiquement pour chaque test
- Isolation complète de la base de production

## Exemple d'Utilisation

```python
def test_my_feature(authenticated_client, sample_user_data):
    """Test d'une nouvelle fonctionnalité."""
    client, caregiver = authenticated_client
    
    # Créer un utilisateur
    response = client.post("/api/users", json=sample_user_data)
    assert response.status_code == 200
    
    user_id = response.json()["user"]["id"]
    
    # Tester la fonctionnalité
    response = client.get(f"/api/users/{user_id}")
    assert response.status_code == 200
```

## CI/CD

Les tests peuvent être intégrés dans un pipeline CI/CD :

```yaml
test:
  script:
    - docker-compose up -d
    - docker exec mnesya-backend pytest app/test/ --cov=app
```
