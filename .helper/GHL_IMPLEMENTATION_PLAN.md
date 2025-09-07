# GHL Integration Implementation Plan

## Goal
Make GHL integrations completely independent from environment variables with seamless frontend setup.

## Current State Analysis (85% Complete)

### ✅ What Already Works Perfectly
- **Webhook routing by locationId** - System correctly finds integration by `locationId` from webhook
- **Integration database structure** - `Integration` and `IntegrationTemplate` models exist and support per-tenant config storage
- **Multi-tenant isolation** - Webhooks route to correct subaccount automatically
- **Lead creation flow** - Webhooks create leads in proper tenant space
- **Frontend integration UI** - Complete UI exists for creating/managing integrations (`/admin/integrations/*`)
- **GHL Integration Template** - Predefined GoHighLevel template with proper config schema exists in seed data
- **Per-subaccount API keys** - System already supports storing different credentials per tenant via `config` JSON field
- **Backend integration service** - Full CRUD operations exist for integrations with status management

### ❌ What Needs Implementation
- **ENV dependency removal** - `ghl.service.ts` still uses `process.env.GHL_API_KEY`
- **API key encryption** - Sensitive data not encrypted in database (stored as plain JSON)
- **GHL-specific API endpoints** - Missing test connection, location fetching, webhook setup endpoints

## Implementation Phases

### Phase 1: Remove ENV Dependencies (Priority: HIGH)
**Estimated Time: 2-3 hours**

#### Tasks:
1. **Update `ghl.service.ts`**
   - Remove hardcoded `process.env.GHL_API_KEY` (line 10)
   - Add method to get integration config from database
   - Update `searchSubaccounts()` to accept `integrationId` parameter

2. **Add Integration Lookup Methods**
   - `findIntegrationByLocationId(locationId: string)` - for webhooks
   - `makeGhlApiCall(integrationId: number, endpoint: string)` - for API calls
   - `testConnection(integrationId: number)` - for validation

3. **Integration Config Schema** (already exists in seed data):
   ```json
   {
     "apiKey": "ghl_api_key_per_subaccount",
     "locationId": "ghl_location_id"
   }
   ```

#### Files to Modify:
- `project/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`
- `project/src/main-app/integrations/ghl-integrations/dto/ghl-integration-config.dto.ts` (minor updates)

### Phase 2: Add Backend API Endpoints (Priority: HIGH)  
**Estimated Time: 2-3 hours**

#### New Endpoints Needed:
```typescript
// Test GHL API key connection
POST /integrations/:id/test-ghl-connection

// Fetch available GHL locations for dropdown
GET /integrations/:id/ghl-locations  

// Setup GHL webhook automatically
POST /integrations/:id/setup-ghl-webhook
```

#### Files to Modify:
- `project/src/main-app/integrations/modules/integrations/integrations.controller.ts`
- `project/src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`

### Phase 3: Frontend Integration Enhancements (Priority: LOW)
**Estimated Time: 1-2 hours**

#### Minor Enhancements Needed:
1. **GHL-Specific Features** (already works via generic form)
   - Enhanced GHL location dropdown (if needed)
   - Better connection testing UI feedback
   - GHL-specific setup instructions display

2. **Webhook URL Display**
   - Show webhook endpoint for manual GHL configuration
   - Copy-to-clipboard functionality

**Note**: The frontend integration setup already exists and fully works. Users can:
- Select GoHighLevel from templates ✅
- Enter API key and location ID via config form ✅ 
- Test connection (backend needs implementation) ⚠️
- Save and activate integration ✅

#### Files to Modify (Optional):
- Minor enhancements to existing integration pages

### Phase 4: Security & Encryption (Priority: MEDIUM)
**Estimated Time: 2-3 hours**

#### Security Enhancements:
1. **API Key Encryption**
   - Encrypt `config.apiKey` before database storage
   - Decrypt when making GHL API calls

2. **Webhook Secret Validation**
   - Validate webhook signatures from GHL
   - Store webhook secrets securely

#### Files to Modify:
- `project/src/main-app/integrations/modules/integrations/integrations.service.ts`
- Add encryption service for sensitive data

### Phase 5: Testing & Deployment (Priority: LOW)
**Estimated Time: 1 hour**

#### Testing Tasks:
1. **System Testing**
   - Test webhook flow with new database-driven system
   - Verify multi-tenant isolation still works
   - Test end-to-end integration setup flow

2. **ENV Cleanup**
   - Remove `GHL_API_KEY` from all ENV files and documentation
   - Update deployment scripts to not require GHL env vars

## Technical Implementation Details

### Database Changes Needed
**None required** - All database structure already exists:
- ✅ `Integration` model supports `config` JSON field for per-tenant API keys
- ✅ `IntegrationTemplate` model exists with GHL template in seed data
- ✅ Multi-tenant isolation via `subAccountId` already implemented

### Key Code Changes

#### Before (Current):
```typescript
// ghl.service.ts line 10
private readonly apiKey = process.env.GHL_API_KEY || 'your-api-key';
```

#### After (Target):
```typescript
async searchSubaccounts(integrationId: number) {
  const integration = await this.prisma.integration.findUnique({
    where: { id: integrationId }
  });
  const config = integration.config as GhlIntegrationConfigDto;
  const apiKey = config.apiKey; // From database
  // ... rest of implementation
}
```

## Success Criteria

### ✅ When Implementation is Complete:
1. **No ENV dependency** - GHL works without `GHL_API_KEY` environment variable
2. ✅ **Per-subaccount GHL** - Each subaccount can have different GHL credentials (already works)
3. ✅ **Frontend setup** - Complete GHL integration setup from admin panel (already works)
4. ✅ **Webhook routing** - Webhooks still route correctly (already works)
5. **Secure storage** - API keys encrypted in database
6. ✅ **Multi-tenant support** - Platform can serve multiple GHL agency customers (already works)

## Risk Assessment

### Low Risk Areas:
- **Webhook routing** - Already working, no changes needed
- **Database structure** - Integration tables already exist
- **Multi-tenancy** - Isolation already implemented

### Medium Risk Areas:
- **API key storage** - Need to ensure secure encryption
- **Frontend forms** - Standard CRUD operations
- **Backend endpoints** - Straightforward API additions

### High Risk Areas:
- **Clean break transition** - Complete removal of ENV dependency without fallback

## Next Steps (Recommended Order)

1. **Start with Phase 1** - Remove ENV dependency in `ghl.service.ts` (2-3 hours)
2. **Add Phase 2 endpoints** - Enable API key testing and location fetching (2-3 hours)
3. **Add Phase 4 security** - Encrypt sensitive data (2-3 hours)
4. **Phase 5 testing** - Clean break testing and ENV cleanup (1 hour)
5. **Optional Phase 3** - Minor frontend enhancements (1-2 hours)

**Total Estimated Time: 8-11 hours**

## Summary of Findings

**The system is 85% complete!** Most infrastructure already exists:

✅ **Already Working:**
- Complete frontend UI for integration management
- Database models support per-tenant config storage
- GHL integration template with proper schema exists
- Multi-tenant isolation and webhook routing
- Full CRUD operations for integrations

⚠️ **Needs Implementation:**
- Remove ENV dependency from `ghl.service.ts`
- Add API key encryption 
- Implement GHL-specific API endpoints (test connection, location fetching)

The original plan significantly overestimated the required work. The foundation is much more complete than initially assessed.