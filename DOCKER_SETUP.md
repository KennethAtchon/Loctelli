# Docker Setup Guide for Loctelli CRM

This guide will help you set up and run the Loctelli CRM application using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)
- Git (to clone the repository)

## Quick Start

### 1. Environment Setup

Copy the environment example file and configure it:

```bash
cp env.example .env
```

Edit the `.env` file with your desired configuration:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=loctelli

# Redis
REDIS_PASSWORD=your_redis_password_here

# JWT (Change these in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Application
NODE_ENV=development
PORT=3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Start the Application

```bash
# Start all services
docker-compose up -d

# Or start with logs
docker-compose up
```

### 3. Initialize the Database

```bash
# Run Prisma migrations
docker-compose exec api npx prisma migrate deploy

# Generate Prisma client
docker-compose exec api npx prisma generate
```

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Services Overview

### PostgreSQL Database (`db`)
- **Port**: 5432
- **Image**: postgres:15-alpine
- **Volume**: `pgdata` (persistent data)
- **Health Check**: Automatic database readiness check

### Redis Cache (`redis`)
- **Port**: 6379
- **Image**: redis:7-alpine
- **Volume**: `redisdata` (persistent data)
- **Features**: AOF persistence, password protection
- **Health Check**: Automatic Redis connectivity check

### Backend API (`api`)
- **Port**: 3000
- **Context**: `./project` (backend directory)
- **Dependencies**: Database and Redis (with health checks)
- **Features**: Automatic restart, health monitoring
- **Environment**: All necessary variables from `.env`

### Frontend (`frontend`)
- **Port**: 3001
- **Context**: `./my-app` (frontend directory)
- **Dependencies**: Backend API (with health check)
- **Features**: Hot reload for development

## Development Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f db
docker-compose logs -f redis
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ This will delete all data!)
docker-compose down -v
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api
```

### Database Operations
```bash
# Access database shell
docker-compose exec db psql -U postgres -d loctelli

# Run Prisma commands
docker-compose exec api npx prisma migrate dev
docker-compose exec api npx prisma studio

# Reset database
docker-compose exec api npx prisma migrate reset
```

### Redis Operations
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# With password (if set)
docker-compose exec redis redis-cli -a your_redis_password_here
```

## Project Structure

```
Loctelli/
├── docker-compose.yml          # Main Docker Compose file
├── .env                        # Environment variables (create from env.example)
├── env.example                 # Environment template
├── DOCKER_SETUP.md            # This documentation
├── project/                    # Backend (NestJS)
│   ├── Dockerfile
│   ├── init-db.sql            # Database initialization
│   └── ...
└── my-app/                     # Frontend (Next.js)
    ├── Dockerfile
    └── ...
```

## Production Considerations

### Security
1. **Change default passwords** in `.env`
2. **Use strong JWT secrets**
3. **Enable Redis password protection**
4. **Use environment-specific configurations**

### Performance
1. **Database**: Consider connection pooling
2. **Redis**: Configure memory limits
3. **Frontend**: Enable production builds
4. **API**: Configure proper logging

### Monitoring
1. **Health checks** are enabled for all services
2. **Logs** are available via `docker-compose logs`
3. **Metrics** can be added with monitoring tools

## Troubleshooting

### Common Issues

#### Port Conflicts
If ports are already in use:
```bash
# Check what's using the ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :5432
netstat -tulpn | grep :6379
```

#### Database Connection Issues
```bash
# Check database health
docker-compose exec db pg_isready -U postgres

# Check database logs
docker-compose logs db
```

#### Redis Connection Issues
```bash
# Check Redis health
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

#### API Health Check
```bash
# Check API health
curl http://localhost:3000/status/health

# Check API logs
docker-compose logs api
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_USER` | PostgreSQL username | `postgres` | No |
| `POSTGRES_PASSWORD` | PostgreSQL password | - | Yes |
| `POSTGRES_DB` | PostgreSQL database name | `loctelli` | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - | Yes |
| `NODE_ENV` | Node.js environment | `development` | No |
| `PORT` | API port | `3000` | No |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | `http://localhost:3000` | No |

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure Docker has enough resources
4. Check network connectivity between containers 