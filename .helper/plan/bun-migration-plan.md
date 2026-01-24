# Full Migration Plan: Node.js/pnpm → Bun

This document outlines a comprehensive migration plan to replace Node.js, pnpm, Jest, ts-node, and related tools with Bun across the entire Loctelli project.

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Assessment](#pre-migration-assessment)
3. [Migration Phases](#migration-phases)
4. [Detailed Migration Steps](#detailed-migration-steps)
5. [Testing Strategy](#testing-strategy)
6. [Rollback Plan](#rollback-plan)
7. [Post-Migration Optimization](#post-migration-optimization)

## Overview

### Current Stack
- **Runtime**: Node.js 20
- **Package Manager**: pnpm
- **TypeScript Execution**: ts-node, tsx
- **Testing**: Jest, ts-jest, jest-environment-jsdom
- **Build Tools**: NestJS CLI, Next.js (Turbopack)
- **Docker**: Node.js-based images

### Target Stack
- **Runtime**: Bun (latest stable)
- **Package Manager**: Bun (built-in)
- **TypeScript Execution**: Bun (native)
- **Testing**: Bun test runner
- **Build Tools**: Bun + NestJS CLI, Next.js (Turbopack)
- **Docker**: Bun-based images

### Benefits
- ⚡ Faster package installation (2-3x faster than pnpm)
- ⚡ Faster test execution (native TypeScript, no compilation step)
- ⚡ Faster script execution (native TypeScript support)
- 🎯 Single tool instead of multiple dependencies
- 📦 Smaller Docker images (potentially)
- 🔧 Better TypeScript support out of the box

### Risks & Considerations
- ⚠️ Next.js compatibility (should work, but needs testing)
- ⚠️ NestJS compatibility (should work, but needs testing)
- ⚠️ Native module compatibility (bcrypt, etc. - may need special handling)
- ⚠️ Team familiarity with Bun
- ⚠️ CI/CD pipeline updates required

## Pre-Migration Assessment

### Compatibility Checks

#### ✅ Should Work Out of the Box
- Next.js 15.2.4 (Bun has good Next.js support)
- NestJS 11 (should work, but may need config adjustments)
- Prisma (works with Bun)
- React 19
- TypeScript 5
- Most npm packages

#### ⚠️ Needs Testing/Adjustment
- **bcrypt** (native module) - May need special handling in Docker
- **Jest test suites** - Need migration to Bun test API
- **ts-node scripts** - Need to switch to `bun` command
- **Docker builds** - Need new base images
- **CI/CD** - Need to update build commands

#### ❌ Potential Issues
- Some Jest-specific APIs may need adjustment
- Native modules may need rebuild in Docker
- Some edge-case npm packages may not work

### Current Dependencies to Remove

**Frontend:**
- `jest` → Bun test runner
- `jest-environment-jsdom` → Bun built-in
- `tsx` → Bun native TypeScript
- `@types/jest` → Not needed with Bun

**Backend:**
- `jest` → Bun test runner
- `ts-jest` → Bun native TypeScript
- `ts-node` → Bun native TypeScript
- `@types/jest` → Not needed with Bun

## Migration Phases

### Phase 1: Local Development Setup (Week 1)
**Goal**: Get Bun working locally for development

1. Install Bun on development machines
2. Test package installation
3. Test basic script execution
4. Test development servers
5. Document any issues

### Phase 2: Script Migration (Week 1-2)
**Goal**: Migrate all scripts to use Bun

1. Update package.json scripts
2. Replace ts-node with bun
3. Replace tsx with bun
4. Test all scripts
5. Update helper scripts

### Phase 3: Test Migration (Week 2)
**Goal**: Migrate test suites to Bun test runner

1. Convert Jest tests to Bun test format
2. Update test configurations
3. Fix any test compatibility issues
4. Verify test coverage
5. Update CI/CD test commands

### Phase 4: Docker Migration (Week 2-3)
**Goal**: Update Docker images to use Bun

1. Create Bun-based Dockerfiles
2. Test Docker builds
3. Update docker-compose.yml if needed
4. Test full stack in Docker
5. Update helper scripts

### Phase 5: CI/CD & Documentation (Week 3)
**Goal**: Update all automation and docs

1. Update CI/CD pipelines
2. Update README files
3. Update CLAUDE.md
4. Update helper scripts documentation
5. Create migration guide for team

### Phase 6: Production Deployment (Week 4)
**Goal**: Deploy to production

1. Staging deployment
2. Full testing in staging
3. Production deployment
4. Monitor for issues
5. Performance comparison

## Detailed Migration Steps

### Step 1: Install Bun

```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Or using npm
npm install -g bun

# Verify installation
bun --version
```

### Step 2: Frontend Migration

#### 2.1 Update package.json Scripts

**File**: `frontend/package.json`

```json
{
  "scripts": {
    "dev": "bun run --bun next dev --turbopack",
    "build": "bun run --bun next build",
    "build:all": "bun run format:check && bun run lint && bun run tsc --noEmit && bun run build",
    "start": "bun run --bun next start",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "clean": "rm -rf .next && rm -rf bun.lockb && rm -rf node_modules",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "test:ci": "bun test --coverage",
    "audit:types": "bun scripts/audit-types.ts",
    "tsc": "tsc"
  }
}
```

#### 2.2 Remove Jest Dependencies

```bash
cd frontend
bun remove jest @types/jest jest-environment-jsdom tsx
```

#### 2.3 Convert Jest Tests to Bun Tests

**Before** (`jest.config.js`):
```javascript
const nextJest = require("next/jest");
const createJestConfig = nextJest({ dir: "./" });
module.exports = createJestConfig(customJestConfig);
```

**After** (`bunfig.toml` or inline in test files):
```toml
# bunfig.toml (optional)
[test]
preload = ["./test-setup.ts"]
```

**Test file conversion example**:

**Before** (Jest):
```typescript
import { render, screen } from '@testing-library/react';
import { AuthContext } from '@/contexts/unified-auth-context';

describe('AuthContext', () => {
  it('should render', () => {
    // test code
  });
});
```

**After** (Bun):
```typescript
import { test, expect, describe } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { AuthContext } from '@/contexts/unified-auth-context';

describe('AuthContext', () => {
  test('should render', () => {
    // test code
  });
});
```

#### 2.4 Update Test Setup

**File**: `frontend/jest.setup.js` → `frontend/test-setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect } from 'bun:test';

// Add any global test setup here
```

#### 2.5 Install Dependencies with Bun

```bash
cd frontend
bun install
```

This will:
- Generate `bun.lockb` (binary lockfile)
- Install all dependencies
- Optionally keep `pnpm-lock.yaml` for reference

### Step 3: Backend Migration

#### 3.1 Update package.json Scripts

**File**: `backend-api/package.json`

```json
{
  "scripts": {
    "build": "nest build",
    "build:all": "bun run format:check && bun run lint && bun run tsc --noEmit && bun run build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "bun run --bun nest start",
    "start:dev": "bun run --bun nest start --watch",
    "start:debug": "bun run --bun nest start --debug --watch",
    "start:prod": "bun dist/src/core/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:cov": "bun test --coverage",
    "test:debug": "bun --inspect test",
    "test:e2e": "bun test --test-path-pattern=.e2e-spec.ts$",
    "db:seed": "bun prisma/seed.ts",
    "db:migrate": "prisma migrate deploy",
    "db:migrate:dev": "prisma migrate deploy",
    "db:migrate:reset": "prisma migrate reset",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:reset": "bun scripts/reset-database.ts",
    "audit:dtos": "bun scripts/audit-dtos.ts",
    "clean": "rm -rf dist && rm -rf bun.lockb && rm -rf node_modules",
    "tsc": "tsc"
  }
}
```

#### 3.2 Remove Jest Dependencies

```bash
cd backend-api
bun remove jest @types/jest ts-jest ts-node
```

#### 3.3 Convert Jest Tests to Bun Tests

**Test file conversion**:

**Before** (Jest):
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**After** (Bun):
```typescript
import { test, expect, describe, beforeEach } from 'bun:test';
import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  test('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

#### 3.4 Update E2E Test Configuration

**File**: `backend-api/test/jest-e2e.json` → Remove (Bun uses different config)

Create `backend-api/bunfig.toml`:
```toml
[test]
preload = ["./test/test-setup.ts"]
```

#### 3.5 Update Prisma Seed Script

**File**: `backend-api/prisma/seed.ts`

No changes needed - Bun can execute TypeScript directly. Update `package.json`:
```json
{
  "prisma": {
    "seed": "bun prisma/seed.ts"
  }
}
```

#### 3.6 Update start.sh

**File**: `backend-api/start.sh`

```bash
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
```

#### 3.7 Install Dependencies with Bun

```bash
cd backend-api
bun install
```

### Step 4: Docker Migration

#### 4.1 Backend Dockerfile

**File**: `backend-api/Dockerfile`

```dockerfile
# Multi-stage build for better bcrypt handling
FROM oven/bun:1 AS builder

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install all dependencies (including dev dependencies for building)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Build the application
RUN bun run build

# Compile the seed script (Bun can run TS directly, but for production we compile)
RUN bun build prisma/seed.ts --outdir dist/prisma --target node

# Production stage
FROM oven/bun:1-slim AS production

# Install build dependencies for native modules (bcrypt needs to be rebuilt)
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Install prisma CLI (using bunx)
# Note: bunx is built-in, no need to install globally

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy compiled seed script
COPY --from=builder /app/dist/prisma/seed.js ./prisma/seed.js
COPY --from=builder /app/dist/prisma/seed-data ./prisma/seed-data

# Force reinstall bcrypt to ensure native bindings are built correctly
RUN bun remove bcrypt && bun add bcrypt@^6.0.0

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Start the application with migrations
CMD ["./start.sh"]
```

#### 4.2 Frontend Dockerfile

**File**: `frontend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 build-base g++ make

# Copy package files and install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG

# Build the Next.js app
RUN bun run build

# Stage 2: Production
FROM oven/bun:1-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lockb* ./bun.lockb*

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG

# Expose port
EXPOSE 3000

# Start the app
CMD ["bun", "run", "start"]
```

#### 4.3 Update docker-compose.yml

**File**: `docker-compose.yml`

No changes needed - Docker Compose will use the updated Dockerfiles automatically.

### Step 5: Helper Scripts Migration

#### 5.1 Update build-all.sh

**File**: `.helper/scripts/build-all.sh`

```bash
#!/bin/bash

# Script to run build:all for both backend and frontend
# Usage: ./build-all.sh [--build|-b]
#   --build or -b: Run 'build' instead of 'build:all'

set -e  # Exit on error

# Check if --build or -b flag is passed
BUILD_CMD="build:all"
if [[ "$1" == "--build" ]] || [[ "$1" == "-b" ]]; then
  BUILD_CMD="build"
  echo "🚀 Building projects (standard build)..."
else
  echo "🚀 Building all projects..."
fi
echo ""

# Get the project root directory (parent of .helper)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "📦 Building backend..."
cd "$PROJECT_ROOT/backend-api"
bun run "$BUILD_CMD"

echo ""
echo "📦 Building frontend..."
cd "$PROJECT_ROOT/frontend"
bun run "$BUILD_CMD"

echo ""
echo "✅ All builds completed successfully!"
```

### Step 6: Update Documentation

#### 6.1 Update README.md

**File**: `README.md`

Update Quick Start section:
```markdown
### Prerequisites
- Bun 1.0+ (or Node.js 18+ and npm/pnpm as fallback)
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Loctelli

# Backend setup
cd backend-api
cp .env.example .env
bun install
docker-compose up -d db redis
bun run db:generate
bun run db:migrate

# Frontend setup
cd ../frontend
cp .env.example .env.local
bun install
bun run dev
```

### 3. Testing
```bash
# Backend tests
cd backend-api
bun test              # Unit tests
bun test --coverage   # Coverage report
bun test --test-path-pattern=.e2e-spec.ts$  # E2E tests

# Frontend tests
cd frontend
bun test              # Unit tests
bun test --coverage   # Coverage report
```
```

#### 6.2 Update CLAUDE.md

**File**: `CLAUDE.md`

Add Bun information:
```markdown
## Development Tools

* **Package Manager**: Bun (replaces pnpm/npm)
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
```

#### 6.3 Update Backend README

**File**: `backend-api/README.md`

Update commands:
```markdown
## Compile and run the project

```bash
# development
$ bun run start

# watch mode
$ bun run start:dev

# production mode
$ bun run start:prod
```

## Run tests

```bash
# unit tests
$ bun test

# e2e tests
$ bun test --test-path-pattern=.e2e-spec.ts$

# test coverage
$ bun test --coverage
```
```

## Testing Strategy

### Unit Tests
1. Convert all Jest tests to Bun test format
2. Run test suite: `bun test`
3. Verify coverage: `bun test --coverage`
4. Compare coverage with previous Jest runs

### Integration Tests
1. Convert E2E tests to Bun format
2. Run E2E suite: `bun test --test-path-pattern=.e2e-spec.ts$`
3. Verify all integration points work

### Manual Testing Checklist
- [ ] Frontend development server starts
- [ ] Backend development server starts
- [ ] All API endpoints work
- [ ] Database migrations work
- [ ] Database seeding works
- [ ] Authentication flow works
- [ ] All admin pages load
- [ ] All user pages load
- [ ] Docker build succeeds
- [ ] Docker containers start
- [ ] Full stack works in Docker

### Performance Testing
- [ ] Compare package install times (pnpm vs bun)
- [ ] Compare test execution times (Jest vs Bun)
- [ ] Compare build times
- [ ] Compare startup times
- [ ] Monitor memory usage

## Rollback Plan

### If Migration Fails

1. **Keep Git Branch**: Create a branch before migration starts
   ```bash
   git checkout -b bun-migration
   # Make all changes on this branch
   ```

2. **Keep Lockfiles**: Don't delete `pnpm-lock.yaml` files initially
   ```bash
   # Keep both lockfiles during transition
   git add bun.lockb pnpm-lock.yaml
   ```

3. **Revert Steps**:
   ```bash
   # Restore package.json files
   git checkout main -- frontend/package.json backend-api/package.json
   
   # Restore Dockerfiles
   git checkout main -- frontend/Dockerfile backend-api/Dockerfile
   
   # Reinstall with pnpm
   cd frontend && pnpm install
   cd ../backend-api && pnpm install
   ```

4. **Test Rollback**: Verify everything works with pnpm/Node.js

### Rollback Triggers
- Critical bugs that can't be fixed quickly
- Performance degradation
- Compatibility issues with key dependencies
- Team productivity issues

## Post-Migration Optimization

### 1. Remove Unused Dependencies
```bash
# Frontend
cd frontend
bun remove jest @types/jest jest-environment-jsdom tsx

# Backend
cd backend-api
bun remove jest @types/jest ts-jest ts-node
```

### 2. Update .gitignore
```gitignore
# Bun
bun.lockb
.bun/

# Keep pnpm-lock.yaml for reference during transition, remove later
# pnpm-lock.yaml
```

### 3. Optimize Docker Images
- Use Bun slim images where possible
- Multi-stage builds for smaller images
- Cache Bun dependencies effectively

### 4. Update CI/CD
- Use Bun in GitHub Actions
- Update build scripts
- Update test commands

### 5. Team Training
- Bun documentation session
- Migration guide for team members
- Best practices document

## Migration Checklist

### Pre-Migration
- [ ] Install Bun on all development machines
- [ ] Create migration branch
- [ ] Backup current lockfiles
- [ ] Document current performance metrics

### Phase 1: Local Development
- [ ] Install Bun
- [ ] Test `bun install` in frontend
- [ ] Test `bun install` in backend
- [ ] Test `bun run dev` in frontend
- [ ] Test `bun run start:dev` in backend
- [ ] Document any issues

### Phase 2: Scripts
- [ ] Update frontend package.json scripts
- [ ] Update backend package.json scripts
- [ ] Replace ts-node with bun
- [ ] Replace tsx with bun
- [ ] Test all scripts
- [ ] Update helper scripts

### Phase 3: Tests
- [ ] Convert frontend Jest tests
- [ ] Convert backend Jest tests
- [ ] Convert E2E tests
- [ ] Remove Jest dependencies
- [ ] Run full test suite
- [ ] Verify test coverage

### Phase 4: Docker
- [ ] Update backend Dockerfile
- [ ] Update frontend Dockerfile
- [ ] Test Docker builds
- [ ] Test Docker containers
- [ ] Update start.sh
- [ ] Test full stack in Docker

### Phase 5: Documentation
- [ ] Update README.md
- [ ] Update CLAUDE.md
- [ ] Update backend README
- [ ] Update frontend README
- [ ] Update helper scripts docs

### Phase 6: Production
- [ ] Deploy to staging
- [ ] Full testing in staging
- [ ] Performance comparison
- [ ] Deploy to production
- [ ] Monitor for issues

## Timeline Estimate

- **Week 1**: Local development setup + Script migration
- **Week 2**: Test migration + Docker migration
- **Week 3**: CI/CD + Documentation
- **Week 4**: Production deployment + Monitoring

**Total**: ~4 weeks for complete migration

## Notes

- Keep `pnpm-lock.yaml` files during transition for easy rollback
- Test thoroughly at each phase before proceeding
- Document any compatibility issues encountered
- Consider keeping both Bun and pnpm support during transition period
- Monitor performance metrics before and after migration
