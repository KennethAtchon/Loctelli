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
  mapKnowledge(strategy: any, promptTemplate: any): AgentInstanceConfig['knowledge'] {
    const domain = strategy?.industryContext || promptTemplate?.category || 'Sales';
    const expertise = this.extractExpertise(strategy, promptTemplate);
    const industries = this.extractIndustries(strategy, promptTemplate);
    const knownDomains = this.extractKnownDomains(strategy, promptTemplate, domain);
    const limitations = this.extractLimitations(strategy, promptTemplate);

    return {
      domain,
      expertise,
      industries,
      knownDomains,
      limitations,
      languages: {
        fluent: ['English'],
        conversational: []
      },
      uncertaintyThreshold: 'I will say "I don\'t know" when I\'m not confident in my answer or when the question is outside my expertise.'
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
      secondary.push(`Gather relevant information using the qualification questions: ${strategy.qualificationQuestions}`);
    }
    if (strategy?.objectionHandling) {
      secondary.push(`Handle objections professionally using the defined objection handling strategies: ${strategy.objectionHandling}`);
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

  /**
   * Extract industries from strategy and prompt template
   */
  private extractIndustries(strategy: any, promptTemplate: any): string[] {
    const industries: string[] = [];

    if (strategy?.tag) {
      industries.push(strategy.tag);
    }
    if (strategy?.industryContext) {
      industries.push(strategy.industryContext);
    }
    if (promptTemplate?.category) {
      industries.push(promptTemplate.category);
    }

    // Remove duplicates and return
    const uniqueIndustries = Array.from(new Set(industries));
    return uniqueIndustries.length > 0 ? uniqueIndustries : ['General'];
  }

  /**
   * Extract known domains from strategy, prompt template, and base domain
   */
  private extractKnownDomains(strategy: any, promptTemplate: any, baseDomain: string): string[] {
    const knownDomains: string[] = [baseDomain];

    if (strategy?.industryContext && !knownDomains.includes(strategy.industryContext)) {
      knownDomains.push(strategy.industryContext);
    }
    if (promptTemplate?.category && !knownDomains.includes(promptTemplate.category)) {
      knownDomains.push(promptTemplate.category);
    }

    return knownDomains;
  }

  /**
   * Extract limitations from strategy and prompt template
   */
  private extractLimitations(strategy: any, promptTemplate: any): string[] {
    const limitations: string[] = [
      'Information outside my domain of expertise',
      'Real-time data I don\'t have access to',
      'Personal opinions or subjective matters'
    ];

    // Add strategy-specific limitations if any
    if (strategy?.prohibitedBehaviors) {
      limitations.push(`Prohibited behaviors: ${strategy.prohibitedBehaviors}`);
    }

    return limitations;
  }
}

