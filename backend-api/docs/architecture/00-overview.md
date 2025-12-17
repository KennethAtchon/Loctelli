# Backend System Overview

## Purpose
This document provides a high-level overview of the Loctelli backend architecture, its components, and how they interact.

## 1. System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Frontend Next.js]
        EXT[External Services]
    end
    
    subgraph "API Layer"
        API[NestJS Backend API]
        MW[Middleware Stack]
        GUARD[Guard System]
    end
    
    subgraph "Business Logic"
        AUTH[Authentication Module]
        USERS[User Management]
        LEADS[Lead Management]
        BOOKINGS[Booking System]
        AI[AI Receptionist]
        INTEG[Integrations]
    end
    
    subgraph "Infrastructure"
        DB[(PostgreSQL<br/>Prisma ORM)]
        REDIS[(Redis Cache)]
        STORAGE[S3/R2 Storage]
        QUEUE[Job Queue<br/>BullMQ]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API]
        TWILIO[Twilio]
        POSTMARK[Postmark]
        GHL[GoHighLevel]
    end
    
    FE -->|HTTPS + JWT| API
    EXT -->|Webhooks| API
    API --> MW
    MW --> GUARD
    GUARD --> AUTH
    AUTH --> USERS
    USERS --> LEADS
    LEADS --> BOOKINGS
    BOOKINGS --> AI
    AI --> INTEG
    
    AUTH --> DB
    USERS --> DB
    LEADS --> DB
    BOOKINGS --> DB
    AI --> DB
    INTEG --> DB
    
    API --> REDIS
    API --> STORAGE
    API --> QUEUE
    
    AI --> OPENAI
    AI --> TWILIO
    AI --> POSTMARK
    INTEG --> GHL
```

### Technology Stack

#### Core Framework
- **NestJS 11.1.8** - Progressive Node.js framework with TypeScript
- **TypeScript 5.9.3** - Type-safe development
- **Express 5.1.0** - HTTP server foundation

#### Database & ORM
- **PostgreSQL 15** - Primary relational database
- **Prisma 6.19.0** - Type-safe ORM with migrations
- **Drizzle ORM 0.44.7** - Additional ORM for AI Receptionist memory storage

#### Caching & Queue
- **Redis 7** - In-memory data store
- **BullMQ 5.63.0** - Job queue with Redis backend
- **cache-manager 7.2.4** - Cache abstraction layer

#### Authentication & Security
- **@nestjs/jwt 11.0.1** - JWT token handling
- **@nestjs/passport 11.0.5** - Authentication strategies
- **passport-jwt 4.0.1** - JWT strategy for Passport
- **bcrypt 6.0.0** - Password hashing

#### Communication Services
- **Twilio 5.10.4** - Voice and SMS communication
- **Postmark** - Email service (via AI Receptionist package)
- **@nestjs/schedule 6.0.1** - Task scheduling

#### AI & Integrations
- **@atchonk/ai-receptionist 0.1.22** - AI Receptionist package
- **OpenAI 6.8.1** - GPT models for AI conversations
- **@gohighlevel/api-client 2.2.2** - GoHighLevel CRM integration

#### Storage & File Processing
- **@aws-sdk/client-s3 3.927.0** - AWS S3 / Cloudflare R2 storage
- **csv-parser 3.2.0** - CSV file processing
- **xlsx 0.18.5** - Excel file processing
- **pdfkit 0.17.2** - PDF generation
- **jszip 3.10.1** - ZIP file handling

#### Utilities
- **class-validator 0.14.2** - DTO validation
- **class-transformer 0.5.1** - Object transformation
- **date-fns 4.1.0** - Date manipulation
- **libphonenumber-js 1.12.26** - Phone number validation
- **axios 1.13.2** - HTTP client

### Core Principles and Design Patterns

#### 1. Modular Architecture
- **Module-based organization**: Features organized into NestJS modules
- **Separation of concerns**: Clear boundaries between layers
- **Shared infrastructure**: Common services in `shared/` directory

#### 2. Multi-Tenancy First
- **SubAccount isolation**: All data scoped to tenant (SubAccount)
- **Tenant-aware queries**: Automatic filtering by `subAccountId`
- **Onboarding guard**: Prevents access until workspace setup complete

#### 3. Security by Default
- **JWT authentication**: Stateless token-based auth
- **API key protection**: Middleware-level API key validation
- **Rate limiting**: Throttler guards on sensitive endpoints
- **Input validation**: Middleware-level request validation
- **Security headers**: CSP, XSS protection, HSTS

#### 4. Factory Pattern
- **AI Receptionist Factory**: Efficient agent instance management
- **Agent caching**: 30-minute cache for agent instances
- **Memory persistence**: Database-backed conversation memory

#### 5. Job Queue Pattern
- **Async processing**: Background jobs for heavy operations
- **Processor-based**: Pluggable processors for different job types
- **Retry logic**: Automatic retry with exponential backoff

### Module Organization

```
src/
├── core/                    # Application core
│   ├── app.module.ts        # Root module
│   ├── app.controller.ts    # Root controller
│   └── main.ts              # Bootstrap function
│
├── main-app/                # Main application modules
│   ├── modules/             # Feature modules
│   │   ├── users/           # User management
│   │   ├── leads/           # Lead management
│   │   ├── strategies/      # Sales strategies
│   │   ├── bookings/        # Booking system
│   │   ├── chat/            # Chat functionality
│   │   ├── contacts/        # Contact management
│   │   ├── forms/           # Dynamic forms
│   │   ├── subaccounts/     # Multi-tenant management
│   │   ├── prompt-templates/# AI prompt templates
│   │   └── ai-receptionist/ # AI Receptionist integration
│   │
│   ├── integrations/        # External integrations
│   │   ├── ghl-integrations/# GoHighLevel integration
│   │   └── modules/         # Integration framework
│   │
│   ├── controllers/         # Shared controllers
│   │   ├── unified-auth.controller.ts
│   │   └── admin-management.controller.ts
│   │
│   ├── status/              # Health & status endpoints
│   ├── debug/               # Debug utilities
│   ├── general/             # General utilities
│   └── background/          # Background processes
│
└── shared/                  # Shared infrastructure
    ├── auth/                # Authentication & authorization
    ├── prisma/              # Database service
    ├── cache/               # Redis caching
    ├── storage/             # File storage (S3/R2)
    ├── sms/                 # SMS service
    ├── email/               # Email service
    ├── job-queue/           # Background job processing
    ├── encryption/          # Encryption utilities
    ├── security/            # Security monitoring
    ├── middleware/          # Custom middleware
    ├── guards/              # Route guards
    ├── decorators/          # Custom decorators
    └── utils/               # Utility functions
