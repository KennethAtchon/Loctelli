# Async Job Queue Implementation Guide - Phase 2

## Overview

This guide provides a complete step-by-step implementation of an async job queue system for the business search functionality, transforming it from synchronous blocking requests to real-time progressive updates via WebSocket.

## Architecture Summary

**Current Architecture**: Frontend → API → External APIs → Wait 10-30s → Return results
**New Architecture**: Frontend → Queue Job → Immediate Response + WebSocket → Real-time updates

### Technology Stack Integration
- **Job Queue**: BullMQ (already has `bee-queue` in package.json - we'll upgrade)
- **WebSocket**: NestJS WebSocket Gateway (@nestjs/websockets) 
- **Redis**: Already configured and running (Redis 7)
- **Database**: Extend existing Prisma schema
- **Frontend**: Socket.io client with React hooks

## Step-by-Step Implementation

### Phase 1: Backend Dependencies & Configuration

#### 1.1 Install Required Packages

```bash
cd project

# Remove old bee-queue and install BullMQ + WebSocket dependencies
npm uninstall bee-queue
npm install @bull-board/api @bull-board/nestjs @bull-board/express bullmq @nestjs/websockets @nestjs/platform-socket.io socket.io uuid

# Frontend WebSocket client
cd ../my-app
npm install socket.io-client @types/uuid uuid
```

#### 1.2 Update Environment Configuration

**project/.env** (Add these variables):
```env
# Job Queue Configuration
REDIS_JOB_QUEUE_URL=redis://localhost:6379/1
JOB_QUEUE_CONCURRENCY=5
JOB_QUEUE_MAX_RETRIES=3

# WebSocket Configuration  
WEBSOCKET_PORT=8001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000
```

**Update project/src/main-app/infrastructure/config/configuration.ts**:
```typescript
export default () => ({
  // ... existing config
  jobQueue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      db: parseInt(process.env.REDIS_JOB_QUEUE_DB, 10) || 1,
    },
    concurrency: parseInt(process.env.JOB_QUEUE_CONCURRENCY, 10) || 5,
    maxRetries: parseInt(process.env.JOB_QUEUE_MAX_RETRIES, 10) || 3,
  },
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT, 10) || 8001,
    corsOrigin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
  },
});
```

### Phase 2: Database Schema Extensions

#### 2.1 Add SearchJob Model to Prisma Schema

**project/prisma/schema.prisma** (Add to existing schema):
```prisma
model SearchJob {
  id            String   @id @default(uuid())
  userId        Int
  subAccountId  Int
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  subAccount    SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Job metadata
  jobId         String   @unique // BullMQ job ID
  status        SearchJobStatus @default(QUEUED)
  progress      Int      @default(0) // 0-100
  
  // Search parameters (same as BusinessSearch)
  query         String
  location      String?
  radius        Float?
  category      String?
  sources       Json     // Array of source names
  limit         Int      @default(20)
  
  // Results and progress
  partialResults Json?   // Incremental results as they come in
  finalResults   Json?   // Final deduplicated results
  errorMessage   String?
  
  // Progress tracking
  totalSources   Int     @default(0)
  completedSources Int   @default(0)
  currentSource  String?
  
  // Timing
  estimatedDuration Int? // Estimated seconds
  actualDuration    Int? // Actual seconds taken
  createdAt      DateTime @default(now())
  startedAt      DateTime?
  completedAt    DateTime?
  expiresAt      DateTime // Auto-cleanup old jobs
  
  @@map("search_jobs")
}

enum SearchJobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

// Update existing models to include SearchJob relationship
model User {
  // ... existing fields
  searchJobs    SearchJob[] // Add this line
}

model SubAccount {
  // ... existing fields  
  searchJobs    SearchJob[] // Add this line
}
```

#### 2.2 Generate and Run Migration

```bash
cd project
npx prisma migrate dev --name add_search_jobs
npx prisma generate
```

### Phase 3: Job Queue Infrastructure

#### 3.1 Create Job Queue Module

**project/src/main-app/infrastructure/queue/queue.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { SearchJobProcessor } from './processors/search-job.processor';
import { SearchJobQueue } from './services/search-job.service';
import { BusinessFinderModule } from '../../modules/finder/finder.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('jobQueue.redis.host'),
          port: configService.get('jobQueue.redis.port'),
          db: configService.get('jobQueue.redis.db'),
        },
        defaultJobOptions: {
          removeOnComplete: 50, // Keep last 50 completed jobs
          removeOnFail: 100,    // Keep last 100 failed jobs
          attempts: configService.get('jobQueue.maxRetries'),
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'business-search',
    }),
    BusinessFinderModule, // Import existing finder module
  ],
  providers: [SearchJobProcessor, SearchJobQueue],
  exports: [SearchJobQueue],
})
export class QueueModule {}
```

#### 3.2 Create Job Queue Service

**project/src/main-app/infrastructure/queue/services/search-job.service.ts**:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchBusinessDto } from '../../../modules/finder/dto/search-business.dto';
import { SearchJobStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface SearchJobData {
  searchJobId: string;
  userId: number;
  subAccountId: number;
  searchDto: SearchBusinessDto;
}

export interface SearchJobResult {
  jobId: string;
  estimatedDuration: number;
  status: SearchJobStatus;
}

@Injectable()
export class SearchJobQueue {
  private readonly logger = new Logger(SearchJobQueue.name);

  constructor(
    @InjectQueue('business-search') private searchQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async createSearchJob(
    userId: number,
    subAccountId: number,
    searchDto: SearchBusinessDto,
  ): Promise<SearchJobResult> {
    const searchJobId = uuidv4();
    const jobId = `search_${searchJobId}`;
    
    // Create database record
    const estimatedDuration = this.estimateSearchDuration(searchDto.sources?.length || 3);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const searchJob = await this.prisma.searchJob.create({
      data: {
        id: searchJobId,
        jobId,
        userId,
        subAccountId,
        query: searchDto.query,
        location: searchDto.location,
        radius: searchDto.radius,
        category: searchDto.category,
        sources: searchDto.sources || [],
        limit: searchDto.limit || 20,
        status: SearchJobStatus.QUEUED,
        totalSources: searchDto.sources?.length || 3,
        estimatedDuration,
        expiresAt,
      },
    });

    // Queue the job
    const jobData: SearchJobData = {
      searchJobId,
      userId,
      subAccountId,
      searchDto,
    };

    await this.searchQueue.add('process-search', jobData, {
      jobId,
      delay: 0, // Process immediately
      priority: this.calculateJobPriority(userId),
    });

    this.logger.log(`Created search job ${jobId} for user ${userId}`);

    return {
      jobId: searchJobId,
      estimatedDuration,
      status: SearchJobStatus.QUEUED,
    };
  }

  async cancelJob(searchJobId: string, userId: number): Promise<boolean> {
    try {
      // Update database
      const searchJob = await this.prisma.searchJob.findFirst({
        where: { id: searchJobId, userId },
      });

      if (!searchJob) {
        return false;
      }

      // Cancel Bull job
      const job = await this.searchQueue.getJob(searchJob.jobId);
      if (job) {
        await job.remove();
      }

      // Update status
      await this.prisma.searchJob.update({
        where: { id: searchJobId },
        data: {
          status: SearchJobStatus.CANCELLED,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Cancelled search job ${searchJobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel job ${searchJobId}:`, error);
      return false;
    }
  }

  async getJobStatus(searchJobId: string, userId: number) {
    return this.prisma.searchJob.findFirst({
      where: { id: searchJobId, userId },
      select: {
        id: true,
        status: true,
        progress: true,
        currentSource: true,
        totalSources: true,
        completedSources: true,
        partialResults: true,
        finalResults: true,
        errorMessage: true,
        estimatedDuration: true,
        actualDuration: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }

  private estimateSearchDuration(sourceCount: number): number {
    // Estimate based on typical API response times
    const baseTime = 2; // Base overhead in seconds
    const perSourceTime = 4; // Average time per source in seconds
    return baseTime + (sourceCount * perSourceTime);
  }

  private calculateJobPriority(userId: number): number {
    // Higher priority for premium users, lower numbers = higher priority
    // For now, all users get same priority
    return 0;
  }
}
```

#### 3.3 Create Job Processor

**project/src/main-app/infrastructure/queue/processors/search-job.processor.ts**:
```typescript
import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessFinderService } from '../../../modules/finder/services/business-finder.service';
import { SearchUpdatesGateway } from '../../websocket/search-updates.gateway';
import { SearchJobData } from '../services/search-job.service';
import { SearchJobStatus } from '@prisma/client';
import { BusinessSearchResultDto } from '../../../modules/finder/dto/search-business.dto';

@Processor('business-search')
export class SearchJobProcessor {
  private readonly logger = new Logger(SearchJobProcessor.name);

  constructor(
    private prisma: PrismaService,
    private businessFinderService: BusinessFinderService,
    private searchUpdatesGateway: SearchUpdatesGateway,
  ) {}

  @Process('process-search')
  async handleSearchJob(job: Job<SearchJobData>) {
    const { searchJobId, userId, subAccountId, searchDto } = job.data;
    
    this.logger.log(`Processing search job ${searchJobId} for user ${userId}`);
    
    try {
      // Update job status to processing
      await this.updateJobProgress(searchJobId, {
        status: SearchJobStatus.PROCESSING,
        startedAt: new Date(),
        progress: 0,
        currentSource: 'Initializing...',
      });

      // Emit initial progress
      this.searchUpdatesGateway.emitSearchUpdate(userId, {
        searchJobId,
        status: 'processing',
        progress: 0,
        message: 'Starting business search...',
        totalSources: searchDto.sources?.length || 3,
        completedSources: 0,
      });

      // Process each source individually
      const results: BusinessSearchResultDto[] = [];
      const sources = searchDto.sources || ['openstreetmap', 'google_places', 'yelp'];
      
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const progress = Math.round(((i + 1) / sources.length) * 80); // Reserve 20% for final processing
        
        // Update progress
        await this.updateJobProgress(searchJobId, {
          progress,
          currentSource: source,
          completedSources: i,
        });

        this.searchUpdatesGateway.emitSearchUpdate(userId, {
          searchJobId,
          status: 'processing',
          progress,
          message: `Searching ${this.formatSourceName(source)}...`,
          totalSources: sources.length,
          completedSources: i,
          partialResults: results,
        });

        try {
          // Get user's API keys for this source
          const userApiKeys = await this.businessFinderService.getUserApiKeys(userId);
          const apiKey = userApiKeys.find(key => key.service === source)?.keyValue;
          
          // Search this source
          const sourceResults = await this.businessFinderService.searchBySource(
            source,
            searchDto,
            apiKey
          );
          
          results.push(...sourceResults);
          
          // Update with partial results
          await this.updateJobProgress(searchJobId, {
            partialResults: results,
            completedSources: i + 1,
          });

          this.searchUpdatesGateway.emitSearchUpdate(userId, {
            searchJobId,
            status: 'processing',
            progress,
            message: `Found ${results.length} businesses from ${i + 1} source(s)...`,
            totalSources: sources.length,
            completedSources: i + 1,
            partialResults: results,
          });

        } catch (error) {
          this.logger.warn(`Search failed for ${source}: ${error.message}`);
          // Continue with other sources
        }
      }

      // Final processing - deduplication
      this.searchUpdatesGateway.emitSearchUpdate(userId, {
        searchJobId,
        status: 'processing',
        progress: 90,
        message: 'Processing and deduplicating results...',
        totalSources: sources.length,
        completedSources: sources.length,
        partialResults: results,
      });

      const finalResults = this.businessFinderService.deduplicateResults(
        results,
        searchDto.limit || 20
      );

      // Save to BusinessSearch for compatibility
      const searchRecord = await this.businessFinderService.saveSearchResult({
        searchHash: this.businessFinderService.generateSearchHash(searchDto),
        userId,
        subAccountId,
        searchDto,
        results: finalResults,
        sources,
        responseTime: Date.now() - job.timestamp,
        apiCalls: this.countApiCalls(sources),
      });

      // Complete the job
      const completedAt = new Date();
      const actualDuration = Math.round((completedAt.getTime() - job.timestamp) / 1000);

      await this.updateJobProgress(searchJobId, {
        status: SearchJobStatus.COMPLETED,
        progress: 100,
        finalResults,
        completedAt,
        actualDuration,
      });

      // Emit completion
      this.searchUpdatesGateway.emitSearchUpdate(userId, {
        searchJobId,
        status: 'completed',
        progress: 100,
        message: `Search completed! Found ${finalResults.length} businesses.`,
        totalSources: sources.length,
        completedSources: sources.length,
        finalResults,
        businessSearchId: searchRecord.id, // For compatibility with existing export system
        duration: actualDuration,
      });

      this.logger.log(`Completed search job ${searchJobId}: ${finalResults.length} results`);

    } catch (error) {
      this.logger.error(`Search job ${searchJobId} failed:`, error);
      
      // Update job as failed
      await this.updateJobProgress(searchJobId, {
        status: SearchJobStatus.FAILED,
        errorMessage: error.message,
        completedAt: new Date(),
      });

      // Emit failure
      this.searchUpdatesGateway.emitSearchUpdate(userId, {
        searchJobId,
        status: 'failed',
        progress: 0,
        message: `Search failed: ${error.message}`,
        error: error.message,
      });

      throw error; // Re-throw for Bull to handle retry logic
    }
  }

  @OnQueueActive()
  onActive(job: Job<SearchJobData>) {
    this.logger.log(`Started processing job ${job.data.searchJobId}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<SearchJobData>) {
    this.logger.log(`Completed job ${job.data.searchJobId}`);
  }

  @OnQueueFailed()
  onFailed(job: Job<SearchJobData>, err: Error) {
    this.logger.error(`Failed job ${job.data.searchJobId}:`, err);
  }

  private async updateJobProgress(searchJobId: string, updates: any) {
    return this.prisma.searchJob.update({
      where: { id: searchJobId },
      data: updates,
    });
  }

  private formatSourceName(source: string): string {
    const names = {
      google_places: 'Google Places',
      yelp: 'Yelp',
      openstreetmap: 'OpenStreetMap',
    };
    return names[source] || source;
  }

  private countApiCalls(sources: string[]): Record<string, number> {
    const calls: Record<string, number> = {};
    sources.forEach(source => {
      calls[source] = 1;
    });
    return calls;
  }
}
```

### Phase 4: WebSocket Gateway

#### 4.1 Create WebSocket Gateway

**project/src/main-app/infrastructure/websocket/search-updates.gateway.ts**:
```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

export interface SearchProgressUpdate {
  searchJobId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  totalSources?: number;
  completedSources?: number;
  partialResults?: any[];
  finalResults?: any[];
  businessSearchId?: string;
  duration?: number;
  error?: string;
}

@WebSocketGateway({
  namespace: 'business-search',
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class SearchUpdatesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SearchUpdatesGateway.name);
  private userConnections = new Map<number, Set<string>>(); // userId -> Set of socketIds

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.userId;

      // Store connection
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId).add(client.id);

      // Join user-specific room
      client.join(`user-${userId}`);
      client.data.userId = userId;

      this.logger.log(`User ${userId} connected to search updates (${client.id})`);
    } catch (error) {
      this.logger.error('WebSocket authentication failed:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userConnections.has(userId)) {
      this.userConnections.get(userId).delete(client.id);
      if (this.userConnections.get(userId).size === 0) {
        this.userConnections.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-search-updates')
  handleJoinRoom(
    @MessageBody() data: { userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.userId;
    if (userId === data.userId) {
      client.join(`user-${userId}`);
      this.logger.log(`User ${userId} joined search updates room`);
    }
  }

  emitSearchUpdate(userId: number, update: SearchProgressUpdate) {
    this.server.to(`user-${userId}`).emit('search-progress', update);
    this.logger.debug(`Emitted search update to user ${userId}: ${update.message}`);
  }

  // Method to broadcast to all connected users (for admin purposes)
  broadcastSystemMessage(message: string) {
    this.server.emit('system-message', { message, timestamp: new Date() });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }
}

@WebSocketGateway({
  namespace: 'business-search',
  cors: { origin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000' },
})
export class SearchUpdatesModule {}
```

#### 4.2 Create WebSocket Module

**project/src/main-app/infrastructure/websocket/websocket.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SearchUpdatesGateway } from './search-updates.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SearchUpdatesGateway],
  exports: [SearchUpdatesGateway],
})
export class WebSocketModule {}
```

### Phase 5: Update Business Finder Service

#### 5.1 Extract Reusable Methods

Update **project/src/main-app/modules/finder/services/business-finder.service.ts**:

```typescript
// Add these public methods for use by the job processor:

