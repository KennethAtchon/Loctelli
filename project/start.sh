#!/bin/bash

# Exit on any error
set -e

echo "Starting application with automatic migrations..."

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (in case it's not already generated)
echo "Generating Prisma client..."
npx prisma generate

# Start the application
echo "Starting NestJS application..."
echo "The application will automatically wait for database and Redis connections..."
exec node dist/main 