# Loctelli CRM System - AI Context

## 🏗️ System Architecture

### **Frontend (Vite + React + TanStack)**
- **Build Tool**: Vite 6.x for fast development and optimized builds
- **Framework**: React 19.2.1 with modern hooks
- **Routing**: TanStack Router 1.95.0 (type-safe, file-based routing)
- **Data Fetching**: TanStack Query 5.62.11 (React Query)
- **UI Library**: Shadcn/ui components with Tailwind CSS 4.0
- **State Management**: React Context for auth state
- **API Client**: Simplified API client with AuthManager for token management
  - **Architecture**: Simplified architecture implemented (see `frontend/docs/architecture/api-client-rearchitecture.md`)
  - **Auth Header**: Uses `Authorization: Bearer token` format (backend supports both Bearer and x-user-token)
  - **401 Handling**: Moved to React Query error handlers (see `frontend/lib/api/react-query-error-handler.ts`)
  - **Rate Limiting**: Client-side rate limiting for user feedback (backend handles actual rate limiting)
- **Authentication**: JWT tokens with automatic refresh handling
- **Development**: Fast HMR (Hot Module Replacement) with Vite

### **Backend (NestJS 11)**
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis for session management
- **Authentication**: JWT with refresh token rotation
- **Security**: Multi-layer protection (API key + JWT + Role-based access)

### **Multi-Tenant Architecture**
- **SubAccounts**: Multi-tenant support for client organizations ✅
- **Data Isolation**: Complete separation between SubAccounts ✅
- **Global Resources**: Shared prompt templates across all SubAccounts ✅
- **Global Filtering**: Admin dashboard with subaccount filtering system ✅

## 🔐 Security Architecture

### **Multi-Layer Security**
1. **API Key Middleware**: Protects all routes except auth and status
2. **Global JWT Guard**: Authenticates all requests (except public endpoints)
3. **Role-Based Access Control**: Enforces user permissions
4. **Resource-Level Authorization**: Users can only access their own data
5. **System User Pattern**: Admins map to shared system user for user-specific operations

### **Public Endpoints** (No Authentication Required)
- `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`
- `POST /admin/auth/login`, `POST /admin/auth/register`, `POST /admin/auth/refresh`
- `GET /status`, `GET /status/health`, `GET /status/version`

### **Rate Limiting**
- **Auth Endpoints**: 5 requests per 15 minutes
- **API Endpoints**: 1000 requests per 15 minutes
- **Frontend**: Simple toast notifications for rate limit alerts
- **Smart Retry Timing**: Uses Redis TTL for accurate retry timing

## 🧪 Testing Infrastructure

### **Test Coverage**
- **Unit Tests**: 80%+ coverage target for service and controller methods
- **Integration Tests**: 70%+ coverage for module interactions
- **E2E Tests**: Complete user journey testing
- **Test Utilities**: Comprehensive mock services and test helpers

### **Test Structure**
- **Unit Tests**: `src/**/*.spec.ts` - Individual service/controller tests
- **E2E Tests**: `test/*.e2e-spec.ts` - End-to-end API testing
- **Test Utilities**: `test/test-utils.ts` - Common test helpers and mocks

## 📡 API Integration Status

### **✅ Fully Integrated & Verified Endpoints**

#### **Authentication**
- **User Auth**: `/auth/*` - Login, register, refresh, logout, profile, change-password
- **Admin Auth**: `/admin/auth/*` - Login, register, refresh, logout, profile, change-password
- **DTO Alignment**: Frontend and backend DTOs match perfectly

#### **Core Features**
- **Users**: `/user/*` - CRUD operations with resource-level authorization
- **Strategies**: `/strategy/*` - CRUD + duplication with user isolation + prompt template integration
- **Leads**: `/lead/*` - CRUD + filtering by user/strategy
- **Bookings**: `/booking/*` - CRUD + status updates
- **Chat**: `/chat/*` - Message sending, history, read status
- **Prompt Templates**: `/admin/prompt-templates/*` - CRUD + activation + default management
- **SubAccounts**: `/admin/subaccounts/*` - Multi-tenant SubAccount management

#### **SMS System** ✅ **FULLY IMPLEMENTED**
- **SMS Core**: `/sms/*` - Single SMS, bulk SMS, campaigns, history, statistics
- **SMS Campaigns**: `/sms/campaigns/*` - Campaign management, scheduling, tracking
- **SMS Settings**: `/sms/settings` - Twilio configuration, rate limits, testing
- **SMS History**: `/sms/messages` - Message history, filtering, export
- **Twilio Integration**: Complete Twilio API integration with error handling and retry logic

