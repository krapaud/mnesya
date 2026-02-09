# start environnement
cd docker
docker-compose up -d

# view logs
docker-compose logs -f backend

# stop environnement
docker-compose down

# Rebuild all modification
docker-compose up -d --build
