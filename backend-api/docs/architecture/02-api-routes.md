# API Routes Documentation

## Purpose
Comprehensive documentation of all API endpoints, their purposes, request/response formats, and usage patterns.

## 1. Route Organization

### Route Prefix Structure

The API follows a consistent route prefix structure:

- **`/auth/*`** - Authentication endpoints (public)
- **`/user/*`** - User management endpoints
- **`/lead/*`** - Lead management endpoints
- **`/strategy/*`** - Strategy management endpoints
- **`/booking/*`** - Booking management endpoints
- **`/chat/*`** - Chat and messaging endpoints
- **`/contacts/*`** - Contact management endpoints
- **`/forms/*`** - Dynamic form endpoints
- **`/subaccounts/*`** - User-facing SubAccount endpoints
- **`/admin/*`** - Admin-only endpoints
  - `/admin/subaccounts/*` - SubAccount management
  - `/admin/prompt-templates/*` - Prompt template management
  - `/admin/integration-templates/*` - Integration template management
  - `/admin/integrations/*` - Integration management
- **`/ai-receptionist/webhooks/*`** - AI Receptionist webhooks (public)
- **`/webhook/*`** - General webhook endpoints (public)
- **`/status/*`** - Health and status endpoints (public)
- **`/general/*`** - General utility endpoints

### Module-Based Routing

Routes are organized by NestJS modules, with each module having its own controller:

```
src/main-app/
├── controllers/          # Shared controllers
│   ├── unified-auth.controller.ts
│   └── admin-management.controller.ts
├── modules/               # Feature modules
│   ├── users/
│   ├── leads/
│   ├── strategies/
│   ├── bookings/
│   ├── chat/
│   ├── contacts/
│   ├── forms/
│   ├── subaccounts/
│   └── prompt-templates/
└── integrations/          # Integration modules
    └── ghl-integrations/
```

### Public vs Protected Routes

**Public Routes** (No authentication required):
- `/auth/*` - Authentication endpoints
- `/ai-receptionist/webhooks/*` - AI Receptionist webhooks
- `/webhook/*` - General webhooks
- `/status/*` - Health checks
- `/forms/public/*` - Public form endpoints
- `/chat/send_message` - Public chat endpoint
- `/chat/general` - General chat endpoint
- `/chat/initiate/:leadId` - Conversation initiation

**Protected Routes** (JWT authentication required):
- All other routes require valid JWT token
- Some routes require additional guards (AdminGuard, RolesGuard)

## 2. Authentication Routes

See [01-authentication.md](./01-authentication.md) for detailed authentication documentation.

**Base Path**: `/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | Public | Login user or admin |
| POST | `/auth/register` | Public | Register user or admin |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | JWT | Logout and revoke tokens |
| GET | `/auth/profile` | JWT | Get current user/admin profile |
| POST | `/auth/change-password` | JWT | Change password |

## 3. User Management Routes

**Base Path**: `/user`

**Controller**: `UsersController`  
**Location**: `src/main-app/modules/users/users.controller.ts`

### GET /user

Get all users or filter by userId/subAccountId.

**Authentication**: JWT required

**Query Parameters**:
- `userId` (optional) - Filter by specific user ID
- `subAccountId` (optional) - Filter by SubAccount ID (admin only)

**Response**:
```typescript
// Array of users
[
  {
    id: number;
    name: string;
    email: string;
    role: string;
    company?: string;
    budget?: string;
    subAccountId: number;
    isActive: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
  }
]
```

**Access Control**:
- Regular users: Can only view users in their own SubAccount
- Admins: Can view all users or filter by SubAccount

### GET /user/:id

Get user by ID.

**Authentication**: JWT required

**Access Control**:
- Regular users: Can only view their own profile
- Admins: Can view any user

### POST /user

Create a new user.

**Authentication**: JWT + RolesGuard (admin/super_admin)

**Request Body**:
```typescript
{
  name: string;
  email: string;
  password: string;
  company?: string;
  budget?: string;
  role?: string;
  subAccountId?: number;  // Required for admins
}
```

**Access Control**:
- Admins: Must provide `subAccountId` in request
- Regular users: Cannot create users (403 Forbidden)

### PATCH /user/:id

Update user.

**Authentication**: JWT required

**Request Body**:
```typescript
{
  name?: string;
  email?: string;
  company?: string;
  budget?: string;
  role?: string;
}
```

**Access Control**:
- Regular users: Can only update their own profile
- Admins: Can update any user

### DELETE /user/:id

Delete user (soft delete).

**Authentication**: JWT required

**Access Control**:
- Regular users: Can only delete their own account
- Admins: Can delete any user

### PATCH /user/:id/bookings-time

Update user's booking availability.

**Authentication**: JWT + RolesGuard (admin/super_admin)

**Request Body**:
```typescript
{
  bookingsTime: any;  // JSON structure for availability
}
```

### GET /user/:id/bookings-time

Get user's booking availability.

**Authentication**: JWT + RolesGuard (admin/super_admin)

### POST /user/import-ghl-users

Import users from GoHighLevel.

**Authentication**: JWT + RolesGuard (admin/super_admin)

## 4. SubAccount Routes

### Admin SubAccount Management

**Base Path**: `/admin/subaccounts`

**Controller**: `SubAccountsController`  
**Location**: `src/main-app/modules/subaccounts/subaccounts.controller.ts`

**Authentication**: JWT + AdminGuard + RolesGuard (admin/super_admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/subaccounts` | Create SubAccount |
| GET | `/admin/subaccounts` | Get all SubAccounts for admin |
| GET | `/admin/subaccounts/:id` | Get SubAccount by ID |
| PATCH | `/admin/subaccounts/:id` | Update SubAccount |
| DELETE | `/admin/subaccounts/:id` | Delete SubAccount |

