import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';

export class GenerateTextRequestDto {
  @IsNumber()
  leadId: number;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  context?: {
    userId?: number;
    strategyId?: number;
    leadData?: any;
  };
}

export class GenerateTextResponseDto {
  content: string;
  role: 'assistant';
  timestamp: string;
  metadata?: any;
}

export class AgentConfigDto {
  identity?: {
    name?: string;
    role?: string;
    organization?: string;
    title?: string;
  };
  personality?: {
    traits?: Array<{ name: string; description: string }>;
    communicationStyle?: {
      primary?: string;
      tone?: string;
      formalityLevel?: number;
    };
  };
  knowledge?: {
    domain?: string;
    expertise?: string[];
    contextDocs?: string[];
  };
  goals?: {
    primary?: string;
    secondary?: string[];
  };
  memory?: {
    contextWindow?: number;
    longTermEnabled?: boolean;
  };
}

