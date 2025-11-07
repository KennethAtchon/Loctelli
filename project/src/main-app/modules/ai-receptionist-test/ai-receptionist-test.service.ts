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
              phoneNumber: this.configService.get<string>('TWILIO_PHONE_NUMBER')!,
              webhookBaseUrl: this.configService.get<string>('BASE_URL') || 'http://localhost:8000',
              voiceWebhookPath: '/ai-receptionist/webhooks/voice',
              smsWebhookPath: '/ai-receptionist/webhooks/sms',
              voice: {
                voiceId: 'Polly.Matthew' // Male voice - change to 'Polly.Joanna' for female
              }
            }
          },
          email: {
            postmark: {
              apiKey: this.configService.get<string>('POSTMARK_API_KEY')!,
              fromEmail: this.configService.get<string>('POSTMARK_FROM_EMAIL')!,
              fromName: this.configService.get<string>('POSTMARK_FROM_NAME')!,
            }
          },
          calendar: this.getGoogleCalendarConfig()
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
   * Get Google Calendar configuration
   * Returns undefined if Google credentials are not configured
   */
  private getGoogleCalendarConfig() {
    const calendarId = this.configService.get<string>('GOOGLE_CALENDAR_ID');
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    
    // Check for Service Account credentials (JSON string from env)
    const serviceAccountJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');
    let credentials: any = undefined;

    if (serviceAccountJson) {
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (error) {
        this.logger.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON, using OAuth2 credentials instead');
      }
    }

    // If no service account, try OAuth2 credentials
    if (!credentials) {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');
      
      if (clientId && clientSecret && refreshToken) {
        credentials = {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          redirect_uri: this.configService.get<string>('GOOGLE_REDIRECT_URI') || 'http://localhost:8000/oauth/callback'
        };
      }
    }

    // Only return config if we have at least calendarId and one auth method
    if (!calendarId || (!apiKey && !credentials)) {
      return undefined;
    }

    return {
      google: {
        calendarId: calendarId,
        ...(apiKey && { apiKey }),
        ...(credentials && { credentials })
      }
    };
  }

  /**
   * Get receptionist instance for direct access
   */
  getReceptionist(): AIReceptionist {
    return this.receptionist;
  }
}