### User-Facing SubAccount Endpoints

**Base Path**: `/subaccounts`

**Controller**: `UserSubAccountsController`  
**Location**: `src/main-app/modules/subaccounts/user-subaccounts.controller.ts`

**Authentication**: JWT required

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/subaccounts/create` | Create new SubAccount (for ONBOARDING users) |
| POST | `/subaccounts/join` | Join existing SubAccount (for ONBOARDING users) |
| GET | `/subaccounts/status` | Get onboarding status |
| POST | `/subaccounts/invitations` | Create invitation code (admin only) |
| GET | `/subaccounts/invitations/:code/validate` | Validate invitation code |
| GET | `/subaccounts/:subAccountId/invitations` | List invitations for SubAccount (admin only) |

**Request/Response Examples**:

**POST /subaccounts/create**:
```typescript
// Request
{
  name: string;
  description?: string;
}

// Response
{
  id: number;
  name: string;
  description?: string;
  // User moved from ONBOARDING to new SubAccount
}
```

**POST /subaccounts/join**:
```typescript
// Request
{
  invitationCode: string;
}

// Response
{
  success: true;
  subAccount: {
    id: number;
    name: string;
  };
  // User moved from ONBOARDING to target SubAccount
}
```

## 5. Strategy Routes

**Base Path**: `/strategy`

**Controller**: `StrategiesController`  
**Location**: `src/main-app/modules/strategies/strategies.controller.ts`

**Authentication**: JWT + AdminGuard

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/strategy` | Create strategy |
| GET | `/strategy` | Get all strategies (with filters) |
| GET | `/strategy/:id` | Get strategy by ID |
| PATCH | `/strategy/:id` | Update strategy |
| DELETE | `/strategy/:id` | Delete strategy |
| POST | `/strategy/:id/duplicate` | Duplicate strategy |

**Query Parameters** (GET /strategy):
- `userId` - Filter by user ID
- `subAccountId` - Filter by SubAccount ID (admin only)

**Request Body** (POST /strategy):
```typescript
{
  regularUserId?: number;      // Auto-set for regular users
  subAccountId?: number;        // Required for admins
  promptTemplateId: number;
  name: string;
  description?: string;
  tag?: string;
  industryContext?: string;
  aiName: string;
  aiRole: string;
  companyBackground?: string;
  conversationTone: string;
  communicationStyle?: string;
  qualificationQuestions: string;
  disqualificationRules?: string;
  objectionHandling: string;
  closingStrategy: string;
  bookingInstructions?: string;
  outputGuidelines?: string;
  prohibitedBehaviors?: string;
  metadata?: any;
  delayMin?: number;
  delayMax?: number;
}
```

**Access Control**:
- Regular users: Can only create/view strategies in their own SubAccount
- Admins: Can create/view strategies in any SubAccount (must provide `subAccountId`)

## 6. Lead Management Routes

**Base Path**: `/lead`

**Controller**: `LeadsController`  
**Location**: `src/main-app/modules/leads/leads.controller.ts`

