import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { ScrapingService } from './scraping.service';
import { 
  CreateScrapingJobDto, 
  UpdateScrapingJobDto, 
  CreateScrapingConfigDto, 
  UpdateScrapingConfigDto,
  ValidateUrlDto,
  ValidateSelectorsDto,
  JobControlDto,
  ExportResultsDto
} from './dto';
import { User } from '@prisma/client';

@Controller('scraping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  /**
   * Create new scraping job
   */
  @Post('jobs')
  async createJob(
    @CurrentUser() user: User,
    @Body() createJobDto: CreateScrapingJobDto,
  ) {
    try {
      const job = await this.scrapingService.createJob(
        user.id,
        user.subAccountId,
        createJobDto,
      );

      return {
        success: true,
        message: 'Scraping job created successfully',
        data: job,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to create scraping job');
    }
  }

  /**
   * Get user's scraping jobs (paginated)
   */
  @Get('jobs')
  async getJobs(
    @CurrentUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new BadRequestException('Page and limit must be valid numbers');
      }

      const result = await this.scrapingService.getJobs(
        user.id,
        user.subAccountId,
        pageNum,
        limitNum,
        status,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch scraping jobs');
    }
  }

  /**
   * Get specific scraping job details
   */
  @Get('jobs/:id')
  async getJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
  ) {
    try {
      const job = await this.scrapingService.getJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: job,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch scraping job');
    }
  }

  /**
   * Update scraping job
   */
  @Put('jobs/:id')
  async updateJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Body() updateJobDto: UpdateScrapingJobDto,
  ) {
    try {
      const job = await this.scrapingService.updateJob(
        jobId,
        user.id,
        user.subAccountId,
        updateJobDto,
      );

      return {
        success: true,
        message: 'Scraping job updated successfully',
        data: job,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update scraping job');
    }
  }

  /**
   * Delete scraping job
   */
  @Delete('jobs/:id')
  async deleteJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
  ) {
    try {
      const result = await this.scrapingService.deleteJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        message: 'Scraping job deleted successfully',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete scraping job');
    }
  }

  /**
   * Start/resume scraping job
   */
  @Post('jobs/:id/start')
  async startJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Body() controlDto?: JobControlDto,
  ) {
    try {
      const job = await this.scrapingService.startJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        message: 'Scraping job started successfully',
        data: job,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to start scraping job');
    }
  }

  /**
   * Pause scraping job
   */
  @Post('jobs/:id/pause')
  async pauseJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Body() controlDto?: JobControlDto,
  ) {
    try {
      const job = await this.scrapingService.pauseJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        message: 'Scraping job paused successfully',
        data: job,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to pause scraping job');
    }
  }

  /**
   * Cancel scraping job
   */
  @Post('jobs/:id/cancel')
  async cancelJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Body() controlDto?: JobControlDto,
  ) {
    try {
      const job = await this.scrapingService.cancelJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        message: 'Scraping job cancelled successfully',
        data: job,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to cancel scraping job');
    }
  }

  /**
   * Get job results (paginated)
   */
  @Get('jobs/:id/results')
  async getJobResults(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    try {
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (isNaN(pageNum) || isNaN(limitNum)) {
        throw new BadRequestException('Page and limit must be valid numbers');
      }

      const result = await this.scrapingService.getJobResults(
        jobId,
        user.id,
        user.subAccountId,
        pageNum,
        limitNum,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch job results');
    }
  }

  /**
   * Export job results
   */
  @Get('jobs/:id/export')
  async exportJobResults(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Query('format') format: 'csv' | 'json' = 'json',
    @Res() res: Response,
  ) {
    try {
      const exportData = await this.scrapingService.exportResults(
        jobId,
        user.id,
        user.subAccountId,
        format,
      );

      res.setHeader('Content-Type', exportData.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      res.send(exportData.data);
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to export job results');
    }
  }

  /**
   * Preview job results (limited)
   */
  @Get('jobs/:id/preview')
  async previewJobResults(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
    @Query('limit') limit: string = '5',
  ) {
    try {
      const limitNum = parseInt(limit, 10) || 5;
      const result = await this.scrapingService.getJobResults(
        jobId,
        user.id,
        user.subAccountId,
        1,
        limitNum,
      );

      return {
        success: true,
        data: {
          preview: result.results,
          total: result.total,
          hasMore: result.total > limitNum,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to preview job results');
    }
  }

  /**
   * Get scraping statistics
   */
  @Get('stats')
  async getStats(@CurrentUser() user: User) {
    try {
      const stats = await this.scrapingService.getStats(
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch scraping statistics');
    }
  }

  /**
   * Get dashboard data (optimized - combines multiple endpoints)
   */
  @Get('dashboard')
  async getDashboardData(@CurrentUser() user: User) {
    try {
      // Get essential data first (database queries are fast)
      const [stats, recentJobsResult, activeJobsResult] = await Promise.all([
        this.scrapingService.getStats(user.id, user.subAccountId),
        this.scrapingService.getJobs(user.id, user.subAccountId, 1, 5),
        this.scrapingService.getJobs(user.id, user.subAccountId, 1, 10, 'RUNNING'),
      ]);

      // Get service status separately with timeout to prevent blocking
      let serviceStatus;
      try {
        const statusPromise = this.scrapingService.getServiceStatus();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service status timeout')), 1000)
        );
        serviceStatus = await Promise.race([statusPromise, timeoutPromise]);
      } catch (error) {
        // Fallback service status if Redis is unavailable
        serviceStatus = {
          isHealthy: false,
          queueLength: 0,
          activeWorkers: 0,
          averageProcessingTime: 0,
          errorRate: 0,
          memoryUsage: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
          },
        };
      }

      return {
        success: true,
        data: {
          stats,
          recentJobs: recentJobsResult.jobs,
          activeJobs: activeJobsResult.jobs,
          serviceStatus,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch dashboard data');
    }
  }

  /**
   * Get real-time job status
   */
  @Get('jobs/:id/status')
  async getJobStatus(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
  ) {
    try {
      const job = await this.scrapingService.getJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: {
          id: job.id,
          status: job.status,
          progress: job.totalPages > 0 ? (job.processedPages / job.totalPages) * 100 : 0,
          totalPages: job.totalPages,
          processedPages: job.processedPages,
          extractedItems: job.extractedItems,
          errors: job.errors,
          startedAt: job.startedAt,
          updatedAt: job.updatedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get job status');
    }
  }

  /**
   * Get job execution logs
   */
  @Get('jobs/:id/logs')
  async getJobLogs(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) jobId: number,
  ) {
    try {
      const job = await this.scrapingService.getJob(
        jobId,
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: {
          logs: job.errors || [],
          lastUpdated: job.updatedAt,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get job logs');
    }
  }

  /**
   * Save scraping configuration
   */
  @Post('configs')
  async saveConfig(
    @CurrentUser() user: User,
    @Body() createConfigDto: CreateScrapingConfigDto,
  ) {
    try {
      const config = await this.scrapingService.saveConfig(
        user.id,
        user.subAccountId,
        createConfigDto,
      );

      return {
        success: true,
        message: 'Scraping configuration saved successfully',
        data: config,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to save scraping configuration');
    }
  }

  /**
   * Get saved configurations
   */
  @Get('configs')
  async getConfigs(@CurrentUser() user: User) {
    try {
      const configs = await this.scrapingService.getConfigs(
        user.id,
        user.subAccountId,
      );

      return {
        success: true,
        data: configs,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to fetch scraping configurations');
    }
  }

  /**
   * Update scraping configuration
   */
  @Put('configs/:id')
  async updateConfig(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) configId: number,
    @Body() updateConfigDto: UpdateScrapingConfigDto,
  ) {
    try {
      // TODO: Implement updateConfig method in service
      return {
        success: true,
        message: 'Configuration update not yet implemented',
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to update scraping configuration');
    }
  }

  /**
   * Delete scraping configuration
   */
  @Delete('configs/:id')
  async deleteConfig(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) configId: number,
  ) {
    try {
      // TODO: Implement deleteConfig method in service
      return {
        success: true,
        message: 'Configuration deletion not yet implemented',
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to delete scraping configuration');
    }
  }

  /**
   * Check scraping service health
   */
  @Get('service-status')
  async getServiceStatus() {
    try {
      const status = await this.scrapingService.getServiceStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to get service status');
    }
  }

  /**
   * Test URL accessibility
   */
  @Post('test-url')
  async testUrl(@Body() validateUrlDto: ValidateUrlDto) {
    try {
      const validation = await this.scrapingService.validateUrl(validateUrlDto.url);
      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to validate URL');
    }
  }

  /**
   * Validate CSS selectors
   */
  @Post('validate-selectors')
  async validateSelectors(@Body() validateSelectorsDto: ValidateSelectorsDto) {
    try {
      const validation = await this.scrapingService.validateSelectors(
        validateSelectorsDto.url,
        validateSelectorsDto.selectors,
      );
      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Failed to validate selectors');
    }
  }
}