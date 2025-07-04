# Project Plan: CRM with NestJS Backend and Next.js Frontend

## 1. Project Goals
- Connect the existing NestJS backend (`project/`) with the Next.js frontend (`my-app/`)
- Create a CRM web application with a scalable, maintainable architecture
- Use the existing Prisma ORM setup with PostgreSQL database
- Integrate Redis for caching and session management on the backend

## 2. Current Architecture
```
Loctelli/
├── project/              # NestJS Backend (existing)
│   ├── src/
│   │   ├── users/        # User management
│   │   ├── clients/      # Client management
│   │   ├── strategies/   # Sales strategies
│   │   ├── bookings/     # Booking management
│   │   ├── chat/         # Chat functionality
│   │   ├── webhooks/     # Webhook handlers
│   │   ├── redis/        # Redis service and module
│   │   └── prisma/       # Database configuration
│   ├── prisma/
│   │   └── schema.prisma # Database schema (existing)
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
    │           ├── users.ts
    │           ├── clients.ts
    │           ├── strategies.ts
    │           ├── bookings.ts
    │           ├── chat.ts
    │           └── status.ts
    └── package.json
```

## 3. Tech Stack
- **Backend:** NestJS (existing), Prisma ORM, PostgreSQL, Redis
- **Frontend:** Next.js 15, React 19, TailwindCSS
- **Database:** PostgreSQL (via Docker)
- **Cache/Session:** Redis (backend only)
- **Authentication:** NextAuth.js (frontend)

## 4. Database Schema (Existing)
The backend already has a comprehensive schema with:
- **Users:** User management with GoHighLevel integration
- **Strategies:** Sales strategies with AI instructions
- **Clients:** Client management with message history
- **Bookings:** Appointment booking system

## 5. Key Features/Modules
- **Authentication:** User login/signup with NextAuth.js
- **Admin Panel:** Manage users, strategies, clients, and bookings
- **Client Management:** View and manage client relationships
- **Strategy Management:** Create and manage sales strategies
- **Booking System:** Schedule and manage appointments
- **Chat Integration:** Message history and communication
- **Analytics Dashboard:** Business insights and metrics

## 6. Integration Plan
1. **API Client Setup:** ✅ Create modular API client in frontend to communicate with NestJS backend
2. **Authentication:** Implement NextAuth.js with JWT tokens
3. **Environment Configuration:** Set up environment variables for API endpoints
4. **Type Sharing:** Share TypeScript types between frontend and backend
5. **Redis Integration:** ✅ Add Redis to backend for session management and caching

## 7. Frontend Structure (Updated)
```
my-app/
├── app/                  # Next.js app directory
│   ├── (main)/           # Public pages
│   ├── admin/            # Admin panel (protected)
│   │   ├── dashboard/    # Analytics dashboard
│   │   ├── users/        # User management
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
│   ├── auth.ts           # Authentication utilities
│   └── utils.ts          # General utilities
├── hooks/                # Custom React hooks
├── types/                # Shared TypeScript types
└── public/               # Static assets
```

## 8. Backend Redis Integration
```
project/src/redis/
├── redis.service.ts      # Redis service with caching, sessions, rate limiting
└── redis.module.ts       # Redis module for NestJS
```

### Redis Use Cases (Backend Only):
- **Session Management:** Store user sessions and authentication tokens
- **Caching:** Cache database queries and API responses
- **Rate Limiting:** Track API request limits per user/IP
- **Real-time Features:** Pub/sub for chat messages and notifications
- **Job Queues:** Background task processing

## 9. API Client Architecture (New)
```
lib/api/
├── client.ts             # Base API client with HTTP methods
├── types.ts              # API-specific types and interfaces
├── index.ts              # Main API client combining all endpoints
└── endpoints/            # Individual endpoint modules
    ├── users.ts          # User management endpoints
    ├── clients.ts        # Client management endpoints
    ├── strategies.ts     # Strategy management endpoints
    ├── bookings.ts       # Booking management endpoints
    ├── chat.ts           # Chat functionality endpoints
    └── status.ts         # System status endpoints
```

### API Usage Examples:
```typescript
import { api } from '@/lib/api';

// Get all users
const users = await api.users.getUsers();

// Create a new client
const client = await api.clients.createClient({
  userId: 1,
  strategyId: 1,
  name: 'John Doe',
  email: 'john@example.com',
});

// Send a chat message
const message = await api.chat.sendMessage({
  clientId: 1,
  message: 'Hello!',
  strategyId: 1,
});
```

## 10. Environment Variables
- **Frontend (.env.local):**
  - `NEXT_PUBLIC_API_URL=http://localhost:3000` (NestJS backend)
  - `NEXTAUTH_SECRET=your-secret`
  - `NEXTAUTH_URL=http://localhost:3001`

- **Backend (.env):**
  - `DATABASE_URL=postgresql://...`
  - `JWT_SECRET=your-jwt-secret`
  - `REDIS_HOST=localhost`
  - `REDIS_PORT=6379`
  - `REDIS_PASSWORD=`
  - `REDIS_DB=0`

## 11. Next Steps
1. **✅ Setup API Client:** Create modular API client in frontend to communicate with NestJS
2. **Authentication:** Implement NextAuth.js with JWT integration
3. **Admin Dashboard:** Create admin panel with user, client, strategy management
4. **✅ Redis Integration:** Add Redis to backend for session management
5. **Type Sharing:** Create shared types between frontend and backend
6. **Docker Compose:** Update to include Redis and frontend
7. **Testing:** Add integration tests for API communication

## 12. Development Workflow
1. Start backend: `cd project && npm run start:dev`
2. Start frontend: `cd my-app && npm run dev`
3. Backend runs on port 3000, frontend on port 3001
4. Use Docker Compose for database and Redis

---

This plan leverages your existing NestJS backend and Next.js frontend, focusing on connecting them effectively for a complete CRM solution with Redis properly integrated on the backend and a modular API client structure.
