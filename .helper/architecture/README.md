# Loctelli Platform - Architecture Documentation

Welcome to the comprehensive architecture documentation for the Loctelli AI-powered CRM platform.

## Quick Start

**New to the project?** Start here:
1. Read [00-overview.md](./00-overview.md) for a complete system overview
2. Review [03-multi-tenant.md](./03-multi-tenant.md) to understand tenant isolation
3. Explore [02-ai-chatbot.md](./02-ai-chatbot.md) for the core AI system

**Working on a specific feature?** Jump to the relevant guide:
- Authentication issues? → [01-authentication.md](./01-authentication.md)
- AI conversation problems? → [02-ai-chatbot.md](./02-ai-chatbot.md)
- Lead management? → [05-lead-management.md](./05-lead-management.md)
- Booking system? → [06-booking-system.md](./06-booking-system.md)
- Integration issues? → [07-integrations.md](./07-integrations.md)
- SMS campaigns? → [04-sms-campaigns.md](./04-sms-campaigns.md)
- Form system? → [08-form-system.md](./08-form-system.md)

## Documentation Structure

### 📋 [00-overview.md](./00-overview.md)
**Complete platform architecture overview**

A high-level view of the entire system including:
- System architecture diagrams
- Technology stack
- Data flow examples
- Core principles
- Development workflow
- Performance considerations

**Read this first** if you're new to the project or need a refresher on how everything fits together.

---

### 🔐 [01-authentication.md](./01-authentication.md)
**Authentication & Authorization Architecture**

**Problem Solved**: Secure user authentication for regular users and admin users

**Key Topics**:
- JWT-based authentication flow
- Token refresh mechanism
- Password security (bcrypt, complexity requirements)
- Cookie-based session management
- API proxy authentication
- Multi-tenant user context

**When to read**:
- Implementing login/logout features
- Debugging authentication issues
- Adding new user roles
- Securing new API endpoints

---

### 🤖 [02-ai-chatbot.md](./02-ai-chatbot.md)
**AI Chatbot Architecture**

**Problem Solved**: Intelligent lead conversations with automated qualification and booking

**Key Topics**:
- OpenAI GPT-4 integration
- Three-layer prompt engineering (Template → Strategy → Context)
- AI function calling (bookings, lead updates)
- Conversation history management
- Conversation summarization
- Prompt injection security
- Security validation and rate limiting

**When to read**:
- Modifying AI behavior
- Adding new AI tools/functions
- Debugging conversation issues
- Optimizing prompt performance
- Implementing new strategies

---

### 🏢 [03-multi-tenant.md](./03-multi-tenant.md)
**Multi-Tenant Architecture**

**Problem Solved**: Complete data isolation between different business customers

**Key Topics**:
- SubAccount model (tenant boundary)
- Three-tier user hierarchy (SuperAdmin → SubAccount → Users)
- Database query isolation patterns
- Tenant-specific configurations
- Security considerations for multi-tenancy
- Scaling strategies

**When to read**:
- Creating new database models
- Writing queries that access tenant data
- Implementing tenant-specific features
- Debugging data leakage issues
- Understanding the data model

**⚠️ CRITICAL**: All tenant-scoped queries MUST filter by `subAccountId`

---

### 📱 [04-sms-campaigns.md](./04-sms-campaigns.md)
**SMS Campaigns Architecture**

**Problem Solved**: Bulk SMS messaging with tracking and delivery management

**Key Topics**:
- Twilio integration
- Phone number validation (E.164 format)
- Rate limiting and batch processing
- Retry logic with exponential backoff
- Campaign tracking and statistics
- Cost optimization strategies

**When to read**:
- Implementing SMS features
- Debugging SMS delivery issues
- Configuring Twilio integration
- Optimizing SMS costs
- Building campaign analytics

---

### 👥 [05-lead-management.md](./05-lead-management.md)
**Lead Management Architecture**

**Problem Solved**: Comprehensive lead tracking from capture to conversion

**Key Topics**:
- Multi-source lead capture (webhooks, forms, manual)
- Lead lifecycle states
- Conversation state tracking
- Message history storage
- Timezone detection and handling
- Search and filtering
- Lead qualification tracking

**When to read**:
- Implementing lead features
- Debugging lead capture issues
- Adding new lead sources
- Building lead analytics
- Understanding conversation state

---

### 📅 [06-booking-system.md](./06-booking-system.md)
**Booking System Architecture**

**Problem Solved**: AI-powered appointment scheduling with calendar integration

**Key Topics**:
- AI booking via function calling
- GoHighLevel calendar integration
- Availability checking
- Timezone-aware scheduling
- Block slot creation
- Manual booking management

