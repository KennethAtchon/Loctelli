import { IsString, IsNotEmpty, Length, IsArray, ArrayMinSize, IsOptional, IsDateString } from 'class-validator';

export class CreateSmsCampaignDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100, {
    message: 'Campaign name must be between 1 and 100 characters',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1600, {
    message: 'Message must be between 1 and 1600 characters',
  })
  message: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one recipient is required' })
  @IsString({ each: true })
  recipients: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateSmsCampaignDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1600)
  message?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}