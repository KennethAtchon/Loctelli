/**
 * Base resource class for all API resources
 * Provides access to HTTP client and shared services
 */

import type { AIReceptionist } from '../client';

export abstract class BaseResource {
  protected client: AIReceptionist;

  constructor(client: AIReceptionist) {
    this.client = client;
  }

  /**
   * Access the HTTP client for making requests
   */
  protected get http() {
    return (this.client as any).http;
  }

  /**
   * Access shared authentication service
   */
  protected get authService() {
    return this.client.services.auth;
  }

  /**
   * Access shared webhook service
   */
  protected get webhookService() {
    return this.client.services.webhook;
  }

  /**
   * Access shared calendar service
   */
  protected get calendarService() {
    return this.client.services.calendar;
  }

  /**
   * Access shared analytics service
   */
  protected get analyticsService() {
    return this.client.services.analytics;
  }
}
