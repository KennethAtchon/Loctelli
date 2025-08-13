import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Req, 
  Res, 
  UseGuards,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessFinderService } from '../services/business-finder.service';
import { ExportService } from '../services/export.service';
import { RateLimitService } from '../services/rate-limit.service';
import { JobQueueService } from '../../../../shared/job-queue/job-queue.service';
import { 
  SearchBusinessDto, 
  SearchResponseDto 
} from '../dto/search-business.dto';
import { 
  ExportResultsDto, 
  ApiKeyDto, 
  UpdateApiKeyDto 
} from '../dto/export-results.dto';
import { JwtAuthGuard } from '../../../../shared/auth/auth.guard';
import { CurrentUser } from '../../../../shared/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('admin/finder')
@UseGuards(JwtAuthGuard)
export class FinderController {
  constructor(
    private businessFinderService: BusinessFinderService,
    private exportService: ExportService,
    private rateLimitService: RateLimitService,
    private jobQueueService: JobQueueService,
  ) {}

  @Post('search')
  async searchBusinesses(
    @Body(ValidationPipe) searchDto: SearchBusinessDto,
    @CurrentUser() user: any,
    @Req() request: Request,
  ): Promise<SearchResponseDto> {
    return this.businessFinderService.searchBusinesses(
      searchDto,
      user,
      request,
    );
  }

