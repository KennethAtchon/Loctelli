# Website Builder Upload & Preview System

## Overview

The Website Builder is an AI-powered tool that allows users to upload website files, edit them using natural language, and preview the results in real-time. This document describes the complete technical implementation of the upload and preview system.

## System Architecture

### Components
1. **Frontend (Website Builder)** - Port 3001
   - Upload interface
   - File processing
   - Preview rendering
   - AI editing interface

2. **Backend API** - Port 8000
   - File upload handling
   - Database storage
   - AI processing
   - File serving

3. **Database** - PostgreSQL
   - Website metadata
   - File contents
   - Change history

4. **Proxy Layer** - Next.js API routes
   - Authentication forwarding
   - Request routing
   - CORS handling

## Upload Process Flow

### 1. Frontend Upload Initiation

**Location**: `website-builder/app/page.tsx`

```typescript
const handleUpload = async () => {
  // 1. Validate files
  if (uploadedFiles.length === 0) {
    throw new Error("No files selected");
  }

  // 2. Generate unique website name
  const websiteName = `website-${Date.now()}`;

  // 3. Call API with FormData
  const response = await api.websiteBuilder.uploadWebsite(
    uploadedFiles, 
    websiteName, 
    "Uploaded website"
  );

  // 4. Redirect to editor on success
  if (response.success) {
    window.location.href = `/editor/${response.website.id}`;
  }
};
```

**Logging**: Extensive logging at each step
- File details (name, size, type)
- API call status
- Response handling
- Error details

### 2. API Client Processing

**Location**: `website-builder/lib/api/client.ts`

```typescript
protected async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
  // 1. Detect FormData vs JSON
  const body = data instanceof FormData ? data : JSON.stringify(data);
  
  // 2. Set appropriate headers
  const isFormData = data instanceof FormData;
  const defaultHeaders: Record<string, string> = {};
  
  if (!isFormData) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  // 3. Add authentication headers
  const authHeaders = this.getAuthHeaders(); // x-user-token
  
  // 4. Make request
  return this.request<T>(endpoint, {
    method: 'POST',
    body,
    headers: { ...defaultHeaders, ...authHeaders, ...options.headers }
  });
}
```

**Key Features**:
- FormData detection and handling
- Authentication header injection
- Proper Content-Type management
- Error handling and retry logic

### 3. Proxy Route Processing

**Location**: `website-builder/app/api/proxy/[...path]/route.ts`

```typescript
async function handleRequest(request: NextRequest, pathSegments: string[], method: string) {
  // 1. Construct backend URL
  const path = pathSegments.join('/');
  const url = `${BACKEND_URL}/${path}`;

  // 2. Prepare headers
  const headers: Record<string, string> = {};
  
  // Don't override Content-Type for FormData
  const contentType = request.headers.get('content-type');
  if (contentType && !contentType.includes('multipart/form-data')) {
    headers['Content-Type'] = contentType;
  }

  // 3. Add API key and auth headers
  headers['x-api-key'] = API_KEY;
  const userToken = request.headers.get('x-user-token');
  if (userToken) {
    headers['x-user-token'] = userToken;
  }

  // 4. Handle request body
  let body: string | FormData | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    const contentType = request.headers.get('content-type');
    if (contentType && contentType.includes('multipart/form-data')) {
      body = await request.formData(); // Pass FormData directly
    } else {
      body = await request.text(); // Handle JSON/text
    }
  }

  // 5. Forward to backend
  const response = await fetch(url, { method, headers, body });
  
  // 6. Return response
  return NextResponse.json(await response.json(), { status: response.status });
}
```

**Key Features**:
- FormData preservation
- Authentication forwarding
- API key injection
- Error handling

### 4. Backend Body Parser Configuration

**Location**: `project/src/core/main.ts`

```typescript
// Configure body parser limits for file uploads
app.use(json({ limit: '50mb' }));
app.use(urlencoded({ extended: true, limit: '50mb' }));
```

**Purpose**: Increase default 100KB limit to 50MB for file uploads

### 5. Backend Controller Processing

**Location**: `project/src/website-builder/modules/website-builder/website-builder.controller.ts`

