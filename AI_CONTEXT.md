# Loctelli CRM - AI Context Documentation

This document provides comprehensive context for AI models to understand the Loctelli CRM system architecture, data models, and implementation details.

## System Overview

Loctelli is a comprehensive CRM application with AI-powered sales automation capabilities. The system consists of a NestJS backend API and a Next.js frontend, with PostgreSQL database and Redis caching. The application features advanced authentication, client management, sales strategies, booking systems, and AI-powered chat integration with automated background processes.

## Architecture Context

### Technology Stack
- **Backend**: NestJS 11 with TypeScript
- **Frontend**: Next.js 15.2.4 with React 19
- **Database**: PostgreSQL with Prisma ORM 6.9.0
- **Cache**: Redis 7-alpine
- **Authentication**: Cookie-based JWT authentication with automatic login
- **AI Integration**: OpenAI-powered chat responses and sales strategies
- **UI Framework**: TailwindCSS with shadcn/ui components
- **State Management**: React Context API with cookie-based persistence
- **API Communication**: Next.js API proxy for secure backend communication

### Key Components
1. **Authentication System**: Multi-level auth with admin and user roles, cookie-based with automatic login
2. **User Management**: User profiles with company, budget tracking, and calendar integration
3. **Sales Strategies**: AI-powered sales approaches with customizable parameters and objection handling
4. **Client Management**: Comprehensive client profiles with message history and status tracking
5. **Booking System**: Appointment scheduling with calendar integration and status management
6. **Chat System**: AI-powered messaging with strategy-based responses and real-time communication
7. **Admin Dashboard**: Comprehensive admin panel with user management and system monitoring
8. **Background Processes**: Automated booking management and sales bot services
9. **Development Tools**: Database schema visualization and development utilities
10. **API Proxy System**: Secure server-side communication between frontend and backend

## Data Models

### Core Entities

