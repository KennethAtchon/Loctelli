import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class UpdateFormSubmissionDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsInt()
  @IsOptional()
  assignedToId?: number;

  @IsObject()
  @IsOptional()
  notes?: Record<string, any>;
}