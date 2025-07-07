# Integrations Feature Plan

## Overview
We're adding a comprehensive integrations system to Loctelli CRM that will allow subaccounts to connect with external services like GoHighLevel, Facebook, and other platforms. This feature will be subaccount-specific and follow a similar pattern to the existing prompt templates system.

## Database Schema Design

### Two-Table Approach (Recommended)

#### 1. Integration Template Table (`IntegrationTemplate`)
This table stores the available integration types and their base configuration schemas.

```sql
model IntegrationTemplate {
  id              Int       @id @default(autoincrement())
  name            String    // e.g., "GoHighLevel", "Facebook Ads", "Google Analytics"
  displayName     String    // e.g., "GoHighLevel CRM", "Facebook Advertising"
  description     String?   @db.Text
  category        String    // e.g., "CRM", "Advertising", "Analytics", "Social Media"
  icon            String?   // Icon identifier or URL
  isActive        Boolean   @default(true)
  configSchema    Json      // JSON schema defining required/optional fields
  setupInstructions String? @db.Text // Markdown instructions for setup
  webhookUrl      String?   // Default webhook URL if applicable
  apiVersion      String?   // API version supported
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdByAdminId Int
  createdByAdmin  AdminUser @relation(fields: [createdByAdminId], references: [id])
  integrations    Integration[] // Subaccount integrations using this template
}
```

#### 2. Integration Table (`Integration`)
This table stores the actual integrations configured for each subaccount.

```sql
model Integration {
  id                    Int       @id @default(autoincrement())
  subAccountId          Int       // Required: Integration belongs to a SubAccount
  subAccount            SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  integrationTemplateId Int
  integrationTemplate   IntegrationTemplate @relation(fields: [integrationTemplateId], references: [id])
  name                  String    // Custom name for this integration instance
  description           String?   @db.Text
  isActive              Boolean   @default(false)
  config                Json      // Integration-specific configuration
  status                String    @default("pending") // pending, active, error, disconnected
  lastSyncAt            DateTime?
  errorMessage          String?   @db.Text
  webhookSecret         String?   // For webhook verification
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  createdByAdminId      Int
  createdByAdmin        AdminUser @relation(fields: [createdByAdminId], references: [id])
}
```

### Updated SubAccount Model
Add the integrations relationship to the existing SubAccount model:

```sql
model SubAccount {
  // ... existing fields ...
  integrations    Integration[] // Add this line
}
```

### Updated AdminUser Model
Add the relationships to the existing AdminUser model:

```sql
model AdminUser {
  // ... existing fields ...
  integrationTemplates IntegrationTemplate[] // Add this line
  integrations         Integration[] // Add this line
}
```

## Integration Types & Configurations

### 1. GoHighLevel Integration
```json
{
  "name": "GoHighLevel",
  "displayName": "GoHighLevel CRM",
  "category": "CRM",
  "configSchema": {
    "type": "object",
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "API Key",
        "description": "Your GoHighLevel API key"
      },
      "locationId": {
        "type": "string",
        "title": "Location ID",
        "description": "Your GoHighLevel location ID"
      },
      "calendarId": {
        "type": "string",
        "title": "Calendar ID",
        "description": "Calendar ID for booking integration"
      },
      "webhookUrl": {
        "type": "string",
        "title": "Webhook URL",
        "description": "Webhook URL for real-time updates"
      }
    },
    "required": ["apiKey", "locationId"]
  }
}
```

### 2. Facebook Ads Integration
```json
{
  "name": "FacebookAds",
  "displayName": "Facebook Advertising",
  "category": "Advertising",
  "configSchema": {
    "type": "object",
    "properties": {
      "accessToken": {
        "type": "string",
        "title": "Access Token",
        "description": "Facebook App access token"
      },
      "adAccountId": {
        "type": "string",
        "title": "Ad Account ID",
        "description": "Facebook Ad Account ID"
      },
      "pageId": {
        "type": "string",
        "title": "Page ID",
        "description": "Facebook Page ID for messaging"
      }
    },
    "required": ["accessToken", "adAccountId"]
  }
}
```

### 3. Google Analytics Integration
```json
{
  "name": "GoogleAnalytics",
  "displayName": "Google Analytics",
  "category": "Analytics",
  "configSchema": {
    "type": "object",
    "properties": {
      "serviceAccountKey": {
        "type": "string",
        "title": "Service Account Key",
        "description": "Google Service Account JSON key"
      },
      "propertyId": {
        "type": "string",
        "title": "Property ID",
        "description": "Google Analytics Property ID"
      }
    },
    "required": ["serviceAccountKey", "propertyId"]
  }
}
```

## Frontend Implementation

### 1. Admin Integrations Page (`/admin/integrations`)
Following the prompt templates pattern, create a page that shows:

- **Integration Templates Grid**: Cards for each available integration type
- **Setup Status**: Shows which integrations are configured for the current subaccount
- **Quick Actions**: "Setup Integration" buttons for each type

### 2. Integration Setup Flow
Similar to prompt templates, but more complex:

1. **Template Selection**: User clicks "Setup Integration" on a template card
2. **Configuration Form**: Dynamic form generated from the template's `configSchema`
3. **Validation**: Client and server-side validation of configuration
4. **Testing**: Test the connection before saving
5. **Activation**: Mark as active and start syncing

