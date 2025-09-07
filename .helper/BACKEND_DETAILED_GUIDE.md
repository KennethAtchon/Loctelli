# Backend Detailed Architecture Guide

## What This Backend Does
This is a multi-tenant CRM (Customer Relationship Management) platform that helps businesses manage leads, contacts, bookings, and communications. It includes AI-powered chat, SMS campaigns, business finding tools, and integrations with external services like GoHighLevel CRM.

## Core Application Bootstrap

### `src/core/main.ts`
**What it does**: The main entry point that starts the entire backend application.
**Key responsibilities**:
- Starts the NestJS server on specified port
- Sets up CORS (Cross-Origin Resource Sharing) for frontend communication
- Configures 50MB file upload limits for handling large files
- Tests Redis connection on startup to ensure caching works
- Initializes system user security for admin operations
- Provides detailed startup logging for debugging

### `src/core/app.module.ts`
**What it does**: The main application configuration that wires together all the different parts of the system.
**Key responsibilities**:
- Imports all major modules (shared infrastructure + business modules)
- Sets up global JWT authentication guard (every request needs valid login)
- Configures middleware pipeline in specific order:
  - Security headers on all routes
  - Input validation (prevents malicious data)
  - Rate limiting on login/register (prevents brute force attacks)
  - API key validation (additional security layer)

### `src/core/app.controller.ts` & `src/core/app.service.ts`
**What they do**: Basic health check endpoint to verify the backend is running.
**Key responsibilities**:
- Provides simple "Hello World" response for system monitoring
- Used by deployment systems to check if app is healthy

## Shared Infrastructure Layer

### Database & ORM

#### `src/shared/prisma/prisma.service.ts`
**What it does**: Manages all database connections and operations using Prisma ORM.
**Key responsibilities**:
- Connects to PostgreSQL database
- Handles database connection lifecycle
- Provides query interface for all modules
- Manages database transactions for data consistency

#### `src/shared/prisma/prisma.module.ts`
**What it does**: Makes the Prisma database service available to all other modules.

### Caching & Performance

#### `src/shared/cache/cache.service.ts`
**What it does**: Manages Redis cache operations for improved performance and temporary data storage.
**Key responsibilities**:
- Stores frequently accessed data in memory for fast retrieval
- Manages user sessions and temporary tokens
- Handles background job queue storage
- Provides cache invalidation for data consistency
- Tests Redis connection health

#### `src/shared/cache/cache.module.ts` & `src/shared/cache/common.module.ts`
**What they do**: Configure Redis connection and make caching available throughout the app.

### Authentication & Security

#### `src/shared/auth/services/auth.service.ts`
**What it does**: Handles user login, registration, and token management for regular users.
**Key responsibilities**:
- Validates user credentials against database
- Creates and manages JWT tokens for authenticated sessions
- Handles password hashing and verification
- Manages user registration process
- Provides token refresh functionality

#### `src/shared/auth/services/admin-auth.service.ts`
**What it does**: Separate authentication system specifically for admin users with elevated privileges.
**Key responsibilities**:
- Validates admin credentials with stricter security
- Manages admin-specific JWT tokens
- Handles admin registration with special codes
- Provides admin session management

#### `src/shared/auth/services/admin-auth-code.service.ts`
**What it does**: Manages special registration codes that admins need to create accounts.
**Key responsibilities**:
- Generates unique admin registration codes
- Validates codes during admin registration
- Manages code expiration and usage tracking

#### `src/shared/auth/services/system-user.service.ts`
**What it does**: Creates and manages a special system user for internal operations.
**Key responsibilities**:
- Ensures system user exists for background tasks
- Manages system user security and permissions
- Handles system-level operations that don't belong to regular users

#### `src/shared/auth/auth.guard.ts`
**What it does**: Security guard that checks if users are properly authenticated before allowing access to protected routes.
**Key responsibilities**:
- Validates JWT tokens on incoming requests
- Blocks unauthenticated users from accessing protected endpoints
- Allows public routes (marked with @Public decorator) to bypass auth

#### `src/shared/auth/strategies/jwt.strategy.ts`
**What it does**: Defines how JWT tokens should be validated and what user information to extract.
**Key responsibilities**:
- Extracts user information from valid JWT tokens
- Validates token signatures and expiration
- Provides user context for authenticated requests

