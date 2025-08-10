import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { GooglePlacesService } from './google-places.service';
import { YelpService } from './yelp.service';
import { OpenStreetMapService } from './openstreetmap.service';
import { RateLimitService } from './rate-limit.service';
import { SearchBusinessDto, SearchResponseDto, BusinessSearchResultDto } from '../dto/search-business.dto';

@Injectable()
export class BusinessFinderService {
  private readonly logger = new Logger(BusinessFinderService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private googlePlacesService: GooglePlacesService,
    private yelpService: YelpService,
    private openStreetMapService: OpenStreetMapService,
    private rateLimitService: RateLimitService,
  ) {}

  async searchBusinesses(
    searchDto: SearchBusinessDto,
    userId: number,
    request?: Request,
  ): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const ipAddress = request ? this.rateLimitService.getClientIp(request) : undefined;

    // Get default SubAccount for business finder results (admin feature)
    const defaultSubAccount = await this.prisma.subAccount.findFirst({
      where: { name: 'Default SubAccount' },
    });
    
    if (!defaultSubAccount) {
      throw new HttpException(
        'Default SubAccount not found. Please contact administrator.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    
    const subAccountId = defaultSubAccount.id;

    // Check rate limits
    const canProceed = await this.rateLimitService.checkRateLimit(
      userId,
      'business_finder',
      ipAddress,
    );

    if (!canProceed) {
      throw new HttpException(
        'Rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      // Check cache first
      const searchHash = this.generateSearchHash(searchDto);
      const cachedResult = await this.getCachedResult(searchHash, userId);

      if (cachedResult) {
        this.logger.log(`Returning cached result for search: ${searchDto.query}`);
        return {
          ...cachedResult,
          cached: true,
        };
      }

      // Get user's API keys
      const userApiKeys = await this.getUserApiKeys(userId);

      // Determine which sources to use
      const sources = searchDto.sources || ['google_places', 'yelp', 'openstreetmap'];
      const availableSources = sources.filter((source) => {
        // Check if we have service keys or user has provided their own
        return this.hasApiKey(source, userApiKeys) || this.hasServiceApiKey(source);
      });

      if (availableSources.length === 0) {
        throw new HttpException(
          'No API keys available for business search',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Execute searches in parallel
      const searchPromises = availableSources.map(async (source) => {
        try {
          const apiKey = userApiKeys.find((key) => key.service === source)?.keyValue;
          return await this.searchBySource(source, searchDto, apiKey);
        } catch (error) {
          this.logger.warn(`Search failed for ${source}: ${error.message}`);
          return [];
        }
      });

      const searchResults = await Promise.all(searchPromises);
      const allResults = searchResults.flat();

      // Deduplicate and merge results
      const mergedResults = this.deduplicateResults(allResults, searchDto.limit || 20);

      // Save search to database
      const searchRecord = await this.saveSearchResult({
        searchHash,
        userId,
        subAccountId,
        searchDto,
        results: mergedResults,
        sources: availableSources,
        responseTime: Date.now() - startTime,
        apiCalls: this.countApiCalls(availableSources),
      });

      // Increment rate limit usage
      await this.rateLimitService.incrementUsage(userId, 'business_finder', ipAddress);

      const response: SearchResponseDto = {
        searchId: searchRecord.id,
        query: searchDto.query,
        location: searchDto.location,
        totalResults: mergedResults.length,
        results: mergedResults,
        sources: availableSources,
        responseTime: Date.now() - startTime,
        cached: false,
        expiresAt: searchRecord.expiresAt,
      };

      this.logger.log(
        `Business search completed: ${mergedResults.length} results from ${availableSources.length} sources`,
      );

      return response;
    } catch (error) {
      // Record rate limit violation if it's a client error
      if (error instanceof HttpException && error.getStatus() >= 400 && error.getStatus() < 500) {
        await this.rateLimitService.recordViolation(userId, 'business_finder', ipAddress);
      }

      throw error;
    }
  }

  async getSearchResult(searchId: string, userId: number): Promise<SearchResponseDto | null> {
    const searchRecord = await this.prisma.businessSearch.findFirst({
      where: {
        id: searchId,
        userId: userId,
        status: 'completed',
        expiresAt: { gte: new Date() },
      },
    });

    if (!searchRecord) {
      return null;
    }

    return {
      searchId: searchRecord.id,
      query: searchRecord.query,
      location: searchRecord.location || undefined,
      totalResults: searchRecord.totalResults,
      results: searchRecord.results as unknown as BusinessSearchResultDto[],
      sources: searchRecord.sources as string[],
      responseTime: searchRecord.responseTime || 0,
      cached: true,
      expiresAt: searchRecord.expiresAt,
    };
  }

  async getUserSearchHistory(
    userId: number,
    limit: number = 20,
  ): Promise<any[]> {
    return this.prisma.businessSearch.findMany({
      where: {
        userId,
        status: 'completed',
      },
      select: {
        id: true,
        query: true,
        location: true,
        totalResults: true,
        sources: true,
        responseTime: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUserApiKeys(userId: number): Promise<any[]> {
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        service: true,
        keyName: true,
        keyValue: true,
        dailyLimit: true,
        usageCount: true,
        lastUsed: true,
      },
    });

    // Decrypt API keys before returning
    return apiKeys.map(key => {
      try {
        return {
          ...key,
          keyValue: this.decryptApiKey(key.keyValue),
        };
      } catch (error) {
        this.logger.warn(`Failed to decrypt API key for service ${key.service}: ${error.message}`);
        // Return the key with null value if decryption fails
        return {
          ...key,
          keyValue: null,
        };
      }
    }).filter(key => key.keyValue !== null); // Filter out failed decryptions
  }

  async saveUserApiKey(
    userId: number,
    service: string,
    keyName: string,
    keyValue: string,
    dailyLimit?: number,
  ): Promise<void> {
    // In a real implementation, encrypt the API key
    const encryptedKey = this.encryptApiKey(keyValue);

    await this.prisma.apiKey.upsert({
      where: {
        userId_service_keyName: {
          userId,
          service,
          keyName,
        },
      },
      update: {
        keyValue: encryptedKey,
        dailyLimit,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        service,
        keyName,
        keyValue: encryptedKey,
        dailyLimit,
        isActive: true,
      },
    });
  }

  async deleteUserApiKey(userId: number, service: string, keyName: string): Promise<void> {
    await this.prisma.apiKey.deleteMany({
      where: {
        userId,
        service,
        keyName,
      },
    });
  }

  private async searchBySource(
    source: string,
    searchDto: SearchBusinessDto,
    apiKey?: string,
  ): Promise<BusinessSearchResultDto[]> {
    const { query, location, radius } = searchDto;

    switch (source) {
      case 'google_places':
        return this.googlePlacesService.searchBusinesses(query, location, radius, apiKey);

      case 'yelp':
        return this.yelpService.searchBusinesses(query, location, radius, apiKey);

      case 'openstreetmap':
        return this.openStreetMapService.searchBusinesses(query, location, radius);

      default:
        this.logger.warn(`Unknown search source: ${source}`);
        return [];
    }
  }

  private generateSearchHash(searchDto: SearchBusinessDto): string {
    const hashInput = JSON.stringify({
      query: searchDto.query.toLowerCase().trim(),
      location: searchDto.location?.toLowerCase().trim(),
      radius: searchDto.radius,
      category: searchDto.category?.toLowerCase().trim(),
      sources: searchDto.sources?.sort(),
    });

    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  private async getCachedResult(
    searchHash: string,
    userId: number,
  ): Promise<SearchResponseDto | null> {
    const cached = await this.prisma.businessSearch.findFirst({
      where: {
        searchHash,
        userId,
        status: 'completed',
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!cached) {
      return null;
    }

    return {
      searchId: cached.id,
      query: cached.query,
      location: cached.location || undefined,
      totalResults: cached.totalResults,
      results: cached.results as unknown as BusinessSearchResultDto[],
      sources: cached.sources as string[],
      responseTime: cached.responseTime || 0,
      cached: true,
      expiresAt: cached.expiresAt,
    };
  }

  private deduplicateResults(
    results: BusinessSearchResultDto[],
    limit: number,
  ): BusinessSearchResultDto[] {
    const uniqueResults = new Map<string, BusinessSearchResultDto>();

    for (const result of results) {
      // Create a unique key based on name and approximate location
      const key = `${result.name.toLowerCase().trim()}_${this.approximateLocation(
        result.coordinates,
      )}`;

      const existing = uniqueResults.get(key);
      if (!existing) {
        uniqueResults.set(key, result);
      } else {
        // Merge information from multiple sources
        uniqueResults.set(key, this.mergeBusinessResults(existing, result));
      }
    }

    // Sort by relevance (results with more information first)
    return Array.from(uniqueResults.values())
      .sort((a, b) => this.calculateRelevanceScore(b) - this.calculateRelevanceScore(a))
      .slice(0, limit);
  }

  private approximateLocation(coordinates?: { lat: number; lng: number }): string {
    if (!coordinates) return 'unknown';
    
    // Round to 3 decimal places for approximate matching (roughly 100m precision)
    const lat = Math.round(coordinates.lat * 1000) / 1000;
    const lng = Math.round(coordinates.lng * 1000) / 1000;
    return `${lat},${lng}`;
  }

  private mergeBusinessResults(
    existing: BusinessSearchResultDto,
    new_: BusinessSearchResultDto,
  ): BusinessSearchResultDto {
    return {
      ...existing,
      phone: existing.phone || new_.phone,
      website: existing.website || new_.website,
      rating: existing.rating || new_.rating,
      priceLevel: existing.priceLevel || new_.priceLevel,
      categories: [...new Set([...existing.categories || [], ...new_.categories || []])],
      photos: [...new Set([...existing.photos || [], ...new_.photos || []])],
      businessHours: existing.businessHours || new_.businessHours,
      reviews: existing.reviews || new_.reviews,
    };
  }

  private calculateRelevanceScore(result: BusinessSearchResultDto): number {
    let score = 0;
    
    if (result.phone) score += 10;
    if (result.website) score += 10;
    if (result.rating) score += 5;
    if (result.priceLevel) score += 3;
    if (result.categories?.length) score += result.categories.length * 2;
    if (result.businessHours) score += 8;
    if (result.photos?.length) score += Math.min(result.photos.length * 2, 10);
    if (result.reviews?.count) score += Math.min(result.reviews.count / 10, 20);

    return score;
  }

  private async saveSearchResult(params: {
    searchHash: string;
    userId: number;
    subAccountId: number;
    searchDto: SearchBusinessDto;
    results: BusinessSearchResultDto[];
    sources: string[];
    responseTime: number;
    apiCalls: Record<string, number>;
  }): Promise<any> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return this.prisma.businessSearch.create({
      data: {
        userId: params.userId,
        subAccountId: params.subAccountId,
        query: params.searchDto.query,
        location: params.searchDto.location,
        radius: params.searchDto.radius,
        category: params.searchDto.category,
        searchHash: params.searchHash,
        totalResults: params.results.length,
        results: JSON.parse(JSON.stringify(params.results)),
        sources: params.sources,
        responseTime: params.responseTime,
        apiCalls: params.apiCalls,
        status: 'completed',
        expiresAt,
      },
    });
  }

  private countApiCalls(sources: string[]): Record<string, number> {
    const calls: Record<string, number> = {};
    sources.forEach((source) => {
      calls[source] = 1; // Each search counts as 1 API call
    });
    return calls;
  }

  private hasApiKey(source: string, userKeys: any[]): boolean {
    return userKeys.some((key) => key.service === source && key.isActive);
  }

  private hasServiceApiKey(source: string): boolean {
    const serviceKeys = {
      'google_places': 'GOOGLE_PLACES_API_KEY',
      'yelp': 'YELP_API_KEY',
      'openstreetmap': true, // OSM doesn't need API key
    };

    if (source === 'openstreetmap') return true;
    
    const envKey = serviceKeys[source as keyof typeof serviceKeys];
    return typeof envKey === 'string' && !!this.configService.get<string>(envKey);
  }

  private encryptApiKey(apiKey: string): string {
    // Simple encryption for demo - use proper encryption in production
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(
      this.configService.get<string>('API_KEY_ENCRYPTION_SECRET') || 'default-secret-key-32-characters!!',
      'salt',
      32
    );
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptApiKey(encryptedKey: string): string {
    // Simple decryption for demo - use proper decryption in production
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(
      this.configService.get<string>('API_KEY_ENCRYPTION_SECRET') || 'default-secret-key-32-characters!!',
      'salt',
      32
    );
    
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}