/**
 * Main AI Receptionist SDK Client
 */

import { AIReceptionistOptions } from './types';
import { HttpClient } from './utils/http';
import { PhoneResource, VideoResource, SMSResource, EmailResource } from './resources';

export class AIReceptionist {
  private http: HttpClient;

  public phone: PhoneResource;
  public video: VideoResource;
  public sms: SMSResource;
  public email: EmailResource;

  constructor(options: AIReceptionistOptions) {
    const baseURL = options.apiUrl || 'https://api.loctelli.com/v1';

    this.http = new HttpClient({
      baseURL,
      apiKey: options.apiKey,
      debug: options.debug,
    });

    // Initialize resources
    this.phone = new PhoneResource(this.http);
    this.video = new VideoResource(this.http);
    this.sms = new SMSResource(this.http);
    this.email = new EmailResource(this.http);
  }
}
