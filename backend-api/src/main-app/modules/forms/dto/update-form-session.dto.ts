import { IsInt, IsObject, Min, IsOptional } from 'class-validator';

export class UpdateFormSessionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  currentCardIndex?: number;

  @IsOptional()
  @IsObject()
  partialData?: Record<string, unknown>;
}
