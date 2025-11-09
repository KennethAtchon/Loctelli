import { Injectable } from '@nestjs/common';
import type { AgentInstanceConfig } from '@atchonk/ai-receptionist';
import type { Strategy, PromptTemplate } from '@prisma/client';

/**
 * Maps database entities (Strategy, PromptTemplate) to AI-receptionist agent configuration
 */
@Injectable()
export class AgentConfigMapper {

  // Default constants
  private readonly DEFAULT_NAME = 'Assistant';
  private readonly DEFAULT_ROLE = 'Sales Representative';
  private readonly DEFAULT_TITLE = 'Sales Specialist';
  private readonly DEFAULT_DOMAIN = 'Sales';
  private readonly DEFAULT_AUTHORITY_LEVEL = 'medium' as const;
  private readonly DEFAULT_YEARS_EXPERIENCE = 5;
  private readonly DEFAULT_FORMALITY_LEVEL = 7;
  private readonly DEFAULT_COMMUNICATION_STYLE = {
    primary: 'consultative' as const,
    tone: 'friendly' as const,
    formalityLevel: 7
  };
  private readonly DEFAULT_SPECIALIZATIONS = ['lead qualification', 'appointment scheduling'];
  private readonly DEFAULT_EXPERTISE = ['lead qualification', 'appointment booking', 'customer service'];
  private readonly DEFAULT_INDUSTRIES = ['General'];
  private readonly DEFAULT_TRAITS = [
    { name: 'professional', description: 'Professional and courteous in all interactions' },
    { name: 'helpful', description: 'Always eager to assist and provide value' },
    { name: 'empathetic', description: 'Understanding of customer needs and concerns' }
  ];
  private readonly DEFAULT_SECONDARY_GOALS = [
    'Gather relevant information about lead needs and budget',
    'Handle objections professionally',
    'Maintain high customer satisfaction'
  ];
  private readonly DEFAULT_LIMITATIONS = [
    'Information outside my domain of expertise',
    'Real-time data I don\'t have access to',
    'Personal opinions or subjective matters'
  ];
  private readonly UNCERTAINTY_THRESHOLD = 'I will say "I don\'t know" when I\'m not confident in my answer or when the question is outside my expertise.';

  /**
   * Map Strategy and PromptTemplate to agent identity configuration
   */
  mapIdentity(
    strategy: Strategy | null,
    promptTemplate: PromptTemplate | null
  ): AgentInstanceConfig['identity'] {
    return {
      name: strategy?.aiName || promptTemplate?.name || this.DEFAULT_NAME,
      role: strategy?.aiRole || promptTemplate?.category || this.DEFAULT_ROLE,
      title: strategy?.name || this.DEFAULT_TITLE,
      backstory: strategy?.companyBackground || promptTemplate?.description || undefined,
      authorityLevel: this.DEFAULT_AUTHORITY_LEVEL,
      yearsOfExperience: this.DEFAULT_YEARS_EXPERIENCE,
      specializations: this.extractSpecializations(strategy, promptTemplate),
      certifications: []
    };
  }

  /**
   * Map Strategy to agent personality configuration
   */
  mapPersonality(strategy: Strategy | null): AgentInstanceConfig['personality'] {
    const traits = this.extractTraits(strategy);
    const communicationStyle = this.extractCommunicationStyle(strategy);

    return {
      traits,
      communicationStyle: {
        primary: communicationStyle.primary || this.DEFAULT_COMMUNICATION_STYLE.primary,
        tone: communicationStyle.tone || this.DEFAULT_COMMUNICATION_STYLE.tone,
        formalityLevel: communicationStyle.formalityLevel || this.DEFAULT_FORMALITY_LEVEL
      },
      emotionalIntelligence: 'high' as const,
      adaptability: 'high' as const
    };
  }

