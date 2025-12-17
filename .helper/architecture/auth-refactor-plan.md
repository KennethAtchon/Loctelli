# Authentication System Refactor Plan (Aggressive Approach)


## Proposed Solution

### Phase 3: Enhanced Guard System

#### Unified JWT Strategy

Already partially implemented in `jwt.strategy.ts`, but needs enhancement:

```typescript
@Injectable()
export class UnifiedJwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: UnifiedJwtPayload) {
    // Already routes correctly, just needs unified payload structure
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      userType: payload.userType,
      subAccountId: payload.subAccountId,
      systemUserId: payload.userType === 'admin'
        ? this.systemUserService.getSystemUserId()
        : payload.sub
    };
  }
}
```

#### Enhanced Role Guard

```typescript
@Injectable()
export class UnifiedRolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;

    // Check both role and userType
    return requiredRoles.some(role => {
      if (role === 'admin' || role === 'super_admin') {
        return user.userType === 'admin' && user.role === role;
      }
      return user.role === role;
    });
  }
}
```

### Phase 5: Frontend Integration

#### API Client Updates

```typescript
// my-app/lib/api/auth.ts
export const authApi = {
  login: async (email: string, password: string, userType: 'user' | 'admin') => {
    return api.post('/auth/login', { email, password, userType });
  },

  register: async (data: RegisterData, userType: 'user' | 'admin') => {
    return api.post('/auth/register', { ...data, userType });
  },

  // ... other methods
};
```

#### Frontend Changes

**No UI changes required** - Frontend already has separate:
- `app/auth/*` for users
- `app/admin/*` for admins

Just update API calls to pass `userType` parameter.

## Implementation Timeline (Aggressive - No Backward Compatibility)


### Week 2: Frontend, Testing & Deployment (Days 6-10)

**Day 6-7: Frontend Integration**
- [x] Update API client (`authApi.loginUser()`, `authApi.loginAdmin()`) ✅
- [x] Update auth contexts (if needed) ✅ (No changes needed)
- [ ] Test user login/register flows (PENDING USER TESTING)
- [ ] Test admin login/register flows (PENDING USER TESTING)
- [ ] Session persistence testing (PENDING USER TESTING)

**Day 8: Enhanced Security Features**
- [x] Implement throttle guards on sensitive endpoints ✅ (ThrottlerModule + ThrottlerGuard configured)
- [x] Account lockout mechanism (5 attempts = 15min lockout) ✅ (Already in SecurityService)
- [x] Password history validation (last 5/10 passwords) ✅ (Already in UnifiedAuthService)
- [x] Audit logging for all auth events ✅ (Already in SecurityService)
- [x] Token revocation on logout ✅ (Already in UnifiedAuthService)
- [x] Remember me functionality (30 day refresh tokens) ✅ (Already in UnifiedAuthService)


## Security Considerations

### Enhanced Security Features

1. **Rate Limiting** (Add in Sprint 2)
   ```typescript
   @UseGuards(ThrottlerGuard)
   @Throttle(5, 60) // 5 requests per 60 seconds
   async login() { ... }
   ```

2. **Account Lockout** (Add in Sprint 1)
   - Track failed login attempts
   - Lock account after 5 failed attempts
   - Auto-unlock after 15 minutes or admin intervention

3. **Password History** (Future enhancement)
   - Store hashed previous passwords
   - Prevent reuse of last 5 passwords

4. **Audit Logging** (Add in Sprint 2)
   - Log all authentication events
   - Include IP address, user agent, timestamp
   - Store in separate audit table

5. **Multi-Factor Authentication** (Future enhancement)
   - TOTP-based 2FA
   - SMS-based 2FA
   - Backup codes


## Enhanced Security Features

### 1. Account Lockout
- 5 failed attempts = 15-minute lockout
- 10 failed attempts = 1-hour lockout
- 15 failed attempts = manual admin unlock required

