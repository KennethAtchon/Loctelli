# ONBOARDING Implementation Plan

## Overview

Transform the current **required multi-tenant** model into an **optional multi-tenant** model using a special "ONBOARDING" default subaccount. This approach maintains the existing architecture while allowing users to register without immediately being assigned to a real tenant.

## Architecture Decision: ONBOARDING Pattern

### Why ONBOARDING is Superior

✅ **Advantages:**
- No schema changes needed (`subAccountId` stays non-nullable)
- Simpler authentication logic (no null checks everywhere)
- Consistent data model (every user always has a subaccount)
- Easier to reason about (one code path, not two)
- Cleaner migrations (existing code mostly works as-is)
- Better data isolation (even "onboarding" users get proper isolation)
- Future flexibility (easy to convert ONBOARDING users to real tenants)

❌ **Alternative Approach (Nullable subAccountId):**
- Would require extensive schema changes
- Need null checks throughout the codebase
- Two code paths to maintain
- More complex authorization logic
- Higher risk of bugs and security issues

---

## Current State Analysis

### Database Schema ([schema.prisma](c:\Users\kenne\Documents\Workplace\Loctelli\project\prisma\schema.prisma))
- ✅ `User.subAccountId` is **required** (non-nullable)
- ✅ All tenant-scoped data has `subAccountId` foreign keys
- ✅ Multi-tenant isolation is enforced via `subAccountId`

### Authentication Flow ([unified-auth.service.ts](c:\Users\kenne\Documents\Workplace\Loctelli\project\src\shared\auth\services\unified-auth.service.ts))
- **Registration (Line 269-321):**
  - Currently assigns users to "Default SubAccount"
  - Gets or creates default subaccount if it doesn't exist
  - No option to choose/join subaccount

### Frontend Context ([tenant-context.tsx](c:\Users\kenne\Documents\Workplace\Loctelli\my-app\contexts\tenant-context.tsx))
- ✅ Expects all users to have `subAccountId`
- ✅ Throws error if regular user lacks `subAccountId` (Line 146-149)

### Seed Data ([seed.ts](c:\Users\kenne\Documents\Workplace\Loctelli\project\prisma\seed.ts))
- Creates "Default SubAccount" for new users

---

## Implementation Plan

## Phase 1: Database & Seed Setup ✅ **COMPLETED**

### 1.1 Create ONBOARDING SubAccount
**File:** `project/prisma/seed.ts`

**Changes:**
```typescript
// Add constant for ONBOARDING ID
const ONBOARDING_SUBACCOUNT_ID = 'ONBOARDING';
const ONBOARDING_NAME = 'Onboarding Workspace';

// Create ONBOARDING subaccount with special properties
const onboardingSubAccount = await prisma.subAccount.upsert({
  where: { id: ONBOARDING_SUBACCOUNT_ID },
  update: {},
  create: {
    id: ONBOARDING_SUBACCOUNT_ID,
    name: ONBOARDING_NAME,
    description: 'Temporary workspace for users who have not yet joined or created a subaccount',
    isActive: true,
    settings: {
      isOnboarding: true,
      restrictedAccess: true,
      features: {
        leads: false,
        strategies: false,
        bookings: false,
        sms: false,
        integrations: false,
        // Only allow:
        profile: true,
        settings: true,
        tenantSetup: true
      }
    },
    createdByAdminId: adminUser.id,
  },
});
```

**Migration needed?**
- No, if SubAccount.id is auto-increment. Use first available ID.
- Yes, if you want a special reserved ID like 'ONBOARDING' (would need to change id type to String or use a known ID like 1)

**Recommendation:** Use ID `1` as ONBOARDING, since it's always available and predictable.

### 1.2 Create SubAccount Invitation System
**File:** `project/prisma/schema.prisma`