### Authorization & Access Control

#### `src/shared/guards/admin.guard.ts`
**What it does**: Ensures only admin users can access admin-only endpoints.
**Key responsibilities**:
- Checks if authenticated user has admin role
- Blocks regular users from admin operations
- Works in combination with JWT guard

#### `src/shared/guards/roles.guard.ts`
**What it does**: General role-based access control system.
**Key responsibilities**:
- Checks user roles against required roles for endpoints
- Supports multiple role types beyond just admin
- Provides flexible permission system

### Security Decorators

#### `src/shared/decorators/admin.decorator.ts`
**What it does**: Decorator that marks routes as admin-only.

#### `src/shared/decorators/public.decorator.ts`
**What it does**: Decorator that marks routes as publicly accessible (no login required).

#### `src/shared/decorators/current-user.decorator.ts`
**What it does**: Decorator that extracts current user information from JWT token.

#### `src/shared/decorators/roles.decorator.ts`
**What it does**: Decorator that specifies which roles are required to access a route.

### Security Middleware

#### `src/shared/middleware/security-headers.middleware.ts`
**What it does**: Adds security headers to all HTTP responses to protect against common web vulnerabilities.
**Key responsibilities**:
- Sets CORS headers for cross-origin requests
- Adds CSP (Content Security Policy) headers
- Sets X-Frame-Options to prevent clickjacking
- Adds other security headers (HSTS, etc.)

#### `src/shared/middleware/rate-limit.middleware.ts`
**What it does**: Prevents abuse by limiting how many requests a user can make in a time period.
**Key responsibilities**:
- Tracks request counts per IP address
- Blocks users who exceed rate limits
- Primarily protects login/registration endpoints from brute force attacks

#### `src/shared/middleware/api-key.middleware.ts`
**What it does**: Validates API keys for an additional layer of security.
**Key responsibilities**:
- Checks for valid API key in request headers
- Blocks requests without proper API key
- Allows certain routes (health checks, debug) to bypass API key requirement

#### `src/shared/middleware/input-validation.middleware.ts`
**What it does**: Sanitizes and validates incoming request data to prevent injection attacks.
**Key responsibilities**:
- Removes potentially malicious characters from input
- Validates data formats and types
- Prevents SQL injection and XSS attacks

### Configuration

#### `src/shared/config/configuration.ts`
**What it does**: Centralizes all environment variable configuration and validation.
**Key responsibilities**:
- Loads environment variables from .env files
- Validates required configuration is present
- Provides typed configuration objects
- Sets default values where appropriate

#### `src/shared/config/security.config.ts`
**What it does**: Security-specific configuration settings.
**Key responsibilities**:
- JWT token settings (expiration, secret keys)
- Password hashing configuration
- API key validation settings
- Security header configurations

### File Storage

#### `src/shared/storage/r2-storage.service.ts`
**What it does**: Manages file uploads to Cloudflare R2 (S3-compatible storage).
**Key responsibilities**:
- Handles file upload to cloud storage
- Generates signed URLs for secure file access
- Manages file metadata and organization
- Provides file download and deletion capabilities

#### `src/shared/storage/file-processing.service.ts`
**What it does**: Processes uploaded files (validation, transformation, metadata extraction).
**Key responsibilities**:
- Validates file types and sizes
- Extracts metadata from uploaded files
- Handles file format conversions if needed
- Processes bulk file operations

### Communication Services

#### `src/shared/sms/sms.service.ts`
**What it does**: Core SMS sending functionality using Twilio integration.
**Key responsibilities**:
- Sends individual SMS messages via Twilio API
- Handles SMS delivery status tracking
- Manages phone number validation and formatting
- Provides SMS sending analytics

#### `src/shared/sms/campaign.service.ts`
**What it does**: Manages SMS marketing campaigns with multiple recipients.
**Key responsibilities**:
- Creates and manages SMS campaigns
- Handles bulk SMS sending operations
- Tracks campaign performance and delivery rates
- Manages campaign scheduling and timing

