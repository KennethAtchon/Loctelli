# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive CRM application with a NestJS backend and Next.js frontend, featuring multi-tenant architecture, AI-powered chat, SMS campaigns, lead management, and booking systems.

## Architecture

- **Backend**: `project/` - NestJS 11 with Prisma ORM, PostgreSQL, Redis
- **Frontend**: `my-app/` - Next.js 15.2.4 with React 19, TailwindCSS, shadcn/ui
- **Database**: PostgreSQL with comprehensive multi-tenant data model
- **Authentication**: JWT with cookie-based sessions, automatic token refresh
- **API Communication**: Next.js proxy with AuthService for secure backend calls

## Key Development Commands

### Backend (project/)
```bash
# Development
npm run start:dev        # Hot reload development server
npm run build           # Production build
npm run start:prod      # Production server

# Testing
npm test               # Unit tests
npm run test:cov       # Coverage report
npm run test:e2e       # End-to-end tests

# Database
npm run db:generate    # Generate Prisma client
npm run db:migrate:dev # Development migrations
npm run db:migrate     # Deploy migrations
npm run db:studio      # Open Prisma Studio
npm run db:seed        # Seed database
npm run db:reset       # Reset database (dev only)

# Code quality
npm run lint           # ESLint with --fix
npm run format         # Prettier formatting
```

### Frontend (my-app/)
```bash
# Development
npm run dev            # Next.js dev server with turbo
npm run build          # Production build
npm run start          # Production server

# Testing
npm test               # Jest unit tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:ci        # CI tests

# Code quality
npm run lint           # Next.js linting
npm run clean          # Clean build artifacts
```

## Core Architecture Patterns

### Multi-Tenant Data Model
- **SubAccount**: Top-level tenant isolation (required for all entities)
- **AdminUser**: Global admin managing multiple SubAccounts
- **User**: Belongs to specific SubAccount with role-based access
- All entities require `subAccountId` for data isolation

### Authentication System
- **Two-tier auth**: Regular users (`/auth/*`) and admin users (`/admin/auth/*`)
- **Cookie-based JWT**: Automatic token management via AuthService
- **Token refresh**: Seamless token renewal on 401 responses
- **AuthCookies**: Client-side cookie management utility

### API Architecture
- **ApiClient**: Base client with rate limiting, retries, automatic auth
- **AuthService**: Handles token management and refresh logic
- **Endpoint structure**: `/api/proxy/[...path]/route.ts` for backend proxy
- **Rate limiting**: Built-in protection with user-friendly feedback

### Database Design
Key relationships:
- `SubAccount` → `User[]`, `Lead[]`, `Strategy[]`, `Booking[]`, `SmsMessage[]`
- `User` → `Strategy[]`, `Lead[]`, `Booking[]`
- `Strategy` → `Lead[]` (with `PromptTemplate` reference)
- `Lead` → `Booking[]` (optional relationship)
- SMS system: `SmsCampaign` → `SmsMessage[]`

## Important Implementation Notes

### Authentication Flow
1. Client requests go through `ApiClient.request()`
2. `AuthService.getAuthHeaders()` adds tokens from cookies
3. On 401, `AuthService.handleUnauthorized()` refreshes tokens
4. Failed refresh redirects to appropriate login page (`/auth/login` or `/admin/login`)

### Multi-Tenant Filtering
- Admin dashboard uses `SubAccountFilterContext` for global filtering
- All API endpoints respect SubAccount isolation
- `subAccountId` is required for all tenant-specific operations

### Testing Strategy
- **Backend**: Jest unit tests, E2E tests with supertest
- **Frontend**: Jest + Testing Library, MSW for API mocking
- **Coverage targets**: 80%+ unit, 70%+ integration, 75%+ overall

### Error Handling
- Comprehensive error boundaries in React components
- Rate limiting with user-friendly toast notifications
- Network error detection with retry logic
- Structured logging via custom logger utility

## Key Integrations

### SMS System (Twilio)
- Campaign management with bulk messaging
- Phone number validation via libphonenumber-js
- Delivery tracking and status updates
- CSV upload for bulk recipients

