import { Injectable, Logger } from '@nestjs/common';
import type { AgentInstanceConfig } from '@atchonk/ai-receptionist';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { PromptTemplatesService } from '../../prompt-templates/prompt-templates.service';

/**
 * Maps database entities (Strategy, PromptTemplate, User, Lead) to AI-receptionist agent configuration
 */
@Injectable()
export class AgentConfigMapper {
  private readonly logger = new Logger(AgentConfigMapper.name);

  constructor(
    private prisma: PrismaService,
    private promptTemplatesService: PromptTemplatesService
  ) {}

  /**
   * Map Strategy and PromptTemplate to agent identity configuration
   */
  mapIdentity(strategy: any, promptTemplate: any, user: any): AgentInstanceConfig['identity'] {
    return {
      name: strategy?.aiName || promptTemplate?.name || 'Assistant',
      role: strategy?.aiRole || promptTemplate?.category || 'Sales Representative',
      title: strategy?.name || 'Sales Specialist',
      backstory: strategy?.companyBackground || promptTemplate?.description || undefined,
      authorityLevel: 'medium' as const,
      yearsOfExperience: 5,
      specializations: this.extractSpecializations(strategy, promptTemplate),
      certifications: []
    };
  }

  /**
   * Map Strategy and PromptTemplate to agent personality configuration
   */
  mapPersonality(strategy: any, promptTemplate: any): AgentInstanceConfig['personality'] {
    const traits = this.extractTraits(strategy, promptTemplate);
    const communicationStyle = this.extractCommunicationStyle(strategy, promptTemplate);

    return {
      traits,
      communicationStyle: {
        primary: (communicationStyle.primary || 'consultative') as 'consultative' | 'assertive' | 'empathetic' | 'analytical' | 'casual',
        tone: (communicationStyle.tone || 'friendly') as 'casual' | 'friendly' | 'formal' | 'professional' | undefined,
        formalityLevel: communicationStyle.formalityLevel || 7
      },
      emotionalIntelligence: 'high' as const,
      adaptability: 'high' as const
    };
  }

  /**
   * Map Strategy and PromptTemplate to agent knowledge configuration
   */
  mapKnowledge(strategy: any, promptTemplate: any, lead: any): AgentInstanceConfig['knowledge'] {
    const contextDocs: string[] = [];

    // Add strategy context
    if (strategy?.industryContext) {
      contextDocs.push(`Industry Context: ${strategy.industryContext}`);
    }
    if (strategy?.companyBackground) {
      contextDocs.push(`Company Background: ${strategy.companyBackground}`);
    }
    if (strategy?.qualificationQuestions) {
      contextDocs.push(`Qualification Questions: ${strategy.qualificationQuestions}`);
    }
    if (strategy?.objectionHandling) {
      contextDocs.push(`Objection Handling: ${strategy.objectionHandling}`);
    }
    if (strategy?.closingStrategy) {
      contextDocs.push(`Closing Strategy: ${strategy.closingStrategy}`);
    }

    // Add prompt template context
    if (promptTemplate?.baseSystemPrompt) {
      contextDocs.push(`System Prompt: ${promptTemplate.baseSystemPrompt}`);
    }

    // Add lead-specific context
    if (lead) {
      if (lead.company) {
        contextDocs.push(`Lead Company: ${lead.company}`);
      }
      if (lead.position) {
        contextDocs.push(`Lead Position: ${lead.position}`);
      }
      if (lead.notes) {
        contextDocs.push(`Lead Notes: ${lead.notes}`);
      }
    }

    return {
      domain: strategy?.industryContext || promptTemplate?.category || 'Sales',
      expertise: this.extractExpertise(strategy, promptTemplate),
      industries: [strategy?.tag || promptTemplate?.category || 'General'],
      languages: {
        fluent: ['English'],
        conversational: []
      }
    };
  }

  /**
   * Map Strategy and PromptTemplate to agent goals configuration
   */
  mapGoals(strategy: any, promptTemplate: any): AgentInstanceConfig['goals'] {
    const primary = strategy?.closingStrategy 
      ? 'Qualify leads and book appointments using the defined closing strategy'
      : 'Qualify leads and book meetings with qualified prospects';

    const secondary: string[] = [];

    if (strategy?.qualificationQuestions) {
      secondary.push('Gather relevant information using the qualification questions');
    }
    if (strategy?.objectionHandling) {
      secondary.push('Handle objections professionally using the defined objection handling strategies');
    }
    if (strategy?.outputGuidelines) {
      secondary.push(`Follow output guidelines: ${strategy.outputGuidelines}`);
    }
    if (strategy?.prohibitedBehaviors) {
      secondary.push(`Avoid prohibited behaviors: ${strategy.prohibitedBehaviors}`);
    }

    return {
      primary,
      secondary: secondary.length > 0 ? secondary : [
        'Gather relevant information about lead needs and budget',
        'Handle objections professionally',
        'Maintain high customer satisfaction'
      ]
    };
  }

  /**
   * Extract specializations from strategy and prompt template
   */
  private extractSpecializations(strategy: any, promptTemplate: any): string[] {
    const specializations: string[] = [];

    if (strategy?.tag) {
      specializations.push(strategy.tag);
    }
    if (strategy?.industryContext) {
      specializations.push(strategy.industryContext);
    }
    if (promptTemplate?.tags && Array.isArray(promptTemplate.tags)) {
      specializations.push(...promptTemplate.tags);
    }

    return specializations.length > 0 ? specializations : ['lead qualification', 'appointment scheduling'];
  }

  /**
   * Extract traits from strategy and prompt template
   */
  private extractTraits(strategy: any, promptTemplate: any): Array<{ name: string; description: string }> {
    const traits: Array<{ name: string; description: string }> = [];

    if (strategy?.conversationTone) {
      traits.push({
        name: 'conversational',
        description: strategy.conversationTone
      });
    }

    if (strategy?.communicationStyle) {
      traits.push({
        name: 'professional',
        description: strategy.communicationStyle
      });
    }

    // Default traits if none found
    if (traits.length === 0) {
      traits.push(
        { name: 'professional', description: 'Professional and courteous in all interactions' },
        { name: 'helpful', description: 'Always eager to assist and provide value' },
        { name: 'empathetic', description: 'Understanding of customer needs and concerns' }
      );
    }

    return traits;
  }

  /**
   * Extract communication style from strategy and prompt template
   */
  private extractCommunicationStyle(strategy: any, promptTemplate: any): {
    primary?: string;
    tone?: string;
    formalityLevel?: number;
  } {
    let primary = 'consultative';
    let tone = 'friendly';
    let formalityLevel = 7;

    if (strategy?.conversationTone) {
      const toneLower = strategy.conversationTone.toLowerCase();
      if (toneLower.includes('assertive') || toneLower.includes('direct')) {
        primary = 'transactional';
        tone = 'professional';
        formalityLevel = 8;
      } else if (toneLower.includes('consultative') || toneLower.includes('helpful')) {
        primary = 'consultative';
        tone = 'friendly';
        formalityLevel = 7;
      }
    }

    return { primary, tone, formalityLevel };
  }

  /**
   * Extract expertise from strategy and prompt template
   */
  private extractExpertise(strategy: any, promptTemplate: any): string[] {
    const expertise: string[] = [];

    if (strategy?.tag) {
      expertise.push(strategy.tag);
    }
    if (strategy?.industryContext) {
      expertise.push(strategy.industryContext);
    }

    return expertise.length > 0 ? expertise : ['lead qualification', 'appointment booking', 'customer service'];
  }
}

