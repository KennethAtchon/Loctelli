# Loctelli CRM - AI Context Documentation

This document provides comprehensive context for AI models to understand the Loctelli CRM system architecture, data models, and implementation details.

## System Overview

Loctelli is a CRM application with AI-powered sales automation capabilities. The system consists of a NestJS backend API and a Next.js frontend, with PostgreSQL database and Redis caching.

## Architecture Context

### Technology Stack
- **Backend**: NestJS 11 with TypeScript
- **Frontend**: Next.js 15 with React 19
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT-based with role-based access control
- **AI Integration**: OpenAI-powered chat responses and sales strategies

### Key Components
1. **Authentication System**: Multi-level auth with admin and user roles
2. **User Management**: User profiles with company and budget tracking
3. **Sales Strategies**: AI-powered sales approaches with customizable parameters
4. **Client Management**: Comprehensive client profiles with message history
5. **Booking System**: Appointment scheduling with calendar integration
6. **Chat System**: AI-powered messaging with strategy-based responses

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
  bookingsTime?: any;
  bookingEnabled: number; // 0 = False, 1 = True
  calendarId?: string;
  locationId?: string;
  assignedUserId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
  tag?: string;
  tone?: string;
  aiInstructions?: string;
  objectionHandling?: string;
  qualificationPriority?: string;
  creativity?: number;
  aiObjective?: string;
  disqualificationCriteria?: string;
  exampleConversation?: any;
  delayMin?: number; // Minimum delay in seconds
  delayMax?: number; // Maximum delay in seconds
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
  position?: string;
  customId?: string;
  messageHistory?: any; // JSON array of messages
  status: string; // "lead", "prospect", "customer", etc.
  notes?: string;
  lastMessage?: string;
  lastMessageDate?: string;
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
  clientId?: number;
  bookingType: string;
  details: any; // JSON object with booking details
  status: string; // "pending", "confirmed", "cancelled", etc.
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
  password: string; // Hashed
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

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `POST /auth/admin/login` - Admin login
- `POST /auth/admin/register` - Admin registration

### Core API Modules

#### Users API (`/users`)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Strategies API (`/strategies`)
- `GET /strategies` - Get all strategies
- `GET /strategies/:id` - Get strategy by ID
- `POST /strategies` - Create new strategy
- `PUT /strategies/:id` - Update strategy
- `DELETE /strategies/:id` - Delete strategy
- `GET /strategies/user/:userId` - Get strategies by user

#### Clients API (`/clients`)
- `GET /clients` - Get all clients
- `GET /clients/:id` - Get client by ID
- `POST /clients` - Create new client
- `PUT /clients/:id` - Update client
- `DELETE /clients/:id` - Delete client
- `GET /clients/user/:userId` - Get clients by user
- `GET /clients/strategy/:strategyId` - Get clients by strategy

