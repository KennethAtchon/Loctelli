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
import { 
  SearchBusinessDto, 
  SearchResponseDto 
} from '../dto/search-business.dto';
import { 
  ExportResultsDto, 
  ApiKeyDto, 
  UpdateApiKeyDto 
} from '../dto/export-results.dto';
import { JwtAuthGuard } from '../../../auth/auth.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('admin/finder')
@UseGuards(JwtAuthGuard)
export class FinderController {
  constructor(
    private businessFinderService: BusinessFinderService,
    private exportService: ExportService,
    private rateLimitService: RateLimitService,
  ) {}

  @Post('search')
  async searchBusinesses(
    @Body(ValidationPipe) searchDto: SearchBusinessDto,
    @CurrentUser() user: User,
    @Req() request: Request,
  ): Promise<SearchResponseDto> {
    return this.businessFinderService.searchBusinesses(
      searchDto,
      user.id,
      user.subAccountId,
      request,
    );
  }

  @Get('results/:searchId')
  async getSearchResult(
    @Param('searchId') searchId: string,
    @CurrentUser() user: User,
  ): Promise<SearchResponseDto> {
    const result = await this.businessFinderService.getSearchResult(searchId, user.id);
    
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
    @CurrentUser() user: User,
    @Res() response: Response,
  ): Promise<void> {
    // Get the search results first
    const searchResult = await this.businessFinderService.getSearchResult(
      exportDto.searchId,
      user.id,
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
    @CurrentUser() user: User,
    @Query('subAccountId') subAccountId?: number,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    const parsedLimit = limit ? Math.min(parseInt(limit.toString()), 100) : 20;
    const parsedSubAccountId = subAccountId ? parseInt(subAccountId.toString()) : undefined;

    return this.businessFinderService.getUserSearchHistory(
      user.id,
      parsedSubAccountId,
      parsedLimit,
    );
  }

  @Get('api-keys')
  async getUserApiKeys(@CurrentUser() user: User): Promise<any[]> {
    const apiKeys = await this.businessFinderService.getUserApiKeys(user.id);
    
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
    @CurrentUser() user: User,
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
      user.id,
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
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.businessFinderService.deleteUserApiKey(user.id, service, keyName);
    return { message: 'API key deleted successfully' };
  }

  @Get('rate-limit/status')
  async getRateLimitStatus(
    @CurrentUser() user: User,
    @Query('service') service: string = 'business_finder',
  ): Promise<any> {
    return this.rateLimitService.getRateLimitStatus(user.id, service);
  }

  @Post('rate-limit/reset')
  async resetRateLimit(
    @CurrentUser() user: User,
    @Query('service') service: string = 'business_finder',
  ): Promise<{ message: string }> {
    // This endpoint should be protected by admin permissions in a real app
    await this.rateLimitService.resetUserLimit(user.id, service);
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

  @Get('stats')
  async getUsageStats(@CurrentUser() user: User): Promise<any> {
    const searchHistory = await this.businessFinderService.getUserSearchHistory(
      user.id,
      undefined,
      100,
    );

    const rateLimitStatus = await this.rateLimitService.getRateLimitStatus(
      user.id,
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