/**
 * Shared Analytics Service
 * Tracks events and metrics across all resources
 */

import { HttpClient } from '../utils/http';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export class AnalyticsService {
  private debug: boolean;

  constructor(
    private http: HttpClient,
    options?: { debug?: boolean }
  ) {
    this.debug = options?.debug || false;
  }

  /**
   * Track an event
   */
  async track(event: string, properties?: Record<string, any>): Promise<void> {
    const payload: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
    };

    if (this.debug) {
      console.log('[Analytics]', payload);
    }

    try {
      await this.http.post('/analytics/events', payload);
    } catch (error) {
      // Don't throw on analytics errors
      if (this.debug) {
        console.error('[Analytics Error]', error);
      }
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    try {
      await this.http.post('/analytics/events/batch', { events });
    } catch (error) {
      if (this.debug) {
        console.error('[Analytics Batch Error]', error);
      }
    }
  }
}
