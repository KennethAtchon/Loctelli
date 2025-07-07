# Loctelli CRM

A comprehensive CRM application built with NestJS backend and Next.js frontend, featuring lead management, sales strategies, booking system, and AI-powered chat integration with advanced authentication, admin capabilities, and automated background processes.

## 🏗️ Architecture

- **Backend**: NestJS 11 with Prisma ORM, PostgreSQL, and Redis
- **Frontend**: Next.js 15.2.4 with React 19 and TailwindCSS
- **Database**: PostgreSQL 15-alpine with Prisma ORM 6.9.0
- **Cache**: Redis 7-alpine (backend only)
- **Authentication**: Cookie-based JWT authentication with automatic login (frontend & backend)
- **AI Integration**: OpenAI-powered chat responses and sales strategies
- **UI Framework**: TailwindCSS with shadcn/ui components and responsive design
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
│   │   │   ├── leads/  # Lead management
│   │   │   ├── strategies/ # Sales strategies
│   │   │   ├── bookings/ # Booking management
│   │   │   ├── chat/     # Chat functionality
│   │   │   └── prompt-templates/ # AI prompt template management
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
    │   ├── customUI/    # Custom UI components
    │   │   ├── notification.tsx    # Notification system for user feedback
    │   │   └── bulk-actions.tsx    # Bulk operations component
    │   ├── admin/       # Admin-specific components (responsive sidebar, header)
    │   ├── auth/        # Auth components
    │   └── version1/    # Landing page components