### 3. Integration Management
- **List View**: Show all integrations for the subaccount
- **Status Indicators**: Active, pending, error states
- **Edit/Reconfigure**: Update integration settings
- **Deactivate/Delete**: Remove integrations
- **Sync Status**: Show last sync time and status

## Backend Implementation

### 1. API Endpoints

#### Integration Templates
```typescript
// GET /api/integration-templates
// POST /api/integration-templates
// GET /api/integration-templates/:id
// PUT /api/integration-templates/:id
// DELETE /api/integration-templates/:id
```

#### Subaccount Integrations
```typescript
// GET /api/integrations (filtered by subaccount)
// POST /api/integrations
// GET /api/integrations/:id
// PUT /api/integrations/:id
// DELETE /api/integrations/:id
// POST /api/integrations/:id/test
// POST /api/integrations/:id/sync
```

### 2. Service Layer
- **IntegrationTemplateService**: Manage available integration types
- **IntegrationService**: Handle subaccount-specific integrations
- **IntegrationSyncService**: Handle data synchronization
- **WebhookService**: Process incoming webhooks

### 3. Integration Handlers
Each integration type will have its own handler:

```typescript
interface IntegrationHandler {
  validateConfig(config: any): Promise<boolean>;
  testConnection(config: any): Promise<boolean>;
  syncData(integration: Integration): Promise<void>;
  processWebhook(payload: any, integration: Integration): Promise<void>;
}
```

## UI/UX Design

### 1. Integration Cards Layout
```
┌─────────────────────────────────────┐
│ [Icon] GoHighLevel CRM              │
│ Connect your GoHighLevel account    │
│ to sync contacts and bookings       │
│                                     │
│ Status: Not Configured              │
│ [Setup Integration] [Learn More]    │
└─────────────────────────────────────┘
```

### 2. Setup Wizard
- **Step 1**: Integration overview and requirements
- **Step 2**: Configuration form (dynamic based on schema)
- **Step 3**: Connection testing
- **Step 4**: Confirmation and activation

### 3. Integration Dashboard
- **Status Overview**: All integrations at a glance
- **Recent Activity**: Last sync times, errors, etc.
- **Quick Actions**: Sync now, edit, deactivate

## Security Considerations

### 1. Configuration Storage
- Encrypt sensitive configuration data (API keys, tokens)
- Use environment-specific encryption keys
- Implement key rotation

### 2. Webhook Security
- Validate webhook signatures
- Rate limiting on webhook endpoints
- IP whitelisting for trusted sources

### 3. Access Control
- Subaccount-scoped access to integrations
- Admin-only access to integration templates
- Audit logging for integration changes

## Implementation Phases

### Phase 1: Foundation
1. Database schema implementation
2. Basic CRUD operations for integration templates
3. Basic CRUD operations for integrations
4. Simple integration page UI

### Phase 2: GoHighLevel Integration
1. GoHighLevel integration template
2. Configuration form and validation
3. Basic connection testing
4. Contact/lead sync functionality

### Phase 3: Additional Integrations
1. Facebook Ads integration
2. Google Analytics integration
3. Webhook processing
4. Advanced sync features

### Phase 4: Advanced Features
1. Integration health monitoring
2. Automated sync scheduling
3. Error handling and retry logic
4. Integration analytics and reporting

## File Structure

```
project/src/modules/
├── integration-templates/
│   ├── dto/
│   │   ├── create-integration-template.dto.ts
│   │   └── update-integration-template.dto.ts
│   ├── integration-templates.controller.ts
│   ├── integration-templates.module.ts
│   ├── integration-templates.service.ts
│   └── handlers/
│       ├── gohighlevel.handler.ts
│       ├── facebook-ads.handler.ts
│       └── google-analytics.handler.ts
└── integrations/
    ├── dto/
    │   ├── create-integration.dto.ts
    │   └── update-integration.dto.ts
    ├── integrations.controller.ts
    ├── integrations.module.ts
    ├── integrations.service.ts
    └── sync/
        ├── integration-sync.service.ts
        └── webhook.service.ts

my-app/app/admin/(main)/integrations/
├── page.tsx
├── new/
│   └── page.tsx
└── [id]/
    ├── edit/
    │   └── page.tsx
    └── page.tsx

my-app/lib/api/endpoints/
├── integration-templates.ts
└── integrations.ts
```

## Migration Strategy

1. **Add new tables** without breaking existing functionality
2. **Create seed data** for initial integration templates
3. **Implement backend APIs** with proper error handling
4. **Build frontend components** following existing patterns
5. **Test thoroughly** with each integration type
6. **Deploy incrementally** starting with GoHighLevel

## Success Metrics

- **Integration Setup Success Rate**: >90% of users complete setup
- **Sync Reliability**: >95% successful sync operations
- **User Adoption**: >60% of subaccounts use at least one integration
- **Error Resolution**: <24 hours for integration issues

This plan provides a solid foundation for building a robust, scalable integrations system that follows the existing patterns in the Loctelli CRM codebase while providing the flexibility needed for various third-party integrations. 