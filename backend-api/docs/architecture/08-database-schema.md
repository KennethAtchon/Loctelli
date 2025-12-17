# Database Schema Documentation

## Purpose
Documentation of the database schema, models, relationships, and data access patterns.

## 1. Overview

### Database Technology

**PostgreSQL 15**
- Relational database management system
- ACID compliance
- JSON support for flexible data storage
- Full-text search capabilities
- Robust foreign key constraints

### ORM (Prisma)

**Prisma 6.19.0**
- Type-safe database client
- Migration system
- Schema-first approach
- Auto-generated TypeScript types
- Query builder with type safety

### Schema Organization

**Schema File**: `prisma/schema.prisma`

**Model Categories**:
1. **Core Models**: AdminUser, User, SubAccount
2. **Business Models**: Strategy, Lead, Booking, ContactSubmission, FormTemplate, FormSubmission
3. **Integration Models**: IntegrationTemplate, Integration
4. **System Models**: PromptTemplate, SubAccountPromptTemplate, SubAccountInvitation
5. **Security Models**: ConversationMessage, SecurityIncident, AuthAttempt, AccountLockout, PasswordHistory, RefreshToken

### ER Diagram

```mermaid
erDiagram
    AdminUser ||--o{ SubAccount : creates
    AdminUser ||--o{ User : creates
    AdminUser ||--o{ PromptTemplate : creates
    AdminUser ||--o{ IntegrationTemplate : creates
    AdminUser ||--o{ Integration : creates
    AdminUser ||--o{ FormTemplate : creates
    AdminUser ||--o{ SubAccountInvitation : creates
    
    SubAccount ||--o{ User : contains
    SubAccount ||--o{ Strategy : contains
    SubAccount ||--o{ Lead : contains
    SubAccount ||--o{ Booking : contains
    SubAccount ||--o{ Integration : contains
    SubAccount ||--o{ ContactSubmission : contains
    SubAccount ||--o{ FormTemplate : contains
    SubAccount ||--o{ FormSubmission : contains
    SubAccount ||--o{ SubAccountPromptTemplate : has
    SubAccount ||--o{ SubAccountInvitation : has
    
    User ||--o{ Strategy : creates
    User ||--o{ Lead : creates
    User ||--o{ Booking : creates
    User ||--o{ ContactSubmission : assigned
    User ||--o{ FormSubmission : assigned
    
    Strategy ||--o{ Lead : generates
    Strategy }o--|| PromptTemplate : uses
    
    Lead ||--o{ Booking : has
    Lead ||--o{ ConversationMessage : contains
    
    PromptTemplate ||--o{ Strategy : used_by
    PromptTemplate ||--o{ SubAccountPromptTemplate : selected_by
    
    IntegrationTemplate ||--o{ Integration : instantiated_by
    
    FormTemplate ||--o{ FormSubmission : receives
```

## 2. Core Models

### AdminUser

**Purpose**: System administrators who manage the platform

