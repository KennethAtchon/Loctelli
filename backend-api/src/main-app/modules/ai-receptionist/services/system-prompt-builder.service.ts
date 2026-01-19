import { Injectable } from '@nestjs/common';
import type { AgentInstanceConfig } from '../types/agent-config.types';

/**
 * Service for building system prompts from agent configuration
 */
@Injectable()
export class SystemPromptBuilderService {
  /**
   * Build system prompt from agent configuration
   */
  buildSystemPrompt(config: AgentInstanceConfig): string {
    const { identity, personality, knowledge, goals } = config;

    const parts: string[] = [];

    // Identity section
    if (identity?.name) {
      parts.push(`You are ${identity.name}`);
    }
    if (identity?.role) {
      parts.push(`Your role is ${identity.role}`);
    }
    if (identity?.title) {
      parts.push(`Your title is ${identity.title}`);
    }
    if (identity?.backstory) {
      parts.push(`Background: ${identity.backstory}`);
    }
    if (identity?.specializations && identity.specializations.length > 0) {
      parts.push(`Specializations: ${identity.specializations.join(', ')}`);
    }

    // Personality section
    if (personality?.traits && personality.traits.length > 0) {
      const traitDescriptions = personality.traits
        .map((t) => `${t.name}: ${t.description}`)
        .join(', ');
      parts.push(`Personality traits: ${traitDescriptions}`);
    }
    if (personality?.communicationStyle) {
      const style = personality.communicationStyle;
      if (typeof style === 'object' && style !== null) {
        parts.push(
          `Communication style: ${style.primary} tone, ${style.tone} approach, formality level ${style.formalityLevel}/10`,
        );
      } else if (typeof style === 'string') {
        parts.push(`Communication style: ${style}`);
      }
    }
    if (personality?.emotionalIntelligence) {
      parts.push(
        `Emotional intelligence: ${personality.emotionalIntelligence}`,
      );
    }
    if (personality?.adaptability) {
      parts.push(`Adaptability: ${personality.adaptability}`);
    }

    // Knowledge section
    if (knowledge?.domain) {
      parts.push(`Domain expertise: ${knowledge.domain}`);
    }
    if (knowledge?.expertise && knowledge.expertise.length > 0) {
      parts.push(`Expertise areas: ${knowledge.expertise.join(', ')}`);
    }
    if (knowledge?.industries && knowledge.industries.length > 0) {
      parts.push(`Industries: ${knowledge.industries.join(', ')}`);
    }
    if (knowledge?.knownDomains && knowledge.knownDomains.length > 0) {
      parts.push(`Known domains: ${knowledge.knownDomains.join(', ')}`);
    }
    if (knowledge?.limitations && knowledge.limitations.length > 0) {
      parts.push(`Limitations: ${knowledge.limitations.join(', ')}`);
    }
    if (knowledge?.uncertaintyThreshold) {
      parts.push(`Uncertainty handling: ${knowledge.uncertaintyThreshold}`);
    }

    // Goals section
    if (goals?.primary) {
      parts.push(`Primary goal: ${goals.primary}`);
    }
    if (goals?.secondary && goals.secondary.length > 0) {
      parts.push(`Secondary goals: ${goals.secondary.join(', ')}`);
    }

    return parts.join('\n\n');
  }
}