**Add new model:**
```prisma
model SubAccountInvitation {
  id              String    @id @default(cuid())
  subAccountId    Int
  subAccount      SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)

  // Invitation details
  code            String    @unique // Unique invite code
  password        String?   // Optional password protection (hashed)

  // Usage limits
  maxUses         Int?      // Null = unlimited
  currentUses     Int       @default(0)
  expiresAt       DateTime? // Null = never expires

  // Metadata
  isActive        Boolean   @default(true)
  createdByAdminId Int
  createdByAdmin  AdminUser @relation(fields: [createdByAdminId], references: [id])

  // Timestamps
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([code])
  @@index([subAccountId])
  @@map("subaccount_invitations")
}
```

**Also add to SubAccount model:**
```prisma
model SubAccount {
  // ... existing fields
  invitations     SubAccountInvitation[]
}

model AdminUser {
  // ... existing fields
  subAccountInvitations SubAccountInvitation[]
}
```

**Migration command:**
```bash
npx prisma migrate dev --name add_subaccount_invitations
```

---

## Phase 2: Backend - Authorization & Restrictions ✅ **COMPLETED**

### 2.1 Create ONBOARDING Constants
**File:** `project/src/shared/constants/tenant.constants.ts` (NEW)

```typescript
export const ONBOARDING_SUBACCOUNT_ID = 1; // Or 'ONBOARDING' if using string IDs

export const ONBOARDING_RESTRICTIONS = {
  // Allowed routes for ONBOARDING users
  allowedRoutes: [
    '/api/users/profile',
    '/api/users/settings',
    '/api/subaccounts/create',
    '/api/subaccounts/join',
    '/api/subaccounts/invitations/validate',
    '/api/auth/*', // All auth routes
  ],

  // Blocked routes for ONBOARDING users
  blockedRoutes: [
    '/api/leads/*',
    '/api/strategies/*',
    '/api/bookings/*',
    '/api/sms/*',
    '/api/chat/*',
    '/api/integrations/*',
    '/api/business-finder/*',
    '/api/contacts/*',
    '/api/forms/*',
  ],

  // Features
  features: {
    canViewLeads: false,
    canCreateStrategies: false,
    canMakeBookings: false,
    canSendSms: false,
    canUseIntegrations: false,
    canAccessBusinessFinder: false,
  }
};
```

### 2.2 Create ONBOARDING Guard
**File:** `project/src/shared/guards/onboarding.guard.ts` (NEW)

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ONBOARDING_SUBACCOUNT_ID } from '../constants/tenant.constants';

export const ALLOW_ONBOARDING_KEY = 'allowOnboarding';

/**
 * Decorator to allow ONBOARDING users to access a route
 * By default, ONBOARDING users are blocked from most routes
 */
export const AllowOnboarding = () => SetMetadata(ALLOW_ONBOARDING_KEY, true);

