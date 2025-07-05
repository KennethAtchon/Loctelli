# Loctelli CRM

A comprehensive CRM application built with NestJS backend and Next.js frontend, featuring client management, sales strategies, booking system, and AI-powered chat integration with advanced authentication, admin capabilities, and automated background processes.

## 🏗️ Architecture

- **Backend**: NestJS 11 with Prisma ORM, PostgreSQL, and Redis
- **Frontend**: Next.js 15.2.4 with React 19 and TailwindCSS
- **Database**: PostgreSQL 15-alpine with Prisma ORM 6.9.0
- **Cache**: Redis 7-alpine (backend only)
- **Authentication**: Cookie-based JWT authentication with automatic login (frontend & backend)
- **AI Integration**: OpenAI-powered chat responses and sales strategies
- **UI Framework**: TailwindCSS with shadcn/ui components
- **State Management**: React Context API with cookie-based persistence
- **API Communication**: Next.js API proxy for secure backend communication

## 📁 Project Structure

```
Loctelli/
├── project/              # NestJS Backend
│   ├── src/
│   │   ├── auth/         # Authentication & authorization
│   │   │   ├── admin-auth.controller.ts
│   │   │   ├── admin-auth.service.ts
│   │   │   ├── admin-auth-code.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── guards/   # Role-based guards
│   │   ├── modules/      # Core business modules
│   │   │   ├── users/    # User management
│   │   │   ├── clients/  # Client management
│   │   │   ├── strategies/ # Sales strategies
│   │   │   ├── bookings/ # Booking management
│   │   │   └── chat/     # Chat functionality
│   │   ├── infrastructure/ # Database, Redis, config
│   │   ├── webhooks/     # External integrations
│   │   ├── background/   # Background processes
│   │   │   ├── bgprocess/
│   │   │   ├── free-slot-cron.service.ts
│   │   │   └── sales-bot.service.ts
│   │   ├── status/       # System status
│   │   ├── ghl/          # GoHighLevel integration
│   │   └── general/      # General utilities
│   ├── prisma/
│   │   ├── schema.prisma # Database schema
│   │   └── migrations/   # Database migrations
│   └── docker-compose.yml
└── my-app/               # Next.js Frontend
    ├── app/
    │   ├── (main)/       # Public pages
    │   │   └── blog/     # Blog pages
    │   ├── admin/        # Admin panel
    │   │   ├── (auth)/   # Admin auth pages
    │   │   └── (main)/   # Admin main pages
    │   ├── auth/         # Authentication pages
    │   └── api/          # API routes
    │       └── proxy/    # Backend proxy
    ├── components/       # React components
    │   ├── ui/          # Reusable UI components (shadcn/ui)
    │   ├── admin/       # Admin-specific components
    │   ├── auth/        # Auth components
    │   └── version1/    # Landing page components
    ├── lib/             # Utilities and API clients
    │   ├── api/         # API client modules
    │   ├── cookies.ts   # Cookie management
    │   ├── envUtils.ts  # Environment utilities
    │   └── utils.ts     # Utility functions
    ├── contexts/        # React contexts
    │   ├── auth-context.tsx
    │   └── admin-auth-context.tsx
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
- **Session persistence**: Users remain logged in across browser sessions
- **Admin auth codes**: Secure admin authentication with generated codes

### 👥 User Management
- **User registration and login**: Secure authentication system
- **Profile management**: Update user information and preferences
- **Company and budget tracking**: Store business-related information
- **Calendar integration**: GoHighLevel calendar integration support
- **Booking preferences**: Customizable booking time preferences
- **Location management**: GoHighLevel location integration
- **Admin user creation**: Admins can create and manage user accounts

### 🎯 Sales Strategies
- **AI-powered strategies**: Create intelligent sales approaches
- **Customizable parameters**: Tone, creativity, objectives, and more
- **Objection handling**: Pre-defined responses to common objections
- **Qualification criteria**: Define what makes a good prospect
- **Example conversations**: Template conversations for guidance
- **Delay settings**: Control response timing for natural flow
- **Disqualification criteria**: When to disqualify prospects
- **Strategy categorization**: Tag-based organization
- **Strategy duplication**: Easy strategy replication

### 👤 Client Management
- **Comprehensive client profiles**: Store all client information
- **Status tracking**: Monitor client progression through sales funnel
- **Message history**: Complete conversation history with timestamps
- **Notes and annotations**: Add context and observations
- **Custom IDs**: Integration with external systems
- **Company and position tracking**: Professional context
- **Strategy assignment**: Link clients to specific sales strategies
- **Advanced filtering**: Filter clients by various criteria
- **Real-time search**: Search by name, email, company, or phone
- **Status filtering**: Filter by active, lead, inactive, or all clients
- **Detailed client views**: Modal dialogs showing complete client information

### 🛠️ Development Tools
- **Database schema visualization**: Interactive ERD diagrams using Mermaid.js
- **Schema parsing**: Automatic parsing of Prisma schema files
- **Development utilities**: Tools for database exploration and debugging
- **Real-time schema updates**: View current database structure
- **Export capabilities**: Download schema diagrams as SVG files
- **Client statistics**: Real-time counts for different client statuses
- **Delete functionality**: Confirmation-based client deletion
- **Responsive table**: Mobile-friendly client data display

### 📅 Booking System
- **Appointment scheduling**: Create and manage meetings
- **Calendar integration**: Sync with external calendar systems
- **Status management**: Track booking status (pending, confirmed, cancelled, completed)
- **Client association**: Link bookings to specific clients
- **Flexible details**: JSON-based booking information storage
- **Date range filtering**: Filter bookings by time periods

### 🤖 AI-Powered Chat System
- **Intelligent responses**: OpenAI-powered message generation
- **Strategy-based conversations**: Use assigned sales strategies for context
- **Message history**: Complete conversation tracking with timestamps
- **Real-time communication**: Instant message delivery and status updates
- **Objection handling**: Automatic response to common sales objections
- **Tone control**: Adjust communication style based on strategy
- **Creativity settings**: Control AI response creativity levels
- **Natural delays**: Simulate human response timing

### 📊 Admin Dashboard
- **Real-time statistics**: Live data from database with automatic refresh
- **System monitoring**: Health checks for database, Redis, and services
- **User management**: Quick access to user administration
- **Interactive cards**: Clickable statistics that navigate to relevant pages
- **Growth tracking**: Monitor system growth with percentage changes
- **Recent activity**: View latest user registrations and system events
- **Performance metrics**: Track key business indicators
- **Error handling**: Graceful error display with retry functionality
- **Responsive design**: Mobile-friendly dashboard layout
- **Detailed user views**: Modal dialogs showing complete user information with all fields
- **Detailed client views**: Modal dialogs showing complete client information with all fields
- **View buttons**: Eye icon buttons to view all details for each user and client
- **Related data display**: Shows strategies, clients, bookings, and admin relationships
- **Recent clients section**: Latest clients added to the platform with detailed information
- **Database schema visualization**: Interactive ERD diagram showing database structure and relationships

### 👥 User Management (Admin)
- **Complete user management**: Full CRUD operations with role-based access control
- **Advanced search & filtering**: Search by name, email, company with role and status filters
- **Real-time statistics**: Live user counts (total, active, inactive, admin users)
- **Detailed user views**: Comprehensive user information with related strategies, clients, and bookings
- **Role management**: User role assignment and status toggling
- **Integration details**: Calendar, location, and external system integration tracking
- **Admin audit trail**: Track which admin created each user
- **User activity monitoring**: Last login tracking and activity status
- **Bulk operations**: Efficient user management with action buttons
- **Responsive design**: Mobile-friendly user management interface

### ⚙️ Settings Management (Admin)
- **Admin authorization code management**: Generate and manage admin registration codes
- **Role-based access control**: Super admin only access to sensitive settings
- **Security features**: Password masking, copy to clipboard functionality
- **Environment configuration**: Admin auth code environment variable management
- **Security best practices**: Guidelines and security information
- **Real-time code generation**: Secure auth code generation with expiration tracking
- **Access control**: Clear messaging for unauthorized users
- **Security documentation**: Comprehensive security guidelines

### 🔧 System Administration
- **Comprehensive admin panel**: Full administrative control
- **User management**: Create, update, and delete user accounts
- **System monitoring**: Real-time health status monitoring
- **Database management**: Direct database access and monitoring
- **Cache management**: Redis cache status and performance
- **API management**: Monitor API server status and performance
- **Background processes**: Automated booking and sales bot services
- **Security management**: Admin authentication and authorization

### 🔄 Background Processes
- **Free Slot Cron Service**: Automated booking slot management
- **Sales Bot Service**: AI-powered sales automation
- **Background Process Module**: Centralized background task management

### 🔌 API Proxy System
- **Secure communication**: Server-side proxy for backend communication
- **API key protection**: API keys handled server-side only
- **Request forwarding**: Automatic forwarding of authentication tokens
- **Error handling**: Comprehensive error handling and logging
- **CORS management**: Proper cross-origin request handling

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
- PostgreSQL database (15-alpine)
- Redis cache (7-alpine)
- NestJS backend API
- Next.js frontend

## 🔐 Authentication System

### Cookie-Based Authentication
The application uses secure HTTP cookies for authentication, providing:

- **Automatic Login**: Users stay logged in across browser sessions
- **Secure Token Storage**: Tokens stored in HTTP cookies with security flags
- **Automatic Token Refresh**: Seamless token renewal without user intervention
- **Enhanced Security**: Protection against XSS and CSRF attacks
- **Session Persistence**: Users remain logged in until they explicitly logout

### Key Features
- **Separate Admin/User Authentication**: Clear separation between admin and user authentication flows
- **Token Management**: Automatic handling of access and refresh tokens
- **Session Persistence**: Users remain logged in across browser sessions and page refreshes
- **Security Headers**: Proper cookie security settings (httpOnly, secure, sameSite)
- **Role-based Access Control**: Different permissions for admin and regular users
- **Admin Auth Codes**: Secure admin authentication with generated codes

### Authentication Flow
1. **API Key Authorization**: All requests include API key in `x-api-key` header (server-side)
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

## 🔌 API Documentation

The backend provides a comprehensive REST API with the following main endpoints:

### Authentication
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

### Core Modules
- **Users**: `/user/*` - User management with role-based access
- **Clients**: `/client/*` - Client management with strategy assignment
- **Strategies**: `/strategy/*` - Sales strategy management
- **Bookings**: `/booking/*` - Booking management with calendar integration
- **Chat**: `/chat/*` - AI-powered messaging functionality
- **Status**: `/status/*` - System health and status monitoring

### API Features
- **API Key Authorization**: All requests require API key in header (server-side)
- **Automatic Token Handling**: Tokens automatically included from cookies
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Validation**: Input validation using class-validator
- **Pagination**: Built-in pagination support for list endpoints
- **Query Parameters**: Advanced filtering and search capabilities

## 🛠️ Technology Stack

### Backend
- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL 15-alpine with Prisma ORM 6.9.0
- **Cache**: Redis 7-alpine for session management and caching
- **Authentication**: JWT with Passport and cookie-based sessions
- **Validation**: class-validator for input validation
- **Testing**: Jest for unit and integration testing
- **Scheduling**: @nestjs/schedule for background tasks
- **Background Processes**: Automated booking and sales bot services
- **API Key Middleware**: Route protection with API key validation

### Frontend
- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: TailwindCSS 3.4.17 with shadcn/ui components
- **State Management**: React Context API with cookie-based persistence
- **Authentication**: Cookie-based JWT with automatic login and token refresh
- **Forms**: React Hook Form 7.54.1 with Zod 3.24.1 validation
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion
- **Type Safety**: TypeScript 5
- **API Proxy**: Server-side proxy for secure backend communication

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Migrations**: Prisma Migrate
- **Code Quality**: ESLint, Prettier
- **Type Safety**: TypeScript
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
- Review the API client documentation
- Open an issue on GitHub

## 🔄 Version History

- **v0.1.0**: Initial release with core CRM functionality
- **v0.2.0**: Added AI chat integration and sales strategies
- **v0.3.0**: Enhanced admin dashboard and user management
- **v0.4.0**: Implemented cookie-based authentication with automatic login
- **v0.5.0**: Added background processes and enhanced AI integration
- **v0.6.0**: Implemented API proxy system and admin auth codes

## 📝 Logging Utility (Frontend)

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

---

Built with ❤️ using NestJS and Next.js
