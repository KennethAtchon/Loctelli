# Project Plan: CRM with NestJS Backend and Next.js Frontend

## 1. Project Goals
- Connect the existing NestJS backend (`project/`) with the Next.js frontend (`my-app/`)
- Create a CRM web application with a scalable, maintainable architecture
- Use the existing Prisma ORM setup with PostgreSQL database
- Integrate Redis for caching and session management on the backend
- Implement proper authentication system based on Users (accounts)

## 2. Current Architecture
```
Loctelli/
├── project/              # NestJS Backend (existing)
│   ├── src/
│   │   ├── auth/         # Authentication system
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── decorators/
│   │   │   └── guards/
│   │   ├── users/        # User account management
│   │   ├── clients/      # Client management (belong to users)
│   │   ├── strategies/   # Sales strategies
│   │   ├── bookings/     # Booking management
│   │   ├── chat/         # Chat functionality
│   │   ├── webhooks/     # Webhook handlers
│   │   ├── redis/        # Redis service and module
│   │   └── prisma/       # Database configuration
│   ├── prisma/
│   │   └── schema.prisma # Database schema (updated with auth)
│   ├── docker-compose.yml # PostgreSQL + Redis + Backend
│   └── package.json
└── my-app/               # Next.js Frontend (existing)
    ├── app/              # Next.js 13+ app directory
    ├── components/       # React components
    ├── lib/              # Utilities and API clients
    │   └── api/          # Modular API client
    │       ├── client.ts # Base API client
    │       ├── types.ts  # API types
    │       ├── index.ts  # Main API client
    │       └── endpoints/ # Endpoint modules
    │           ├── auth.ts
    │           ├── users.ts
    │           ├── clients.ts
    │           ├── strategies.ts
    │           ├── bookings.ts
    │           ├── chat.ts
    │           └── status.ts
    └── package.json
```

## 3. Tech Stack
- **Backend:** NestJS (existing), Prisma ORM, PostgreSQL, Redis, JWT Authentication
- **Frontend:** Next.js 15, React 19, TailwindCSS
- **Database:** PostgreSQL (via Docker)
- **Cache/Session:** Redis (backend only)
- **Authentication:** JWT with refresh tokens, bcrypt password hashing

## 4. Database Schema (Updated)
The backend has an updated schema with proper authentication:
- **Users:** User accounts with authentication (email, password, role, isActive)
- **Clients:** Client management (belong to Users)
- **Strategies:** Sales strategies (belong to Users)
- **Bookings:** Appointment booking system (belong to Users)

### User Model (Updated):
```prisma
model User {
  id              Int         @id @default(autoincrement())
  name            String
  email           String      @unique
  password        String      // Hashed password
  role            String      @default("user") // admin, user, manager
  isActive        Boolean     @default(true)
  company         String?
  // ... other fields
  lastLoginAt     DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  strategies      Strategy[]
  clients         Client[]
  bookings        Booking[]
}
```

## 5. Key Features/Modules
- **Authentication:** User login/register with JWT tokens and refresh tokens
- **User Management:** Account management with roles and permissions
- **Client Management:** View and manage client relationships (belong to users)
- **Strategy Management:** Create and manage sales strategies (belong to users)
- **Booking System:** Schedule and manage appointments (belong to users)
- **Chat Integration:** Message history and communication
- **Analytics Dashboard:** Business insights and metrics

## 6. Integration Plan
1. **✅ Setup API Client:** Create modular API client in frontend to communicate with NestJS backend
2. **✅ Authentication System:** Implement JWT-based authentication with refresh tokens
3. **✅ Environment Configuration:** Set up environment variables for API endpoints
4. **✅ Type Sharing:** Share TypeScript types between frontend and backend
5. **✅ Redis Integration:** Add Redis to backend for session management and caching

