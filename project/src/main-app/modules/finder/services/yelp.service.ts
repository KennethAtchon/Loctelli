import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { BusinessSearchResultDto } from '../dto/search-business.dto';

interface YelpSearchResponse {
  businesses: Array<{
    id: string;
    name: string;
    url: string;
    phone: string;
    display_phone: string;
    location: {
      address1: string;
      address2?: string;
      address3?: string;
      city: string;
      zip_code: string;
      country: string;
      state: string;
      display_address: string[];
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    photos: string[];
    categories: Array<{
      alias: string;
      title: string;
    }>;
    rating: number;
    review_count: number;
    price?: string;
    hours?: Array<{
      open: Array<{
        is_overnight: boolean;
        start: string;
        end: string;
        day: number;
      }>;
      hours_type: string;
      is_open_now: boolean;
    }>;
  }>;
  total: number;
  region: {
    center: {
      longitude: number;
      latitude: number;
    };
  };
}

@Injectable()
export class YelpService {
  private readonly logger = new Logger(YelpService.name);
  private readonly baseUrl = 'https://api.yelp.com/v3';

  constructor(private configService: ConfigService) {}

  async searchBusinesses(
    query: string,
    location?: string,
    radius: number = 5000,
    apiKey?: string,
  ): Promise<BusinessSearchResultDto[]> {
    const key = apiKey || this.configService.get<string>('YELP_API_KEY');
    
    if (!key) {
      throw new HttpException(
        'Yelp API key not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      const params: Record<string, any> = {
        term: query,
        limit: 50,
        radius: Math.min(radius * 1000, 40000), // Convert km to meters, max 40km for Yelp
      };

      if (location) {
        params.location = location;
      } else {
        // Default to a broad location if none provided
        params.location = 'United States';
      }

      this.logger.log(`Searching Yelp with term: ${params.term}, location: ${params.location}`);

      const response: AxiosResponse<YelpSearchResponse> = await axios.get(
        `${this.baseUrl}/businesses/search`,
        {
          params,
          headers: {
            'Authorization': `Bearer ${key}`,
          },
        },
      );

      const results = response.data.businesses.map((business) =>
        this.transformYelpBusiness(business),
      );

      this.logger.log(`Found ${results.length} results from Yelp`);
      return results;
    } catch (error) {
      this.logger.error(`Yelp search error: ${error.message}`, error.stack);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new HttpException(
            'Yelp API rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        if (error.response?.status === 401) {
          throw new HttpException(
            'Invalid Yelp API key',
            HttpStatus.UNAUTHORIZED,
          );
        }
      }
      
      throw new HttpException(
        'Yelp search failed',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private transformYelpBusiness(business: any): BusinessSearchResultDto {
    return {
      id: `yelp_${business.id}`,
      name: business.name,
      address: business.location.display_address.join(', '),
      phone: business.display_phone,
      website: business.url,
      rating: business.rating,
      priceLevel: this.convertYelpPrice(business.price),
      categories: business.categories?.map((cat: any) => cat.title) || [],
      coordinates: {
        lat: business.coordinates.latitude,
        lng: business.coordinates.longitude,
      },
      source: 'yelp',
      sourceId: business.id,
      photos: business.photos || [],
      reviews: {
        count: business.review_count,
        averageRating: business.rating,
      },
      businessHours: business.hours?.[0]?.open
        ? this.convertYelpHours(business.hours[0].open)
        : undefined,
    };
  }

  private convertYelpPrice(price?: string): string | undefined {
    if (!price) return undefined;
    
    const priceMap: Record<string, string> = {
      '$': 'Inexpensive',
      '$$': 'Moderate',
      '$$$': 'Expensive',
      '$$$$': 'Very Expensive',
    };
    
    return priceMap[price] || price;
  }

  private convertYelpHours(hours: any[]): Record<string, string> {
    const dayMap = [
      'Monday',
      'Tuesday', 
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    const businessHours: Record<string, string> = {};
    
    // Initialize all days as closed
    dayMap.forEach((day) => {
      businessHours[day] = 'Closed';
    });

    // Map Yelp hours to our format
    hours.forEach((hour) => {
      const day = dayMap[hour.day];
      if (day) {
        const startTime = this.formatYelpTime(hour.start);
        const endTime = this.formatYelpTime(hour.end);
        businessHours[day] = `${startTime} - ${endTime}`;
      }
    });

    return businessHours;
  }

  private formatYelpTime(time: string): string {
    // Convert HHMM format to HH:MM AM/PM
    if (time.length !== 4) return time;
    
    const hours = parseInt(time.substring(0, 2));
    const minutes = time.substring(2);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${ampm}`;
  }
}