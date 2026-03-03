# Performance Testing — Mnesya Backend

Tests de charge avec [Locust](https://locust.io/).

## Prérequis

```bash
pip install locust
```

## Lancement (stack Docker en cours d'exécution)

```bash
cd backend

# 1. Interface web (recommandé)
locust -f performance_tests/locustfile.py --host http://localhost:8000
# Ouvrir http://localhost:8089

# 2. Mode headless (CI/CD)
locust -f performance_tests/locustfile.py \
  --host http://localhost:8000 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 2m \
  --headless \
  --csv=performance_tests/results/run_$(date +%Y%m%d_%H%M%S)
```

## Scénarios recommandés

| Scénario | Users | Spawn rate | Durée  | Objectif             |
| -------- | ----- | ---------- | ------ | -------------------- |
| Smoke    | 5     | 1/s        | 1 min  | Vérification de base |
| Load     | 50    | 5/s        | 5 min  | Trafic normal        |
| Stress   | 200   | 10/s       | 10 min | Point de rupture     |
| Spike    | 0→500 | 100/s      | 2 min  | Résilience           |

## Seuils acceptables (SLA)

| Métrique      | Cible                  |
| ------------- | ---------------------- |
| p50 latence   | < 100 ms               |
| p95 latence   | < 500 ms               |
| p99 latence   | < 1 000 ms             |
| Taux d'erreur | < 1 %                  |
| Throughput    | > 100 req/s (50 users) |

## Classes d'utilisateurs

- **`CaregiverUser`** — parcours complet (auth, rappels, profils, pairing)
- **`HeavyReminderUser`** — stress des endpoints `/api/reminder` uniquement
