# CLAUDE.md

Guidance for Claude Code (`claude.ai/code`) when working with this repository.

## Project Overview

Full-stack CRM platform with:

* **Backend**: NestJS 11 + Prisma + PostgreSQL + Redis
* **Frontend**: Next.js 15.2.4 + React 19 + TailwindCSS + shadcn/ui
* **Features**: Multi-tenant architecture, AI-powered chat, SMS campaigns, lead management, booking system

## Architecture

* **Database**: PostgreSQL (multi-tenant model with `subAccountId` isolation)
* **Cache**: Redis for performance and background jobs
* **Authentication**: Cookie-based JWT with token refresh
* **API**: Next.js proxy to backend with secure auth

## Docker Development

The project uses Docker Compose to orchestrate the full stack.

**Services:**

* **Database**: PostgreSQL 15 (port 5432) with health checks
* **Cache**: Redis 7 (port 6379) with persistence
* **Backend API**: NestJS service (port 8000)
* **Frontend**: Next.js app (port 3000)

**Commands:**

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d db redis
docker-compose up -d db redis api

# View logs
docker-compose logs -f
docker-compose logs -f api frontend

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build -d

# Reset everything (removes volumes)
docker-compose down -v
```

**Helper Scripts** (`.helper/scripts/`):

```bash
# Quick setup
./.helper/scripts/setup_docker.sh

# Full cleanup and rebuild
./.helper/scripts/nuke_setup_docker.sh
```

**URLs:**

* Frontend: [http://localhost:3000](http://localhost:3000)
* Backend: [http://localhost:8000](http://localhost:8000)
* DB: postgresql://postgres\:password\@localhost:5432/loctelli
* Redis: redis\://localhost:6379

**Default Env:**

* Admin password: `defaultAdmin123!CANTUNA`
* Database credentials: `postgres / password / loctelli`

## Project Structure

### Frontend (`my-app/`)
* **`app/`** - Next.js 15 App Router pages and layouts
  * **`admin/`** - Admin panel pages (auth & main sections)
  * **`api/`** - API routes and proxy endpoints
  * **`auth/`** - Public authentication pages
* **`components/`** - React components organized by feature
  * **`admin/`** - Admin-specific components
  * **`ui/`** - Reusable UI components (shadcn/ui)
  * **`customUI/`** - Custom data tables and utilities
* **`lib/`** - Utilities and API client
  * **`api/`** - API client and endpoint definitions
* **`contexts/`** - React context providers (auth, theme, filters)

### Backend (`backend-api/`)
* **`src/main-app/`** - Main application modules
  * **`modules/`** - Core business modules (leads, chat, bookings, etc.)
  * **`integrations/`** - External service integrations (GHL, webhooks)
  * **`infrastructure/`** - Core infrastructure (cache, config, middleware)
* **`src/shared/`** - Shared services and utilities
  * **`auth/`** - Authentication services and guards
  * **`job-queue/`** - Background job processing
  * **`sms/`** - SMS campaign services
  * **`storage/`** - File storage (R2/S3)
* **`prisma/`** - Database schema and migrations

### Helper Scripts (`.helper/`)
* **`scripts/`** - Docker setup and utility scripts
