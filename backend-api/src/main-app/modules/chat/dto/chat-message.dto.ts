import {
  IsString,
  IsOptional,
  IsInt,
  IsObject,
  IsArray,
} from 'class-validator';

export class ChatMessageDto {
  @IsInt()
  leadId: number;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  role?: string = 'user';

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsArray()
  @IsOptional()
  imageData?: Array<{
    imageBase64: string;
    imageName?: string;
    imageType?: string;
  }>;
}
