/**
 * Calendar Service - MOVED TO GoogleOrchestrator
 * This service is deprecated - use GoogleOrchestrator instead
 */

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: Array<{ email: string; name?: string }>;
}

// Deprecated: Moved to GoogleOrchestrator
export class CalendarService {
  constructor() {
    console.warn('CalendarService is deprecated - use GoogleOrchestrator instead');
  }
}
