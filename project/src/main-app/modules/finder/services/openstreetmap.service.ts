import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { BusinessSearchResultDto } from '../dto/search-business.dto';

interface NominatimResponse {
  place_id: string;
  osm_type: string;
  osm_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  class: string;
  type: string;
  importance: number;
  addresstype?: string;
  extratags?: Record<string, string>;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  version: number;
  generator: string;
  elements: OverpassElement[];
}

@Injectable()
export class OpenStreetMapService {
  private readonly logger = new Logger(OpenStreetMapService.name);
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly overpassUrl = 'https://overpass-api.de/api/interpreter';

  async searchBusinesses(
    query: string,
    location?: string,
    radius: number = 5000,
  ): Promise<BusinessSearchResultDto[]> {
    try {
      // First, get coordinates for the location if provided
      let coordinates: { lat: number; lng: number } | undefined;
      
      if (location) {
        coordinates = await this.geocodeLocation(location);
      }

      // Search for businesses using Overpass API
      let results: BusinessSearchResultDto[] = [];

      if (coordinates) {
        // Search within radius of specific location
        results = await this.searchByCoordinates(query, coordinates, radius);
      } else {
        // Fallback to Nominatim search
        results = await this.searchByName(query);
      }

      this.logger.log(`Found ${results.length} results from OpenStreetMap`);
      return results;
    } catch (error) {
      this.logger.error(`OpenStreetMap search error: ${error.message}`, error.stack);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          throw new HttpException(
            'OpenStreetMap API rate limit exceeded',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }
      
      throw new HttpException(
        'OpenStreetMap search failed',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async geocodeLocation(location: string): Promise<{ lat: number; lng: number } | undefined> {
    try {
      const response: AxiosResponse<NominatimResponse[]> = await axios.get(this.nominatimUrl, {
        params: {
          q: location,
          format: 'json',
          limit: 1,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'BusinessFinder/1.0',
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
      }

      return undefined;
    } catch (error) {
      this.logger.warn(`Failed to geocode location "${location}": ${error.message}`);
      return undefined;
    }
  }

  private async searchByCoordinates(
    query: string,
    coordinates: { lat: number; lng: number },
    radius: number,
  ): Promise<BusinessSearchResultDto[]> {
    // Create Overpass QL query
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["name"~"${query}",i]["amenity"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        way["name"~"${query}",i]["amenity"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        relation["name"~"${query}",i]["amenity"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        node["name"~"${query}",i]["shop"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        way["name"~"${query}",i]["shop"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
        relation["name"~"${query}",i]["shop"](around:${radius * 1000},${coordinates.lat},${coordinates.lng});
      );
      out center meta;
    `;

    const response: AxiosResponse<OverpassResponse> = await axios.post(
      this.overpassUrl,
      overpassQuery,
      {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'BusinessFinder/1.0',
        },
      },
    );

    return this.transformOverpassResults(response.data.elements);
  }

  private async searchByName(query: string): Promise<BusinessSearchResultDto[]> {
    const response: AxiosResponse<NominatimResponse[]> = await axios.get(this.nominatimUrl, {
      params: {
        q: query,
        format: 'json',
        limit: 20,
        addressdetails: 1,
        extratags: 1,
      },
      headers: {
        'User-Agent': 'BusinessFinder/1.0',
      },
    });

    return this.transformNominatimResults(response.data);
  }

  private transformOverpassResults(elements: OverpassElement[]): BusinessSearchResultDto[] {
    return elements
      .filter((element) => element.tags && element.tags.name)
      .map((element) => this.transformOverpassElement(element))
      .slice(0, 20); // Limit results
  }

  private transformOverpassElement(element: OverpassElement): BusinessSearchResultDto {
    const tags = element.tags || {};
    
    return {
      id: `osm_${element.type}_${element.id}`,
      name: tags.name || 'Unknown Business',
      address: this.buildAddress(tags),
      phone: tags.phone || tags['contact:phone'],
      website: tags.website || tags['contact:website'],
      coordinates: {
        lat: element.lat || 0,
        lng: element.lon || 0,
      },
      categories: this.extractCategories(tags),
      source: 'openstreetmap',
      sourceId: `${element.type}/${element.id}`,
      businessHours: this.extractOpeningHours(tags),
    };
  }

  private transformNominatimResults(results: NominatimResponse[]): BusinessSearchResultDto[] {
    return results
      .filter((result) => this.isBusinessResult(result))
      .map((result) => this.transformNominatimResult(result))
      .slice(0, 20); // Limit results
  }

  private transformNominatimResult(result: NominatimResponse): BusinessSearchResultDto {
    const extratags = result.extratags || {};
    
    return {
      id: `osm_${result.osm_type}_${result.osm_id}`,
      name: this.extractBusinessName(result.display_name),
      address: result.display_name,
      phone: extratags.phone || extratags['contact:phone'],
      website: extratags.website || extratags['contact:website'],
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
      categories: [this.capitalizeWords(result.type)],
      source: 'openstreetmap',
      sourceId: `${result.osm_type}/${result.osm_id}`,
      businessHours: this.extractOpeningHours(extratags),
    };
  }

  private buildAddress(tags: Record<string, string>): string | undefined {
    const addressParts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
      tags['addr:postcode'],
      tags['addr:country'],
    ].filter(Boolean);

    return addressParts.length > 0 ? addressParts.join(', ') : undefined;
  }

  private extractCategories(tags: Record<string, string>): string[] {
    const categories: string[] = [];

    if (tags.amenity) {
      categories.push(this.capitalizeWords(tags.amenity));
    }
    if (tags.shop) {
      categories.push(this.capitalizeWords(tags.shop));
    }
    if (tags.cuisine) {
      categories.push(`${this.capitalizeWords(tags.cuisine)} Cuisine`);
    }

    return categories.slice(0, 3); // Limit to 3 categories
  }

  private extractOpeningHours(tags: Record<string, string>): Record<string, string> | undefined {
    const openingHours = tags.opening_hours;
    if (!openingHours) return undefined;

    // This is a simplified parser for common opening hours formats
    // OpenStreetMap opening hours can be very complex, so this covers basic cases
    const hours: Record<string, string> = {};
    
    try {
      // Handle simple formats like "Mo-Fr 09:00-17:00; Sa 09:00-12:00"
      const parts = openingHours.split(';');
      
      parts.forEach((part) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\w{2}(?:-\w{2})?)\s+(\d{2}:\d{2}-\d{2}:\d{2})$/);
        
        if (match) {
          const dayRange = match[1];
          const timeRange = match[2];
          
          if (dayRange.includes('-')) {
            // Handle day ranges like "Mo-Fr"
            const [start, end] = dayRange.split('-');
            const dayMap = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
            const fullDayMap = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            const startIdx = dayMap.indexOf(start);
            const endIdx = dayMap.indexOf(end);
            
            if (startIdx !== -1 && endIdx !== -1) {
              for (let i = startIdx; i <= endIdx; i++) {
                hours[fullDayMap[i]] = timeRange;
              }
            }
          } else {
            // Handle single days
            const dayMap: Record<string, string> = {
              'Mo': 'Monday',
              'Tu': 'Tuesday',
              'We': 'Wednesday',
              'Th': 'Thursday',
              'Fr': 'Friday',
              'Sa': 'Saturday',
              'Su': 'Sunday',
            };
            
            const fullDay = dayMap[dayRange];
            if (fullDay) {
              hours[fullDay] = timeRange;
            }
          }
        }
      });
      
      return Object.keys(hours).length > 0 ? hours : undefined;
    } catch (error) {
      this.logger.warn(`Failed to parse opening hours: ${openingHours}`);
      return undefined;
    }
  }

  private isBusinessResult(result: NominatimResponse): boolean {
    const businessTypes = [
      'amenity',
      'shop',
      'office',
      'craft',
      'healthcare',
      'leisure',
      'tourism',
    ];
    
    return businessTypes.includes(result.class);
  }

  private extractBusinessName(displayName: string): string {
    // Extract the first part before the first comma as the business name
    const parts = displayName.split(',');
    return parts[0].trim();
  }

  private capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase()).replace(/_/g, ' ');
  }
}