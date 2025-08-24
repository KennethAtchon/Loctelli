import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateContactSubmissionDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  services: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  source?: string = 'website';
}