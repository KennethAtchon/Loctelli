# Loctelli CRM System - AI Context

## 🏗️ **System Architecture**

### **Frontend (Next.js 14)**
- **Framework**: Next.js 14 with App Router
- **UI Library**: Shadcn/ui components with Tailwind CSS
- **State Management**: React Context for auth state
- **API Client**: Custom API client with automatic token refresh
- **Authentication**: JWT tokens stored in HTTP-only cookies

### **Backend (NestJS)**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management
- **Authentication**: JWT with refresh token rotation
- **Security**: Multi-layer protection (API key + JWT + Role-based access)

## 🔐 **Security Architecture**

### **Multi-Layer Security**
1. **API Key Middleware**: Protects all routes except auth and status
2. **Global JWT Guard**: Authenticates all requests (except public endpoints)
3. **Role-Based Access Control**: Enforces user permissions
4. **Resource-Level Authorization**: Users can only access their own data

### **Public Endpoints** (No Authentication Required)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /admin/auth/login` - Admin login
- `POST /admin/auth/register` - Admin registration
- `POST /admin/auth/refresh` - Admin token refresh
- `GET /status` - System status
- `GET /status/health` - Health check
- `GET /status/version` - Version info

### **Authentication Flow**
1. User logs in → receives access token (15min) + refresh token (7 days)
2. Access token sent in `x-user-token` header for all requests
3. On 401 response → automatic token refresh
4. Refresh tokens stored in Redis with rotation
5. Failed refresh → user logged out

## 📡 **API Integration Status**

### **✅ Fully Integrated Endpoints**

#### **Authentication**
- **User Auth**: `/auth/*` - Login, register, refresh, logout, profile, change-password
- **Admin Auth**: `/admin/auth/*` - Login, register, refresh, logout, profile, change-password
- **DTO Alignment**: Frontend and backend DTOs match perfectly

#### **User Management**
- **Users**: `/user/*` - CRUD operations with resource-level authorization
- **Admin User Management**: `/admin/auth/users/*` - Admin-only user management
- **Admin Account Management**: `/admin/auth/accounts/*` - Super admin account management

#### **Core Features**
- **Strategies**: `/strategy/*` - CRUD + duplication with user isolation
- **Clients**: `/client/*` - CRUD + filtering by user/strategy
- **Bookings**: `/booking/*` - CRUD + status updates
- **Chat**: `/chat/*` - Message sending, history, read status (with placeholder implementations)

#### **System**
- **Status**: `/status/*` - Health, version, system status
- **General**: `/general/*` - Dashboard stats, schema, detailed views

### **🔧 Integration Fixes Applied**

#### **1. Auth Registration DTO Alignment**
- **Fixed**: Frontend now sends `budget` field instead of `role`
- **Backend**: Expects `name`, `email`, `password`, `company?`, `budget?`
- **Frontend**: Sends matching fields

#### **2. Chat Endpoint Alignment**
- **Fixed**: Frontend endpoints now match backend
- **Send Message**: `POST /chat/send` ✅
- **Get History**: `GET /chat/messages/{clientId}` ✅
- **Added**: Placeholder implementations for read status endpoints

#### **3. Strategy Duplication**
- **Added**: `POST /strategy/{id}/duplicate` endpoint
- **Backend**: Full implementation with authorization
- **Frontend**: Already expected this endpoint

#### **4. Status Endpoints**
- **Added**: `GET /status/version` endpoint
- **Backend**: Returns package version
- **Frontend**: Already expected this endpoint

### **📋 DTO Structure Verification**

#### **User Registration**
```typescript
// Frontend & Backend Match ✅
interface RegisterDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  budget?: string;
}
```

#### **Strategy Creation**
```typescript
// Frontend & Backend Match ✅
interface CreateStrategyDto {
  userId: number;
  name: string;
  tag?: string;
  tone?: string;
  aiInstructions?: string;
  objectionHandling?: string;
  qualificationPriority?: string;
  creativity?: number;
  aiObjective?: string;
  disqualificationCriteria?: string;
  exampleConversation?: any;
  delayMin?: number;
  delayMax?: number;
}
```