public async searchBySource(
  source: string,
  searchDto: SearchBusinessDto,
  apiKey?: string,
): Promise<BusinessSearchResultDto[]> {
  // Move the existing private method logic here and make it public
  return this.searchBySourceInternal(source, searchDto, apiKey);
}

public generateSearchHash(searchDto: SearchBusinessDto): string {
  // Make the existing private method public
  return this.generateSearchHashInternal(searchDto);
}

public deduplicateResults(
  results: BusinessSearchResultDto[],
  limit: number,
): BusinessSearchResultDto[] {
  // Make the existing private method public
  return this.deduplicateResultsInternal(results, limit);
}

public async saveSearchResult(params: {
  searchHash: string;
  userId: number;
  subAccountId: number;
  searchDto: SearchBusinessDto;
  results: BusinessSearchResultDto[];
  sources: string[];
  responseTime: number;
  apiCalls: Record<string, number>;
}): Promise<any> {
  // Make the existing private method public
  return this.saveSearchResultInternal(params);
}

// Rename private methods to avoid conflicts:
private async searchBySourceInternal(source: string, searchDto: SearchBusinessDto, apiKey?: string) {
  // Existing implementation
}

private generateSearchHashInternal(searchDto: SearchBusinessDto): string {
  // Existing implementation
}

