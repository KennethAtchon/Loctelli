# AI Website Editor POC - Implementation Checklist

## 📋 **Project Setup Checklist**

### **Phase 1: Website Builder Frontend Setup (website-builder/)**

#### **1.1 Initial Copy and Setup**
- [x] Run: `cp -r my-app website-builder`
- [x] Navigate to website-builder: `cd website-builder`
- [x] Update `package.json`:
  - [x] Change name to "website-builder"
  - [x] Update description
  - [x] Update version if needed

#### **1.2 Remove CRM-Specific Components**
- [x] Remove admin pages:
  - [x] Delete `app/admin/` directory
  - [x] Remove all CRM-related routes
- [x] Remove CRM components:
  - [x] Delete `components/admin/` directory
  - [x] Remove CRM-specific components
- [x] Remove CRM API endpoints:
  - [x] Clean up `lib/api/endpoints/` (keep only needed ones)
  - [x] Remove CRM-specific types

#### **1.3 Remove Auth Pages**
- [x] Delete `app/auth/` directory (login/register pages)
- [x] Keep auth-related utilities:
  - [x] Keep `contexts/admin-auth-context.tsx` (admin-only access)
  - [x] Keep `components/auth/protected-route.tsx`
  - [x] Keep `lib/cookies.ts`
  - [x] Keep `lib/api/client.ts`

#### **1.4 Clean Up Dependencies**
- [x] Review `package.json` dependencies
- [x] Remove unused packages
- [x] Run: `pnpm install` to clean up
- [ ] Test that the app still builds: `pnpm run build`

#### **1.5 Update Configuration Files**
- [ ] Update `next.config.ts` if needed
- [ ] Update `tailwind.config.ts` if needed
- [ ] Update `tsconfig.json` if needed
- [ ] Update `.env.local` with website-builder specific variables
- [x] Add website-builder service to `docker-compose.yml`
- [x] Configure website-builder to run on port 3001
- [x] Ensure Dockerfile exists and is properly configured

---

### **Phase 2: Auth Integration & Cleanup**

#### **2.1 Update Auth Context**
- [x] Configure `contexts/admin-auth-context.tsx` for admin-only access
- [x] Ensure it uses shared JWT cookies from loctelli.com
- [x] Test auth flow

#### **2.2 Update Protected Routes**
- [x] Clean up auth context files (removed regular AuthProvider)
- [x] Keep only AdminAuthProvider for admin-only access
- [x] Update test utilities to use only AdminAuthProvider
- [x] Create `components/auth/admin-protected-route.tsx` for admin-only protection
- [x] Ensure it checks for existing JWT token
- [x] Add redirect logic to main CRM admin login if not authenticated
- [x] Wrap layout with AdminProtectedRoute

#### **2.3 Update Layout**
- [x] Modify `app/layout.tsx`
- [x] Remove admin sidebar references
- [x] Add AdminAuthProvider wrapper
- [x] Update navigation to only show website builder features

#### **2.4 Update Landing Page**
- [x] Modify `app/page.tsx`
- [x] Create website builder landing page (cookie-cutter single-page app)
- [x] Add upload functionality directly to main page
- [x] Remove CRM-specific content
- [x] Create UploadZone component with drag & drop

#### **2.5 Clean Up API Client**
- [x] Update `lib/api/index.ts` to remove CRM-specific endpoints
- [x] Keep only auth, admin-auth, and status endpoints
- [x] Copy admin-auth endpoint from my-app
- [x] Keep proxy functionality
- [ ] Add website-builder API client (Phase 3)

---

### **Phase 3: Website Builder Features**

#### **3.1 Create Upload Page**
- [x] Create `components/upload-zone.tsx` (integrated into main page)
- [x] Implement file picker functionality
- [x] Add drag & drop support
- [x] Add file validation
- [x] Add upload progress indicator
- [x] Add react-dropzone dependency

#### **3.2 Create AI Editor Components**
- [ ] Create `components/ai-editor/` directory
- [ ] Create `components/ai-editor/editor-interface.tsx`
- [ ] Create `components/ai-editor/code-preview.tsx`
- [ ] Create `components/ai-editor/ai-input.tsx`
- [ ] Create `components/ai-editor/change-history.tsx`

#### **3.3 Create Editor Page**
- [ ] Create `app/editor/[name]/page.tsx`
- [ ] Implement dynamic routing
- [ ] Add editor interface integration
- [ ] Add error handling

#### **3.4 Create API Client**
- [ ] Create `lib/api/website-builder.ts`
- [ ] Implement upload API calls
- [ ] Implement AI edit API calls
- [ ] Implement export API calls
- [ ] Add error handling and loading states

