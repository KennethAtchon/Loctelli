# Asynchronous Queue Implementation Checklist

## 🎯 **Complete Implementation Roadmap**

### **Phase 1: Database Schema & Infrastructure** ✅

#### **1.1 Database Migrations**
- [ ] Create `build_jobs` table migration
  ```sql
  CREATE TABLE build_jobs (
    id VARCHAR(255) PRIMARY KEY,
    website_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    current_step VARCHAR(255),
    logs JSON,
    error TEXT,
    allocated_port INTEGER,
    preview_url VARCHAR(500),
    notification_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (website_id) REFERENCES websites(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  ```

- [ ] Create `user_notifications` table migration
  ```sql
  CREATE TABLE user_notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    job_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES build_jobs(id)
  );
  ```

- [ ] Update `websites` table
  ```sql
  ALTER TABLE websites ADD COLUMN build_job_id VARCHAR(255);
  ALTER TABLE websites ADD FOREIGN KEY (build_job_id) REFERENCES build_jobs(id);
  ```

#### **1.2 Prisma Schema Updates**
- [ ] Add `BuildJob` model to `prisma/schema.prisma`
- [ ] Add `UserNotification` model to `prisma/schema.prisma`
- [ ] Update `Website` model to include `buildJobId` field
- [ ] Run `npx prisma generate` to update client
- [ ] Run `npx prisma migrate dev` to apply migrations

#### **1.3 Queue Infrastructure Setup**
- [ ] Install queue dependencies
  ```bash
  npm install bull @types/bull redis
  # OR for in-memory queue
  npm install p-queue
  ```
- [ ] Set up Redis connection (if using Bull)
- [ ] Create queue configuration file

### **Phase 2: Backend Core Services** ✅

#### **2.1 Build Queue Service**
- [ ] Create `src/main-app/modules/website-builder/services/build-queue.service.ts`
- [ ] Implement `BuildQueueService` class with methods:
  - [ ] `enqueueJob(websiteId, files, userId): Promise<string>`
  - [ ] `dequeueJob(): Promise<BuildJob | null>`
  - [ ] `updateJobProgress(jobId, progress, step): Promise<void>`
  - [ ] `completeJob(jobId, previewUrl): Promise<void>`
  - [ ] `failJob(jobId, error): Promise<void>`
  - [ ] `getJob(jobId): Promise<BuildJob>`
  - [ ] `getUserJobs(userId): Promise<BuildJob[]>`
  - [ ] `getQueuePosition(jobId): Promise<number>`
  - [ ] `cancelJob(jobId, userId): Promise<void>`

#### **2.2 Notification Service**
- [ ] Create `src/main-app/modules/website-builder/services/notification.service.ts`
- [ ] Implement `NotificationService` class with methods:
  - [ ] `createNotification(data): Promise<void>`
  - [ ] `getUserNotifications(userId): Promise<Notification[]>`
  - [ ] `markAsRead(notificationId, userId): Promise<void>`
  - [ ] `markAllAsRead(userId): Promise<void>`
  - [ ] `deleteNotification(notificationId, userId): Promise<void>`

#### **2.3 Build Worker Service**
- [ ] Create `src/main-app/modules/website-builder/services/build-worker.service.ts`
- [ ] Implement `BuildWorkerService` class with methods:
  - [ ] `startWorker(jobId): Promise<void>`
  - [ ] `stopWorker(jobId): Promise<void>`
  - [ ] `getActiveWorkers(): Map<string, BuildWorker>`
- [ ] Create `BuildWorker` class with methods:
  - [ ] `start(): Promise<void>`
  - [ ] `stop(): Promise<void>`
  - [ ] `extractFiles(): Promise<void>`
  - [ ] `runNpmInstall(): Promise<void>`
  - [ ] `runTypeCheck(): Promise<void>`
  - [ ] `startViteServer(): Promise<string>`

#### **2.4 Real-Time Notification Service**
- [ ] Create `src/main-app/modules/website-builder/services/realtime-notification.service.ts`
- [ ] Implement `RealTimeNotificationService` class with methods:
  - [ ] `handleSSEConnection(userId, res): Promise<void>`
  - [ ] `sendNotification(userId, notification): Promise<void>`
  - [ ] `sendJobUpdate(userId, jobUpdate): Promise<void>`
  - [ ] `removeConnection(userId): void`

### **Phase 3: API Endpoints** ✅

#### **3.1 Modified Upload Endpoint**
- [ ] Update `src/main-app/modules/website-builder/website-builder.controller.ts`
- [ ] Modify `uploadWebsite` method to:
  - [ ] Accept files and create website record
  - [ ] Queue build job instead of building immediately
  - [ ] Create initial notification
  - [ ] Return job ID and queue position immediately
