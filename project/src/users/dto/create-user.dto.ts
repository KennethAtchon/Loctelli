import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  budget?: string;

  @IsOptional()
  bookingsTime?: any;

  @IsInt()
  @IsOptional()
  bookingEnabled?: number = 0;

  @IsString()
  @IsOptional()
  calendarId?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  assignedUserId?: string;
}
