# Loctelli CRM

A comprehensive CRM application built with NestJS backend and Next.js frontend, featuring client management, sales strategies, booking system, and chat integration.

## 🏗️ Architecture

- **Backend**: NestJS with Prisma ORM, PostgreSQL, and Redis
- **Frontend**: Next.js 15 with React 19 and TailwindCSS
- **Database**: PostgreSQL
- **Cache**: Redis (backend only)
- **Authentication**: NextAuth.js (frontend)

## 📁 Project Structure

```
Loctelli/
├── project/              # NestJS Backend
│   ├── src/
│   │   ├── users/        # User management
│   │   ├── clients/      # Client management
│   │   ├── strategies/   # Sales strategies
│   │   ├── bookings/     # Booking management
│   │   ├── chat/         # Chat functionality
│   │   └── prisma/       # Database configuration
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── docker-compose.yml
└── my-app/               # Next.js Frontend
    ├── app/
    │   ├── (main)/       # Public pages
    │   ├── admin/        # Admin panel
    │   └── api/          # Next.js API routes
    ├── components/       # React components
    ├── lib/              # Utilities and API clients
    └── types/            # Shared TypeScript types
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

### 2. Backend Setup

```bash
cd project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the database and backend
docker-compose up -d db redis
npm run start:dev
```

### 3. Frontend Setup

```bash
cd my-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start the frontend
npm run dev
```

### 4. Database Setup

```bash
cd project

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Prisma Studio**: http://localhost:5555

## 📊 Features

### Admin Dashboard
- Overview statistics and metrics
- Recent activity feed
- Quick action buttons
- Real-time data visualization

### Client Management
- Add, edit, and delete clients
- Track client status and interactions
- Search and filter functionality
- Client history and notes

### Sales Strategies
- Create AI-powered sales strategies
- Customize tone and instructions
- Track strategy performance
- Template management

### Booking System
- Schedule appointments and meetings
- Calendar integration
- Booking status tracking
- Automated reminders

### Chat Integration
- Real-time messaging with clients
- Message history
- AI-powered responses
- Integration with sales strategies

## 🔧 Development

### Backend Development

```bash
cd project

# Start development server
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e
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
```

### Database Management

```bash
cd project

# Create a new migration
npm run db:migrate

# Reset database
npm run db:reset

# Seed database
npm run db:seed
```

## 🐳 Docker Development

Run the entire stack with Docker:

```bash
cd project
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- NestJS backend API
- Next.js frontend

## 📝 Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/loctelli"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET="your-jwt-secret"

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=loctelli
```

### Frontend (.env.local)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key
NEXTAUTH_URL=http://localhost:3001
```

## 🧪 Testing

### Backend Tests

```bash
cd project

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests

```bash
cd my-app

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📦 Deployment

### Production Build

```bash
# Backend
cd project
npm run build
npm run start:prod

# Frontend
cd my-app
npm run build
npm run start
```

### Docker Production

```bash
cd project
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

Built with ❤️ using NestJS and Next.js 