**Fields**:
```prisma
model AdminUser {
  id              Int         @id @default(autoincrement())
  name            String
  email           String      @unique
  password        String      // Hashed password
  role            String      @default("admin") // admin, super_admin
  isActive        Boolean     @default(true)
  permissions     Json?       // Granular permissions
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

**Relationships**:
- One-to-Many: `createdUsers` (User[])
- One-to-Many: `subAccounts` (SubAccount[])
- One-to-Many: `promptTemplates` (PromptTemplate[])
- One-to-Many: `integrationTemplates` (IntegrationTemplate[])
- One-to-Many: `integrations` (Integration[])
- One-to-Many: `formTemplates` (FormTemplate[])
- One-to-Many: `subAccountInvitations` (SubAccountInvitation[])

**Constraints**:
- `email` is unique
- `role` defaults to "admin"

### User

**Purpose**: Regular users (tenants) who use the platform

**Fields**:
```prisma
model User {
  id              Int         @id @default(autoincrement())
  name            String
  email           String      @unique
  password        String      // Hashed password
  role            String      @default("user") // admin, user, manager
  isActive        Boolean     @default(true)
  company         String?
  budget          String?
  bookingsTime    Json?       // Booking availability
  bookingEnabled  Int         @default(1) // 0 = False, 1 = True
  timezone        String      @default("America/New_York")
  calendarId      String?     // GHL calendar ID
  locationId      String?     // GHL location ID
  assignedUserId  String?     // GHL assigned user ID
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  subAccountId    Int         // REQUIRED: Tenant isolation
  createdByAdminId Int?       // Admin who created this user
}
```

**Relationships**:
- Many-to-One: `subAccount` (SubAccount) - REQUIRED
- Many-to-One: `createdByAdmin` (AdminUser?) - Optional
- One-to-Many: `strategies` (Strategy[])
- One-to-Many: `leads` (Lead[])
- One-to-Many: `bookings` (Booking[])
- One-to-Many: `assignedContacts` (ContactSubmission[])
- One-to-Many: `assignedFormSubmissions` (FormSubmission[])

**Constraints**:
- `email` is unique
- `subAccountId` is required (tenant isolation)
- `subAccountId` has cascade delete

**Indexes**:
- None explicitly defined (Prisma auto-indexes foreign keys)

### SubAccount

**Purpose**: Tenant/workspace entity for multi-tenancy

**Fields**:
```prisma
model SubAccount {
  id              Int         @id @default(autoincrement())
  name            String
  description     String?     @db.Text
  isActive        Boolean     @default(true)
  settings        Json?       // Tenant-specific settings
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  createdByAdminId Int        // REQUIRED
}
```

**Relationships**:
- Many-to-One: `createdByAdmin` (AdminUser) - REQUIRED
- One-to-Many: `users` (User[])
- One-to-Many: `strategies` (Strategy[])
- One-to-Many: `leads` (Lead[])
- One-to-Many: `bookings` (Booking[])
- One-to-Many: `integrations` (Integration[])
- One-to-Many: `contactSubmissions` (ContactSubmission[])
- One-to-Many: `formTemplates` (FormTemplate[])
- One-to-Many: `formSubmissions` (FormSubmission[])
- One-to-Many: `promptTemplates` (SubAccountPromptTemplate[])
- One-to-Many: `invitations` (SubAccountInvitation[])

**Special SubAccount**: ID 1 = ONBOARDING (for new users)

### Relationships Between Core Models

**AdminUser → SubAccount**:
- One admin creates many SubAccounts
- Foreign key: `SubAccount.createdByAdminId`
- No cascade delete (admins persist)

**AdminUser → User**:
- One admin creates many users
- Foreign key: `User.createdByAdminId`
- Optional relationship
- No cascade delete

**SubAccount → User**:
- One SubAccount contains many users
- Foreign key: `User.subAccountId`
- REQUIRED relationship
- Cascade delete: Deleting SubAccount deletes all users

## 3. Business Models

### Strategy

**Purpose**: AI agent configuration and persona definition

**Fields**:
```prisma
model Strategy {
  id                      Int        @id @default(autoincrement())
  regularUserId           Int        // REQUIRED
  subAccountId            Int        // REQUIRED: Tenant isolation
  promptTemplateId        Int        // REQUIRED
  
  // Core Identity
  name                    String
  description             String?    @db.Text
  tag                     String?
  industryContext         String?
  
  // Persona Details
  aiName                  String
  aiRole                  String     @db.Text
  companyBackground       String?    @db.Text
  
  // Conversation Style
  conversationTone        String     @db.Text
  communicationStyle      String?    @db.Text
  
  // Qualification & Discovery
  qualificationQuestions  String     @db.Text
  disqualificationRules   String?    @db.Text
  
  // Objection Handling
  objectionHandling       String     @db.Text
  
  // Closing & Booking
  closingStrategy         String     @db.Text
  bookingInstructions     String?    @db.Text
  
  // Output Rules
  outputGuidelines        String?    @db.Text
  prohibitedBehaviors     String?    @db.Text
  
  // Behavioral Settings
  delayMin                Int?
  delayMax                Int?
  
  // Metadata
  metadata                Json?
  isActive                Boolean    @default(true)
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
}
```

**Relationships**:
- Many-to-One: `regularUser` (User) - REQUIRED, cascade delete
- Many-to-One: `subAccount` (SubAccount) - REQUIRED, cascade delete
- Many-to-One: `promptTemplate` (PromptTemplate) - REQUIRED
- One-to-Many: `leads` (Lead[])

**Indexes**:
- `@@index([subAccountId])`
- `@@index([regularUserId])`
- `@@index([promptTemplateId])`

### Lead

**Purpose**: Potential customers and conversation participants

**Fields**:
```prisma
model Lead {
  id             Int       @id @default(autoincrement())
  regularUserId  Int       // REQUIRED
  strategyId     Int       // REQUIRED
  subAccountId   Int       // REQUIRED: Tenant isolation
  name           String
  email          String?
  phone          String?
  company        String?
  position       String?
  customId       String?
  timezone       String?   // IANA format
  messageHistory Json?     // Conversation history
  conversationState Json?  // Structured state tracking
  status         String    @default("lead")
  notes          String?   @db.Text
  lastMessage    String?   @db.Text
  lastMessageDate String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}