**Authentication**: JWT + AdminGuard

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/lead` | Create lead |
| GET | `/lead` | Get all leads (with filters) |
| GET | `/lead/:id` | Get lead by ID |
| PATCH | `/lead/:id` | Update lead |
| DELETE | `/lead/:id` | Delete lead |
| POST | `/lead/:id/message` | Append message to lead |

**Query Parameters** (GET /lead):
- `userId` - Filter by user ID
- `strategyId` - Filter by strategy ID
- `subAccountId` - Filter by SubAccount ID (admin only)

**Request Body** (POST /lead):
```typescript
{
  regularUserId?: number;      // Auto-set for regular users
  subAccountId?: number;        // Required for admins
  strategyId: number;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  notes?: string;
  metadata?: any;
}
```

**Access Control**:
- Regular users: Can only create/view leads in their own SubAccount
- Admins: Can create/view leads in any SubAccount (must provide `subAccountId`)

## 7. Booking Routes

**Base Path**: `/booking`

**Controller**: `BookingsController`  
**Location**: `src/main-app/modules/bookings/bookings.controller.ts`

**Authentication**: JWT + AdminGuard

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/booking` | Create booking |
| GET | `/booking` | Get all bookings (with filters) |
| GET | `/booking/:id` | Get booking by ID |
| PATCH | `/booking/:id` | Update booking |
| PATCH | `/booking/:id/status` | Update booking status |
| DELETE | `/booking/:id` | Delete booking |
| POST | `/booking/populate-test-availability` | Populate test availability data (admin) |
| POST | `/booking/sync-ghl-availability` | Sync GHL availability (admin) |

**Query Parameters** (GET /booking):
- `userId` - Filter by user ID
- `leadId` - Filter by lead ID
- `subAccountId` - Filter by SubAccount ID (admin only)

**Request Body** (POST /booking):
```typescript
{
  regularUserId?: number;      // Auto-set for regular users
  subAccountId?: number;        // Required for admins
  leadId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status?: string;
  location?: string;
  metadata?: any;
}
```

## 8. Chat Routes

**Base Path**: `/chat`

**Controller**: `ChatController`  
**Location**: `src/main-app/modules/chat/chat.controller.ts`

