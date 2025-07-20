import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateWebsiteDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  structure?: Record<string, any>;

  @IsOptional()
  @IsArray()
  files?: Array<{
    name: string;
    content: string;
    type: string;
    size: number;
  }>;

  @IsOptional()
  @IsString()
  status?: string; // 'active', 'archived', 'draft'
} 