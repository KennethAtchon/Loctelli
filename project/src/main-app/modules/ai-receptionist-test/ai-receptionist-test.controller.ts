/**
 * AI Receptionist SDK Test Controller
 *
 * Dedicated test routes for AI Receptionist SDK
 * NO integration with existing backend - standalone testing only
 */

import { Controller, Post, Get, Body, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { AIReceptionistTestService } from './ai-receptionist-test.service';
import { Public } from '../../../shared/decorators/public.decorator';

@Public()
@Controller('ai-receptionist')
export class AIReceptionistTestController {
  private readonly logger = new Logger(AIReceptionistTestController.name);

  constructor(
    private readonly aiReceptionistTestService: AIReceptionistTestService
  ) {}

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'ai-receptionist-webhook-test',
      timestamp: new Date().toISOString(),
      agent: {
        name: process.env.AGENT_NAME || 'Emma',
        initialized: true
      }
    };
  }

  /**
   * Version endpoint - shows installed AI Receptionist package version
   */
  @Get('version')
  async getVersion() {
    try {
      // Read package.json from node_modules directly using fs
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
   * Root endpoint
   */
  @Get()
  getRoot() {
    return {
      message: 'AI Receptionist Webhook Test Server',
      endpoints: {
        health: '/health',
        version: '/version',
        webhooks: {
          voice: 'POST /webhooks/voice',
          sms: 'POST /webhooks/sms',
          email: 'POST /webhooks/email'
        },
        test: {
          voice: 'POST /test/voice',
          sms: 'POST /test/sms',
          email: 'POST /test/email',
          askAiEmail: 'GET /test/ask-ai-email'
        }
      }
    };
  }

  /**
   * Voice webhook endpoint (Twilio)
   */
  @Post('webhooks/voice')
  async voiceWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received voice webhook');
    this.logger.debug(JSON.stringify({ payload: body }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const twimlResponse = await receptionist.handleVoiceWebhook(body);
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
  @Post('webhooks/voice/continue')
  async voiceWebhookContinue(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received voice webhook continue');
    this.logger.debug(JSON.stringify({ payload: body }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const twimlResponse = await receptionist.handleVoiceWebhook(body);
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
   */
  @Post('webhooks/sms')
  async smsWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received SMS webhook');
    this.logger.debug(JSON.stringify({ payload: body }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const twimlResponse = await receptionist.handleSMSWebhook(body);
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
   *
   * Security notes:
   * - Postmark does NOT provide webhook signatures for inbound emails
   * - Recommended security: Basic auth in webhook URL, HTTPS, and IP whitelisting
   * - Configure webhook URL in Postmark with: https://api.loctelli.com/ai-receptionist/webhooks/email
   */
  @Post('webhooks/email')
  async emailWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.log('Received email webhook');
    this.logger.debug(JSON.stringify({ payload: body }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const result = await receptionist.handleEmailWebhook(body);
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
   * Test voice endpoint
   */
  @Post('test/voice')
  async testVoice(@Body() body: { from?: string }) {
    const testPayload = {
      From: body?.from || '+1234567890',
      To: process.env.TWILIO_PHONE_NUMBER || '+0987654321',
      CallSid: `TEST_${Date.now()}`,
      CallStatus: 'in-progress',
      Direction: 'inbound'
    };

    this.logger.log(JSON.stringify({ payload: testPayload, message: 'Testing voice webhook' }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const result = await receptionist.handleVoiceWebhook(testPayload);
      return { success: true, response: result };
    } catch (error) {
      this.logger.error('Test voice error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Test SMS endpoint
   */
  @Post('test/sms')
  async testSMS(@Body() body: { from?: string; message?: string }) {
    const testPayload = {
      From: body?.from || '+1234567890',
      To: process.env.TWILIO_PHONE_NUMBER || '+0987654321',
      Body: body?.message || 'Test message',
      MessageSid: `TEST_${Date.now()}`
    };

    this.logger.log(JSON.stringify({ payload: testPayload, message: 'Testing SMS webhook' }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const result = await receptionist.handleSMSWebhook(testPayload);
      return { success: true, response: result };
    } catch (error) {
      this.logger.error('Test SMS error:', error);
      return { success: false, error: String(error) };
    }
  }

}
