import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';

export enum FormType {
  SIMPLE = 'SIMPLE',
  CARD = 'CARD',
}

export class FormFieldDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type:
    | 'text'
    | 'email'
    | 'phone'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'image';

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  placeholder?: string;

  @IsArray()
  @IsOptional()
  options?: string[];

  @IsBoolean()
  @IsOptional()
  required?: boolean;
}

export class CreateFormTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(FormType)
  @IsOptional()
  formType?: FormType = FormType.SIMPLE;

  @IsArray()
  @IsObject({ each: true })
  schema: FormFieldDto[];

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
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  submitButtonText?: string = 'Submit';

  @IsString()
  @IsOptional()
  successMessage?: string = 'Thank you for your submission!';

  @IsBoolean()
  @IsOptional()
  requiresWakeUp?: boolean = true;

  @IsInt()
  @Min(10)
  @IsOptional()
  wakeUpInterval?: number = 30;

  @IsInt()
  @IsOptional()
  subAccountId?: number;
}
