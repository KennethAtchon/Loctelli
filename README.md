# Loctelli CRM

A comprehensive CRM application built with NestJS backend and Next.js frontend, featuring client management, sales strategies, booking system, and AI-powered chat integration.

## 🏗️ Architecture

- **Backend**: NestJS with Prisma ORM, PostgreSQL, and Redis
- **Frontend**: Next.js 15 with React 19 and TailwindCSS
- **Database**: PostgreSQL
- **Cache**: Redis (backend only)
- **Authentication**: Cookie-based JWT authentication with automatic login (frontend & backend)
- **AI Integration**: OpenAI-powered chat responses and sales strategies

## 📁 Project Structure

```
Loctelli/
├── project/              # NestJS Backend
│   ├── src/
│   │   ├── auth/         # Authentication & authorization
│   │   ├── modules/      # Core business modules
│   │   │   ├── users/    # User management
│   │   │   ├── clients/  # Client management
│   │   │   ├── strategies/ # Sales strategies
│   │   │   ├── bookings/ # Booking management
│   │   │   └── chat/     # Chat functionality
│   │   ├── infrastructure/ # Database, Redis, config
│   │   ├── webhooks/     # External integrations
│   │   └── background/   # Background processes
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── docker-compose.yml
└── my-app/               # Next.js Frontend
    ├── app/
    │   ├── (main)/       # Public pages
    │   ├── admin/        # Admin panel
    │   └── auth/         # Authentication pages
    ├── components/       # React components
    │   ├── ui/          # Reusable UI components
    │   ├── admin/       # Admin-specific components
    │   └── auth/        # Auth components
    ├── lib/             # Utilities and API clients
    │   └── api/         # API client modules
    ├── contexts/        # React contexts
    ├── hooks/           # Custom React hooks
    └── types/           # Shared TypeScript types
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Docker and Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Loctelli
```

### 2. Environment Setup

Create environment files for both backend and frontend:

```bash
# Backend environment
cp project/.env.example project/.env

# Frontend environment
cp my-app/.env.example my-app/.env.local
```

**Important**: You must set the `API_KEY` environment variable in your frontend `.env.local` file. This API key is required for all backend communication and is server-side only.

### 3. Backend Setup

```bash
cd project

# Install dependencies
npm install

# Start the database and Redis
docker-compose up -d db redis

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start the backend
npm run start:dev
```

### 4. Frontend Setup

```bash
cd my-app

# Install dependencies
npm install

# Start the frontend
npm run dev
```

### 5. Database Setup

```bash
cd project

# (Optional) Open Prisma Studio for database management
npm run db:studio
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: http://localhost:5555

## 📊 Features

### 🔐 Authentication & Authorization
- **Cookie-based authentication**: Secure HTTP cookies with automatic login functionality
- **Multi-level authentication**: Admin and regular user roles with separate token storage
- **Automatic token refresh**: Seamless token renewal without user intervention
- **Role-based access control**: Different permissions for different user types
- **Protected routes**: Automatic route protection based on user roles
- **Enhanced security**: httpOnly, secure, and sameSite cookie flags

### 👥 User Management
- **User registration and login**: Secure authentication system
- **Profile management**: Update user information and preferences
- **Company and budget tracking**: Store business-related information
- **Calendar integration**: GoHighLevel calendar integration support

### 🎯 Sales Strategies
- **AI-powered strategies**: Create intelligent sales approaches
- **Customizable parameters**: Tone, creativity, objectives, and more
- **Objection handling**: Pre-defined responses to common objections
- **Qualification criteria**: Define what makes a good prospect
- **Example conversations**: Template conversations for guidance
- **Delay settings**: Control response timing for natural flow

### 👤 Client Management
- **Comprehensive client profiles**: Store all client information
- **Status tracking**: Monitor client progression through sales funnel
- **Message history**: Complete conversation history
- **Notes and annotations**: Add context and observations
- **Custom IDs**: Integration with external systems
- **Company and position tracking**: Professional context

### 📅 Booking System
- **Appointment scheduling**: Create and manage meetings
- **Calendar integration**: Sync with external calendars
- **Status tracking**: Monitor booking states
- **Client association**: Link bookings to specific clients
- **Flexible booking types**: Support for different meeting types

### 💬 AI Chat Integration
- **Intelligent responses**: AI-powered message generation
- **Strategy-based responses**: Use sales strategies for context
- **Real-time messaging**: Instant communication with clients
- **Message history**: Complete conversation tracking
- **Custom ID support**: Integration with external chat systems

### 📊 Admin Dashboard
- **Overview statistics**: Key metrics and performance indicators
- **Recent activity feed**: Latest system activities
- **Quick action buttons**: Common administrative tasks
- **Real-time data visualization**: Charts and graphs
- **User management**: Administer user accounts
- **System monitoring**: Health checks and status

## 🔧 Development

### Backend Development

```bash
cd project

