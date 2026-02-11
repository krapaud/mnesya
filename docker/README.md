# Démarrer l'environnement complet
cd docker
docker-compose up -d

# Démarrer seulement le backend
docker-compose up -d db backend worker

# Démarrer seulement le frontend
docker-compose up frontend

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Arrêter l'environnement
docker-compose down

# Rebuild après modifications
docker-compose up -d --build

# Accès aux services
# Frontend (Expo): http://localhost:19000
# Backend API: http://localhost:8000
# Base de données: localhost:5432

# Commandes Expo dans le container
docker-compose exec frontend npx expo start --web
docker-compose exec frontend npx expo start --android
docker-compose exec frontend npx expo start --ios
