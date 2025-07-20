import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateWebsiteDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string; // 'static', 'vite', 'react', 'nextjs'

  @IsObject()
  structure: Record<string, any>; // Parsed HTML/CSS/JS structure

  @IsArray()
  files: Array<{
    name: string;
    content: string;
    type: string;
    size: number;
  }>;
} 