```typescript
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
async uploadWebsite(
  @UploadedFiles() files: any[],
  @Body() body: { name: string; description?: string },
  @CurrentUser() user: any,
) {
  // 1. Log request details
  this.logger.log(`🚀 Upload request received from admin ID: ${user.id} (${user.email})`);
  this.logger.log(`📁 Files received: ${files?.length || 0} files`);
  
  // 2. Validate input
  if (!files || files.length === 0) {
    throw new BadRequestException('No files uploaded');
  }
  if (!body.name) {
    throw new BadRequestException('Website name is required');
  }

  // 3. Process files
  files.forEach((file, index) => {
    this.logger.log(`📄 File ${index + 1}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
  });

  // 4. Call service
  const result = await this.websiteBuilderService.uploadWebsite(
    files, 
    body.name, 
    user.id, 
    body.description
  );
  
  this.logger.log(`✅ Upload completed successfully. Website ID: ${result.website.id}`);
  return result;
}
```

**Key Features**:
- File interceptor for multipart handling
- Authentication validation
- Input validation
- Extensive logging

### 6. Backend Service Processing

**Location**: `project/src/website-builder/modules/website-builder/website-builder.service.ts`

```typescript
async uploadWebsite(files: UploadedFile[], name: string, adminId: number, description?: string) {
  // 1. Check for existing website name
  const existingWebsite = await this.prisma.website.findUnique({ where: { name } });
  if (existingWebsite) {
    throw new BadRequestException('Website name already exists');
  }

  // 2. Process uploaded files
  let processedFiles = [];
  for (const file of files) {
    if (file.mimetype.includes('zip') || file.originalname.endsWith('.zip')) {
      // Extract ZIP files
      const zipFiles = await this.extractZipFile(file.buffer);
      processedFiles = processedFiles.concat(zipFiles);
    } else {
      // Process individual files
      processedFiles.push({
        name: file.originalname,
        content: file.buffer.toString('utf8'),
        type: this.getFileType(file.originalname),
        size: file.size,
      });
    }
  }

  // 3. Detect website type
  const websiteType = this.detectWebsiteType(processedFiles);
  const structure = this.analyzeStructure(processedFiles);

  // 4. Save to database
  const website = await this.prisma.website.create({
    data: {
      name,
      description,
      type: websiteType,
      structure,
      files: processedFiles,
      createdByAdminId: adminId,
    },
  });

  return { success: true, website };
}
```

**Key Features**:
- ZIP file extraction
- File type detection
- Website type detection
- Database storage
- Comprehensive logging

## Preview System Flow

### 1. Preview Page Access

**Location**: `website-builder/app/preview/[id]/page.tsx`

```typescript
export default function PreviewPage() {
  const params = useParams();
  const websiteId = params.id as string;
  
  const [website, setWebsite] = useState<Website | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadWebsite = async () => {
      // 1. Load website from API
      const websiteData = await api.websiteBuilder.getWebsite(websiteId);
      setWebsite(websiteData);
      
      // 2. Create preview URL
      if (websiteData.files && websiteData.files.length > 0) {
        const indexFile = websiteData.files.find(f => 
          f.name === 'index.html' || f.name === 'index.htm'
        );
        
        if (indexFile) {
          // Create blob URL for HTML content
          const blob = new Blob([indexFile.content], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      }
    };

    if (websiteId) {
      loadWebsite();
    }
  }, [websiteId]);
}
```

### 2. Editor Preview Integration

**Location**: `website-builder/app/editor/[name]/page.tsx`

```typescript
export default function EditorPage() {
  // ... state management ...

  return (
    <EditorInterface
      websiteName={website.name}
      files={files}
      onSave={handleSave}
      onExport={handleExport}
      previewUrl={`/preview/${websiteId}`} // Link to preview page
    />
  );
}
```

## Database Schema

### Website Table
```sql
model Website {
  id                String   @id @default(cuid())
  name              String   @unique
  description       String?
  type              String   // 'static', 'vite', 'react', 'nextjs'
  structure         Json     // Parsed project structure
  files             Json     // Array of file objects with content
  status            String   @default("active")
  createdByAdminId  Int
  createdByAdmin    AdminUser @relation(fields: [createdByAdminId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  changeHistory     WebsiteChange[]
}
```

### File Object Structure
```typescript
interface WebsiteFile {
  name: string;        // File path/name
  content: string;     // File content as string
  type: string;        // File type (html, css, js, etc.)
  size: number;        // File size in bytes
}
```

## Authentication Flow

### 1. Token Management
- **Frontend**: Stores admin JWT tokens in cookies
- **API Client**: Automatically includes `x-user-token` header
- **Proxy**: Forwards authentication headers to backend
- **Backend**: Validates JWT and extracts user information

### 2. Admin Guard
```typescript
@UseGuards(AdminGuard)
export class WebsiteBuilderController {
  // Only admin users can access website builder endpoints
}
```

## Error Handling

### 1. Frontend Errors
- File validation errors
- Network errors
- API response errors
- Authentication errors

### 2. Backend Errors
- File size limits
- Invalid file types
- Database errors
- Authentication failures

### 3. Logging Strategy
- **Frontend**: Console logging with log levels
- **Backend**: Structured logging with emojis for readability
- **Proxy**: Error logging for debugging

## File Type Support

### Supported Formats
- **HTML**: `.html`, `.htm`
- **CSS**: `.css`, `.scss`, `.sass`
- **JavaScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **JSON**: `.json`
- **Text**: `.txt`, `.md`
- **ZIP**: `.zip` (extracted automatically)

### File Type Detection
```typescript
private getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const typeMap = {
    'html': 'html', 'htm': 'html',
    'css': 'css', 'scss': 'scss', 'sass': 'sass',
    'js': 'javascript', 'ts': 'typescript',
    'jsx': 'jsx', 'tsx': 'tsx',
    'json': 'json',
    'txt': 'text', 'md': 'markdown'
  };
  return typeMap[ext] || 'text';
}
```

## Website Type Detection

### Detection Logic
1. **Vite**: Presence of `vite.config.js` or `vite.config.ts`
2. **React**: `package.json` with React dependencies
3. **Next.js**: Presence of `next.config.js` or `next.config.ts`
4. **Static**: Default fallback

### Structure Analysis
```typescript
interface WebsiteStructure {
  totalFiles: number;
  fileTypes: Record<string, number>;
  hasIndex: boolean;
  hasPackageJson: boolean;
  hasConfig: boolean;
  entryPoints: string[];
  packageInfo?: {
    name: string;
    version: string;
    scripts: Record<string, string>;
  };
}
```

## Performance Considerations

### 1. File Size Limits
- **Backend**: 50MB limit for uploads
- **Frontend**: Browser-dependent limits
- **Database**: JSON field size limits

### 2. Memory Management
- **ZIP Extraction**: Stream processing for large files
- **Blob URLs**: Proper cleanup in preview system
- **File Content**: UTF-8 encoding for text files

### 3. Caching
- **Preview URLs**: Blob URLs for instant preview
- **File Content**: Cached in database
- **Structure Analysis**: Computed once per upload

## Troubleshooting Guide

### Common Issues

#### 1. "PayloadTooLargeError"
**Cause**: File exceeds body parser limit
**Solution**: Increase limit in `main.ts` (already set to 50MB)

#### 2. "No user found in JWT"
**Cause**: Authentication token not properly forwarded
**Solution**: Check proxy route and API client headers

#### 3. "No files uploaded"
**Cause**: FormData not properly constructed
**Solution**: Verify frontend FormData creation

#### 4. "Website name already exists"
**Cause**: Duplicate website name
**Solution**: Generate unique names or check existing websites

### Debug Steps

1. **Check Frontend Logs**: Browser console for upload process
2. **Check Backend Logs**: Docker logs for API processing
3. **Verify Authentication**: Check JWT token presence
4. **Test File Upload**: Try with smaller files first
5. **Check Database**: Verify website creation

### Log Analysis

#### Frontend Logs
```
🚀 Starting upload process...
📁 Files to upload: 3 files
📄 File 1: index.html (1024 bytes, text/html)
🌐 Calling website builder API...
📡 API response received: {success: true, website: {...}}
✅ Upload successful! Website ID: abc123
```

#### Backend Logs
```
🚀 Upload request received from admin ID: 1 (admin@loctelli.com)
📁 Files received: 3 files
📄 File 1: index.html (1024 bytes, text/html)
🔧 Starting website upload process for admin ID: 1
📦 Starting ZIP file extraction...
✅ Website created successfully with ID: abc123
```

## Security Considerations

### 1. File Validation
- File type restrictions
- Size limits
- Content validation

### 2. Authentication
- JWT token validation
- Admin-only access
- Session management

### 3. Input Sanitization
- File name sanitization
- Content validation
- SQL injection prevention

### 4. CORS Configuration
- Proper origin settings
- Credential handling
- Method restrictions

## Future Enhancements

### 1. File Processing
- Binary file support
- Image optimization
- Asset compression

### 2. Preview System
- Live reload
- Multiple file preview
- Mobile preview

### 3. Performance
- Streaming uploads
- Progressive loading
- CDN integration

### 4. Security
- File scanning
- Content validation
- Rate limiting 