#### Bookings API (`/bookings`)
- `GET /bookings` - Get all bookings
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings` - Create new booking
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Delete booking
- `GET /bookings/user/:userId` - Get bookings by user
- `GET /bookings/client/:clientId` - Get bookings by client

#### Chat API (`/chat`)
- `POST /chat/send` - Send a message
- `GET /chat/history/:clientId` - Get chat history
- `POST /chat/send-by-custom-id` - Send message by custom ID
- `POST /chat/general` - Handle general chat data

## AI Integration Points

### Chat System
The chat system uses AI to generate responses based on:
1. **Sales Strategy Context**: Uses the client's assigned strategy for response generation
2. **Message History**: Considers previous conversation context
3. **Client Profile**: Incorporates client information (company, position, etc.)
4. **Custom Instructions**: Follows AI instructions defined in the strategy

### Strategy-Based AI Responses
Each client is assigned a sales strategy that contains:
- **AI Instructions**: Specific instructions for the AI model
- **Tone**: Desired communication tone
- **Objection Handling**: Pre-defined responses to common objections
- **Qualification Criteria**: What makes a good prospect
- **Creativity Level**: Controls response creativity (1-10 scale)
- **Delay Settings**: Natural response timing (min/max seconds)

### Message Structure
```typescript
interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  metadata?: any;
}
```

## Frontend Architecture

### Component Structure
```
components/
├── ui/              # Reusable UI components (shadcn/ui)
├── admin/           # Admin-specific components
├── auth/            # Authentication components
├── examples/        # Example usage components
└── version1/        # Landing page components
```

### State Management
- **React Context API**: For global state management
- **Auth Context**: Handles authentication state with automatic login
- **Admin Auth Context**: Separate admin authentication with automatic login
- **Cookie-based persistence**: Tokens stored in secure HTTP cookies
- **Automatic token refresh**: Seamless token renewal without user intervention

### API Client
Modular API client with separate modules for each endpoint:
- **API key authorization**: Includes API key in `x-api-key` header for all requests
- **Automatic authentication**: Includes tokens from cookies in all requests
- **Token refresh handling**: Automatically refreshes expired tokens
- **Request retry logic**: Retries failed requests with new tokens
- `UsersApi` - User management
- `ClientsApi` - Client management
- `StrategiesApi` - Strategy management
- `BookingsApi` - Booking management
- `ChatApi` - Chat functionality
- `StatusApi` - System status

## Database Schema

### Key Relationships
1. **User → Strategy**: One-to-many (users can have multiple strategies)
2. **User → Client**: One-to-many (users can have multiple clients)
3. **Strategy → Client**: One-to-many (strategies can be used by multiple clients)
4. **User → Booking**: One-to-many (users can have multiple bookings)
5. **Client → Booking**: One-to-many (clients can have multiple bookings)
6. **AdminUser → User**: One-to-many (admins can create multiple users)

### Important Fields
- **messageHistory**: JSON field storing complete conversation history
- **permissions**: JSON field for granular admin permissions
- **bookingsTime**: JSON field for user booking preferences
- **exampleConversation**: JSON field for strategy conversation templates

## Cookie-Based Authentication System

### Overview
The application uses secure HTTP cookies for authentication token storage, providing automatic login functionality and enhanced security compared to localStorage.

### Key Features
- **Automatic Login**: Users are automatically logged in when they visit the app if they have valid authentication cookies
- **Secure Token Storage**: Tokens stored in HTTP cookies with secure settings (httpOnly, secure, sameSite)
- **Automatic Token Refresh**: Access tokens are automatically refreshed when they expire
- **Separate Admin/User Tokens**: Clear separation between admin and user authentication flows

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
1. **Login**: Tokens stored in cookies, user automatically logged in
2. **API Requests**: Tokens automatically included in request headers
3. **Token Expiry**: Automatic refresh without user intervention
4. **Logout**: All cookies cleared, user redirected to login

### Implementation Files
- `lib/cookies.ts` - Cookie management utility
- `contexts/auth-context.tsx` - User authentication context
- `contexts/admin-auth-context.tsx` - Admin authentication context
- `lib/api/client.ts` - API client with automatic token handling

## CORS Configuration

The backend is configured with CORS to allow cross-origin requests from the frontend:

```typescript
app.enableCors({
  origin: ['http://localhost:3000', ...],
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
- **Protected routes** with guards
- **Multi-level authentication** - separate admin and user authentication flows

### Data Protection
- Input validation with class-validator
- SQL injection prevention through Prisma ORM
- XSS protection through proper data sanitization

## Integration Points

### External Integrations
- **GoHighLevel**: Calendar and location integration
- **OpenAI**: AI-powered chat responses
- **Redis**: Caching and session management

### Webhook Support
- Contact creation webhooks
- Outbound message webhooks
- General webhook event handling

## Development Workflow

### Backend Development
- NestJS CLI for module generation
- Prisma for database management
- Jest for testing
- ESLint for code quality

### Frontend Development
- Next.js App Router
- TypeScript for type safety
- TailwindCSS for styling
- shadcn/ui for component library

### Database Management
- Prisma Migrate for schema changes
- Prisma Studio for database visualization
- Automatic client generation

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
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: JWT refresh secret
- `NODE_ENV`: Environment mode

### Frontend Environment Variables
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `API_KEY`: **Required** - API key for backend authorization (server-side only)
- `NODE_ENV`: Environment mode

## Deployment

### Docker Configuration
- Multi-service Docker Compose setup
- PostgreSQL and Redis containers
- Health checks for all services
- Volume persistence for data

### Production Considerations
- Environment-specific configurations
- Database migrations
- Static asset optimization
- API rate limiting
- Monitoring and logging

This context should provide AI models with comprehensive understanding of the Loctelli CRM system architecture, data flow, and implementation details for effective code analysis and generation. 