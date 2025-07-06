#!/bin/bash

# Stop all running containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm -f $(docker ps -aq)

# Remove all volumes
docker volume rm -f $(docker volume ls -q)

# Remove all images
docker rmi -f $(docker images -q)

# Repopagrate docker
sleep 3
docker-compose up --build

