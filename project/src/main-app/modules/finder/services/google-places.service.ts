import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import { BusinessSearchResultDto } from '../dto/search-business.dto';

interface GooglePlacesSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    rating?: number;
    price_level?: number;
    types: string[];
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    photos?: Array<{
      photo_reference: string;
    }>;
    international_phone_number?: string;
    website?: string;
    user_ratings_total?: number;
  }>;
  status: string;
  next_page_token?: string;
}

interface GooglePlaceDetailsResponse {
  result: {
    international_phone_number?: string;
    website?: string;
    opening_hours?: {
      weekday_text: string[];
    };
  };
  status: string;
}

@Injectable()
export class GooglePlacesService {
  private readonly logger = new Logger(GooglePlacesService.name);
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(private configService: ConfigService) {}

  async searchBusinesses(
    query: string,
    location?: string,
    radius: number = 5000,
    apiKey?: string,
  ): Promise<BusinessSearchResultDto[]> {
    const key = apiKey || this.configService.get<string>('GOOGLE_PLACES_API_KEY');
    
    if (!key) {
      throw new HttpException(
        'Google Places API key not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      let searchUrl = `${this.baseUrl}/textsearch/json`;
      const params: Record<string, any> = {
        query,
        key,
        type: 'establishment',
      };

      if (location) {
        // If location is provided, add it to the query
        params.query = `${query} in ${location}`;
      }

      if (radius) {
        params.radius = Math.min(radius * 1000, 50000); // Convert km to meters, max 50km
      }

      this.logger.log(`Searching Google Places with query: ${params.query}`);

      const response: AxiosResponse<GooglePlacesSearchResponse> = await axios.get(
        searchUrl,
        { params },
      );

      if (response.data.status !== 'OK') {
        this.logger.warn(`Google Places API returned status: ${response.data.status}`);
        if (response.data.status === 'OVER_QUERY_LIMIT') {
          throw new HttpException(
            'Google Places API quota exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        return [];
      }

      const results = await Promise.all(
        response.data.results.map((place) => this.transformGooglePlace(place, key)),
      );

      this.logger.log(`Found ${results.length} results from Google Places`);
      return results;
    } catch (error) {
      this.logger.error(`Google Places search error: ${error.message}`, error.stack);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new HttpException(
            'Google Places API rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
      
      throw new HttpException(
        'Google Places search failed',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async transformGooglePlace(
    place: any,
    apiKey: string,
  ): Promise<BusinessSearchResultDto> {
    const result: BusinessSearchResultDto = {
      id: `google_${place.place_id}`,
      name: place.name,
      address: place.formatted_address,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      rating: place.rating,
      priceLevel: this.convertPriceLevel(place.price_level),
      categories: this.convertGoogleTypes(place.types),
      source: 'google_places',
      sourceId: place.place_id,
      photos: place.photos?.map((photo) => 
        `${this.baseUrl}/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${apiKey}`
      ) || [],
      reviews: place.user_ratings_total ? {
        count: place.user_ratings_total,
        averageRating: place.rating || 0,
      } : undefined,
    };

    // Get additional details if available
    try {
      const details = await this.getPlaceDetails(place.place_id, apiKey);
      if (details) {
        result.phone = details.international_phone_number;
        result.website = details.website;
        if (details.opening_hours?.weekday_text) {
          result.businessHours = this.convertOpeningHours(details.opening_hours.weekday_text);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to get details for place ${place.place_id}: ${error.message}`);
    }

    return result;
  }

  private async getPlaceDetails(
    placeId: string,
    apiKey: string,
  ): Promise<GooglePlaceDetailsResponse['result'] | null> {
    try {
      const response: AxiosResponse<GooglePlaceDetailsResponse> = await axios.get(
        `${this.baseUrl}/details/json`,
        {
          params: {
            place_id: placeId,
            fields: 'international_phone_number,website,opening_hours',
            key: apiKey,
          },
        },
      );

      return response.data.status === 'OK' ? response.data.result : null;
    } catch (error) {
      this.logger.warn(`Failed to fetch place details: ${error.message}`);
      return null;
    }
  }

  private convertPriceLevel(priceLevel?: number): string | undefined {
    if (priceLevel === undefined) return undefined;
    
    const levels = ['Free', 'Inexpensive', 'Moderate', 'Expensive', 'Very Expensive'];
    return levels[priceLevel] || 'Unknown';
  }

  private convertGoogleTypes(types: string[]): string[] {
    // Filter out generic types and convert to more readable format
    const typeMap: Record<string, string> = {
      'restaurant': 'Restaurant',
      'food': 'Food & Beverage',
      'store': 'Retail Store',
      'health': 'Healthcare',
      'finance': 'Financial Services',
      'lodging': 'Accommodation',
      'gas_station': 'Gas Station',
      'car_repair': 'Auto Services',
      'beauty_salon': 'Beauty & Spa',
      'gym': 'Fitness & Sports',
      'school': 'Education',
      'hospital': 'Healthcare',
      'pharmacy': 'Pharmacy',
    };

    return types
      .filter((type) => !type.includes('establishment') && !type.includes('point_of_interest'))
      .map((type) => typeMap[type] || this.capitalizeWords(type.replace(/_/g, ' ')))
      .slice(0, 3); // Limit to 3 most relevant categories
  }

  private convertOpeningHours(weekdayText: string[]): Record<string, string> {
    const hours: Record<string, string> = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    weekdayText.forEach((text, index) => {
      const day = days[index];
      const timeMatch = text.match(/:\s*(.+)/);
      hours[day] = timeMatch ? timeMatch[1] : 'Closed';
    });

    return hours;
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}