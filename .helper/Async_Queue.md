# Website Builder Issues & Asynchronous Queue Solution

## 🚨 **Current Problems Identified**

### **1. Synchronous API Request Issues**
- **Request Timeout**: The entire build process (npm install, TypeScript checking, Vite startup) happens in a single HTTP request
- **User Experience**: Users wait for 30-60 seconds with no feedback until the entire process completes
- **Resource Blocking**: API workers are blocked during long-running build processes
- **Error Handling**: If the request times out, users lose all progress and have to start over

### **2. Build Process Bottlenecks**
- **npm install**: Takes 10-15 seconds for typical React projects
- **TypeScript checking**: Can take 5-10 seconds depending on project size
- **Vite server startup**: Takes 5-10 seconds to fully initialize
- **Total time**: 20-35 seconds minimum, often longer for complex projects

### **3. Scalability Issues**
- **Concurrent builds limited**: Only 10 concurrent builds possible
- **Resource contention**: Multiple builds competing for CPU/memory
- **No prioritization**: All builds treated equally regardless of size/complexity

## 🎯 **Solution: Asynchronous Queue-Based Build System**

### **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Build Queue   │
│                 │    │                 │    │                 │
│ Upload → Status │───▶│ Accept Upload   │───▶│ Process Builds  │
│ Poll Progress   │    │ Queue Build     │    │ Background      │
│ Show Results    │    │ Return Job ID   │    │ Workers         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Database      │    │   Build Workers │
                       │                 │    │                 │
                       │ Store Job Info  │    │ npm install     │
                       │ Track Progress  │    │ TypeScript      │
                       │ Cache Results   │    │ Vite Server     │
                       └─────────────────┘    └─────────────────┘
```

## 📋 **Implementation Plan**

### **Phase 1: Queue Infrastructure**

#### **1.1 Job Queue System**
```typescript
// Job Queue Interface
interface BuildJob {
  id: string;
  websiteId: string;
  status: 'pending' | 'queued' | 'building' | 'running' | 'failed' | 'completed';
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number; // 0-100
  currentStep: string;
  logs: string[];
  error?: string;
  files: WebsiteFile[];
  allocatedPort?: number;
  previewUrl?: string;
}

// Queue Service
@Injectable()
export class BuildQueueService {
  private queue: BuildJob[] = [];
  private processing = new Set<string>();
  private maxConcurrent = 5;
  
  async enqueueJob(websiteId: string, files: WebsiteFile[]): Promise<string>
  async dequeueJob(): Promise<BuildJob | null>
  async updateJobProgress(jobId: string, progress: number, step: string): Promise<void>
  async completeJob(jobId: string, previewUrl: string): Promise<void>
  async failJob(jobId: string, error: string): Promise<void>
}
```

#### **1.2 Database Schema Updates**
```sql
-- Build Jobs Table
CREATE TABLE build_jobs (
  id VARCHAR(255) PRIMARY KEY,
  website_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  current_step VARCHAR(255),
  logs JSON,
  error TEXT,
  allocated_port INTEGER,
  preview_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id)
);

-- Update websites table
ALTER TABLE websites ADD COLUMN build_job_id VARCHAR(255);
ALTER TABLE websites ADD FOREIGN KEY (build_job_id) REFERENCES build_jobs(id);
```

### **Phase 2: API Endpoint Changes**

#### **2.1 Upload Endpoint (Modified)**
```typescript
@Post('upload')
async uploadWebsite(
  @UploadedFiles() files: Express.Multer.File[],
  @Body() body: UploadWebsiteDto,
  @CurrentAdmin() admin: AdminUser
) {
  // 1. Extract and validate files
  const extractedFiles = await this.extractFiles(files);
  
  // 2. Create website record
  const website = await this.createWebsiteRecord(extractedFiles, admin.id);
  
  // 3. Queue build job (don't wait for completion)
  const jobId = await this.buildQueueService.enqueueJob(
    website.id, 
    extractedFiles
  );
  
  // 4. Return immediately with job ID
  return {
    success: true,
    website: {
      id: website.id,
      name: website.name,
      type: website.type,
      buildJobId: jobId
    },
    message: 'Website uploaded successfully. Build process started in background.'
  };
}
```

#### **2.2 New Status Endpoint**
```typescript
@Get(':id/build-status')
async getBuildStatus(@Param('id') websiteId: string) {
  const website = await this.getWebsite(websiteId);
  const job = await this.buildQueueService.getJob(website.buildJobId);
  
  return {
    websiteId,
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep,
    logs: job.logs.slice(-50), // Last 50 log entries
    previewUrl: job.previewUrl,
    error: job.error,
    estimatedTimeRemaining: this.calculateETA(job)
  };
}
```

### **Phase 3: Background Worker System**

#### **3.1 Build Worker Service**
```typescript
@Injectable()
export class BuildWorkerService {
  private workers: Map<string, BuildWorker> = new Map();
  