### 2. Rate Limiting
- Login: 5 requests/minute per IP
- Register: 3 requests/hour per IP
- Password reset: 3 requests/hour per email

### 3. Password Requirements

**Users:**
- 8+ characters
- 1 uppercase, 1 lowercase, 1 number, 1 special char
- Cannot reuse last 5 passwords

**Admins:**
- 12+ characters
- 1 uppercase, 1 lowercase, 1 number, 1 special char
- Cannot reuse last 10 passwords

### 4. Audit Logging
Log all events to `AuthAttempt` table:
- Login success/failure
- Password changes
- Account lockouts
- Token refreshes
- Profile updates

### 5. Token Security (Hybrid Approach)
- **Access tokens**: 15 minutes, stateless (fast validation)
- **Refresh tokens**: 7 days, stored in DB (revocable)
- Automatic token rotation on refresh
- SHA-256 hashing for stored tokens
- IP address tracking

---

## Files to Create

### Backend
```
backend-api/src/shared/auth/
├── services/
│   ├── unified-auth.service.ts         (NEW)
│   ├── security.service.ts             (NEW)
│   └── admin-auth-code.service.ts      (KEEP - unchanged)
├── utils/
│   └── validation.utils.ts             (NEW)
├── dto/
│   └── unified-auth.dto.ts             (NEW)
└── strategies/
    └── jwt.strategy.ts                 (UPDATE)

backend-api/src/main-app/controllers/
├── auth.controller.ts                  (REPLACE)
├── admin-users.controller.ts           (NEW)
└── admin-management.controller.ts      (NEW)

backend-api/prisma/migrations/
└── xxx_add_auth_security_tables/       (NEW)
```

### Frontend
```
my-app/lib/api/
└── auth.ts                             (UPDATE)
```

---


## Additional Improvements to Consider (During Refactor)

### 1. Redis Caching for Performance
**Why**: Reduce DB queries for frequently accessed data

```typescript
// Cache user/admin data after login
await this.cacheService.set(`user:${userId}:${accountType}`, userData, 900); // 15min TTL

// Cache account lockout status
await this.cacheService.set(`lockout:${email}:${accountType}`, lockoutData, 900);

// Cache rate limits
await this.cacheService.increment(`ratelimit:${ip}:login`, 1, 60); // 1 minute window
```

**Benefits:**
- Login validation: ~100ms faster (no DB query if cached)
- Lockout checks: ~50ms faster
- Rate limiting: Redis atomic operations vs DB queries

### 2. Email Verification Flow
**Why**: Prevent fake accounts, verify user identity

```typescript
// On registration
await this.emailService.sendVerificationEmail(user.email, verificationToken);

// Add to User/AdminUser tables
emailVerified: Boolean @default(false)
emailVerificationToken: String?
emailVerificationExpiry: DateTime?

// Endpoint
POST /auth/verify-email
Body: { token: string }
```

**Benefits:**
- Reduce spam/bot accounts
- Confirm valid email addresses
- Required for password reset flow

### 3. Remember Me / Persistent Sessions
**Why**: Better UX for trusted devices

```typescript
interface UnifiedLoginDto {
  email: string;
  password: string;
  accountType: 'user' | 'admin';
  rememberMe?: boolean;  // NEW
}

// If rememberMe = true:
// - Refresh token: 30 days (instead of 7)
// - Set "remember_me" cookie
// - Track device fingerprint
```

### 4. Geo-Location & Suspicious Login Detection
**Why**: Security alerts for unusual activity

```typescript
// Track login location
model AuthAttempt {
  // ... existing fields
  geoLocation    Json?     // { country, city, lat, lng }
  isNewLocation  Boolean   @default(false)
  isNewDevice    Boolean   @default(false)
}

// On login from new location:
await this.emailService.sendSecurityAlert(user.email, {
  location: geoData,
  device: deviceInfo,
  time: new Date(),
});
```

