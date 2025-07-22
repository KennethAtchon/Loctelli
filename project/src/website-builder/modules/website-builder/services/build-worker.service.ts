import { Injectable, Logger } from '@nestjs/common';
import { BuildQueueService } from './build-queue.service';
import { NotificationService } from './notification.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../../../shared/prisma/prisma.service';
import { SecurityService } from '../security.service';
import { R2StorageService } from '../../../../shared/storage/r2-storage.service';
import { FileProcessingService } from '../../../../shared/storage/file-processing.service';

interface BuildJob {
  id: string;
  websiteId: string;
  userId: number;
  status: string;
  priority: number;
  progress: number;
  currentStep: string | null;
  logs: any;
  error: string | null;
  allocatedPort: number | null;
  previewUrl: string | null;
  notificationSent: boolean;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  website?: {
    id: string;
    name: string;
    type: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

const execAsync = promisify(exec);

export interface BuildWorker {
  jobId: string;
  process: any;
  status: 'running' | 'stopped';
  startTime: Date;
}

@Injectable()
export class BuildWorkerService {
  private readonly logger = new Logger(BuildWorkerService.name);
  private readonly activeWorkers: Map<string, BuildWorker> = new Map();
  private readonly buildDir = path.join(process.cwd(), 'builds');
  private portCounter = 3002; // Start from 3002 to avoid conflicts

  constructor(
    private readonly buildQueueService: BuildQueueService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
    private readonly r2Storage: R2StorageService,
    private readonly fileProcessing: FileProcessingService,
  ) {
    // Ensure build directory exists
    if (!fs.existsSync(this.buildDir)) {
      fs.mkdirSync(this.buildDir, { recursive: true });
    }
  }

  /**
   * Start a build worker for a job
   */
  async startWorker(jobId: string): Promise<void> {
    try {
      const job = await this.buildQueueService.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (this.activeWorkers.has(jobId)) {
        throw new Error('Worker already running for this job');
      }

      this.logger.log(`Starting build worker for job ${jobId}`);

      // Create build worker
      const worker: BuildWorker = {
        jobId,
        process: null,
        status: 'running',
        startTime: new Date(),
      };

      this.activeWorkers.set(jobId, worker);

      // Start the build process
      await this.processBuild(job);

    } catch (error) {
      this.logger.error(`Failed to start worker for job ${jobId}: ${error.message}`);
      await this.buildQueueService.failJob(jobId, { error: error.message });
      this.activeWorkers.delete(jobId);
      throw error;
    }
  }

  /**
   * Stop a build worker
   */
  async stopWorker(jobId: string): Promise<void> {
    try {
      const worker = this.activeWorkers.get(jobId);
      if (!worker) {
        throw new Error('Worker not found');
      }

      if (worker.process) {
        worker.process.kill('SIGTERM');
      }

      worker.status = 'stopped';
      this.activeWorkers.delete(jobId);

      this.logger.log(`Stopped build worker for job ${jobId}`);
    } catch (error) {
      this.logger.error(`Failed to stop worker for job ${jobId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all active workers
   */
  getActiveWorkers(): Map<string, BuildWorker> {
    return new Map(this.activeWorkers);
  }

  /**
   * Process the actual build
   */
  private async processBuild(job: BuildJob): Promise<void> {
    const jobId = job.id;
    const websiteId = job.websiteId;
    const userId = job.userId;
    const websiteName = job.website?.name || 'Unknown Website';

    try {
      // Send build started notification
      await this.notificationService.createBuildNotification(
        job.userId,
        jobId,
        'build_started',
        websiteName,
      );

      // Update job status to building
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 0,
        currentStep: 'Preparing build environment',
      });

      // Create build directory
      const buildPath = path.join(this.buildDir, jobId);
      if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true });
      }

      // Extract files (download and extract ZIP from R2)
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 10,
        currentStep: 'Extracting project files',
      });
      await this.extractFiles(job, buildPath);

      // Perform all heavy processing (analysis, validation, build, etc.)
      await this.processWebsiteBuild(websiteId, userId, buildPath);

      // Determine project type and build
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 30,
        currentStep: 'Analyzing project structure',
      });
      const projectType = await this.detectProjectType(buildPath);
      if (projectType === 'vite' || projectType === 'react') {
        await this.buildViteProject(job, buildPath);
      } else if (projectType === 'nextjs') {
        await this.buildNextProject(job, buildPath);
      } else {
        await this.buildQueueService.updateJobProgress(jobId, {
          progress: 90,
          currentStep: 'Static project - no build required',
        });
      }

      // Start preview server
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 95,
        currentStep: 'Starting preview server',
      });

      const previewUrl = await this.startPreviewServer(job, buildPath, projectType);

      // Complete the job
      await this.buildQueueService.completeJob(jobId, {
        previewUrl,
        allocatedPort: this.portCounter - 1,
      });

      // Send completion notification
      await this.notificationService.createBuildNotification(
        job.userId,
        jobId,
        'build_completed',
        websiteName,
        previewUrl,
      );

      this.logger.log(`Build completed successfully for job ${jobId}`);

    } catch (error) {
      this.logger.error(`Build failed for job ${jobId}: ${error.message}`);

      // Send failure notification
      await this.notificationService.createBuildNotification(
        job.userId,
        jobId,
        'build_failed',
        websiteName,
      );

      // Mark job as failed
      await this.buildQueueService.failJob(jobId, {
        error: error.message,
        logs: { error: error.message, stack: error.stack },
      });

    } finally {
      // Clean up worker
      this.activeWorkers.delete(jobId);
    }
  }

  /**
   * Extract project files
   */
  private async extractFiles(job: BuildJob, buildPath: string): Promise<void> {
    // For now, we'll assume files are already extracted
    // In a real implementation, you'd extract from R2 storage
    this.logger.debug(`Files would be extracted to ${buildPath}`);
  }

  /**
   * Heavy website build logic moved from uploadWebsite
   */
  private async processWebsiteBuild(websiteId: string, userId: number, buildPath: string): Promise<void> {
    // Download ZIP from R2
    const website = await this.prisma.website.findUnique({ where: { id: websiteId } });
    if (!website || !website.originalZipUrl) {
      throw new Error('Website or ZIP not found');
    }
    const zipKey = this.r2Storage.extractKeyFromUrl(website.originalZipUrl);
    const zipBuffer = await this.r2Storage.getFileContent(zipKey!);

    // Extract files and upload to R2, create file records (do NOT re-upload ZIP)
    const extractedFiles = await this.fileProcessing['extractAndUploadFiles'](websiteId, zipBuffer);
    const fileRecords = await this.fileProcessing['createFileRecords'](websiteId, extractedFiles);

    // Get file content for analysis (fetch content from R2 for each file)
    const filesWithContent: Array<{ name: string; content: string; type: string; size: number }> = [];
    for (const file of fileRecords) {
      try {
        const contentBuffer = await this.fileProcessing.getFileContent(file.websiteId, file.path);
        filesWithContent.push({
          name: file.name,
          content: contentBuffer.toString('utf8'),
          type: file.type,
          size: file.size,
        });
      } catch (error) {
        this.logger.warn(`Failed to get content for file ${file.path}: ${error.message}`);
      }
    }
    // Sanitize and validate files
    const sanitizedFiles = this.securityService.sanitizeProjectFiles(filesWithContent);
    // Validate project structure
    const structureValidation = this.securityService.validateProjectStructure(sanitizedFiles);
    // Detect website type and structure
    const websiteType = this.detectWebsiteType(sanitizedFiles);
    const structure = this.analyzeStructure(sanitizedFiles);
    // Update website with file metadata and analysis results
    const storageStats = await this.fileProcessing.getWebsiteStorageStats(websiteId);
    await this.prisma.website.update({
      where: { id: websiteId },
      data: {
        type: websiteType,
        structure,
        fileCount: storageStats.fileCount,
        totalFileSize: storageStats.totalSize,
      },
    });
    // If static, create preview URL
    if (!this.shouldBuildProject(websiteType)) {
      const htmlFile = sanitizedFiles.find(file =>
        file.name.toLowerCase().endsWith('.html') &&
        (file.name.toLowerCase() === 'index.html' || file.name.toLowerCase() === 'main.html')
      ) || sanitizedFiles.find(file => file.name.toLowerCase().endsWith('.html'));
      let previewUrl: string | null = null;
      if (htmlFile) {
        previewUrl = `/api/proxy/website-builder/${websiteId}/preview`;
      }
      await this.prisma.website.update({
        where: { id: websiteId },
        data: {
          buildStatus: previewUrl ? 'running' : 'pending',
          previewUrl: previewUrl || null,
        },
      });
    }
  }

  /**
   * Detect project type
   */
  private async detectProjectType(buildPath: string): Promise<string> {
    try {
      const packageJsonPath = path.join(buildPath, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        return 'static';
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (dependencies.next) {
        return 'nextjs';
      } else if (dependencies.vite || dependencies['@vitejs/plugin-react']) {
        return 'vite';
      } else if (dependencies.react) {
        return 'react';
      }

      return 'static';
    } catch (error) {
      this.logger.warn(`Could not detect project type: ${error.message}`);
      return 'static';
    }
  }

  private shouldBuildProject(websiteType: string): boolean {
    return ['react-vite', 'react', 'vite', 'nextjs'].includes(websiteType);
  }

  private detectWebsiteType(files: Array<{ name: string; content: string; type: string; size: number }>): string {
    const fileNames = files.map(f => f.name.toLowerCase());
    this.logger?.log?.(`🔍 Detecting website type from files: ${fileNames.slice(0, 10).join(', ')}...`);
    if (fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) {
      this.logger?.log?.(`🏷️ Detected Vite project (vite.config found)`);
      return 'vite';
    }
    if (fileNames.includes('package.json')) {
      const packageJson = files.find(f => f.name === 'package.json');
      if (packageJson) {
        try {
          const pkg = JSON.parse(packageJson.content);
          if (pkg.dependencies?.react || pkg.devDependencies?.react) {
            this.logger?.log?.(`🏷️ Detected React project (React dependency found in package.json)`);
            return 'react';
          }
        } catch (error) {
          this.logger?.warn?.(`⚠️ Failed to parse package.json: ${error.message}`);
        }
      }
    }
    if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
      this.logger?.log?.(`🏷️ Detected Next.js project (next.config found)`);
      return 'nextjs';
    }
    this.logger?.log?.(`🏷️ Defaulting to static website type`);
    return 'static';
  }

  private analyzeStructure(files: Array<{ name: string; content: string; type: string; size: number }>): Record<string, any> {
    const structure: Record<string, any> = {
      totalFiles: files.length,
      fileTypes: {},
      hasIndex: false,
      hasPackageJson: false,
      hasConfig: false,
      entryPoints: [],
    };
    for (const file of files) {
      structure.fileTypes[file.type] = (structure.fileTypes[file.type] || 0) + 1;
      if (file.name === 'index.html' || file.name === 'index.htm') {
        structure.hasIndex = true;
        structure.entryPoints.push(file.name);
      }
      if (file.name === 'package.json') {
        structure.hasPackageJson = true;
        try {
          const pkg = JSON.parse(file.content);
          structure.packageInfo = {
            name: pkg.name,
            version: pkg.version,
            scripts: pkg.scripts,
          };
        } catch (error) {
          // Ignore parsing errors
        }
      }
      if (file.name.includes('config') || file.name.includes('vite.config') || file.name.includes('next.config')) {
        structure.hasConfig = true;
      }
    }
    return structure;
  }

  /**
   * Build Vite/React project
   */
  private async buildViteProject(job: BuildJob, buildPath: string): Promise<void> {
    const jobId = job.id;

    try {
      // Install dependencies
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 40,
        currentStep: 'Installing dependencies',
      });

      await execAsync('npm install', { cwd: buildPath });

      // Run type check if TypeScript is present
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 60,
        currentStep: 'Running type check',
      });

      try {
        await execAsync('npm run type-check', { cwd: buildPath });
      } catch (error) {
        this.logger.warn(`Type check failed: ${error.message}`);
      }

      // Build the project
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 70,
        currentStep: 'Building project',
      });

      await execAsync('npm run build', { cwd: buildPath });

      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 85,
        currentStep: 'Build completed',
      });

    } catch (error) {
      throw new Error(`Vite build failed: ${error.message}`);
    }
  }

  /**
   * Build Next.js project
   */
  private async buildNextProject(job: BuildJob, buildPath: string): Promise<void> {
    const jobId = job.id;

    try {
      // Install dependencies
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 40,
        currentStep: 'Installing dependencies',
      });

      await execAsync('npm install', { cwd: buildPath });

      // Build the project
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 70,
        currentStep: 'Building Next.js project',
      });

      await execAsync('npm run build', { cwd: buildPath });

      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 85,
        currentStep: 'Next.js build completed',
      });

    } catch (error) {
      throw new Error(`Next.js build failed: ${error.message}`);
    }
  }

  /**
   * Start preview server
   */
  private async startPreviewServer(job: BuildJob, buildPath: string, projectType: string): Promise<string> {
    const jobId = job.id;
    const port = this.portCounter++;

    try {
      let command: string;
      let servePath: string;

      if (projectType === 'nextjs') {
        command = `npm start -- -p ${port}`;
        servePath = buildPath;
      } else if (projectType === 'vite' || projectType === 'react') {
        command = `npx serve dist -p ${port}`;
        servePath = path.join(buildPath, 'dist');
      } else {
        // Static project
        command = `npx serve . -p ${port}`;
        servePath = buildPath;
      }

      // Start the server
      const process = execAsync(command, { cwd: servePath });
      
      // Store the process in the worker
      const worker = this.activeWorkers.get(jobId);
      if (worker) {
        worker.process = process;
      }

      const previewUrl = `http://localhost:${port}`;
      this.logger.log(`Preview server started at ${previewUrl} for job ${jobId}`);

      return previewUrl;

    } catch (error) {
      throw new Error(`Failed to start preview server: ${error.message}`);
    }
  }

  /**
   * Clean up build directory
   */
  async cleanupBuild(jobId: string): Promise<void> {
    try {
      const buildPath = path.join(this.buildDir, jobId);
      if (fs.existsSync(buildPath)) {
        fs.rmSync(buildPath, { recursive: true, force: true });
        this.logger.log(`Cleaned up build directory for job ${jobId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup build for job ${jobId}: ${error.message}`);
    }
  }
} 