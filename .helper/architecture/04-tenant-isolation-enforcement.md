# Tenant Isolation Enforcement

## Overview

This document describes the automatic tenant isolation enforcement system implemented in the Loctelli platform to prevent accidental data leakage between subaccounts.

## Problem

In a multi-tenant system, the biggest security risk is accidentally exposing one tenant's data to another. The manual approach of adding `subAccountId` filters to every query is error-prone:

```typescript
// ❌ DANGEROUS - Returns data from ALL tenants
const leads = await prisma.lead.findMany();

// ✅ SAFE - Filtered by tenant
const leads = await prisma.lead.findMany({
  where: { subAccountId: user.subAccountId }
});
```

**The problem**: Developers can forget to add the filter, especially under time pressure.

## Solution: Multi-Layered Defense

### Layer 1: Prisma Middleware (Warning Mode)

**File**: [backend-api/src/main-app/infrastructure/prisma/prisma.service.ts](../../backend-api/src/main-app/infrastructure/prisma/prisma.service.ts)

The PrismaService now includes middleware that:
- **Monitors** all queries to tenant-scoped models
- **Logs warnings** when queries lack `subAccountId` filters
- **Logs errors** when create/update operations lack `subAccountId`
- **Does NOT block** operations (allows debugging)

**Tenant-scoped models**:
- User
- Strategy
- Lead
- Booking
- Integration
- SmsMessage
- SmsCampaign
- BusinessSearch
- ContactSubmission
- FormTemplate
- FormSubmission
- SubAccountPromptTemplate

**Example log output**:
```
⚠️ Query on Lead without subAccountId filter. This may expose data across tenants. Action: findMany
❌ SECURITY VIOLATION: Attempting to create Lead without subAccountId!
```

### Layer 2: Strict Mode (Production)

Enable strict mode to **throw errors** instead of warnings:

```typescript
// In main.ts or app initialization
const prismaService = app.get(PrismaService);

if (process.env.NODE_ENV === 'production') {
  prismaService.enableStrictTenantMode();
}
```

With strict mode enabled:
- ❌ Queries without `subAccountId` **throw errors**
- ❌ Creates without `subAccountId` **throw errors**
- ❌ Application crashes if isolation is violated

This forces developers to fix issues before they reach production.

### Layer 3: TenantIsolationGuard (HTTP Layer)

**File**: [backend-api/src/main-app/infrastructure/prisma/tenant-isolation.guard.ts](../../backend-api/src/main-app/infrastructure/prisma/tenant-isolation.guard.ts)

Apply this guard to controllers to validate tenant context at the HTTP request level:

```typescript
import { TenantIsolationGuard, BypassTenantIsolation } from '@/infrastructure/prisma/tenant-isolation.guard';

@Controller('leads')
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
export class LeadsController {

  // Regular endpoint - automatically enforces tenant isolation
  @Get()
  async getLeads(@Request() req) {
    const user = req.user;
    // user.subAccountId is guaranteed to exist
    return this.leadsService.findAll(user.subAccountId);
  }

  // Admin endpoint - can access any tenant
  @Get('admin/all/:subAccountId')
  @BypassTenantIsolation()
  @Roles('super_admin')
  async getLeadsForSubAccount(@Param('subAccountId') subAccountId: string) {
    return this.leadsService.findAll(parseInt(subAccountId));
  }
}
```

**Protection provided**:
- ✅ Validates user has `subAccountId` (not admin)
- ✅ Blocks requests where path params try to access different subAccountId
- ✅ Blocks requests where body tries to modify different subAccountId
- ✅ Allows admins to bypass with `@BypassTenantIsolation()` decorator

## Usage Guide

### For Regular Services (User Operations)

Always include `subAccountId` filter:

```typescript
@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number): Promise<Lead[]> {
    // Get user's subAccountId
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subAccountId: true }
    });

    // ✅ CORRECT - Filtered by tenant
    return this.prisma.lead.findMany({
      where: {
        subAccountId: user.subAccountId,
        // ... other filters
      }
    });
  }

  async create(createLeadDto: CreateLeadDto, userId: number): Promise<Lead> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subAccountId: true }
    });

    // ✅ CORRECT - subAccountId included
    return this.prisma.lead.create({
      data: {
        ...createLeadDto,
        subAccountId: user.subAccountId,
        regularUserId: userId,
      }
    });
  }
}
```

### For Admin Services (Cross-Tenant Operations)

Explicitly specify which tenant to access:

```typescript
@Injectable()
export class AdminLeadsService {
  constructor(private prisma: PrismaService) {}

  // Get leads for a specific subaccount
  async getLeadsForSubAccount(subAccountId: number): Promise<Lead[]> {
    // ✅ CORRECT - Explicit subAccountId
    return this.prisma.lead.findMany({
      where: { subAccountId },
      include: {
        regularUser: true,
        strategy: true,
      }
    });
  }

  // Get global stats across all tenants
  async getGlobalStats() {
    // ✅ CORRECT - Count doesn't need subAccountId for global stats
    const totalLeads = await this.prisma.lead.count();
    const totalUsers = await this.prisma.user.count();

    // Group by subAccount
    const leadsBySubAccount = await this.prisma.lead.groupBy({
      by: ['subAccountId'],
      _count: true,
    });

    return {
      totalLeads,
      totalUsers,
      leadsBySubAccount,
    };
  }
}
```

### For Controllers

Apply the guard globally or per-controller:

