# Storage Migration Plan: Database → Cloudflare R2

## 🚨 **Current Problem Analysis**

### **Current Storage Issues**
- **Database Bloat**: ZIP files and HTML content stored as JSON in PostgreSQL
- **Performance Impact**: Large database size, slow queries, expensive backups
- **Scalability Limits**: Database storage doesn't scale well for file storage
- **Memory Issues**: Loading large files into memory during processing
- **Backup Problems**: Database backups become huge and slow

### **Current Database Schema**
```sql
-- Current problematic storage
model Website {
  id          String   @id @default(cuid())
  name        String   @unique
  type        String   // 'static', 'vite', 'react', 'nextjs'
  structure   Json     // Project structure analysis
  files       Json     // ❌ PROBLEM: File contents stored as JSON
  buildStatus String?  @default("pending")
  previewUrl  String?
  processId   String?
  buildOutput Json?    // ❌ PROBLEM: Build logs stored as JSON
  portNumber  Int?
  lastBuildAt DateTime?
  buildDuration Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdByAdminId Int
  createdByAdmin  AdminUser @relation(fields: [createdByAdminId], references: [id])
}
```

## 🎯 **Migration Goals**

### **Primary Objectives**
1. **Move file storage to R2**: ZIP files, HTML, CSS, JS files stored in R2
2. **Keep metadata in database**: File paths, sizes, types, structure analysis
3. **Maintain functionality**: All existing features continue to work
4. **Zero downtime**: Gradual migration with rollback capability
5. **Performance improvement**: Faster uploads, smaller database, better scalability

### **Expected Benefits**
- **Database size reduction**: 80-90% smaller database
- **Better performance**: Faster queries, smaller backups
- **Scalability**: Unlimited file storage in R2
- **Cost efficiency**: R2 is cheaper than database storage
- **CDN benefits**: Global edge caching for static files

## 📋 **Migration Strategy**

### **Phase 1: R2 Infrastructure Setup**

#### **1.1 Environment Configuration**
```bash
# Add to .env files
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=loctelli-website-builder
R2_PUBLIC_URL=https://your-public-r2-domain.com
R2_ENABLED=true
```

#### **1.2 R2 Bucket Structure**
```
loctelli-website-builder/
├── websites/
│   ├── {website-id}/
│   │   ├── original/
│   │   │   └── {original-zip-file}
│   │   ├── extracted/
│   │   │   ├── src/
│   │   │   ├── public/
│   │   │   ├── package.json
│   │   │   └── ...
│   │   ├── builds/
│   │   │   ├── latest/
│   │   │   └── {build-id}/
│   │   └── previews/
│   │       └── {preview-files}
│   └── ...
├── temp/
│   └── {temp-uploads}
└── cache/
    └── {cached-builds}
```

#### **1.3 Database Schema Updates**
```sql
-- New schema with R2 file references
model Website {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  type        String   // 'static', 'vite', 'react', 'nextjs'
  structure   Json     // Project structure analysis (metadata only)
  
  -- R2 File References (instead of file content)
  originalZipUrl String?  // R2 URL to original ZIP file
  extractedFiles Json?    // File metadata: [{name, path, size, type, r2Key}]
  
  -- Build-related fields
  buildStatus String?  @default("pending")
  previewUrl  String?
  processId   String?
  buildOutput Json?    // Build logs (keep in DB for now)
  portNumber  Int?
  lastBuildAt DateTime?
  buildDuration Int?
  
  -- Storage metadata
  storageProvider String @default("r2") // 'database', 'r2', 'hybrid'
  totalFileSize   Int?   // Total size of all files in bytes
  fileCount       Int?   // Number of files
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdByAdminId Int
  createdByAdmin  AdminUser @relation(fields: [createdByAdminId], references: [id])
}

-- New table for file metadata
model WebsiteFile {
  id          String   @id @default(cuid())
  websiteId   String
  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  name        String   // Original filename
  path        String   // File path within project
  r2Key       String   // R2 storage key
  r2Url       String   // Public R2 URL
  size        Int      // File size in bytes
  type        String   // MIME type
  hash        String?  // File hash for caching
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([websiteId, path])
}
```

### **Phase 2: R2 Storage Service Implementation**

