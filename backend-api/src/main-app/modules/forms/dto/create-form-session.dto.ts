import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreateFormSessionDto {
  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  os?: string;
}
