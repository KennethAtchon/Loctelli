# Loctelli CRM

A comprehensive CRM application built with NestJS backend and Next.js frontend, featuring lead management, sales strategies, booking system, and AI-powered chat integration.

## 🏗️ Architecture

- **Backend**: NestJS 11 with Prisma ORM, PostgreSQL, and Redis
- **Frontend**: Next.js 15.2.4 with React 19 and TailwindCSS
- **Database**: PostgreSQL 15-alpine with Prisma ORM 6.9.0
- **Cache**: Redis 7-alpine (backend only)
- **Authentication**: Cookie-based JWT authentication with AuthService for token management
- **AI Integration**: OpenAI-powered chat responses and sales strategies
- **UI Framework**: TailwindCSS with shadcn/ui components
- **State Management**: React Context API with cookie-based persistence
- **API Communication**: Next.js API proxy with AuthService for secure backend communication

## 📁 Project Structure

```
Loctelli/
├── project/              # NestJS Backend
│   ├── src/
│   │   ├── auth/         # Authentication & authorization
│   │   ├── modules/      # Core business modules (users, leads, strategies, bookings, chat)
│   │   ├── integrations/ # External integrations (GoHighLevel, etc.)
│   │   ├── background/   # Background processes
│   │   └── infrastructure/ # Database, Redis, config
│   └── prisma/           # Database schema and migrations
└── frontend/             # Next.js Frontend
    ├── app/              # App router pages
    │   ├── admin/        # Admin panel
    │   ├── auth/         # Authentication pages
    │   └── api/          # API routes (proxy)
    ├── components/       # React components
    │   ├── ui/          # shadcn/ui components
    │   ├── customUI/    # Custom components (DataTable, etc.)
    │   └── admin/       # Admin-specific components
    ├── lib/             # Utilities and API client
    ├── contexts/        # React contexts
    └── types/           # TypeScript types
```

## 🎯 Key Features

### **Core CRM Features**
- **User Authentication**: Secure login/register with JWT tokens and automatic login
- **Admin Panel**: Comprehensive admin interface with global subaccount filtering
- **Lead Management**: Track and manage lead relationships with strategy assignment
- **Strategy Management**: Create and manage AI-powered sales strategies
- **Booking System**: Handle appointment scheduling with calendar integration
- **Chat Integration**: AI-powered conversation management with full history
- **Prompt Template System**: Global AI prompt template management with strategy integration
- **SMS System**: Complete Twilio SMS integration with campaign management, bulk messaging, and delivery tracking

### **Multi-Tenant System**
- **SubAccounts**: Multi-client support with complete data isolation
- **Global Filtering**: Admin dashboard with subaccount filtering system
- **Resource Sharing**: Global prompt templates shared across all SubAccounts
- **Scalable Management**: Efficient admin management of multiple client organizations

### **AI & Automation**
- **AI-Powered Chat**: Context-aware conversations with strategy-based responses
- **Conversation Summarization**: Automatic summarization for long conversations (50+ messages)
- **Booking Integration**: Automatic booking creation from AI responses
- **Background Processes**: Automated booking slot management and sales automation
- **SMS Automation**: Campaign scheduling, bulk messaging, and delivery status tracking

### **Security & Performance**
- **Multi-layer Security**: API key + JWT + Role-based access control
- **Rate Limiting**: Comprehensive frontend and backend rate limiting
- **Data Validation**: Comprehensive input validation and error handling
- **Real-time Updates**: Live data synchronization across the platform

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd Loctelli

# Backend setup
cd project
cp .env.example .env
npm install
docker-compose up -d db redis
npm run db:generate
npm run db:migrate

# Frontend setup
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

### 2. Environment Configuration
**Important**: Set secure environment variables in both `.env` files:
- `JWT_SECRET` - Generate with `openssl rand -hex 32`
- `API_KEY` - Generate with `openssl rand -hex 32`
- `ADMIN_AUTH_CODE` - Generate with `openssl rand -hex 16`
- `DEFAULT_ADMIN_PASSWORD` - Secure admin password
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number

### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: http://localhost:5555

## 🧪 Testing

```bash
# Backend tests
cd project
npm run test              # Unit tests
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests

# Frontend tests
cd frontend
npm test                  # Unit tests
npm run test:coverage     # Coverage report
```