  async startWorker(jobId: string): Promise<void> {
    const worker = new BuildWorker(jobId, this.buildQueueService);
    this.workers.set(jobId, worker);
    await worker.start();
  }
  
  async stopWorker(jobId: string): Promise<void> {
    const worker = this.workers.get(jobId);
    if (worker) {
      await worker.stop();
      this.workers.delete(jobId);
    }
  }
}

class BuildWorker {
  constructor(
    private jobId: string,
    private queueService: BuildQueueService
  ) {}
  
  async start(): Promise<void> {
    try {
      // 1. Update status to building
      await this.queueService.updateJobProgress(this.jobId, 0, 'Starting build...');
      
      // 2. Extract files
      await this.queueService.updateJobProgress(this.jobId, 10, 'Extracting files...');
      await this.extractFiles();
      
      // 3. npm install
      await this.queueService.updateJobProgress(this.jobId, 30, 'Installing dependencies...');
      await this.runNpmInstall();
      
      // 4. TypeScript check
      await this.queueService.updateJobProgress(this.jobId, 60, 'Type checking...');
      await this.runTypeCheck();
      
      // 5. Start Vite server
      await this.queueService.updateJobProgress(this.jobId, 80, 'Starting development server...');
      const previewUrl = await this.startViteServer();
      
      // 6. Complete
      await this.queueService.updateJobProgress(this.jobId, 100, 'Build completed');
      await this.queueService.completeJob(this.jobId, previewUrl);
      
    } catch (error) {
      await this.queueService.failJob(this.jobId, error.message);
    }
  }
}
```

### **Phase 4: Frontend Updates**

#### **4.1 Upload Flow**
```typescript
const handleUpload = async (files: File[]) => {
  try {
    // 1. Upload files and get job ID
    const response = await api.websiteBuilder.uploadWebsite(files, name);
    
    // 2. Show build progress immediately
    setBuildJobId(response.website.buildJobId);
    setShowBuildProgress(true);
    
    // 3. Start polling for status
    startStatusPolling(response.website.buildJobId);
    
  } catch (error) {
    setError('Upload failed: ' + error.message);
  }
};
```

#### **4.2 Status Polling**
```typescript
const startStatusPolling = (jobId: string) => {
  const pollInterval = setInterval(async () => {
    try {
      const status = await api.websiteBuilder.getBuildStatus(jobId);
      
      setBuildProgress(status.progress);
      setCurrentStep(status.currentStep);
      setBuildLogs(status.logs);
      
      if (status.status === 'completed') {
        clearInterval(pollInterval);
        setPreviewUrl(status.previewUrl);
        setBuildComplete(true);
      } else if (status.status === 'failed') {
        clearInterval(pollInterval);
        setError(status.error);
      }
      
    } catch (error) {
      console.error('Status polling failed:', error);
    }
  }, 2000); // Poll every 2 seconds
  
  // Cleanup on unmount
  return () => clearInterval(pollInterval);
};
```

### **Phase 5: Advanced Features**

#### **5.1 Priority Queue**
```typescript
interface PriorityJob extends BuildJob {
  priority: number; // Higher number = higher priority
  estimatedDuration: number;
  userType: 'admin' | 'user';
  createdAt: Date;
}

