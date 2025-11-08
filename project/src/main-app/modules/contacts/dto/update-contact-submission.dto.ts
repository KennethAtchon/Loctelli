import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ContactStatus, Priority } from '@prisma/client';

export class UpdateContactSubmissionDto {
  @IsEnum(ContactStatus)
  @IsOptional()
  status?: ContactStatus;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsDateString()
  @IsOptional()
  followedUpAt?: string;
}