@Injectable()
export class OnboardingGuard implements CanActivate {
  private readonly logger = new Logger(OnboardingGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route explicitly allows ONBOARDING users
    const allowOnboarding = this.reflector.getAllAndOverride<boolean>(ALLOW_ONBOARDING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const route = `${request.method} ${request.url}`;

    if (!user) {
      return true; // Let auth guard handle this
    }

    // Check if user is in ONBOARDING
    const isOnboarding = user.subAccountId === ONBOARDING_SUBACCOUNT_ID;

    if (isOnboarding && !allowOnboarding) {
      this.logger.warn(
        `🚫 ONBOARDING user blocked: ${user.email} attempted to access ${route}`
      );
      throw new ForbiddenException(
        'You must join or create a workspace to access this feature. Please complete your onboarding.'
      );
    }

    return true;
  }
}
```

### 2.3 Update Auth Module to Include Guard
**File:** `project/src/shared/auth/auth.module.ts`

```typescript
import { OnboardingGuard } from '../guards/onboarding.guard';

@Module({
  // ... existing config
  providers: [
    // ... existing providers
    OnboardingGuard,
  ],
  exports: [
    // ... existing exports
    OnboardingGuard,
  ],
})
export class AuthModule {}
```

### 2.4 Apply ONBOARDING Guard to App
**File:** `project/src/main-app/main.module.ts` or `project/src/main.ts`

```typescript
import { APP_GUARD } from '@nestjs/core';
import { OnboardingGuard } from './shared/guards/onboarding.guard';

// In module providers:
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
},
{
  provide: APP_GUARD,
  useClass: RolesGuard,
},
{
  provide: APP_GUARD,
  useClass: OnboardingGuard, // Add after auth guards
},
```

### 2.5 Update Registration to Use ONBOARDING
**File:** `project/src/shared/auth/services/unified-auth.service.ts`

**Change (Line 282-303):**
```typescript
private async registerUser(registerDto: UnifiedRegisterDto): Promise<any> {
  // Check if user already exists
  const existingUser = await this.prisma.user.findUnique({
    where: { email: registerDto.email },
  });

  if (existingUser) {
    throw new ConflictException('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(registerDto.password, 12);

  // Assign to ONBOARDING by default
  const ONBOARDING_ID = 1; // Or get from constants

  // Create user assigned to ONBOARDING
  const user = await this.prisma.user.create({
    data: {
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      company: registerDto.company,
      budget: registerDto.budget,
      subAccountId: ONBOARDING_ID, // Auto-assign to ONBOARDING
    },
  });

  this.logger.log(`User registered to ONBOARDING: ${user.email} (ID: ${user.id})`);

  const { password, ...result } = user;
  return result;
}
```

---

## Phase 3: Backend - Tenant Management Endpoints ✅ **COMPLETED**

### 3.1 Create SubAccount Management Service
**File:** `project/src/main-app/modules/subaccounts/subaccounts.service.ts`

**Add methods:**
```typescript
/**
 * Create a new subaccount for a user (moves them from ONBOARDING)
 */
async createSubAccountForUser(
  userId: number,
  createDto: CreateSubAccountDto,
): Promise<SubAccount> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.subAccountId !== ONBOARDING_SUBACCOUNT_ID) {
    throw new BadRequestException('User already belongs to a subaccount');
  }

  // Create new subaccount
  const subAccount = await this.prisma.subAccount.create({
    data: {
      name: createDto.name,
      description: createDto.description,
      createdByAdminId: user.createdByAdminId || 1, // Fallback to system admin
    },
  });

  // Move user from ONBOARDING to new subaccount
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      subAccountId: subAccount.id,
      role: 'admin', // User becomes admin of their own subaccount
    },
  });

  this.logger.log(
    `User ${userId} created subaccount ${subAccount.id} and became admin`
  );

  return subAccount;
}

/**
 * Join an existing subaccount using invitation code
 */
async joinSubAccount(
  userId: number,
  joinDto: JoinSubAccountDto,
): Promise<SubAccount> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  if (user.subAccountId !== ONBOARDING_SUBACCOUNT_ID) {
    throw new BadRequestException('User already belongs to a subaccount');
  }

  // Find and validate invitation
  const invitation = await this.prisma.subAccountInvitation.findUnique({
    where: { code: joinDto.invitationCode },
    include: { subAccount: true },
  });

  if (!invitation) {
    throw new NotFoundException('Invalid invitation code');
  }

  if (!invitation.isActive) {
    throw new BadRequestException('Invitation is no longer active');
  }

  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    throw new BadRequestException('Invitation has expired');
  }

  if (invitation.maxUses && invitation.currentUses >= invitation.maxUses) {
    throw new BadRequestException('Invitation has reached maximum uses');
  }

  // Validate password if required
  if (invitation.password) {
    const isPasswordValid = await bcrypt.compare(
      joinDto.password || '',
      invitation.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid invitation password');
    }
  }

  // Move user from ONBOARDING to target subaccount
  await this.prisma.user.update({
    where: { id: userId },
    data: {
      subAccountId: invitation.subAccountId,
    },
  });

  // Increment invitation usage count
  await this.prisma.subAccountInvitation.update({
    where: { id: invitation.id },
    data: {
      currentUses: { increment: 1 },
    },
  });

  this.logger.log(
    `User ${userId} joined subaccount ${invitation.subAccountId} via invitation`
  );

  return invitation.subAccount;
}

/**
 * Check if user is in ONBOARDING
 */
