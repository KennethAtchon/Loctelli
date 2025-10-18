/**
 * Main AI Receptionist SDK Client
 */

import { AIReceptionistOptions } from './types';
import { HttpClient } from './utils/http';
import { PhoneResource, VideoResource, SMSResource, EmailResource } from './resources';
import {
  AuthService,
  WebhookService,
  CalendarService,
  AnalyticsService,
} from './services';

export class AIReceptionist {
  private http: HttpClient;

  /**
   * Shared services used across all resources
   */
  public readonly services: {
    auth: AuthService;
    webhook: WebhookService;
    calendar: CalendarService;
    analytics: AnalyticsService;
  };

  // Lazy-loaded resources
  private _phone?: PhoneResource;
  private _video?: VideoResource;
  private _sms?: SMSResource;
  private _email?: EmailResource;

  constructor(options: AIReceptionistOptions) {
    const baseURL = options.apiUrl || 'https://api.loctelli.com/v1';

    this.http = new HttpClient({
      baseURL,
      apiKey: options.apiKey,
      debug: options.debug,
    });

    // Initialize shared services (always loaded, lightweight)
    this.services = {
      auth: new AuthService(this.http),
      webhook: new WebhookService(this.http),
      calendar: new CalendarService(this.http),
      analytics: new AnalyticsService(this.http, { debug: options.debug }),
    };
  }

  /**
   * Phone resource (lazy loaded)
   * Access phone calls, numbers, and voice features
   */
  get phone(): PhoneResource {
    if (!this._phone) {
      this._phone = new PhoneResource(this);
    }
    return this._phone;
  }

  /**
   * Video resource (lazy loaded)
   * Access video calls and room features
   */
  get video(): VideoResource {
    if (!this._video) {
      this._video = new VideoResource(this);
    }
    return this._video;
  }

  /**
   * SMS resource (lazy loaded)
   * Access SMS messaging and conversations
   */
  get sms(): SMSResource {
    if (!this._sms) {
      this._sms = new SMSResource(this);
    }
    return this._sms;
  }

  /**
   * Email resource (lazy loaded)
   * Access email messaging and threads
   */
  get email(): EmailResource {
    if (!this._email) {
      this._email = new EmailResource(this);
    }
    return this._email;
  }
}