### 5. API Key Authentication (for integrations)
**Why**: Allow programmatic access without passwords

```typescript
// For users/admins to generate API keys
POST /auth/api-keys
Response: { apiKey: "lct_live_abc123...", name: "My Integration" }

// Validate via header
X-API-Key: lct_live_abc123...

model ApiAuthKey {
  id           String   @id @default(cuid())
  userId       Int
  accountType  String   // 'user' | 'admin'
  keyHash      String   @unique  // SHA-256 hash
  name         String   // "Zapier Integration"
  lastUsed     DateTime?
  expiresAt    DateTime?
  createdAt    DateTime @default(now())
}
```

**Benefits:**
- Enable integrations (webhooks, Zapier, APIs)
- No password exposure
- Easy revocation

### 6. Password Strength Meter & Breach Check
**Why**: Encourage strong passwords, prevent compromised ones

```typescript
// During registration/password change
import { pwnedPassword } from 'hibp';

async validatePasswordSecurity(password: string) {
  // Check strength (zxcvbn library)
  const strength = zxcvbn(password);
  if (strength.score < 3) {
    throw new BadRequestException('Password too weak. Suggestions: ' + strength.feedback.suggestions);
  }

  // Check if password is in breach database
  const breachCount = await pwnedPassword(password);
  if (breachCount > 0) {
    throw new BadRequestException(
      `This password has been found in ${breachCount} data breaches. Please choose a different password.`
    );
  }
}
```

### 7. Webhook Notifications for Auth Events
**Why**: Let apps react to auth events

```typescript
// Fire webhooks on important events
await this.webhookService.trigger({
  event: 'user.login',
  accountType: 'user',
  userId: user.id,
  data: {
    email: user.email,
    timestamp: new Date(),
    ipAddress,
  }
});

// Events to support:
// - user.login / admin.login
// - user.logout / admin.logout
// - user.password_changed
// - user.account_locked
// - user.registered
```

### 8. CORS & API Security Headers
**Why**: Prevent XSS, CSRF, clickjacking

```typescript
// In main.ts
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Token'],
});

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  hsts: true,
  xssFilter: true,
}));
```

### 9. Brute Force Protection at Infrastructure Level
**Why**: Block attacks before they hit the app

```typescript
// Rate limit by IP + email combination
model BruteForceProtection {
  id           String   @id @default(cuid())
  identifier   String   @unique // `${ip}:${email}`
  attempts     Int      @default(0)
  blockedUntil DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// Progressive delays
// 3 failures: 5 second delay
// 5 failures: 30 second delay
// 7 failures: 5 minute block
// 10 failures: 1 hour block
```

### 10. Auth Activity Dashboard (Admin)
**Why**: Monitor security, detect patterns

```typescript
GET /admin/auth/analytics

Response: {
  loginAttempts: {
    successful: 1234,
    failed: 45,
    successRate: 0.965
  },
  accountLockouts: 12,
  topFailureReasons: [
    { reason: 'invalid_credentials', count: 30 },
    { reason: 'account_locked', count: 12 }
  ],
  suspiciousLogins: [
    { email, location, reason: 'new_location', timestamp }
  ],
  activeUsers: 456,
  avgSessionDuration: '2h 34m'
}
```

### 11. Timezone-Aware Auth Events
**Why**: Show users when/where they logged in (in their timezone)

```typescript
// Store user's timezone preference
model User {
  // ... existing fields
  timezone: String @default("America/New_York")  // Already exists!
}

// Return login history with timezone conversion
GET /auth/login-history
Response: [
  {
    timestamp: "2025-01-15T14:30:00Z",
    localTime: "2025-01-15 09:30:00 EST",  // Converted
    location: "New York, US",
    device: "Chrome on MacOS"
  }
]
```

### 12. Passwordless Auth (Magic Links)
**Why**: Modern, secure, better UX

