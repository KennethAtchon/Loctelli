/**
 * GoHighLevel API types
 */

export interface GhlLocation {
  id: string;
  name: string;
  email?: string;
  companyId?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timezone?: string;
  settings?: GhlSettings;
  social?: GhlSocialLinks;
}

export interface GhlSettings {
  allowDuplicateContact: boolean;
  allowDuplicateOpportunity: boolean;
  allowFacebookNameMerge: boolean;
  disableContactTimezone: boolean;
}

export interface GhlSocialLinks {
  facebookUrl?: string;
  googlePlus?: string;
  linkedIn?: string;
  foursquare?: string;
  twitter?: string;
  yelp?: string;
  instagram?: string;
  youtube?: string;
  pinterest?: string;
  blogRss?: string;
  googlePlacesId?: string;
}

export interface GhlSubaccountsResponse {
  locations?: GhlLocation[];
}

export interface GhlCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number; // Unix timestamp in milliseconds
  endTime: number; // Unix timestamp in milliseconds
  allDay: boolean;
  calendarId: string;
  locationId: string;
}

export interface GhlCalendarSlot {
  startTime: number; // Unix timestamp in milliseconds
  endTime: number; // Unix timestamp in milliseconds
  calendarId: string;
}

export interface GhlUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  locationId: string;
}

export interface GhlContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address1?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  companyName?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

// Calendar types migrated from Python
export interface GhlCalendarNotification {
  type: string;
  shouldSendToContact: boolean;
  shouldSendToGuest: boolean;
  shouldSendToUser: boolean;
  shouldSendToSelectedUsers: boolean;
  selectedUsers?: string;
}

export interface GhlLocationConfiguration {
  kind: string;
  location: string;
  meetingId?: string;
}

export interface GhlTeamMember {
  userId: string;
  priority: number;
  meetingLocationType?: string;
  meetingLocation?: string;
  isPrimary: boolean;
  locationConfigurations: GhlLocationConfiguration[];
}

export interface GhlHourSlot {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export interface GhlOpenHour {
  daysOfTheWeek: number[];
  hours: GhlHourSlot[];
}

export interface GhlAvailability {
  date: string;
  deleted: boolean;
  hours: GhlHourSlot[];
}

export interface GhlRecurring {
  freq: string;
  count: number;
  bookingOption: string;
  bookingOverlapDefaultStatus: string;
}

export interface GhlLookBusyConfig {
  enabled: boolean;
  lookBusyPercentage: number;
}

export interface GhlCalendar {
  id: string;
  isActive: boolean;
  locationId: string;
  groupId?: string;
  eventType: string;
  name: string;
  description?: string;
  slug?: string;
  widgetSlug?: string;
  calendarType: string;
  widgetType: string;
  eventTitle: string;
  eventColor: string;
  meetingLocation?: string;
  slotDuration: number;
  slotDurationUnit: string;
  slotInterval: number;
  slotIntervalUnit: string;
  slotBuffer: number;
  slotBufferUnit: string;
  preBuffer: number;
  preBufferUnit: string;
  appointmentPerSlot: number;
  appointmentPerDay: number;
  allowBookingAfter: number;
  allowBookingAfterUnit: string;
  allowBookingFor: number;
  allowBookingForUnit: string;
  enableRecurring: boolean;
  formId?: string;
  stickyContact: boolean;
  isLivePaymentMode: boolean;
  autoConfirm: boolean;
  shouldSendAlertEmailsToAssignedMember: boolean;
  alertEmail?: string;
  googleInvitationEmails: boolean;
  allowReschedule: boolean;
  allowCancellation: boolean;
  shouldAssignContactToTeamMember: boolean;
  shouldSkipAssigningContactForExisting: boolean;
  notes?: string;
  pixelId?: string;
  formSubmitType: string;
  formSubmitRedirectURL?: string;
  formSubmitThanksMessage?: string;
  availabilityType?: number;
  guestType?: string;
  consentLabel?: string;
  calendarCoverImage?: string;
  notifications: GhlCalendarNotification[];
  teamMembers: GhlTeamMember[];
  locationConfigurations: GhlLocationConfiguration[];
  openHours: GhlOpenHour[];
  availabilities: GhlAvailability[];
  recurring?: GhlRecurring;
  lookBusyConfig?: GhlLookBusyConfig;
}

export interface GhlCalendarsResponse {
  calendars: GhlCalendar[];
}
