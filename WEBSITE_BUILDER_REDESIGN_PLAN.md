# Website Builder Upload System - Redesign Plan

## 📋 **Executive Summary**

After receiving feedback from three AI advisors, I've identified critical issues with the current website builder upload system design. The main problems are:

1. **Incomplete React/Vite Support**: The system doesn't actually run `npm install` and `npm run dev` commands
2. **Static File Focus**: Only handles static files, not dynamic React applications
3. **Missing Build Process**: No automated build and hosting capabilities
4. **Security Concerns**: No sandboxing for user-uploaded code execution
5. **Resource Management**: No proper process management or cleanup

## 🎯 **Redesign Goals**

Create a system that:
- ✅ Automatically detects React/Vite projects from ZIP uploads
- ✅ Runs `npm install` and `npm run type` commands safely
- ✅ Hosts the application on a unique URL with live preview
- ✅ Provides real-time interaction with the running application
- ✅ Manages resources and cleanup automatically
- ✅ Maintains security through proper sandboxing

## 🏗️ **New System Architecture**

### **Core Components**

1. **Upload Processor** - Handles ZIP extraction and project detection
2. **Build Engine** - Manages npm install, type checking, and build processes
3. **Process Manager** - Handles Vite dev servers and static file serving
4. **Port Manager** - Allocates unique ports for each project
5. **Security Sandbox** - Isolates user code execution
6. **Preview Proxy** - Routes requests to running applications
7. **Resource Cleanup** - Manages process lifecycle and cleanup

### **Technology Stack**

- **Backend**: NestJS with child_process for build management
- **Process Management**: PM2 or Docker containers for isolation
- **Port Management**: Dynamic port allocation (4000-4999 range)
- **Security**: Docker containers or chroot for sandboxing
- **Database**: Extended schema for build status and preview URLs

## 📝 **Implementation Plan**

### **Phase 1: Core Infrastructure (Week 1)**

#### **1.1 Database Schema Updates**
```sql
-- Add build-related fields to Website table
ALTER TABLE Website ADD COLUMN build_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE Website ADD COLUMN preview_url TEXT;
ALTER TABLE Website ADD COLUMN process_id VARCHAR(50);
ALTER TABLE Website ADD COLUMN build_output JSON;
ALTER TABLE Website ADD COLUMN port_number INTEGER;
ALTER TABLE Website ADD COLUMN last_build_at TIMESTAMP;
ALTER TABLE Website ADD COLUMN build_duration INTEGER; -- in seconds
```

#### **1.2 Build Service Implementation**
```typescript
// New service: project/src/website-builder/modules/website-builder/build.service.ts
export class BuildService {
  private buildProcesses = new Map<string, BuildProcess>();
  private usedPorts = new Set<number>();
  
  async buildReactProject(websiteId: string, files: WebsiteFile[]): Promise<string> {
    // 1. Create isolated build directory
    // 2. Extract files to directory
    // 3. Run npm install
    // 4. Run npm run type (if TypeScript detected)
    // 5. Start Vite dev server
    // 6. Return preview URL
  }
}
```

#### **1.3 Process Manager Implementation**
```typescript
// New service: project/src/website-builder/modules/website-builder/process-manager.service.ts
export class ProcessManagerService {
  async startViteServer(projectDir: string, port: number): Promise<ChildProcess> {
    // Start npm run dev with proper port configuration
  }
  
  async cleanupProcess(processId: string): Promise<void> {
    // Kill process and clean up resources
  }
}
```

### **Phase 2: Security & Sandboxing (Week 2)**

#### **2.1 Docker Container Implementation**
```dockerfile
# New Dockerfile for build containers
FROM node:18-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

#### **2.2 Container Management Service**
```typescript
// New service: project/src/website-builder/modules/website-builder/container.service.ts
export class ContainerService {
  async createBuildContainer(websiteId: string, files: WebsiteFile[]): Promise<string> {
    // 1. Create Docker container with project files
    // 2. Run npm install and build
    // 3. Start Vite server
    // 4. Return container ID and preview URL
  }
  
  async stopContainer(containerId: string): Promise<void> {
    // Stop and remove container
  }
}
```

#### **2.3 Security Validations**
```typescript
// Security checks for uploaded projects
export class SecurityService {
  validatePackageJson(packageJson: any): boolean {
    // Check for malicious scripts
    // Validate dependencies
    // Ensure no dangerous commands
  }
  