#### **3.5 Create Types**
- [ ] Create `types/website.ts`
- [ ] Create `types/editor.ts`
- [ ] Define all necessary interfaces

---

### **Phase 4: AI Editor Interface**

#### **4.1 Create Editor Layout**
- [ ] Implement side-by-side layout in `editor-interface.tsx`
- [ ] Add responsive design
- [ ] Add proper styling with TailwindCSS

#### **4.2 Implement Natural Language Input**
- [ ] Create AI input component
- [ ] Add text area for user commands
- [ ] Add submit button
- [ ] Add loading states
- [ ] Add error handling

#### **4.3 Connect to Backend AI Service**
- [ ] Implement API calls to backend
- [ ] Add request/response handling
- [ ] Add error handling
- [ ] Add retry logic

#### **4.4 Add Live Preview**
- [ ] Create iframe for preview
- [ ] Implement real-time updates
- [ ] Add code highlighting
- [ ] Add responsive preview

---

### **Phase 5: Backend Reorganization (@/project/)**

#### **5.1 Reorganize Backend Structure**
- [ ] Create `src/main-app/` directory
- [ ] Create `src/website-builder/` directory
- [ ] Create `src/shared/` directory for common utilities
- [ ] Move existing modules to `src/main-app/modules/`:
  - [ ] Move `src/modules/users/` → `src/main-app/modules/users/`
  - [ ] Move `src/modules/leads/` → `src/main-app/modules/leads/`
  - [ ] Move `src/modules/strategies/` → `src/main-app/modules/strategies/`
  - [ ] Move `src/modules/bookings/` → `src/main-app/modules/bookings/`
  - [ ] Move `src/modules/chat/` → `src/main-app/modules/chat/`
  - [ ] Move other existing modules
- [ ] Move `src/auth/` → `src/main-app/auth/`
- [ ] Move `src/infrastructure/` → `src/main-app/infrastructure/`

#### **5.2 Create Main App Module**
- [ ] Create `src/main-app/main-app.module.ts`
- [ ] Import all existing modules
- [ ] Export main app module

#### **5.3 Create Website Builder Module Structure**
- [ ] Create `src/website-builder/modules/website-builder/` directory
- [ ] Create subdirectories:
  - [ ] `src/website-builder/modules/website-builder/dto/`
  - [ ] `src/website-builder/modules/website-builder/guards/` (if needed)
  - [ ] `src/website-builder/modules/website-builder/interfaces/` (if needed)
- [ ] Create `src/website-builder/infrastructure/` directory
- [ ] Create `src/website-builder/website-builder.module.ts`

#### **5.4 Database Schema Updates**
- [ ] Open `project/prisma/schema.prisma`
- [ ] Add Website model:
  ```prisma
  model Website {
    id          String   @id @default(cuid())
    name        String   @unique
    description String?
    type        String   // 'static', 'vite', 'react'
    structure   Json     // Parsed HTML/CSS/JS structure
    files       Json     // File metadata and content
    status      String   @default("active") // 'active', 'archived'
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    
    // Relationships
    changes     WebsiteChange[]
    userId      String?
    user        User?    @relation(fields: [userId], references: [id])
  }
  ```
- [ ] Add WebsiteChange model:
  ```prisma
  model WebsiteChange {
    id          String   @id @default(cuid())
    websiteId   String
    description String   // Natural language description
    modifications Json   // Code changes applied
    aiPrompt    String   // Original AI prompt
    status      String   @default("applied") // 'applied', 'reverted'
    createdAt   DateTime @default(now())
    
    website     Website  @relation(fields: [websiteId], references: [id])
  }
  ```
- [ ] Update User model to include websites relationship
- [ ] Run migration: `npx prisma migrate dev --name add-website-builder`
- [ ] Generate Prisma client: `npx prisma generate`

#### **5.5 Create Website Builder DTOs**
- [ ] Create `src/website-builder/modules/website-builder/dto/upload-website.dto.ts`
- [ ] Create `src/website-builder/modules/website-builder/dto/ai-edit.dto.ts`
- [ ] Create `src/website-builder/modules/website-builder/dto/export-website.dto.ts`
- [ ] Create `src/website-builder/modules/website-builder/dto/update-website.dto.ts`

#### **5.6 Create Website Builder Services**
- [ ] Create `src/website-builder/modules/website-builder/website-builder.service.ts`
- [ ] Create `src/website-builder/modules/website-builder/ai-editor.service.ts`
- [ ] Create `src/website-builder/modules/website-builder/code-parser.service.ts`
- [ ] Create `src/website-builder/modules/website-builder/file-storage.service.ts`