async isUserInOnboarding(userId: number): Promise<boolean> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { subAccountId: true },
  });

  return user?.subAccountId === ONBOARDING_SUBACCOUNT_ID;
}
```

### 3.2 Create DTOs
**File:** `project/src/main-app/modules/subaccounts/dto/create-subaccount.dto.ts`

```typescript
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateSubAccountDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
```

**File:** `project/src/main-app/modules/subaccounts/dto/join-subaccount.dto.ts`

```typescript
import { IsString, IsOptional } from 'class-validator';

export class JoinSubAccountDto {
  @IsString()
  invitationCode: string;

  @IsString()
  @IsOptional()
  password?: string; // Required if invitation is password-protected
}
```

**File:** `project/src/main-app/modules/subaccounts/dto/create-invitation.dto.ts`

```typescript
import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, Min } from 'class-validator';

export class CreateInvitationDto {
  @IsInt()
  subAccountId: number;

  @IsString()
  @IsOptional()
  password?: string; // Optional password protection

  @IsInt()
  @IsOptional()
  @Min(1)
  maxUses?: number; // Null = unlimited

  @IsDateString()
  @IsOptional()
  expiresAt?: string; // ISO date string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

### 3.3 Create SubAccount Controller Endpoints
**File:** `project/src/main-app/modules/subaccounts/subaccounts.controller.ts`

**Add routes:**
```typescript
import { AllowOnboarding } from '@/shared/guards/onboarding.guard';

@Controller('subaccounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubAccountsController {
  // ... existing routes

  /**
   * Create new subaccount (for ONBOARDING users)
   */
  @Post('create')
  @AllowOnboarding() // Explicitly allow ONBOARDING users
  async createForUser(
    @Req() req: any,
    @Body() createDto: CreateSubAccountDto,
  ) {
    const userId = req.user.userId;
    return this.subAccountsService.createSubAccountForUser(userId, createDto);
  }

  /**
   * Join existing subaccount (for ONBOARDING users)
   */
  @Post('join')
  @AllowOnboarding() // Explicitly allow ONBOARDING users
  async join(
    @Req() req: any,
    @Body() joinDto: JoinSubAccountDto,
  ) {
    const userId = req.user.userId;
    return this.subAccountsService.joinSubAccount(userId, joinDto);
  }

  /**
   * Check if user is in ONBOARDING
   */
  @Get('status')
  @AllowOnboarding()
  async getStatus(@Req() req: any) {
    const userId = req.user.userId;
    const isOnboarding = await this.subAccountsService.isUserInOnboarding(userId);
    return { isOnboarding, requiresSetup: isOnboarding };
  }

  /**
   * Create invitation code (admin only)
   */
  @Post('invitations')
  @Roles('admin', 'super_admin')
  async createInvitation(
    @Req() req: any,
    @Body() createDto: CreateInvitationDto,
  ) {
    return this.subAccountsService.createInvitation(
      req.user.userId,
      createDto,
    );
  }

  /**
   * Validate invitation code (public - for preview)
   */
  @Get('invitations/:code/validate')
  @AllowOnboarding()
  async validateInvitation(@Param('code') code: string) {
    return this.subAccountsService.validateInvitationCode(code);
  }

  /**
   * List all invitations for a subaccount (admin only)
   */
  @Get(':subAccountId/invitations')
  @Roles('admin', 'super_admin')
  async listInvitations(@Param('subAccountId') subAccountId: string) {
    return this.subAccountsService.listInvitations(parseInt(subAccountId));
  }
}
```

---

## Phase 4: Frontend - Setup Wizard & Flows

### 4.1 Create Setup Wizard Component
**File:** `my-app/components/admin/tenant-setup-wizard.tsx` (NEW)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, Key } from 'lucide-react';
import { api } from '@/lib/api';

