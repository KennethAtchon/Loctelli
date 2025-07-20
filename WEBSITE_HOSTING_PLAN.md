# AI Website Editor POC

## 🎯 **Project Overview**

Upload a website, then use AI to edit it in real-time. Change colors, text, layout - all through natural language commands. Live preview of changes as you type.

## 🏗️ **System Architecture**

### **Core Components**

1. **Upload Interface**
   - Drag & drop or file picker for website folders
   - Auto-detect if it's Vite, React, or static HTML

2. **AI Editor Interface**
   - Natural language input: "Make the header blue"
   - Real-time code generation and modification
   - Live preview of changes

3. **Code Modification Engine**
   - Parse website structure (HTML, CSS, JS)
   - Apply AI-generated changes
   - Maintain file relationships and dependencies

4. **Live Preview**
   - Real-time rendering of modified code
   - Side-by-side editor and preview
   - Instant feedback on changes

## 📁 **AI Editor Project Structure**

```
Loctelli/
├── my-app/                    # Existing CRM Frontend (loctelli.com)
├── website-builder/           # REFACTORED: Website Builder Frontend (website-builder.loctelli.com)
│   ├── app/
│   │   ├── upload/            # NEW: Upload page
│   │   │   └── page.tsx       # Upload interface
│   │   ├── editor/            # NEW: AI Editor
│   │   │   └── [name]/        # Dynamic editor routes
│   │   │       └── page.tsx   # AI editor interface
│   │   ├── api/               # KEEP: API proxy to backend
│   │   │   └── proxy/         # Existing proxy functionality
│   │   ├── layout.tsx         # REFACTOR: Remove admin sidebar, add auth check
│   │   └── page.tsx           # REFACTOR: Website builder landing
│   ├── components/
│   │   ├── auth/              # KEEP: Auth checking components only
│   │   │   └── protected-route.tsx # Check JWT token, redirect if not found
│   │   ├── upload-form.tsx    # NEW: File upload component
│   │   ├── ai-editor/         # NEW: AI Editor components
│   │   │   ├── editor-interface.tsx    # Main editor UI
│   │   │   ├── code-preview.tsx        # Live code preview
│   │   │   ├── ai-input.tsx            # Natural language input
│   │   │   └── change-history.tsx      # Track changes
│   │   └── ui/                # KEEP: shadcn/ui components
│   ├── lib/
│   │   ├── ai-editor/         # NEW: AI Editor logic
│   │   │   ├── code-parser.ts # Parse HTML/CSS/JS
│   │   │   ├── ai-modifier.ts # Generate code changes
│   │   │   ├── file-manager.ts # Manage website files
│   │   │   └── preview-renderer.ts # Render modified code
│   │   ├── api/               # REFACTOR: Keep existing API client
│   │   │   ├── client.ts      # KEEP: Existing API client
│   │   │   └── website-builder.ts # NEW: Website builder API
│   │   ├── cookies.ts         # KEEP: Cookie management (reads JWT from loctelli.com)
│   │   └── utils.ts           # KEEP: Utility functions
│   ├── contexts/
│   │   └── auth-context.tsx   # KEEP: Auth context (reads existing JWT)
│   ├── types/
│   │   ├── website.ts         # NEW: Website types
│   │   └── editor.ts          # NEW: Editor types
│   ├── package.json           # REFACTOR: Update metadata
│   ├── next.config.ts         # KEEP: Next.js config
│   └── tailwind.config.ts     # KEEP: Tailwind config
└── project/                   # Backend (existing NestJS app)
    ├── src/
    │   ├── main-app/          # REFACTORED: Existing CRM functionality
    │   │   ├── modules/
    │   │   │   ├── users/     # Moved from src/modules/
    │   │   │   ├── leads/     # Moved from src/modules/
    │   │   │   ├── strategies/ # Moved from src/modules/
    │   │   │   ├── bookings/  # Moved from src/modules/
    │   │   │   ├── chat/      # Moved from src/modules/
    │   │   │   └── [other existing modules...]
    │   │   ├── auth/          # Moved from src/auth/
    │   │   ├── infrastructure/ # Moved from src/infrastructure/
    │   │   └── main-app.module.ts # New module for main app
    │   ├── website-builder/   # NEW: Website builder functionality
    │   │   ├── modules/
    │   │   │   └── website-builder/ # Website builder module
    │   │   │       ├── dto/
    │   │   │       │   ├── upload-website.dto.ts
    │   │   │       │   ├── ai-edit.dto.ts
    │   │   │       │   └── export-website.dto.ts
    │   │   │       ├── website-builder.controller.ts
    │   │   │       ├── website-builder.service.ts
    │   │   │       ├── website-builder.module.ts
    │   │   │       ├── ai-editor.service.ts
    │   │   │       ├── code-parser.service.ts
    │   │   │       └── file-storage.service.ts
    │   │   ├── infrastructure/ # Website builder specific infrastructure
    │   │   │   ├── file-storage/
    │   │   │   └── ai-processing/
    │   │   └── website-builder.module.ts # Main website builder module
    │   ├── shared/            # SHARED: Common utilities and types
    │   │   ├── types/
    │   │   ├── utils/
    │   │   └── guards/
    │   └── app.module.ts      # REFACTORED: Import both main-app and website-builder
    └── prisma/
        └── schema.prisma      # Add website builder models
```