  sanitizeProjectFiles(files: WebsiteFile[]): WebsiteFile[] {
    // Remove potentially dangerous files
    // Sanitize file names
    // Validate file contents
  }
}
```

### **Phase 3: Build Process Integration (Week 3)**

#### **3.1 Enhanced Upload Service**
```typescript
// Updated: project/src/website-builder/modules/website-builder/website-builder.service.ts
export class WebsiteBuilderService {
  async uploadWebsite(files: UploadedFile[], name: string, adminId: number, description?: string) {
    // 1. Extract and validate files
    // 2. Detect project type (React/Vite, static, etc.)
    // 3. For React/Vite projects:
    //    - Create build container
    //    - Run npm install
    //    - Run npm run type
    //    - Start Vite dev server
    //    - Store preview URL
    // 4. For static projects:
    //    - Use existing static file handling
    // 5. Save to database with build status
  }
}
```

#### **3.2 Build Status Monitoring**
```typescript
// New endpoints for build monitoring
@Controller('website-builder')
export class WebsiteBuilderController {
  @Get('build-status/:id')
  async getBuildStatus(@Param('id') websiteId: string) {
    return this.buildService.getBuildStatus(websiteId);
  }
  
  @Post('stop/:id')
  async stopWebsite(@Param('id') websiteId: string) {
    return this.buildService.stopWebsite(websiteId);
  }
}
```

### **Phase 4: Frontend Integration (Week 4)**

#### **4.1 Enhanced Upload Interface**
```typescript
// Updated: website-builder/app/page.tsx
export default function UploadPage() {
  const [buildStatus, setBuildStatus] = useState<'pending' | 'building' | 'running' | 'failed'>('pending');
  const [buildProgress, setBuildProgress] = useState<string>('');
  
  const handleUpload = async () => {
    // 1. Upload files
    // 2. Show build progress
    // 3. Poll for build status
    // 4. Redirect to preview when ready
  };
}
```

#### **4.2 Build Progress Component**
```typescript
// New component: website-builder/components/build-progress.tsx
export function BuildProgress({ websiteId }: { websiteId: string }) {
  // Real-time build status display
  // Progress indicators for npm install, type check, server start
  // Error handling and retry options
}
```

#### **4.3 Enhanced Preview System**
```typescript
// Updated: website-builder/app/preview/[id]/page.tsx
export default function PreviewPage() {
  // 1. Check if website is a React/Vite project
  // 2. If yes, use previewUrl from database
  // 3. If no, use existing blob URL system
  // 4. Show loading state during build
  // 5. Handle build failures gracefully
}
```

### **Phase 5: Proxy & Routing (Week 5)**

#### **5.1 Enhanced Proxy Layer**
```typescript
// Updated: website-builder/app/api/proxy/[...path]/route.ts
async function handleRequest(request: NextRequest, pathSegments: string[]) {
  // 1. Check if request is for a preview URL
  // 2. Get website data and preview URL
  // 3. Forward request to running Vite server
  // 4. Handle CORS and authentication
  // 5. Return response from Vite server
}
```

#### **5.2 Port Management**
```typescript
// New service: project/src/website-builder/modules/website-builder/port-manager.service.ts
export class PortManagerService {
  private usedPorts = new Set<number>();
  private readonly PORT_RANGE = { start: 4000, end: 4999 };
  
  allocatePort(): number {
    // Find available port in range
  }
  
  releasePort(port: number): void {
    // Mark port as available
  }
}
```

### **Phase 6: Resource Management & Cleanup (Week 6)**

#### **6.1 Automatic Cleanup Service**
```typescript
// New service: project/src/website-builder/modules/website-builder/cleanup.service.ts
export class CleanupService {
  @Cron('0 */6 * * *') // Every 6 hours
  async cleanupInactiveWebsites() {
    // Find websites inactive for >24 hours
    // Stop containers and clean up resources
  }
  
  async cleanupWebsite(websiteId: string): Promise<void> {
    // Stop container/process
    // Remove build directory
    // Release port
    // Update database status
  }
}
```

#### **6.2 Health Monitoring**
```typescript
// New service: project/src/website-builder/modules/website-builder/health.service.ts
export class HealthService {
  async checkWebsiteHealth(websiteId: string): Promise<boolean> {
    // Check if Vite server is responding
    // Restart if necessary
  }
  
