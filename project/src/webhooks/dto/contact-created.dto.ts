import { IsString, IsOptional } from 'class-validator';

export class ContactCreatedDto {
  @IsString()
  id: string;

  @IsString()
  locationId: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;
}
