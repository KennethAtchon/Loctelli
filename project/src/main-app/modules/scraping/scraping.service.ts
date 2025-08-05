import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateScrapingJobDto, UpdateScrapingJobDto, CreateScrapingConfigDto, UpdateScrapingConfigDto } from './dto';
import { ScrapingJobStatus, ScrapingStats, ScrapingServiceStatus, UrlValidationResult, SelectorValidationResult } from './interfaces/scraping-job.interface';
import * as cheerio from 'cheerio';

@Injectable()
export class ScrapingService {
  private readonly logger = new Logger(ScrapingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('scraping') private scrapingQueue: Queue,
  ) {}

  // Job Management
  async createJob(userId: number, subAccountId: number, jobData: CreateScrapingJobDto) {
    this.logger.log(`Creating scraping job: ${jobData.name} for user: ${userId}`);
    
    try {
      // Validate URL accessibility
      const urlValidation = await this.validateUrl(jobData.targetUrl);
      if (!urlValidation.isAccessible) {
        throw new BadRequestException(`Target URL is not accessible: ${urlValidation.error}`);
      }

      const job = await this.prisma.scrapingJob.create({
        data: {
          name: jobData.name,
          description: jobData.description,
          targetUrl: jobData.targetUrl,
          maxPages: jobData.maxPages || 10,
          maxDepth: jobData.maxDepth || 2,
          selectors: jobData.selectors,
          filters: jobData.filters,
          schedule: jobData.schedule,
          userAgent: jobData.userAgent,
          delayMin: jobData.delayMin || 1000,
          delayMax: jobData.delayMax || 3000,
          timeout: jobData.timeout || 30000,
          userId,
          subAccountId,
          status: 'PENDING',
        },
      });

      this.logger.log(`✅ Scraping job created successfully: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`❌ Failed to create scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getJobs(userId: number, subAccountId: number, page: number = 1, limit: number = 10, status?: string) {
    this.logger.log(`Getting scraping jobs for user: ${userId}, subAccount: ${subAccountId}`);
    
    try {
      const skip = (page - 1) * limit;
      const where: any = {
        userId,
        subAccountId,
      };

      if (status) {
        where.status = status;
      }

      const [jobs, total] = await Promise.all([
        this.prisma.scrapingJob.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        this.prisma.scrapingJob.count({ where }),
      ]);

      return {
        jobs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get scraping jobs: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getJob(jobId: number, userId: number, subAccountId: number) {
    this.logger.log(`Getting scraping job: ${jobId} for user: ${userId}`);
    
    try {
      const job = await this.prisma.scrapingJob.findFirst({
        where: {
          id: jobId,
          userId,
          subAccountId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!job) {
        throw new NotFoundException('Scraping job not found');
      }

      return job;
    } catch (error) {
      this.logger.error(`❌ Failed to get scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateJob(jobId: number, userId: number, subAccountId: number, updateData: UpdateScrapingJobDto) {
    this.logger.log(`Updating scraping job: ${jobId} for user: ${userId}`);
    
    try {
      const existingJob = await this.getJob(jobId, userId, subAccountId);
      
      // Don't allow updates to running jobs
      if (existingJob.status === 'RUNNING') {
        throw new BadRequestException('Cannot update a running job. Please pause it first.');
      }

      // Validate URL if it's being updated
      if (updateData.targetUrl) {
        const urlValidation = await this.validateUrl(updateData.targetUrl);
        if (!urlValidation.isAccessible) {
          throw new BadRequestException(`Target URL is not accessible: ${urlValidation.error}`);
        }
      }

      const job = await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`✅ Scraping job updated successfully: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`❌ Failed to update scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteJob(jobId: number, userId: number, subAccountId: number) {
    this.logger.log(`Deleting scraping job: ${jobId} for user: ${userId}`);
    
    try {
      const existingJob = await this.getJob(jobId, userId, subAccountId);
      
      // Don't allow deletion of running jobs
      if (existingJob.status === 'RUNNING') {
        throw new BadRequestException('Cannot delete a running job. Please cancel it first.');
      }

      await this.prisma.scrapingJob.delete({
        where: { id: jobId },
      });

      this.logger.log(`✅ Scraping job deleted successfully: ${jobId}`);
      return { message: 'Job deleted successfully' };
    } catch (error) {
      this.logger.error(`❌ Failed to delete scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Job Control
  async startJob(jobId: number, userId: number, subAccountId: number) {
    this.logger.log(`Starting scraping job: ${jobId}`);
    
    try {
      const job = await this.getJob(jobId, userId, subAccountId);
      
      if (job.status === 'RUNNING') {
        throw new BadRequestException('Job is already running');
      }

      if (job.status === 'COMPLETED') {
        throw new BadRequestException('Job is already completed');
      }

      // Add job to queue for processing
      const queueJob = await this.scrapingQueue.add('scrape-website', {
        jobId: job.id,
        targetUrl: job.targetUrl,
        maxPages: job.maxPages,
        maxDepth: job.maxDepth,
        selectors: job.selectors,
        filters: job.filters,
        userAgent: job.userAgent,
        delayMin: job.delayMin,
        delayMax: job.delayMax,
        timeout: job.timeout,
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      });

      this.logger.log(`🚀 Job queued for processing: ${jobId} (Queue Job ID: ${queueJob.id})`);
      
      // The processor will update the job status to RUNNING when it starts
      return job;
    } catch (error) {
      this.logger.error(`❌ Failed to start scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async pauseJob(jobId: number, userId: number, subAccountId: number) {
    this.logger.log(`Pausing scraping job: ${jobId}`);
    
    try {
      const job = await this.getJob(jobId, userId, subAccountId);
      
      if (job.status !== 'RUNNING') {
        throw new BadRequestException('Only running jobs can be paused');
      }

      const pausedJob = await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'PAUSED',
          updatedAt: new Date(),
        },
      });

      // TODO: Remove job from queue or pause processing
      this.logger.log(`⏸️ Job paused: ${jobId}`);
      
      return pausedJob;
    } catch (error) {
      this.logger.error(`❌ Failed to pause scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelJob(jobId: number, userId: number, subAccountId: number) {
    this.logger.log(`Cancelling scraping job: ${jobId}`);
    
    try {
      const job = await this.getJob(jobId, userId, subAccountId);
      
      if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
        throw new BadRequestException('Job is already completed or cancelled');
      }

      const cancelledJob = await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // TODO: Remove job from queue and cleanup resources
      this.logger.log(`❌ Job cancelled: ${jobId}`);
      
      return cancelledJob;
    } catch (error) {
      this.logger.error(`❌ Failed to cancel scraping job: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Results & Export
  async getJobResults(jobId: number, userId: number, subAccountId: number, page: number = 1, limit: number = 50) {
    this.logger.log(`Getting results for scraping job: ${jobId}`);
    
    try {
      const job = await this.getJob(jobId, userId, subAccountId);
      
      if (!job.results) {
        return {
          results: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      const results = Array.isArray(job.results) ? job.results : [job.results];
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedResults = results.slice(start, end);

      return {
        results: paginatedResults,
        total: results.length,
        page,
        limit,
        totalPages: Math.ceil(results.length / limit),
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get job results: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exportResults(jobId: number, userId: number, subAccountId: number, format: 'csv' | 'json') {
    this.logger.log(`Exporting results for job: ${jobId} in format: ${format}`);
    
    try {
      const job = await this.getJob(jobId, userId, subAccountId);
      
      if (!job.results) {
        throw new BadRequestException('No results available for export');
      }

      const results = Array.isArray(job.results) ? job.results : [job.results];
      
      if (format === 'json') {
        return {
          filename: `scraping-job-${jobId}-results.json`,
          data: JSON.stringify(results, null, 2),
          contentType: 'application/json',
        };
      } else if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(results);
        return {
          filename: `scraping-job-${jobId}-results.csv`,
          data: csv,
          contentType: 'text/csv',
        };
      }

      throw new BadRequestException('Unsupported export format');
    } catch (error) {
      this.logger.error(`❌ Failed to export results: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Statistics
  async getStats(userId: number, subAccountId: number): Promise<ScrapingStats> {
    this.logger.log(`Getting scraping stats for user: ${userId}, subAccount: ${subAccountId}`);
    
    try {
      const [
        totalJobs,
        activeJobs,
        completedJobs,
        failedJobs,
        allJobs
      ] = await Promise.all([
        this.prisma.scrapingJob.count({
          where: { userId, subAccountId }
        }),
        this.prisma.scrapingJob.count({
          where: { userId, subAccountId, status: 'RUNNING' }
        }),
        this.prisma.scrapingJob.count({
          where: { userId, subAccountId, status: 'COMPLETED' }
        }),
        this.prisma.scrapingJob.count({
          where: { userId, subAccountId, status: 'FAILED' }
        }),
        this.prisma.scrapingJob.findMany({
          where: { userId, subAccountId, status: 'COMPLETED' },
          select: {
            totalPages: true,
            extractedItems: true,
            createdAt: true,
            completedAt: true,
          }
        })
      ]);

      const totalPagesScraped = allJobs.reduce((sum, job) => sum + job.totalPages, 0);
      const totalItemsExtracted = allJobs.reduce((sum, job) => sum + job.extractedItems, 0);
      
      const avgProcessingTime = allJobs.length > 0 
        ? allJobs.reduce((sum, job) => {
            const duration = job.completedAt && job.createdAt 
              ? new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()
              : 0;
            return sum + duration;
          }, 0) / allJobs.length / 1000 // Convert to seconds
        : 0;

      const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

      return {
        totalJobs,
        activeJobs,
        completedJobs,
        failedJobs,
        totalPagesScraped,
        totalItemsExtracted,
        averageProcessingTime: Math.round(avgProcessingTime),
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get scraping stats: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Configuration Management
  async saveConfig(userId: number, subAccountId: number, configData: CreateScrapingConfigDto) {
    this.logger.log(`Saving scraping config: ${configData.name} for user: ${userId}`);
    
    try {
      const config = await this.prisma.scrapingConfig.create({
        data: {
          name: configData.name,
          description: configData.description,
          config: configData.config,
          userId,
          subAccountId,
        },
      });

      this.logger.log(`✅ Scraping config saved successfully: ${config.id}`);
      return config;
    } catch (error) {
      this.logger.error(`❌ Failed to save scraping config: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getConfigs(userId: number, subAccountId: number) {
    this.logger.log(`Getting scraping configs for user: ${userId}, subAccount: ${subAccountId}`);
    
    try {
      const configs = await this.prisma.scrapingConfig.findMany({
        where: { userId, subAccountId },
        orderBy: { createdAt: 'desc' },
      });

      return configs;
    } catch (error) {
      this.logger.error(`❌ Failed to get scraping configs: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Utilities
  async validateUrl(url: string): Promise<UrlValidationResult> {
    this.logger.debug(`Validating URL: ${url}`);
    
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      
      // Block localhost and internal networks for security
      const hostname = urlObj.hostname.toLowerCase();
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        return {
          isValid: false,
          isAccessible: false,
          error: 'Internal/localhost URLs are not allowed for security reasons',
        };
      }

      // Test actual HTTP request to check accessibility
      try {
        const axios = require('axios');
        const response = await axios.head(url, {
          timeout: 10000,
          maxRedirects: 5,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        return {
          isValid: true,
          isAccessible: true,
          statusCode: response.status,
          title: response.headers['title'] || undefined,
        };
      } catch (httpError) {
        // If HEAD request fails, try GET request (some servers block HEAD)
        try {
          const axios = require('axios');
          const response = await axios.get(url, {
            timeout: 10000,
            maxRedirects: 5,
            maxContentLength: 1024 * 1024, // 1MB limit for validation
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
          });

          // Extract title from HTML if available
          let title;
          if (response.data && typeof response.data === 'string') {
            const $ = cheerio.load(response.data);
            title = $('title').text().trim();
          }

          return {
            isValid: true,
            isAccessible: true,
            statusCode: response.status,
            title: title || undefined,
          };
        } catch (getError) {
          return {
            isValid: true,
            isAccessible: false,
            error: `HTTP request failed: ${getError.message}`,
            statusCode: getError.response?.status,
          };
        }
      }
    } catch (error) {
      return {
        isValid: false,
        isAccessible: false,
        error: error.message,
      };
    }
  }

  async validateSelectors(url: string, selectors: Record<string, string>): Promise<SelectorValidationResult[]> {
    this.logger.debug(`Validating selectors for URL: ${url}`);
    
    // TODO: Implement actual selector validation by fetching the page
    // For now, return mock validation results
    const results: SelectorValidationResult[] = [];
    
    for (const [name, selector] of Object.entries(selectors)) {
      results.push({
        selector,
        isValid: true,
        foundElements: Math.floor(Math.random() * 10) + 1,
        sampleData: [`Sample data for ${name}`],
      });
    }

    return results;
  }

  async getServiceStatus(): Promise<ScrapingServiceStatus> {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        this.scrapingQueue.getWaiting(),
        this.scrapingQueue.getActive(),
        this.scrapingQueue.getCompleted(),
        this.scrapingQueue.getFailed(),
      ]);

      return {
        isHealthy: true,
        queueLength: waiting.length,
        activeWorkers: active.length,
        averageProcessingTime: 0, // TODO: Calculate from completed jobs
        errorRate: failed.length > 0 ? (failed.length / (completed.length + failed.length)) * 100 : 0,
        memoryUsage: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get service status: ${error.message}`);
      return {
        isHealthy: false,
        queueLength: 0,
        activeWorkers: 0,
        averageProcessingTime: 0,
        errorRate: 100,
        memoryUsage: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100,
        },
      };
    }
  }

  // Helper Methods
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }
}