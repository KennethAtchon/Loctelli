import {
  Controller,
  Post,
  Get,
  Body,
  Logger,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../../shared/decorators/public.decorator';
import { AgentConfigService } from './config/agent-config.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

/**
 * Webhook controller for AI-receptionist
 * Handles incoming webhooks from Twilio (voice/SMS) and Postmark (email)
 */
@Public()
@Controller('ai-receptionist/webhooks')
export class AIReceptionistWebhookController {
  private readonly logger = new Logger(AIReceptionistWebhookController.name);

  constructor(
    private agentConfig: AgentConfigService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      service: 'ai-receptionist-webhooks',
      timestamp: new Date().toISOString(),
      note: 'Webhooks temporarily disabled - migration in progress',
    };
  }

  /**
   * Version endpoint - shows installed AI Receptionist package version
   */
  @Get('version')
  getVersion() {
    return {
      package: 'Vercel AI SDK',
      version: '6.0.39',
      description: 'Migrated to Vercel AI SDK',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Voice webhook endpoint (Twilio)
   * TODO: Migrate to Vercel AI SDK - temporarily disabled
   */
  @Post('voice')
  voiceWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.warn(
      'Voice webhook called but not yet migrated to Vercel AI SDK',
    );
    return res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Voice webhooks are temporarily unavailable during migration. Please use chat instead.</Say>
        <Hangup/>
      </Response>
    `);
  }

  /**
   * Voice webhook continue endpoint (Twilio gather callback)
   * TODO: Migrate to Vercel AI SDK - temporarily disabled
   */
  @Post('voice/continue')
  voiceWebhookContinue(@Body() body: any, @Res() res: Response) {
    this.logger.warn('Voice webhook continue called but not yet migrated');
    return res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="alice">Voice webhooks are temporarily unavailable.</Say>
        <Hangup/>
      </Response>
    `);
  }

  /**
   * SMS webhook endpoint (Twilio)
   * TODO: Migrate to Vercel AI SDK - temporarily disabled
   */
  @Post('sms')
  smsWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.warn(
      'SMS webhook called but not yet migrated to Vercel AI SDK',
    );
    // Return empty response (don't send SMS back)
    return res.type('text/xml').send(`
      <?xml version="1.0" encoding="UTF-8"?>
      <Response/>
    `);
  }

  /**
   * Email webhook endpoint (Postmark)
   * TODO: Migrate to Vercel AI SDK - temporarily disabled
   */
  @Post('email')
  emailWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.warn(
      'Email webhook called but not yet migrated to Vercel AI SDK',
    );
    // Return success to Postmark (don't bounce)
    return res.send({
      success: true,
      message:
        'Email received but webhooks are temporarily unavailable during migration',
    });
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
          contains: normalizedPhone,
        },
      },
      include: {
        regularUser: true,
        strategy: true,
      },
    });

    // If not found, try with different formats
    if (!lead) {
      const formats = [
        `+${normalizedPhone}`,
        `+1${normalizedPhone}`,
        `(${normalizedPhone.slice(0, 3)}) ${normalizedPhone.slice(3, 6)}-${normalizedPhone.slice(6)}`,
      ];

      for (const format of formats) {
        lead = await this.prisma.lead.findFirst({
          where: {
            phone: {
              contains: format.replace(/\D/g, ''),
            },
          },
          include: {
            regularUser: true,
            strategy: true,
          },
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
          mode: 'insensitive',
        },
      },
      include: {
        regularUser: true,
        strategy: true,
      },
    });
  }

  // Removed getAgentForLead - no longer needed with config-based approach
}