private deduplicateResultsInternal(results: BusinessSearchResultDto[], limit: number) {
  // Existing implementation  
}

private async saveSearchResultInternal(params: any): Promise<any> {
  // Existing implementation
}
```

### Phase 6: Update Finder Module and Controller

#### 6.1 Update Finder Module

**project/src/main-app/modules/finder/finder.module.ts**:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// ... existing imports
import { QueueModule } from '../../infrastructure/queue/queue.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';

@Module({
  imports: [
    // ... existing imports
    QueueModule,
    WebSocketModule,
  ],
  controllers: [FinderController],
  providers: [
    // ... existing providers
  ],
  exports: [
    // ... existing exports
    BusinessFinderService, // Make sure this is exported for queue processor
  ],
})
export class FinderModule {}
```

#### 6.2 Update Finder Controller

Add async endpoints to **project/src/main-app/modules/finder/controllers/finder.controller.ts**:
```typescript
import { SearchJobQueue, SearchJobResult } from '../../../infrastructure/queue/services/search-job.service';

@Controller('admin/finder')
@UseGuards(JwtAuthGuard)
export class FinderController {
  constructor(
    private businessFinderService: BusinessFinderService,
    private exportService: ExportService,
    private rateLimitService: RateLimitService,
    private searchJobQueue: SearchJobQueue, // Add this
  ) {}

  // ... existing endpoints

  @Post('search-async')
  async initiateAsyncSearch(
    @Body(ValidationPipe) searchDto: SearchBusinessDto,
    @CurrentUser() user: any,
  ): Promise<SearchJobResult> {
    // Get default SubAccount (same logic as sync version)
    const defaultSubAccount = await this.prisma.subAccount.findFirst({
      where: { name: 'Default SubAccount' },
    });
    
    if (!defaultSubAccount) {
      throw new HttpException(
        'Default SubAccount not found. Please contact administrator.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return this.searchJobQueue.createSearchJob(
      user.userId,
      defaultSubAccount.id,
      searchDto,
    );
  }

  @Get('search-status/:searchJobId')
  async getSearchJobStatus(
    @Param('searchJobId') searchJobId: string,
    @CurrentUser() user: any,
  ) {
    const jobStatus = await this.searchJobQueue.getJobStatus(searchJobId, user.userId);
    
    if (!jobStatus) {
      throw new HttpException('Search job not found', HttpStatus.NOT_FOUND);
    }
    
    return jobStatus;
  }

  @Delete('search/:searchJobId')
  async cancelSearchJob(
    @Param('searchJobId') searchJobId: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const cancelled = await this.searchJobQueue.cancelJob(searchJobId, user.userId);
    
    if (!cancelled) {
      throw new HttpException('Search job not found or cannot be cancelled', HttpStatus.NOT_FOUND);
    }
    
    return { message: 'Search job cancelled successfully' };
  }
}
```