# Start development server with hot reload
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Database operations
npm run db:migrate:dev  # Create new migration
npm run db:reset        # Reset database
npm run db:studio       # Open Prisma Studio
```

### Frontend Development

```bash
cd my-app

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
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

# Generate Prisma client
npm run db:generate
```

## 🐳 Docker Development

Run the entire stack with Docker:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:
- PostgreSQL database
- Redis cache
- NestJS backend API
- Next.js frontend

## 🔐 Authentication System

### Cookie-Based Authentication
The application uses secure HTTP cookies for authentication, providing:

- **Automatic Login**: Users stay logged in across browser sessions
- **Secure Token Storage**: Tokens stored in HTTP cookies with security flags
- **Automatic Token Refresh**: Seamless token renewal without user intervention
- **Enhanced Security**: Protection against XSS and CSRF attacks

### Key Features
- **Separate Admin/User Authentication**: Clear separation between admin and user authentication flows
- **Token Management**: Automatic handling of access and refresh tokens
- **Session Persistence**: Users remain logged in until they explicitly logout
- **Security Headers**: Proper cookie security settings (httpOnly, secure, sameSite)

### Authentication Flow
1. **API Key Authorization**: All requests include API key in `x-api-key` header
2. **Login**: User credentials validated, tokens stored in secure cookies
3. **Automatic Login**: On app load, valid cookies automatically log user in
4. **API Requests**: API key and user tokens automatically included in all requests
5. **Token Refresh**: Expired tokens automatically refreshed in background
6. **Logout**: All authentication cookies cleared

### CORS Configuration
The backend is configured to allow cross-origin requests with the necessary headers:
- `x-api-key`: API key for authorization
- `x-user-token`: User authentication tokens
- `Content-Type`: Standard content type
- `Authorization`: Standard authorization header

For detailed authentication documentation, see [Cookie Authentication README](my-app/lib/cookies/README.md).

## 🔌 API Documentation

The backend provides a comprehensive REST API with the following main endpoints:

- **Authentication**: `/auth/*` - Login, register, token refresh
- **Users**: `/users/*` - User management
- **Clients**: `/clients/*` - Client management
- **Strategies**: `/strategies/*` - Sales strategy management
- **Bookings**: `/bookings/*` - Booking management
- **Chat**: `/chat/*` - Messaging functionality
- **Status**: `/status/*` - System health and status

For detailed API documentation, see the [API Client Documentation](my-app/lib/api/README.md).

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS 11
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with Passport and cookie-based sessions
- **Validation**: class-validator
- **Testing**: Jest
- **Scheduling**: @nestjs/schedule

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: React Context API with cookie-based persistence
- **Authentication**: Cookie-based JWT with automatic login and token refresh
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Code Quality**: ESLint, Prettier
- **Type Safety**: TypeScript

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
- Review the API client documentation
- Open an issue on GitHub

## 🔄 Version History

- **v0.1.0**: Initial release with core CRM functionality
- **v0.2.0**: Added AI chat integration and sales strategies
- **v0.3.0**: Enhanced admin dashboard and user management
- **v0.4.0**: Implemented cookie-based authentication with automatic login

---

Built with ❤️ using NestJS and Next.js 
