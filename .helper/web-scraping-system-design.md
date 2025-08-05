# Web Scraping System Design Documentation

## System Overview

The web scraping system is a comprehensive solution integrated into the existing CRM application, following the established architectural patterns of SMS and Chat modules. It provides users with the ability to create, manage, and monitor web scraping jobs with real-time progress tracking and data export capabilities.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        UI[Dashboard UI]
        Forms[Job Creation Forms]
        Results[Results Viewer]
        API_Client[API Client]
    end

    subgraph "Backend (NestJS)"
        Controller[Scraping Controller]
        Service[Scraping Service]
        Queue[Job Queue System]
        Processor[Scraping Processor]
    end

    subgraph "Database (PostgreSQL)"
        Jobs[(Scraping Jobs)]
        Configs[(Scraping Configs)]
        SubAccounts[(Sub Accounts)]
        Users[(Users)]
    end

    subgraph "External Services"
        Websites[Target Websites]
        Browser[Headless Browser]
    end

    UI --> API_Client
    Forms --> API_Client
    Results --> API_Client
    API_Client --> Controller
    Controller --> Service
    Service --> Jobs
    Service --> Configs
    Service --> Queue
    Queue --> Processor
    Processor --> Browser
    Browser --> Websites
    
    Jobs --> SubAccounts
    Jobs --> Users
    Configs --> SubAccounts
    Configs --> Users
