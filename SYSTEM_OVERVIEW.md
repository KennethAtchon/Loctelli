# Loctelli System Overview

## 🏗️ **Architecture Overview**

Loctelli is a multi-service application consisting of:

1. **Main CRM Application** (`my-app/`) - Port 3000
2. **Website Builder** (`website-builder/`) - Port 3001  
3. **Backend API** (`project/`) - Port 8000
4. **PostgreSQL Database** - Port 5432
5. **Redis Cache** - Port 6379

All services run in Docker containers and communicate via a shared network.

## 🔐 **Authentication & Authorization**

### **Multi-Subdomain Authentication**
- **Main CRM**: `loctelli.com` (or `localhost:3000`)
- **Website Builder**: `website-builder.loctelli.com` (or `localhost:3001`)
- **Shared JWT tokens** via cookie-based authentication
- **Admin-only access** to website builder

### **User Roles**
- **Admin Users**: Full access to CRM + Website Builder
- **Regular Users**: CRM access only (leads, strategies, bookings)
- **Super Admins**: System-wide administration

## 📊 **CRM System (Main Application)**

### **Core Features**
- **Lead Management**: Track prospects, conversations, and follow-ups
- **Strategy Management**: AI-powered sales strategies and templates
- **Booking System**: Appointment scheduling and management
- **User Management**: Multi-tenant user administration
- **Integration Hub**: Third-party service connections (GoHighLevel, etc.)

### **Key Components**
- **SubAccounts**: Multi-tenant isolation
- **AI Chat**: Automated lead qualification and responses
- **Analytics**: Performance tracking and reporting
- **Admin Dashboard**: System administration and monitoring

## 🎨 **Website Builder System**

### **Purpose**
AI-powered website editing tool that allows users to:
- Upload existing website files
- Make natural language modifications via AI
- Preview changes in real-time
- Export modified websites
- Track change history

### **Core Features**

#### **1. File Upload & Processing**
- **Supported Formats**: HTML, CSS, JS, React, Next.js, Vite projects
- **File Validation**: Type checking and size limits
- **Structure Analysis**: Automatic project structure detection
- **Content Parsing**: Extract and organize file contents

#### **2. AI-Powered Editing**
- **Natural Language Interface**: Users describe changes in plain English
- **OpenAI Integration**: GPT-4 powered code modifications
- **Context Awareness**: AI understands project structure and file relationships
- **Smart Suggestions**: AI provides modification recommendations

#### **3. Real-Time Preview**
- **Live Preview**: Instant visualization of changes
- **Code Highlighting**: Syntax highlighting for modified files
- **Responsive Testing**: Mobile and desktop preview modes
- **Error Detection**: Real-time validation and error reporting

#### **4. Change Management**
- **Version History**: Complete audit trail of all modifications
- **Revert Functionality**: Undo any change with one click
- **Diff Viewing**: Visual comparison of before/after changes
- **Confidence Scoring**: AI confidence levels for each modification

#### **5. Export System**
- **ZIP Generation**: Download complete modified website
- **File Preservation**: Maintain original file structure
- **Metadata Inclusion**: Export change history and documentation

### **Technical Architecture**

#### **Frontend (Next.js)**
```
website-builder/
├── app/
│   ├── editor/[name]/     # Dynamic editor pages
│   └── api/proxy/         # API proxy for backend communication
├── components/
│   ├── ai-editor/         # AI editing interface
│   ├── upload-zone/       # File upload component
│   └── ui/               # Shared UI components
└── lib/
    └── api/              # API client and endpoints
```

#### **Backend (NestJS)**
```
project/src/website-builder/
├── modules/website-builder/
│   ├── website-builder.controller.ts
│   ├── website-builder.service.ts
│   └── dto/              # Data transfer objects
└── website-builder.module.ts
```

#### **Database Schema**
```sql
-- Website storage
model Website {
  id          String   @id @default(cuid())
  name        String   @unique
  type        String   // 'static', 'vite', 'react', 'nextjs'
  structure   Json     // Parsed project structure
  files       Json     // File contents and metadata
  status      String   @default("active")
  createdByAdminId Int
  createdByAdmin AdminUser @relation(fields: [createdByAdminId], references: [id])
  changeHistory WebsiteChange[]
}

-- Change tracking
model WebsiteChange {
  id          String   @id @default(cuid())
  websiteId   String
  website     Website  @relation(fields: [websiteId], references: [id])
  type        String   // 'ai_edit', 'manual_edit', 'revert'
  description String
  prompt      String?  // Original AI prompt
  changes     Json     // Detailed change information
  createdByAdminId Int
  createdByAdmin AdminUser @relation(fields: [createdByAdminId], references: [id])
}
```