## 🚀 **AI Editor Features**

### **1. Upload & Parse**
- **File Picker**: Select website folder
- **Auto-Detect**: Figure out if it's Vite, React, or static HTML
- **Parse Structure**: Extract HTML, CSS, JS components

### **2. AI Editing Interface**
- **Natural Language Input**: "Make the header blue" or "Change the title to 'My Website'"
- **Real-time Suggestions**: AI suggests changes as you type
- **Code Generation**: Generate new components or modify existing ones

### **3. Live Preview**
- **Side-by-side View**: Editor and preview side by side
- **Instant Updates**: See changes immediately
- **Code Highlighting**: Highlight what changed

### **4. Change Management**
- **History**: Track all changes made
- **Undo/Redo**: Revert changes
- **Export**: Download modified website

## 🔧 **AI Editor Implementation**

### **Website Builder Frontend API Routes**

```typescript
// website-builder/app/api/ (Next.js API routes)
POST   /api/upload
GET    /api/websites/:name
POST   /api/editor/:name/modify
GET    /api/editor/:name/history
GET    /api/editor/:name/export
```

### **Backend API Endpoints (NestJS)**

```typescript
// Main App Module (@/project/src/main-app/)
// Existing CRM endpoints remain unchanged

// Website Builder Module (@/project/src/website-builder/)
POST   /api/website-builder/upload
GET    /api/website-builder/websites/:name
POST   /api/website-builder/editor/:name/modify
GET    /api/website-builder/editor/:name/history
GET    /api/website-builder/editor/:name/export
```

### **Database Schema (Add to existing Prisma schema)**

```prisma
// Add to @/project/prisma/schema.prisma
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

### **AI Editor Interface**

```typescript
// app/editor/[name]/page.tsx
export default function EditorPage({ params }: { params: { name: string } }) {
  return (
    <AIEditorInterface name={params.name} />
  );
}

