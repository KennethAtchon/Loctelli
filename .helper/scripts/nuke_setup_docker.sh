#!/bin/bash

#Load R2 env vars
# set -a
# source ./backend-api/.env
# set +a

# export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
# export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"

# echo "Deleting all objects in R2 bucket: $R2_BUCKET_NAME"
# aws s3 rm s3://$R2_BUCKET_NAME --recursive \
#   --endpoint-url https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com \
#   --no-verify-ssl \
#   --region auto


# Stop Loctelli containers
echo "Stopping Loctelli containers..."
docker stop loctelli_db loctelli_redis loctelli_api loctelli_frontend 2>/dev/null || true

# Remove Loctelli containers
echo "Removing Loctelli containers..."
docker rm -f loctelli_db loctelli_redis loctelli_api loctelli_frontend 2>/dev/null || true

# Remove Loctelli volumes
echo "Removing Loctelli volumes..."
docker volume rm -f loctelli_pgdata loctelli_redisdata 2>/dev/null || true

# Remove Loctelli network
echo "Removing Loctelli network..."
docker network rm loctelli-network 2>/dev/null || true

# Remove Loctelli images
echo "Removing Loctelli images..."
docker rmi -f loctelli-api loctelli-frontend 2>/dev/null || true

# Rebuild and start Loctelli services
echo "Rebuilding and starting Loctelli services..."
sleep 3
docker-compose up --build