#### **2.1 R2 Storage Service**
```typescript
// lib/storage/r2-storage.service.ts
@Injectable()
export class R2StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('R2_BUCKET_NAME');
    this.publicUrl = this.configService.get('R2_PUBLIC_URL');
    
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.configService.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('R2_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadWebsiteZip(websiteId: string, zipBuffer: Buffer): Promise<string> {
    const key = `websites/${websiteId}/original/${Date.now()}.zip`;
    await this.uploadFile(key, zipBuffer, 'application/zip');
    return this.getPublicUrl(key);
  }

  async uploadExtractedFile(websiteId: string, filePath: string, content: Buffer, mimeType: string): Promise<string> {
    const key = `websites/${websiteId}/extracted/${filePath}`;
    await this.uploadFile(key, content, mimeType);
    return this.getPublicUrl(key);
  }

  async uploadBuildFiles(websiteId: string, buildId: string, files: Map<string, Buffer>): Promise<string[]> {
    const urls: string[] = [];
    for (const [filePath, content] of files) {
      const key = `websites/${websiteId}/builds/${buildId}/${filePath}`;
      await this.uploadFile(key, content, this.getMimeType(filePath));
      urls.push(this.getPublicUrl(key));
    }
    return urls;
  }

  async getFileContent(r2Key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: r2Key,
    });
    
    const response = await this.s3Client.send(command);
    return Buffer.from(await response.Body!.transformToByteArray());
  }

  async deleteWebsiteFiles(websiteId: string): Promise<void> {
    // Delete all files for a website
    const prefix = `websites/${websiteId}/`;
    await this.deleteFilesWithPrefix(prefix);
  }

  private async uploadFile(key: string, content: Buffer, contentType: string): Promise<void> {
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
      },
    });
    
    await upload.done();
  }

  private getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
```

#### **2.2 File Processing Service**
```typescript
// lib/storage/file-processing.service.ts
@Injectable()
export class FileProcessingService {
  constructor(
    private r2Storage: R2StorageService,
    private prisma: PrismaService
  ) {}

  async processWebsiteUpload(websiteId: string, zipBuffer: Buffer): Promise<WebsiteFile[]> {
    // 1. Upload original ZIP
    const zipUrl = await this.r2Storage.uploadWebsiteZip(websiteId, zipBuffer);
    
    // 2. Extract ZIP and upload individual files
    const extractedFiles = await this.extractAndUploadFiles(websiteId, zipBuffer);
    
    // 3. Create file metadata records
    const fileRecords = await this.createFileRecords(websiteId, extractedFiles);
    
    return fileRecords;
  }

  async getWebsiteFiles(websiteId: string): Promise<WebsiteFile[]> {
    return this.prisma.websiteFile.findMany({
      where: { websiteId },
      orderBy: { path: 'asc' }
    });
  }

  async getFileContent(websiteId: string, filePath: string): Promise<Buffer> {
    const fileRecord = await this.prisma.websiteFile.findUnique({
      where: { websiteId_path: { websiteId, path: filePath } }
    });
    
    if (!fileRecord) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return this.r2Storage.getFileContent(fileRecord.r2Key);
  }

  private async extractAndUploadFiles(websiteId: string, zipBuffer: Buffer): Promise<Array<{
    path: string;
    content: Buffer;
    size: number;
    type: string;
  }>> {
    const extractedFiles: Array<{
      path: string;
      content: Buffer;
      size: number;
      type: string;
    }> = [];

    // Extract ZIP and process each file
    const zip = new JSZip();
    await zip.loadAsync(zipBuffer);

    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('nodebuffer');
        const mimeType = this.getMimeType(filePath);
        
        // Upload to R2
        await this.r2Storage.uploadExtractedFile(websiteId, filePath, content, mimeType);
        
        extractedFiles.push({
          path: filePath,
          content,
          size: content.length,
          type: mimeType
        });
      }
    }

    return extractedFiles;
  }

  private async createFileRecords(websiteId: string, files: Array<{
    path: string;
    content: Buffer;
    size: number;
    type: string;
  }>): Promise<WebsiteFile[]> {
    const fileRecords = files.map(file => ({
      websiteId,
      name: path.basename(file.path),
      path: file.path,
      r2Key: `websites/${websiteId}/extracted/${file.path}`,
      r2Url: this.r2Storage.getPublicUrl(`websites/${websiteId}/extracted/${file.path}`),
      size: file.size,
      type: file.type,
      hash: this.calculateHash(file.content)
    }));

    return this.prisma.websiteFile.createMany({
      data: fileRecords
    });
  }
}
```

### **Phase 3: Service Layer Updates**

