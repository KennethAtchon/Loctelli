import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';

export class CreateScrapingConfigDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  config: Record<string, any>;
}

export class UpdateScrapingConfigDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class ValidateUrlDto {
  @IsString()
  url: string;
}

export class ValidateSelectorsDto {
  @IsString()
  url: string;

  @IsObject()
  selectors: Record<string, string>;
}

export class JobControlDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ExportResultsDto {
  @IsString()
  format: 'csv' | 'json';

  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;

  @IsOptional()
  @IsBoolean()
  compressFile?: boolean;
}