- [ ] Add validation for file types and size limits
- [ ] Add error handling for queue failures

#### **3.2 New Status Endpoint**
- [ ] Add `getBuildStatus` method to controller
- [ ] Implement endpoint: `GET /api/website-builder/:id/build-status`
- [ ] Return job status, progress, logs, and preview URL
- [ ] Add authentication and authorization checks
- [ ] Add rate limiting for status polling

#### **3.3 User Queue Endpoint**
- [ ] Add `getUserQueue` method to controller
- [ ] Implement endpoint: `GET /api/website-builder/user/queue`
- [ ] Return active and completed jobs for user
- [ ] Add pagination for completed jobs
- [ ] Add filtering options (status, date range)

#### **3.4 Notifications Endpoints**
- [ ] Add `getUserNotifications` method to controller
- [ ] Implement endpoint: `GET /api/website-builder/user/notifications`
- [ ] Add `markNotificationAsRead` method
- [ ] Implement endpoint: `PATCH /api/website-builder/user/notifications/:id/read`
- [ ] Add `markAllNotificationsAsRead` method
- [ ] Implement endpoint: `PATCH /api/website-builder/user/notifications/read-all`

#### **3.5 Real-Time Stream Endpoint**
- [ ] Add `streamQueueUpdates` method to controller
- [ ] Implement endpoint: `GET /api/website-builder/user/queue/stream`
- [ ] Set up Server-Sent Events (SSE) headers
- [ ] Handle connection cleanup on disconnect
- [ ] Add authentication for SSE connections

#### **3.6 Job Management Endpoints**
- [ ] Add `cancelJob` method to controller
- [ ] Implement endpoint: `DELETE /api/website-builder/jobs/:id`
- [ ] Add `retryJob` method to controller
- [ ] Implement endpoint: `POST /api/website-builder/jobs/:id/retry`
- [ ] Add `getJobLogs` method to controller
- [ ] Implement endpoint: `GET /api/website-builder/jobs/:id/logs`

### **Phase 4: Frontend Components** ✅

#### **4.1 API Client Updates**
- [ ] Update `my-app/lib/api/endpoints/website-builder.ts`
- [ ] Add new API methods:
  - [ ] `getBuildStatus(websiteId): Promise<BuildStatus>`
  - [ ] `getUserQueue(): Promise<UserQueue>`
  - [ ] `getUserNotifications(): Promise<UserNotifications>`
  - [ ] `markNotificationAsRead(notificationId): Promise<void>`
  - [ ] `markAllNotificationsAsRead(): Promise<void>`
  - [ ] `cancelJob(jobId): Promise<void>`
  - [ ] `retryJob(jobId): Promise<void>`
  - [ ] `getJobLogs(jobId): Promise<string[]>`

#### **4.2 Upload Flow Updates**
- [ ] Update `my-app/app/admin/website-builder/page.tsx`
- [ ] Modify upload handler to:
  - [ ] Show immediate feedback after upload
  - [ ] Display queue position
  - [ ] Start status polling
  - [ ] Show build progress
- [ ] Add error handling for upload failures
- [ ] Add retry functionality for failed uploads

#### **4.3 Build Progress Component**
- [ ] Create `my-app/components/website-builder/build-progress.tsx`
- [ ] Implement progress bar with percentage
- [ ] Add current step display
- [ ] Show real-time logs
- [ ] Add cancel build button
- [ ] Add estimated time remaining
- [ ] Handle completion and error states

#### **4.4 Queue Dashboard Component**
- [ ] Create `my-app/components/website-builder/queue-dashboard.tsx`
- [ ] Implement dashboard layout with:
  - [ ] Active jobs section
  - [ ] Completed jobs section
  - [ ] Notification bell
  - [ ] Queue statistics
- [ ] Add real-time updates via SSE
- [ ] Add job filtering and sorting
- [ ] Add pagination for completed jobs

#### **4.5 Job Card Components**
- [ ] Create `my-app/components/website-builder/job-card.tsx`
- [ ] Implement active job card with:
  - [ ] Job title and status
  - [ ] Progress indicator
  - [ ] Current step
  - [ ] Action buttons (cancel, view logs)
- [ ] Create `my-app/components/website-builder/completed-job-card.tsx`
- [ ] Implement completed job card with:
  - [ ] Success/failure status
  - [ ] Completion time
  - [ ] Preview link (if successful)
  - [ ] Retry button (if failed)

