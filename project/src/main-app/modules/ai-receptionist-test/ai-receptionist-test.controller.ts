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
      // Read package.json from the installed package
      const packageJson = require('@atchonk/ai-receptionist/package.json');
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
   * - Configure webhook URL in Postmark with: https://user:pass@api.loctelli.com/ai-receptionist/webhooks/email
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

  /**
   * Test email endpoint
   */
  @Post('test/email')
  async testEmail(@Body() body: { from?: string; subject?: string; message?: string; html?: string }) {
    const testPayload = {
      From: body?.from || 'test@example.com',
      FromFull: {
        Email: body?.from || 'test@example.com',
        Name: 'Test User',
        MailboxHash: ''
      },
      To: process.env.POSTMARK_FROM_EMAIL || 'receptionist@test.com',
      ToFull: [{
        Email: process.env.POSTMARK_FROM_EMAIL || 'receptionist@test.com',
        Name: 'AI Receptionist',
        MailboxHash: ''
      }],
      Subject: body?.subject || 'Test Email',
      MessageID: `TEST_${Date.now()}`,
      TextBody: body?.message || 'This is a test email',
      HtmlBody: body?.html || '<p>This is a test email</p>',
      Date: new Date().toISOString(),
      Headers: [],
      Attachments: []
    };

    this.logger.log(JSON.stringify({ payload: testPayload, message: 'Testing email webhook' }));

    try {
      const receptionist = this.aiReceptionistTestService.getReceptionist();
      const result = await receptionist.handleEmailWebhook(testPayload);
      return { success: true, response: result };
    } catch (error) {
      this.logger.error('Test email error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Test ask AI email endpoint
   */
  @Get('test/ask-ai-email')
  async testAskAiEmail() {
    const receptionist = this.aiReceptionistTestService.getReceptionist();

    const response = await receptionist.text?.generate({
      prompt: "Hey can you shoot a quick email to hailey.prescott@loctelli.com and ask how shes doing? Just do it, don't ask for clarification.",
      metadata: {
        trigger: 'email',
        customer: 'hailey.prescott@loctelli.com',
        context: 'Hailey is a customer of ours and we want to check in on her.',
      }
    });

    return { success: true, response: response };
  }
}