#### **3.1 Updated Website Builder Service**
```typescript
// Updated website-builder.service.ts
@Injectable()
export class WebsiteBuilderService {
  constructor(
    private prisma: PrismaService,
    private fileProcessing: FileProcessingService,
    private r2Storage: R2StorageService,
    private buildService: BuildService,
    private securityService: SecurityService
  ) {}

  async uploadWebsite(files: UploadedFile[], name: string, adminId: number, description?: string) {
    // 1. Process uploaded files (ZIP or individual files)
    const zipBuffer = await this.createZipFromFiles(files);
    
    // 2. Create website record
    const website = await this.prisma.website.create({
      data: {
        name,
        description,
        type: 'pending', // Will be determined after processing
        structure: {},
        originalZipUrl: null, // Will be set after R2 upload
        extractedFiles: null,
        storageProvider: 'r2',
        createdByAdmin: { connect: { id: adminId } }
      }
    });

    try {
      // 3. Process and upload files to R2
      const fileRecords = await this.fileProcessing.processWebsiteUpload(website.id, zipBuffer);
      
      // 4. Update website with file metadata
      const updatedWebsite = await this.prisma.website.update({
        where: { id: website.id },
        data: {
          type: this.detectWebsiteType(fileRecords),
          structure: this.analyzeStructure(fileRecords),
          fileCount: fileRecords.length,
          totalFileSize: fileRecords.reduce((sum, file) => sum + file.size, 0),
          originalZipUrl: await this.r2Storage.uploadWebsiteZip(website.id, zipBuffer)
        }
      });

      // 5. Handle build process for React/Vite projects
      if (this.shouldBuildProject(updatedWebsite.type)) {
        await this.startBuildProcess(updatedWebsite.id, fileRecords);
      }

      return {
        success: true,
        website: updatedWebsite,
        fileCount: fileRecords.length
      };

    } catch (error) {
      // Cleanup on failure
      await this.r2Storage.deleteWebsiteFiles(website.id);
      await this.prisma.website.delete({ where: { id: website.id } });
      throw error;
    }
  }

  async getWebsiteFiles(websiteId: string): Promise<WebsiteFile[]> {
    return this.fileProcessing.getWebsiteFiles(websiteId);
  }

  async getFileContent(websiteId: string, filePath: string): Promise<Buffer> {
    return this.fileProcessing.getFileContent(websiteId, filePath);
  }
}
```

### **Phase 4: Migration Scripts**

#### **4.1 Database Migration Script**
```typescript
// scripts/migrate-to-r2.ts
import { PrismaClient } from '@prisma/client';
import { R2StorageService } from '../lib/storage/r2-storage.service';

const prisma = new PrismaClient();
const r2Storage = new R2StorageService();

async function migrateWebsiteToR2(websiteId: string) {
  console.log(`Migrating website ${websiteId} to R2...`);
  
  const website = await prisma.website.findUnique({
    where: { id: websiteId }
  });

  if (!website || website.storageProvider === 'r2') {
    console.log(`Website ${websiteId} already migrated or not found`);
    return;
  }

  try {
    // 1. Extract files from database JSON
    const files = website.files as any[];
    if (!Array.isArray(files)) {
      console.log(`Website ${websiteId} has no files to migrate`);
      return;
    }

    // 2. Create ZIP from files
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.name, file.content);
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 3. Upload to R2
    const fileRecords = await fileProcessing.processWebsiteUpload(websiteId, zipBuffer);

    // 4. Update database
    await prisma.website.update({
      where: { id: websiteId },
      data: {
        storageProvider: 'r2',
        extractedFiles: null, // Clear old JSON data
        fileCount: fileRecords.length,
        totalFileSize: fileRecords.reduce((sum, file) => sum + file.size, 0)
      }
    });

    console.log(`Successfully migrated website ${websiteId}`);
    
  } catch (error) {
    console.error(`Failed to migrate website ${websiteId}:`, error);
    throw error;
  }
}

async function migrateAllWebsites() {
  const websites = await prisma.website.findMany({
    where: { storageProvider: { not: 'r2' } }
  });

  console.log(`Found ${websites.length} websites to migrate`);

  for (const website of websites) {
    try {
      await migrateWebsiteToR2(website.id);
      // Add delay to avoid overwhelming R2
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Migration failed for website ${website.id}:`, error);
    }
  }
}

// Run migration
migrateAllWebsites()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

