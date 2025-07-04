# Migration Plan: FastAPI + SQLAlchemy to NestJS + Prisma

## Overview
This document outlines the plan for migrating the existing FastAPI + SQLAlchemy application to NestJS + Prisma. The migration will maintain all current functionality while leveraging the benefits of TypeScript, NestJS's modular architecture, and Prisma's type-safe database access.

## Project Structure
The NestJS application will have the following structure:
```
project/
├── src/
│   ├── main.ts                     # Entry point
│   ├── app.module.ts               # Root module
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma schema definition
│   │   └── prisma.service.ts       # Prisma service for dependency injection
│   ├── users/                      # User module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   ├── strategies/                 # Strategy module
│   │   ├── strategies.module.ts
│   │   ├── strategies.controller.ts
│   │   ├── strategies.service.ts
│   │   └── dto/
│   ├── clients/                    # Client module
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   └── dto/
│   ├── bookings/                   # Bookings module
│   │   ├── bookings.module.ts
│   │   ├── bookings.controller.ts
│   │   ├── bookings.service.ts
│   │   └── dto/
│   ├── chat/                       # Chat module
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   └── webhooks/                   # Webhooks module
│       ├── webhooks.module.ts
│       ├── webhooks.controller.ts
│       └── webhooks.service.ts
├── prisma/
│   ├── migrations/                 # Prisma migrations
│   └── schema.prisma               # Main schema file (copied for tooling)
├── node_modules/
├── .env                            # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
└── docker-compose.yml              # For PostgreSQL
```

## Database Schema Migration
The SQLAlchemy models will be converted to Prisma schema:

```prisma
// From the db_models.py models:

model User {
  id              Int         @id @default(autoincrement())
  name            String
  company         String?
  email           String?
  budget          String?
  bookingsTime    Json?       // JSON field for bookings time
  bookingEnabled  Int         @default(0) // 0 = False, 1 = True
  calendarId      String?     // Calendar ID for GoHighLevel
  locationId      String?     // Location ID for GoHighLevel
  assignedUserId  String?     // Assigned User ID for GoHighLevel
  strategies      Strategy[]
  clients         Client[]
  bookings        Booking[]
}

model Strategy {
  id                      Int        @id @default(autoincrement())
  userId                  Int
  name                    String
  tag                     String?
  tone                    String?
  aiInstructions          String?    @db.Text
  objectionHandling       String?    @db.Text
  qualificationPriority   String?
  creativity              Int?
  aiObjective             String?    @db.Text
  disqualificationCriteria String?   @db.Text
  exampleConversation     Json?
  delayMin                Int?       // Minimum delay in seconds
  delayMax                Int?       // Maximum delay in seconds
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @default(now()) @updatedAt
  user                    User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  clients                 Client[]
}

model Client {
  id             Int       @id @default(autoincrement())
  userId         Int
  strategyId     Int
  name           String
  customId       String?
  messageHistory Json?     // List of messages in JSON format
  status         String    @default("lead")
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  strategy       Strategy  @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  bookings       Booking[]
}

model Booking {
  id           Int      @id @default(autoincrement())
  userId       Int
  clientId     Int?
  bookingType  String
  details      Json
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @default(now()) @updatedAt
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  client       Client?  @relation(fields: [clientId], references: [id])
}
```

## API Endpoints Migration
Each FastAPI router will be converted to a NestJS controller:
- /user → UsersController
- /strategy → StrategiesController
- /client → ClientsController
- /booking → BookingsController
- /chat → ChatController
- /webhook → WebhooksController
- /status → StatusController
- /general → GeneralController

## Implementation Steps
1. Initialize a NestJS project in the project directory
2. Set up PostgreSQL connection with Prisma
3. Create Prisma schema based on SQLAlchemy models
4. Generate Prisma client
5. Create DTOs (Data Transfer Objects) for each entity
6. Implement modules, controllers, and services for each entity
7. Add middleware for API key authentication
8. Migrate background processes
9. Set up Docker configuration
10. Create documentation and migration guide

## Testing Strategy
1. Unit tests for services
2. Integration tests for API endpoints
3. End-to-end tests for critical flows

## Dependencies
- NestJS
- Prisma
- PostgreSQL
- TypeScript
- Jest (for testing)
- Class-validator and class-transformer (for validation)
- Passport (for authentication)

## Migration Timeline
1. **Phase 1**: Project setup and database schema migration (1-2 days)
2. **Phase 2**: Core modules implementation (3-5 days)
3. **Phase 3**: Testing and bug fixing (2-3 days)
4. **Phase 4**: Deployment and documentation (1-2 days)

## Risks and Mitigations
- **Data migration**: Use Prisma migrations carefully to avoid data loss
- **API compatibility**: Ensure all endpoints maintain the same contract
- **Performance**: Monitor and optimize database queries with Prisma

## References
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- Original FastAPI codebase in `/myapp`