### AI Integration (OpenAI)
- Context-aware chat responses
- Strategy-based conversation handling
- Automatic conversation summarization (50+ messages)
- Booking creation from AI responses

### Background Processing
- Cron jobs for booking slot management
- Automated SMS campaign processing
- Redis caching for performance

## Security Features

### Multi-layer Security
- API key middleware for all backend requests
- JWT authentication with role-based access
- Input validation and sanitization
- Rate limiting on auth endpoints
- Security headers middleware

### Data Protection
- Password hashing with bcrypt (12 rounds)
- SQL injection prevention via Prisma
- XSS protection through input sanitization
- Secure cookie configuration (httpOnly, secure, sameSite)

## Development Workflow

### Database Changes
1. Modify `project/prisma/schema.prisma`
2. Run `npm run db:migrate:dev` to create migration
3. Update TypeScript types if needed
4. Test with `npm run db:studio`

### Adding New Features
1. Backend: Create module in `project/src/main-app/modules/`
2. Frontend: Add components in `my-app/components/`
3. API integration: Add endpoints in `my-app/lib/api/endpoints/`
4. Update types in respective `types/` directories

### Testing Requirements
- All new endpoints require unit tests
- Frontend components need Jest + Testing Library tests
- E2E tests for critical user flows
- Mock external services (Twilio, OpenAI) in tests

## Common Patterns

### API Endpoint Structure
```typescript
// Backend controller
@Controller('endpoint')
export class EndpointController {
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateDto, @CurrentUser() user: User) {
    // Implementation
  }
}

// Frontend API client
export const endpointApi = {
  create: (data: CreateDto) => apiClient.post<Entity>('/endpoint', data),
  getAll: (subAccountId?: number) => {
    const query = subAccountId ? `?subAccountId=${subAccountId}` : '';
    return apiClient.get<Entity[]>(`/endpoint${query}`);
  }
};
```

### React Component Pattern
```typescript
// Use contexts for global state
const { user } = useAuth();
const { selectedSubAccountId } = useSubAccountFilter();

// API calls with error handling
const [data, setData] = useState<Entity[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await api.endpoint.getAll(selectedSubAccountId);
      setData(result);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, [selectedSubAccountId]);
```

## Environment Setup

### Required Environment Variables
**Backend (.env)**:
- `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET`, `API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `OPENAI_API_KEY`

**Frontend (.env.local)**:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_API_KEY`

### Docker Development

The project uses Docker Compose to run the complete stack with the following services:

**Services:**
- **Database**: PostgreSQL 15 (port 5432) with health checks
- **Cache**: Redis 7 (port 6379) with persistence
- **Backend**: NestJS API (port 8000) with health checks
- **Frontend**: Next.js app (port 3000)

**Docker Commands:**
```bash
# Start all services (full stack)
docker-compose up -d

# Start specific services only
docker-compose up -d db redis
docker-compose up -d db redis api

# View logs
docker-compose logs -f
docker-compose logs -f api frontend

# Stop all services
docker-compose down

# Rebuild and start (after code changes)
docker-compose up --build -d

# Reset everything (removes volumes)
docker-compose down -v
```

**Service URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Database: postgresql://postgres:password@localhost:5432/loctelli
- Redis: redis://localhost:6379

**Environment Variables:**
- Default admin password: `defaultAdmin123!CANTUNA`
- Database credentials: `postgres/password/loctelli`
- Services auto-configure internal networking

**Development Workflow:**
```bash
# Full containerized development
docker-compose up -d

# Hybrid development (external frontend/backend)
docker-compose up -d db redis
cd project && npm run start:dev &
cd my-app && npm run dev
```

**Helper Scripts (.helper/scripts/):**
```bash
# Quick setup - Stop all containers and rebuild
./.helper/scripts/setup_docker.sh

# Nuclear option - Remove everything and rebuild
./.helper/scripts/nuke_setup_docker.sh
```

**Script Details:**
- **setup_docker.sh**: Stops/removes all containers, then rebuilds with `docker-compose up --build`
- **nuke_setup_docker.sh**: Complete Docker cleanup (containers, volumes, images) + rebuild

Use this information to understand the codebase structure and implement changes following established patterns.