## 🔄 **Integration Points**

### **CRM → Website Builder**
- **Navigation**: "Website Builder" button in admin dashboard
- **Authentication**: Shared JWT tokens via cookies
- **Environment Detection**: Automatic API URL configuration
- **User Context**: Admin user information passed to builder

### **Website Builder → Backend**
- **REST API**: Standard HTTP endpoints for CRUD operations
- **File Upload**: Multipart form data handling
- **AI Processing**: OpenAI API integration for code modifications
- **Real-time Updates**: WebSocket-like polling for live preview

### **Data Flow**
1. **Upload**: Files → Backend → Database storage
2. **AI Edit**: User prompt → OpenAI → Code modifications → Database update
3. **Preview**: Modified files → Frontend rendering → Live preview
4. **Export**: Database → File compilation → ZIP download

## 🛠️ **Development Workflow**

### **Local Development**
```bash
# Start all services
docker-compose up -d

# Backend development
cd project
npm run start:dev

# Frontend development (CRM)
cd my-app
pnpm run dev

# Website builder development
cd website-builder
pnpm run dev
```

### **Database Management**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run db:seed

# View database
npx prisma studio
```

### **Testing**
```bash
# Backend tests
npm run test
npm run test:e2e

# Frontend tests
pnpm run test
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/loctelli
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# OpenAI
OPENAI_API_KEY=your-openai-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### **Docker Configuration**
- **Multi-stage builds** for optimized production images
- **Health checks** for service monitoring
- **Volume persistence** for database and cache data
- **Network isolation** for secure inter-service communication

## 📈 **Performance & Scalability**

### **Caching Strategy**
- **Redis**: Session storage and API response caching
- **Browser**: Static asset caching and service worker
- **CDN**: Production asset delivery optimization

### **Database Optimization**
- **Indexing**: Optimized queries for website and change lookups
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Minimal N+1 queries and efficient joins

### **AI Processing**
- **Async Processing**: Non-blocking AI operations
- **Rate Limiting**: OpenAI API usage optimization
- **Caching**: Repeated prompt response caching

## 🔒 **Security Considerations**

### **Authentication**
- **JWT Tokens**: Secure token-based authentication
- **Cookie Security**: HttpOnly, Secure, SameSite attributes
- **CORS Configuration**: Proper cross-origin request handling

### **File Security**
- **Upload Validation**: File type and size restrictions
- **Content Scanning**: Malicious code detection
- **Access Control**: Admin-only website builder access

### **API Security**
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error messages without information leakage

## 🚀 **Deployment**

### **Production Setup**
1. **Environment Configuration**: Production environment variables
2. **Database Migration**: Run production migrations
3. **SSL Certificates**: HTTPS configuration for all services
4. **Domain Configuration**: DNS setup for subdomains
5. **Monitoring**: Health checks and error tracking

### **CI/CD Pipeline**
- **Code Quality**: Linting, testing, and security scanning
- **Build Process**: Automated Docker image building
- **Deployment**: Blue-green deployment strategy
- **Rollback**: Quick rollback capabilities

## 📚 **API Documentation**

### **Website Builder Endpoints**
```
POST   /api/website-builder          # Create website
GET    /api/website-builder          # List websites
GET    /api/website-builder/:id      # Get website
PATCH  /api/website-builder/:id      # Update website
DELETE /api/website-builder/:id      # Delete website
POST   /api/website-builder/:id/ai-edit    # AI edit
GET    /api/website-builder/:id/changes    # Change history
POST   /api/website-builder/:id/changes/:changeId/revert  # Revert change
```

### **Authentication Endpoints**
```
POST   /api/auth/login               # Admin login
POST   /api/auth/register            # Admin registration
POST   /api/auth/refresh             # Token refresh
GET    /api/auth/profile             # User profile
```

## 🎯 **Future Enhancements**

### **Planned Features**
- **Collaborative Editing**: Multi-user website editing
- **Template Library**: Pre-built website templates
- **Advanced AI**: More sophisticated code generation
- **Version Control**: Git-like version management
- **Performance Analytics**: Website performance tracking

### **Integration Opportunities**
- **CMS Integration**: Content management system connections
- **E-commerce**: Shopping cart and payment processing
- **Analytics**: Google Analytics and conversion tracking
- **SEO Tools**: Search engine optimization features

---

*This system overview provides a comprehensive understanding of the Loctelli platform architecture, features, and technical implementation.* 