/**
 * Lightweight webhook security middleware for AI Receptionist
 *
 * Validates IP whitelist for Postmark webhooks
 * Postmark IPs: https://postmarkapp.com/support/article/800-ips-for-firewalls
 */

import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebhookSecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WebhookSecurityMiddleware.name);

  // Postmark IP ranges
  private readonly POSTMARK_IPS = [
    '3.134.147.250',
    '50.31.156.6',
    '50.31.156.77',
    '18.217.206.57',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);

    // Only validate IP for email webhooks from Postmark
    if (req.path.includes('/webhooks/email')) {
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