### Phase 7: Frontend Implementation

#### 7.1 Update Frontend API Endpoints

**my-app/lib/api/endpoints/finder.ts** - Add async methods:
```typescript
export interface SearchJobResult {
  jobId: string;
  estimatedDuration: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
}

export interface SearchJobStatus {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  currentSource?: string;
  totalSources: number;
  completedSources: number;
  partialResults?: BusinessSearchResultDto[];
  finalResults?: BusinessSearchResultDto[];
  errorMessage?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt: string;
  completedAt?: string;
}

export const finderApi = {
  // ... existing methods

  // Async search methods
  initiateAsyncSearch: (data: SearchBusinessDto): Promise<SearchJobResult> =>
    apiClient.post('/admin/finder/search-async', data),

  getSearchJobStatus: (searchJobId: string): Promise<SearchJobStatus> =>
    apiClient.get(`/admin/finder/search-status/${searchJobId}`),

  cancelSearchJob: (searchJobId: string): Promise<{ message: string }> =>
    apiClient.delete(`/admin/finder/search/${searchJobId}`),
};
```

#### 7.2 Create WebSocket Hook

**my-app/lib/hooks/useAsyncBusinessSearch.ts**:
```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { finderApi, SearchBusinessDto, BusinessSearchResultDto, SearchJobResult, SearchJobStatus } from '@/lib/api/endpoints/finder';
import { getAuthToken } from '@/lib/auth/auth-utils';

export interface SearchProgressUpdate {
  searchJobId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  totalSources?: number;
  completedSources?: number;
  partialResults?: BusinessSearchResultDto[];
  finalResults?: BusinessSearchResultDto[];
  businessSearchId?: string;
  duration?: number;
  error?: string;
}

export interface UseAsyncBusinessSearchReturn {
  // State
  searchStatus: 'idle' | 'searching' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  progressMessage: string;
  partialResults: BusinessSearchResultDto[];
  finalResults: BusinessSearchResultDto[] | null;
  currentJobId: string | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  businessSearchId: string | null;
  isConnected: boolean;

  // Actions
  startAsyncSearch: (searchData: SearchBusinessDto) => Promise<void>;
  cancelSearch: () => Promise<void>;
  clearResults: () => void;
}

export function useAsyncBusinessSearch(): UseAsyncBusinessSearchReturn {
  // State management
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'completed' | 'failed' | 'cancelled'>('idle');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [partialResults, setPartialResults] = useState<BusinessSearchResultDto[]>([]);
  const [finalResults, setFinalResults] = useState<BusinessSearchResultDto[] | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const [businessSearchId, setBusinessSearchId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket management
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token = getAuthToken();
    if (!token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/business-search`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Connected to business search WebSocket');
      
      // Clear any pending reconnection
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from business search WebSocket');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      console.error('🔌 WebSocket connection error:', error);
      
      // Attempt to reconnect after delay
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect WebSocket...');
          connectWebSocket();
        }, 5000);
      }
    });

    socket.on('search-progress', (update: SearchProgressUpdate) => {
      console.log('📡 Received search progress:', update);
      
      if (update.searchJobId === currentJobId) {
        setProgress(update.progress);
        setProgressMessage(update.message);
        
        if (update.partialResults) {
          setPartialResults(update.partialResults);
        }
        
        if (update.status === 'completed' && update.finalResults) {
          setFinalResults(update.finalResults);
          setSearchStatus('completed');
          setActualDuration(update.duration || null);
          setBusinessSearchId(update.businessSearchId || null);
          toast.success(`Search completed! Found ${update.finalResults.length} businesses in ${update.duration || 'N/A'}s`);
        } else if (update.status === 'failed') {
          setSearchStatus('failed');
          toast.error(update.message || 'Search failed');
        } else if (update.status === 'cancelled') {
          setSearchStatus('cancelled');
          toast.info('Search was cancelled');
        }
      }
    });

    socketRef.current = socket;
  }, [currentJobId]);

  // Cleanup WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Start async search
  const startAsyncSearch = useCallback(async (searchData: SearchBusinessDto) => {
    try {
      setSearchStatus('searching');
      setProgress(0);
      setProgressMessage('Initiating search...');
      setPartialResults([]);
      setFinalResults(null);
      setActualDuration(null);
      setBusinessSearchId(null);

      // Connect WebSocket if not connected
      if (!socketRef.current?.connected) {
        connectWebSocket();
      }

      // Initiate async search
      const response: SearchJobResult = await finderApi.initiateAsyncSearch(searchData);
      setCurrentJobId(response.jobId);
      setEstimatedDuration(response.estimatedDuration);
      
      toast.success(`Search started! Estimated time: ${response.estimatedDuration}s`);
    } catch (error: any) {
      setSearchStatus('failed');
      setCurrentJobId(null);
      toast.error(error.message || 'Failed to start search');
    }
  }, [connectWebSocket]);

  // Cancel search
  const cancelSearch = useCallback(async () => {
    if (currentJobId) {
      try {
        await finderApi.cancelSearchJob(currentJobId);
        setSearchStatus('cancelled');
        setCurrentJobId(null);
        toast.info('Search cancelled');
      } catch (error: any) {
        toast.error('Failed to cancel search');
      }
    }
  }, [currentJobId]);

  // Clear results
  const clearResults = useCallback(() => {
    setSearchStatus('idle');
    setCurrentJobId(null);
    setProgress(0);
    setProgressMessage('');
    setPartialResults([]);
    setFinalResults(null);
    setEstimatedDuration(null);
    setActualDuration(null);
    setBusinessSearchId(null);
  }, []);

  // Setup WebSocket connection on mount
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Auto-reconnect WebSocket when job is active
  useEffect(() => {
    if (currentJobId && !isConnected) {
      const reconnectInterval = setInterval(() => {
        if (!socketRef.current?.connected) {
          console.log('🔄 Auto-reconnecting WebSocket for active job...');
          connectWebSocket();
        }
      }, 3000);

      return () => clearInterval(reconnectInterval);
    }
  }, [currentJobId, isConnected, connectWebSocket]);

  return {
    // State
    searchStatus,
    progress,
    progressMessage,
    partialResults,
    finalResults,
    currentJobId,
    estimatedDuration,
    actualDuration,
    businessSearchId,
    isConnected,

    // Actions
    startAsyncSearch,
    cancelSearch,
    clearResults,
  };
}
```

#### 7.3 Update SearchForm Component

**my-app/components/admin/finder/SearchForm.tsx** - Add async functionality:
```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Target, Settings, X, Wifi, WifiOff } from 'lucide-react';
// ... existing imports
import { Progress } from '@/components/ui/progress';
import { useAsyncBusinessSearch } from '@/lib/hooks/useAsyncBusinessSearch';
import { SearchBusinessDto, ApiSource } from '@/lib/api/endpoints/finder';

