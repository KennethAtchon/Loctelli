#!/bin/bash

# Stop all running containers
sleep 1
docker stop $(docker ps -aq)

# Remove all containers
sleep 1
docker rm -f $(docker ps -aq)

# Remove all volumes
sleep 1
docker volume rm -f $(docker volume ls -q)

# Remove all images 
sleep 1
docker rmi -f $(docker images -q)

# Repopagrate docker
sleep 3
docker-compose up --build

