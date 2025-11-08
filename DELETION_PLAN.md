# Deletion Plan: Business Finder & SMS CRM Systems

## Overview
This document outlines the complete removal of:
1. **Business Finder System** - Business search functionality
2. **SMS CRM System** - SMS management and campaign system

---

## Phase 1: Database Models & Migrations

### Business Finder Models to Remove:
- `BusinessSearch` - Complete removal
- `ApiKey` - **PARTIAL**: Only remove entries where `service` is related to business finder (`google_places`, `yelp`, `openstreetmap`)
- `RateLimit` - **PARTIAL**: Only remove entries where `service` is `business_finder` or related services

### SMS CRM Models to Remove:
- `SmsMessage` - Complete removal
- `SmsCampaign` - Complete removal

### Database Relations to Update:
- Remove `businessSearches` relation from `SubAccount` model
- Remove `businessSearches` relation from `User` model
- Remove `smsMessages` relation from `SubAccount` model
- Remove `smsCampaigns` relation from `SubAccount` model
- Remove `smsMessages` relation from `User` model
- Remove `smsCampaigns` relation from `User` model
- Remove `apiKeys` relation from `User` model (if only used for business finder)
- Remove `rateLimits` relation from `User` model (if only used for business finder)

**Action**: Create Prisma migration to:
1. Drop foreign key constraints
2. Drop tables: `BusinessSearch`, `SmsMessage`, `SmsCampaign`
3. Clean up `ApiKey` and `RateLimit` tables (remove business finder related entries)
4. Update schema.prisma to remove models and relations

---

## Phase 2: Backend Removal

### Business Finder Backend Files to Delete:

**Module Directory**: `project/src/main-app/modules/finder/`
- `finder.module.ts` - Module definition
- `controllers/finder.controller.ts` - API controller
- `services/business-finder.service.ts` - Main service
- `services/google-places.service.ts` - Google Places integration
- `services/yelp.service.ts` - Yelp integration
- `services/openstreetmap.service.ts` - OpenStreetMap integration
- `services/rate-limit.service.ts` - Rate limiting service
- `services/export.service.ts` - Export functionality
- `dto/search-business.dto.ts` - DTOs
- `dto/export-results.dto.ts` - DTOs
- `entities/` - Any entity files (if exists)

**Module Registration**:
- Remove `FinderModule` import from `project/src/main-app/main-app.module.ts`
- Remove `FinderModule` from imports array

**Service Registry**:
- Remove BusinessFinderService registration from `finder.module.ts` (file will be deleted)
- Remove GooglePlacesService, YelpService, OpenStreetMapService, ExportService registrations

### SMS CRM Backend Files to Delete:

**Module Directory**: `project/src/main-app/modules/sms/`
- `sms.module.ts` - Module definition
- `sms.controller.ts` - API controller
- `sms.service.ts` - Service (if exists separately)

**Module Registration**:
- Remove `SmsModule` import from `project/src/main-app/main-app.module.ts`
- Remove `SmsModule` from imports array

**Note**: There's also `project/src/shared/sms/` - **DO NOT DELETE** this as it may be used by other systems (AI Receptionist)

---

## Phase 3: Frontend Removal

### Business Finder Frontend Files to Delete:

**Pages**:
- `my-app/app/admin/(main)/finder/page.tsx`

**Components**:
- `my-app/components/admin/finder/FinderDashboard.tsx`
- `my-app/components/admin/finder/SearchForm.tsx`
- `my-app/components/admin/finder/SearchResultsModal.tsx`
- `my-app/components/admin/finder/ResultsTable.tsx`
- `my-app/components/admin/finder/ExportDialog.tsx`
- `my-app/components/admin/finder/ApiKeyManager.tsx`
- Entire directory: `my-app/components/admin/finder/`

**API Client**:
- `my-app/lib/api/endpoints/finder.ts`
- Remove `FinderApi` import from `my-app/lib/api/index.ts`
- Remove `finder` property initialization from API client

### SMS CRM Frontend Files to Delete:

**Pages**:
- `my-app/app/admin/(main)/sms/page.tsx` - Main SMS dashboard
- `my-app/app/admin/(main)/sms/send/page.tsx` - Send SMS page
- `my-app/app/admin/(main)/sms/bulk/page.tsx` - Bulk SMS page
- `my-app/app/admin/(main)/sms/history/page.tsx` - SMS history page
- `my-app/app/admin/(main)/sms/settings/page.tsx` - SMS settings page
- `my-app/app/admin/(main)/sms/campaigns/page.tsx` - Campaigns list
- `my-app/app/admin/(main)/sms/campaigns/create/page.tsx` - Create campaign
- `my-app/app/admin/(main)/sms/campaigns/[id]/page.tsx` - Campaign details
- Entire directory: `my-app/app/admin/(main)/sms/`

**Components**:
- `my-app/components/sms/send-sms-form.tsx`
- `my-app/components/sms/bulk-sms-upload.tsx`
- `my-app/components/sms/message-composer.tsx`
- `my-app/components/sms/phone-number-input.tsx`
- `my-app/components/sms/sms-stats-cards.tsx`
- Entire directory: `my-app/components/sms/`

**API Client**:
- `my-app/lib/api/endpoints/sms.ts` (if exists)
- Remove SMS API imports from `my-app/lib/api/index.ts`

**Types**:
- `my-app/types/sms.ts` - **CHECK FIRST**: May be used by other systems

---

## Phase 4: Configuration & Constants

### Configuration Files:

**Remove from `project/src/main-app/infrastructure/config/configuration.ts`**:
- `businessFinder` configuration object (lines 37-47)
- `twilio` configuration - **CHECK**: May be used by other systems (AI Receptionist)

**Remove from `project/src/shared/constants/tenant.constants.ts`**:
- `/api/business-finder/*` from `blockedRoutes` array (line 30)
- `/api/sms/*` from `blockedRoutes` array (line 27)
- `canAccessBusinessFinder: false` from features object (line 42)
- `canSendSms: false` from features object (line 40)

---

## Phase 5: Navigation & UI References

### Dev Page (`my-app/app/admin/(main)/dev/page.tsx`):
- Remove "SMS Management" button (lines 145-152)
- Remove "Business Finder" button (lines 153-160)
- Remove unused imports: `Send`, `Search` from lucide-react

### Sidebar Navigation (`my-app/components/admin/sidebar.tsx`):
- **CHECK**: Verify no direct links to `/admin/finder` or `/admin/sms` exist
- Remove unused imports if any: `Send`, `Search`

---

## Phase 6: Documentation & References

### Files to Update:
- `README.md` - Remove Business Finder and SMS CRM mentions
- `AI_CONTEXT.md` - Remove Business Finder and SMS CRM references
- Any architecture documentation files

### Search for Additional References:
- Search codebase for: `business-finder`, `businessFinder`, `BusinessFinder`
- Search codebase for: `sms.*crm`, `SmsMessage`, `SmsCampaign`
- Check for any environment variable references: `GOOGLE_PLACES_API_KEY`, `YELP_API_KEY`

---

## Phase 7: Environment Variables (Optional Cleanup)

### Variables to Consider Removing:
- `GOOGLE_PLACES_API_KEY`
- `YELP_API_KEY`
- `API_KEY_ENCRYPTION_SECRET` (if only used for business finder)
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` - **CHECK FIRST**: May be used by AI Receptionist

---

## Execution Order

1. **Backup Database** (CRITICAL)
2. Create Prisma migration for database changes
3. Delete backend modules
4. Delete frontend pages/components
5. Remove module registrations
6. Remove API client code
7. Update configuration files
8. Update constants/permissions
9. Remove buttons from dev page
10. Clean up documentation
11. Test application for broken references
12. Run database migration
13. Verify no broken imports or references

---

## Important Notes

⚠️ **CRITICAL WARNINGS**:
- **DO NOT DELETE** `project/src/shared/sms/` - This is used by AI Receptionist
- **DO NOT DELETE** Twilio config if used by AI Receptionist
- **CHECK** `my-app/types/sms.ts` before deletion - may be used elsewhere
- **BACKUP DATABASE** before running migrations
- Test thoroughly after deletion to ensure no broken references

---

## Verification Checklist

After deletion, verify:
- [ ] No broken imports in backend
- [ ] No broken imports in frontend
- [ ] Application compiles successfully
- [ ] No 404 errors for deleted routes
- [ ] Database migration runs successfully
- [ ] No references in documentation
- [ ] Environment variables cleaned up (if desired)

