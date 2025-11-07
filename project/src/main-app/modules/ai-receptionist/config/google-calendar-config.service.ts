import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Helper service for Google Calendar configuration
 * Extracts and formats Google credentials from environment variables
 */
@Injectable()
export class GoogleCalendarConfigService {
  private readonly logger = new Logger(GoogleCalendarConfigService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get Google Calendar configuration
   * Returns undefined if Google credentials are not configured
   */
  getGoogleCalendarConfig(): { google: any } | undefined {
    const calendarId = this.configService.get<string>('GOOGLE_CALENDAR_ID');
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY');
    
    // Check for Service Account credentials (JSON string from env)
    const serviceAccountJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_JSON');
    let credentials: any = undefined;

    if (serviceAccountJson) {
      try {
        credentials = JSON.parse(serviceAccountJson);
      } catch (error) {
        this.logger.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON, using OAuth2 credentials instead');
      }
    }

    // If no service account, try OAuth2 credentials
    if (!credentials) {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');
      
      if (clientId && clientSecret && refreshToken) {
        credentials = {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          redirect_uri: this.configService.get<string>('GOOGLE_REDIRECT_URI') || 'http://localhost:8000/oauth/callback'
        };
      }
    }

    // Only return config if we have at least calendarId and one auth method
    if (!calendarId || (!apiKey && !credentials)) {
      return undefined;
    }

    return {
      google: {
        calendarId: calendarId,
        ...(apiKey && { apiKey }),
        ...(credentials && { credentials })
      }
    };
  }
}

