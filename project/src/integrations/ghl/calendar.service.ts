import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GhlCalendarEvent, GhlCalendarSlot, GhlCalendar, GhlCalendarsResponse } from './types';

@Injectable()
export class GhlCalendarService {
  private readonly logger = new Logger(GhlCalendarService.name);
  private readonly ghlApiKey: string;
  private readonly ghlApiVersion: string;
  private readonly baseUrl = 'https://services.leadconnectorhq.com';

  constructor(private configService: ConfigService) {
    this.ghlApiKey = this.configService.get<string>('GHL_API_KEY') || '';
    this.ghlApiVersion = this.configService.get<string>('GHL_API_VERSION', '2021-04-15');
  }

  /**
   * Get the headers for GoHighLevel API requests
   */
  private getHeaders() {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.ghlApiKey}`,
      'Version': this.ghlApiVersion,
    };
  }

  /**
   * Get free slots for a calendar
   * API Docs: https://highlevel.stoplight.io/docs/integrations/e55dec1be7bee-get-calendars
   * @param calendarId The calendar ID
   * @param startDate Start date (timestamp in ms)
   * @param endDate End date (timestamp in ms)
   * @returns Array of free slots
   */
  async getFreeSlots(calendarId: string, startDate: number, endDate: number): Promise<GhlCalendarSlot[]> {
    try {
      const url = `${this.baseUrl}/calendars/${calendarId}/free-slots`;
      const params = { startDate, endDate };
      
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        params
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      this.logger.error(`Error fetching free slots for calendarId=${calendarId}: ${error}`);
      return [];
    }
  }

  /**
   * Create a calendar event
   * API Docs: https://highlevel.stoplight.io/docs/integrations/e55dec1be7bee-get-calendars
   * @param calendarId The calendar ID
   * @param event The event details
   * @returns The created event or null if failed
   */
  async createEvent(calendarId: string, event: Partial<GhlCalendarEvent>): Promise<GhlCalendarEvent | null> {
    try {
      const url = `${this.baseUrl}/calendars/${calendarId}/events`;
      
      const response = await axios.post(url, event, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 201 || response.status === 200) {
        return response.data;
      }
      
      return null;
    } catch (error) {
      this.logger.error(`Error creating event for calendarId=${calendarId}: ${error}`);
      return null;
    }
  }

  /**
   * Block a calendar slot
   * API Docs: https://highlevel.stoplight.io/docs/integrations/e55dec1be7bee-get-calendars
   * @param calendarId The calendar ID
   * @param title Event title
   * @param startTime Start time (timestamp in ms)
   * @param endTime End time (timestamp in ms)
   * @param locationId Location ID
   * @returns The created event or null if failed
   */
  async blockSlot(
    calendarId: string, 
    title: string, 
    startTime: number, 
    endTime: number, 
    locationId: string
  ): Promise<GhlCalendarEvent | null> {
    try {
      const event: Partial<GhlCalendarEvent> = {
        title,
        startTime,
        endTime,
        allDay: false,
        calendarId,
        locationId
      };
      
      return this.createEvent(calendarId, event);
    } catch (error) {
      this.logger.error(`Error blocking slot for calendarId=${calendarId}: ${error}`);
      return null;
    }
  }

  /**
   * Get calendar details by calendar ID
   * API Docs: https://highlevel.stoplight.io/docs/integrations/e55dec1be7bee-get-calendars
   * @param calendarId The calendar ID
   * @returns The calendar details or null if not found
   */
  async getCalendar(calendarId: string): Promise<GhlCalendar | null> {
    try {
      const url = `${this.baseUrl}/calendars/${calendarId}`;
      
      const response = await axios.get(url, { 
        headers: this.getHeaders() 
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      this.logger.warn(`GHL Get Calendar failed: ${response.status} ${response.statusText}`);
      return null;
    } catch (error) {
      this.logger.error(`Error calling GHL Get Calendar: ${error}`);
      return null;
    }
  }

  /**
   * Get calendars by location ID
   * API Docs: https://highlevel.stoplight.io/docs/integrations/cd799051a30ea-get-calendars
   * @param locationId The location ID
   * @param groupId Optional group ID to filter calendars
   * @param showDrafted Whether to show drafted calendars
   * @returns Array of calendars or null if error
   */
  async getCalendarsByLocation(
    locationId: string, 
    groupId?: string, 
    showDrafted: boolean = true
  ): Promise<GhlCalendarsResponse | null> {
    try {
      const url = `${this.baseUrl}/calendars/`;
      
      // Build query parameters
      const params: Record<string, any> = {
        locationId
      };
      
      if (groupId) {
        params.groupId = groupId;
      }
      
      if (showDrafted !== undefined) {
        params.showDrafted = String(showDrafted).toLowerCase();
      }
      
      const response = await axios.get(url, { 
        headers: this.getHeaders(),
        params
      });
      
      if (response.status === 200) {
        return response.data;
      }
      
      this.logger.warn(`GHL Get Calendars failed: ${response.status} ${response.statusText}`);
      return null;
    } catch (error) {
      this.logger.error(`Error calling GHL Get Calendars: ${error}`);
      return null;
    }
  }
}