// components/ai-editor/editor-interface.tsx
export function AIEditorInterface({ name }: { name: string }) {
  return (
    <div className="flex h-screen">
      <div className="w-1/3">
        <AIInput />
        <ChangeHistory />
      </div>
      <div className="w-2/3">
        <CodePreview />
      </div>
    </div>
  );
}
```

## 🎨 **AI Editor Interface**

### **Upload Page**
- **File Picker**: Select website folder
- **Structure Preview**: Show parsed HTML/CSS/JS
- **Upload Button**: Save and open editor

### **AI Editor**
- **Natural Language Input**: "Make the header blue"
- **Live Preview**: Side-by-side with editor
- **Change History**: Track all modifications
- **Export Button**: Download modified website

## 🔄 **AI Editor Workflow**

### **1. Authentication & Navigation (SSO)**
1. User logs in at `loctelli.com` (main CRM)
2. JWT token stored in cookies for `.loctelli.com` domain
3. User sees "Website Builder" button in admin dashboard
4. User clicks button to visit `website-builder.loctelli.com`
5. Website builder reads existing JWT token from cookies
6. If no token found, redirects to `loctelli.com/login`
7. If token exists, allows access to website builder

### **2. Upload & Parse**
1. User selects website folder in website-builder frontend
2. Files uploaded to backend (@/project)
3. Backend detects tech stack (Vite/React/static)
4. Backend parses HTML, CSS, JS structure
5. Data saved to PostgreSQL database

### **3. AI Editing**
1. User types natural language command in website-builder frontend
2. Website-builder frontend sends request to backend AI service
3. Backend AI analyzes current code structure
4. OpenAI generates code modifications
5. Backend applies changes and updates database
6. Website-builder frontend receives updated code and shows live preview

### **4. Export**
1. User reviews changes in website-builder frontend
2. Backend compiles modified files
3. Website-builder frontend downloads updated website

## 🛠️ **AI Editor Tech Stack**

### **Website Builder Frontend (website-builder/)**
- **Next.js 15**: App router for routing (copied from my-app)
- **TailwindCSS**: Styling (copied from my-app)
- **shadcn/ui**: UI components (copied from my-app)
- **JWT Auth**: Reads existing JWT tokens from loctelli.com cookies
- **File API**: Handle file uploads
- **Code Parsing**: Parse HTML/CSS/JS structure
- **API Client**: Communicate with backend (extended from my-app)

### **Backend (project/)**
- **NestJS**: Extend existing backend
- **Prisma**: Database ORM (existing)
- **PostgreSQL**: Database (existing)
- **JWT Auth**: Existing authentication system
- **OpenAI API**: Generate code modifications
- **File Storage**: Store website files and metadata

### **AI Integration**
- **OpenAI API**: Generate code modifications
- **Code Analysis**: Understand website structure
- **Real-time Processing**: Apply changes instantly

### **Code Processing**
- **AST Parsing**: Parse code into abstract syntax trees
- **Diff Generation**: Show what changed
- **Live Compilation**: Compile changes in real-time

## 📈 **AI Editor Scaling**

### **Backend Performance**
- **AI API Limits**: Rate limiting for OpenAI calls
- **Database Optimization**: Efficient queries for website data
- **File Storage**: Handle large website files
- **Real-time Processing**: Optimize AI response times

### **Website Builder Frontend Performance**
- **Code Processing**: Efficient parsing and modification
- **Memory Usage**: Handle large website files
- **Real-time Updates**: Optimize for instant feedback
- **API Caching**: Cache website data and changes

## 🔒 **AI Editor Security**

### **Backend Security**
- **Code Validation**: Validate AI-generated code
- **API Key Protection**: Secure OpenAI API usage
- **File Validation**: Check uploaded file types
- **Authentication**: Use existing JWT auth system (SSO)
- **Rate Limiting**: Prevent abuse of AI services
- **User Authorization**: Ensure users can only access their websites

### **Website Builder Frontend Security**
- **JWT Authentication**: Reads existing JWT tokens from loctelli.com cookies
- **Protected Routes**: Redirects to loctelli.com/login if no valid JWT
- **Sandbox Execution**: Safe preview of modified code
- **Input Sanitization**: Clean user inputs
- **XSS Protection**: Prevent malicious code injection

## 🚀 **AI Editor Deployment**

### **Backend Development (@/project/)**
```bash
cd project
npm run start:dev
# Set OPENAI_API_KEY in .env
```

### **Website Builder Frontend Development**
```bash
# Initial setup
cp -r my-app website-builder
cd website-builder

# Refactor and cleanup
# Remove CRM components, keep auth
npm run dev
# Frontend connects to backend on localhost:3001
```

### **Production**
```bash
# Backend
cd project
npm run build
npm run start:prod

