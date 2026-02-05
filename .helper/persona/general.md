# CLAUDE.md

Guidance for Claude Code (`claude.ai/code`) when working with this repository.

## Project Overview

Full-stack CRM platform with:

* **Backend**: NestJS 11 + Prisma + PostgreSQL + Redis
* **Frontend**: Next.js 15.2.4 + React 19 + TailwindCSS + shadcn/ui
* **Features**: Multi-tenant architecture, AI-powered chat, SMS campaigns, lead management, booking system

## Development Tools

* **Package Manager**: Bun (replaces npm)
* **Runtime**: Bun (replaces Node.js)
* **Test Runner**: Bun test (replaces Jest)
* **TypeScript**: Native Bun support (replaces ts-node/tsx)

**Commands:**
```bash
# Install dependencies
bun install

# Run scripts
bun run <script>

# Run tests
bun test

# Run TypeScript directly
bun script.ts
```

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
# Quick Docker setup
./.helper/scripts/setup_docker.sh

# Full cleanup and rebuild (removes containers, volumes, images)
./.helper/scripts/nuke_setup_docker.sh

# Build both backend and frontend
./.helper/scripts/build-all.sh

# Standard build (instead of build:all)
./.helper/scripts/build-all.sh --build
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

### Frontend (`frontend/`)
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

### Helper Directory (`.helper/`)
The `.helper/` directory contains development utilities, architecture documentation, and planning documents.

* **`scripts/`** - Development and deployment utility scripts
  * **`setup_docker.sh`** - Quick Docker setup for development
  * **`nuke_setup_docker.sh`** - Full cleanup and rebuild of Docker containers/volumes
  * **`build-all.sh`** - Build both backend and frontend projects (supports `--build` flag for standard build)
* **`architecture/`** - Comprehensive architecture documentation
  * **`README.md`** - Architecture documentation index and quick start guide
  * **`00-overview.md`** - Complete platform architecture overview
  * **`01-authentication.md`** - Authentication & authorization architecture
  * **`02-ai-chatbot.md`** - AI chatbot architecture and prompt engineering
  * **`03-multi-tenant.md`** - Multi-tenant architecture and data isolation
  * **`04-sms-campaigns.md`** - SMS campaigns architecture
  * **`05-lead-management.md`** - Lead management architecture
  * **`06-booking-system.md`** - Booking system architecture
  * **`07-integrations.md`** - External integrations architecture
  * **`GHL_INTEGRATION_GUIDE.md`** - GoHighLevel integration guide
  * **`GHL_INTEGRATION_DEEP_DIVE.md`** - Deep dive into GHL integration details
* **`plan/`** - Planning documents and migration plans
  * **`TODO.md`** - Current TODO items and feature requests
  * **`auth-refactor-plan.md`** - Authentication refactoring plans
  * **`booking_system_improvement_plan.md`** - Booking system improvements
  * **`prisma-to-convex-migration-analysis.md`** - Database migration analysis
  * **`PROMPT_SYSTEM_ARCHITECTURE.md`** - Prompt system architecture documentation
* **`output/`** - Generated files and outputs from scripts/tools

## Additional Documentation

For detailed architecture documentation, see:
* **`.helper/architecture/README.md`** - Start here for architecture overview and navigation
* **`.helper/architecture/00-overview.md`** - Complete system architecture overview
* **`AI_CONTEXT.md`** - Comprehensive AI context for the system (includes integration status, security architecture, and data flow)

For planning and migration documents, see:
* **`.helper/plan/`** - Planning documents, TODO items, and migration analyses
