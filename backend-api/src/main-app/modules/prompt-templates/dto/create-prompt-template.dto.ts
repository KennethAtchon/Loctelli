import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
  IsArray,
} from 'class-validator';

export class CreatePromptTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string; // "Sales Agent", "Support Bot", "Scheduler"

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string; // "sales", "support", "scheduling"

  @IsString()
  @IsNotEmpty()
  baseSystemPrompt: string; // ONE simple sentence

  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxTokens?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
