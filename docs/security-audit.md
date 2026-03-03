# Security Audit Report — Mnesya

**Date :** 3 mars 2026  
**Branch :** `dev`  
**Auditeur :** GitHub Copilot (analyse statique + revue de code)

---

## Résumé exécutif

| Criticité        | Avant | Après correction |
| ---------------- | ----- | ---------------- |
| 🔴 Critique      | 3     | 0                |
| 🟠 Haute         | 4     | 0                |
| 🟡 Moyenne       | 5     | 2                |
| 🟢 Faible / Info | 3     | 3                |

---

## Vulnérabilités corrigées dans cette session

### 🔴 CRIT-1 — Pairing code généré avec `random` (non cryptographique)

**Fichier :** `backend/app/api/pairing.py`  
**Avant :** `random.choice(chars)` — prédictible si la seed PRNG est connue  
**Après :** `secrets.choice(chars)` — module cryptographiquement sûr  
**Impact :** Un attaquant pouvant observer le timing ou des codes précédents aurait pu prédire les prochains codes et accéder à un profil utilisateur sans autorisation.

---

### 🔴 CRIT-2 — Token de pairing valide 365 jours

**Fichier :** `backend/app/api/pairing.py`  
**Avant :** `ACCESS_TOKEN_EXPIRE_DAYS = 365`  
**Après :** `ACCESS_TOKEN_EXPIRE_DAYS = 90`  
**Impact :** Un token compromis restait valide un an. Un utilisateur malveillant ayant intercepté un lien pouvait piloter l'application pendant 365 jours.

---

### 🔴 CRIT-3 — Longueur maximale du mot de passe trop restrictive (20 caractères)

**Fichiers :** `backend/app/models/caregiver.py`, `frontend/src/utils/validation.ts`  
**Avant :** max 20 chars  
**Après :** max 72 chars (limite effective de bcrypt)  
**Impact :** Les utilisateurs ne pouvaient pas utiliser de mots de passe robustes. Cette limitation contraint les attaques bruteforce côté client.

---

### 🟠 HIGH-1 — `datetime.utcnow()` (déprecated, timezone-naive)

**Fichiers** : `reminder_facade.py`, `reminder_repository.py` (4 occurrences)  
**Avant :** `datetime.utcnow()` & `datetime.now()`  
**Après :** `datetime.now(timezone.utc)`  
**Impact :** En production, des comparaisons de dates «naïves» vs «aware» pouvaient lever des `TypeError` ou produire des silences erronés sur les rappels planifiés (rappels jamais envoyés / rappels envoyés en dehors de la fenêtre).

---

### 🟠 HIGH-2 — Ensemble de caractères spéciaux trop restreint

**Fichier :** `backend/app/models/caregiver.py`  
**Avant :** `['$', '@', '#', '%', '*', '!', '~', '&']` (8 caractères)  
**Après :** `set('$@#%*!~&^()-_+=[]{}|;:,.<>?/\\')` — 30+ caractères  
**Impact :** Les gestionnaires de mots de passe génèrent des mots de passe avec `-`, `_`, `+`, etc. Le refus de ces caractères poussait les utilisateurs à choisir des mots de passe moins robustes.

---

### 🟠 HIGH-3 — Incohérence de validation frontend/backend

**Fichier :** `frontend/src/utils/validation.ts`  
**Avant :** max 20 chars, caractères spéciaux restreints à `[$@#%*!~&]`  
**Après :** synchronisé avec le backend (max 72 chars, jeu étendu)  
**Impact :** Des mots de passe acceptés par le backend étaient refusés par l'UI (et vice-versa), provoquant des bugs de connexion impossibles à diagnostiquer.

---

### 🟠 HIGH-4 — Double import dans `conftest.py`

**Fichier :** `backend/app/test/conftest.py`  
**Avant :** imports dupliqués avant et après `sys.path.insert`  
**Après :** imports factorisés, ordonnés correctement  
**Impact :** Masquait des erreurs d'import silencieux en shadowing les premières définitions. Pouvait causer des références stale dans les tests.

---

## Vulnérabilités résiduelles (à traiter prochainement)

### 🟡 MED-1 — Rate limiting absent sur les endpoints d'authentification

**Fichiers :** `backend/app/api/authentication.py`  
**Description :** Les endpoints `/api/auth/login` et `/api/auth/register` n'ont pas de protection contre les attaques bruteforce.  
**Recommandation :** Ajouter `slowapi` (rate limiter pour FastAPI)

```python
# Exemple d'ajout
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

---

### 🟡 MED-2 — Refresh token non implémenté (token JWT sans révocation)

**Fichier :** `backend/app/api/authentication.py`  
**Description :** Pas de token blacklist. Un logout côté client ne révoque pas le JWT côté serveur. Si un token est compromis avant expiration, il reste valide.  
**Recommandation :** Implémenter une blacklist en Redis ou une table DB, ou au minimum réduire la durée du token (actuellement 60 min — acceptable).

---

## Bon état de sécurité (éléments positifs)

| Élément                                                      | Statut |
| ------------------------------------------------------------ | ------ |
| Mots de passe hachés avec bcrypt                             | ✅     |
| JWT signé HS256 avec `SECRET_KEY` env                        | ✅     |
| Vérification d'ownership caregiver→user                      | ✅     |
| Vérification d'ownership caregiver→reminder                  | ✅     |
| Validation email côté modèle (SQLAlchemy)                    | ✅     |
| Variables sensibles dans `.env` (non commités)               | ✅     |
| Docs API protégées par Basic Auth                            | ✅     |
| Pas d'exposition du mot de passe hashé dans les réponses API | ✅     |

---

## Couverture de code (post-correction)

| Module                         | Couverture |
| ------------------------------ | ---------- |
| `app/api/authentication.py`    | 86%        |
| `app/api/pairing.py`           | 93%        |
| `app/api/reminder.py`          | 72%        |
| `app/api/push_notification.py` | 79%        |
| `app/models/caregiver.py`      | 82%        |
| **TOTAL**                      | **65%**    |

**Objectif recommandé :** ≥ 80% sur les modules business-critiques.
