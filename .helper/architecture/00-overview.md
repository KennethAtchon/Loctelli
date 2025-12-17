# Loctelli Platform - Architecture Overview

## Executive Summary

Loctelli is a **full-stack AI-powered CRM platform** designed to help businesses automate lead engagement, qualification, and appointment booking through intelligent conversations. The platform combines multi-tenant architecture, AI chatbots, external integrations, and comprehensive lead management in a scalable, secure system.

## Platform Vision

**Problem**: Businesses struggle to respond to leads quickly, qualify them effectively, and book appointments efficiently while maintaining personalized, human-like conversations.

**Solution**: An AI-powered CRM that:
- Responds to leads instantly with personalized AI agents
- Qualifies leads through intelligent conversation
- Books appointments automatically when appropriate
- Integrates seamlessly with existing tools (GoHighLevel, etc.)
- Scales across multiple businesses with complete data isolation

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                               │
│                    Next.js 15 + React 19                             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Admin Panel │  │  User Portal │  │ Public Forms │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS + Direct API Connection
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Backend Layer                                  │
│                    NestJS 11 + Prisma                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Direct API: Frontend → Backend (JWT Authentication)          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                            │
                            │ JWT Authentication
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       Backend Layer                                  │
│                    NestJS 11 + Prisma                                │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │     Auth     │  │    Leads     │  │     Chat     │             │
│  │   Service    │  │   Service    │  │   Service    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Booking    │  │     SMS      │  │ Integrations │             │
│  │   Service    │  │   Service    │  │   Service    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │     Redis    │  │   OpenAI     │
│   Database   │  │     Cache    │  │   GPT-4o     │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────┐                      ┌──────────────┐
│   Twilio     │                      │ GoHighLevel  │
│     SMS      │                      │     CRM      │
└──────────────┘                      └──────────────┘
```

## Core Architecture Principles

### 1. Multi-Tenancy (SubAccount Model)

Every piece of data is isolated by `subAccountId`:

```
SuperAdmin (AdminUser)
    │
    ├─── SubAccount 1 (Acme Corp)
    │       ├─── Users
    │       ├─── Leads
    │       ├─── Strategies
    │       ├─── Bookings
    │       └─── Integrations
    │
    ├─── SubAccount 2 (TechStart Inc)
    │       ├─── Users
    │       ├─── Leads
    │       └─── ...
    │
    └─── SubAccount 3 (GrowthCo)
            └─── ...
```

**Key Principle**: All database queries MUST filter by `subAccountId` to ensure complete tenant isolation.

**Documentation**: [03-multi-tenant.md](./03-multi-tenant.md)

### 2. AI-Powered Conversations

The chatbot uses a three-layer prompt system:

```
Base Template (Admin-defined)
    ↓
Strategy Configuration (User-defined)
    ↓
Runtime Context (Lead data, time, availability)
    ↓
Final Prompt → OpenAI GPT-4o
```

**Features**:
- Personalized sales agents per campaign
- Function calling for bookings and lead updates
- Conversation history with summarization
- Security against prompt injection
- Multi-language support

**Documentation**: [02-ai-chatbot.md](./02-ai-chatbot.md)

### 3. JWT Authentication

Stateless authentication with token rotation:

```
User Login
    ↓
Generate JWT (15min access + 7day refresh)
    ↓
Store in HTTP-only cookies
    ↓
Frontend → Next.js Proxy (adds tokens)
    ↓
Backend → Validate JWT + Extract user context
```

**Documentation**: [01-authentication.md](./01-authentication.md)

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS + shadcn/ui
- **State**: React Context API
- **HTTP Client**: Custom API client with fetch

### Backend
- **Framework**: NestJS 11
- **ORM**: Prisma
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: JWT + bcrypt

### External Services
- **AI**: OpenAI GPT-4o-mini
- **SMS**: Twilio
- **CRM Integration**: GoHighLevel
- **File Storage**: AWS S3 / Cloudflare R2

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Deployment**: (TBD - AWS, DigitalOcean, etc.)
- **CI/CD**: (TBD - GitHub Actions, etc.)

## Data Flow Examples

### Example 1: Lead Capture & AI Engagement

```mermaid
sequenceDiagram
    participant GHL as GoHighLevel
    participant Webhook as Webhook API
    participant LeadsSvc as LeadsService
    participant ChatSvc as ChatService
    participant OpenAI as OpenAI API
    participant DB as Database

    GHL->>Webhook: New Contact Created<br/>{ name, email, phone, locationId }

    Webhook->>LeadsSvc: Create Lead
    LeadsSvc->>DB: Insert Lead (with subAccountId)
    DB-->>LeadsSvc: Lead created

    Webhook->>ChatSvc: Initiate Conversation
    ChatSvc->>DB: Get Strategy & User
    ChatSvc->>OpenAI: Generate greeting<br/>{ system prompt, tools }
    OpenAI-->>ChatSvc: "Hi John! I see you're interested..."

    ChatSvc->>DB: Save message to history
    ChatSvc-->>Webhook: AI greeting

    Webhook->>GHL: Send SMS to contact