```typescript
// Option 1: Global guard (recommended)
// In main.ts
app.useGlobalGuards(new TenantIsolationGuard(app.get(Reflector)));

// Option 2: Per-controller
@Controller('leads')
@UseGuards(JwtAuthGuard, TenantIsolationGuard)
export class LeadsController {
  // All endpoints automatically protected
}

// Option 3: Per-endpoint (not recommended, easy to forget)
@Get()
@UseGuards(TenantIsolationGuard)
getLeads() { ... }
```

## Migration Checklist

When adding the tenant isolation system to an existing codebase:

### Phase 1: Warning Mode (Development)
- [ ] Add Prisma middleware to `PrismaService`
- [ ] Run application and review logs
- [ ] Fix all warnings (add missing `subAccountId` filters)
- [ ] Fix all errors (add `subAccountId` to creates)

### Phase 2: Guard Implementation
- [ ] Add `TenantIsolationGuard` to controllers
- [ ] Mark admin endpoints with `@BypassTenantIsolation()`
- [ ] Test user access (should only see own tenant data)
- [ ] Test admin access (should access specified tenant)

### Phase 3: Strict Mode (Staging/Production)
- [ ] Enable `enableStrictTenantMode()` in staging
- [ ] Run full test suite
- [ ] Monitor error logs for 48 hours
- [ ] If no errors, enable in production

## Testing

### Unit Tests

```typescript
describe('LeadsService - Tenant Isolation', () => {
  it('should only return leads for user\'s subAccount', async () => {
    const user = await createTestUser({ subAccountId: 1 });
    const otherUser = await createTestUser({ subAccountId: 2 });

    await createTestLead({ subAccountId: 1, name: 'Lead 1' });
    await createTestLead({ subAccountId: 2, name: 'Lead 2' });

    const leads = await service.findAll(user.id);

    expect(leads).toHaveLength(1);
    expect(leads[0].name).toBe('Lead 1');
    expect(leads[0].subAccountId).toBe(1);
  });

  it('should throw error when creating lead without subAccountId in strict mode', async () => {
    prismaService.enableStrictTenantMode();

    await expect(
      prisma.lead.create({
        data: { name: 'Test Lead' } // Missing subAccountId
      })
    ).rejects.toThrow('requires subAccountId');
  });
});
```

### Integration Tests

```typescript
describe('Leads API - Tenant Isolation', () => {
  it('should not allow user to access other tenant leads', async () => {
    const user1 = await createUser({ subAccountId: 1 });
    const user2 = await createUser({ subAccountId: 2 });

    const lead2 = await createLead({ subAccountId: 2 });

    const response = await request(app)
      .get(`/leads/${lead2.id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Cannot access other tenant');
  });
});
```

## Security Checklist

Before deploying:

- [ ] All tenant-scoped models listed in `TENANT_SCOPED_MODELS`
- [ ] Prisma middleware logs reviewed (no unexpected warnings)
- [ ] `TenantIsolationGuard` applied to all user-facing controllers
- [ ] Admin endpoints marked with `@BypassTenantIsolation()`
- [ ] Strict mode enabled in production
- [ ] Integration tests cover cross-tenant access attempts
- [ ] Error monitoring configured (Sentry, etc.)

## Monitoring

### Logs to Watch

**Development**:
```
⚠️ Query on Lead without subAccountId filter
```
Action: Add the filter to the query

**Production**:
```
SECURITY: Lead.findMany requires subAccountId filter in strict mode
```
Action: IMMEDIATE FIX - This indicates a security vulnerability

### Metrics to Track

- Count of tenant isolation warnings (should trend to zero)
- Count of tenant isolation errors (should always be zero)
- Failed access attempts via `TenantIsolationGuard`

## Common Pitfalls

### 1. Forgetting to filter on findUnique

```typescript
// ❌ WRONG - findUnique by ID without subAccountId check
const lead = await prisma.lead.findUnique({
  where: { id: leadId }
});

// ✅ CORRECT - Validate ownership
const lead = await prisma.lead.findUnique({
  where: { id: leadId }
});

if (lead.subAccountId !== user.subAccountId) {
  throw new ForbiddenException('Access denied');
}
```

### 2. Including wrong subAccountId in relations

```typescript
// ❌ WRONG - Creating related entities with different subAccountId
await prisma.strategy.create({
  data: {
    name: 'New Strategy',
    subAccountId: user.subAccountId,
    leads: {
      create: {
        name: 'Test Lead',
        subAccountId: 999 // WRONG! Different tenant
      }
    }
  }
});

// ✅ CORRECT - Same subAccountId for all related entities
await prisma.strategy.create({
  data: {
    name: 'New Strategy',
    subAccountId: user.subAccountId,
    leads: {
      create: {
        name: 'Test Lead',
        subAccountId: user.subAccountId // Same tenant
      }
    }
  }
});
```

### 3. Admin operations without explicit subAccountId

```typescript
// ❌ WRONG - Admin gets all leads across all tenants unintentionally
async getAllLeads() {
  return prisma.lead.findMany(); // Exposes all tenant data!
}

// ✅ CORRECT - Admin specifies which tenant
async getAllLeadsForSubAccount(subAccountId: number) {
  return prisma.lead.findMany({
    where: { subAccountId }
  });
}
```

## Related Documentation

- [03-multi-tenant.md](./03-multi-tenant.md) - Multi-tenant architecture overview
- [01-authentication.md](./01-authentication.md) - Authentication with tenant context
- [09-security.md](./09-security.md) - General security best practices