## 7. Frontend Structure (Updated)
```
my-app/
├── app/                  # Next.js app directory
│   ├── (main)/           # Public pages
│   ├── admin/            # Admin panel (protected)
│   │   ├── dashboard/    # Analytics dashboard
│   │   ├── users/        # User account management
│   │   ├── clients/      # Client management
│   │   ├── strategies/   # Strategy management
│   │   └── bookings/     # Booking management
│   ├── api/              # Next.js API routes (auth, etc.)
│   └── globals.css
├── components/           # Shared React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── tables/           # Data table components
│   ├── charts/           # Analytics components
│   └── examples/         # Example components
├── lib/                  # Utilities and API clients
│   ├── api/              # Modular API client
│   │   ├── client.ts     # Base API client with HTTP methods
│   │   ├── types.ts      # API-specific types and interfaces
│   │   ├── index.ts      # Main API client combining all endpoints
│   │   └── endpoints/    # Endpoint modules
│   │       ├── auth.ts   # Authentication endpoints
│   │       ├── users.ts  # User management endpoints
│   │       ├── clients.ts # Client management endpoints
│   │       ├── strategies.ts # Strategy management endpoints
│   │       ├── bookings.ts # Booking management endpoints
│   │       ├── chat.ts   # Chat functionality endpoints
│   │       └── status.ts # System status endpoints
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── hooks/                # Custom React hooks
├── types/                # Shared TypeScript types
└── public/               # Static assets
```

## 8. Backend Authentication System
```
project/src/auth/
├── auth.service.ts       # Authentication service with login, register, JWT
├── auth.controller.ts    # Auth endpoints (login, register, profile)
├── auth.module.ts        # Auth module configuration
├── jwt.strategy.ts       # JWT passport strategy
├── auth.guard.ts         # JWT authentication guard
├── decorators/           # Custom decorators
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
└── guards/               # Custom guards
    └── roles.guard.ts    # Role-based access control
```

### Authentication Features:
- **JWT Tokens:** Access tokens (1h) and refresh tokens (7d)
- **Password Hashing:** bcrypt with salt rounds
- **Role-based Access:** admin, user, manager roles
- **Session Management:** Redis for refresh token storage
- **Security:** Password validation, account activation status

## 9. API Client Architecture (Updated)
```
lib/api/
├── client.ts             # Base API client with HTTP methods
├── types.ts              # API-specific types and interfaces
├── index.ts              # Main API client combining all endpoints
└── endpoints/            # Individual endpoint modules
    ├── auth.ts           # Authentication endpoints
    ├── users.ts          # User account management endpoints
    ├── clients.ts        # Client management endpoints
    ├── strategies.ts     # Strategy management endpoints
    ├── bookings.ts       # Booking management endpoints
    ├── chat.ts           # Chat functionality endpoints
    └── status.ts         # System status endpoints
```

### API Usage Examples:
```typescript
import { api } from '@/lib/api';

// Authentication
const auth = await api.auth.login({ email: 'user@example.com', password: 'password' });
const profile = await api.auth.getProfile();

// User management (accounts)
const users = await api.users.getUsers();
const user = await api.users.getUser(1);

// Client management (belong to users)
const clients = await api.clients.getClients();
const userClients = await api.clients.getClientsByUser(1);
```

## 10. Environment Variables
- **Frontend (.env.local):**
  - `NEXT_PUBLIC_API_URL=http://localhost:3000` (NestJS backend)
  - `NEXTAUTH_SECRET=your-secret`
  - `NEXTAUTH_URL=http://localhost:3001`

- **Backend (.env):**
  - `DATABASE_URL=postgresql://...`
  - `JWT_SECRET=your-super-secret-jwt-key`
  - `REDIS_HOST=localhost`
  - `REDIS_PORT=6379`
  - `REDIS_PASSWORD=`
  - `REDIS_DB=0`

## 11. Next Steps
1. **✅ Setup API Client:** Create modular API client in frontend to communicate with NestJS
2. **✅ Authentication System:** Implement JWT-based authentication with refresh tokens
3. **✅ Admin Dashboard:** Create admin panel with user, client, strategy management
4. **✅ Redis Integration:** Add Redis to backend for session management
5. **✅ Type Sharing:** Create shared types between frontend and backend
6. **Database Migration:** Run migration to add auth fields to User table
7. **Testing:** Add integration tests for API communication

## 12. Development Workflow
1. Start backend: `cd project && npm run start:dev`
2. Start frontend: `cd my-app && npm run dev`
3. Backend runs on port 3000, frontend on port 3001
4. Use Docker Compose for database and Redis

## 13. Authentication Flow
1. **Login:** User provides email/password → JWT access token + refresh token
2. **API Calls:** Include Bearer token in Authorization header
3. **Token Refresh:** Use refresh token to get new access token
4. **Logout:** Invalidate refresh token in Redis
5. **Role-based Access:** Check user role for protected endpoints

---

This plan leverages your existing NestJS backend and Next.js frontend, focusing on connecting them effectively for a complete CRM solution with proper authentication based on Users (accounts) and Redis integration on the backend.