#### **4.2 Rollback Script**
```typescript
// scripts/rollback-from-r2.ts
async function rollbackWebsiteFromR2(websiteId: string) {
  console.log(`Rolling back website ${websiteId} from R2...`);
  
  // 1. Get files from R2
  const fileRecords = await prisma.websiteFile.findMany({
    where: { websiteId }
  });

  // 2. Download all files
  const files = [];
  for (const fileRecord of fileRecords) {
    const content = await r2Storage.getFileContent(fileRecord.r2Key);
    files.push({
      name: fileRecord.name,
      content: content.toString('utf8'),
      type: fileRecord.type,
      size: fileRecord.size
    });
  }

  // 3. Update database to use old format
  await prisma.website.update({
    where: { id: websiteId },
    data: {
      storageProvider: 'database',
      files: files,
      extractedFiles: null,
      fileCount: null,
      totalFileSize: null
    }
  });

  // 4. Delete R2 files
  await r2Storage.deleteWebsiteFiles(websiteId);

  console.log(`Successfully rolled back website ${websiteId}`);
}
```

### **Phase 5: Frontend Updates**

#### **5.1 Updated API Client**
```typescript
// website-builder/lib/api/website-builder.ts
export interface Website {
  id: string;
  name: string;
  description?: string;
  type: string;
  storageProvider: 'database' | 'r2';
  fileCount?: number;
  totalFileSize?: number;
  originalZipUrl?: string;
  // ... other fields
}

export interface WebsiteFile {
  id: string;
  name: string;
  path: string;
  r2Url: string;
  size: number;
  type: string;
}

export const websiteBuilderApi = {
  // ... existing methods

  async getWebsiteFiles(websiteId: string): Promise<WebsiteFile[]> {
    const response = await apiClient.get(`/website-builder/${websiteId}/files`);
    return response.data;
  },

  async downloadFile(websiteId: string, filePath: string): Promise<Blob> {
    const response = await apiClient.get(
      `/website-builder/${websiteId}/files/${encodeURIComponent(filePath)}`,
      { responseType: 'blob' }
    );
    return response.data;
  }
};
```

#### **5.2 File Browser Component**
```typescript
// website-builder/components/FileBrowser.tsx
export function FileBrowser({ websiteId }: { websiteId: string }) {
  const [files, setFiles] = useState<WebsiteFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [websiteId]);

  const loadFiles = async () => {
    try {
      const websiteFiles = await websiteBuilderApi.getWebsiteFiles(websiteId);
      setFiles(websiteFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (file: WebsiteFile) => {
    try {
      const blob = await websiteBuilderApi.downloadFile(websiteId, file.path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  return (
    <div className="file-browser">
      <h3>Project Files</h3>
      {loading ? (
        <div>Loading files...</div>
      ) : (
        <div className="file-list">
          {files.map(file => (
            <div key={file.id} className="file-item">
              <span className="file-name">{file.path}</span>
              <span className="file-size">{formatFileSize(file.size)}</span>
              <button onClick={() => downloadFile(file)}>Download</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🚀 **Implementation Timeline**

### **Week 1: Infrastructure Setup**
- [ ] Set up Cloudflare R2 account and bucket
- [ ] Configure environment variables
- [ ] Install AWS SDK dependencies
- [ ] Create R2 storage service

### **Week 2: Core Implementation**
- [ ] Implement file processing service
- [ ] Update website builder service
- [ ] Create database migration scripts
- [ ] Add new API endpoints

### **Week 3: Testing & Migration**
- [ ] Test with new uploads
- [ ] Run migration script on test data
- [ ] Verify all functionality works
- [ ] Test rollback procedures

### **Week 4: Production Deployment**
- [ ] Deploy to staging environment
- [ ] Run full migration
- [ ] Monitor performance and errors
- [ ] Deploy to production

## 📊 **Expected Results**

### **Database Performance**
- **Size reduction**: 80-90% smaller database
- **Query speed**: 3-5x faster queries
- **Backup time**: 70% faster backups
- **Storage cost**: 60% reduction in database storage costs

### **System Performance**
- **Upload speed**: Faster uploads (no database writes)
- **Memory usage**: Lower memory usage
- **Scalability**: Unlimited file storage
- **CDN benefits**: Global edge caching

### **User Experience**
- **Faster loading**: Quicker website previews
- **Better reliability**: No database timeouts
- **File management**: Better file browsing and download
- **Storage transparency**: Clear storage usage metrics

## 🔧 **Monitoring & Maintenance**

### **Storage Metrics**
```typescript
// Monitor R2 usage
interface StorageMetrics {
  totalWebsites: number;
  totalFiles: number;
  totalSize: number;
  averageFileSize: number;
  storageCost: number;
  bandwidthUsage: number;
}
```

### **Health Checks**
- Monitor R2 connectivity
- Track upload/download success rates
- Monitor storage costs
- Alert on storage limits

This migration will transform the website builder from a database-heavy system to a scalable, performant platform that can handle unlimited file storage efficiently. 