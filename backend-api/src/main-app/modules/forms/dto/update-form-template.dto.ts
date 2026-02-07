import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { FormFieldDto, FormType } from './create-form-template.dto';

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

  @IsEnum(FormType)
  @IsOptional()
  formType?: FormType;

  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  schema?: FormFieldDto[];

  @IsObject()
  @IsOptional()
  cardSettings?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  profileEstimation?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  styling?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  analyticsEnabled?: boolean;

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

  @IsInt()
  @IsOptional()
  subAccountId?: number;
}