```

## 2. Key Components

### Authentication & Authorization

**Location**: `src/shared/auth/`

- **Unified Authentication**: Single system for both users and admins
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Security Service**: Account locking, failed login tracking
- **Guards**: JWT, Onboarding, Roles, Admin guards
- **Strategies**: Passport JWT strategy

**Key Files**:
- `unified-auth.service.ts` - Main authentication logic
- `security.service.ts` - Security monitoring and account locking
- `auth.guard.ts` - JWT authentication guard
- `jwt.strategy.ts` - Passport JWT strategy

### Multi-Tenant System

**Location**: `src/main-app/modules/subaccounts/`

- **SubAccount Model**: Tenant isolation at database level
- **Onboarding Guard**: Prevents feature access until workspace setup
- **Tenant Constants**: Special handling for onboarding workspace (ID: 1)
- **Invitation System**: User invitation to workspaces

**Key Features**:
- All resources filtered by `subAccountId`
- Users must belong to a SubAccount
- Admins can create and manage SubAccounts

### AI Receptionist

**Location**: `src/main-app/modules/ai-receptionist/`

- **Package**: `@atchonk/ai-receptionist` v0.1.22
- **Factory Pattern**: Efficient agent instance management
- **Multi-Channel**: Voice (Twilio), SMS (Twilio), Email (Postmark)
- **Custom Tools**: Booking and lead management tools
- **Memory Storage**: Database-backed conversation memory

**Key Files**:
- `agent-factory.service.ts` - Agent factory and caching
- `webhook.controller.ts` - Webhook handlers for all channels
- `agent-config.service.ts` - Configuration management
- `custom-tools/` - Custom AI tools for bookings and leads

### Job Queue System

**Location**: `src/shared/job-queue/`

- **BullMQ**: Redis-based job queue
- **Job Types**: Email, SMS, Data Export, File Processing, Generic Tasks
- **Processors**: Pluggable processors for each job type
- **Retry Logic**: Automatic retry with configurable attempts

**Key Files**:
- `job-queue.service.ts` - Queue management
- `processors/` - Job processors for each type

### Integrations Framework

**Location**: `src/main-app/integrations/`

- **Template System**: Integration templates with JSON schemas
- **Active Integrations**: Per-subaccount integration instances
- **GoHighLevel**: Full CRM integration with webhooks
- **Status Management**: Active, pending, error, disconnected states

**Key Features**:
- Dynamic form generation from JSON schemas
- Integration testing before activation
- Webhook event processing
- Multi-tenant integration isolation

### Database Layer

**Location**: `src/shared/prisma/`

- **Prisma Service**: Database connection and migrations
- **Auto-Migrations**: Automatic migration on startup
- **Connection Retry**: 30-second retry logic for database availability
- **Health Checks**: Database connectivity monitoring

**Key Features**:
- Type-safe database access
- Automatic migration deployment
- Connection pooling
- Transaction support

## 3. Request Flow

### Request Lifecycle

```mermaid
sequenceDiagram
    participant Client
    participant SecurityHeaders
    participant InputValidation
    participant ApiKey
    participant JwtGuard
    participant OnboardingGuard
    participant Controller
    participant Service
    participant Database
    participant Cache

    Client->>SecurityHeaders: HTTP Request
    SecurityHeaders->>SecurityHeaders: Add security headers
    SecurityHeaders->>InputValidation: Validate request body
    InputValidation->>ApiKey: Check API key (if required)
    ApiKey->>JwtGuard: Validate JWT token
    JwtGuard->>OnboardingGuard: Check onboarding status
    OnboardingGuard->>Controller: Route to controller
    Controller->>Service: Business logic
    Service->>Cache: Check cache
    alt Cache Hit
        Cache-->>Service: Return cached data
    else Cache Miss
        Service->>Database: Query database
        Database-->>Service: Return data
        Service->>Cache: Store in cache
    end
    Service-->>Controller: Return result
    Controller-->>Client: HTTP Response
