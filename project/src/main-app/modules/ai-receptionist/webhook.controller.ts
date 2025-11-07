import { Controller, Post, Get, Body, Logger, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../../shared/decorators/public.decorator';
import { AgentFactoryService } from './agent-factory.service';
import { AgentConfigService } from './config/agent-config.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BookingTools } from './custom-tools/booking-tools';
import { LeadManagementTools } from './custom-tools/lead-management-tools';

/**
 * Webhook controller for AI-receptionist
 * Handles incoming webhooks from Twilio (voice/SMS) and Postmark (email)
 */
@Public()
@Controller('ai-receptionist/webhooks')
export class AIReceptionistWebhookController {
  private readonly logger = new Logger(AIReceptionistWebhookController.name);

  constructor(
    private agentFactory: AgentFactoryService,
    private agentConfig: AgentConfigService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private bookingTools: BookingTools,
    private leadManagementTools: LeadManagementTools
  ) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'ai-receptionist-webhooks',
      timestamp: new Date().toISOString(),
      factory: {
        initialized: this.agentFactory.getFactory() !== null
      }
    };
  }

  /**
   * Version endpoint - shows installed AI Receptionist package version
   */
  @Get('version')
  async getVersion() {
    try {
      const fs = require('fs');
      const path = require('path');
      const packageJsonPath = path.join(process.cwd(), 'node_modules', '@atchonk', 'ai-receptionist', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      return {
        package: '@atchonk/ai-receptionist',
        version: packageJson.version,
        description: packageJson.description,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error reading package version:', error);
      return {
        package: '@atchonk/ai-receptionist',
        version: 'unknown',
        error: 'Could not read package version',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Voice webhook endpoint (Twilio)
   * Handles incoming voice calls
   */
  @Post('voice')
  async voiceWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received voice webhook');
    this.logger.debug(`Voice webhook payload: ${JSON.stringify(body)}`);

    try {
      // Extract phone number from webhook
      const fromPhone = body.From;
      const toPhone = body.To;

      // Find lead by phone number
      const lead = await this.findLeadByPhone(fromPhone);
      
      if (!lead) {
        this.logger.warn(`No lead found for phone number: ${fromPhone}`);
        // Return error TwiML
        return res.type('text/xml').send(`
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">I'm sorry, but I couldn't find your information. Please contact support.</Say>
            <Hangup/>
          </Response>
        `);
      }

      // Get agent instance for this lead
      const agent = await this.getAgentForLead(lead.id, lead.regularUserId);

      // Handle webhook using AI-receptionist
      const twimlResponse = await agent.voice.handleWebhook({
        provider: 'twilio',
        payload: body,
        timestamp: new Date()
      });

      return res.type('text/xml').send(twimlResponse);
    } catch (error) {
      this.logger.error('Voice webhook error:', error);
      return res.status(500).type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">I apologize, but I'm experiencing technical difficulties.</Say>
          <Hangup/>
        </Response>
      `);
    }
  }

  /**
   * Voice webhook continue endpoint (Twilio gather callback)
   * Handles subsequent interactions after initial greeting
   */
  @Post('voice/continue')
  async voiceWebhookContinue(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received voice webhook continue');
    this.logger.debug(`Voice webhook continue payload: ${JSON.stringify(body)}`);

    try {
      const fromPhone = body.From;
      const lead = await this.findLeadByPhone(fromPhone);
      
      if (!lead) {
        return res.type('text/xml').send(`
          <?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="alice">I'm sorry, but I couldn't find your information.</Say>
            <Hangup/>
          </Response>
        `);
      }

      const agent = await this.getAgentForLead(lead.id, lead.regularUserId);
      const twimlResponse = await agent.voice.handleWebhook({
        provider: 'twilio',
        payload: body,
        timestamp: new Date()
      });

      return res.type('text/xml').send(twimlResponse);
    } catch (error) {
      this.logger.error('Voice webhook continue error:', error);
      return res.status(500).type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="alice">I apologize, but I'm experiencing technical difficulties.</Say>
          <Hangup/>
        </Response>
      `);
    }
  }

  /**
   * SMS webhook endpoint (Twilio)
   * Handles incoming SMS messages
   */
  @Post('sms')
  async smsWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received SMS webhook');
    this.logger.debug(`SMS webhook payload: ${JSON.stringify(body)}`);

    try {
      const fromPhone = body.From;
      const lead = await this.findLeadByPhone(fromPhone);
      
      if (!lead) {
        this.logger.warn(`No lead found for phone number: ${fromPhone}`);
        // Return empty TwiML (no response)
        return res.type('text/xml').send(`
          <?xml version="1.0" encoding="UTF-8"?>
          <Response/>
        `);
      }

      const agent = await this.getAgentForLead(lead.id, lead.regularUserId);
      const twimlResponse = await agent.sms.handleWebhook({
        provider: 'twilio',
        payload: body,
        timestamp: new Date()
      });

      return res.type('text/xml').send(twimlResponse);
    } catch (error) {
      this.logger.error('SMS webhook error:', error);
      return res.status(500).type('text/xml').send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Sorry, I'm having technical issues.</Message>
        </Response>
      `);
    }
  }

  /**
   * Email webhook endpoint (Postmark)
   * Handles incoming emails
   * 
   * Security notes:
   * - Postmark does NOT provide webhook signatures for inbound emails
   * - Recommended security: Basic auth in webhook URL, HTTPS, and IP whitelisting
   */
  @Post('email')
  async emailWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received email webhook');
    this.logger.debug(`Email webhook payload: ${JSON.stringify(body)}`);

    try {
      // Extract email from webhook (Postmark format)
      const fromEmail = body.From || body.FromEmail || body.FromFull?.Email;
      
      if (!fromEmail) {
        this.logger.warn('Email webhook missing From field');
        return res.status(400).send({
          error: 'Missing From field',
          message: 'Email webhook must include From field'
        });
      }

      // Find lead by email
      const lead = await this.findLeadByEmail(fromEmail);
      
      if (!lead) {
        this.logger.warn(`No lead found for email: ${fromEmail}`);
        // Still return success to Postmark (don't bounce)
        return res.send({ success: true, message: 'Email received but no matching lead found' });
      }

      const agent = await this.getAgentForLead(lead.id, lead.regularUserId);
      const result = await agent.email.handleWebhook({
        provider: 'postmark',
        payload: body,
        timestamp: new Date()
      }, {
        autoReply: true
      });

      return res.send(result);
    } catch (error) {
      this.logger.error('Email webhook error:', error);
      return res.status(500).send({
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Find lead by phone number
   */
  private async findLeadByPhone(phone: string) {
    if (!phone) return null;

    // Normalize phone number (remove formatting)
    const normalizedPhone = phone.replace(/\D/g, '');

    // Try exact match first
    let lead = await this.prisma.lead.findFirst({
      where: {
        phone: {
          contains: normalizedPhone
        }
      },
      include: {
        regularUser: true,
        strategy: true
      }
    });

    // If not found, try with different formats
    if (!lead) {
      const formats = [
        `+${normalizedPhone}`,
        `+1${normalizedPhone}`,
        `(${normalizedPhone.slice(0, 3)}) ${normalizedPhone.slice(3, 6)}-${normalizedPhone.slice(6)}`
      ];

      for (const format of formats) {
        lead = await this.prisma.lead.findFirst({
          where: {
            phone: {
              contains: format.replace(/\D/g, '')
            }
          },
          include: {
            regularUser: true,
            strategy: true
          }
        });
        if (lead) break;
      }
    }

    return lead;
  }

  /**
   * Find lead by email address
   */
  private async findLeadByEmail(email: string) {
    if (!email) return null;

    return await this.prisma.lead.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      include: {
        regularUser: true,
        strategy: true
      }
    });
  }

  /**
   * Get agent instance for a lead and register custom tools
   */
  private async getAgentForLead(leadId: number, userId: number) {
    const agentConfig = await this.agentConfig.getAgentConfig(userId, leadId);
    const modelConfig = this.agentConfig.getModelConfig();

    const fullAgentConfig = {
      ...agentConfig,
      model: modelConfig
    };

    const agent = await this.agentFactory.getOrCreateAgent(userId, leadId, fullAgentConfig);

    return agent;
  }
}