**Coverage Goals**: 80%+ unit tests, 70%+ integration tests, 75%+ overall coverage

## 🔧 Development

### Backend Development
```bash
cd project
npm run start:dev        # Development server with hot reload
npm run db:migrate:dev   # Create new migration
npm run db:studio        # Open Prisma Studio
```

### Frontend Development
```bash
cd frontend
npm run dev              # Development server
npm run build            # Production build
npm run lint             # Code linting
```

### Database Management

```bash
cd project

# Create a new migration
npm run db:migrate:dev

# Deploy migrations to production
npm run db:migrate

# Reset database (development only)
npm run db:reset

# Generate Prisma lead
npm run db:generate
```

### 🔄 **Database Reset & Fresh Prisma Setup**

If you need to start fresh with Prisma (remove all migrations and start over):

```bash
cd project

# 1. Stop the application and database
docker-compose down

# 2. Remove all migration files (keep schema.prisma)
rm -rf prisma/migrations

# 3. Start database fresh
docker-compose up -d db redis

# 4. Reset Prisma state (removes migration history)
npx prisma migrate reset --force

# 5. Create initial migration from current schema
npx prisma migrate dev --name init

# 6. Generate Prisma client
npx prisma generate

# 7. Seed the database (if you have seed data)
npm run db:seed

# 8. Start the application
npm run start:dev
```

**⚠️ Warning**: This will completely remove all migration history and data. Only use in development!

**Alternative: Keep Data, Reset Migrations**
If you want to keep your data but reset migration history:

```bash
cd project
npm run db:migrate:dev   # Create new migration
npm run db:migrate       # Deploy migrations
npm run db:reset         # Reset database (development only)
```

## 🐳 Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token rotation
- **Password complexity requirements** (8+ chars, uppercase, lowercase, numbers, special chars)
- **Rate limiting** on authentication endpoints (5 attempts per 15 minutes)
- **Role-based access control** (admin, user, manager)
- **Secure cookie storage** with httpOnly, secure, and sameSite flags

### API Security
- **API key authentication** for all backend requests
- **Input validation and sanitization** to prevent XSS and injection attacks
- **Request size limits** (10MB max)
- **Security headers** (CSP, X-Frame-Options, X-Content-Type-Options)

### Data Protection
- **Password hashing** with bcrypt (12 rounds)
- **SQL injection prevention** through Prisma ORM
- **XSS protection** through input sanitization
- **CSRF protection** through SameSite cookies

## 🔌 API Documentation

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Token refresh
- `GET /auth/profile` - Get current user profile
- `POST /admin/auth/login` - Admin login
- `POST /admin/auth/register` - Admin registration

### Core Modules
- **Users**: `/user/*` - User management with role-based access
- **Leads**: `/lead/*` - Lead management with strategy assignment
- **Strategies**: `/strategy/*` - Sales strategy management
- **Bookings**: `/booking/*` - Booking management with calendar integration
- **Chat**: `/chat/*` - AI-powered messaging functionality
- **SMS**: `/sms/*` - Twilio SMS integration with campaigns and bulk messaging
- **SubAccounts**: `/admin/subaccounts/*` - Multi-tenant SubAccount management

### API Features
- **API Key Authorization**: All requests require API key in header (server-side)
- **Automatic Token Handling**: Tokens automatically included from cookies
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Pagination**: Built-in pagination support for list endpoints

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL 15-alpine with Prisma ORM 6.9.0
- **Cache**: Redis 7-alpine for session management and caching
- **Authentication**: JWT with Passport and cookie-based sessions
- **Validation**: class-validator for input validation
- **Testing**: Jest for unit and integration testing
- **Scheduling**: @nestjs/schedule for background tasks

### Frontend
- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: TailwindCSS 3.4.17 with shadcn/ui components
- **State Management**: React Context API with cookie-based persistence
- **Authentication**: Cookie-based JWT with automatic login and token refresh
- **Forms**: React Hook Form 7.54.1 with Zod 3.24.1 validation
- **Type Safety**: TypeScript 5
- **API Proxy**: Server-side proxy for secure backend communication

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Code Quality**: ESLint, Prettier
- **Environment Management**: Environment-specific configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in each module
- Review the API documentation
- Open an issue on GitHub

---

Built with ❤️ using NestJS and Next.js


