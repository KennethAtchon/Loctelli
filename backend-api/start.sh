#!/bin/bash

# Exit on any error (but allow migration failures to be handled)
set -e

echo "Starting application with automatic migrations..."

# Run database migrations with retry logic
echo "Running database migrations..."
MAX_MIGRATION_RETRIES=10
MIGRATION_RETRY_DELAY=1

for attempt in $(seq 1 $MAX_MIGRATION_RETRIES); do
  if npx prisma migrate deploy; then
    echo "Database migrations completed successfully"
    break
  else
    if [ $attempt -eq $MAX_MIGRATION_RETRIES ]; then
      echo "ERROR: Failed to run migrations after $MAX_MIGRATION_RETRIES attempts"
      echo "The application will start anyway and PrismaService will handle migrations"
    else
      echo "Migration attempt $attempt failed, retrying in $MIGRATION_RETRY_DELAY seconds..."
      sleep $MIGRATION_RETRY_DELAY * $attempt
    fi
  fi
done

# Generate Prisma client (in case it's not already generated)
echo "Generating Prisma client..."
npx prisma generate || echo "WARNING: Prisma generate failed, but continuing..."

# Run database seeding (non-blocking)
echo "Running database seeding..."
node prisma/seed.js || echo "WARNING: Database seeding failed, but continuing..."

# Start the application
echo "Starting NestJS application..."
echo "The application will automatically wait for database and Redis connections..."
exec node dist/src/core/main