```

**Import Paths:**
- `@/components/ui/` - shadcn/ui components
- `@/components/customUI/` - Custom UI components
- `@/components/admin/` - Admin-specific components
- `@/components/auth/` - Authentication components
    ├── lib/             # Utilities and API client
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

## 🎯 **Key Features**

- **User Authentication**: Secure login/register with JWT tokens and automatic login after registration
- **Admin Panel**: Comprehensive admin interface for user management with global subaccount filtering
- **Strategy Management**: Create and manage sales strategies
- **Lead Management**: Track and manage lead relationships
- **Booking System**: Handle appointment scheduling
- **Chat Integration**: AI-powered conversation management with full conversation history
- **Prompt Template System**: Global AI prompt template management with activation controls and strategy integration
- **Multi-Tenant System**: SubAccounts for managing multiple client organizations with data isolation
- **Real-time Updates**: Live data synchronization
- **Comprehensive Testing**: Unit tests, integration tests, and E2E tests with 80%+ coverage goals

## 🚀 **Implemented Features**

### **Admin Dashboard Global Subaccount Filtering System ✅**
- **Global Filter Component**: Dropdown filter in admin header for switching between subaccount contexts
- **Context Management**: React context for managing filter state across the admin dashboard
- **Persistent Selection**: Filter choice saved in localStorage for session persistence
- **Real-time Updates**: Dashboard data updates automatically when filter changes
- **Visual Indicators**: Clear badges showing current filter context (Global vs Subaccount)
- **Backend Integration**: API endpoints support subaccount filtering via query parameters
- **User Experience**: Seamless switching between global view and subaccount-specific views
- **Data Filtering**: All dashboard stats, recent users, and leads filtered by selected subaccount
- **Loading States**: Proper loading indicators during filter changes
- **Error Handling**: Graceful error handling for filter operations

### **SubAccounts Multi-Tenant System ✅**
- **Multi-Client Support**: Manage multiple client organizations within a single system
- **Data Isolation**: Complete separation between client data and operations
- **Scalable Management**: Efficient admin management of multiple SubAccounts
- **Resource Sharing**: Global prompt templates shared across all SubAccounts
- **Flexible User Management**: Users organized within specific SubAccounts
- **Database Schema**: Updated with SubAccount model and relationships
- **Backend API**: Complete CRUD operations for SubAccounts (`/admin/subaccounts/*`)
- **Frontend UI**: SubAccounts management interface with create, edit, delete functionality
- **Authorization**: SubAccount-level access control with admin-only management
- **Data Migration**: SQL migration script for existing data
- **Testing**: Unit tests for SubAccounts service with comprehensive coverage
- **Service Integration**: All existing services (Users, Strategies, Leads, Bookings) updated with SubAccount context
- **Frontend Integration**: All pages and forms updated with SubAccount filtering and selection
- **API Updates**: All API clients updated to support SubAccount parameters
- **Data Filtering**: Complete SubAccount-based data isolation across all features
- **Global Dashboard Filtering**: Admin dashboard with subaccount filtering system for easy context switching

## 💬 **Chat System Features**

### **AI-Powered Conversations**
- **Context-Aware**: AI maintains conversation context across all messages
- **Strategy-Based**: Responses tailored to specific sales strategies
- **Lead-Specific**: Personalized interactions based on lead profiles
- **Owner-Lead Clarity**: AI clearly understands the difference between company owner (who it represents) and lead (who it's talking to)
- **Rich Lead Context**: AI has access to lead's name, email, phone, company, position, status, notes, and custom ID
- **Company Context**: AI knows company owner details, budget range, and booking capabilities
- **Booking Integration**: Automatic booking creation from AI responses
- **Responsive AI**: AI responds directly to user messages instead of generic sales pitches
- **Conversational**: Natural, helpful responses that answer user questions and address specific needs

### **Conversation Management**
- **Full History**: Complete conversation history loaded when lead is selected
- **Real-time Chat**: Live message sending and receiving
- **Message Persistence**: All conversations stored in database
- **Format Compatibility**: Supports both old and new message formats seamlessly

### **Admin Testing Interface**
- **Lead Spoofing**: Test AI responses by impersonating any lead
- **Strategy Testing**: Verify different strategies with the same lead
- **Conversation Simulation**: Full conversation flow testing
- **History Loading**: Automatic loading of existing conversations

### **Recent Critical Fixes**
- **Fixed Chat History Issue**: Resolved race condition where only AI messages were showing in chat history
- **Fixed Prompt Template Creation**: Resolved backend controller field mismatch and form validation issues
- **Fixed Booking Edit Page**: Resolved "User with ID 2 not found" error and form submission issues
- **Fixed OpenAI API Integration**: Resolved issue where latest user messages weren't being included in AI responses
- **Enhanced Message Processing**: Improved conversation context handling and message format compatibility
- **Better AI Responsiveness**: AI now responds directly to user messages instead of repeating generic greetings
- **Improved Context Clarity**: AI now clearly distinguishes between company owner details and lead details
- **Fixed Docker Build Issues**: Resolved package dependency conflicts and naming inconsistencies
- **Cleaned API Client Naming**: Fixed class naming from migration (Apilead → ApiClient)
- **Updated Prisma Dependencies**: Fixed invalid package references and generator configuration
- **Implemented Chat Subaccount Filtering**: Chat page now respects global subaccount filter from admin header, automatically filtering leads by selected subaccount and clearing selected lead when switching subaccounts
- **Fixed Subaccount Filter Context Issues**: 
  - Resolved subaccount filter not refreshing when new subaccounts are created
  - Fixed users page showing users from wrong subaccount
  - Fixed "View Details" button setting filter to "Unknown" for newly created subaccounts
  - Fixed backend API not properly filtering users by subaccount
  - Fixed creation forms not requiring subaccount selection
  - Updated all pages using `getAllUsers()` to properly filter by current subaccount
  - Added automatic filter refresh when new subaccounts are created
  - Added required subaccount selection field to user creation form only
  - **Removed subaccount selection from lead/strategy forms** - subaccount automatically set from selected user
  - Added validation to ensure subaccount is selected before creating users
  - Improved user experience with immediate filter updates and proper data isolation
  - **Backend Updates**: Updated admin auth controller and service to properly filter users by subaccount
  - **Frontend Updates**: User creation requires explicit subaccount selection, leads/strategies inherit from selected user

## **Prompt Template & Strategy Integration**

- **Admins** can create, edit, activate, and set default prompt templates.
- **Strategies** must always be linked to a prompt template (`promptTemplateId`).
- The **strategy creation form** in the admin panel allows selection of a prompt template from all available templates.
- If no template is selected, the **backend automatically assigns the system default prompt template**.
- The **chat system** uses the prompt template linked to the strategy for all AI responses, ensuring consistent behavior.
- The backend enforces that every strategy is always tied to a prompt template, and the frontend and backend are fully aligned.

### **Booking Instructions in Prompt Templates**

- **Booking Instructions**: Each prompt template can include specific booking instructions for the AI.
- **Standardized Format**: Uses a consistent format with `[BOOKING_CONFIRMATION]` marker for automated booking detection.
- **Date/Time Format**: Enforces YYYY-MM-DD date format and 24-hour time format (e.g., 14:30).
- **Automatic Integration**: The chat system automatically includes booking instructions when a user has booking enabled.

## 🧪 **Testing**

### **Test Coverage**
- **Unit Tests**: 80%+ coverage target for service and controller methods
- **Integration Tests**: 70%+ coverage for module interactions
- **E2E Tests**: Complete user journey testing
- **Test Utilities**: Comprehensive mock services and test helpers

### **Running Tests**
```bash
# Backend tests
cd project
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests

# Frontend tests
cd my-app
npm test                  # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

### **Test Structure**
- **Unit Tests**: `src/**/*.spec.ts` - Individual service/controller tests
- **E2E Tests**: `test/*.e2e-spec.ts` - End-to-end API testing
- **Test Utilities**: `test/test-utils.ts` - Common test helpers and mocks
- **Test Checklist**: `TEST_CHECKLIST.md` - Comprehensive testing roadmap

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Docker and Docker Compose
- Git

### 🔒 Security Setup (Required for Production)

Before deploying to production, you must:

1. **Generate secure secrets**:
```bash
# Generate JWT secret
openssl rand -hex 32

# Generate API key
openssl rand -hex 32

# Generate admin auth code
openssl rand -hex 16

# Generate secure admin password (or create your own)
openssl rand -base64 12
```

2. **Update environment variables** with secure values:
```bash
# Backend (.env)
JWT_SECRET=your_generated_jwt_secret_here
API_KEY=your_generated_api_key_here
ADMIN_AUTH_CODE=your_generated_admin_code_here
DEFAULT_ADMIN_PASSWORD=your_secure_admin_password_here
DATABASE_URL=postgresql://user:password@localhost:5432/loctelli
REDIS_URL=redis://:password@localhost:6379

# Frontend (.env.local)
API_KEY=your_generated_api_key_here
```

3. **Run security check**:
```bash
./scripts/security-check.sh
```

**⚠️ Never use default/example values in production!**

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

# Generate Prisma lead
npm run db:generate

# Run migrations
npm run db:migrate
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

## 📱 Responsive Design Features

The admin dashboard features a fully responsive design:

- **Desktop**: Traditional sidebar layout with fixed navigation
- **Mobile/Tablet**: Collapsible sidebar that appears as a modal overlay
- **User Profile**: Right-aligned profile information with dropdown menu
- **Logout Functionality**: Integrated logout with proper session cleanup
- **Touch-Friendly**: Optimized for touch interactions on mobile devices

The responsive design ensures optimal user experience across all device sizes while maintaining full functionality of the admin interface.
- **Prisma Studio**: http://localhost:5555

## 📊 Features

### 🔐 Authentication & Authorization
- **Cookie-based authentication**: Secure HTTP cookies with automatic login functionality
- **Multi-level authentication**: Admin and regular user roles with separate token storage
- **Automatic token refresh**: Seamless token renewal without user intervention
- **Role-based access control**: Different permissions for different user types
- **Protected routes**: Automatic route protection based on user roles

### 👥 User Management
- **Complete CRUD operations**: Create, read, update, and delete users
- **Role management**: Assign and manage user roles (admin, user, manager)
- **Status control**: Activate/deactivate users
- **Company association**: Link users to companies and manage organizational structure
- **Integration settings**: Configure calendar and location integrations
- **Bulk operations**: Manage multiple users simultaneously
- **Booking enabled by default**: New users have booking functionality enabled by default with toggle control

### 🏢 Lead Management
- **Full CRUD functionality**: Add, edit, delete, and view lead information
- **Comprehensive lead profiles**: Name, email, phone, company, position, custom ID
- **Status tracking**: Lead, active, inactive status management
- **Strategy assignment**: Link leads to AI sales strategies
- **Notes and history**: Track lead interactions and notes
- **Search and filtering**: Find leads by name, email, company, or status
- **Bulk operations**: Manage multiple leads at once

### 🎯 Strategy Management
- **AI strategy creation**: Build custom AI conversation strategies
- **Comprehensive configuration**: Tone, creativity, objectives, and timing
- **Objection handling**: Pre-defined responses to common objections
- **Qualification criteria**: Define what makes a good prospect
- **Example conversations**: Provide conversation templates for AI
- **Delay settings**: Configure response timing for natural conversation flow
- **Tagging system**: Organize strategies by category (sales, support, etc.)
- **Bulk operations**: Manage multiple strategies simultaneously
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

### 🗄️ Development Tools
- **Database Schema Visualization**: Interactive ERD diagrams with Mermaid.js showing all fields including foreign keys
- **Real-time schema generation**: Dynamic schema fetching from backend
- **Zoom and pan controls**: Interactive diagram navigation
- **Export functionality**: Download diagrams as SVG files
- **Fallback schema**: Offline schema display when API is unavailable

### 👤 Lead Management
- **Comprehensive lead profiles**: Store all lead information
- **Status tracking**: Monitor lead progression through sales funnel
- **Message history**: Complete conversation history with timestamps
- **Notes and annotations**: Add context and observations
- **Custom IDs**: Integration with external systems
- **Company and position tracking**: Professional context
- **Strategy assignment**: Link leads to specific sales strategies
- **Advanced filtering**: Filter leads by various criteria
- **Real-time search**: Search by name, email, company, or phone
- **Status filtering**: Filter by active, lead, inactive, or all leads
- **Detailed lead views**: Modal dialogs showing complete lead information

### 🗄️ Database Schema Visualization
- **Interactive ERD diagrams**: Real-time database schema visualization using Mermaid.js
- **Dynamic schema generation**: Automatically generates diagrams from Prisma schema
- **Relationship mapping**: Visual representation of foreign key relationships
- **Interactive controls**: Zoom in/out, download, and refresh functionality
- **Error handling**: Graceful fallback to hardcoded schema if API fails
- **Debug logging**: Detailed logging for troubleshooting Mermaid syntax issues
- **Simplified relationships**: Clean relationship syntax without labels to avoid parsing errors
- **Export functionality**: Download diagrams as SVG for documentation

### 🎯 Strategy Management (Admin)
- **AI strategy management**: Create and manage AI-powered sales strategies
- **Creativity controls**: Adjust AI response creativity levels (1-10 scale)
- **Tone settings**: Configure communication tone (professional, friendly, casual)
- **Strategy categorization**: Tag-based organization (sales, support, onboarding)
- **Advanced filtering**: Filter strategies by tag, tone, and creativity level
- **Detailed strategy views**: Complete strategy information with AI instructions
- **Strategy duplication**: Easy strategy replication and modification
- **Real-time statistics**: Live counts for total, active, high/low creativity strategies
- **Search functionality**: Search strategies by name, tag, tone, or objective
- **Responsive design**: Mobile-friendly strategy management interface

### 📅 Booking Management (Admin)
- **Comprehensive booking system**: Manage all appointments and meetings
- **Status tracking**: Monitor booking status (confirmed, pending, cancelled)
- **Quick status updates**: Inline status dropdown for rapid booking management
- **Booking editing**: Full editing capabilities for booking details, dates, and information

- **Lead associations**: Link bookings to specific leads and users
- **Advanced filtering**: Filter by status, type, and date ranges
- **Search functionality**: Search bookings by lead, user, or booking type
- **Detailed booking views**: Complete booking information with lead and user details
- **Real-time statistics**: Live counts for total, confirmed, pending, and cancelled bookings
- **Flexible details**: JSON-based booking information storage with structured fields (date, duration, location, notes, agenda)
- **Responsive design**: Mobile-friendly booking management interface

### 🤖 AI Chat Interface (Admin)
- **Lead ID spoofing**: Test AI responses by entering any lead ID to simulate lead interactions
- **Lead profile display**: Shows complete lead information including name, email, company, status, and assigned strategy
- **Real-time messaging**: Instant message exchange with AI assistant using lead context
- **Conversation management**: Clear chat history and start new conversations
- **Message history**: Track conversation flow with timestamps and lead metadata
- **Typing indicators**: Visual feedback during AI response generation
- **Error handling**: Graceful error display with retry functionality
- **Keyboard shortcuts**: Enter to send, Shift+Enter for new lines
- **Responsive design**: Full-screen chat interface optimized for all devices

### 🛠️ Development Tools
- **Database schema visualization**: Interactive ERD diagrams using Mermaid.js
- **Schema parsing**: Automatic parsing of Prisma schema files
- **Development utilities**: Tools for database exploration and debugging
- **Real-time schema updates**: View current database structure
- **Export capabilities**: Download schema diagrams as SVG files
- **Lead statistics**: Real-time counts for different lead statuses
- **Delete functionality**: Confirmation-based lead deletion
- **Responsive table**: Mobile-friendly lead data display

### 📅 Booking System
- **Appointment scheduling**: Create and manage meetings
- **Calendar integration**: Sync with external calendar systems
- **Status management**: Track booking status (pending, confirmed, cancelled, completed)
- **Lead association**: Link bookings to specific leads
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
- **Detailed lead views**: Modal dialogs showing complete lead information with all fields
- **View buttons**: Eye icon buttons to view all details for each user and lead
- **Related data display**: Shows strategies, leads, bookings, and admin relationships
- **Recent leads section**: Latest leads added to the platform with detailed information
- **Database schema visualization**: Interactive ERD diagram showing database structure and relationships

### 👥 User Management (Admin)
- **Complete user management**: Full CRUD operations with role-based access control
- **Advanced search & filtering**: Search by name, email, company with role and status filters
- **Real-time statistics**: Live user counts (total, active, inactive, admin users)
- **Detailed user views**: Comprehensive user information with related strategies, leads, and bookings
- **Role management**: User role assignment and status toggling
- **Booking functionality control**: Toggle booking enabled/disabled for each user with visual indicators
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

# Generate Prisma lead
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

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based authentication** with secure token rotation
- **Password complexity requirements** (8+ chars, uppercase, lowercase, numbers, special chars)
- **Admin password requirements** (12+ chars with enhanced security)
- **Rate limiting** on authentication endpoints (5 attempts per 15 minutes)
- **Session management** with automatic token refresh
- **Role-based access control** (admin, user, manager)
- **Secure cookie storage** with httpOnly, secure, and sameSite flags

### API Security
- **API key authentication** for all backend requests
- **Input validation and sanitization** to prevent XSS and injection attacks
- **Request size limits** (10MB max)
- **Content-Type validation** for all requests
- **Security headers** (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS protection** with strict origin validation

### Data Protection
- **Password hashing** with bcrypt (12 rounds)
- **SQL injection prevention** through Prisma ORM
- **XSS protection** through input sanitization
- **CSRF protection** through SameSite cookies
- **Secure token storage** in Redis with expiration

### Infrastructure Security
- **Environment variable validation** on startup
- **Secure secret generation** utilities
- **File permission checks** for sensitive files
- **SSL/TLS enforcement** in production
- **Database connection security** with SSL support

### Security Monitoring
- **Comprehensive logging** for security events
- **Rate limiting monitoring** and alerting
- **Failed authentication tracking**
- **Security check script** for deployment validation

## 🔌 API Documentation

### ✅ Endpoint Verification Status
All frontend and backend endpoints have been verified and are fully aligned:
- **Total Endpoints Checked**: 50+
- **Fully Aligned**: 100% ✅
- **HTTP Methods Correct**: 100% ✅
- **DTO Structures Match**: 100% ✅
- **Authorization Working**: 100% ✅

**Recent Fixes Applied:**
- Fixed admin profile update HTTP method (PATCH → PUT)
- Added missing budget field to user registration form
- Verified all DTO structures match between frontend and backend

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
- **Leads**: `/lead/*` - Lead management with strategy assignment
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
- Review the API lead documentation
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