  async getSystemResources(): Promise<SystemResources> {
    // Monitor CPU, memory, disk usage
    // Alert if resources are low
  }
}
```

## 🔧 **Technical Implementation Details**

### **Build Process Flow**

1. **File Upload & Detection**
   ```typescript
   // Detect React/Vite project
   const isReactVite = files.some(f => f.name === 'package.json') &&
                      files.some(f => f.name.includes('vite.config'));
   ```

2. **Container Creation**
   ```typescript
   // Create isolated container
   const containerId = await this.dockerService.createContainer({
     image: 'node:18-alpine',
     workingDir: '/app',
     ports: { [port]: '3000' }
   });
   ```

3. **Build Execution**
   ```typescript
   // Run build commands
   await this.dockerService.exec(containerId, ['npm', 'install']);
   await this.dockerService.exec(containerId, ['npm', 'run', 'type']);
   await this.dockerService.exec(containerId, ['npm', 'run', 'dev']);
   ```

4. **Preview URL Generation**
   ```typescript
   // Generate unique preview URL
   const previewUrl = `http://localhost:${port}`;
   ```

### **Security Measures**

1. **Container Isolation**
   - Each project runs in its own Docker container
   - Network isolation between containers
   - Resource limits (CPU, memory, disk)

2. **Package Validation**
   ```typescript
   // Validate package.json
   const dangerousScripts = ['postinstall', 'preinstall', 'install'];
   const hasDangerousScripts = dangerousScripts.some(script => 
     packageJson.scripts?.[script]
   );
   ```

3. **File Sanitization**
   ```typescript
   // Remove dangerous files
   const dangerousFiles = ['.env', '.git', 'node_modules'];
   const sanitizedFiles = files.filter(f => 
     !dangerousFiles.some(dangerous => f.name.includes(dangerous))
   );
   ```

### **Error Handling**

1. **Build Failures**
   ```typescript
   try {
     await this.runBuildProcess(websiteId, projectDir);
   } catch (error) {
     await this.handleBuildFailure(websiteId, error);
     throw new BadRequestException('Build failed: ' + error.message);
   }
   ```

2. **Port Conflicts**
   ```typescript
   // Automatic port reallocation
   let port = this.portManager.allocatePort();
   let attempts = 0;
   while (attempts < 10) {
     try {
       await this.startViteServer(projectDir, port);
       break;
     } catch (error) {
       if (error.message.includes('EADDRINUSE')) {
         port = this.portManager.allocatePort();
         attempts++;
       } else {
         throw error;
       }
     }
   }
   ```

3. **Container Failures**
   ```typescript
   // Automatic container restart
   if (!await this.healthService.checkWebsiteHealth(websiteId)) {
     await this.containerService.restartContainer(containerId);
   }
   ```

## 📊 **Performance Considerations**

### **Resource Limits**
- **CPU**: 1 core per container
- **Memory**: 512MB per container
- **Disk**: 1GB per project
- **Concurrent Builds**: Maximum 10 simultaneous builds

### **Caching Strategy**
- **Node Modules**: Cache common dependencies
- **Build Artifacts**: Cache successful builds
- **Container Images**: Pre-built base images

### **Scaling Strategy**
- **Horizontal Scaling**: Multiple build servers
- **Load Balancing**: Distribute builds across servers
- **Queue Management**: Queue builds when resources are full

## 🧪 **Testing Strategy**

### **Unit Tests**
```typescript
describe('BuildService', () => {
  it('should detect React/Vite projects correctly', () => {
    // Test project detection logic
  });
  
  it('should handle build failures gracefully', () => {
    // Test error handling
  });
  
  it('should clean up resources properly', () => {
    // Test cleanup logic
  });
});
```

### **Integration Tests**
```typescript
describe('Website Builder E2E', () => {
  it('should upload and build React project', async () => {
    // Test complete flow from upload to preview
  });
  
  it('should handle concurrent builds', async () => {
    // Test multiple simultaneous builds
  });
});
```

### **Security Tests**
```typescript
describe('Security', () => {
  it('should reject malicious package.json', () => {
    // Test security validations
  });
  
  it('should isolate containers properly', () => {
    // Test container isolation
  });
});
```

## 🚀 **Deployment Plan**

### **Docker Compose Updates**
```yaml
services:
  backend:
    build: ./project
    ports:
      - "8000:8000"
      - "4000-4999:4000-4999"  # Port range for preview servers
    volumes:
      - ./builds:/tmp/website-builds
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
      - BUILD_DIR=/tmp/website-builds
      - MAX_CONCURRENT_BUILDS=10
