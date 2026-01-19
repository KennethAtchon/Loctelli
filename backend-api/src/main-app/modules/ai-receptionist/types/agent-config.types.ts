/**
 * Local type definitions for agent configuration
 * Replaces @atchonk/ai-receptionist AgentInstanceConfig type
 */

export interface IdentityConfig {
  name?: string;
  role?: string;
  title?: string;
  backstory?: string;
  authorityLevel?: 'low' | 'medium' | 'high';
  yearsOfExperience?: number;
  specializations?: string[];
  certifications?: string[];
}

export interface CommunicationStyleConfig {
  primary:
    | 'consultative'
    | 'directive'
    | 'supportive'
    | 'analytical'
    | 'empathetic'
    | 'assertive'
    | 'casual';
  tone: 'friendly' | 'professional' | 'casual' | 'formal';
  formalityLevel: number;
}

export interface PersonalityConfig {
  traits?: Array<{ name: string; description: string }>;
  communicationStyle?: CommunicationStyleConfig | string;
  emotionalIntelligence?: 'low' | 'medium' | 'high';
  adaptability?: 'low' | 'medium' | 'high';
}

export interface KnowledgeConfig {
  domain?: string;
  expertise?: string[];
  industries?: string[];
  knownDomains?: string[];
  limitations?: string[];
  languages?: {
    fluent?: string[];
    conversational?: string[];
  };
  uncertaintyThreshold?: string;
}

export interface GoalsConfig {
  primary?: string;
  secondary?: string[];
}

export interface MemoryConfig {
  contextWindow?: number;
  autoPersist?: {
    persistAll?: boolean;
    minImportance?: number;
    types?: string[];
  };
}

export interface AgentInstanceConfig {
  identity?: IdentityConfig;
  personality?: PersonalityConfig;
  knowledge?: KnowledgeConfig;
  goals?: GoalsConfig;
  memory?: MemoryConfig;
  customSystemPrompt?: string;
}