  /**
   * Map Strategy and PromptTemplate to agent knowledge configuration
   */
  mapKnowledge(
    strategy: Strategy | null,
    promptTemplate: PromptTemplate | null
  ): AgentInstanceConfig['knowledge'] {
    const domain = strategy?.industryContext || promptTemplate?.category || this.DEFAULT_DOMAIN;
    const expertise = this.extractExpertise(strategy);
    const industries = this.extractIndustries(strategy, promptTemplate);
    const knownDomains = this.extractKnownDomains(strategy, promptTemplate, domain);
    const limitations = this.extractLimitations(strategy);

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
      uncertaintyThreshold: this.UNCERTAINTY_THRESHOLD
    };
  }

  /**
   * Map Strategy and PromptTemplate to agent goals configuration
   */
  mapGoals(
    strategy: Strategy | null,
    promptTemplate: PromptTemplate | null
  ): AgentInstanceConfig['goals'] {
    const primary = strategy?.closingStrategy
      ? 'Qualify leads and book appointments using the defined closing strategy'
      : 'Qualify leads and book meetings with qualified prospects';

    const secondary = this.buildSecondaryGoals(strategy);

    return {
      primary,
      secondary: secondary.length > 0 ? secondary : this.DEFAULT_SECONDARY_GOALS
    };
  }

  /**
   * Extract specializations from strategy and prompt template
   */
  private extractSpecializations(
    strategy: Strategy | null,
    promptTemplate: PromptTemplate | null
  ): string[] {
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

    return specializations.length > 0 ? specializations : this.DEFAULT_SPECIALIZATIONS;
  }

  /**
   * Extract traits from strategy
   */
  private extractTraits(strategy: Strategy | null): Array<{ name: string; description: string }> {
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

    return traits.length > 0 ? traits : this.DEFAULT_TRAITS;
  }

  /**
   * Extract communication style from strategy
   */
  private extractCommunicationStyle(strategy: Strategy | null): {
    primary?: 'consultative' | 'assertive' | 'empathetic' | 'analytical' | 'casual';
    tone?: 'casual' | 'friendly' | 'formal' | 'professional';
    formalityLevel?: number;
  } {
    if (!strategy?.conversationTone) {
      return {};
    }

    const toneLower = strategy.conversationTone.toLowerCase();
    
    if (toneLower.includes('assertive') || toneLower.includes('direct')) {
      return {
        primary: 'assertive',
        tone: 'professional',
        formalityLevel: 8
      };
    }
    
    if (toneLower.includes('consultative') || toneLower.includes('helpful')) {
      return {
        primary: 'consultative',
        tone: 'friendly',
        formalityLevel: 7
      };
    }

    return {};
  }

  /**
   * Extract expertise from strategy
   */
  private extractExpertise(strategy: Strategy | null): string[] {
    const expertise: string[] = [];

    if (strategy?.tag) {
      expertise.push(strategy.tag);
    }
    if (strategy?.industryContext) {
      expertise.push(strategy.industryContext);
    }

    return expertise.length > 0 ? expertise : this.DEFAULT_EXPERTISE;
  }

  /**
   * Extract industries from strategy and prompt template
   */
  private extractIndustries(
    strategy: Strategy | null,
    promptTemplate: PromptTemplate | null
  ): string[] {
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

    const uniqueIndustries = Array.from(new Set(industries));
    return uniqueIndustries.length > 0 ? uniqueIndustries : this.DEFAULT_INDUSTRIES;
  }

  /**
   * Extract known domains from strategy, prompt template, and base domain
   */
  private extractKnownDomains(
    strategy: Strategy | null,
    promptTemplate: PromptTemplate | null,
    baseDomain: string
  ): string[] {
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
   * Extract limitations from strategy
   */
  private extractLimitations(strategy: Strategy | null): string[] {
    const limitations = [...this.DEFAULT_LIMITATIONS];

    if (strategy?.prohibitedBehaviors) {
      limitations.push(`Prohibited behaviors: ${strategy.prohibitedBehaviors}`);
    }

    return limitations;
  }

  /**
   * Build secondary goals from strategy
   */
  private buildSecondaryGoals(strategy: Strategy | null): string[] {
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

    return secondary;
  }
}