#### **4.6 Notifications Panel**
- [ ] Create `my-app/components/website-builder/notifications-panel.tsx`
- [ ] Implement notification dropdown with:
  - [ ] Notification list
  - [ ] Unread indicators
  - [ ] Mark as read functionality
  - [ ] Mark all as read button
  - [ ] Notification actions (click to view)
- [ ] Add notification bell with badge
- [ ] Add toast notifications for new alerts

#### **4.7 Status Polling Hook**
- [ ] Create `my-app/hooks/use-build-status.ts`
- [ ] Implement polling logic with:
  - [ ] Configurable poll interval
  - [ ] Automatic cleanup on unmount
  - [ ] Error handling and retry logic
  - [ ] Status change callbacks
- [ ] Add exponential backoff for failed requests
- [ ] Add maximum retry limits

### **Phase 5: Real-Time Integration** ✅

#### **5.1 SSE Connection Hook**
- [ ] Create `my-app/hooks/use-sse-connection.ts`
- [ ] Implement SSE connection with:
  - [ ] Connection management
  - [ ] Event handling
  - [ ] Reconnection logic
  - [ ] Error handling
- [ ] Add connection status indicators
- [ ] Add fallback to polling if SSE fails

#### **5.2 Real-Time Updates**
- [ ] Update queue dashboard to use SSE
- [ ] Add real-time job status updates
- [ ] Add real-time notification delivery
- [ ] Add real-time progress updates
- [ ] Handle connection interruptions gracefully

#### **5.3 Toast Notifications**
- [ ] Update toast system to handle build notifications
- [ ] Add different toast types:
  - [ ] Build queued
  - [ ] Build started
  - [ ] Build completed
  - [ ] Build failed
- [ ] Add action buttons to toasts
- [ ] Add sound notifications (optional)

### **Phase 6: Advanced Features** ✅

#### **6.1 Priority Queue System**
- [ ] Implement priority calculation logic
- [ ] Add user type-based priorities
- [ ] Add time-based priority boosting
- [ ] Add manual priority setting
- [ ] Add priority queue visualization

#### **6.2 Resource Management**
- [ ] Create `src/main-app/modules/website-builder/services/resource-manager.service.ts`
- [ ] Implement resource allocation logic
- [ ] Add memory usage monitoring
- [ ] Add CPU usage monitoring
- [ ] Add automatic resource cleanup
- [ ] Add resource limits configuration

#### **6.3 Build Caching**
- [ ] Create `src/main-app/modules/website-builder/services/build-cache.service.ts`
- [ ] Implement file hash calculation
- [ ] Add cache storage and retrieval
- [ ] Add cache invalidation logic
- [ ] Add cache statistics
- [ ] Add cache cleanup jobs

#### **6.4 Job Analytics**
- [ ] Add build time tracking
- [ ] Add success/failure rates
- [ ] Add resource usage metrics
- [ ] Add queue performance metrics
- [ ] Create analytics dashboard

### **Phase 7: Testing & Quality Assurance** ✅

#### **7.1 Unit Tests**
- [ ] Test `BuildQueueService` methods
- [ ] Test `NotificationService` methods
- [ ] Test `BuildWorkerService` methods
- [ ] Test API endpoints
- [ ] Test frontend components
- [ ] Test hooks and utilities

#### **7.2 Integration Tests**
- [ ] Test complete upload flow
- [ ] Test status polling
- [ ] Test real-time updates
- [ ] Test notification system
- [ ] Test error handling
- [ ] Test concurrent builds

#### **7.3 Performance Tests**
- [ ] Test queue performance under load
- [ ] Test memory usage during builds
- [ ] Test concurrent build limits
- [ ] Test SSE connection limits
- [ ] Test database performance

#### **7.4 User Acceptance Tests**
- [ ] Test complete user workflow
- [ ] Test error scenarios
- [ ] Test mobile responsiveness
- [ ] Test accessibility
- [ ] Test browser compatibility

### **Phase 8: Deployment & Monitoring** ✅

#### **8.1 Environment Configuration**
- [ ] Add queue configuration to environment variables
- [ ] Add Redis configuration (if using)
- [ ] Add resource limits configuration
- [ ] Add monitoring configuration
- [ ] Add logging configuration

#### **8.2 Docker Updates**
- [ ] Update `docker-compose.yml` to include Redis (if needed)
- [ ] Update Dockerfiles for new dependencies
- [ ] Add health checks for queue services
- [ ] Add monitoring containers
- [ ] Update deployment scripts

#### **8.3 Monitoring Setup**
- [ ] Add queue metrics monitoring
- [ ] Add build performance monitoring
- [ ] Add error tracking
- [ ] Add user experience monitoring
- [ ] Add alerting for failures

