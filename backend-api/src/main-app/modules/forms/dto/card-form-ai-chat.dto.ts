import { IsString, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CardFormAiChatMessageDto {
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;
}

export class CardFormAiChatDto {
  @IsString()
  message: string;

  /** Current card form (create/edit) sent so the AI can refine or extend it. */
  @IsOptional()
  @IsObject()
  currentCardFormPayload?: Record<string, unknown>;

  /** Conversation history for multi-turn. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardFormAiChatMessageDto)
  conversationHistory?: CardFormAiChatMessageDto[];
}