#### User Entity
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  role: string; // "admin", "user", "manager"
  isActive: boolean;
  company?: string;
  budget?: string;
  bookingsTime?: any; // JSON field for booking preferences
  bookingEnabled: number; // 0 = False, 1 = True
  calendarId?: string; // GoHighLevel calendar integration
  locationId?: string; // GoHighLevel location integration
  assignedUserId?: string; // External system user ID
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdByAdminId?: number; // ID of admin who created this user
  createdByAdmin?: AdminUser; // Relation to admin
  strategies?: Strategy[];
  clients?: Client[];
  bookings?: Booking[];
}
```

#### Strategy Entity (AI-Powered Sales Approach)
```typescript
interface Strategy {
  id: number;
  userId: number;
  name: string;
  tag?: string; // Strategy categorization
  tone?: string; // Communication tone (professional, casual, etc.)
  aiInstructions?: string; // Specific AI instructions for response generation
  objectionHandling?: string; // Pre-defined responses to common objections
  qualificationPriority?: string; // What makes a good prospect
  creativity?: number; // AI creativity level (1-10 scale)
  aiObjective?: string; // Primary AI objective for this strategy
  disqualificationCriteria?: string; // When to disqualify prospects
  exampleConversation?: any; // JSON field for conversation templates
  delayMin?: number; // Minimum delay in seconds for responses
  delayMax?: number; // Maximum delay in seconds for responses
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  clients?: Client[];
}
```

#### Client Entity
```typescript
interface Client {
  id: number;
  userId: number;
  strategyId: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string; // Job title/position
  customId?: string; // External system integration ID
  messageHistory?: any; // JSON array of complete conversation history
  status: string; // "lead", "prospect", "customer", "disqualified", etc.
  notes?: string; // Additional notes and observations
  lastMessage?: string; // Most recent message content
  lastMessageDate?: string; // Timestamp of last message
  user?: User;
  strategy?: Strategy;
  bookings?: Booking[];
}
```

#### Booking Entity
```typescript
interface Booking {
  id: number;
  userId: number;
  clientId?: number; // Optional client association
  bookingType: string; // Type of booking (meeting, call, etc.)
  details: any; // JSON object with booking details (time, duration, etc.)
  status: string; // "pending", "confirmed", "cancelled", "completed"
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  client?: Client;
}
```

#### AdminUser Entity
```typescript
interface AdminUser {
  id: number;
  name: string;
  email: string;
  password: string; // Hashed with bcrypt
  role: string; // "admin", "super_admin"
  isActive: boolean;
  permissions?: any; // JSON field for granular permissions
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdUsers?: User[]; // Users created by this admin
}
```

## API Structure

### API Proxy System
The frontend communicates with the backend through a Next.js API proxy (`/api/proxy/[...path]`) that:
- Handles API key authentication server-side
- Forwards user authentication tokens
- Provides secure communication between frontend and backend
- Manages CORS and request/response handling

### Authentication Endpoints
- `POST /auth/login` - User login with cookie-based token storage
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh with automatic cookie update
- `GET /auth/profile` - Get current user profile
- `POST /auth/change-password` - Change user password
- `POST /auth/logout` - User logout
- `POST /admin/auth/login` - Admin login with separate cookie storage
- `POST /admin/auth/register` - Admin registration
- `POST /admin/auth/refresh` - Admin token refresh
- `GET /admin/auth/profile` - Get admin profile
- `GET /admin/auth/users` - Get all users (admin only)
- `POST /admin/auth/generate-auth-code` - Generate admin auth code
- `GET /admin/auth/current-auth-code` - Get current auth code

### Core API Modules

#### Users API (`/user`)
- `GET /user` - Get all users (admin only)
- `GET /user/:id` - Get user by ID
- `POST /user` - Create new user
- `PUT /user/:id` - Update user
- `DELETE /user/:id` - Delete user

#### Strategies API (`/strategy`)
- `GET /strategy` - Get all strategies for current user
- `GET /strategy/:id` - Get strategy by ID
- `POST /strategy` - Create new strategy
- `PATCH /strategy/:id` - Update strategy
- `DELETE /strategy/:id` - Delete strategy
- `GET /strategy?userId=:userId` - Get strategies by user (admin only)
- `POST /strategy/:id/duplicate` - Duplicate strategy

#### Clients API (`/client`)
- `GET /client` - Get all clients for current user
- `GET /client/:id` - Get client by ID
- `POST /client` - Create new client
- `PATCH /client/:id` - Update client
- `DELETE /client/:id` - Delete client
- `GET /client?userId=:userId` - Get clients by user (admin only)
- `GET /client?strategyId=:strategyId` - Get clients by strategy

#### General API (`/general`)
- `GET /general/dashboard-stats` - Get dashboard statistics
- `GET /general/system-status` - Get system health status
- `GET /general/recent-clients` - Get recent clients
- `GET /general/users/:id/detailed` - Get detailed user information
- `GET /general/clients/:id/detailed` - Get detailed client information
- `GET /general/database-schema` - Get database schema for ERD visualization
- `GET /general/schema` - Get database schema for development tools

#### Bookings API (`/booking`)
- `GET /booking` - Get all bookings for current user
- `GET /booking/:id` - Get booking by ID
- `POST /booking` - Create new booking
- `PATCH /booking/:id` - Update booking
- `DELETE /booking/:id` - Delete booking
- `GET /booking?userId=:userId` - Get bookings by user (admin only)
- `GET /bookings?clientId=:clientId` - Get bookings by client
- `GET /bookings?startDate=:startDate&endDate=:endDate` - Get bookings by date range
- `PATCH /bookings/:id/status` - Update booking status

#### Chat API (`/chat`)
- `POST /chat/send-message` - Send a message with AI response generation
- `GET /chat/history/:clientId` - Get complete chat history for client
- `GET /chat/history/:clientId?startDate=:startDate&endDate=:endDate` - Get chat history by date range
- `PATCH /chat/messages/:messageId/read` - Mark message as read
- `DELETE /chat/messages/:messageId` - Delete message
- `GET /chat/unread-count/:clientId` - Get unread messages count
- `PATCH /chat/mark-all-read/:clientId` - Mark all messages as read

#### Status API (`/status`)
- `GET /status` - System health check
- `GET /status/health` - Health check endpoint
- `GET /status/version` - Get API version
- `GET /general/recent-clients` - Get recent clients with full details
- `GET /general/users/:id/detailed` - Get detailed user information with all related data
- `GET /general/clients/:id/detailed` - Get detailed client information with all related data
- `GET /general` - General endpoint test
- `POST /general` - General endpoint test

## AI Integration Points

### Chat System
The chat system uses OpenAI to generate intelligent responses based on:
1. **Sales Strategy Context**: Uses the client's assigned strategy for response generation
2. **Message History**: Considers previous conversation context and tone
3. **Client Profile**: Incorporates client information (company, position, status)
4. **Custom Instructions**: Follows AI instructions defined in the strategy
5. **Objection Handling**: Uses pre-defined responses for common objections
6. **Creativity Control**: Adjusts response creativity based on strategy settings

### Strategy-Based AI Responses
Each client is assigned a sales strategy that contains:
- **AI Instructions**: Specific instructions for the AI model on how to respond
- **Tone**: Desired communication tone (professional, casual, friendly, etc.)
- **Objection Handling**: Pre-defined responses to common sales objections
- **Qualification Criteria**: What makes a good prospect for this strategy
- **Creativity Level**: Controls response creativity (1-10 scale)
- **AI Objective**: Primary goal for the AI in conversations
- **Disqualification Criteria**: When to disqualify prospects
- **Delay Settings**: Natural response timing (min/max seconds)

### Message Structure
```typescript
interface ChatMessage {
  id: string;
  clientId: number;
  message: string;
  sender: 'user' | 'client';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}