```

### Example 2: AI-Powered Booking

```mermaid
sequenceDiagram
    participant Lead as Lead (via SMS)
    participant Chat as Chat API
    participant AI as OpenAI
    participant Tools as AI Tools Service
    participant Booking as Booking Service
    participant GHL as GoHighLevel

    Lead->>Chat: "Can I book Tuesday at 2pm?"

    Chat->>AI: Generate response with tools
    AI-->>Chat: tool_call: check_availability

    Chat->>Tools: check_availability(date, time)
    Tools->>GHL: Get free slots
    GHL-->>Tools: Available slots
    Tools-->>Chat: { available: true }

    Chat->>AI: Send tool result
    AI-->>Chat: tool_call: create_booking

    Chat->>Tools: create_booking(date, time)
    Tools->>Booking: Create booking
    Booking->>GHL: Create calendar block
    Tools-->>Chat: { success: true }

    Chat->>AI: Send tool result
    AI-->>Chat: "Perfect! Booked for Tuesday at 2pm."

    Chat-->>Lead: Confirmation message
```

## Module Breakdown

### 1. Authentication & Authorization
- **Purpose**: Secure user and admin authentication
- **Key Features**: JWT tokens, password validation, role-based access
- **Documentation**: [01-authentication.md](./01-authentication.md)

### 2. AI Chatbot
- **Purpose**: Intelligent lead conversations and qualification
- **Key Features**: GPT-4 integration, function calling, conversation summarization
- **Documentation**: [02-ai-chatbot.md](./02-ai-chatbot.md)

### 3. Multi-Tenant System
- **Purpose**: Complete data isolation between businesses
- **Key Features**: SubAccount model, tenant-scoped queries, settings per tenant
- **Documentation**: [03-multi-tenant.md](./03-multi-tenant.md)

### 4. SMS Campaigns
- **Purpose**: Bulk SMS sending and tracking
- **Key Features**: Twilio integration, rate limiting, phone validation, retry logic
- **Documentation**: [04-sms-campaigns.md](./04-sms-campaigns.md)

### 5. Lead Management
- **Purpose**: Comprehensive lead tracking and lifecycle management
- **Key Features**: Multi-source capture, conversation tracking, qualification state
- **Documentation**: [05-lead-management.md](./05-lead-management.md)

### 6. Booking System
- **Purpose**: AI-powered appointment scheduling
- **Key Features**: Availability checking, calendar integration, timezone handling
- **Documentation**: [06-booking-system.md](./06-booking-system.md)

### 7. Integrations
- **Purpose**: Connect with external platforms
- **Key Features**: Template-based framework, GoHighLevel sync, webhook handling
- **Documentation**: [07-integrations.md](./07-integrations.md)

## Database Schema Overview

### Core Entities

```
AdminUser (Super admins, manage platform)
    │
    └─── SubAccount (Tenant boundary)
            │
            ├─── User (Regular users within tenant)
            │     │
            │     ├─── Strategy (Sales agent config)
            │     │     │
            │     │     └─── Lead (Prospects)
            │     │           │
            │     │           └─── Booking (Appointments)
            │     │
            │     └─── SmsCampaign
            │           │
            │           └─── SmsMessage
            │
            ├─── Integration (External system connections)
            │
            └─── FormTemplate (Dynamic forms)
                  │
                  └─── FormSubmission