```

### **Environment Variables**
```bash
# Build Configuration
BUILD_DIR=/tmp/website-builds
MAX_CONCURRENT_BUILDS=10
BUILD_TIMEOUT=300000  # 5 minutes
CLEANUP_INTERVAL=21600000  # 6 hours

# Security
ALLOWED_PACKAGES=react,vite,typescript
BLOCKED_SCRIPTS=postinstall,preinstall,install
MAX_FILE_SIZE=50000000  # 50MB
```

### **Monitoring & Logging**
```typescript
// Enhanced logging for build processes
this.logger.log(`🔨 Starting build for website ${websiteId}`);
this.logger.log(`📦 Running npm install...`);
this.logger.log(`🔍 Running type check...`);
this.logger.log(`🚀 Starting Vite server on port ${port}`);
this.logger.log(`✅ Build completed successfully`);
```

## 📈 **Success Metrics**

### **Performance Metrics**
- **Build Success Rate**: >95%
- **Average Build Time**: <2 minutes
- **Resource Utilization**: <80% CPU, <70% memory
- **Concurrent Builds**: Support 10+ simultaneous builds

### **User Experience Metrics**
- **Upload to Preview Time**: <3 minutes
- **Preview Load Time**: <2 seconds
- **Error Recovery**: Automatic retry on failures
- **User Satisfaction**: Clear progress indicators

### **Security Metrics**
- **Container Isolation**: 100% isolation between projects
- **Malicious Code Detection**: Block 100% of known attack patterns
- **Resource Leak Prevention**: 0% resource leaks after cleanup

## 🔄 **Migration Strategy**

### **Phase 1: Backward Compatibility**
- Maintain existing static file upload functionality
- Add new React/Vite support alongside existing features
- Gradual migration of existing websites

### **Phase 2: Feature Parity**
- Ensure all existing features work with new system
- Add migration tools for existing websites
- Update documentation and user guides

### **Phase 3: Optimization**
- Performance tuning based on real usage
- Additional security hardening
- Advanced features (custom domains, SSL, etc.)

## 📚 **Documentation Updates**

### **User Documentation**
- Updated upload guide with React/Vite support
- Build status monitoring guide
- Troubleshooting common issues
- Best practices for project structure

### **Developer Documentation**
- API documentation for new endpoints
- Build process architecture
- Security considerations
- Deployment guide

### **Admin Documentation**
- System monitoring and maintenance
- Resource management
- Security incident response
- Performance optimization

## 🎯 **Timeline & Milestones**

### **Week 1: Core Infrastructure**
- [ ] Database schema updates
- [ ] Basic build service implementation
- [ ] Process manager setup

### **Week 2: Security & Sandboxing**
- [ ] Docker container implementation
- [ ] Security validations
- [ ] Container management service

### **Week 3: Build Process Integration**
- [ ] Enhanced upload service
- [ ] Build status monitoring
- [ ] Error handling improvements

### **Week 4: Frontend Integration**
- [ ] Enhanced upload interface
- [ ] Build progress components
- [ ] Preview system updates

### **Week 5: Proxy & Routing**
- [ ] Enhanced proxy layer
- [ ] Port management
- [ ] Request routing

### **Week 6: Resource Management**
- [ ] Automatic cleanup service
- [ ] Health monitoring
- [ ] Performance optimization

### **Week 7: Testing & Documentation**
- [ ] Comprehensive testing
- [ ] Documentation updates
- [ ] User guides

### **Week 8: Deployment & Monitoring**
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Performance tuning

## 🎉 **Expected Outcomes**

After implementing this redesign plan, the website builder will:

1. **✅ Support React/Vite Projects**: Automatically detect and build React applications
2. **✅ Run npm Commands**: Execute `npm install` and `npm run type` safely
3. **✅ Live Preview**: Provide real-time interaction with running applications
4. **✅ Resource Management**: Proper cleanup and resource allocation
5. **✅ Security**: Sandboxed execution with comprehensive security measures
6. **✅ Scalability**: Support multiple concurrent builds and projects
7. **✅ User Experience**: Clear progress indicators and error handling

This redesign addresses all the feedback from the AI advisors and creates a robust, secure, and scalable website builder system that truly supports React/Vite projects with automated build and hosting capabilities. 