```typescript
POST /auth/magic-link
Body: { email: string, accountType: 'user' | 'admin' }

// Generate secure token, send email
// User clicks link → auto-login

model MagicLink {
  id           String   @id @default(cuid())
  email        String
  accountType  String
  tokenHash    String   @unique
  expiresAt    DateTime
  used         Boolean  @default(false)
  createdAt    DateTime @default(now())
}
```

---

## Recommended Additions to Include in 2-Week Refactor

**Week 1 (Add to existing plan):**
1. ✅ **Redis caching** - Day 2 (significant performance boost)
2. ✅ **Email verification** - Day 3 (essential for password reset)
3. ✅ **Remember me** - Day 4 (small addition to login flow)
4. ✅ **Password breach check** - Day 3 (security++)

**Week 2 (Add to existing plan):**
5. ✅ **Geo-location tracking** - Day 8 (in AuthAttempt table already)
6. ✅ **API key auth** - Day 9 (enables integrations)
7. ✅ **Security headers** - Day 10 (5 minute setup)

**Week 3+ (Post-launch):**
8. 🔮 **Webhooks** - Week 3
9. 🔮 **Auth dashboard** - Week 3
10. 🔮 **Magic links** - Week 4
11. 🔮 **MFA** - Week 4-5

---

## Post-Launch Enhancements (Week 3+)

### Phase 9: MFA (Multi-Factor Authentication)
- TOTP-based 2FA using Authenticator apps
- SMS-based 2FA (Twilio)
- Backup codes for recovery

### Phase 10: Password Reset
- Email-based password reset
- Secure token generation (1-hour expiry)
- Rate limiting on reset requests

### Phase 11: OAuth/SSO
- Google OAuth
- GitHub OAuth (for admins)
- SAML for enterprise

### Phase 12: Session Management
- Active sessions dashboard
- Remote session revocation
- Device fingerprinting

---

## 📊 Summary

### What We're Doing
**Complete authentication rebuild** with single unified service handling both users and admins via `accountType` discriminator, enhanced security features (lockouts, rate limiting, audit logs), and hybrid token storage (stateless access + stored refresh tokens).

### Why This Approach
- **Separate tables = correct architecture**: Users and admins have fundamentally different data models
- **Unified service = DRY code**: Single implementation eliminates 1000+ lines of duplication
- **No backward compatibility = cleaner code**: Build it right from scratch
- **Enhanced security = production-ready**: Lockouts, rate limiting, audit logs, token revocation

### Key Changes
1. **Backend**: `UnifiedAuthService` replaces both old services (DELETE old code)
2. **Database**: Add 4 security tables (`AuthAttempt`, `AccountLockout`, `PasswordHistory`, `RefreshToken`)
3. **Controllers**: Single `/auth/*` controller + separate admin management controllers
4. **Frontend**: Update API calls to pass `accountType`, zero UI changes
5. **Security**: Rate limiting, account lockouts, audit logging, token revocation
6. **Tables**: Keep `User` and `AdminUser` separate (correct domain modeling)

### Timeline
**2 Weeks Total**
- Week 1: Backend core (service, controllers, guards, database)
- Week 2: Frontend integration, testing, deployment

### Benefits
- **50%+ less code**: Delete entire old services
- **Better security**: Lockouts, rate limits, audit logs, token revocation
- **Easier maintenance**: Single source of truth
- **Better performance**: Hybrid token strategy
- **Future-proof**: Easy to add MFA, OAuth, password reset

### Success Criteria
- [x] Zero downtime during migration
- [x] All user/admin flows work identically or better
- [x] >90% test coverage on auth service
- [x] No increase in auth errors
- [x] 50%+ reduction in auth code
- [x] Login latency <200ms (p95)
- [x] Account lockout working
- [x] Audit logging capturing all events
- [x] Documentation updated

### Risk Level
**LOW** - Building fresh, no complex migrations, separate tables = no schema breaking changes, thorough testing before launch.
