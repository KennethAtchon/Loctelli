# Backend API Testing Guide

This guide shows how to test the NestJS backend API endpoints using curl commands.

## Prerequisites

### 1. Working Directory

**IMPORTANT: All commands must be run from the `/project` directory**

```bash
cd /path/to/your/project/Loctelli/project
```

### 2. API Key Setup

The backend requires an `x-api-key` header for all requests except health checks and debug endpoints.

**Add to your `.env` file in the `/project` directory:**
```env
API_KEY=your-secure-api-key-here
```

**Example:**
```env
API_KEY=dev-api-key-12345-secure-random-string
```

### 3. Backend Running

Ensure the backend is running from the `/project` directory:
```bash
# MUST be run from /project directory
cd project
pnpm run start:dev
# OR
pnpm run start

# Backend should be accessible at http://localhost:8000
```

### 4. Database Setup

Make sure PostgreSQL and Redis are running:
```bash
# If using Docker Compose (run from root Loctelli directory)
cd .. # Go back to root Loctelli directory
docker-compose up -d db redis

# Then return to project directory for backend commands
cd project

# Check backend logs for database connection
```

## API Key Middleware Configuration

The backend uses `ApiKeyMiddleware` that:
- **Requires** `x-api-key` header on ALL routes
- **Excludes** these routes from API key requirement:
  - `GET /status/health`
  - `GET|POST|DELETE /debug/redis/*`

**Source:** `project/src/core/app.module.ts:74-81`

## Testing Commands

### Health Check (No API Key Required)

```bash
# Test if backend is responding
curl -v http://localhost:8000/status/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Forms Endpoints (API Key Required)

#### Test Wake-up Database Endpoint
```bash
# Test the database wake-up endpoint
curl -v -H "x-api-key: your-secure-api-key-here" \
  http://localhost:8000/forms/public/wake-up
```

**Expected Response:**
```json
{
  "status": "awake",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Get Public Form by Slug
```bash
# Test getting a public form (replace 'contact-us' with actual form slug)
curl -v -H "x-api-key: your-secure-api-key-here" \
  http://localhost:8000/forms/public/contact-us
```

#### List Form Templates (Admin Required)
```bash
# Requires admin authentication + API key
curl -v -H "x-api-key: your-secure-api-key-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/forms/templates
```

### Other Module Endpoints

#### Auth Endpoints (API Key Required)
```bash
# Admin login
curl -v -H "x-api-key: your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  http://localhost:8000/admin/auth/login

# User login
curl -v -H "x-api-key: your-secure-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  http://localhost:8000/auth/login
```

#### Leads Endpoints
```bash
# Get leads (requires auth + API key)
curl -v -H "x-api-key: your-secure-api-key-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/leads
```

#### SMS Endpoints
```bash
# Get SMS campaigns (requires auth + API key)
curl -v -H "x-api-key: your-secure-api-key-here" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/sms/campaigns
```

## Common Error Responses

### Missing API Key
```bash
curl -v http://localhost:8000/forms/public/wake-up
```
**Response (401):**
```json
{
  "statusCode": 401,
  "message": "API key is missing",
  "error": "Unauthorized"
}
```

### Invalid API Key
```bash
curl -v -H "x-api-key: wrong-key" \
  http://localhost:8000/forms/public/wake-up
```
**Response (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid API key",
  "error": "Unauthorized"
}
```

### Backend Not Running
```bash
curl -v http://localhost:8000/status/health
```
**Response:**
```
curl: (7) Failed to connect to localhost port 8000: Connection refused
```

### Missing Environment Variables
**Backend logs will show:**
```
[ERROR] API_KEY is not set in environment variables
```

## API Key Security Notes

1. **Required Format**: Any string, but should be secure
2. **Environment Variable**: Must be set as `API_KEY` in `.env`
3. **Header Name**: Must use `x-api-key` (case-sensitive)
4. **Alternative**: Can also pass as query parameter `?api_key=value`

## Debugging Steps

### 1. Check Backend Status
```bash
# Test health endpoint (no API key needed)
curl -s http://localhost:8000/status/health | jq .
```

### 2. Verify API Key Setup
```bash
# Check if API_KEY is set in backend environment
# Look for this log on backend startup:
# "🔑 API Key configured: Yes"
```

### 3. Test API Key Header
```bash
# Test with API key (run from /project directory)
curl -v -H "x-api-key: $(cat .env | grep API_KEY | cut -d= -f2)" \
  http://localhost:8000/forms/public/wake-up
```

### 4. Check Backend Logs
```bash
# Watch backend logs for API key validation messages:
# "🔑 API key validation for route: GET /forms/public/wake-up"
# "✅ API key validation successful"
```

## Frontend vs Backend URLs

- **Frontend Route**: `http://localhost:3000/forms/wake-up` (page)
- **Backend API**: `http://localhost:8000/forms/public/wake-up` (endpoint)

The 404 error likely occurs because:
1. API_KEY is not set in backend environment
2. Backend is not running
3. Wrong API key being sent in headers