```

### Key Relationships

- **User → SubAccount**: N:1 (User belongs to one tenant)
- **Lead → User**: N:1 (Lead belongs to one user)
- **Lead → Strategy**: N:1 (Lead follows one strategy)
- **Booking → Lead**: N:1 (Booking linked to lead)
- **Integration → SubAccount**: N:1 (Integration per tenant)

## Security Architecture

### Defense in Depth

1. **Transport Layer**: HTTPS only in production
2. **Authentication**: JWT with short expiration + refresh tokens
3. **Authorization**: Role-based access control (admin, user)
4. **Multi-Tenancy**: Database-level isolation via `subAccountId`
5. **API Security**: API key between frontend and backend
6. **Prompt Security**: Injection detection and sanitization
7. **Credential Storage**: Encrypted API keys and secrets
8. **Webhook Verification**: HMAC signature validation

### Security Checklist

- ✅ All passwords hashed with bcrypt (12 rounds)
- ✅ JWT secrets never exposed to client
- ✅ HTTP-only cookies for token storage
- ✅ CORS configured for allowed origins
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation on all API endpoints
- ✅ SQL injection prevented by Prisma ORM
- ✅ XSS prevented by React's auto-escaping
- ✅ CSRF protection via SameSite cookies

## Scaling Considerations

### Current Architecture Capacity

- **Users**: 10,000+ per SubAccount
- **Leads**: 100,000+ per SubAccount
- **Messages**: Millions (with conversation summarization)
- **Concurrent Requests**: 1,000+ (horizontal scaling ready)

### Scaling Strategies

1. **Horizontal Scaling**
   - Stateless backend (can add more instances)
   - Load balancer (Nginx, AWS ALB)
   - Redis for distributed caching

2. **Database Scaling**
   - Read replicas for heavy queries
   - Connection pooling (Prisma)
   - Indexing on hot query paths

3. **External Service Limits**
   - OpenAI: Rate limiting + queueing
   - Twilio: Batch processing + delays
   - GoHighLevel: Respect API rate limits

4. **Caching Strategy**
   - User data: 5 min TTL
   - Strategy data: 10 min TTL
   - Integration config: 15 min TTL
   - Lead data: No cache (real-time)

## Development Workflow

### Docker Setup

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d db redis api frontend

# View logs
docker-compose logs -f api

# Reset everything
docker-compose down -v
```

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name add_new_feature

# Apply migrations
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

### Environment Configuration

**Backend** (`backend-api/.env`)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/loctelli
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

**Frontend** (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_URL=http://localhost:8000
```

## Performance Monitoring

### Key Metrics to Track

1. **Response Times**
   - API endpoints: < 200ms (p95)
   - AI responses: < 3s (p95)
   - Database queries: < 50ms (p95)

2. **Error Rates**
   - API errors: < 1%
   - AI failures: < 2%
   - Integration failures: < 5%

3. **Resource Usage**
   - CPU: < 70% average
   - Memory: < 80% average
   - Database connections: < 80% pool

4. **Business Metrics**
   - Leads captured per day
   - Conversations initiated
   - Bookings created
   - Conversion rates

## Future Enhancements

### Planned Features

1. **AI Improvements**
   - Voice AI integration
   - Multi-language support
   - Sentiment analysis
   - Advanced lead scoring

2. **Integrations**
   - Salesforce connector
   - HubSpot integration
   - Zapier webhooks
   - Google Calendar sync

3. **Analytics**
   - Advanced reporting dashboard
   - Conversation analytics
   - ROI tracking
   - A/B testing framework

4. **Automation**
   - Workflow builder
   - Automated follow-ups
   - Drip campaigns
   - Lead nurturing sequences

## Documentation Index

1. [**Authentication Architecture**](./01-authentication.md) - JWT-based auth system
2. [**AI Chatbot Architecture**](./02-ai-chatbot.md) - OpenAI integration and conversation management
3. [**Multi-Tenant Architecture**](./03-multi-tenant.md) - SubAccount isolation and management
4. [**SMS Campaigns Architecture**](./04-sms-campaigns.md) - Twilio integration and bulk sending
5. [**Lead Management Architecture**](./05-lead-management.md) - Lead lifecycle and tracking
6. [**Booking System Architecture**](./06-booking-system.md) - AI-powered appointment scheduling
7. [**Integrations Architecture**](./07-integrations.md) - External platform connections

## Getting Help

### Resources

- **Documentation**: `.helper/architecture/` (this folder)
- **Code Structure**: `CLAUDE.md` in project root
- **API Documentation**: (TBD - Swagger/OpenAPI)
- **Issue Tracking**: (TBD - GitHub Issues, Jira, etc.)

### Key Contacts

- **Platform Architecture**: (TBD)
- **AI/ML Systems**: (TBD)
- **Infrastructure**: (TBD)
- **Security**: (TBD)

---

**Version**: 1.0
**Last Updated**: 2025-10-12
**Maintained By**: Engineering Team