export function TenantSetupWizard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Create subaccount state
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  });

  // Join subaccount state
  const [joinForm, setJoinForm] = useState({
    invitationCode: '',
    password: '',
  });

  const handleCreate = async () => {
    setIsLoading(true);
    setError('');

    try {
      await api.subaccounts.create(createForm);
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create subaccount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsLoading(true);
    setError('');

    try {
      await api.subaccounts.join(joinForm);
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to join subaccount');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Complete Your Account Setup</CardTitle>
          <CardDescription>
            Choose to create your own workspace or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Workspace</TabsTrigger>
              <TabsTrigger value="join">Join Workspace</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create" className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Create Your Workspace</h3>
                  <p className="text-sm text-blue-700">
                    Start fresh with your own organization
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Workspace Name *</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of your organization"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={isLoading || !createForm.name}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 'Create Workspace'}
                </Button>
              </div>
            </TabsContent>

            {/* Join Tab */}
            <TabsContent value="join" className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Join a Workspace</h3>
                  <p className="text-sm text-green-700">
                    Use an invitation code to join an existing organization
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Invitation Code *</Label>
                  <Input
                    id="code"
                    placeholder="Enter invitation code"
                    value={joinForm.invitationCode}
                    onChange={(e) => setJoinForm({ ...joinForm, invitationCode: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password (if required)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter invitation password"
                    value={joinForm.password}
                    onChange={(e) => setJoinForm({ ...joinForm, password: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  onClick={handleJoin}
                  disabled={isLoading || !joinForm.invitationCode}
                  className="w-full"
                >
                  {isLoading ? 'Joining...' : 'Join Workspace'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.2 Create Setup Required Page
**File:** `my-app/app/admin/(main)/setup/page.tsx` (NEW)

```typescript
import { TenantSetupWizard } from '@/components/admin/tenant-setup-wizard';

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <TenantSetupWizard />
    </div>
  );
}
```

### 4.3 Update Layout to Check NO-TENANT Status
**File:** `my-app/app/admin/(main)/layout.tsx`

**Add check and redirect:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUnifiedAuth } from '@/contexts/unified-auth-context';
import { api } from '@/lib/api';

export default function AdminMainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { account, accountType } = useUnifiedAuth();
  const [isCheckingTenant, setIsCheckingTenant] = useState(true);

  useEffect(() => {
    const checkTenantStatus = async () => {
      // Skip check for admins
      if (accountType === 'admin') {
        setIsCheckingTenant(false);
        return;
      }

      // Skip check if already on setup page
      if (pathname === '/admin/setup') {
        setIsCheckingTenant(false);
        return;
      }

      try {
        const status = await api.subaccounts.getStatus();

        if (status.requiresSetup) {
          router.push('/admin/setup');
        }
      } catch (error) {
        console.error('Failed to check tenant status:', error);
      } finally {
        setIsCheckingTenant(false);
      }
    };

    if (account) {
      checkTenantStatus();
    }
  }, [account, accountType, pathname, router]);

  if (isCheckingTenant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Existing layout code */}
      {children}
    </>
  );
}
```

### 4.4 Update API Client
**File:** `my-app/lib/api/endpoints/subaccounts.ts`

**Add methods:**
```typescript
export const subaccounts = {
  // ... existing methods

  async create(data: { name: string; description?: string }) {
    return apiClient.post('/subaccounts/create', data);
  },

  async join(data: { invitationCode: string; password?: string }) {
    return apiClient.post('/subaccounts/join', data);
  },

  async getStatus() {
    return apiClient.get<{ isOnboarding: boolean; requiresSetup: boolean }>('/subaccounts/status');
  },

  async validateInvitation(code: string) {
    return apiClient.get(`/subaccounts/invitations/${code}/validate`);
  },
};
```

### 4.5 Add Banner for ONBOARDING Users
**File:** `my-app/components/admin/onboarding-banner.tsx` (NEW)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export function OnboardingBanner() {
  const router = useRouter();
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await api.subaccounts.getStatus();
        setIsOnboarding(status.isOnboarding);
      } catch (error) {
        console.error('Failed to check ONBOARDING status:', error);
      }
    };

    checkStatus();
  }, []);

  if (!isOnboarding) return null;

  return (
    <Alert variant="warning" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Action Required: Complete Your Onboarding</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          You need to join or create a workspace to access all features.
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/setup')}
        >
          Complete Setup
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

**Add to dashboard:**
```typescript
// In my-app/app/admin/(main)/dashboard/page.tsx
import { OnboardingBanner } from '@/components/admin/onboarding-banner';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <OnboardingBanner />
      {/* Rest of dashboard */}
    </div>
  );
}
```

---

## Phase 5: Testing & Validation

### 5.1 Backend Tests
**File:** `project/src/main-app/modules/subaccounts/subaccounts.service.spec.ts`

**Test cases:**
- [ ] ONBOARDING user can create subaccount
- [ ] ONBOARDING user can join subaccount with valid code
- [ ] ONBOARDING user cannot join with invalid code
- [ ] ONBOARDING user cannot join with expired invitation
- [ ] ONBOARDING user cannot join with wrong password
- [ ] Regular user cannot create/join (already has tenant)
- [ ] User is moved from ONBOARDING after creation/join
- [ ] User role is updated to admin after creating subaccount

### 5.2 Frontend Tests
**File:** `my-app/components/admin/tenant-setup-wizard.test.tsx`

**Test cases:**
- [ ] Wizard renders create and join tabs
- [ ] Create form validates required fields
- [ ] Join form validates invitation code
- [ ] Success redirects to dashboard
- [ ] Error messages display correctly

### 5.3 Integration Tests
**File:** `project/test/e2e/tenant-setup.e2e-spec.ts`

**Test cases:**
- [ ] Full user registration → ONBOARDING → create subaccount flow
- [ ] Full user registration → ONBOARDING → join subaccount flow
- [ ] ONBOARDING user blocked from accessing restricted routes
- [ ] ONBOARDING user can access profile/settings
- [ ] Banner shows for ONBOARDING users
- [ ] Banner hides after setup complete

### 5.4 Manual Testing Checklist

**Registration:**
- [ ] New user registers successfully
- [ ] User is assigned to ONBOARDING (ID 1)
- [ ] User can log in

**Setup Wizard:**
- [ ] ONBOARDING banner shows on dashboard
- [ ] Setup page loads correctly
- [ ] Can switch between create/join tabs
- [ ] Create workspace form validates input
- [ ] Join workspace form validates input

**Create Workspace:**
- [ ] User can create new subaccount
- [ ] User becomes admin of new subaccount
- [ ] User redirected to dashboard
- [ ] Banner no longer shows

**Join Workspace:**
- [ ] Admin can create invitation code
- [ ] Invitation code validates correctly
- [ ] Password protection works (if set)
- [ ] User joins subaccount successfully
- [ ] User redirected to dashboard
- [ ] Banner no longer shows

**Restrictions:**
- [ ] ONBOARDING user blocked from /leads
- [ ] ONBOARDING user blocked from /strategies
- [ ] ONBOARDING user blocked from /bookings
- [ ] ONBOARDING user blocked from /sms
- [ ] ONBOARDING user can access /profile
- [ ] ONBOARDING user can access /settings
- [ ] ONBOARDING user can access /setup

**Edge Cases:**
- [ ] User already in subaccount cannot create/join again
- [ ] Expired invitation rejected
- [ ] Invalid invitation code rejected
- [ ] Max uses enforced for invitations
- [ ] Password mismatch rejected

---

## Phase 6: Migration & Rollout

### 6.1 Data Migration Script
**File:** `project/prisma/migrations/add_onboarding.ts` (manual)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('Creating ONBOARDING subaccount...');

  // Find system admin
  const admin = await prisma.adminUser.findFirst({
    where: { role: 'super_admin' },
  });

  if (!admin) {
    throw new Error('No super admin found');
  }

  // Create ONBOARDING subaccount
  const onboarding = await prisma.subAccount.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Onboarding Workspace',
      description: 'Temporary workspace for users who have not yet joined or created a subaccount',
      isActive: true,
      settings: {
        isOnboarding: true,
        restrictedAccess: true,
      },
      createdByAdminId: admin.id,
    },
  });

  console.log('ONBOARDING subaccount created:', onboarding);

  // Optional: Migrate existing "Default SubAccount" users to ONBOARDING
  const defaultSubAccount = await prisma.subAccount.findFirst({
    where: { name: 'Default SubAccount' },
  });

  if (defaultSubAccount) {
    const usersToMigrate = await prisma.user.count({
      where: { subAccountId: defaultSubAccount.id },
    });

    console.log(`Found ${usersToMigrate} users in Default SubAccount`);
    console.log('Consider migrating them to ONBOARDING or keeping them as-is');

    // Uncomment to auto-migrate:
    // await prisma.user.updateMany({
    //   where: { subAccountId: defaultSubAccount.id },
    //   data: { subAccountId: 1 },
    // });
  }

  console.log('Migration complete!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 6.2 Rollout Plan

**Stage 1: Development**
1. Run migration to create ONBOARDING subaccount
2. Update seed data
3. Test locally

**Stage 2: Staging**
1. Deploy backend changes
2. Deploy frontend changes
3. Run migration script
4. Test full flows
5. Verify restrictions work

**Stage 3: Production**
1. Announce feature to users
2. Deploy backend (zero downtime)
3. Run migration script
4. Deploy frontend
5. Monitor error logs
6. Monitor user behavior

**Rollback Plan:**
- Keep backup of database before migration
- If issues arise, revert code and restore database
- ONBOARDING users will be re-assigned to "Default SubAccount"

---

## Summary

### What Changes?

**Database:**
- ✅ Create ONBOARDING subaccount (ID 1)
- ✅ Add SubAccountInvitation model
- ✅ No schema changes to existing models

**Backend:**
- ✅ Create ONBOARDING guard and decorator
- ✅ Apply guard globally to block ONBOARDING from restricted routes
- ✅ Update registration to assign ONBOARDING
- ✅ Add create/join subaccount endpoints
- ✅ Add invitation system

**Frontend:**
- ✅ Create setup wizard component
- ✅ Add setup page
- ✅ Update layout to redirect ONBOARDING users
- ✅ Add ONBOARDING banner
- ✅ Update API client

### What Stays the Same?

- ✅ All existing users keep their subaccounts
- ✅ No changes to User schema
- ✅ No changes to SubAccount schema (except adding relations)
- ✅ Multi-tenant architecture intact
- ✅ Authentication flow unchanged
- ✅ Admin panel unchanged

### Key Benefits

1. **No breaking changes** - Existing users unaffected
2. **Cleaner architecture** - No nullable subAccountId
3. **Flexible onboarding** - Users can choose to create or join
4. **Invitation system** - Controlled access to subaccounts
5. **Restricted access** - ONBOARDING users safely isolated
6. **Easy migration** - From ONBOARDING to real tenant
7. **User-friendly terminology** - "Onboarding" is positive and clear

---

## Timeline Estimate

**Phase 1 (Database):** 2-3 hours
**Phase 2 (Backend Auth):** 4-5 hours
**Phase 3 (Backend APIs):** 5-6 hours
**Phase 4 (Frontend):** 6-8 hours
**Phase 5 (Testing):** 4-5 hours
**Phase 6 (Migration):** 2-3 hours

**Total:** ~24-30 hours of development time

---

## Questions to Consider

1. **SubAccount ID Type:** Should ONBOARDING use ID `1`, or change to string IDs like `'ONBOARDING'`?
   - **Recommendation:** Use ID `1` to avoid schema changes

2. **Default Role:** Should users who create their own subaccount become `admin` or stay `user`?
   - **Recommendation:** Become `admin` (they own the workspace)

3. **Migration of Existing Users:** Should users in "Default SubAccount" be moved to ONBOARDING?
   - **Recommendation:** No, keep them as-is unless explicitly needed

4. **Invitation Expiry:** Default expiration time for invitations?
   - **Recommendation:** 7 days, configurable

5. **Password Protection:** Should invitations require password by default?
   - **Recommendation:** Optional, admin chooses

6. **Max Uses:** Default max uses for invitations?
   - **Recommendation:** Unlimited, admin can set limit

---

## Next Steps

1. **Review this plan** with the team
2. **Get approval** on architecture decisions
3. **Create Jira tickets** or GitHub issues for each phase
4. **Start with Phase 1** (database setup)
5. **Test incrementally** after each phase
6. **Deploy to staging** before production

---

**Created:** 2025-10-14
**Author:** Claude Code
**Status:** Ready for Review