**When to read**:
- Implementing booking features
- Debugging calendar sync issues
- Configuring GHL integration
- Handling timezone problems
- Building booking UI

---

### 🔌 [07-integrations.md](./07-integrations.md)
**Integrations Architecture**

**Problem Solved**: Connecting with external platforms (GoHighLevel, etc.)

**Key Topics**:
- Template-based integration framework
- GoHighLevel webhook handling
- Secure credential storage (encryption)
- Webhook signature verification
- Integration lifecycle management
- API client patterns
- Rate limiting and retry logic

**When to read**:
- Adding new integrations
- Debugging webhook issues
- Configuring GHL integration
- Implementing new external platform
- Troubleshooting sync problems

---

### 📝 [08-form-system.md](./08-form-system.md)
**Form System Architecture**

**Problem Solved**: Dual form system with Simple Forms (traditional) and Card Forms (interactive, flowchart-based)

**Key Topics**:
- Simple Forms: Traditional single-page forms
- Card Forms: One-question-per-screen with animations
- Flowchart-based builder: Visual canvas for building branching forms
- Conditional logic: Show/hide, jump, dynamic labels, piping
- Profile estimation: Rule-based scoring with optional AI enhancement
- Analytics: Drop-off analysis, time tracking, result distributions
- Session management: Partial form saves and resume

**When to read**:
- Building or modifying form features
- Understanding form builder architecture
- Implementing conditional logic
- Configuring profile estimation
- Debugging form rendering issues
- Adding new field types
- Understanding flowchart serialization

---

## Common Use Cases

### I need to...

**Add a new API endpoint**
1. Read [01-authentication.md](./01-authentication.md) for auth requirements
2. Read [03-multi-tenant.md](./03-multi-tenant.md) for tenant isolation
3. Implement endpoint with proper guards and filters

**Modify AI behavior**
1. Read [02-ai-chatbot.md](./02-ai-chatbot.md) for prompt structure
2. Update Strategy model or PromptTemplate
3. Test with conversation history

**Create a new database model**
1. Read [03-multi-tenant.md](./03-multi-tenant.md) for tenant requirements
2. Add `subAccountId` field and relation
3. Update Prisma schema and migrate
4. Ensure all queries filter by `subAccountId`

**Add a new external integration**
1. Read [07-integrations.md](./07-integrations.md) for framework
2. Create IntegrationTemplate
3. Implement client service
4. Add webhook handlers (if applicable)

**Debug a tenant data leak**
1. Read [03-multi-tenant.md](./03-multi-tenant.md) security section
2. Check all queries for `subAccountId` filter
3. Review authentication context
4. Audit database indexes

**Optimize AI response time**
1. Read [02-ai-chatbot.md](./02-ai-chatbot.md) performance section
2. Implement conversation summarization
3. Limit message history
4. Cache prompt templates and strategies

## Architecture Diagrams

### System Overview
```
Frontend (Next.js)
    ↓ HTTPS
API Proxy (Next.js API Routes)
    ↓ JWT + API Key
Backend (NestJS)
    ↓
Database (PostgreSQL) + Cache (Redis)
    ↓
External Services (OpenAI, Twilio, GoHighLevel)
```

### Data Flow (Lead Capture → AI Response → Booking)
```
External Platform → Webhook → Lead Created → AI Conversation → Booking Created → Calendar Block
```

### Multi-Tenant Isolation
```
All Data → Filter by subAccountId → User's Tenant Data Only
```

## Key Architectural Principles

1. **Multi-Tenancy First**: Every piece of data must respect tenant boundaries
2. **Security by Default**: Authentication, authorization, and encryption at every layer
3. **Stateless Services**: JWT auth, no session storage, horizontal scaling ready
4. **AI-Powered**: OpenAI integration with function calling for intelligent automation
5. **Integration-Friendly**: Template-based integration framework for external platforms
6. **Scalable Design**: Caching, pagination, indexing, and async processing

## Technology Stack Quick Reference

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 + React 19 + TailwindCSS |
| Backend | NestJS 11 + Prisma ORM |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| AI | OpenAI GPT-4o-mini |
| SMS | Twilio |
| CRM | GoHighLevel |
| Auth | JWT + bcrypt |
| Container | Docker + Docker Compose |

## Contributing to Documentation

When adding new features, please:
1. Update the relevant architecture document
2. Add sequence diagrams for complex flows
3. Document security considerations
4. Include error handling patterns
5. Update this README if adding a new doc

## Questions?

If these docs don't answer your question:
1. Check the codebase's `CLAUDE.md` for project structure
2. Look for inline code comments in the relevant service
3. Ask the team in your communication channel

---

**Last Updated**: 2025-10-12
**Documentation Version**: 1.0
**Maintained By**: Engineering Team
