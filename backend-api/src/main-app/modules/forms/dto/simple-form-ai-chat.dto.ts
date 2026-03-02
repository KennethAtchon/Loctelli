import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SimpleFormAiChatMessageDto {
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;
}

export class SimpleFormAiChatDto {
  @IsString()
  message: string;

  /** Current simple form (create/edit) sent so the AI can refine or extend it. */
  @IsOptional()
  @IsObject()
  currentSimpleFormPayload?: Record<string, unknown>;

  /** Conversation history for multi-turn. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SimpleFormAiChatMessageDto)
  conversationHistory?: SimpleFormAiChatMessageDto[];
}