#### **5.7 Create Website Builder Controller**
- [ ] Create `src/website-builder/modules/website-builder/website-builder.controller.ts`
- [ ] Implement endpoints:
  - [ ] `POST /api/website-builder/upload`
  - [ ] `GET /api/website-builder/websites/:name`
  - [ ] `POST /api/website-builder/editor/:name/modify`
  - [ ] `GET /api/website-builder/editor/:name/history`
  - [ ] `GET /api/website-builder/editor/:name/export`

#### **5.8 Create Website Builder Module**
- [ ] Create `src/website-builder/modules/website-builder/website-builder.module.ts`
- [ ] Create `src/website-builder/website-builder.module.ts`
- [ ] Update `src/app.module.ts` to import both main-app and website-builder modules

#### **5.9 Environment Setup**
- [ ] Add `OPENAI_API_KEY` to `project/.env`
- [ ] Add any other required environment variables
- [ ] Update environment validation if needed

---

### **Phase 6: CRM Integration (my-app/)**

#### **6.1 Add Website Builder Button**
- [ ] Locate admin dashboard header component
- [ ] Add "Website Builder" button
- [ ] Style button to match existing UI
- [ ] Add click handler to redirect to `website-builder.loctelli.com`

#### **6.2 Test Integration**
- [ ] Test button appears for authenticated users
- [ ] Test redirect works correctly
- [ ] Test JWT token sharing between subdomains

---

### **Phase 7: Code Modification & Export**

#### **7.1 Implement Real-time Code Changes**
- [ ] Create code parsing logic
- [ ] Implement change application
- [ ] Add validation for AI-generated code
- [ ] Add error handling

#### **7.2 Add Change History**
- [ ] Create change history component
- [ ] Implement undo/redo functionality
- [ ] Add change descriptions
- [ ] Add timestamps

#### **7.3 Create Export Functionality**
- [ ] Implement file compilation
- [ ] Add download functionality
- [ ] Add export options
- [ ] Add progress indicators

#### **7.4 Testing**
- [ ] Test with static HTML websites
- [ ] Test with Vite/React websites
- [ ] Test with different file structures
- [ ] Test error scenarios

---

## 🧪 **Testing Checklist**

### **Backend Testing**
- [ ] Test file upload endpoint
- [ ] Test AI modification endpoint
- [ ] Test export endpoint
- [ ] Test authentication
- [ ] Test error handling
- [ ] Test rate limiting

### **Frontend Testing**
- [ ] Test file upload
- [ ] Test AI editing interface
- [ ] Test live preview
- [ ] Test change history
- [ ] Test export functionality
- [ ] Test authentication flow
- [ ] Test error handling

### **Integration Testing**
- [ ] Test end-to-end workflow
- [ ] Test cross-subdomain authentication
- [ ] Test file upload to AI editing flow
- [ ] Test export after modifications

---

## 🚀 **Deployment Checklist**

### **Backend Deployment**
- [ ] Set up production environment variables
- [ ] Configure OpenAI API key
- [ ] Set up database migrations
- [ ] Deploy to production server
- [ ] Test production endpoints

### **Frontend Deployment**
- [ ] Configure subdomain (website-builder.loctelli.com)
- [ ] Set up environment variables
- [ ] Build production version
- [ ] Deploy to hosting platform
- [ ] Test production deployment

### **Domain Configuration**
- [ ] Configure DNS for subdomain
- [ ] Set up SSL certificates
- [ ] Test subdomain access
- [ ] Test cookie sharing between subdomains

---

## 📊 **Post-Launch Checklist**

### **Monitoring**
- [ ] Set up error tracking
- [ ] Monitor AI API usage
- [ ] Track user interactions
- [ ] Monitor performance

### **User Feedback**
- [ ] Collect user feedback
- [ ] Monitor common issues
- [ ] Track feature requests
- [ ] Plan improvements

---

## ✅ **Completion Criteria**

### **MVP Success Criteria**
- [ ] Users can upload website files
- [ ] AI can modify websites based on natural language
- [ ] Changes are applied in real-time
- [ ] Users can export modified websites
- [ ] Authentication works across subdomains
- [ ] No critical errors in production

### **Technical Success Criteria**
- [ ] Backend handles file uploads correctly
- [ ] AI modifications are applied accurately
- [ ] Real-time preview works smoothly
- [ ] Export functionality generates valid files
- [ ] Authentication is secure and reliable

---

*Use this checklist to track progress and ensure all components are implemented correctly.* 