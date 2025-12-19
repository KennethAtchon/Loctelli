# Frontend Migration Overview

## Purpose

This migration guide provides comprehensive documentation for migrating the Loctelli frontend application. The frontend is built with **Next.js 15.4.7**, **React 19.2.1**, and uses the **App Router** architecture.

## Current Architecture

### Core Technologies
- **Framework**: Next.js 15.4.7 with App Router
- **React**: 19.2.1
- **TypeScript**: 5.x
- **Package Manager**: pnpm
- **UI Library**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4.0
- **State Management**: React Context API
- **Data Fetching**: TanStack React Query 5.62.11
- **Forms**: React Hook Form 7.54.1 with Zod validation
- **Testing**: Jest with React Testing Library

### Key Architectural Patterns

#### 1. **API Client Architecture**
- Centralized `ApiClient` class in `lib/api/client.ts`
- Modular endpoint APIs in `lib/api/endpoints/`
- Automatic token refresh on 401 errors
- Rate limiting and retry logic
- Auth service for token management

#### 2. **Authentication System**
- Unified auth context supporting both user and admin accounts
- JWT tokens stored in HTTP-only cookies
- Automatic token refresh mechanism
- Separate auth endpoints for users (`/auth/*`) and admins (`/admin/auth/*`)

#### 3. **Multi-Tenant Support**
- SubAccount filtering context
- Tenant-aware data fetching
- Admin subaccount management

#### 4. **Component Structure**
```
components/
├── admin/          # Admin-specific components
├── auth/           # Authentication components
├── chat/           # Chat interface
├── customUI/       # Custom data tables and UI
├── seo/            # SEO components
├── ui/             # Shadcn/ui base components
├── version1/       # Legacy landing page components
└── version2/       # Current landing page components
```

#### 5. **App Router Structure**
```
app/
├── (main)/         # Main routes (blog, forms)
├── account/         # User account pages
├── admin/           # Admin dashboard
│   ├── (auth)/     # Admin auth routes
│   └── (main)/     # Admin main routes
├── api/             # API routes (proxy, contact)
└── auth/            # User auth routes
```

## Migration Strategy

### Phase 1: Pre-Migration Assessment
1. Audit current dependencies and versions
2. Identify breaking changes in dependencies
3. Document current environment variables
4. Backup current codebase
5. Set up migration branch

### Phase 2: Core Infrastructure
1. Update dependencies systematically
2. Migrate configuration files
3. Update TypeScript configuration
4. Verify build process

### Phase 3: Application Code
1. Migrate API client and endpoints
2. Update authentication system
3. Migrate components
4. Update routing structure
5. Migrate state management

### Phase 4: Testing & Validation
1. Update test configuration
2. Migrate test files
3. Run test suite
4. Fix breaking tests

### Phase 5: Build & Deployment
1. Update build configuration
2. Update Dockerfile
3. Test production build
4. Deploy to staging

## Migration Documents

1. **[01-pre-migration-checklist.md](./01-pre-migration-checklist.md)** - Preparation steps
2. **[02-dependencies-migration.md](./02-dependencies-migration.md)** - Package management
3. **[03-configuration-migration.md](./03-configuration-migration.md)** - Config files
4. **[04-components-migration.md](./04-components-migration.md)** - Component structure
5. **[05-api-state-migration.md](./05-api-state-migration.md)** - API and state management
6. **[06-routing-migration.md](./06-routing-migration.md)** - App Router migration
7. **[07-testing-migration.md](./07-testing-migration.md)** - Testing setup
8. **[08-build-deployment-migration.md](./08-build-deployment-migration.md)** - Build and deployment
9. **[09-step-by-step-guide.md](./09-step-by-step-guide.md)** - Complete step-by-step process
10. **[10-troubleshooting.md](./10-troubleshooting.md)** - Common issues and solutions

## Critical Dependencies

### Production Dependencies
- `next@^15.4.7` - Core framework
- `react@^19.2.1` - UI library
- `react-dom@^19.2.1` - React DOM
- `@tanstack/react-query@^5.62.11` - Data fetching
- `react-hook-form@^7.54.1` - Form management
- `zod@^3.24.1` - Schema validation
- `tailwindcss@^4.0.0` - Styling
- `lucide-react@^0.454.0` - Icons

### Development Dependencies
- `typescript@^5` - Type checking
- `jest@^29.7.0` - Testing framework
- `@testing-library/react@^16.1.0` - React testing utilities
- `prettier@^3.7.4` - Code formatting
- `eslint@^9.39.1` - Linting

## Environment Variables

The frontend requires these environment variables:
- `NEXT_PUBLIC_API_URL` - Backend API base URL
- Additional variables defined in `lib/utils/envUtils.ts`

## Important Notes

1. **API Proxy**: All backend API calls use `/api/proxy` prefix (see memory)
2. **Authentication**: Uses HTTP-only cookies for security
3. **Multi-Tenant**: SubAccount filtering is critical for data isolation
4. **Type Safety**: Full TypeScript coverage with strict type checking
5. **Testing**: Jest configuration with MSW for API mocking

## Next Steps

Start with **[01-pre-migration-checklist.md](./01-pre-migration-checklist.md)** to prepare for migration.