#### `src/shared/sms/csv-processor.service.ts`
**What it does**: Processes CSV files containing phone numbers for bulk SMS campaigns.
**Key responsibilities**:
- Parses CSV files with contact information
- Validates phone numbers in bulk
- Handles CSV format variations and errors
- Extracts contact data for campaigns

### Background Job Processing

#### `src/shared/job-queue/job-queue.service.ts`
**What it does**: Manages background job processing system using Redis queues.
**Key responsibilities**:
- Creates and schedules background jobs
- Manages job queues and priorities
- Handles job retry logic and error recovery
- Provides job status tracking and monitoring

#### `src/shared/job-queue/processors/` (Multiple Files)
**What they do**: Individual processors for different types of background jobs.

##### `base-processor.ts`
- Abstract base class for all job processors
- Provides common job handling functionality

##### `email-processor.ts`
- Processes email sending jobs
- Handles email templates and bulk sending

##### `sms-processor.ts`
- Processes SMS sending jobs
- Handles bulk SMS campaigns in background

##### `data-export-processor.ts`
- Processes data export requests
- Generates CSV/Excel files for download

##### `generic-task-processor.ts`
- Handles miscellaneous background tasks
- Provides flexible task processing framework

#### `src/shared/job-queue/service-registry.ts`
**What it does**: Registry that manages all available background job processors.

### Email Services

#### `src/shared/email/email.service.ts`
**What it does**: Manages email sending functionality (likely using external email service).
**Key responsibilities**:
- Sends transactional emails (confirmations, notifications)
- Handles email templates and personalization
- Manages email delivery tracking
- Provides email analytics and reporting

## Main Application Business Modules

### User Management