#### **8.4 Documentation**
- [ ] Update API documentation
- [ ] Create user guide for queue features
- [ ] Create developer guide for queue system
- [ ] Create troubleshooting guide
- [ ] Update README with new features

### **Phase 9: Migration & Rollout** ✅

#### **9.1 Data Migration**
- [ ] Create migration script for existing websites
- [ ] Test migration on staging environment
- [ ] Backup production data
- [ ] Execute production migration
- [ ] Verify migration success

#### **9.2 Feature Rollout**
- [ ] Deploy to staging environment
- [ ] Test complete functionality
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Enable feature flags

#### **9.3 User Communication**
- [ ] Create announcement for new features
- [ ] Update user documentation
- [ ] Create tutorial videos
- [ ] Send email notifications
- [ ] Monitor user feedback

### **Phase 10: Optimization & Maintenance** ✅

#### **10.1 Performance Optimization**
- [ ] Optimize database queries
- [ ] Add database indexes
- [ ] Optimize queue processing
- [ ] Add caching layers
- [ ] Optimize frontend rendering

#### **10.2 Monitoring & Alerts**
- [ ] Set up comprehensive monitoring
- [ ] Configure alert thresholds
- [ ] Add automated recovery procedures
- [ ] Create incident response procedures
- [ ] Set up performance dashboards

#### **10.3 Maintenance Procedures**
- [ ] Create queue cleanup procedures
- [ ] Create log rotation procedures
- [ ] Create backup procedures
- [ ] Create update procedures
- [ ] Create rollback procedures

## 🚀 **Implementation Priority**

### **High Priority (Weeks 1-2)**
1. Database schema and migrations
2. Basic queue service implementation
3. Modified upload endpoint
4. Basic status polling
5. Simple progress UI

### **Medium Priority (Weeks 3-4)**
1. Notification system
2. Queue dashboard
3. Real-time updates
4. Job management features
5. Error handling improvements

### **Low Priority (Weeks 5-6)**
1. Advanced features (priority queue, caching)
2. Performance optimization
3. Comprehensive testing
4. Monitoring and analytics
5. Documentation and user guides

## 📋 **Daily Implementation Checklist**

### **Day 1: Foundation**
- [ ] Set up database migrations
- [ ] Create basic queue service
- [ ] Test database connections
- [ ] Set up development environment

### **Day 2: Core Services**
- [ ] Implement BuildQueueService
- [ ] Implement NotificationService
- [ ] Add basic error handling
- [ ] Write unit tests for services

### **Day 3: API Endpoints**
- [ ] Modify upload endpoint
- [ ] Add status endpoint
- [ ] Add user queue endpoint
- [ ] Test API endpoints

### **Day 4: Frontend Basics**
- [ ] Update API client
- [ ] Modify upload flow
- [ ] Add basic progress display
- [ ] Test frontend integration

### **Day 5: Real-Time Features**
- [ ] Implement SSE connection
- [ ] Add real-time updates
- [ ] Add notification system
- [ ] Test real-time functionality

### **Day 6: User Experience**
- [ ] Create queue dashboard
- [ ] Add job cards
- [ ] Add notifications panel
- [ ] Test complete user flow

### **Day 7: Polish & Testing**
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test edge cases
- [ ] Performance testing

## 🎯 **Success Criteria**

### **Functional Requirements**
- [ ] Users can upload websites and get immediate feedback
- [ ] Build progress is displayed in real-time
- [ ] Users receive notifications when builds complete
- [ ] Users can view their build queue and history
- [ ] System can handle multiple concurrent builds
- [ ] Failed builds can be retried
- [ ] Build logs are accessible and searchable

### **Performance Requirements**
- [ ] Upload response time < 2 seconds
- [ ] Status updates < 2 seconds
- [ ] System can handle 50+ concurrent builds
- [ ] Memory usage < 4GB total
- [ ] CPU usage < 80% under load
- [ ] Database queries < 100ms

### **User Experience Requirements**
- [ ] No request timeouts
- [ ] Clear progress indicators
- [ ] Helpful error messages
- [ ] Easy access to completed builds
- [ ] Mobile-responsive design
- [ ] Accessible interface

### **Reliability Requirements**
- [ ] 99.9% uptime
- [ ] Automatic error recovery
- [ ] Data consistency
- [ ] Graceful degradation
- [ ] Comprehensive logging
- [ ] Backup and recovery procedures

This checklist provides a comprehensive roadmap for implementing the asynchronous queue system. Each item should be checked off as it's completed, and the implementation should be tested thoroughly at each phase. 