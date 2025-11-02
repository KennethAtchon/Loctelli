/**
 * AI Receptionist SDK Test Service
 *
 * Handles AI Receptionist SDK integration for testing
 * NO integration with existing backend - standalone testing only
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIReceptionist } from '@atchonk/ai-receptionist';

interface AgentResponse {
  content: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AIReceptionistTestService implements OnModuleInit {
  private readonly logger = new Logger(AIReceptionistTestService.name);
  private receptionist: AIReceptionist;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize AI Receptionist on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing AI Receptionist Test Service...');

    try {
      // Create AI Receptionist instance with full SDK
      this.receptionist = new AIReceptionist({
        agent: {
          identity: {
            name: process.env.AGENT_NAME || 'Sarah',
            role: process.env.AGENT_ROLE || 'AI Sales Assistant',
            title: 'Sales Representative',
            backstory: 'Experienced sales professional specializing in lead qualification and appointment scheduling',
            authorityLevel: 'medium',
            yearsOfExperience: 5,
            specializations: ['lead qualification', 'appointment scheduling', 'customer service'],
            certifications: ['Sales Professional Certification']
          },
          personality: {
            traits: [
              { name: 'professional', description: 'Professional and courteous in all interactions' },
              { name: 'helpful', description: 'Always eager to assist and provide value' },
              { name: 'empathetic', description: 'Understanding of customer needs and concerns' }
            ],
            communicationStyle: {
              primary: 'consultative',
              tone: 'friendly',
              formalityLevel: 7
            },
            emotionalIntelligence: 'high',
            adaptability: 'high'
          },
          knowledge: {
            domain: 'Sales and Customer Service',
            expertise: ['lead qualification', 'appointment booking', 'objection handling'],
            industries: ['SaaS', 'Technology', 'Professional Services'],
            languages: {
              fluent: ['English'],
              conversational: []
            }
          },
          goals: {
            primary: 'Qualify leads and book meetings with qualified prospects',
            secondary: [
              'Gather relevant information about lead needs and budget',
              'Handle objections professionally',
              'Maintain high customer satisfaction'
            ]
          },
          memory: {
            contextWindow: 20,
            longTermEnabled: false // Use in-memory for testing
          }
        },
        model: {
          provider: 'openai',
          apiKey: this.configService.get<string>('OPENAI_API_KEY')!,
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 500
        },
        providers: {
          communication: {
            twilio: {
              accountSid: this.configService.get<string>('TWILIO_ACCOUNT_SID')!,
              authToken: this.configService.get<string>('TWILIO_AUTH_TOKEN')!,
              phoneNumber: this.configService.get<string>('TWILIO_PHONE_NUMBER')!
            }
          },
          email: {
            postmark: {
              apiKey: this.configService.get<string>('POSTMARK_API_KEY')!,
              fromEmail: this.configService.get<string>('POSTMARK_FROM_EMAIL')!,
              fromName: this.configService.get<string>('POSTMARK_FROM_NAME')!,
            }
          }
        },
        debug: process.env.DEBUG === 'true'
      });

      // Initialize receptionist
      await this.receptionist.initialize();

      this.logger.log('✅ AI Receptionist Test Service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AI Receptionist:', error);
      throw error;
    }
  }

  /**
   * Get receptionist instance for direct access
   */
  getReceptionist(): AIReceptionist {
    return this.receptionist;
  }
}