#### `src/main-app/modules/users/users.service.ts`
**What it does**: Core business logic for managing users in the system.
**Key responsibilities**:
- Creates, updates, and deletes user accounts
- Manages user profiles and preferences
- Handles user role assignments
- Provides user search and filtering
- Manages multi-tenant user isolation (users can only see their own tenant's data)

#### `src/main-app/modules/users/users.controller.ts`
**What it does**: HTTP endpoints for user operations (REST API).
**Key responsibilities**:
- GET /users - List users with filtering
- POST /users - Create new user
- PUT /users/:id - Update user information
- DELETE /users/:id - Delete user
- Validates request data using DTOs

### Lead Management

#### `src/main-app/modules/leads/leads.service.ts`
**What it does**: Manages sales leads throughout the sales pipeline.
**Key responsibilities**:
- Creates and updates lead records
- Tracks lead status and progression
- Manages lead assignment to users
- Provides lead analytics and reporting
- Handles lead conversion tracking

#### `src/main-app/modules/leads/leads.controller.ts`
**What it does**: REST API endpoints for lead management.

### Booking System

#### `src/main-app/modules/bookings/bookings.service.ts`
**What it does**: Manages appointment booking system.
**Key responsibilities**:
- Creates and manages appointment slots
- Handles booking confirmations and cancellations
- Manages calendar integration
- Sends booking notifications
- Tracks booking analytics

#### `src/main-app/modules/bookings/bookings.controller.ts`
**What it does**: REST API for booking operations.

### Contact Management

#### `src/main-app/modules/contacts/contacts.service.ts`
**What it does**: Manages customer contact information and communication history.
**Key responsibilities**:
- Stores and updates contact details
- Tracks communication history with contacts
- Manages contact segmentation and tags
- Handles contact import/export
- Provides contact search and filtering

#### `src/main-app/modules/contacts/contacts.controller.ts`
**What it does**: REST API for contact operations.

### Multi-Tenant Architecture

#### `src/main-app/modules/subaccounts/subaccounts.service.ts`
**What it does**: Manages the multi-tenant system where each customer gets their own isolated data space.
**Key responsibilities**:
- Creates and manages tenant accounts (subaccounts)
- Ensures data isolation between tenants
- Manages tenant settings and configurations
- Handles tenant billing and subscription information
- Provides tenant analytics and usage tracking

#### `src/main-app/modules/subaccounts/subaccounts.controller.ts`
**What it does**: REST API for tenant management.

### AI-Powered Chat System

#### `src/main-app/modules/chat/chat.service.ts`
**What it does**: Core chat functionality with AI integration.
**Key responsibilities**:
- Manages chat conversations and message history
- Integrates with AI services for automated responses
- Handles real-time message processing
- Manages chat context and conversation flow

#### `src/main-app/modules/chat/openai-prompt-builder.service.ts`
**What it does**: Builds intelligent prompts for OpenAI based on business context.
**Key responsibilities**:
- Creates contextual prompts using customer data
- Incorporates business strategies into AI responses
- Manages prompt templates and variations
- Handles prompt optimization and A/B testing

#### `src/main-app/modules/chat/conversation-summarizer.service.ts`
**What it does**: Uses AI to create summaries of long chat conversations.
**Key responsibilities**:
- Analyzes conversation history for key points
- Generates concise conversation summaries
- Extracts action items and follow-ups
- Provides conversation insights and analytics

#### `src/main-app/modules/chat/sales-bot.service.ts`
**What it does**: AI sales assistant that helps with lead qualification and conversion.
**Key responsibilities**:
- Qualifies leads through automated conversations
- Provides product/service information
- Schedules appointments automatically
- Escalates complex queries to human agents

### Business Strategy Management

#### `src/main-app/modules/strategies/strategies.service.ts`
**What it does**: Manages business strategies and sales methodologies.
**Key responsibilities**:
- Creates and stores business strategy templates
- Applies strategies to specific leads/contacts
- Tracks strategy effectiveness
- Provides strategy recommendations

### Prompt Template System

#### `src/main-app/modules/prompt-templates/prompt-templates.service.ts`
**What it does**: Manages AI prompt templates for consistent and effective AI interactions.
**Key responsibilities**:
- Creates and maintains prompt templates
- Handles template variables and personalization
- Manages template versions and A/B testing
- Provides template analytics and optimization

### SMS Campaign Management

#### `src/main-app/modules/sms/sms.service.ts`
**What it does**: High-level SMS campaign management (builds on shared SMS services).
**Key responsibilities**:
- Creates and manages SMS marketing campaigns
- Handles campaign scheduling and automation
- Manages SMS templates and personalization
- Provides campaign analytics and ROI tracking

### Business Finder Tool

#### `src/main-app/modules/finder/services/business-finder.service.ts`
**What it does**: Orchestrates business search across multiple data sources.
**Key responsibilities**:
- Coordinates searches across Google Places, Yelp, etc.
- Combines and deduplicates results from multiple sources
- Provides unified business search interface
- Manages search result ranking and relevance

#### `src/main-app/modules/finder/services/google-places.service.ts`
**What it does**: Integrates with Google Places API to find local businesses.
**Key responsibilities**:
- Searches Google Places for businesses by location/criteria
- Extracts business information (name, address, phone, etc.)
- Handles API rate limiting and quotas
- Normalizes Google Places data format

#### `src/main-app/modules/finder/services/yelp.service.ts`
**What it does**: Integrates with Yelp API for business data.
**Key responsibilities**:
- Searches Yelp business directory
- Extracts reviews, ratings, and business details
- Handles Yelp-specific data formats
- Manages API authentication and limits

#### `src/main-app/modules/finder/services/openstreetmap.service.ts`
**What it does**: Uses OpenStreetMap for additional business and location data.
**Key responsibilities**:
- Queries OpenStreetMap for business information
- Provides geographic and location-based data
- Handles map data processing and geocoding

#### `src/main-app/modules/finder/services/export.service.ts`
**What it does**: Exports business search results to various formats.
**Key responsibilities**:
- Generates CSV/Excel exports of search results
- Handles large export jobs in background
- Manages export file storage and download

#### `src/main-app/modules/finder/services/rate-limit.service.ts`
**What it does**: Manages rate limiting for external API calls in finder services.
**Key responsibilities**:
- Prevents exceeding API rate limits across services
- Manages request queuing and throttling
- Handles API quota management

## External Integrations

### GoHighLevel CRM Integration

#### `src/main-app/integrations/ghl-integrations/ghl/ghl.service.ts`
**What it does**: Integrates with GoHighLevel CRM system for data synchronization.
**Key responsibilities**:
- Syncs contacts and leads with GoHighLevel
- Handles authentication with GHL API
- Manages data mapping between systems
- Provides real-time data synchronization

#### `src/main-app/integrations/ghl-integrations/webhooks/webhooks.controller.ts`
**What it does**: Receives webhook notifications from GoHighLevel when data changes.
**Key responsibilities**:
- Processes incoming webhooks from GoHighLevel
- Handles contact creation/update events
- Manages message notifications from GHL
- Ensures data consistency between systems

### Integration Management

#### `src/main-app/integrations/modules/integrations/integrations.service.ts`
**What it does**: Manages active integrations with external services.
**Key responsibilities**:
- Creates and configures integrations with external services
- Manages integration authentication and credentials
- Monitors integration health and status
- Handles integration error recovery

#### `src/main-app/integrations/modules/integration-templates/integration-templates.service.ts`
**What it does**: Manages templates for setting up common integrations.
**Key responsibilities**:
- Provides pre-built integration configurations
- Handles integration template customization
- Manages template versioning and updates
- Simplifies integration setup for users

## Infrastructure & Utilities

### Application Controllers

#### `src/main-app/controllers/auth.controller.ts`
**What it does**: Handles authentication endpoints for regular users.
**Key responsibilities**:
- POST /auth/login - User login
- POST /auth/register - User registration
- POST /auth/refresh - Token refresh
- POST /auth/logout - User logout

#### `src/main-app/controllers/admin-auth.controller.ts`
**What it does**: Handles authentication endpoints specifically for admin users.
**Key responsibilities**:
- POST /admin/auth/login - Admin login
- POST /admin/auth/register - Admin registration (requires special code)
- Separate admin session management

### Status & Monitoring

#### `src/main-app/status/status.service.ts`
**What it does**: Provides system health monitoring and status information.
**Key responsibilities**:
- Checks database connectivity
- Monitors Redis cache status
- Provides API health endpoints
- Tracks system performance metrics

### Development & Debug Tools

#### `src/main-app/debug/debug.controller.ts`
**What it does**: Development tools for debugging and system administration.
**Key responsibilities**:
- Provides Redis cache inspection tools
- Offers database query utilities
- Handles development-only operations
- Should be disabled in production

### General Utilities

#### `src/main-app/general/general.controller.ts`
**What it does**: Miscellaneous endpoints that don't fit into specific modules.

### Background Processing

#### `src/main-app/background/bgprocess/free-slot-cron.service.ts`
**What it does**: Scheduled background task for managing appointment availability.
**Key responsibilities**:
- Runs periodic cleanup of expired booking slots
- Updates availability calendars
- Handles recurring appointment management
- Manages booking reminder notifications

## Data Transfer Objects (DTOs)

Throughout the application, DTO files define the structure of data for API requests and responses:

### User DTOs
- `create-user.dto.ts` - Structure for creating new users
- `update-user.dto.ts` - Structure for updating user information

### Lead DTOs
- `create-lead.dto.ts` - Structure for creating new leads
- `update-lead.dto.ts` - Structure for updating lead information

### Contact DTOs
- `create-contact-note.dto.ts` - Structure for adding notes to contacts
- `create-contact-submission.dto.ts` - Structure for contact form submissions
- `contact-filters.dto.ts` - Structure for filtering contact lists

### SMS DTOs
- `send-sms.dto.ts` - Structure for sending individual SMS
- `bulk-sms.dto.ts` - Structure for bulk SMS operations
- `sms-campaign.dto.ts` - Structure for SMS campaign data

### Integration DTOs
- `ghl-integration-config.dto.ts` - Configuration for GoHighLevel integration
- `webhook-event.dto.ts` - Structure for incoming webhook events

## Key Architectural Patterns

### Multi-Tenancy
Every piece of data is isolated by `subAccountId` - customers never see each other's data.

### Security Layers
1. API Key validation
2. JWT authentication
3. Role-based authorization
4. Input validation and sanitization
5. Rate limiting

### Background Processing
Long-running tasks (SMS campaigns, data exports) are handled by Redis-based job queues to keep API responses fast.

### Integration Architecture
Modular integration system allows easy addition of new external services with standardized templates.

### AI Integration
OpenAI integration is contextual - it uses customer's business data and strategies to provide relevant responses.

This backend serves as a comprehensive CRM platform with modern architecture, security best practices, and scalable design patterns.