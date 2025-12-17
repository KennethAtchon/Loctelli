import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CustomFieldDto {
  @IsString()
  id: string;

  @IsString()
  value: string;
}

export class ContactCreatedDto {
  @IsString()
  type: string;

  @IsString()
  locationId: string; // GHL Subaccount/Location ID

  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  address1?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsDateString()
  @IsOptional()
  dateAdded?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsBoolean()
  @IsOptional()
  dnd?: boolean;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  website?: string;

  @IsArray()
  @IsOptional()
  attachments?: any[];

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsArray()
  @IsOptional()
  customFields?: CustomFieldDto[];
}