# Website Builder Frontend
cd website-builder
npm run build
# Deploy to Vercel/Netlify
```

## 📊 **AI Editor Analytics**

### **Track AI Performance**
- **Success Rate**: How often AI changes work correctly
- **User Feedback**: Rate AI suggestions
- **Common Commands**: Most requested changes
- **Error Tracking**: Failed AI modifications

## 🔮 **Future Enhancements**

### **Advanced AI Features**
- **Voice Commands**: "Hey AI, make the button bigger"
- **Visual Editing**: Click elements to modify them
- **Template Generation**: "Create a contact form"
- **Code Optimization**: AI suggests performance improvements
- **Multi-language Support**: Edit React, Vue, Angular components

## 📝 **AI Editor Implementation**

### **Step 1: Website Builder Frontend Setup (website-builder/)**
- [ ] Copy my-app to website-builder: `cp -r my-app website-builder`
- [ ] Remove all CRM-specific admin pages and components
- [ ] Remove login/register pages (auth handled by loctelli.com)
- [ ] Remove all CRM modules (leads, strategies, bookings, chat, etc.)
- [ ] Clean up unused dependencies and imports
- [ ] Update package.json and project metadata

### **Step 2: Auth Integration & Cleanup**
- [ ] Keep existing auth context and JWT system (reads cookies from loctelli.com)
- [ ] Remove admin dashboard components and routes
- [ ] Keep protected route wrapper (redirects to loctelli.com/login if no JWT)
- [ ] Update navigation to only show website builder features
- [ ] Clean up unused API endpoints and types

### **Step 3: Website Builder Features**
- [ ] Create upload page with file picker
- [ ] Add AI editor interface components
- [ ] Create API client for backend communication
- [ ] Implement file upload to backend

### **Step 4: AI Editor Interface**
- [ ] Create editor layout (side-by-side)
- [ ] Add natural language input
- [ ] Connect to backend AI service
- [ ] Add live preview with iframe

### **Step 5: Backend Reorganization (@/project/)**
- [ ] Reorganize backend structure:
  - [ ] Create `src/main-app/` for existing CRM functionality
  - [ ] Create `src/website-builder/` for website builder functionality
  - [ ] Move existing modules to `src/main-app/`
- [ ] Create website-builder module structure in `src/website-builder/`
- [ ] Add Prisma models for Website and WebsiteChange
- [ ] Create DTOs for upload, edit, and export
- [ ] Implement file storage service
- [ ] Add code parser service
- [ ] Create AI editor service with OpenAI integration

### **Step 6: CRM Integration (my-app/)**
- [ ] Add "Website Builder" button to admin dashboard header
- [ ] Button redirects to `website-builder.loctelli.com`
- [ ] Ensure button is visible to authenticated users
- [ ] Add proper styling to match existing admin UI

### **Step 7: Code Modification & Export**
- [ ] Implement real-time code changes
- [ ] Add change history tracking
- [ ] Create export functionality
- [ ] Test with different frameworks

## 💡 **AI Editor Use Cases**

### **Web Developers**
- Quick prototyping: "Add a contact form"
- Client revisions: "Make the header blue"
- Bug fixes: "Fix the mobile layout"
- **SSO Benefits**: Login once at loctelli.com, access both apps
- **Easy Access**: One-click access from CRM dashboard

### **Designers**
- Visual changes: "Change the font to Roboto"
- Layout adjustments: "Center the content"
- Color schemes: "Use a dark theme"
- **Seamless Auth**: No separate login needed for website builder
- **Integrated Workflow**: Switch between CRM and website editing

### **Content Creators**
- Text updates: "Change the title to 'Welcome'"
- Image replacements: "Add a hero image"
- Call-to-action: "Make the button more prominent"
- **Unified Experience**: Single login experience across subdomains
- **Centralized Access**: All tools accessible from main dashboard

## 🎯 **AI Editor Success**

### **POC Success**
- Upload a website
- Use AI to modify it
- See changes in real-time
- Export the modified website

### **Technical Success**
- AI understands website structure
- Changes are applied correctly
- Real-time preview works
- Code quality is maintained

---

*AI-powered website editor. Upload. Edit with AI. Export. The future of web development.* 