```

## Frontend Architecture

### Component Structure
```
components/
├── ui/              # Reusable UI components (shadcn/ui)
├── admin/           # Admin-specific components (header, sidebar)
├── auth/            # Authentication components (protected routes)
├── version1/        # Landing page components
└── theme-provider.tsx # Theme management
```

### State Management
- **React Context API**: For global state management
- **Auth Context**: Handles user authentication state with automatic login
- **Admin Auth Context**: Separate admin authentication with automatic login
- **Cookie-based persistence**: Tokens stored in secure HTTP cookies
- **Automatic token refresh**: Seamless token renewal without user intervention
- **Session persistence**: Users remain logged in across browser sessions

### API Client
Modular API client with separate modules for each endpoint:
- **API key authorization**: Handled server-side through proxy
- **Automatic authentication**: Includes tokens from cookies in all requests
- **Token refresh handling**: Automatically refreshes expired tokens
- **Request retry logic**: Retries failed requests with new tokens
- **Error handling**: Comprehensive error handling and user feedback
- `AuthApi` - User authentication operations
- `AdminAuthApi` - Admin authentication operations
- `UsersApi` - User management operations
- `ClientsApi` - Client management operations
- `StrategiesApi` - Strategy management operations
- `BookingsApi` - Booking management operations
- `ChatApi` - Chat functionality and AI integration
- `StatusApi` - System status and health checks

## Database Schema

### Key Relationships
1. **AdminUser → User**: One-to-many (admins can create multiple users)
2. **User → Strategy**: One-to-many (users can have multiple strategies)
3. **User → Client**: One-to-many (users can have multiple clients)
4. **Strategy → Client**: One-to-many (strategies can be used by multiple clients)
5. **User → Booking**: One-to-many (users can have multiple bookings)
6. **Client → Booking**: One-to-many (clients can have multiple bookings)

### Important Fields
- **messageHistory**: JSON field storing complete conversation history with timestamps
- **permissions**: JSON field for granular admin permissions and access control
- **bookingsTime**: JSON field for user booking preferences and availability
- **exampleConversation**: JSON field for strategy conversation templates
- **details**: JSON field in bookings for flexible booking information storage
- **createdByAdminId**: Foreign key linking users to their creating admin

## Cookie-Based Authentication System

### Overview
The application uses secure HTTP cookies for authentication token storage, providing automatic login functionality and enhanced security compared to localStorage.

### Key Features
- **Automatic Login**: Users are automatically logged in when they visit the app if they have valid authentication cookies
- **Secure Token Storage**: Tokens stored in HTTP cookies with secure settings (httpOnly, secure, sameSite)
- **Automatic Token Refresh**: Access tokens are automatically refreshed when they expire
- **Separate Admin/User Tokens**: Clear separation between admin and user authentication flows
- **Session Persistence**: Users remain logged in across browser sessions

### Cookie Structure
```typescript
// Regular User Tokens
access_token: string;     // 1 hour TTL
refresh_token: string;    // 7 days TTL

