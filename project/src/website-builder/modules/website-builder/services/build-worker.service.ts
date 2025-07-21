import { Injectable, Logger } from '@nestjs/common';
import { BuildQueueService } from './build-queue.service';
import { NotificationService } from './notification.service';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

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

      // Extract files (if needed)
      await this.buildQueueService.updateJobProgress(jobId, {
        progress: 10,
        currentStep: 'Extracting project files',
      });

      await this.extractFiles(job, buildPath);

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
        // Static project - no build needed
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