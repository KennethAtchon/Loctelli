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
- [x] Create `components/ai-editor/` directory
- [x] Create `components/ai-editor/editor-interface.tsx`
- [x] Create `components/ai-editor/ai-input.tsx`
- [x] Create `components/ai-editor/change-history.tsx`

#### **3.3 Create Editor Page**
- [x] Create `app/editor/[name]/page.tsx`
- [x] Implement dynamic routing
- [x] Add editor interface integration
- [x] Add error handling

#### **3.4 Create API Client**
- [x] Create `lib/api/website-builder.ts`
- [x] Implement upload API calls
- [x] Implement AI edit API calls
- [x] Implement export API calls
- [x] Add error handling and loading states
- [x] Add website builder API to main API index

#### **3.5 Create Types**
- [x] Create `types/website.ts`
- [x] Create `types/editor.ts`
- [x] Define all necessary interfaces

---

### **Phase 4: AI Editor Interface**

#### **4.1 Create Editor Layout**
- [x] Implement side-by-side layout in `editor-interface.tsx`
- [x] Add responsive design
- [x] Add proper styling with TailwindCSS
- [x] Add tabbed interface for AI and History

#### **4.2 Implement Natural Language Input**
- [x] Create AI input component
- [x] Add text area for user commands
- [x] Add submit button
- [x] Add loading states
- [x] Add error handling
- [x] Add suggested prompts

#### **4.3 Connect to Backend AI Service**
- [x] Implement API calls to backend
- [x] Add request/response handling
- [x] Add error handling
- [x] Add retry logic

#### **4.4 Add Live Preview**
- [x] Create iframe for preview
- [x] Implement real-time updates
- [x] Add code highlighting
- [x] Add responsive preview

---

### **Phase 5: Backend Reorganization (@/project/)**

#### **5.1 Reorganize Backend Structure**
- [x] Create `src/main-app/` directory
- [x] Create `src/website-builder/` directory
- [x] Create `src/shared/` directory for common utilities
- [x] Move existing modules to `src/main-app/modules/`:
  - [x] Move `src/modules/users/` → `src/main-app/modules/users/`
  - [x] Move `src/modules/leads/` → `src/main-app/modules/leads/`
  - [x] Move `src/modules/strategies/` → `src/main-app/modules/strategies/`
  - [x] Move `src/modules/bookings/` → `src/main-app/modules/bookings/`
  - [x] Move `src/modules/chat/` → `src/main-app/modules/chat/`
  - [x] Move other existing modules
- [x] Move `src/auth/` → `src/main-app/auth/`
- [x] Move `src/infrastructure/` → `src/main-app/infrastructure/`

#### **5.2 Create Main App Module**
- [x] Create `src/main-app/main-app.module.ts`
- [x] Import all existing modules
- [x] Export main app module

#### **5.3 Create Website Builder Module Structure**
- [x] Create `src/website-builder/modules/website-builder/` directory
- [x] Create subdirectories:
  - [x] `src/website-builder/modules/website-builder/dto/`
  - [x] `src/website-builder/modules/website-builder/guards/` (if needed)
  - [x] `src/website-builder/modules/website-builder/interfaces/` (if needed)
- [x] Create `src/website-builder/infrastructure/` directory
- [x] Create `src/website-builder/website-builder.module.ts`

#### **5.4 Create Shared Structure**
- [x] Create `src/shared/` directory with subdirectories:
  - [x] `src/shared/guards/` - Common guards (admin, roles)
  - [x] `src/shared/decorators/` - Common decorators (admin, current-user, public, roles)
  - [x] `src/shared/types/` - Common types (BaseEntity, PaginationParams, etc.)
  - [x] `src/shared/utils/` - Common utilities (generateId, sanitizeFilename, etc.)
  - [x] `src/shared/config/` - Shared configuration
  - [x] `src/shared/prisma/` - Shared database module
  - [x] `src/shared/cache/` - Shared cache module
  - [x] `src/shared/middleware/` - Shared middleware
- [x] Create `src/shared/shared.module.ts` to export all shared components
- [x] Create index files for easy imports
- [x] Move infrastructure from main-app to shared
- [x] Update core app.module.ts to use new structure

#### **5.5 Database Schema Updates**
- [x] Open `project/prisma/schema.prisma`
- [x] Add Website model with proper relationships
- [x] Add WebsiteChange model for tracking AI modifications
- [x] Update AdminUser model to include websites relationship
- [ ] Run migration: `npx prisma migrate dev --name add-website-builder`
- [ ] Generate Prisma client: `npx prisma generate`

#### **5.6 Create Website Builder DTOs**
- [x] Create `src/website-builder/modules/website-builder/dto/create-website.dto.ts`
- [x] Create `src/website-builder/modules/website-builder/dto/update-website.dto.ts`
- [x] Create `src/website-builder/modules/website-builder/dto/ai-edit.dto.ts`

#### **5.7 Create Website Builder Services**
- [x] Create `src/website-builder/modules/website-builder/website-builder.service.ts`
- [x] Implement CRUD operations
- [x] Implement AI editing functionality with OpenAI integration
- [x] Implement change history tracking
- [x] Implement revert functionality

#### **5.8 Create Website Builder Controller**
- [x] Create `src/website-builder/modules/website-builder/website-builder.controller.ts`
- [x] Implement endpoints:
  - [x] `POST /api/website-builder` (create website)
  - [x] `GET /api/website-builder` (list websites)
  - [x] `GET /api/website-builder/:id` (get website)
  - [x] `PATCH /api/website-builder/:id` (update website)
  - [x] `DELETE /api/website-builder/:id` (delete website)
  - [x] `POST /api/website-builder/:id/ai-edit` (AI edit)
  - [x] `GET /api/website-builder/:id/changes` (change history)
  - [x] `POST /api/website-builder/:id/changes/:changeId/revert` (revert change)

#### **5.9 Create Website Builder Module**
- [x] Create `src/website-builder/modules/website-builder/website-builder.module.ts`
- [x] Create `src/website-builder/website-builder.module.ts`
- [x] Update `src/core/app.module.ts` to import both main-app and website-builder modules

#### **5.10 Environment Setup**
- [ ] Add `OPENAI_API_KEY` to `project/.env`
- [ ] Add any other required environment variables
- [ ] Update environment validation if needed

---

### **Phase 6: CRM Integration (my-app/)**

#### **6.1 Add Website Builder Button**
- [x] Locate admin dashboard header component
- [x] Add "Website Builder" button with Code icon
- [x] Style button to match existing UI
- [x] Add click handler to redirect to website-builder with environment detection

#### **6.2 Test Integration**
- [ ] Test button appears for authenticated users
- [ ] Test redirect works correctly
- [ ] Test JWT token sharing between subdomains

---

### **Phase 7: Code Modification & Export**

#### **7.1 Implement Real-time Code Changes**
- [x] Create code parsing logic
- [ ] Implement change application (editor interface needs update)
- [x] Add validation for AI-generated code
- [x] Add error handling

#### **7.2 Add Change History**
- [x] Create change history component
- [x] Implement undo/redo functionality
- [x] Add change descriptions
- [x] Add timestamps

#### **7.3 Create Export Functionality**
- [x] Implement file compilation
- [x] Add download functionality
- [x] Add export options
- [x] Add progress indicators

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