// Priority calculation
function calculatePriority(job: PriorityJob): number {
  const basePriority = job.priority;
  const timeWaiting = Date.now() - job.createdAt.getTime();
  const timeMultiplier = Math.min(timeWaiting / 60000, 2); // Max 2x boost after 2 minutes
  
  return basePriority * timeMultiplier;
}
```

#### **5.2 Resource Management**
```typescript
@Injectable()
export class ResourceManager {
  private activeBuilds = new Map<string, BuildResources>();
  private maxMemory = 4 * 1024 * 1024 * 1024; // 4GB
  private maxCpu = 80; // 80% CPU usage
  
  async allocateResources(jobId: string): Promise<BuildResources> {
    // Check available resources
    const currentUsage = await this.getCurrentResourceUsage();
    
    if (currentUsage.memory > this.maxMemory * 0.9) {
      throw new Error('Insufficient memory for new build');
    }
    
    if (currentUsage.cpu > this.maxCpu) {
      throw new Error('CPU usage too high for new build');
    }
    
    const resources = {
      jobId,
      allocatedAt: new Date(),
      maxMemory: 512 * 1024 * 1024, // 512MB per build
      maxCpu: 25 // 25% CPU per build
    };
    
    this.activeBuilds.set(jobId, resources);
    return resources;
  }
}
```

#### **5.3 Build Caching**
```typescript
@Injectable()
export class BuildCacheService {
  async getCachedBuild(filesHash: string): Promise<CachedBuild | null> {
    const cached = await this.cache.get(`build:${filesHash}`);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }
    return null;
  }
  
  async cacheBuild(filesHash: string, buildResult: BuildResult): Promise<void> {
    await this.cache.set(`build:${filesHash}`, {
      ...buildResult,
      cachedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
  }
}
```

## 🚀 **Implementation Timeline**

### **Week 1: Foundation**
- [ ] Set up queue infrastructure (Redis/Bull or in-memory)
- [ ] Create BuildJob interface and database schema
- [ ] Implement basic queue service

### **Week 2: Core Functionality**
- [ ] Modify upload endpoint to queue jobs
- [ ] Create build worker service
- [ ] Implement status polling endpoint

### **Week 3: Frontend Integration**
- [ ] Update frontend to handle async uploads
- [ ] Implement status polling UI
- [ ] Add progress indicators and real-time logs

### **Week 4: Advanced Features**
- [ ] Add priority queue system
- [ ] Implement resource management
- [ ] Add build caching
- [ ] Performance optimization

## 📊 **Expected Benefits**

### **User Experience**
- **Immediate feedback**: Users get instant confirmation of upload
- **Real-time progress**: Live updates on build progress
- **No timeouts**: No more request timeout issues
- **Better error handling**: Detailed error messages and retry options

### **System Performance**
- **Scalability**: Handle hundreds of concurrent builds
- **Resource efficiency**: Better CPU/memory utilization
- **Reliability**: Failed builds don't affect other requests
- **Monitoring**: Better visibility into build processes

### **Developer Experience**
- **Debugging**: Easier to debug build issues
- **Monitoring**: Real-time build metrics and logs
- **Maintenance**: Easier to maintain and extend

## 🔧 **Technology Stack**

### **Queue Options**
1. **Bull Queue** (Redis-based) - Recommended for production
2. **In-memory queue** - Good for development/testing
3. **Database-based queue** - Simple but less performant

### **Worker Process Options**
1. **Child processes** - Current approach, good for isolation
2. **Worker threads** - Better for CPU-intensive tasks
3. **Docker containers** - Best for complete isolation

### **Monitoring Options**
1. **Built-in logging** - Current approach
2. **Prometheus/Grafana** - Production monitoring
3. **Application Insights** - Cloud monitoring

This asynchronous approach will transform the website builder from a blocking, timeout-prone system into a scalable, user-friendly platform that can handle high loads efficiently.