// Admin Tokens
admin_access_token: string;     // 1 hour TTL
admin_refresh_token: string;    // 7 days TTL
```

### Cookie Security Settings
- **Path**: `/` (available across the entire domain)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `strict` (prevents CSRF attacks)
- **HttpOnly**: `true` when supported by server
- **MaxAge**: Configurable expiration times

### Authentication Flow
1. **API Key Authorization**: All requests include API key in `x-api-key` header (server-side)
2. **Login**: Tokens stored in cookies, user automatically logged in
3. **API Requests**: Tokens automatically included in request headers
4. **Token Expiry**: Automatic refresh without user intervention
5. **Logout**: All cookies cleared, user redirected to login
6. **Session Persistence**: Users stay logged in across sessions

### Implementation Files
- `lib/cookies.ts` - Cookie management utility functions
- `contexts/auth-context.tsx` - User authentication context with automatic login
- `contexts/admin-auth-context.tsx` - Admin authentication context with automatic login
- `lib/api/client.ts` - API client with automatic token handling
- `components/auth/protected-route.tsx` - Route protection component
- `components/auth/admin-protected-route.tsx` - Admin route protection component
- `app/api/proxy/[...path]/route.ts` - API proxy for secure backend communication

## CORS Configuration

The backend is configured with CORS to allow cross-origin requests from the frontend:

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',
    'http://loctelli_frontend:3000',
    'http://frontend:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-API-Key',
    'x-api-key',
    'X-User-Token',
    'x-user-token'
  ],
});
```

### Allowed Headers
- `Content-Type`: Standard content type header
- `Authorization`: Standard authorization header
- `X-API-Key` / `x-api-key`: API key for backend authorization
- `X-User-Token` / `x-user-token`: User authentication tokens

## Security Considerations

### Authentication
- **Cookie-based JWT authentication** with automatic login functionality
- **Secure token storage** using HTTP cookies with proper security flags
- **Automatic token refresh** - handles expired tokens seamlessly
- **Role-based access control** (admin, user, manager)
- **Password hashing** with bcrypt
- **Protected routes** with guards and middleware
- **Multi-level authentication** - separate admin and user authentication flows
- **Session persistence** - users remain logged in across sessions
- **API key protection** - server-side only, not exposed to client

### Data Protection
- Input validation with class-validator
- SQL injection prevention through Prisma ORM
- XSS protection through proper data sanitization
- CSRF protection through SameSite cookie settings
- API key authorization for all backend requests
- Server-side proxy for secure API communication

## Integration Points

### External Integrations
- **GoHighLevel**: Calendar and location integration for booking management
- **OpenAI**: AI-powered chat responses and conversation generation
- **Redis**: Caching and session management
- **PostgreSQL**: Primary data storage with Prisma ORM

### Webhook Support
- Contact creation webhooks for external system integration
- Outbound message webhooks for communication tracking
- General webhook event handling for extensibility

## Development Workflow

### Backend Development
- NestJS CLI for module generation and scaffolding
- Prisma for database management and migrations
- Jest for unit and integration testing
- ESLint for code quality and consistency
- Background processes for automated tasks
- API key middleware for route protection

### Frontend Development
- Next.js App Router for modern React development
- TypeScript for type safety and better development experience
- TailwindCSS for utility-first styling
- shadcn/ui for consistent component library
- React Context API for state management
- API proxy for secure backend communication

### Database Management
- Prisma Migrate for schema changes and versioning
- Prisma Studio for database visualization and management
- Automatic client generation for type safety
- Migration rollback capabilities

## Common Patterns

### API Response Format
```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp?: string;
}
```

### Error Handling
```typescript
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
```

