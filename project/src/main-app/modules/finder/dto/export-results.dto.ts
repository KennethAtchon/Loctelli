import { IsString, IsOptional, IsArray, IsIn, IsUUID, IsNumber, Min } from 'class-validator';

export class ExportResultsDto {
  @IsUUID()
  searchId: string;

  @IsString()
  @IsIn(['csv', 'json', 'txt', 'pdf'])
  format: 'csv' | 'json' | 'txt' | 'pdf';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[]; // Specific fields to include in export

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[]; // Filter by specific sources
}

export class ApiKeyDto {
  @IsString()
  service: string; // 'google_places', 'yelp', 'openstreetmap'

  @IsString()
  keyName: string;

  @IsString()
  keyValue: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyLimit?: number;
}

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  keyName?: string;

  @IsOptional()
  @IsString()
  keyValue?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  dailyLimit?: number;

  @IsOptional()
  isActive?: boolean;
}