  @Post('search-async')
  async searchBusinessesAsync(
    @Body(ValidationPipe) searchDto: SearchBusinessDto,
    @CurrentUser() user: any,
    @Req() request: Request,
  ): Promise<{ jobId: string; message: string; status: string }> {
    // Check rate limits first
    const ipAddress = this.rateLimitService.getClientIp(request);
    const canProceed = await this.rateLimitService.checkRateLimit(
      user.userId, // Rate limiting still uses admin ID for tracking
      'business_finder',
      ipAddress,
    );

    if (!canProceed) {
      throw new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Queue the job
    const jobId = await this.jobQueueService.executeServiceMethod(
      'business-finder-search',
      'BusinessFinderService',
      'searchBusinessesAsync',
      [searchDto, user, ipAddress],
      {
        subAccountId: 'finder',
        userId: user.userId.toString(),
        context: {
          searchQuery: searchDto.query,
          location: searchDto.location,
          sources: searchDto.sources,
        },
        retries: 2,
      }
    );

    return {
      jobId,
      message: 'Search started. Use the job ID to check progress.',
      status: 'processing'
    };
  }

  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('jobId') jobId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    const jobResult = await this.jobQueueService.getJobStatus('generic-task', jobId);
    
    if (jobResult.status === 'not_found') {
      throw new HttpException(
        'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // If job is completed, get the search results
    if (jobResult.status === 'completed' && jobResult.result?.searchId) {
      const searchResult = await this.businessFinderService.getSearchResult(
        jobResult.result.searchId,
        user
      );
      
      return {
        ...jobResult,
        searchResult,
      };
    }

    return jobResult;
  }

  @Get('results/:searchId')
  async getSearchResult(
    @Param('searchId') searchId: string,
    @CurrentUser() user: any,
  ): Promise<SearchResponseDto> {
    const result = await this.businessFinderService.getSearchResult(searchId, user);
    
    if (!result) {
      throw new HttpException(
        'Search result not found or expired',
        HttpStatus.NOT_FOUND,
      );
    }

    return result;
  }

  @Post('export')
  async exportResults(
    @Body(ValidationPipe) exportDto: ExportResultsDto,
    @CurrentUser() user: any,
    @Res() response: Response,
  ): Promise<void> {
    // Get the search results first
    const searchResult = await this.businessFinderService.getSearchResult(
      exportDto.searchId,
      user,
    );

    if (!searchResult) {
      throw new HttpException(
        'Search result not found or expired',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.exportService.exportResults(
      searchResult.results,
      exportDto,
      response,
    );
  }

  @Get('export/fields')
  getAvailableFields(): { fields: string[] } {
    return {
      fields: this.exportService.getAvailableFields(),
    };
  }

  @Get('history')
  async getSearchHistory(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    const parsedLimit = limit ? Math.min(parseInt(limit.toString()), 100) : 20;

    return this.businessFinderService.getUserSearchHistory(
      user,
      parsedLimit,
    );
  }

  @Get('api-keys')
  async getUserApiKeys(@CurrentUser() user: any): Promise<any[]> {
    const apiKeys = await this.businessFinderService.getUserApiKeys(user);
    
    // Don't return the actual key values for security
    return apiKeys.map((key) => ({
      service: key.service,
      keyName: key.keyName,
      dailyLimit: key.dailyLimit,
      usageCount: key.usageCount,
      lastUsed: key.lastUsed,
    }));
  }

  @Put('api-keys')
  async saveApiKey(
    @Body(ValidationPipe) apiKeyDto: ApiKeyDto,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    // Validate service type
    const validServices = ['google_places', 'yelp'];
    if (!validServices.includes(apiKeyDto.service)) {
      throw new HttpException(
        `Invalid service. Must be one of: ${validServices.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate API key format (basic validation)
    if (!apiKeyDto.keyValue || apiKeyDto.keyValue.length < 10) {
      throw new HttpException(
        'Invalid API key format',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.businessFinderService.saveUserApiKey(
      user,
      apiKeyDto.service,
      apiKeyDto.keyName,
      apiKeyDto.keyValue,
      apiKeyDto.dailyLimit,
    );

    return { message: 'API key saved successfully' };
  }

  @Delete('api-keys/:service/:keyName')
  async deleteApiKey(
    @Param('service') service: string,
    @Param('keyName') keyName: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.businessFinderService.deleteUserApiKey(user, service, keyName);
    return { message: 'API key deleted successfully' };
  }

  @Get('rate-limit/status')
  async getRateLimitStatus(
    @CurrentUser() user: any,
    @Query('service') service: string = 'business_finder',
  ): Promise<any> {
    return this.rateLimitService.getRateLimitStatus(user.userId, service); // Rate limiting uses admin ID
  }

  @Post('rate-limit/reset')
  async resetRateLimit(
    @CurrentUser() user: any,
    @Query('service') service: string = 'business_finder',
  ): Promise<{ message: string }> {
    // This endpoint should be protected by admin permissions in a real app
    await this.rateLimitService.resetUserLimit(user.userId, service); // Rate limiting uses admin ID
    return { message: 'Rate limit reset successfully' };
  }

  @Get('sources')
  getAvailableSources(): { sources: any[] } {
    return {
      sources: [
        {
          id: 'google_places',
          name: 'Google Places',
          description: 'Comprehensive business data from Google Maps',
          requiresApiKey: true,
          freeQuota: '1,500 requests/day',
        },
        {
          id: 'yelp',
          name: 'Yelp',
          description: 'Rich business profiles with reviews and ratings',
          requiresApiKey: true,
          freeQuota: '5,000 requests/day',
        },
        {
          id: 'openstreetmap',
          name: 'OpenStreetMap',
          description: 'Open-source community-curated business data',
          requiresApiKey: false,
          freeQuota: 'Unlimited (fair use)',
        },
      ],
    };
  }

  @Get('queue/stats')
  async getQueueStats(): Promise<any> {
    return this.jobQueueService.getQueueStats('generic-task');
  }

  @Get('stats')
  async getUsageStats(@CurrentUser() user: any): Promise<any> {
    const searchHistory = await this.businessFinderService.getUserSearchHistory(
      user,
      100,
    );

    const rateLimitStatus = await this.rateLimitService.getRateLimitStatus(
      user.userId, // Rate limiting uses admin ID for tracking
      'business_finder',
    );

    const totalSearches = searchHistory.length;
    const totalResults = searchHistory.reduce((sum, search) => sum + search.totalResults, 0);
    const avgResponseTime = searchHistory.length > 0 
      ? searchHistory.reduce((sum, search) => sum + (search.responseTime || 0), 0) / searchHistory.length
      : 0;

    const sourcesUsed = searchHistory.reduce((sources, search) => {
      search.sources.forEach((source: string) => {
        sources[source] = (sources[source] || 0) + 1;
      });
      return sources;
    }, {} as Record<string, number>);

    return {
      totalSearches,
      totalResults,
      averageResponseTime: Math.round(avgResponseTime),
      sourcesUsed,
      currentUsage: rateLimitStatus.currentUsage,
      dailyLimit: rateLimitStatus.dailyLimit,
      remaining: rateLimitStatus.remaining,
      isBlocked: rateLimitStatus.isBlocked,
    };
  }
}