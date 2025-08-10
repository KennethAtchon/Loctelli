import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchBusinessDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  @Min(0.1)
  @Max(50)
  radius?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[]; // Single source: ['google_places'] OR ['yelp'] OR ['openstreetmap']

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class BusinessSearchResultDto {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: string;
  categories?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  source: string; // 'google_places', 'yelp', 'openstreetmap'
  sourceId: string; // Original ID from the source API
  businessHours?: {
    [key: string]: string;
  };
  photos?: string[];
  reviews?: {
    count: number;
    averageRating: number;
  };
}

export class SearchResponseDto {
  searchId: string;
  query: string;
  location?: string;
  totalResults: number;
  results: BusinessSearchResultDto[];
  sources: string[]; // Single source array, e.g., ['google_places']
  responseTime: number;
  cached: boolean;
  expiresAt: Date;
}