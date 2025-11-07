import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Webhook security middleware for AI-receptionist
 * Validates IP whitelist for Postmark webhooks and optional basic auth
 */
@Injectable()
export class WebhookSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WebhookSecurityMiddleware.name);

  // Postmark IP ranges (from https://postmarkapp.com/support/article/800-ips-for-firewalls)
  private readonly POSTMARK_IPS = [
    '3.134.147.250',
    '50.31.156.6',
    '50.31.156.77',
    '18.217.206.57',
  ];

  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);
    const enableIPWhitelist = this.configService.get<string>('ENABLE_WEBHOOK_IP_WHITELIST') === 'true';
    const webhookUsername = this.configService.get<string>('WEBHOOK_USERNAME');
    const webhookPassword = this.configService.get<string>('WEBHOOK_PASSWORD');

    // Basic auth check (if configured)
    if (webhookUsername && webhookPassword) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        this.logger.warn(`❌ Webhook blocked - Missing basic auth: ${clientIP}`);
        throw new UnauthorizedException('Authentication required');
      }

      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      if (username !== webhookUsername || password !== webhookPassword) {
        this.logger.warn(`❌ Webhook blocked - Invalid credentials from IP: ${clientIP}`);
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    // IP whitelist check for email webhooks (if enabled)
    if (enableIPWhitelist && req.path.includes('/webhooks/email')) {
      if (!this.POSTMARK_IPS.includes(clientIP)) {
        this.logger.warn(`❌ Webhook blocked - IP not whitelisted: ${clientIP}`);
        throw new UnauthorizedException('IP not whitelisted');
      }
    }

    this.logger.debug(`✅ Webhook security passed from IP: ${clientIP}`);
    next();
  }

  private getClientIP(req: Request): string {
    // Check common headers for real IP (behind proxies/load balancers)
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