```

## Database Schema Design

```mermaid
erDiagram
    SubAccount ||--o{ ScrapingJob : owns
    SubAccount ||--o{ ScrapingConfig : owns
    User ||--o{ ScrapingJob : creates
    User ||--o{ ScrapingConfig : creates

    ScrapingJob {
        int id PK
        string name
        string description
        enum status
        string targetUrl
        int maxPages
        int maxDepth
        json selectors
        json filters
        json schedule
        string userAgent
        int delayMin
        int delayMax
        int timeout
        int totalPages
        int processedPages
        int extractedItems
        json errors
        json results
        datetime createdAt
        datetime updatedAt
        datetime startedAt
        datetime completedAt
        int userId FK
        int subAccountId FK
    }

    ScrapingConfig {
        int id PK
        string name
        string description
        json config
        datetime createdAt
        datetime updatedAt
        int userId FK
        int subAccountId FK
    }

    User {
        int id PK
        string name
        string email
        int subAccountId FK
    }

    SubAccount {
        int id PK
        string name
        string description
    }
```

## API Endpoint Structure

```mermaid
graph LR
    subgraph "Job Management"
        A1[POST /scraping/jobs] --> A2[Create Job]
        A3[GET /scraping/jobs] --> A4[List Jobs]
        A5[GET /scraping/jobs/:id] --> A6[Get Job Details]
        A7[PUT /scraping/jobs/:id] --> A8[Update Job]
        A9[DELETE /scraping/jobs/:id] --> A10[Delete Job]
    end

    subgraph "Job Control"
        B1[POST /scraping/jobs/:id/start] --> B2[Start Job]
        B3[POST /scraping/jobs/:id/pause] --> B4[Pause Job]
        B5[POST /scraping/jobs/:id/cancel] --> B6[Cancel Job]
    end

    subgraph "Results & Export"
        C1[GET /scraping/jobs/:id/results] --> C2[Get Results]
        C3[GET /scraping/jobs/:id/export] --> C4[Export Data]
        C5[GET /scraping/jobs/:id/preview] --> C6[Preview Results]
    end

    subgraph "Monitoring"
        D1[GET /scraping/stats] --> D2[Get Statistics]
        D3[GET /scraping/jobs/:id/status] --> D4[Job Status]
        D5[GET /scraping/jobs/:id/logs] --> D6[Execution Logs]
    end
```

## Job Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING : Job Created

    PENDING --> RUNNING : Start Job
    PENDING --> CANCELLED : Cancel Job

    RUNNING --> PAUSED : Pause Job
    RUNNING --> COMPLETED : Job Finished Successfully
    RUNNING --> FAILED : Error Occurred
    RUNNING --> CANCELLED : Cancel Job

    PAUSED --> RUNNING : Resume Job
    PAUSED --> CANCELLED : Cancel Job

    COMPLETED --> [*]
    FAILED --> [*]
    CANCELLED --> [*]

    note right of RUNNING
        Real-time progress tracking
        Page processing
        Data extraction
    end note

    note right of COMPLETED
        Results available
        Export functionality
        Statistics updated
    end note
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User as User Interface
    participant API as API Controller
    participant Service as Scraping Service
    participant Queue as Job Queue
    participant Processor as Scraping Processor
    participant Browser as Headless Browser
    participant Website as Target Website
    participant DB as Database

    User->>API: Create Scraping Job
    API->>Service: Validate & Create Job
    Service->>DB: Store Job Configuration
    Service->>Queue: Add Job to Queue
    Queue-->>User: Job Created Response

    Queue->>Processor: Process Job
    Processor->>Browser: Launch Browser Session
    Browser->>Website: Navigate to Target URL
    Website-->>Browser: Return HTML Content
    Browser->>Processor: Extract Data using Selectors
    Processor->>DB: Store Extracted Data
    Processor->>DB: Update Job Progress

    loop Real-time Updates
        User->>API: Get Job Status
        API->>Service: Fetch Progress
        Service->>DB: Query Job Status
        DB-->>Service: Return Current State
        Service-->>API: Job Progress Data
        API-->>User: Progress Update
    end

    Processor->>DB: Mark Job as Completed
    User->>API: Export Results
    API->>Service: Generate Export
    Service->>DB: Fetch Results Data
    Service-->>API: Export File
    API-->>User: Download File
```

## Frontend Component Architecture

```mermaid
graph TD
    subgraph "Page Components"
        Dashboard[Scraping Dashboard]
        JobsList[Jobs List Page]
        CreateJob[Create Job Form]
        JobDetails[Job Details Page]
        Results[Results Viewer]
    end

    subgraph "Shared Components"
        StatsCards[Stats Cards]
        JobTable[Job Table]
        ProgressBar[Progress Bar]
        StatusBadge[Status Badge]
    end

    subgraph "API Layer"
        ScrapingAPI[Scraping API Client]
        Types[TypeScript Types]
    end

    subgraph "State Management"
        Hooks[React Hooks]
        Context[React Context]
    end

    Dashboard --> StatsCards
    Dashboard --> JobTable
    JobsList --> JobTable
    JobsList --> StatusBadge
    JobDetails --> ProgressBar
    JobDetails --> StatusBadge
    Results --> JobTable

    Dashboard --> ScrapingAPI
    JobsList --> ScrapingAPI
    CreateJob --> ScrapingAPI
    JobDetails --> ScrapingAPI
    Results --> ScrapingAPI

    ScrapingAPI --> Types
    StatsCards --> Hooks
    JobTable --> Hooks
    JobDetails --> Context
```

## Job Processing Pipeline

```mermaid
flowchart TD
    Start([Job Started]) --> Validate{Validate URL}
    Validate -->|Invalid| Error[Mark as Failed]
    Validate -->|Valid| InitBrowser[Initialize Browser]
    
    InitBrowser --> Navigate[Navigate to Target URL]
    Navigate --> CheckPage{Page Loaded?}
    CheckPage -->|No| Retry{Retry < 3?}
    Retry -->|Yes| Navigate
    Retry -->|No| Error
    
    CheckPage -->|Yes| ExtractData[Extract Data using Selectors]
    ExtractData --> ApplyFilters[Apply Data Filters]
    ApplyFilters --> SaveData[Save Extracted Data]
    SaveData --> UpdateProgress[Update Job Progress]
    
    UpdateProgress --> CheckMore{More Pages?}
    CheckMore -->|Yes| CheckLimits{Within Limits?}
    CheckLimits -->|Yes| Navigate
    CheckLimits -->|No| Complete[Mark as Completed]
    CheckMore -->|No| Complete
    
    Error --> Cleanup[Cleanup Resources]
    Complete --> Cleanup
    Cleanup --> End([Job Finished])
```

## Data Extraction Process

```mermaid
graph LR
    subgraph "Input Configuration"
        URL[Target URL]
        Selectors[CSS Selectors]
        Filters[Data Filters]
        Limits[Page/Depth Limits]
    end

    subgraph "Processing Pipeline"
        Fetch[Fetch HTML]
        Parse[Parse DOM]
        Extract[Extract Elements]
        Transform[Transform Data]
        Filter[Apply Filters]
        Validate[Validate Results]
    end

    subgraph "Output Storage"
        TempData[Temporary Storage]
        Database[(Final Results)]
        Export[Export Files]
    end

    URL --> Fetch
    Selectors --> Extract
    Filters --> Filter
    Limits --> Validate

    Fetch --> Parse
    Parse --> Extract
    Extract --> Transform
    Transform --> Filter
    Filter --> Validate
    Validate --> TempData
    TempData --> Database
    Database --> Export
```

## Security & Multi-Tenancy

```mermaid
graph TB
    subgraph "Authentication Layer"
        JWT[JWT Token]
        Guards[Auth Guards]
        Roles[Role-Based Access]
    end

    subgraph "Multi-Tenant Isolation"
        SubAccount[SubAccount Filter]
        UserScope[User Scope]
        DataIsolation[Data Isolation]
    end

    subgraph "Security Measures"
        URLValidation[URL Validation]
        RateLimit[Rate Limiting]
        InputSanitization[Input Sanitization]
        ResourceLimits[Resource Limits]
    end

    JWT --> Guards
    Guards --> Roles
    Roles --> SubAccount
    SubAccount --> UserScope
    UserScope --> DataIsolation

    DataIsolation --> URLValidation
    URLValidation --> RateLimit
    RateLimit --> InputSanitization
    InputSanitization --> ResourceLimits
```

## Performance Optimization Strategy

```mermaid
mindmap
  root((Performance))
    Frontend
      Component Memoization
      Lazy Loading
      Virtual Scrolling
      Image Optimization
    Backend
      Database Indexing
      Connection Pooling
      Caching Layer
      Query Optimization
    Processing
      Queue Management
      Worker Scaling
      Browser Pooling
      Resource Cleanup
    Monitoring
      Real-time Metrics
      Error Tracking
      Performance Logging
      Health Checks
```

## Configuration Management

```mermaid
graph TD
    subgraph "Job Configuration"
        BasicInfo[Name, Description, URL]
        Extraction[Selectors, Attributes]
        Processing[Delays, Timeouts, Limits]
        Scheduling[Cron, Recurring Jobs]
    end

    subgraph "Template System"
        SavedConfigs[Saved Configurations]
        Templates[Reusable Templates]
        Import[Import/Export Configs]
    end

    subgraph "Validation"
        URLTest[URL Accessibility Test]
        SelectorTest[Selector Validation]
        ConfigTest[Configuration Test]
    end

    BasicInfo --> URLTest
    Extraction --> SelectorTest
    Processing --> ConfigTest
    
    SavedConfigs --> Templates
    Templates --> Import
    
    URLTest --> SavedConfigs
    SelectorTest --> SavedConfigs
    ConfigTest --> SavedConfigs
```

## Error Handling & Recovery

```mermaid
flowchart TD
    Error[Error Occurred] --> Classify{Error Type}
    
    Classify -->|Network| NetworkError[Network Error]
    Classify -->|Parsing| ParsingError[Parsing Error]
    Classify -->|Resource| ResourceError[Resource Error]
    Classify -->|Security| SecurityError[Security Error]
    
    NetworkError --> Retry1{Retry Available?}
    ParsingError --> Log1[Log Error Details]
    ResourceError --> Cleanup1[Cleanup Resources]
    SecurityError --> Block[Block Further Attempts]
    
    Retry1 -->|Yes| Retry2[Retry with Backoff]
    Retry1 -->|No| Log1
    
    Retry2 --> Success{Success?}
    Success -->|Yes| Continue[Continue Processing]
    Success -->|No| Log1
    
    Log1 --> Cleanup1
    Cleanup1 --> Notify[Notify User]
    Block --> Notify
    Continue --> Done[Resume Normal Flow]
    Notify --> Done
```

## Monitoring & Analytics Dashboard

```mermaid
graph TB
    subgraph "Real-time Metrics"
        ActiveJobs[Active Jobs Count]
        ProcessingRate[Pages/Hour]
        SuccessRate[Success Rate %]
        ErrorRate[Error Rate %]
    end

    subgraph "Historical Analytics"
        JobTrends[Job Creation Trends]
        PerformanceMetrics[Performance Over Time]
        ResourceUsage[Resource Utilization]
        UserActivity[User Activity Patterns]
    end

    subgraph "System Health"
        ServiceStatus[Service Health]
        QueueLength[Queue Length]
        MemoryUsage[Memory Usage]
        ResponseTime[API Response Time]
    end

    subgraph "Alerts & Notifications"
        FailureAlerts[Job Failure Alerts]
        ResourceAlerts[Resource Alerts]
        PerformanceAlerts[Performance Alerts]
    end

    ActiveJobs --> JobTrends
    ProcessingRate --> PerformanceMetrics
    SuccessRate --> JobTrends
    ErrorRate --> FailureAlerts

    ServiceStatus --> ResourceAlerts
    QueueLength --> ResourceAlerts
    MemoryUsage --> ResourceAlerts
    ResponseTime --> PerformanceAlerts
```

## Implementation File Structure

### Backend Structure
```
project/src/main-app/modules/scraping/
├── scraping.controller.ts          # 20+ REST API endpoints
├── scraping.service.ts             # Core business logic
├── scraping.module.ts              # NestJS module configuration
├── interfaces/
│   ├── scraping-job.interface.ts   # Job data structures
│   ├── scraping-result.interface.ts # Result data structures
│   └── scraping-config.interface.ts # Configuration interfaces
└── dto/
    ├── create-scraping-job.dto.ts  # Job creation validation
    ├── update-scraping-job.dto.ts  # Job update validation
    └── scraping-config.dto.ts      # Configuration DTOs
```

### Frontend Structure
```
my-app/app/admin/(main)/scraping/
├── page.tsx                        # Main dashboard
├── jobs/
│   ├── page.tsx                   # Jobs list with pagination
│   ├── create/page.tsx            # Multi-step job creation form
│   └── [id]/
│       ├── page.tsx               # Job details with real-time updates
│       └── results/page.tsx       # Results viewer with export
├── components/scraping/
│   └── scraping-stats-cards.tsx   # Statistics dashboard cards
├── lib/api/endpoints/
│   └── scraping.ts                # Complete API client
└── types/
    └── scraping.ts                # TypeScript type definitions
```

### Database Schema Updates
```sql
-- Added to existing Prisma schema
model ScrapingJob {
  id            Int      @id @default(autoincrement())
  name          String
  description   String?  @db.Text
  status        ScrapingJobStatus @default(PENDING)
  
  // Configuration fields
  targetUrl     String
  maxPages      Int      @default(10)
  maxDepth      Int      @default(2)
  selectors     Json     // CSS selectors for data extraction
  filters       Json?    // Filtering rules
  schedule      Json?    // Cron schedule for recurring jobs
  
  // Browser options
  userAgent     String?
  delayMin      Int      @default(1000)
  delayMax      Int      @default(3000)
  timeout       Int      @default(30000)
  
  // Results tracking
  totalPages    Int      @default(0)
  processedPages Int     @default(0)
  extractedItems Int     @default(0)
  errors        Json?    // Error log
  results       Json?    // Scraped data
  
  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  startedAt     DateTime?
  completedAt   DateTime?
  
  // Relationships (Multi-tenant)
  userId        Int
  user          User     @relation(fields: [userId], references: [id])
  subAccountId  Int
  subAccount    SubAccount @relation(fields: [subAccountId], references: [id])
  
  @@map("scraping_jobs")
}

enum ScrapingJobStatus {
  PENDING
  RUNNING
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}
```

## Key Features Summary

### ✅ **Core Functionality**
- **Job Management**: Create, edit, delete, start, pause, cancel scraping jobs
- **Real-time Monitoring**: Live progress tracking with polling-based updates
- **Data Extraction**: CSS selector-based extraction with filtering capabilities
- **Export System**: CSV/JSON export with proper file handling
- **Configuration Templates**: Save and reuse scraping configurations

### ✅ **User Experience**
- **Intuitive UI**: Consistent with existing SMS/Chat module design patterns
- **Progressive Forms**: Multi-step job creation with real-time validation
- **Real-time Feedback**: Progress bars, status updates, live statistics
- **Search & Filter**: Comprehensive filtering across all data views
- **Responsive Design**: Works seamlessly on all device sizes

### ✅ **Technical Excellence**
- **TypeScript**: Full type safety across frontend and backend
- **Multi-tenant**: Complete isolation by SubAccount with proper access control
- **Security**: Input validation, rate limiting, resource constraints
- **Performance**: Optimized queries, component memoization, lazy loading
- **Error Handling**: Comprehensive error recovery and user feedback

### ✅ **Integration**
- **Authentication**: Seamless integration with existing JWT auth system
- **API Consistency**: Follows established patterns from SMS/Chat modules
- **Database**: Proper relationships and constraints with existing schema
- **Deployment**: Ready for production with proper environment configuration

## API Endpoints Reference

### Job Management
- `POST /scraping/jobs` - Create new scraping job
- `GET /scraping/jobs` - List jobs with pagination and filtering
- `GET /scraping/jobs/:id` - Get specific job details
- `PUT /scraping/jobs/:id` - Update job configuration
- `DELETE /scraping/jobs/:id` - Delete job

### Job Control
- `POST /scraping/jobs/:id/start` - Start or resume job
- `POST /scraping/jobs/:id/pause` - Pause running job
- `POST /scraping/jobs/:id/cancel` - Cancel job execution

### Results & Export
- `GET /scraping/jobs/:id/results` - Get paginated results
- `GET /scraping/jobs/:id/export` - Export results (CSV/JSON)
- `GET /scraping/jobs/:id/preview` - Preview limited results

### Monitoring & Statistics
- `GET /scraping/stats` - Get user statistics
- `GET /scraping/jobs/:id/status` - Real-time job status
- `GET /scraping/jobs/:id/logs` - Execution logs

### Configuration Management
- `POST /scraping/configs` - Save configuration template
- `GET /scraping/configs` - List saved configurations
- `PUT /scraping/configs/:id` - Update configuration
- `DELETE /scraping/configs/:id` - Delete configuration

### Utilities
- `GET /scraping/service-status` - Service health check
- `POST /scraping/test-url` - Test URL accessibility
- `POST /scraping/validate-selectors` - Validate CSS selectors

## Security Considerations

### Input Validation
- URL validation prevents internal network access
- CSS selector sanitization prevents XSS
- Rate limiting prevents abuse
- File size limits on exports

### Access Control
- JWT authentication required for all endpoints
- Multi-tenant data isolation by SubAccount
- Role-based permissions for job management
- User can only access their own jobs

### Resource Protection
- Maximum page limits per job
- Timeout controls for long-running jobs
- Memory usage monitoring
- Browser session cleanup

This comprehensive web scraping system provides a robust, scalable, and secure solution that seamlessly integrates with your existing CRM architecture while maintaining all established patterns and conventions.