### Pagination
```typescript
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

## Environment Configuration

### Backend Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing secret for access tokens
- `JWT_REFRESH_SECRET`: JWT signing secret for refresh tokens
- `NODE_ENV`: Environment mode (development, production, test)
- `OPENAI_API_KEY`: OpenAI API key for AI integration
- `API_KEY`: Internal API key for service-to-service communication
- `FRONTEND_URL`: Frontend URL for CORS configuration

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL for client-side requests (defaults to proxy)
- `BACKEND_URL`: Backend URL for proxy communication
- `API_KEY`: **Required** - API key for backend authorization (server-side only)
- `NODE_ENV`: Environment mode
- `NEXT_PUBLIC_APP_URL`: Application URL for cookie settings

## Deployment

### Docker Configuration
- Multi-service Docker Compose setup
- PostgreSQL 15-alpine and Redis 7-alpine containers with health checks
- Volume persistence for data storage
- Environment-specific configurations
- Health checks for all services

### Production Considerations
- Environment-specific configurations
- Database migrations and seeding
- Static asset optimization
- API rate limiting and security
- Monitoring and logging setup
- SSL/TLS certificate configuration
- Backup and recovery procedures

## Background Processes

### Automated Tasks
- **Free Slot Cron Service**: Automated booking slot management
- **Sales Bot Service**: AI-powered sales automation
- **Background Process Module**: Centralized background task management

## Package Versions

### Backend Dependencies
- **NestJS**: 11.0.1
- **Prisma**: 6.9.0
- **PostgreSQL**: 15-alpine
- **Redis**: 7-alpine
- **JWT**: 11.0.0
- **Passport**: 11.0.0
- **bcrypt**: 5.1.1
- **class-validator**: 0.14.2

### Frontend Dependencies
- **Next.js**: 15.2.4
- **React**: 19
- **TypeScript**: 5
- **TailwindCSS**: 3.4.17
- **shadcn/ui**: Latest components
- **Framer Motion**: Latest
- **React Hook Form**: 7.54.1
- **Zod**: 3.24.1

## Admin Dashboard Features

### Dashboard Statistics
The admin dashboard provides real-time statistics including:
- **Total Users**: Count of all registered users
- **Active Users**: Count of users with active status
- **Total Strategies**: Count of all sales strategies
- **Total Bookings**: Count of all appointments/bookings
- **Total Clients**: Count of all client records
- **Recent Users**: Latest 5 users who joined the platform
- **Growth Rates**: Percentage changes from previous month (mock data for now)

### System Status Monitoring
Real-time system health monitoring including:
- **Database Status**: PostgreSQL connection health
- **API Server Status**: Backend service availability
- **Redis Cache Status**: Cache service connectivity
- **File Storage Status**: Storage service availability

### Interactive Features
- **Refresh Button**: Manual data refresh with loading states
- **Clickable Cards**: Stats cards navigate to relevant admin pages
- **Action Buttons**: Quick access to user management and settings
- **Real-time Updates**: Live system status with color-coded badges
- **Error Handling**: Graceful error display with retry functionality
- **Detailed User Views**: Modal dialogs showing complete user information
- **Detailed Client Views**: Modal dialogs showing complete client information
- **View Buttons**: Eye icon buttons to view all details for each user/client
- **Related Data Display**: Shows strategies, clients, bookings, and admin relationships

### Dashboard Integration
- **Backend Integration**: Real data from database queries
- **API Endpoints**: Dedicated endpoints for stats and system status
- **Performance Optimized**: Parallel API calls for faster loading
- **Responsive Design**: Mobile-friendly layout with proper spacing
- **Modal Dialogs**: Detailed information displayed in scrollable modals
- **Data Relationships**: Shows connections between users, clients, strategies, and bookings
- **Database Schema Visualization**: Interactive ERD diagram showing database structure and relationships

## Database Schema Visualization

### Real-time Schema Display
The admin dashboard includes a comprehensive database schema visualization:

#### Interactive ERD Diagram
- **Mermaid.js Integration**: Uses Mermaid.js for professional entity relationship diagrams
- **Real-time Generation**: Schema diagram generated dynamically from Prisma schema
- **Live Updates**: Automatically reflects schema changes when Prisma schema is modified
- **Interactive Controls**: Zoom in/out, download, and refresh functionality

#### Schema Features
- **Entity Display**: All database tables shown with field types and constraints
- **Relationship Mapping**: Visual representation of foreign key relationships
- **Field Details**: Shows primary keys, unique constraints, nullable fields
- **Type Information**: Displays Prisma data types with Mermaid equivalents

#### Backend Integration
- **API Endpoint**: `/general/schema` provides real-time schema data
- **Schema Parsing**: Backend parses Prisma schema file and returns structured data
- **Error Handling**: Graceful fallback if schema file cannot be read
- **Performance**: Cached schema data with file modification tracking

#### UI/UX Features
- **Responsive Design**: Mobile-friendly diagram display
- **Zoom Controls**: Interactive zoom in/out with reset functionality
- **Download Option**: Export diagram as SVG for documentation
- **Code View**: Collapsible section showing raw Mermaid code
- **Loading States**: Smooth loading indicators during generation
- **Error Handling**: Graceful fallback to hardcoded schema if API fails
- **Debug Logging**: Detailed logging for troubleshooting Mermaid syntax issues
- **Simplified Relationships**: Clean relationship syntax without labels to avoid parsing errors

## Client Management Features

### Clients Page Integration
The clients page provides comprehensive client management with full backend integration:

#### Real-time Data
- **Live Client Data**: Real client information from database
- **Dynamic Statistics**: Real-time counts for total, active, lead, and inactive clients
- **Automatic Refresh**: Manual refresh with loading states
- **Error Handling**: Graceful error display with retry functionality

#### Search and Filtering
- **Real-time Search**: Search by name, email, company, or phone
- **Status Filtering**: Filter by active, lead, inactive, or all clients
- **Dynamic Results**: Live filtering with result counts
- **Empty States**: Helpful messages when no results found

#### Detailed Client Views
- **Complete Information**: All client fields displayed in modal dialogs
- **Related Data**: Shows assigned user, strategy, and bookings
- **Timestamps**: Creation, update, and last message dates
- **Notes and Messages**: Full notes and last message content
- **Responsive Modals**: Scrollable dialogs for large datasets

#### Action Functionality
- **View Details**: Eye icon buttons for complete client information
- **Edit Clients**: Links to edit pages (when implemented)
- **Delete Clients**: Confirmation-based deletion with automatic refresh
- **Add Clients**: Quick access to client creation

#### UI/UX Features
- **Loading States**: Spinners and skeleton loading
- **Status Badges**: Color-coded status indicators
- **Responsive Table**: Mobile-friendly data display
- **Empty States**: Helpful messaging when no data available
- **Real-time Updates**: Automatic data refresh after actions

## User Management Features

### Users Page Integration
The users page provides comprehensive user management with full backend integration:

#### Real-time Data
- **Live User Data**: Real user information from database
- **Dynamic Statistics**: Real-time counts for total, active, inactive, and admin users
- **Automatic Refresh**: Manual refresh with loading states
- **Error Handling**: Graceful error display with retry functionality

#### Search and Filtering
- **Real-time Search**: Search by name, email, or company
- **Role Filtering**: Filter by user, manager, admin, or all roles
- **Status Filtering**: Filter by active, inactive, or all users
- **Dynamic Results**: Live filtering with result counts
- **Empty States**: Helpful messages when no results found

#### Detailed User Views
- **Complete Information**: All user fields displayed in modal dialogs
- **Related Data**: Shows strategies, clients, bookings, and admin relationships
- **Integration Details**: Calendar ID, location ID, and assigned user ID
- **Timestamps**: Creation, update, and last login dates
- **Admin Audit Trail**: Shows which admin created each user

#### Action Functionality
- **View Details**: Eye icon buttons for complete user information
- **Edit Users**: Full user editing with role and status management
- **Delete Users**: Confirmation-based deletion with automatic refresh
- **Create Users**: User creation with role assignment
- **Status Toggle**: Enable/disable user accounts

#### UI/UX Features
- **Loading States**: Spinners and skeleton loading
- **Role Badges**: Color-coded role indicators (admin=red, manager=secondary, user=outline)
- **Status Badges**: Active/inactive status indicators
- **Responsive Table**: Mobile-friendly data display
- **Empty States**: Helpful messaging when no data available
- **Real-time Updates**: Automatic data refresh after actions

## Settings Management Features

### Settings Page Integration
The settings page provides admin configuration management with role-based access:

#### Authorization Code Management
- **Current Code Display**: Shows current admin authorization code
- **Code Generation**: Generate new secure authorization codes
- **Security Features**: Password masking with show/hide toggle
- **Copy Functionality**: One-click copy to clipboard
- **Environment Integration**: Instructions for environment variable setup

#### Role-based Access Control
- **Super Admin Only**: Settings access restricted to super admin role
- **Access Denied**: Clear messaging for unauthorized users
- **Security Information**: Best practices and security guidelines
- **Environment Configuration**: Admin auth code environment variable management

#### Security Features
- **Password Masking**: Auth codes hidden by default with toggle
- **Copy to Clipboard**: Secure copying with success notifications
- **Code Generation**: Secure random code generation
- **Expiration Tracking**: Code expiration information
- **Security Guidelines**: Best practices documentation

#### UI/UX Features
- **Loading States**: Spinners during code generation
- **Success Notifications**: Toast notifications for actions
- **Error Handling**: Graceful error display
- **Security Information**: Comprehensive security documentation
- **Responsive Design**: Mobile-friendly layout

## Logging Utility (Frontend)

A streamlined logger is implemented using the `loglevel` library in `my-app/lib/logger.ts`:

- **Environment-based log levels**: In production, only warnings and errors are logged. In development, debug/info logs are enabled.
- **Runtime control**: You can change the log level at runtime using `setLogLevel`.
- **Usage**: Import `logger` and use `logger.debug`, `logger.info`, `logger.warn`, `logger.error` instead of `console.log`/`console.warn`/`console.error`.

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