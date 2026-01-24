#!/bin/bash

set -e

echo "Starting application with automatic migrations..."

# Run database migrations with retry logic
echo "Running database migrations..."
MAX_MIGRATION_RETRIES=10
MIGRATION_RETRY_DELAY=1

for attempt in $(seq 1 $MAX_MIGRATION_RETRIES); do
  if bunx prisma migrate deploy; then
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

# Generate Prisma client
echo "Generating Prisma client..."
bunx prisma generate || echo "WARNING: Prisma generate failed, but continuing..."

# Run database seeding (non-blocking)
echo "Running database seeding..."
bun prisma/seed.ts || echo "WARNING: Database seeding failed, but continuing..."

# Start the application
echo "Starting NestJS application..."
echo "The application will automatically wait for database and Redis connections..."
exec bun dist/src/core/main