interface SearchFormProps {
  onSearchResults?: (results: any) => void; // New optional prop for results
  availableSources: ApiSource[];
  useAsyncSearch?: boolean; // Toggle between sync/async
}

export function SearchForm({ 
  onSearchResults, 
  availableSources, 
  useAsyncSearch = true // Default to async
}: SearchFormProps) {
  // Form state (existing)
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState([5]);
  const [category, setCategory] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [limit, setLimit] = useState(20);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Async search hook
  const {
    searchStatus,
    progress,
    progressMessage,
    partialResults,
    finalResults,
    estimatedDuration,
    actualDuration,
    isConnected,
    startAsyncSearch,
    cancelSearch,
    clearResults,
  } = useAsyncBusinessSearch();

  // Initialize with all available sources
  useEffect(() => {
    if (availableSources.length > 0 && selectedSources.length === 0) {
      setSelectedSources(availableSources.map(source => source.id));
    }
  }, [availableSources, selectedSources.length]);

  // Handle results updates
  useEffect(() => {
    if (finalResults && onSearchResults) {
      onSearchResults({
        searchId: 'async-search', // Placeholder
        query,
        location,
        totalResults: finalResults.length,
        results: finalResults,
        sources: selectedSources,
        responseTime: actualDuration ? actualDuration * 1000 : 0,
        cached: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }, [finalResults, onSearchResults, query, location, selectedSources, actualDuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    if (selectedSources.length === 0) {
      toast.error('Please select at least one data source');
      return;
    }

    const searchData: SearchBusinessDto = {
      query: query.trim(),
      location: location.trim() || undefined,
      radius: radius[0],
      category: category.trim() || undefined,
      sources: selectedSources,
      limit,
    };

    if (useAsyncSearch) {
      await startAsyncSearch(searchData);
    } else {
      // Fallback to sync search (existing logic)
      // ... existing sync search implementation
    }
  };

  const handleSourceToggle = (sourceId: string, checked: boolean) => {
    if (checked) {
      setSelectedSources(prev => [...prev, sourceId]);
    } else {
      setSelectedSources(prev => prev.filter(id => id !== sourceId));
    }
  };

  const categories = [
    'restaurant', 'retail', 'healthcare', 'automotive', 'beauty',
    'fitness', 'legal', 'financial', 'real estate', 'education',
    'entertainment', 'professional services',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Business Search
          </div>
          
          {/* Connection status indicator */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <><Wifi className="h-4 w-4 text-green-500" /> Connected</>
            ) : (
              <><WifiOff className="h-4 w-4 text-red-500" /> Offline</>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Existing form fields... */}
          {/* Main search inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="query">Business Name or Category *</Label>
              <Input
                id="query"
                type="text"
                placeholder="e.g., Italian restaurants, dental clinics, auto repair"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                disabled={searchStatus === 'searching'}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="location"
                  type="text"
                  placeholder="City, State or Address"
                  className="pl-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={searchStatus === 'searching'}
                />
              </div>
            </div>
          </div>

          {/* Data sources */}
          <div>
            <Label>Data Sources</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {availableSources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center space-x-2 p-3 border rounded-lg"
                >
                  <Checkbox
                    id={source.id}
                    checked={selectedSources.includes(source.id)}
                    onCheckedChange={(checked) => 
                      handleSourceToggle(source.id, checked as boolean)
                    }
                    disabled={searchStatus === 'searching'}
                  />
                  <div className="flex-1">
                    <Label htmlFor={source.id} className="font-medium">
                      {source.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {source.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced options (existing) */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" type="button" className="w-full" disabled={searchStatus === 'searching'}>
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* ... existing advanced options ... */}
            </CollapsibleContent>
          </Collapsible>

          {/* Enhanced search button with progress */}
          <div className="space-y-4">
            {/* Search/Cancel buttons */}
            <div className="flex gap-3">
              {searchStatus === 'searching' ? (
                <Button 
                  type="button" 
                  variant="destructive"
                  className="flex-1" 
                  size="lg"
                  onClick={cancelSearch}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Search
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="flex-1" 
                  size="lg"
                  disabled={!isConnected && useAsyncSearch}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Find Businesses
                  {estimatedDuration && (
                    <span className="ml-2 text-xs opacity-75">
                      (~{estimatedDuration}s)
                    </span>
                  )}
                </Button>
              )}
              
              {(finalResults || partialResults.length > 0) && (
                <Button 
                  type="button" 
                  variant="outline"
                  size="lg"
                  onClick={clearResults}
                >
                  Clear Results
                </Button>
              )}
            </div>
            
            {/* Progress indicator */}
            {searchStatus === 'searching' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">{progressMessage}</span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                
                <Progress value={progress} className="w-full" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {partialResults.length > 0 && `${partialResults.length} results found so far`}
                  </span>
                  {estimatedDuration && actualDuration === null && (
                    <span>Est. {estimatedDuration}s remaining</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Search summary */}
            {(searchStatus === 'completed' && finalResults) && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <Target className="h-4 w-4" />
                  Search Completed Successfully!
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Found {finalResults.length} businesses
                  {actualDuration && ` in ${actualDuration} seconds`}
                </p>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Phase 8: App Module Integration

#### 8.1 Update Main App Module

**project/src/main-app/app.module.ts**:
```typescript
import { Module } from '@nestjs/common';
// ... existing imports
import { QueueModule } from './infrastructure/queue/queue.module';
import { WebSocketModule } from './infrastructure/websocket/websocket.module';

@Module({
  imports: [
    // ... existing imports
    QueueModule,
    WebSocketModule,
  ],
  // ... rest of module
})
export class MainAppModule {}
```

### Phase 9: Testing and Development

#### 9.1 Development Testing Checklist

1. **Backend Services**:
```bash
cd project
npm run start:dev
# Verify no errors in startup
# Check Redis connection in logs
# Verify WebSocket gateway starts
```

2. **Frontend Development**:
```bash
cd my-app
npm run dev
# Test WebSocket connection in browser dev tools
# Test async search functionality
```

3. **Manual Testing Steps**:
   - [ ] Start backend and frontend services
   - [ ] Navigate to Business Finder 
   - [ ] Verify WebSocket connection indicator shows "Connected"
   - [ ] Start a search and verify progress updates
   - [ ] Cancel a search mid-way
   - [ ] Complete a full search and verify results
   - [ ] Test with multiple browser tabs
   - [ ] Test offline/online scenarios

#### 9.2 Bull Dashboard Integration (Optional)

**project/src/main-app/debug/debug.controller.ts** - Add Bull dashboard:
```typescript
import { BullBoardInstance, createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

// Add to debug routes:
@Get('queue-dashboard')
async getQueueDashboard(@Res() res: Response) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/debug/queue-dashboard');

  const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullMQAdapter(this.searchQueue)],
    serverAdapter: serverAdapter,
  });

  res.redirect('/admin/debug/queue-dashboard');
}
```

### Phase 10: Production Considerations

#### 10.1 Redis Configuration Updates

**docker-compose.yml** - Update Redis for job queue:
```yaml
redis:
  image: redis:7-alpine
  container_name: loctelli_redis
  restart: unless-stopped
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru --timeout 0 --tcp-keepalive 60 --databases 16
  ports:
    - "6379:6379"
  volumes:
    - redisdata:/data
  deploy:
    resources:
      limits:
        memory: 1024M # Increased for job queue
```

#### 10.2 Environment Variables for Production

**project/.env.production**:
```env
# Job Queue Configuration
REDIS_JOB_QUEUE_URL=redis://redis:6379/1
JOB_QUEUE_CONCURRENCY=10
JOB_QUEUE_MAX_RETRIES=2

# WebSocket Configuration
WEBSOCKET_PORT=8001
WEBSOCKET_CORS_ORIGIN=https://yourdomain.com
```

#### 10.3 Monitoring and Logging

Add structured logging for job processing:
```typescript
// In job processor
this.logger.log(`Search job metrics`, {
  jobId: searchJobId,
  userId,
  duration: actualDuration,
  resultCount: finalResults.length,
  sourcesUsed: sources.length,
  cacheHit: false,
});
```

## Implementation Summary

This comprehensive guide transforms the business search from:
- **Synchronous blocking**: 10-30 second wait times
- **No progress feedback**: Users unsure if system is working  
- **All-or-nothing results**: No partial data

To:
- **Asynchronous processing**: Immediate response with job queuing
- **Real-time progress**: WebSocket updates with progress bars
- **Progressive results**: Partial results as each API source completes
- **Cancellable searches**: Users can stop long-running searches
- **Better error handling**: Granular error reporting per source

### Key Benefits:
1. **User Experience**: Immediate feedback, progress visibility, cancellation ability
2. **Scalability**: Job queue handles multiple concurrent searches
3. **Reliability**: Failed API calls don't block entire search
4. **Monitoring**: Complete visibility into search performance
5. **Compatibility**: Maintains existing export/history functionality

The implementation is production-ready with proper error handling, connection management, and cleanup processes.