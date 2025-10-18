/**
 * Shared Calendar Service
 * Handles Google Calendar integration across all resources
 */

import { HttpClient } from '../utils/http';
import { GoogleCalendarConfig } from '../types';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: Array<{ email: string; name?: string }>;
}

export class CalendarService {
  constructor(private http: HttpClient) {}

  /**
   * Create a calendar event
   */
  async createEvent(
    calendarId: string,
    event: CalendarEvent
  ): Promise<{ eventId: string; url: string }> {
    return this.http.post(`/calendar/${calendarId}/events`, event);
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    calendarId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<void> {
    return this.http.patch(`/calendar/${calendarId}/events/${eventId}`, updates);
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    return this.http.delete(`/calendar/${calendarId}/events/${eventId}`);
  }

  /**
   * Get available time slots
   */
  async getAvailableSlots(
    calendarId: string,
    startDate: Date,
    endDate: Date,
    duration: number
  ): Promise<Array<{ start: Date; end: Date }>> {
    return this.http.get(`/calendar/${calendarId}/available-slots`, {
      params: { startDate, endDate, duration },
    });
  }
}
