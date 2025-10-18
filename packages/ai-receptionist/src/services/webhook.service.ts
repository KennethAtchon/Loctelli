/**
 * Shared Webhook Service
 * Handles webhook registration and event processing across all resources
 */

import { HttpClient } from '../utils/http';

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
}

export class WebhookService {
  constructor(private http: HttpClient) {}

  /**
   * Register a webhook endpoint
   */
  async register(config: WebhookConfig): Promise<{ id: string; url: string }> {
    return this.http.post('/webhooks', config);
  }

  /**
   * Unregister a webhook
   */
  async unregister(webhookId: string): Promise<void> {
    return this.http.delete(`/webhooks/${webhookId}`);
  }

  /**
   * List all registered webhooks
   */
  async list(): Promise<WebhookConfig[]> {
    return this.http.get('/webhooks');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    // TODO: Implement signature verification
    return true;
  }
}
