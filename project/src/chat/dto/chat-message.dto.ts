import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class ChatMessageDto {
  @IsInt()
  clientId: number;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  role?: string = 'user';

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