**Authentication**: JWT (most endpoints), Public (some endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat/send` | JWT | Send message to lead |
| GET | `/chat/messages/:leadId` | JWT | Get message history for lead |
| PATCH | `/chat/messages/:messageId/read` | JWT | Mark message as read (TODO) |
| DELETE | `/chat/messages/:messageId` | JWT | Delete message (TODO) |
| GET | `/chat/unread-count/:leadId` | JWT | Get unread message count (TODO) |
| PATCH | `/chat/mark-all-read/:leadId` | JWT | Mark all messages as read (TODO) |
| POST | `/chat/send_message` | Public | Send message by custom ID |
| POST | `/chat/general` | Public | General chat endpoint |
| DELETE | `/chat/messages/lead/:leadId` | JWT | Clear chat history for lead |
| POST | `/chat/initiate/:leadId` | Public | Initiate AI conversation |

**Request Body** (POST /chat/send):
```typescript
{
  leadId: number;
  message: string;
  sender: 'user' | 'ai';
}
```

**Access Control**:
- Regular users: Can only access chats for their own leads
- Admins: Can access chats for any lead

## 9. Prompt Template Routes

**Base Path**: `/admin/prompt-templates`

**Controller**: `PromptTemplatesController`  
**Location**: `src/main-app/modules/prompt-templates/prompt-templates.controller.ts`

**Authentication**: JWT + RolesGuard (admin/super_admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/prompt-templates` | Create prompt template |
| GET | `/admin/prompt-templates` | Get all prompt templates |
| GET | `/admin/prompt-templates/active` | Get active prompt templates |
| GET | `/admin/prompt-templates/subaccount/:subAccountId` | Get templates for SubAccount |
| GET | `/admin/prompt-templates/:id` | Get template by ID |
| PATCH | `/admin/prompt-templates/:id` | Update template |
| PATCH | `/admin/prompt-templates/:id/activate` | Activate template for SubAccount |
| DELETE | `/admin/prompt-templates/:id` | Delete template |

**Request Body** (POST /admin/prompt-templates):
```typescript
{
  name: string;
  description?: string;
  content: string;
  category?: string;
  isActive?: boolean;
}
```

## 10. Integration Routes

### Integration Templates

**Base Path**: `/admin/integration-templates`

**Controller**: `IntegrationTemplatesController`  
**Location**: `src/main-app/integrations/modules/integration-templates/integration-templates.controller.ts`

**Authentication**: JWT + RolesGuard (admin/super_admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/integration-templates` | Create integration template |
| GET | `/admin/integration-templates` | Get all templates |
| GET | `/admin/integration-templates/active` | Get active templates |
| GET | `/admin/integration-templates/category/:category` | Get templates by category |
| GET | `/admin/integration-templates/:id` | Get template by ID |
| PATCH | `/admin/integration-templates/:id` | Update template |
| DELETE | `/admin/integration-templates/:id` | Delete template |

### Active Integrations

**Base Path**: `/admin/integrations`

**Controller**: `IntegrationsController`  
**Location**: `src/main-app/integrations/modules/integrations/integrations.controller.ts`

**Authentication**: JWT + RolesGuard (admin/super_admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/integrations` | Create integration |
| GET | `/admin/integrations` | Get all integrations |
| GET | `/admin/integrations/subaccount/:subAccountId` | Get integrations for SubAccount |
| GET | `/admin/integrations/status/:status` | Get integrations by status |
| GET | `/admin/integrations/:id` | Get integration by ID |
| PATCH | `/admin/integrations/:id` | Update integration |
| PATCH | `/admin/integrations/:id/status` | Update integration status |
| POST | `/admin/integrations/:id/test` | Test integration connection |
| POST | `/admin/integrations/:id/sync` | Sync integration data |
| DELETE | `/admin/integrations/:id` | Delete integration |
| POST | `/admin/integrations/:id/test-ghl-connection` | Test GHL connection |
| GET | `/admin/integrations/:id/ghl-locations` | Get GHL locations |
| POST | `/admin/integrations/:id/setup-ghl-webhook` | Setup GHL webhook |

**Query Parameters** (GET /admin/integrations):
- `subAccountId` - Filter by SubAccount ID

**Request Body** (POST /admin/integrations):
```typescript
{
  integrationTemplateId: number;
  subAccountId: number;
  name: string;
  config: any;  // Integration-specific configuration
  status?: 'active' | 'pending' | 'error' | 'disconnected';
}
```

## 11. Contact & Form Routes

### Contact Routes

**Base Path**: `/contacts`

**Controller**: `ContactsController`  
**Location**: `src/main-app/modules/contacts/contacts.controller.ts`

**Authentication**: JWT (most endpoints), Public (POST /contacts)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/contacts` | Public | Create contact submission |
| GET | `/contacts` | JWT | Get all contacts (with filters) |
| GET | `/contacts/stats` | JWT | Get contact statistics |
| GET | `/contacts/:id` | JWT | Get contact by ID |
| PATCH | `/contacts/:id` | JWT | Update contact |
| POST | `/contacts/:id/notes` | JWT | Add note to contact |

**Query Parameters** (GET /contacts):
- Filters via `ContactFiltersDto`

### Form Routes

**Base Path**: `/forms`

**Controller**: `FormsController`  
**Location**: `src/main-app/modules/forms/forms.controller.ts`

#### Form Templates (Admin Only)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/forms/templates` | JWT + Admin | Create form template |
| GET | `/forms/templates` | JWT + Admin | Get all form templates |
| GET | `/forms/templates/:id` | JWT + Admin | Get template by ID |
| PATCH | `/forms/templates/:id` | JWT + Admin | Update template |
| DELETE | `/forms/templates/:id` | JWT + Admin | Delete template |

#### Public Form Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/forms/public/ping` | Public | Database ping (keeps DB warm) |
| GET | `/forms/public/:slug` | Public | Get form template by slug |
| POST | `/forms/public/:slug/submit` | Public | Submit form |
| POST | `/forms/public/:slug/upload` | Public | Upload file for form |

#### Form Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/forms/submissions` | JWT | Get all form submissions |
| GET | `/forms/submissions/:id` | JWT | Get submission by ID |
| PATCH | `/forms/submissions/:id` | JWT | Update submission |
| DELETE | `/forms/submissions/:id` | JWT + Admin | Delete submission |

**Query Parameters** (GET /forms/submissions):
- `subAccountId` - Filter by SubAccount ID
- `formTemplateId` - Filter by form template ID
- `status` - Filter by status

## 12. AI Receptionist Routes

**Base Path**: `/ai-receptionist/webhooks`

**Controller**: `AIReceptionistWebhookController`  
**Location**: `src/main-app/modules/ai-receptionist/webhook.controller.ts`

**Authentication**: Public (webhook endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-receptionist/webhooks/health` | Health check |
| GET | `/ai-receptionist/webhooks/version` | Get AI Receptionist package version |
| POST | `/ai-receptionist/webhooks/voice` | Voice webhook (Twilio) |
| POST | `/ai-receptionist/webhooks/voice/continue` | Voice webhook continue (Twilio) |
| POST | `/ai-receptionist/webhooks/sms` | SMS webhook (Twilio) |
| POST | `/ai-receptionist/webhooks/email` | Email webhook (Postmark) |

**Webhook Payloads**:
- Voice/SMS: Twilio webhook format
- Email: Postmark webhook format

See [03-ai-receptionist.md](./03-ai-receptionist.md) for detailed webhook documentation.

## 13. GoHighLevel Integration Routes

**Base Path**: `/webhook` and `/highlevel/webhook/*`

**Controllers**: 
- `WebhooksController` - `src/main-app/integrations/ghl-integrations/webhooks/webhooks.controller.ts`
- `HighLevelWebhooksController` - `src/main-app/integrations/ghl-integrations/webhooks/highlevel-webhooks.controller.ts`

**Authentication**: Public (webhook endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhook` | General webhook receiver |
| POST | `/highlevel/webhook/*` | GHL-specific webhook endpoints |

**Webhook Events**:
- Contact created
- Outbound messages
- Custom events

## 14. Admin Management Routes

**Base Path**: `/admin`

**Controller**: `AdminManagementController`  
**Location**: `src/main-app/controllers/admin-management.controller.ts`

**Authentication**: JWT + RolesGuard

### User Management (Admin/Super Admin)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/admin/users` | admin, super_admin | Get all users |
| POST | `/admin/users` | admin, super_admin | Create user |
| PUT | `/admin/users/:id` | admin, super_admin | Update user |
| DELETE | `/admin/users/:id` | admin, super_admin | Delete user |

**Query Parameters** (GET /admin/users):
- `subaccountId` - Filter by SubAccount ID

### Admin Account Management (Super Admin Only)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/admin/accounts` | super_admin | Get all admin accounts |
| DELETE | `/admin/accounts/:id` | super_admin | Delete admin account |

### Auth Code Management (Super Admin Only)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/admin/auth-code/generate` | super_admin | Generate new auth code |
| GET | `/admin/auth-code/current` | super_admin | Get current auth code |

### Security Endpoints (Super Admin Only)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/admin/security/login-attempts/:email` | super_admin | Get login attempts for email |
| POST | `/admin/security/unlock/:email` | super_admin | Unlock account |

## 15. Status & Debug Routes

**Base Path**: `/status`

**Controller**: `StatusController`  
**Location**: `src/main-app/status/status.controller.ts`

**Authentication**: Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Basic application status |
| GET | `/status/health` | Detailed health check (database, Redis) |
| GET | `/status/version` | Application version |

**Response** (GET /status/health):
```typescript
{
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
  };
  uptime: number;
}
```

### General Routes

**Base Path**: `/general`

**Controller**: `GeneralController`  
**Location**: `src/main-app/general/general.controller.ts`

**Authentication**: JWT (most endpoints), Public (some endpoints)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/general` | Public | - | General GET endpoint |
| POST | `/general` | Public | - | General POST endpoint |
| GET | `/general/dashboard-stats` | JWT | admin, super_admin | Get dashboard statistics |
| GET | `/general/system-status` | JWT | admin, super_admin | Get system status |
| GET | `/general/recent-leads` | JWT | admin, super_admin | Get recent leads |
| GET | `/general/users/:id/detailed` | JWT | admin, super_admin | Get detailed user info |
| GET | `/general/leads/:id/detailed` | JWT | admin, super_admin | Get detailed lead info |
| GET | `/general/schema` | JWT | admin, super_admin | Get database schema |

## 16. Request/Response Patterns

### Standard Response Format

**Success Response** (200 OK):
```typescript
// Single resource
{
  id: number;
  // ... resource fields
}

// Array of resources
[
  {
    id: number;
    // ... resource fields
  }
]

// Action response
{
  success: true;
  message?: string;
  data?: any;
}
```

### Error Response Format

**Error Response** (4xx/5xx):
```typescript
{
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

**Common Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

### Pagination

Currently, most endpoints return all results. Pagination can be added via query parameters:

```
GET /resource?page=1&limit=20
```

### Filtering and Sorting

Filtering is done via query parameters:

```
GET /leads?userId=1&strategyId=2&subAccountId=3
```

Sorting can be added via query parameters:

```
GET /resource?sort=createdAt&order=desc
```

## 17. Rate Limiting

### Rate Limit Configuration

Rate limiting is configured via `@nestjs/throttler`:

**Global Default**: 10 requests per minute

**Per-Endpoint Limits** (configured via `@Throttle()` decorator):

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 1 minute |
| POST /auth/register | 3 | 1 minute |
| POST /auth/refresh | 10 | 1 minute |
| POST /auth/change-password | 3 | 1 minute |

### Rate Limit Headers

When rate limited, the response includes:

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

**Rate Limit Response** (429 Too Many Requests):
```typescript
{
  statusCode: 429;
  message: "ThrottlerException: Too Many Requests";
  error: "Too Many Requests";
}
```

---

**Status:** ✅ Complete - Ready for Review
