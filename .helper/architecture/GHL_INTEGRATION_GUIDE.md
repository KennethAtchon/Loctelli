# GoHighLevel (GHL) Integration Architecture

This document explains how the Loctelli CRM platform integrates with GoHighLevel (GHL), including data flow, webhook handling, and API interactions.

## Table of Contents

- [Overview](#overview)
- [Architecture Components](#architecture-components)
- [Data Models](#data-models)
- [Integration Flows](#integration-flows)
  - [1. Integration Setup Flow](#1-integration-setup-flow)
  - [2. Contact Created Webhook Flow](#2-contact-created-webhook-flow)
  - [3. Outbound Message Webhook Flow](#3-outbound-message-webhook-flow)
  - [4. API Operations Flow](#4-api-operations-flow)
- [Key Features](#key-features)
- [Security](#security)

---

## Overview

The GHL integration enables Loctelli to:
- **Sync locations (subaccounts)** from GHL to Loctelli
- **Receive webhook events** when contacts are created or messages are sent in GHL
- **Make API calls** to GHL for calendars, opportunities, appointments, and more
- **Multi-tenant architecture** where each Loctelli SubAccount can have its own GHL integration

---

## Architecture Components

### Backend Services

| Service | Location | Purpose |
|---------|----------|---------|
| **GhlService** | `backend-api/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts` | Legacy API client using axios |
| **GhlApiClientService** | `backend-api/src/main-app/integrations/ghl-integrations/ghl/ghl-api-client.service.ts` | Official GHL SDK client (`@gohighlevel/api-client`) |
| **WebhooksService** | `backend-api/src/main-app/integrations/ghl-integrations/webhooks/webhooks.service.ts` | Processes incoming GHL webhooks |
| **IntegrationsService** | `backend-api/src/main-app/integrations/modules/integrations/integrations.service.ts` | Manages integration CRUD operations |

### Controllers

| Controller | Endpoint | Purpose |
|------------|----------|---------|
| **WebhooksController** | `POST /webhook` | Generic webhook receiver |
| **HighLevelWebhooksController** | `POST /highlevel/webhook/*` | GHL-specific webhook endpoints |

### Key Dependencies

- **@gohighlevel/api-client** - Official GoHighLevel Node.js SDK
- **PrismaService** - Database ORM for PostgreSQL
- **EncryptionService** - Encrypts/decrypts sensitive config data (API keys)

---

## Data Models

### Integration Template

Defines the blueprint for a GHL integration.

```prisma
model IntegrationTemplate {
  id                  Int       @id @default(autoincrement())
  name                String    // "gohighlevel"
  displayName         String    // "GoHighLevel CRM"
  category            String    // "CRM"
  configSchema        Json      // Required fields schema
  setupInstructions   String?   // Markdown setup guide
  webhookUrl          String?   // Default webhook URL
  apiVersion          String?   // API version
  integrations        Integration[]
}
```

### Integration

An instance of a GHL integration for a specific SubAccount.

```prisma
model Integration {
  id                    Int       @id @default(autoincrement())
  subAccountId          Int       // Which Loctelli SubAccount owns this
  integrationTemplateId Int       // References IntegrationTemplate
  name                  String    // Custom name
  config                Json      // Encrypted GHL credentials
  status                String    // "pending", "active", "error"
  lastSyncAt            DateTime?
  errorMessage          String?
}
```

### Integration Config (JSON)

Stored in `Integration.config` field (encrypted):

```typescript
interface GhlIntegrationConfigDto {
  apiKey: string;           // Private Integration Token (encrypted)
  clientId?: string;        // OAuth Client ID (encrypted)
  clientSecret?: string;    // OAuth Client Secret (encrypted)
  locationId: string;       // GHL Location/Subaccount ID
  baseUrl?: string;         // API base URL (default: https://rest.gohighlevel.com)
  apiVersion?: string;      // API version (default: v1)
  webhookUrl?: string;      // Webhook callback URL
  webhookId?: string;       // GHL Webhook ID after setup
}
```

### Lead Model

Leads are created from GHL contacts.

```prisma
model Lead {
  id             Int       @id @default(autoincrement())
  customId       String?   // Maps to GHL Contact ID
  name           String
  email          String?
  phone          String?
  regularUserId  Int       // Owner user
  strategyId     Int       // AI strategy to use
  subAccountId   Int       // Tenant isolation
  messageHistory Json?     // Conversation history
  status         String    // "lead", "qualified", etc.
}
```

---

## Integration Flows

### 1. Integration Setup Flow

How an admin sets up a new GHL integration for a SubAccount.

```mermaid
sequenceDiagram
    actor Admin
    participant Frontend
    participant IntegrationsService
    participant EncryptionService
    participant Database
    participant GhlApiClientService
    participant GHL API

    Admin->>Frontend: Create GHL Integration
    Frontend->>IntegrationsService: POST /integrations (apiKey, locationId, subAccountId)

    IntegrationsService->>IntegrationsService: Validate IntegrationTemplate exists
    IntegrationsService->>IntegrationsService: Validate SubAccount exists

    IntegrationsService->>EncryptionService: Encrypt apiKey, clientId, clientSecret
    EncryptionService-->>IntegrationsService: Encrypted config

    IntegrationsService->>Database: Create Integration record
    Database-->>IntegrationsService: Integration created

    IntegrationsService-->>Frontend: Integration created (status: pending)

    Admin->>Frontend: Test Connection
    Frontend->>GhlApiClientService: testConnection(integrationId)

    GhlApiClientService->>Database: Fetch Integration
    Database-->>GhlApiClientService: Integration config

    GhlApiClientService->>EncryptionService: Decrypt apiKey
    EncryptionService-->>GhlApiClientService: Decrypted apiKey

    GhlApiClientService->>GhlApiClientService: Create HighLevel SDK client
    GhlApiClientService->>GHL API: GET /locations?limit=1
    GHL API-->>GhlApiClientService: Response (success/error)

    GhlApiClientService-->>Frontend: Connection test result

    Frontend->>IntegrationsService: Update status to "active"
    IntegrationsService->>Database: UPDATE Integration SET status='active'
```

**Key Steps:**
1. Admin provides GHL credentials (API key, location ID)
2. IntegrationsService validates template and subaccount
3. EncryptionService encrypts sensitive fields (API key)
4. Integration record created in database with status "pending"
5. GhlApiClientService tests connection by calling GHL API
6. If successful, status updated to "active"

---

### 2. Contact Created Webhook Flow

When a new contact is created in GHL, this webhook creates a Lead in Loctelli.

```mermaid
sequenceDiagram
    participant GHL
    participant HighLevelWebhooksController
    participant WebhooksService
    participant Database
    participant SalesBotService

    GHL->>HighLevelWebhooksController: POST /highlevel/webhook/contactcreated
    Note over GHL,HighLevelWebhooksController: Payload: {id, locationId, firstName, lastName, etc.}

    HighLevelWebhooksController->>WebhooksService: handleWebhook(type: 'contact.created', payload)

    WebhooksService->>Database: Find Integration by locationId
    Note over WebhooksService,Database: WHERE config->locationId = payload.locationId
    Database-->>WebhooksService: Integration + SubAccount

    WebhooksService->>Database: Find first User in SubAccount (role != admin)
    Database-->>WebhooksService: User record

    WebhooksService->>Database: Find first Strategy for User
    Database-->>WebhooksService: Strategy record (or default to ID 1)

    WebhooksService->>Database: Create Lead
    Note over WebhooksService,Database: {<br/>  customId: contactId,<br/>  name: firstName + lastName,<br/>  regularUserId,<br/>  strategyId,<br/>  subAccountId,<br/>  status: 'lead'<br/>}
    Database-->>WebhooksService: Lead created

    WebhooksService-->>HighLevelWebhooksController: {status: 'lead_created', lead: {...}}
    HighLevelWebhooksController-->>GHL: 200 OK
```

**Key Steps:**
1. GHL sends webhook to `/highlevel/webhook/contactcreated`
2. WebhooksService finds the Integration by matching `locationId` from payload
3. Retrieves the first non-admin User in the SubAccount
4. Retrieves the User's first Strategy (or defaults to ID 1)
5. Creates a new Lead with:
   - `customId` = GHL contact ID
   - `name` = First name + Last name
   - Links to User, Strategy, and SubAccount
6. Returns success response

**Important:** The `locationId` in the webhook payload is the key to routing the webhook to the correct Loctelli SubAccount.

---

### 3. Outbound Message Webhook Flow

When a message is sent from GHL (SMS, Email, Live Chat), this webhook triggers an AI response.

```mermaid
sequenceDiagram
    participant GHL
    participant HighLevelWebhooksController
    participant WebhooksService
    participant Database
    participant SalesBotService

    GHL->>HighLevelWebhooksController: POST /highlevel/webhook/outboundmessage
    Note over GHL,HighLevelWebhooksController: Payload: {contactId, messageType, body}

    HighLevelWebhooksController->>WebhooksService: handleWebhook(type: 'outbound.message', payload)

    WebhooksService->>WebhooksService: Validate messageType (SMS, Email, Live Chat, GMB)

    alt Invalid message type
        WebhooksService-->>HighLevelWebhooksController: {status: 'ignored', reason: 'Not supported'}
        HighLevelWebhooksController-->>GHL: 200 OK
    else Valid message type
        WebhooksService->>Database: Find Lead by customId (contactId)
        Database-->>WebhooksService: Lead record

        alt Lead not found
            WebhooksService-->>HighLevelWebhooksController: 404 Not Found
            HighLevelWebhooksController-->>GHL: 404 Error
        else Lead found
            WebhooksService->>WebhooksService: generateResponse(message, leadId)

            alt useDummyResponses = true
                WebhooksService->>WebhooksService: generateDummyResponse()
                WebhooksService-->>WebhooksService: Dummy message
            else useDummyResponses = false
                WebhooksService->>SalesBotService: generateResponse(message, leadId)
                SalesBotService->>SalesBotService: Load Lead, Strategy, AI context
                SalesBotService->>SalesBotService: Call OpenAI/Claude API
                SalesBotService-->>WebhooksService: AI-generated response
            end

            WebhooksService-->>HighLevelWebhooksController: {status: 'success', message: response}
            HighLevelWebhooksController-->>GHL: 200 OK
        end
    end
```

**Key Steps:**
1. GHL sends webhook to `/highlevel/webhook/outboundmessage`
2. WebhooksService validates `messageType` (only SMS, Email, Live Chat, GMB supported)
3. Finds Lead by `customId` (GHL contact ID)
4. Generates response:
   - **Dummy mode** (default): Returns canned response for testing
   - **AI mode**: Calls `SalesBotService.generateResponse()` for real AI response
5. Returns generated message

**Note:** Currently hardcoded to use dummy responses (`useDummyResponses = true`).

---

### 4. API Operations Flow

How Loctelli makes API calls to GHL (e.g., fetch calendars, create appointments).

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant GhlApiClientService
    participant EncryptionService
    participant Database
    participant GHL API

    User->>Frontend: Request GHL data (e.g., list calendars)
    Frontend->>GhlApiClientService: getCalendars(integrationId, locationId)

    GhlApiClientService->>Database: Fetch Integration by ID
    Database-->>GhlApiClientService: Integration config (encrypted)

    GhlApiClientService->>EncryptionService: Decrypt apiKey, clientId, clientSecret
    EncryptionService-->>GhlApiClientService: Decrypted credentials

    GhlApiClientService->>GhlApiClientService: Create HighLevel SDK client
    Note over GhlApiClientService: new HighLevel({<br/>  privateIntegrationToken: apiKey<br/>  OR<br/>  clientId, clientSecret, locationAccessToken<br/>})

    GhlApiClientService->>GHL API: client.calendars.getCalendars({locationId})
    GHL API-->>GhlApiClientService: Calendars data

    GhlApiClientService-->>Frontend: Calendars list
    Frontend-->>User: Display calendars
```

**Supported Operations:**

| Method | GHL Endpoint | Purpose |
|--------|--------------|---------|
| `searchLocations()` | `GET /locations` | List all locations/subaccounts |
| `getLocation()` | `GET /locations/{locationId}` | Get specific location details |
| `getCalendars()` | `GET /calendars` | List calendars for a location |
| `createAppointment()` | `POST /calendars/appointments` | Create new appointment |
| `createBlockSlot()` | `POST /calendars/block-slots` | Block time on calendar |
| `searchOpportunities()` | `GET /opportunities` | Search opportunities/deals |
| `getOpportunity()` | `GET /opportunities/{id}` | Get specific opportunity |
| `createOpportunity()` | `POST /opportunities` | Create new opportunity |

**Authentication Methods:**

1. **Private Integration Token** (recommended):
   ```typescript
   new HighLevel({ privateIntegrationToken: apiKey })
   ```

2. **OAuth** (for multi-location apps):
   ```typescript
   new HighLevel({
     clientId,
     clientSecret,
     locationAccessToken: apiKey
   })
   ```

---

## Key Features

### Multi-Tenant Architecture

- Each **SubAccount** can have multiple **Integrations**
- Each **Integration** is tied to a specific GHL **Location** (via `locationId`)
- Webhooks are routed to the correct SubAccount by matching `locationId` in the payload

### Encryption

- All sensitive config fields are encrypted before storage:
  - `apiKey`
  - `clientId`
  - `clientSecret`
- EncryptionService uses AES-256 encryption
- Decryption happens on-demand when making API calls

### Webhook Routing

```typescript
// Find integration by GHL locationId
const integration = await prisma.integration.findFirst({
  where: {
    config: {
      path: ['locationId'],
      equals: webhookPayload.locationId
    }
  },
  include: { subAccount: true }
});
```

This allows webhook events to automatically route to the correct Loctelli SubAccount.

### Dual API Clients

The system maintains two GHL API client services:

1. **GhlService** (Legacy)
   - Uses `axios` for raw HTTP requests
   - Good for custom endpoints or debugging
   - Located: [ghl.service.ts](../backend-api/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts)

2. **GhlApiClientService** (Recommended)
   - Uses official `@gohighlevel/api-client` SDK
   - Type-safe, auto-documented methods
   - Located: [ghl-api-client.service.ts](../backend-api/src/main-app/integrations/ghl-integrations/ghl/ghl-api-client.service.ts)

---

## Security

### Authentication

- Cookie-based JWT for frontend ↔ backend
- Bearer token for backend ↔ GHL API
- Webhook endpoints are public (`@Public()` decorator) but should validate signatures

### Webhook Signature Validation

Currently **not implemented**, but the infrastructure exists:

```typescript
@Post()
async handleWebhook(
  @Body() webhookEventDto: WebhookEventDto,
  @Headers('x-webhook-signature') signature?: string,
) {
  // TODO: Validate signature against webhookSecret
  if (signature) {
    webhookEventDto.signature = signature;
  }
  return this.webhooksService.handleWebhook(webhookEventDto);
}
```

**Recommendation:** Implement HMAC signature validation using `Integration.webhookSecret`.

### Rate Limiting

- User-level rate limits tracked in `RateLimit` model
- Consider implementing integration-level rate limits for GHL API calls

---

## Configuration

### Environment Variables

```bash
# Backend URL for webhooks
BACKEND_URL=http://localhost:8000

# Encryption key for sensitive data
ENCRYPTION_KEY=your-32-character-key

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/loctelli
```

### GHL Webhook Setup

1. **In GoHighLevel:**
   - Navigate to Settings → Integrations → Webhooks
   - Add webhook URL: `https://your-domain.com/highlevel/webhook/contactcreated`
   - Add webhook URL: `https://your-domain.com/highlevel/webhook/outboundmessage`
   - Select events: `Contact Created`, `Outbound Message`
   - Copy webhook secret for signature validation

2. **In Loctelli:**
   - Create Integration via admin panel
   - Paste GHL API key (Private Integration Token)
   - Paste GHL Location ID
   - Test connection
   - Activate integration

---

## Troubleshooting

### Webhook Not Received

1. Check GHL webhook configuration (correct URL, active status)
2. Verify `locationId` in Integration config matches GHL location
3. Check backend logs for incoming requests
4. Ensure webhook endpoints are public (no auth required)

### API Calls Failing

1. Verify API key is not expired
2. Check encryption/decryption is working correctly
3. Verify `locationId` has correct permissions
4. Check GHL API rate limits

### Lead Not Created from Contact

1. Verify Integration exists with matching `locationId`
2. Ensure SubAccount has at least one non-admin User
3. Verify User has at least one Strategy, or system will default to ID 1
4. Check database logs for errors

---

## Future Enhancements

- [ ] Implement webhook signature validation
- [ ] Add support for more GHL webhook events (Opportunity Created, Appointment Scheduled, etc.)
- [ ] Implement bidirectional sync (update GHL when Lead changes in Loctelli)
- [ ] Add webhook retry logic with exponential backoff
- [ ] Support for custom field mapping between GHL and Loctelli
- [ ] Real-time webhook status dashboard
- [ ] Integration health monitoring and alerts

---

## Related Files

### Core Services
- [ghl.service.ts](../backend-api/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts)
- [ghl-api-client.service.ts](../backend-api/src/main-app/integrations/ghl-integrations/ghl/ghl-api-client.service.ts)
- [webhooks.service.ts](../backend-api/src/main-app/integrations/ghl-integrations/webhooks/webhooks.service.ts)
- [integrations.service.ts](../backend-api/src/main-app/integrations/modules/integrations/integrations.service.ts)

### Controllers
- [webhooks.controller.ts](../backend-api/src/main-app/integrations/ghl-integrations/webhooks/webhooks.controller.ts)
- [highlevel-webhooks.controller.ts](../backend-api/src/main-app/integrations/ghl-integrations/webhooks/highlevel-webhooks.controller.ts)

### DTOs
- [webhook-event.dto.ts](../backend-api/src/main-app/integrations/ghl-integrations/webhooks/dto/webhook-event.dto.ts)
- [contact-created.dto.ts](../backend-api/src/main-app/integrations/ghl-integrations/webhooks/dto/contact-created.dto.ts)
- [outbound-message.dto.ts](../backend-api/src/main-app/integrations/ghl-integrations/webhooks/dto/outbound-message.dto.ts)
- [ghl-integration-config.dto.ts](../backend-api/src/main-app/integrations/ghl-integrations/dto/ghl-integration-config.dto.ts)

### Database
- [schema.prisma](../backend-api/prisma/schema.prisma) - Integration, IntegrationTemplate, Lead models

---

**Last Updated:** 2025-10-01
**Maintained By:** Development Team
