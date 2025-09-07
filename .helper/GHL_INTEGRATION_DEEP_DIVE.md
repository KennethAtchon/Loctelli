# GoHighLevel Integration Deep Dive & Implementation Plan

## Current State Analysis

### How GHL Integration Currently Works

#### 1. Database Architecture
The system uses a flexible integration architecture:

```
IntegrationTemplate (Template definitions)
    ↓ (one-to-many)
Integration (Per-subaccount instances)
    ↓ (belongs to)
SubAccount (Tenant isolation)
```

**Key Tables:**
- `IntegrationTemplate` - Defines GHL as an integration type with schema
- `Integration` - Actual GHL integration instance per subaccount
- `SubAccount` - Multi-tenant isolation layer

#### 2. Current Data Flow

**Webhook Processing Flow:**
1. **GHL sends webhook** → `POST /webhook` (Public endpoint)
2. **Webhook contains `locationId`** (GHL's subaccount identifier)
3. **System looks up integration** by searching `Integration.config.locationId`
4. **Finds associated SubAccount** through the integration relationship
5. **Creates Lead** in the correct tenant's data space
6. **Assigns to first user** in that subaccount
7. **Applies user's strategy** for AI processing

**Current Code Path:**
```
webhooks.controller.ts (receives webhook)
    ↓
webhooks.service.ts (processes webhook)
    ↓
handleContactCreated() - Line 48: Finds integration by locationId
    ↓
Creates Lead with correct subAccountId (Line 116)
```

#### 3. Current Problems

**Environment Dependency Issues:**
- `ghl.service.ts:10` - Hardcoded ENV API key: `process.env.GHL_API_KEY`
- No per-subaccount API key storage
- Single global GHL credentials for all tenants
- Cannot support multiple GHL accounts per platform

**Missing Integration Storage:**
- API keys not stored in `Integration.config`
- GHL API version not configurable per integration
- No per-tenant GHL credentials management

## The Problem We Need to Solve

### Current Issues
1. **Single API Key**: All subaccounts share one GHL API key from ENV
2. **No Tenant Isolation**: Cannot support multiple GHL agency accounts
3. **Hardcoded Configuration**: API version, base URL not configurable
4. **Frontend Limitation**: Cannot setup GHL integrations from frontend

### What We Want to Achieve
1. **Per-Subaccount GHL Integration**: Each subaccount has own GHL API key
2. **Frontend Integration Setup**: Complete GHL setup from admin panel
3. **Independent Operations**: No dependency on environment variables
4. **Secure Storage**: API keys stored encrypted in database

## Implementation Plan

### Phase 1: Update Integration Storage Model

#### 1.1 Update IntegrationTemplate for GHL
**File**: Database seeding/migration
**Action**: Ensure GHL template exists with proper schema

```json
{
  "name": "gohighlevel",
  "displayName": "GoHighLevel CRM",
  "category": "CRM",
  "configSchema": {
    "type": "object",
    "required": ["apiKey", "locationId"],
    "properties": {
      "apiKey": {
        "type": "string",
        "title": "GHL API Key",
        "description": "Your GoHighLevel API key"
      },
      "locationId": {
        "type": "string", 
        "title": "Location ID",
        "description": "GHL Location/Subaccount ID"
      },
      "apiVersion": {
        "type": "string",
        "default": "v1",
        "enum": ["v1", "v2"]
      },
      "baseUrl": {
        "type": "string",
        "default": "https://rest.gohighlevel.com"
      }
    }
  }
}
```

#### 1.2 Update Integration Config Structure
**Current Storage** (what we want in `Integration.config`):
```json
{
  "apiKey": "encrypted_ghl_api_key_per_subaccount",
  "locationId": "ghl_location_id_for_webhooks",
  "apiVersion": "v1",
  "baseUrl": "https://rest.gohighlevel.com",
  "calendarId": "optional_calendar_id",
  "webhookUrl": "optional_custom_webhook_url"
}
```

### Phase 2: Remove Environment Dependencies

#### 2.1 Update GhlService to Use Integration Config
**File**: `project/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`

**Current Code (Lines 9-11):**
```typescript
private readonly apiKey = process.env.GHL_API_KEY || 'your-api-key';
private readonly baseUrl = 'https://rest.gohighlevel.com/v1';
```

**New Implementation:**
```typescript
// Remove hardcoded ENV usage
async searchSubaccounts(integrationId: number): Promise<GhlSubaccountsResponse> {
  // Get integration config from database
  const integration = await this.prisma.integration.findUnique({
    where: { id: integrationId }
  });
  
  if (!integration) {
    throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
  }
  
  const config = integration.config as GhlIntegrationConfigDto;
  const apiKey = config.apiKey; // From database, not ENV
  const baseUrl = config.baseUrl || 'https://rest.gohighlevel.com';
  const apiVersion = config.apiVersion || 'v1';
  
  const response = await axios.get(`${baseUrl}/${apiVersion}/locations`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
}
```

#### 2.2 Add Integration Lookup Methods
**File**: `project/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`

```typescript
// New method to get integration by locationId (for webhooks)
async findIntegrationByLocationId(locationId: string) {
  return this.prisma.integration.findFirst({
    where: {
      config: {
        path: ['locationId'],
        equals: locationId
      }
    },
    include: {
      subAccount: true,
      integrationTemplate: true
    }
  });
}

// New method to perform GHL API calls with proper credentials
async makeGhlApiCall(integrationId: number, endpoint: string, method = 'GET', data?: any) {
  const integration = await this.prisma.integration.findUnique({
    where: { id: integrationId }
  });
  
  if (!integration) {
    throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
  }
  
  const config = integration.config as GhlIntegrationConfigDto;
  const baseUrl = config.baseUrl || 'https://rest.gohighlevel.com';
  const apiVersion = config.apiVersion || 'v1';
  
  return axios({
    method,
    url: `${baseUrl}/${apiVersion}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    data
  });
}
```

### Phase 3: Enhance Frontend Integration

#### 3.1 Update Integration Controller
**File**: `project/src/main-app/integrations/modules/integrations/integrations.controller.ts`

Add GHL-specific endpoints:
```typescript
// Test GHL connection for a specific integration
@Post(':id/test-ghl-connection')
async testGhlConnection(@Param('id') id: number) {
  return this.ghlService.testConnection(id);
}