#### **System**
- **Status**: `/status/*` - Health, version, system status
- **General**: `/general/*` - Dashboard stats, schema, detailed views

### **🔧 Key Integration Fixes Applied**
- **Auth Registration**: Frontend sends `budget` field instead of `role`
- **Chat Endpoints**: Frontend endpoints now match backend (`POST /chat/send`, `GET /chat/messages/{leadId}`)
- **Strategy Duplication**: `POST /strategy/{id}/duplicate` endpoint implemented
- **HTTP Methods**: Admin profile update uses PUT instead of PATCH
- **Prompt Template Integration**: Strategy creation includes prompt template selection
- **Auto-Login**: Both admin and user registration automatically log users in
- **SMS Integration**: Complete Twilio SMS integration with campaign management and bulk messaging

## 💬 Chat System Architecture

### **Core Components**
- **SalesBotService**: Core AI response generation service
- **PromptHelperService**: Prompt composition and management
- **ChatService**: Message handling and conversation management
- **ConversationSummarizerService**: AI-powered conversation summarization

### **Conversation Summarization**
- **Trigger**: Automatically summarizes conversations when they reach 50 messages
- **Summarization**: Uses OpenAI to create concise summaries of the first 30 messages
- **Storage**: Replaces first 30 messages with a single summary message
- **Context Preservation**: Summary includes key topics, decisions, and unresolved issues

### **AI-Powered Conversations**
- **Context-Aware**: AI maintains conversation context across all messages
- **Strategy-Based**: Responses tailored to specific sales strategies
- **Lead-Specific**: Personalized interactions based on lead profiles
- **Owner-Lead Clarity**: AI clearly understands the difference between company owner and lead
- **Booking Integration**: Automatic booking creation from AI responses

## 🎯 Prompt Template & Strategy Integration

### **How it Works**
- **Prompt Templates**: Created and managed by admins with active/default status
- **Strategy Linkage**: Every strategy must be linked to a prompt template (`promptTemplateId`)
- **Auto-Assignment**: Backend automatically assigns active template as default choice for new strategies
- **Chat Integration**: Chat system uses the prompt template linked to the strategy for all AI responses

### **Template Status**
- **Active Template**: Used as default choice when creating new strategies
- **Default Template**: Used as fallback when no active template exists
- **User Choice**: Users can always select any template, active/default only affects auto-assignment

## 🔄 Token Management

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

## 🛡️ Authorization Rules

### **Resource-Level Access**
- **Users**: Can only access their own data within their SubAccount
- **Admins**: Can access all user data within their created SubAccounts (via system user mapping)
- **Super Admins**: Can manage admin accounts and all SubAccounts

### **SubAccount Isolation**
- **Data Separation**: Complete isolation between SubAccounts
- **Cross-SubAccount Access**: Users cannot access data from other SubAccounts
- **Admin Scope**: Admins can only manage SubAccounts they created
- **Global Resources**: Prompt templates remain accessible across all SubAccounts

## 📊 Data Flow

### **Request Flow**
1. Frontend sends request with auth headers
2. API proxy adds API key
3. Backend validates JWT token
4. Backend validates SubAccount access (if applicable)
5. Backend filters data by SubAccount context
6. Backend checks resource ownership
7. Backend returns data with proper authorization

### **Error Handling**
- **401**: Token refresh attempted
- **403**: Access denied (logged)
- **404**: Resource not found
- **422**: Validation errors
- **500**: Server errors (logged)

## 🔗 Integrations System

### **GoHighLevel CRM Integration**
- **Type Safety**: Proper TypeScript interfaces for GHL integration config and webhook data
- **Subaccount Mapping**: `locationId` properly typed as GHL subaccount identifier
- **Webhook Processing**: Real-time contact creation and message handling
- **Configuration**: API key, location ID (subaccount), calendar ID, webhook URL
- **Contact Management**: Automatic lead creation from GHL contact webhooks
- **Message Handling**: AI-powered responses to GHL outbound messages

### **Integration Framework**
- **Extensible Architecture**: Designed for additional integrations (Facebook Ads, Google Analytics)
- **Admin Management**: Complete admin interface for managing integration templates and configurations
- **Security Framework**: Encrypted configuration storage and comprehensive access controls
- **Connection Testing**: Validate integrations before activation with comprehensive error handling

