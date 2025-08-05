import { IsString, IsOptional, IsInt, IsUrl, IsObject, Min, Max } from 'class-validator';

export class UpdateScrapingJobDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxPages?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxDepth?: number;

  @IsOptional()
  @IsObject()
  selectors?: Record<string, string>;

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
  delayMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  delayMax?: number;

  @IsOptional()
  @IsInt()
  @Min(5000)
  @Max(120000)
  timeout?: number;
}