```

**Relationships**:
- Many-to-One: `regularUser` (User) - REQUIRED, cascade delete
- Many-to-One: `strategy` (Strategy) - REQUIRED, cascade delete
- Many-to-One: `subAccount` (SubAccount) - REQUIRED, cascade delete
- One-to-Many: `bookings` (Booking[])
- One-to-Many: `conversationMessages` (ConversationMessage[])

**Indexes**:
- None explicitly defined

### Booking

**Purpose**: Scheduled appointments and meetings

**Fields**:
```prisma
model Booking {
  id           Int      @id @default(autoincrement())
  regularUserId Int     // REQUIRED
  leadId       Int?     // Optional
  subAccountId Int      // REQUIRED: Tenant isolation
  bookingType  String
  details      Json     // Booking details (date, time, location, etc.)
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @default(now()) @updatedAt
}
```

**Relationships**:
- Many-to-One: `regularUser` (User) - REQUIRED, cascade delete
- Many-to-One: `lead` (Lead?) - Optional
- Many-to-One: `subAccount` (SubAccount) - REQUIRED, cascade delete

**Indexes**:
- None explicitly defined

### ContactSubmission

**Purpose**: Contact form submissions from website

**Fields**:
```prisma
model ContactSubmission {
  id          String   @id @default(cuid())
  fullName    String
  email       String
  phone       String
  services    String   // JSON string or enum
  message     String?
  source      String   @default("website")
  status      ContactStatus @default(NEW)
  priority    Priority @default(MEDIUM)
  submittedAt DateTime @default(now())
  updatedAt   DateTime @updatedAt
  followedUpAt DateTime?
  closedAt    DateTime?
  assignedToId Int?
  notes       Json?    // JSON array of notes
  subAccountId Int     // REQUIRED: Tenant isolation
}
```

**Relationships**:
- Many-to-One: `assignedTo` (User?) - Optional
- Many-to-One: `subAccount` (SubAccount) - REQUIRED

**Enums**:
- `ContactStatus`: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, CLOSED_WON, CLOSED_LOST, UNRESPONSIVE
- `Priority`: LOW, MEDIUM, HIGH, URGENT

**Table Name**: `contact_submissions` (custom mapping)

### FormTemplate

**Purpose**: Dynamic form definitions

**Fields**:
```prisma
model FormTemplate {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique // URL-friendly identifier
  description  String?  @db.Text
  isActive     Boolean  @default(true)
  schema       Json     // Form field definitions
  title        String
  subtitle     String?  @db.Text
  submitButtonText String @default("Submit")
  successMessage String @default("Thank you for your submission!")
  requiresWakeUp Boolean @default(true)
  wakeUpInterval Int     @default(30)
  subAccountId Int?     // Null = available to all
  createdAt    DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdByAdminId Int  // REQUIRED
}
```

**Relationships**:
- Many-to-One: `subAccount` (SubAccount?) - Optional (null = global)
- Many-to-One: `createdByAdmin` (AdminUser) - REQUIRED
- One-to-Many: `submissions` (FormSubmission[])

**Constraints**:
- `slug` is unique

**Table Name**: `form_templates` (custom mapping)

### FormSubmission

**Purpose**: Form submission data

**Fields**:
```prisma
model FormSubmission {
  id           String   @id @default(cuid())
  formTemplateId String // REQUIRED
  data         Json     // Form field values
  files        Json?    // File upload information
  ipAddress    String?
  userAgent    String?  @db.Text
  source       String   @default("website")
  status       String   @default("new")
  priority     Priority @default(MEDIUM)
  assignedToId Int?
  notes        Json?    // JSON array of notes
  submittedAt  DateTime @default(now())
  updatedAt    DateTime @updatedAt
  reviewedAt   DateTime?
  contactedAt  DateTime?
  subAccountId Int     // REQUIRED: Tenant isolation
}
```

**Relationships**:
- Many-to-One: `formTemplate` (FormTemplate) - REQUIRED
- Many-to-One: `assignedTo` (User?) - Optional
- Many-to-One: `subAccount` (SubAccount) - REQUIRED

**Table Name**: `form_submissions` (custom mapping)

## 4. Integration Models

### IntegrationTemplate

**Purpose**: Blueprint for external service integrations

**Fields**:
```prisma
model IntegrationTemplate {
  id                  Int       @id @default(autoincrement())
  name                String    // e.g., "GoHighLevel"
  displayName         String    // e.g., "GoHighLevel CRM"
  description         String?   @db.Text
  category            String    // e.g., "CRM"
  icon                String?
  isActive            Boolean   @default(true)
  configSchema        Json      // JSON schema for config
  setupInstructions   String?   @db.Text
  webhookUrl          String?
  apiVersion          String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  createdByAdminId    Int       // REQUIRED
}
```

**Relationships**:
- Many-to-One: `createdByAdmin` (AdminUser) - REQUIRED
- One-to-Many: `integrations` (Integration[])

### Integration

**Purpose**: Active integration instance for a SubAccount

**Fields**:
```prisma
model Integration {
  id                    Int       @id @default(autoincrement())
  subAccountId          Int       // REQUIRED: Tenant isolation
  integrationTemplateId Int       // REQUIRED
  name                  String
  description           String?   @db.Text
  isActive              Boolean   @default(false)
  config                Json      // Encrypted configuration
  status                String    @default("pending")
  lastSyncAt            DateTime?
  errorMessage          String?   @db.Text
  webhookSecret         String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdByAdminId      Int       // REQUIRED
}
```

**Relationships**:
- Many-to-One: `subAccount` (SubAccount) - REQUIRED, cascade delete
- Many-to-One: `integrationTemplate` (IntegrationTemplate) - REQUIRED
- Many-to-One: `createdByAdmin` (AdminUser) - REQUIRED

**Status Values**: `pending`, `active`, `error`, `disconnected`

### Integration Configuration

**Config Field Structure** (GoHighLevel example):
```typescript
{
  apiKey: string;           // Encrypted
  locationId: string;
  calendarId?: string;
  webhookUrl?: string;
  apiVersion?: string;
  baseUrl?: string;
  webhookId?: string;
  clientId?: string;        // Encrypted (OAuth)
  clientSecret?: string;    // Encrypted (OAuth)
}
```

## 5. System Models

### PromptTemplate

**Purpose**: Base prompt templates for AI agents

**Fields**:
```prisma
model PromptTemplate {
  id                  Int       @id @default(autoincrement())
  name                String
  description         String?   @db.Text
  category            String?
  baseSystemPrompt    String    @db.Text
  temperature         Float?    @default(0.7)
  maxTokens           Int?
  isActive            Boolean   @default(false)
  tags                String[]  @default([])
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  createdByAdminId    Int       // REQUIRED
}
```

**Relationships**:
- Many-to-One: `createdByAdmin` (AdminUser) - REQUIRED
- One-to-Many: `strategies` (Strategy[])
- One-to-Many: `subAccountTemplates` (SubAccountPromptTemplate[])

**Indexes**:
- `@@index([category])`
- `@@index([createdByAdminId])`

### SubAccountPromptTemplate

**Purpose**: SubAccount-specific prompt template selection

**Fields**:
```prisma
model SubAccountPromptTemplate {
  id               Int            @id @default(autoincrement())
  subAccountId     Int            // REQUIRED
  promptTemplateId Int            // REQUIRED
  isActive         Boolean        @default(false) // Only one active per subaccount
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}
```

**Relationships**:
- Many-to-One: `subAccount` (SubAccount) - REQUIRED, cascade delete
- Many-to-One: `promptTemplate` (PromptTemplate) - REQUIRED, cascade delete

**Constraints**:
- `@@unique([subAccountId, promptTemplateId])` - One selection per template per SubAccount

**Indexes**:
- `@@index([subAccountId, isActive])` - For finding active template

### SubAccountInvitation

**Purpose**: Invitation codes for joining SubAccounts

**Fields**:
```prisma
model SubAccountInvitation {
  id              String    @id @default(cuid())
  subAccountId    Int       // REQUIRED
  code            String    @unique
  password        String?   // Hashed password
  maxUses         Int?      // Null = unlimited
  currentUses     Int       @default(0)
  expiresAt       DateTime?
  isActive        Boolean   @default(true)
  createdByAdminId Int      // REQUIRED
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

**Relationships**:
- Many-to-One: `subAccount` (SubAccount) - REQUIRED, cascade delete
- Many-to-One: `createdByAdmin` (AdminUser) - REQUIRED

**Constraints**:
- `code` is unique

**Indexes**:
- `@@index([code])` - For fast lookup
- `@@index([subAccountId])` - For listing invitations

**Table Name**: `subaccount_invitations` (custom mapping)

## 6. Model Relationships

### One-to-Many Relationships

**AdminUser → SubAccount**:
- One admin creates many SubAccounts
- Foreign key: `SubAccount.createdByAdminId`
- No cascade delete

**SubAccount → User**:
- One SubAccount contains many users
- Foreign key: `User.subAccountId`
- Cascade delete: Deleting SubAccount deletes all users

**User → Strategy**:
- One user creates many strategies
- Foreign key: `Strategy.regularUserId`
- Cascade delete: Deleting user deletes all strategies

**Strategy → Lead**:
- One strategy generates many leads
- Foreign key: `Lead.strategyId`
- Cascade delete: Deleting strategy deletes all leads

**User → Lead**:
- One user owns many leads
- Foreign key: `Lead.regularUserId`
- Cascade delete: Deleting user deletes all leads

**SubAccount → Lead**:
- One SubAccount contains many leads
- Foreign key: `Lead.subAccountId`
- Cascade delete: Deleting SubAccount deletes all leads

**Lead → Booking**:
- One lead can have many bookings
- Foreign key: `Booking.leadId`
- No cascade delete (optional relationship)

**Lead → ConversationMessage**:
- One lead has many conversation messages
- Foreign key: `ConversationMessage.leadId`
- Cascade delete: Deleting lead deletes all messages

### Many-to-Many Relationships

**SubAccount ↔ PromptTemplate** (via SubAccountPromptTemplate):
- Many SubAccounts can select many PromptTemplates
- Junction table: `SubAccountPromptTemplate`
- Unique constraint: `[subAccountId, promptTemplateId]`

### Foreign Key Constraints

**Cascade Delete Rules**:
- `User.subAccountId` → Cascade (delete SubAccount deletes users)
- `Strategy.regularUserId` → Cascade (delete user deletes strategies)
- `Strategy.subAccountId` → Cascade (delete SubAccount deletes strategies)
- `Lead.regularUserId` → Cascade (delete user deletes leads)
- `Lead.strategyId` → Cascade (delete strategy deletes leads)
- `Lead.subAccountId` → Cascade (delete SubAccount deletes leads)
- `Booking.regularUserId` → Cascade (delete user deletes bookings)
- `Booking.subAccountId` → Cascade (delete SubAccount deletes bookings)
- `ConversationMessage.leadId` → Cascade (delete lead deletes messages)
- `SubAccountPromptTemplate.subAccountId` → Cascade
- `SubAccountPromptTemplate.promptTemplateId` → Cascade
- `SubAccountInvitation.subAccountId` → Cascade
- `Integration.subAccountId` → Cascade

**No Cascade Delete**:
- `SubAccount.createdByAdminId` → No cascade (admins persist)
- `User.createdByAdminId` → No cascade (admins persist)
- `Strategy.promptTemplateId` → No cascade (templates persist)
- `Booking.leadId` → No cascade (optional relationship)

## 7. Data Types & Constraints

### String Fields

**Standard Strings**:
- `String` - Variable length text
- `String @unique` - Unique constraint
- `String?` - Optional string

**Text Fields**:
- `String @db.Text` - Large text (unlimited length)
- Used for: descriptions, notes, long content

**Examples**:
```prisma
name            String      // Standard string
email           String      @unique // Unique string
description     String?     @db.Text // Optional large text
```

### JSON Fields

**JSON Type**:
- `Json` - JSON object/array
- `Json?` - Optional JSON

**Usage**:
- Configuration data
- Settings
- Metadata
- Message history
- Conversation state
- Form data
- File uploads
- Notes arrays

**Examples**:
```prisma
settings        Json?       // SubAccount settings
config          Json        // Integration config
messageHistory  Json?       // Lead conversation history
conversationState Json?     // Lead state tracking
details         Json        // Booking details
schema          Json        // Form template schema
data            Json        // Form submission data
```

### DateTime Fields

**Types**:
- `DateTime @default(now())` - Auto-set on creation
- `DateTime @updatedAt` - Auto-updated on modification
- `DateTime?` - Optional timestamp

**Examples**:
```prisma
createdAt       DateTime    @default(now())
updatedAt       DateTime    @updatedAt
lastLoginAt     DateTime?
expiresAt       DateTime?
```

### Boolean Fields

**Types**:
- `Boolean @default(true)` - Default true
- `Boolean @default(false)` - Default false
- `Boolean` - No default (must be provided)

**Examples**:
```prisma
isActive        Boolean     @default(true)
isActive        Boolean     @default(false)
requiresWakeUp  Boolean     @default(true)
```

### Unique Constraints

**Single Field Unique**:
```prisma
email           String      @unique
code            String      @unique
slug            String      @unique
```

**Composite Unique**:
```prisma
@@unique([email, accountType])  // AuthAttempt
@@unique([subAccountId, promptTemplateId])  // SubAccountPromptTemplate
```

### Indexes

**Single Field Indexes**:
```prisma
@@index([subAccountId])
@@index([regularUserId])
@@index([email, accountType, createdAt])
```

**Composite Indexes**:
```prisma
@@index([subAccountId, isActive])  // SubAccountPromptTemplate
@@index([userId, accountType, createdAt])  // PasswordHistory
```

**Purpose**:
- Speed up queries
- Optimize foreign key lookups
- Support filtering and sorting

## 8. Prisma Configuration

### Schema File Structure

**Location**: `prisma/schema.prisma`

**Sections**:
1. Generator configuration
2. Datasource configuration
3. Model definitions
4. Enum definitions

### Generators

**Configuration**:
```prisma
generator client {
  provider = "prisma-client-js"
}
```

**Output**: TypeScript client in `node_modules/.prisma/client`

### Datasource Configuration

**Configuration**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Environment Variable**: `DATABASE_URL`
- Format: `postgresql://user:password@host:port/database?schema=public`
- Supports connection pooling
- SSL configuration via query parameters

### Migration Strategy

**Migration Commands**:
- `npx prisma migrate dev` - Create migration in development
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma migrate reset` - Reset database (dev only)

**Migration Files**:
- Location: `prisma/migrations/`
- Format: `YYYYMMDDHHMMSS_migration_name/migration.sql`
- Auto-generated SQL

**Automatic Migrations**:
- PrismaService runs `prisma migrate deploy` on startup
- Ensures database is up-to-date
- Exits in production if migrations fail

## 9. Data Access Patterns

### PrismaService Usage

**Service**: `PrismaService` extends `PrismaClient`

**Initialization**:
```typescript
constructor() {
  super({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });
}
```

**Lifecycle**:
- `onModuleInit()` - Connect to database, run migrations
- `onModuleDestroy()` - Disconnect from database

### Query Patterns

**Find Many**:
```typescript
const leads = await prisma.lead.findMany({
  where: { subAccountId: 1 },
  include: { regularUser: true, strategy: true }
});
```

**Find Unique**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId }
});
```

**Create**:
```typescript
const lead = await prisma.lead.create({
  data: {
    name: 'John Doe',
    subAccountId: 1,
    regularUserId: 1,
    strategyId: 1
  }
});
```

**Update**:
```typescript
const updated = await prisma.lead.update({
  where: { id: leadId },
  data: { status: 'qualified' }
});
```

**Delete**:
```typescript
await prisma.lead.delete({
  where: { id: leadId }
});
```

### Include Patterns

**Single Relation**:
```typescript
const lead = await prisma.lead.findUnique({
  where: { id: leadId },
  include: {
    regularUser: true,
    strategy: true
  }
});
```

**Nested Relations**:
```typescript
const subAccount = await prisma.subAccount.findUnique({
  where: { id: subAccountId },
  include: {
    users: {
      include: {
        strategies: true
      }
    }
  }
});
```

**Select Specific Fields**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    name: true,
    email: true,
    subAccount: {
      select: {
        id: true,
        name: true
      }
    }
  }
});
```

### Transaction Handling

**Transaction Example**:
```typescript
await prisma.$transaction(async (tx) => {
  const lead = await tx.lead.create({
    data: { /* ... */ }
  });
  
  await tx.booking.create({
    data: {
      leadId: lead.id,
      /* ... */
    }
  });
  
  return lead;
});
```

**Isolation Levels**: Prisma uses database default (usually READ COMMITTED)

## 10. Migrations

### Migration System

**Prisma Migrate**:
- Schema-first migrations
- SQL generation from Prisma schema
- Version control for schema changes
- Rollback support

### Automatic Migrations

**PrismaService Implementation**:
```typescript
private async migrate() {
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
```

**Behavior**:
- Runs on application startup
- Exits in production if migrations fail
- Continues in development even if migrations fail

### Migration Files

**Location**: `prisma/migrations/`

**Structure**:
```
migrations/
  └── 20241108212037_init/
      └── migration.sql
```

**Naming**: `YYYYMMDDHHMMSS_description/`

### Migration Execution

**Development**:
```bash
npx prisma migrate dev --name add_new_field
```

**Production**:
```bash
npx prisma migrate deploy
```

**Reset** (dev only):
```bash
npx prisma migrate reset
```

## 11. Seed Data

### Seed Script

**Location**: `prisma/seed.ts` (if exists)

**Purpose**: Populate database with initial/default data

**Execution**:
```bash
npx prisma db seed
```

### Default Data

**ONBOARDING SubAccount**:
- ID: 1
- Name: "ONBOARDING"
- Purpose: Temporary SubAccount for new users

**System User**:
- ID: 1
- Email: `user@loctelli.com`
- Role: `system`
- Purpose: Used by admins for user-specific operations

### Seed Execution

**Manual**:
```bash
npx prisma db seed
```

**Automatic**: Not configured (manual execution only)

## 12. Indexes & Performance

### Indexed Fields

**Foreign Keys** (Auto-indexed by Prisma):
- `User.subAccountId`
- `Strategy.regularUserId`
- `Strategy.subAccountId`
- `Lead.regularUserId`
- `Lead.strategyId`
- `Lead.subAccountId`
- `Booking.regularUserId`
- `Booking.subAccountId`

**Explicit Indexes**:
- `Strategy`: `[subAccountId]`, `[regularUserId]`, `[promptTemplateId]`
- `PromptTemplate`: `[category]`, `[createdByAdminId]`
- `SubAccountPromptTemplate`: `[subAccountId, isActive]`
- `AuthAttempt`: `[email, accountType, createdAt]`, `[ipAddress, createdAt]`, `[success, createdAt]`
- `AccountLockout`: `[lockedUntil]`, `[email, accountType]`
- `PasswordHistory`: `[userId, accountType, createdAt]`
- `RefreshToken`: `[userId, accountType]`, `[expiresAt]`, `[tokenHash]`
- `SubAccountInvitation`: `[code]`, `[subAccountId]`

### Query Optimization

**Best Practices**:
1. Always filter by `subAccountId` for tenant-scoped queries
2. Use `select` to limit returned fields
3. Use `include` judiciously (avoid over-fetching)
4. Add indexes for frequently queried fields
5. Use transactions for related operations

**Example**:
```typescript
// ✅ Optimized
const leads = await prisma.lead.findMany({
  where: { subAccountId: 1, status: 'qualified' },
  select: { id: true, name: true, email: true },
  take: 100
});

// ❌ Not optimized
const leads = await prisma.lead.findMany({
  include: {
    regularUser: { include: { strategies: true } },
    strategy: { include: { regularUser: true } }
  }
});
```

### Performance Considerations

**JSON Fields**:
- Efficient for flexible data
- Can't be indexed directly
- Consider extracting frequently queried fields

**Large Text Fields**:
- Use `@db.Text` for unlimited length
- Consider full-text search for searchable content

**Cascade Deletes**:
- Efficient (handled by database)
- Be careful with large cascades (e.g., deleting SubAccount)

**Connection Pooling**:
- Configured via `DATABASE_URL`
- Prisma manages connection pool automatically

## 13. Data Validation

### Model-Level Validation

**Prisma Constraints**:
- `@unique` - Enforces uniqueness
- `@default()` - Provides default values
- `@id` - Primary key constraint
- Foreign key constraints

**Type Safety**:
- Prisma generates TypeScript types
- Compile-time validation
- Runtime type checking

### Database Constraints

**Foreign Key Constraints**:
- Enforced at database level
- Prevents orphaned records
- Cascade delete rules enforced

**Unique Constraints**:
- Enforced at database level
- Prevents duplicate values
- Composite unique constraints supported

**NOT NULL Constraints**:
- Required fields (non-optional)
- Enforced at database level

### Application-Level Validation

**DTO Validation**:
- Uses `class-validator`
- Validates before database operations
- Provides user-friendly error messages

**Example**:
```typescript
class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  
  @IsEmail()
  @IsOptional()
  email?: string;
  
  @IsString()
  @IsOptional()
  phone?: string;
}
```

**Service-Level Validation**:
- Business logic validation
- Permission checks
- Tenant isolation validation

---

**Status:** ✅ Complete - Ready for Review
