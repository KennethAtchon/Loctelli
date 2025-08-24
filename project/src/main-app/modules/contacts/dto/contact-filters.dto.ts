import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactStatus, Priority } from '@prisma/client';

export class ContactFiltersDto {
  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  assignedToId?: string;
}