#### **Client Creation**
```typescript
// Frontend & Backend Match ✅
interface CreateClientDto {
  userId: number;
  strategyId: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  customId?: string;
  status?: string;
  notes?: string;
  messages?: any;
  lastMessage?: string;
  lastMessageDate?: string;
}
```

#### **Booking Creation**
```typescript
// Frontend & Backend Match ✅
interface CreateBookingDto {
  userId: number;
  clientId?: number;
  bookingType: string;
  details: any;
  status?: string;
}
```

## 🎯 **User Registration System**

### **Self-Service Registration**
- **Frontend**: Complete registration form at `/auth/register`
- **Backend**: Public endpoint with validation
- **Security**: Password complexity requirements, email validation
- **Flow**: Register → Success message → Redirect to login

### **Admin User Creation**
- **Admin Panel**: Admins can create users via `/admin/auth/users`
- **Authorization**: Only admins and super admins
- **Audit Trail**: Tracks which admin created each user

## 🔄 **Token Management**

### **Automatic Refresh**
- **Frontend**: Detects 401 responses and automatically refreshes tokens
- **Backend**: Validates refresh tokens from Redis
- **Security**: Token rotation on refresh
- **Fallback**: Failed refresh logs user out

### **Token Storage**
- **Access Tokens**: 15 minutes expiration
- **Refresh Tokens**: 7 days expiration, stored in Redis
- **Headers**: `x-user-token` for authentication
- **Cookies**: HTTP-only cookies for secure storage

## 🛡️ **Authorization Rules**

### **Resource-Level Access**
- **Users**: Can only access their own data
- **Admins**: Can access all user data
- **Super Admins**: Can manage admin accounts

### **Endpoint Protection**
- **Public**: Auth and status endpoints
- **Authenticated**: All other endpoints require valid JWT
- **Role-Based**: Admin endpoints require admin role
- **Resource-Owned**: Users can only modify their own resources

## 📊 **Data Flow**

### **Request Flow**
1. Frontend sends request with auth headers
2. API proxy adds API key
3. Backend validates JWT token
4. Backend checks resource ownership
5. Backend returns data with proper authorization

### **Error Handling**
- **401**: Token refresh attempted
- **403**: Access denied (logged)
- **404**: Resource not found
- **422**: Validation errors
- **500**: Server errors (logged)

## 🚀 **Deployment**

### **Docker Setup**
- **Frontend**: Next.js container
- **Backend**: NestJS container
- **Database**: PostgreSQL container
- **Cache**: Redis container
- **Proxy**: Nginx for API routing

### **Environment Variables**
- **Database**: Connection strings
- **Redis**: Cache configuration
- **JWT**: Secret keys and expiration
- **API Key**: Backend protection
- **Admin Auth Code**: Admin registration

## 📝 **Development Notes**

### **Hot Reload Compatibility**
- **Frontend**: Properly handles auth state during development
- **Backend**: Maintains session state across restarts
- **Tokens**: Preserved during development reloads

### **API Testing**
- **Endpoints**: All endpoints tested and aligned
- **DTOs**: Frontend and backend types match
- **Authorization**: Proper access control implemented
- **Error Handling**: Comprehensive error responses

### **Security Considerations**
- **Input Validation**: All endpoints validate input
- **SQL Injection**: Protected via Prisma ORM
- **XSS**: Frontend sanitizes output
- **CSRF**: Protected via same-origin policy
- **Rate Limiting**: Implemented on sensitive endpoints

```typescript
import logger, { setLogLevel } from '@/lib/logger';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// Change log level at runtime
setLogLevel('error'); // Only errors will be logged
```

All previous console statements in the frontend have been replaced with this logger for consistent, environment-aware logging.

This context should provide AI models with comprehensive understanding of the Loctelli CRM system architecture, data flow, and implementation details for effective code analysis and generation. 