## 🚀 Deployment

### **Docker Setup**
- **Frontend**: Next.js container
- **Backend**: NestJS container
- **Database**: PostgreSQL container
- **Cache**: Redis container

### **Environment Variables**
- **Database**: Connection strings
- **Redis**: Cache configuration
- **JWT**: Secret keys and expiration
- **API Key**: Backend protection
- **Admin Auth Code**: Admin registration

## 📝 Development Notes

### **API Testing**
- **Endpoints**: All endpoints tested and aligned ✅
- **DTOs**: Frontend and backend types match ✅
- **Authorization**: Proper access control implemented ✅
- **Error Handling**: Comprehensive error responses ✅

### **Security Considerations**
- **Input Validation**: All endpoints validate input
- **SQL Injection**: Protected via Prisma ORM
- **XSS**: Frontend sanitizes output
- **CSRF**: Protected via same-origin policy
- **Rate Limiting**: Implemented on sensitive endpoints

### **Logging Utility (Frontend)**
```typescript
import logger, { setLogLevel } from '@/lib/logger';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// Change log level at runtime
setLogLevel('error'); // Only errors will be logged
```

## 🔍 Recent Verification Summary

### **Endpoint Audit Results**
- **Total Endpoints Checked**: 50+
- **Fully Aligned**: 100% ✅
- **HTTP Methods Correct**: 100% ✅
- **DTO Structures Match**: 100% ✅
- **Authorization Working**: 100% ✅

### **System Status**
- **Frontend-Backend Integration**: ✅ Fully Verified
- **API Endpoints**: ✅ All Working
- **Authentication**: ✅ Secure & Functional
- **Authorization**: ✅ Properly Implemented
- **Data Flow**: ✅ Correctly Configured

## 🔑 System User Pattern for Admin Operations

### **Problem Solved**
- **Foreign Key Constraints**: Admin users (AdminUser table) couldn't access user-specific features (User table)
- **Business Finder Access**: Admin searches failed due to `BusinessSearch.userId` foreign key violations
- **Scalable Solution**: All admin operations now use a shared system user account

### **Implementation Architecture**

#### **System User (user@loctelli.com - ID: 1)**
- **Shared Resource**: All admins share this single user account for operations
- **Security**: Extremely secure password (128+ chars, high salt rounds, auto-generated)
- **Role**: Marked as `system` role to distinguish from regular users
- **SubAccount**: Uses Default SubAccount for proper data isolation

#### **Authentication Flow**
```typescript
// JWT Strategy automatically maps admin users
AdminUser (JWT) -> SystemUserService -> user@loctelli.com (operations)

// Admin token includes both IDs
{
  userId: 123,        // Admin's real ID (for rate limiting, audit)
  systemUserId: 1,    // System user ID (for operations)
  type: 'admin'
}
```

#### **SystemUserService Pattern**
```typescript
// Get effective user ID for operations
getEffectiveRegularUserId(user) -> user.type === 'admin' ? 1 : user.userId

// Services use this pattern
businessFinderService.searchBusinesses(searchDto, user) // Pass full user object
-> systemUserService.getEffectiveRegularUserId(user) // Internally resolves to system user
```

#### **Service Layer Updates**
- **Business Finder**: Updated to accept user objects, maps admins to system user
- **API Keys**: Admin API keys stored under system user account
- **Search History**: Admin searches tracked under system user
- **Rate Limiting**: Still uses admin's real ID for proper tracking
- **Audit Logging**: Logs admin operations with both admin ID and system user mapping

#### **Security Features**
- **Password Security**: 128+ character auto-generated password with bcrypt(15)
- **Startup Initialization**: System user password updated on every app start
- **Audit Trail**: All admin operations logged with admin identity
- **Rate Limit Separation**: Admin rate limits separate from user operations

### **Usage in Other Services**
When implementing user-specific features that admins need access to:

1. **Accept full user object** instead of just `userId`
2. **Use SystemUserService.getEffectiveRegularUserId()** for database operations
3. **Keep rate limiting on admin's real ID** for proper tracking
4. **Log admin operations** for audit purposes

This pattern ensures admins can access all user-specific systems while maintaining security, audit trails, and proper data isolation.

This context provides AI models with comprehensive understanding of the Loctelli CRM system architecture, data flow, and implementation details for effective code analysis and generation.

 