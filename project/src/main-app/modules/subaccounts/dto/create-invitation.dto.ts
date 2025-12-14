import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateInvitationDto {
  @IsInt()
  subAccountId: number;

  @IsString()
  @IsOptional()
  password?: string; // Optional password protection

  @IsInt()
  @IsOptional()
  @Min(1)
  maxUses?: number; // Null = unlimited

  @IsDateString()
  @IsOptional()
  expiresAt?: string; // ISO date string

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