// Fetch GHL locations for an integration
@Get(':id/ghl-locations')
async getGhlLocations(@Param('id') id: number) {
  return this.ghlService.searchSubaccounts(id);
}

// Setup GHL webhook for an integration
@Post(':id/setup-ghl-webhook')
async setupGhlWebhook(@Param('id') id: number, @Body() webhookConfig: any) {
  return this.ghlService.setupWebhook(id, webhookConfig);
}
```

#### 3.2 Add GHL Connection Testing
**File**: `project/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`

```typescript
async testConnection(integrationId: number): Promise<{success: boolean, message: string, data?: any}> {
  try {
    const response = await this.makeGhlApiCall(integrationId, '/locations');
    return {
      success: true,
      message: 'Successfully connected to GoHighLevel',
      data: {
        locationsCount: response.data.locations?.length || 0,
        apiVersion: response.headers['x-api-version'] || 'v1'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.response?.data?.message || error.message}`
    };
  }
}
```

### Phase 4: Webhook Flow Enhancement

#### 4.1 Current Webhook Flow (WORKING)
The current webhook flow is actually well-designed:

**File**: `project/src/main-app/integrations/ghl-integrations/webhooks/webhooks.service.ts:48-66`
```typescript
// This part is PERFECT - keep as is
const integration = await this.prisma.integration.findFirst({
  where: {
    config: {
      path: ['locationId'],
      equals: contactData.locationId // From GHL webhook
    }
  },
  include: {
    subAccount: true
  }
});
```

**No changes needed** - this lookup mechanism works perfectly for finding the right subaccount.

#### 4.2 Add Webhook Setup Method
**File**: `project/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`

```typescript
async setupWebhook(integrationId: number, webhookConfig: {events: string[]}) {
  const integration = await this.prisma.integration.findUnique({
    where: { id: integrationId }
  });
  
  const config = integration.config as GhlIntegrationConfigDto;
  const webhookUrl = config.webhookUrl || `${process.env.BACKEND_URL}/webhook`;
  
  // Register webhook with GHL API
  const response = await this.makeGhlApiCall(integrationId, '/webhooks', 'POST', {
    url: webhookUrl,
    events: webhookConfig.events
  });
  
  // Update integration with webhook ID
  await this.prisma.integration.update({
    where: { id: integrationId },
    data: {
      config: {
        ...config,
        webhookId: response.data.id
      }
    }
  });
  
  return response.data;
}
```

### Phase 5: Frontend Implementation

#### 5.1 Integration Setup Flow (Frontend)
**Location**: Frontend admin panel integration pages

**User Journey:**
1. **Admin creates GHL integration** → Select "GoHighLevel" template
2. **Enter GHL API key** → Validates and tests connection
3. **Select GHL location** → Dropdown populated from GHL API
4. **Configure webhook events** → Automatically sets up webhook
5. **Activate integration** → Starts receiving webhooks

#### 5.2 API Endpoints Needed (Already Mostly Exist)
- `POST /integrations` - Create integration (EXISTS)
- `PUT /integrations/:id` - Update integration (EXISTS) 
- `POST /integrations/:id/test-ghl-connection` - Test GHL API key (NEW)
- `GET /integrations/:id/ghl-locations` - Get GHL locations (NEW)
- `POST /integrations/:id/setup-ghl-webhook` - Setup webhook (NEW)

### Phase 6: Security & Data Migration

#### 6.1 API Key Encryption
**Implementation**: Encrypt API keys before storing in `Integration.config`

```typescript
// In integrations.service.ts
async create(createDto: CreateIntegrationDto, adminId: number) {
  // Encrypt sensitive config data before saving
  const encryptedConfig = this.encryptSensitiveConfig(createDto.config);
  
  return this.prisma.integration.create({
    data: {
      ...createDto,
      config: encryptedConfig,
      createdByAdminId: adminId,
    }
  });
}

private encryptSensitiveConfig(config: any) {
  // Encrypt apiKey field if present
  if (config.apiKey) {
    config.apiKey = this.encryptionService.encrypt(config.apiKey);
  }
  return config;
}
```

#### 6.2 Migration Strategy
**For existing installations using ENV variables:**

1. **Create migration script** to move ENV GHL_API_KEY to database
2. **Create default integration** for existing subaccounts
3. **Deprecate ENV usage** with backward compatibility
4. **Add configuration flag** to enable new vs legacy mode

## Implementation Priority

### Phase 1 (Essential - Week 1)
1. ✅ **Update GhlService** to support integration-based API keys
2. ✅ **Add integration lookup methods** for database-driven config
3. ✅ **Test webhook flow** continues working with new structure

### Phase 2 (Core Features - Week 2)  
1. ✅ **Add GHL connection testing** endpoints
2. ✅ **Add GHL locations fetching** endpoints
3. ✅ **Frontend integration setup** forms and flows

### Phase 3 (Polish - Week 3)
1. ✅ **Webhook setup automation** 
2. ✅ **API key encryption**
3. ✅ **Migration from ENV to database**

## Success Criteria

### ✅ When Implementation is Complete:
1. **No ENV dependency** - GHL works without GHL_API_KEY environment variable
2. **Per-subaccount GHL** - Each subaccount can have different GHL API keys
3. **Frontend setup** - Complete GHL integration setup from admin panel
4. **Webhook routing** - Webhooks correctly route to proper subaccount (already works)
5. **Secure storage** - API keys encrypted in database
6. **Multiple GHL accounts** - Platform can serve multiple GHL agency customers

### Current State: 70% Complete
- ✅ **Webhook routing by locationId** - Already working perfectly
- ✅ **Integration database structure** - Already exists  
- ✅ **Multi-tenant isolation** - Already working
- ❌ **ENV dependency removal** - Needs implementation
- ❌ **Frontend integration setup** - Needs implementation  
- ❌ **API key encryption** - Needs implementation

## Next Steps

1. **Start with Phase 1** - Update GhlService to use database config
2. **Test webhook flow** - Ensure existing functionality still works
3. **Add frontend endpoints** - Enable admin panel integration setup
4. **Implement frontend forms** - Complete user experience
5. **Add security layer** - Encrypt API keys
6. **Create migration** - Move existing users to new system

The foundation is already solid - we just need to remove the ENV dependency and add frontend management capabilities.