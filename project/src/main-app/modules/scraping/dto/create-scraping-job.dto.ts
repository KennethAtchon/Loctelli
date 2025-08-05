import { IsString, IsOptional, IsInt, IsUrl, IsObject, IsArray, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateScrapingJobDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUrl()
  targetUrl: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxPages?: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxDepth?: number = 2;

  @IsObject()
  selectors: Record<string, string>;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, any>;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsInt()
  @Min(500)
  @Max(10000)
  delayMin?: number = 1000;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  delayMax?: number = 3000;

  @IsOptional()
  @IsInt()
  @Min(5000)
  @Max(120000)
  timeout?: number = 30000;
}

export class ScrapingSelectorDto {
  @IsString()
  name: string;

  @IsString()
  selector: string;

  @IsOptional()
  @IsString()
  attribute?: string;

  @IsOptional()
  @IsBoolean()
  multiple?: boolean;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class ScrapingFilterDto {
  @IsString()
  field: string;

  @IsString()
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'exists';

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean;
}