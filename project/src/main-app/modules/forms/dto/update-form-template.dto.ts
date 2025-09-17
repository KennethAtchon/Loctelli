import { IsString, IsOptional, IsBoolean, IsArray, IsObject, IsInt, Min } from 'class-validator';
import { FormFieldDto } from './create-form-template.dto';

export class UpdateFormTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  schema?: FormFieldDto[];

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  submitButtonText?: string;

  @IsString()
  @IsOptional()
  successMessage?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresWakeUp?: boolean;

  @IsInt()
  @Min(10)
  @IsOptional()
  wakeUpInterval?: number;

  @IsInt()
  @IsOptional()
  subAccountId?: number;
}