```

### Middleware Chain

The middleware chain executes in the following order (configured in `app.module.ts`):

1. **SecurityHeadersMiddleware** (All routes)
   - Adds security headers (CSP, X-Frame-Options, etc.)
   - Removes server information
   - Sets cache control for sensitive endpoints

2. **InputValidationMiddleware** (All routes except uploads)
   - Validates request body structure
   - Type checking and sanitization

3. **RateLimitMiddleware** (Auth endpoints only)
   - Rate limiting for login, register, refresh, change-password
   - Additional throttling via `@Throttle` decorators

4. **ApiKeyMiddleware** (All routes except public)
   - Validates `X-API-Key` header
   - Excludes: status, health, debug, ai-receptionist webhooks

### Guard System

Guards execute after middleware, in this order:

1. **JwtAuthGuard** (Global, can be bypassed with `@Public()`)
   - Validates JWT token
   - Extracts user context
   - Attaches user to request object

2. **OnboardingGuard** (Global)
   - Blocks users in onboarding workspace (subAccountId = 1)
   - Can be bypassed with `@AllowOnboarding()` decorator

3. **RolesGuard** (Per-route, via `@Roles()` decorator)
   - Validates user roles
   - Enforces role-based access control

4. **AdminGuard** (Per-route, via `@Admin()` decorator)
   - Restricts access to admin users only

### Error Handling

- **Global Exception Filter**: Catches and formats all errors
- **Standard Error Response**: Consistent error format across API
- **Logging**: All errors logged with context
- **Production Safety**: Exits on critical failures in production

## 4. Infrastructure

### Database (PostgreSQL + Prisma)

**Configuration**:
- **PostgreSQL 15** - Production database
- **Prisma ORM** - Type-safe database access
- **Auto-migrations** - Runs `prisma migrate deploy` on startup
- **Connection Retry** - Waits up to 30 seconds for database availability

**Features**:
- Type-safe queries with Prisma Client
- Automatic migration deployment
- Connection pooling
- Health check endpoint (`/status/health`)

**Connection String**: `DATABASE_URL` environment variable

### Cache (Redis)

**Configuration**:
- **Redis 7** - In-memory data store
- **cache-manager** - Abstraction layer
- **TTL Support** - Configurable time-to-live
- **Connection Retry** - Handles connection failures gracefully

**Usage**:
- Session data caching
- Query result caching
- Rate limiting storage
- Job queue backend (BullMQ)

**Connection**: `REDIS_URL` or `REDIS_HOST` + `REDIS_PORT` environment variables

### Storage (S3/R2)

**Configuration**:
- **AWS S3** or **Cloudflare R2** - Object storage
- **@aws-sdk/client-s3** - SDK for storage operations
- **Presigned URLs** - Secure file access
- **Multi-part Upload** - Large file support

**Configuration** (via `R2_*` environment variables):
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### External Services

#### OpenAI
- **Purpose**: AI conversation processing
- **Model**: GPT-4o-mini (configurable)
- **API Key**: `OPENAI_API_KEY` environment variable
- **Usage**: AI Receptionist conversations

#### Twilio
- **Purpose**: Voice calls and SMS
- **Configuration**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Usage**: AI Receptionist voice and SMS channels

#### Postmark
- **Purpose**: Email sending and receiving
- **API Key**: `POSTMARK_API_KEY` environment variable
- **Usage**: AI Receptionist email channel

#### GoHighLevel
- **Purpose**: CRM integration
- **SDK**: `@gohighlevel/api-client`
- **Usage**: Contact sync, booking sync, webhook processing

## 5. Deployment & Operations

### Environment Configuration

**Required Environment Variables**:

```bash
# Application
NODE_ENV=production
PORT=8000
API_KEY=your-api-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis
REDIS_URL=redis://host:6379
# OR
REDIS_HOST=host
REDIS_PORT=6379
REDIS_PASSWORD=password

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Admin
ADMIN_AUTH_CODE=your-admin-code
DEFAULT_ADMIN_PASSWORD=default-password

