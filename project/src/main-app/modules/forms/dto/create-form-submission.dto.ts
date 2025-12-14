import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateFormSubmissionDto {
  @IsString()
  @IsNotEmpty()
  formTemplateId: string;

  @IsObject()
  data: Record<string, any>;

  @IsObject()
  @IsOptional()
  files?: Record<string, any>;

  @IsString()
  @IsOptional()
  source?: string = 'website';

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