# OpenAI
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4o-mini

# Twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=your-number

# Postmark
POSTMARK_API_KEY=your-key

# Storage (R2)
R2_ACCOUNT_ID=your-id
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=your-bucket
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### Health Checks

**Endpoints**:
- `GET /status` - Basic application status
- `GET /status/health` - Detailed health check with database and Redis status
- `GET /status/version` - Application version

**Health Check Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  },
  "uptime": 3600
}
```

**Docker Health Check**: Configured in `docker-compose.yml` to check `/status/health` endpoint

### Logging & Monitoring

**Logging**:
- **NestJS Logger** - Built-in logging with log levels
- **Structured Logging** - JSON-formatted logs in production
- **Request Logging** - All requests logged with route and user context
- **Error Logging** - Stack traces and context for errors

**Log Levels**:
- `LOG` - General information
- `DEBUG` - Detailed debugging information
- `WARN` - Warning messages
- `ERROR` - Error messages with stack traces

**Monitoring Points**:
- Database connection status
- Redis connection status
- Job queue health
- External API availability
- Request/response times

### Security Measures

#### Application Security
1. **JWT Authentication**: Stateless token-based auth
2. **API Key Protection**: Middleware-level validation
3. **Rate Limiting**: Throttler guards on sensitive endpoints
4. **Input Validation**: Request body validation
5. **Security Headers**: CSP, XSS protection, HSTS
6. **Password Hashing**: bcrypt with salt rounds
7. **Account Locking**: Automatic lock after failed attempts

#### Infrastructure Security
1. **HTTPS Only**: Enforced in production
2. **CORS Configuration**: Restricted origins
3. **Environment Variables**: Sensitive data in env vars
4. **Database Encryption**: At-rest encryption (managed by provider)
5. **Redis Security**: Password-protected connections
6. **Storage Security**: Presigned URLs for file access

#### Operational Security
1. **Health Checks**: Automated monitoring
2. **Graceful Shutdown**: Clean resource cleanup
3. **Error Sanitization**: No sensitive data in error responses
4. **Audit Logging**: Security events logged
5. **Production Safety**: Exits on critical failures

### Docker Deployment

**Services** (from `docker-compose.yml`):
1. **PostgreSQL** - Database container
2. **Redis** - Cache container
3. **API** - Backend application
4. **Frontend** - Next.js frontend (optional)

**Build Process**:
- Multi-stage Docker build
- Production dependencies only
- Prisma migrations on startup
- Health checks configured

**Startup Sequence**:
1. Database container starts
2. Redis container starts
3. API container waits for database/Redis health
4. API runs migrations
5. API starts listening on port 8000

---

**Status:** ✅ Complete - Ready for Review
