import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BookingHelperService } from '../bookings/booking-helper.service';
import { addDays, addMinutes, format, parseISO, isBefore, isAfter } from 'date-fns';

export interface BookingToolArgs {
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format (24-hour)
  timezone?: string; // IANA timezone (e.g., "America/New_York"), defaults to user's timezone
  location: string;
  subject: string;
  participants?: string[];
}

export interface AvailabilityToolArgs {
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:mm format (optional, defaults to 09:00)
  endTime?: string; // HH:mm format (optional, defaults to 17:00)
}

export interface UpdateLeadToolArgs {
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  timezone?: string; // IANA timezone format
  notes?: string;
}

export interface ToolCallResult {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable()
export class AiToolsService {
  private readonly logger = new Logger(AiToolsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private bookingHelper: BookingHelperService,
  ) {}

  /**
   * Get the OpenAI tool definitions for booking functionality
   */
  getBookingTools(leadTimezone?: string): any[] {
    const timezoneDescription = leadTimezone
      ? `IANA timezone identifier (e.g., "America/New_York", "America/Los_Angeles", "Europe/London"). OPTIONAL - Lead timezone (${leadTimezone}) will be used if not provided.`
      : 'IANA timezone identifier (e.g., "America/New_York", "America/Los_Angeles", "Europe/London"). REQUIRED - must be confirmed with lead before booking.';

    return [
      {
        type: 'function',
        function: {
          name: 'book_meeting',
          description: leadTimezone
            ? `Book a calendar meeting/appointment with specified details. Lead's timezone is ${leadTimezone}, so you can proceed without asking for timezone.`
            : 'Book a calendar meeting/appointment with specified details. ALWAYS confirm timezone with the lead before booking.',
          parameters: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                description: 'Meeting date in YYYY-MM-DD format (e.g., 2025-10-10)',
                pattern: '^\\d{4}-\\d{2}-\\d{2}$'
              },
              time: {
                type: 'string',
                description: 'Meeting time in 24-hour HH:mm format (e.g., 14:00 for 2:00 PM)',
                pattern: '^\\d{2}:\\d{2}$'
              },
              timezone: {
                type: 'string',
                description: timezoneDescription,
                pattern: '^[A-Za-z_]+/[A-Za-z_]+$'
              },
              location: {
                type: 'string',
                description: 'Meeting location (e.g., "Online", "Office", "Client Site")'
              },
              subject: {
                type: 'string',
                description: 'Meeting subject/title'
              },
              participants: {
                type: 'array',
                items: { type: 'string' },
                description: 'Email addresses of meeting participants (optional)',
                default: []
              }
            },
            required: ['date', 'time', 'location', 'subject']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_availability',
          description: 'Check calendar availability for a specific date and time range',
          parameters: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                description: 'Date to check in YYYY-MM-DD format (e.g., 2025-09-28)',
                pattern: '^\\d{4}-\\d{2}-\\d{2}$'
              },
              startTime: {
                type: 'string',
                description: 'Start time in HH:mm format (defaults to 09:00)',
                pattern: '^\\d{2}:\\d{2}$',
                default: '09:00'
              },
              endTime: {
                type: 'string',
                description: 'End time in HH:mm format (defaults to 17:00)',
                pattern: '^\\d{2}:\\d{2}$',
                default: '17:00'
              }
            },
            required: ['date']
          }
        }
      }
    ];
  }

  /**
   * Get the OpenAI tool definitions for lead management functionality
   */
  getLeadManagementTools(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'update_lead_details',
          description: 'Update lead information in the database. Use when lead provides or corrects their contact details, timezone, company info, or when you learn new information about them.',
          parameters: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                description: 'Lead email address',
                format: 'email'
              },
              phone: {
                type: 'string',
                description: 'Lead phone number'
              },
              company: {
                type: 'string',
                description: 'Lead company name'
              },
              position: {
                type: 'string',
                description: 'Lead job title/position'
              },
              timezone: {
                type: 'string',
                description: 'Lead timezone in IANA format (e.g., "America/New_York", "America/Chicago"). Use when lead corrects their timezone.',
                pattern: '^[A-Za-z_]+/[A-Za-z_]+$'
              },
              notes: {
                type: 'string',
                description: 'Additional notes about the lead (append to existing notes, do not replace)'
              }
            }
          }
        }
      }
    ];
  }

  /**
   * Execute a tool call based on the function name and arguments
   */
  async executeToolCall(
    functionName: string,
    args: any,
    userId: number,
    leadId: number
  ): Promise<ToolCallResult> {
    this.logger.log(`Executing tool call: ${functionName} for userId=${userId}, leadId=${leadId}`);
    this.logger.debug(`Tool arguments:`, args);

    try {
      switch (functionName) {
        case 'book_meeting':
          return await this.bookMeeting(args as BookingToolArgs, userId, leadId);

        case 'check_availability':
          return await this.checkAvailability(args as AvailabilityToolArgs, userId);

        case 'update_lead_details':
          return await this.updateLeadDetails(args as UpdateLeadToolArgs, leadId);

        default:
          this.logger.warn(`Unknown tool function: ${functionName}`);
          return {
            success: false,
            message: `Unknown function: ${functionName}`
          };
      }
    } catch (error) {
      this.logger.error(`Error executing tool call ${functionName}:`, error);
      return {
        success: false,
        message: `Error executing ${functionName}: ${error.message}`
      };
    }
  }

  /**
   * Book a meeting using the provided arguments
   */
  private async bookMeeting(
    args: BookingToolArgs,
    userId: number,
    leadId: number
  ): Promise<ToolCallResult> {
    this.logger.log(`Booking meeting for userId=${userId}, leadId=${leadId}`);

    // Validate arguments
    if (!this.validateBookingArgs(args)) {
      return {
        success: false,
        message: 'Invalid booking arguments. Please provide valid date (YYYY-MM-DD) and time (HH:mm) formats.',
        data: { errorType: 'INVALID_BOOKING_ARGS' }
      };
    }

    // Add date validation for booking
    const dateValidation = this.validateDateRequest(args.date);
    if (!dateValidation.isValid) {
      return {
        success: false,
        message: dateValidation.message || 'Invalid date',
        data: { errorType: 'INVALID_BOOKING_DATE' }
      };
    }

    // Check if user has booking enabled and get timezone
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bookingEnabled: true, subAccountId: true, timezone: true }
    });

    if (!user || !user.bookingEnabled) {
      return {
        success: false,
        message: 'Booking is not enabled for this user.',
        data: { errorType: 'BOOKING_DISABLED' }
      };
    }

    // Get lead's timezone if available
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      select: { timezone: true }
    });

    // Get timezone priority: lead timezone > provided timezone > user timezone > default
    const timezone = lead?.timezone || args.timezone || user.timezone || 'America/New_York';

    this.logger.log(`Using timezone for booking: ${timezone} (lead: ${lead?.timezone || 'none'}, provided: ${args.timezone || 'none'}, user: ${user.timezone})`);

    // Validate timezone
    if (!this.validateTimezone(timezone)) {
      return {
        success: false,
        message: `Invalid timezone: ${timezone}. Please use IANA timezone format (e.g., "America/New_York").`,
        data: { errorType: 'INVALID_TIMEZONE' }
      };
    }

    // Get timezone info
    const timezoneInfo = this.getTimezoneInfo(args.date, args.time, timezone);

    // Check for booking conflicts before creating
    const conflictCheck = await this.checkBookingConflicts(args.date, args.time, userId);
    if (conflictCheck.hasConflict) {
      return {
        success: false,
        message: `Time slot ${args.time} on ${args.date} is already booked. Please choose a different time.`,
        data: {
          errorType: 'TIME_CONFLICT',
          conflictDetails: conflictCheck.conflictDetails
        }
      };
    }

    try {
      // Create booking details object with timezone
      const details = {
        date: args.date,
        time: args.time,
        timezone: timezone,
        timezoneOffset: timezoneInfo.offset,
        timezoneAbbr: timezoneInfo.abbreviation,
        location: args.location,
        subject: args.subject,
        participants: args.participants || []
      };

      // Create booking in database
      const booking = await this.prisma.booking.create({
        data: {
          regularUser: {
            connect: { id: userId }
          },
          lead: {
            connect: { id: leadId }
          },
          bookingType: 'meeting',
          details,
          status: 'pending',
          subAccount: {
            connect: { id: user.subAccountId }
          },
        },
      });

      // Create GoHighLevel block slot
      await this.bookingHelper.createGohighlevelBlockSlot(booking);

      this.logger.log(`Meeting booked successfully: bookingId=${booking.id}`);

      return {
        success: true,
        message: `Meeting booked successfully for ${args.date} at ${args.time} ${timezoneInfo.abbreviation}. Booking ID: ${booking.id}`,
        data: {
          bookingId: booking.id,
          date: args.date,
          time: args.time,
          timezone: timezone,
          timezoneOffset: timezoneInfo.offset,
          timezoneAbbr: timezoneInfo.abbreviation,
          location: args.location,
          subject: args.subject
        }
      };
    } catch (error) {
      this.logger.error(`Error creating booking:`, error);
      return {
        success: false,
        message: 'Failed to create booking. Please try again.'
      };
    }
  }

  /**
   * Check calendar availability for a given date and time range
   * Uses bookingsTime JSON field as primary source, cross-referenced with database bookings
   */
  private async checkAvailability(
    args: AvailabilityToolArgs,
    userId: number
  ): Promise<ToolCallResult> {
    this.logger.log(`Checking availability for userId=${userId}, date=${args.date}`);

    // Validate date format
    if (!this.validateDateFormat(args.date)) {
      return {
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format.',
        data: { errorType: 'INVALID_DATE_FORMAT' }
      };
    }

    // Add date validation (no past dates, max 30 days ahead)
    const dateValidation = this.validateDateRequest(args.date);
    if (!dateValidation.isValid) {
      return {
        success: false,
        message: dateValidation.message || 'Invalid date',
        data: { errorType: 'INVALID_DATE_RANGE' }
      };
    }

    try {
      // Get user with bookingsTime data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          bookingsTime: true,
          bookingEnabled: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: 'User not found.'
        };
      }

      if (!user.bookingEnabled) {
        return {
          success: false,
          message: 'Booking is not enabled for this user.',
          data: { errorType: 'BOOKING_DISABLED' }
        };
      }

      // Add data validation
      const dataValidation = await this.validateBookingsTimeData(userId);
      if (!dataValidation.isValid) {
        return {
          success: false,
          message: `Unable to check availability: ${dataValidation.issues.join(', ')}`,
          data: {
            errorType: 'DATA_ISSUES',
            issues: dataValidation.issues
          }
        };
      }

      // Get existing bookings from database to cross-reference
      const existingBookings = await this.prisma.booking.findMany({
        where: {
          regularUserId: userId,
          status: {
            in: ['pending', 'confirmed']
          }
        }
      });

      // Filter bookings for the specified date
      const dateBookings = existingBookings.filter(booking => {
        const details = booking.details as any;
        return details && details.date === args.date;
      });

      // Get available slots using bookingsTime field + database cross-reference
      const availableSlots = await this.getAvailableSlotsFromBookingsTime(
        user.bookingsTime,
        args.date,
        dateBookings,
        args.startTime,
        args.endTime
      );

      return {
        success: true,
        message: `Found ${availableSlots.length} available slots for ${args.date}`,
        data: {
          date: args.date,
          availableSlots,
          existingBookings: dateBookings.length,
          source: user.bookingsTime ? 'bookingsTime' : 'fallback'
        }
      };
    } catch (error) {
      this.logger.error(`Error checking availability:`, error);
      return {
        success: false,
        message: 'Failed to check availability. Please try again.'
      };
    }
  }

  /**
   * Update lead details in the database
   */
  private async updateLeadDetails(
    args: UpdateLeadToolArgs,
    leadId: number
  ): Promise<ToolCallResult> {
    this.logger.log(`Updating lead details for leadId=${leadId}`, args);

    // Validate that at least one field is being updated
    if (!args.email && !args.phone && !args.company && !args.position && !args.timezone && !args.notes) {
      return {
        success: false,
        message: 'No fields provided to update.',
        data: { errorType: 'NO_FIELDS' }
      };
    }

    // Validate timezone if provided
    if (args.timezone && !this.validateTimezone(args.timezone)) {
      return {
        success: false,
        message: `Invalid timezone: ${args.timezone}. Please use IANA timezone format (e.g., "America/New_York").`,
        data: { errorType: 'INVALID_TIMEZONE' }
      };
    }

    try {
      // Get current lead data
      const currentLead = await this.prisma.lead.findUnique({
        where: { id: leadId },
        select: { notes: true }
      });

      if (!currentLead) {
        return {
          success: false,
          message: 'Lead not found.',
          data: { errorType: 'LEAD_NOT_FOUND' }
        };
      }

      // Prepare update data
      const updateData: any = {};

      if (args.email) updateData.email = args.email;
      if (args.phone) updateData.phone = args.phone;
      if (args.company) updateData.company = args.company;
      if (args.position) updateData.position = args.position;
      if (args.timezone) updateData.timezone = args.timezone;

      // Append notes instead of replacing
      if (args.notes) {
        const existingNotes = currentLead.notes || '';
        updateData.notes = existingNotes
          ? `${existingNotes}\n${args.notes}`
          : args.notes;
      }

      // Update lead
      const updatedLead = await this.prisma.lead.update({
        where: { id: leadId },
        data: updateData
      });

      // Build summary of updated fields
      const updatedFields = Object.keys(updateData).join(', ');

      this.logger.log(`Successfully updated lead ${leadId}: ${updatedFields}`);

      return {
        success: true,
        message: `Lead details updated successfully: ${updatedFields}`,
        data: {
          leadId: updatedLead.id,
          updatedFields: Object.keys(updateData),
          updates: updateData
        }
      };
    } catch (error) {
      this.logger.error(`Error updating lead details:`, error);
      return {
        success: false,
        message: 'Failed to update lead details. Please try again.',
        data: { errorType: 'UPDATE_FAILED', error: error.message }
      };
    }
  }

  /**
   * Get available slots from user's bookingsTime JSON field, cross-referenced with database bookings
   */
  private async getAvailableSlotsFromBookingsTime(
    bookingsTime: any,
    date: string,
    existingBookings: any[],
    startTime?: string,
    endTime?: string
  ): Promise<string[]> {
    this.logger.log(`Getting available slots for date ${date} from bookingsTime data`);

    try {
      // If bookingsTime exists, parse and use it
      if (bookingsTime) {
        const availableSlots = this.parseBookingsTimeForDate(bookingsTime, date);
        this.logger.log(`Found ${availableSlots.length} slots from bookingsTime for ${date}`);

        // Cross-reference with existing database bookings
        const filteredSlots = this.filterSlotsAgainstBookings(availableSlots, existingBookings);
        this.logger.log(`After filtering against DB bookings: ${filteredSlots.length} slots available`);

        return filteredSlots;
      } else {
        // Fallback: Generate slots using traditional method
        this.logger.log(`No bookingsTime data found, using fallback slot generation`);
        const fallbackStartTime = startTime || '09:00';
        const fallbackEndTime = endTime || '17:00';

        return this.generateAvailableSlots(
          date,
          fallbackStartTime,
          fallbackEndTime,
          existingBookings
        );
      }
    } catch (error) {
      this.logger.error(`Error processing bookingsTime data: ${error}`);
      // Fallback to traditional method on error
      const fallbackStartTime = startTime || '09:00';
      const fallbackEndTime = endTime || '17:00';

      return this.generateAvailableSlots(
        date,
        fallbackStartTime,
        fallbackEndTime,
        existingBookings
      );
    }
  }

  /**
   * Parse bookingsTime JSON field to extract available slots for a specific date
   */
  private parseBookingsTimeForDate(bookingsTime: any, targetDate: string): string[] {
    try {
      // Handle different possible formats of bookingsTime
      let bookingsData = bookingsTime;

      if (typeof bookingsTime === 'string') {
        bookingsData = JSON.parse(bookingsTime);
      }

      const slots: string[] = [];

      // Expected format could be:
      // 1. Array of slot objects: [{date: "2025-09-28", slots: ["09:00", "10:00"]}]
      // 2. Object with dates as keys: {"2025-09-28": ["09:00", "10:00"]}
      // 3. GHL format: {dates: [{date: "2025-09-28", slots: [...]}]}

      if (Array.isArray(bookingsData)) {
        // Format 1: Array of date objects
        const dateEntry = bookingsData.find(entry => entry.date === targetDate);
        if (dateEntry && dateEntry.slots) {
          slots.push(...dateEntry.slots);
        }
      } else if (bookingsData && typeof bookingsData === 'object') {
        // Format 2: Direct date key lookup
        if (bookingsData[targetDate]) {
          const dateSlots = bookingsData[targetDate];
          if (Array.isArray(dateSlots)) {
            slots.push(...dateSlots);
          }
        }

        // Format 3: GHL-style nested structure
        if (bookingsData.dates && Array.isArray(bookingsData.dates)) {
          const dateEntry = bookingsData.dates.find((entry: any) => entry.date === targetDate);
          if (dateEntry && dateEntry.slots) {
            slots.push(...dateEntry.slots);
          }
        }

        // Handle other possible nested structures
        if (bookingsData.availableSlots && Array.isArray(bookingsData.availableSlots)) {
          const dateEntry = bookingsData.availableSlots.find((entry: any) => entry.date === targetDate);
          if (dateEntry && dateEntry.times) {
            slots.push(...dateEntry.times);
          }
        }
      }

      // Validate and format time slots
      const validSlots = slots
        .filter(slot => this.validateTimeFormat(slot))
        .sort(); // Sort chronologically

      this.logger.debug(`Parsed ${validSlots.length} valid slots for ${targetDate}: ${validSlots.join(', ')}`);
      return validSlots;

    } catch (error) {
      this.logger.error(`Error parsing bookingsTime for date ${targetDate}: ${error}`);
      return [];
    }
  }

  /**
   * Filter available slots against existing database bookings
   */
  private filterSlotsAgainstBookings(availableSlots: string[], existingBookings: any[]): string[] {
    return availableSlots.filter(slot => {
      // Check if this slot conflicts with any existing booking
      const hasConflict = existingBookings.some(booking => {
        const bookingDetails = booking.details as any;
        if (!bookingDetails || !bookingDetails.time) return false;

        const bookingTime = bookingDetails.time;

        // Calculate booking end time (assume 30-minute meetings)
        const bookingEndTime = format(
          addMinutes(parseISO(`2000-01-01T${bookingTime}`), 30),
          'HH:mm'
        );

        // Calculate slot end time
        const slotEndTime = format(
          addMinutes(parseISO(`2000-01-01T${slot}`), 30),
          'HH:mm'
        );

        // Check for time overlap
        return (
          (slot >= bookingTime && slot < bookingEndTime) ||
          (slotEndTime > bookingTime && slotEndTime <= bookingEndTime) ||
          (slot <= bookingTime && slotEndTime >= bookingEndTime)
        );
      });

      return !hasConflict;
    });
  }

  /**
   * Generate available time slots for a given date and time range (fallback method)
   */
  private generateAvailableSlots(
    date: string,
    startTime: string,
    endTime: string,
    existingBookings: any[]
  ): string[] {
    const slots: string[] = [];

    try {
      const startDateTime = parseISO(`${date}T${startTime}`);
      const endDateTime = parseISO(`${date}T${endTime}`);

      let currentSlot = startDateTime;

      while (isBefore(currentSlot, endDateTime)) {
        const slotTime = format(currentSlot, 'HH:mm');
        const slotEndTime = format(addMinutes(currentSlot, 30), 'HH:mm');

        // Check if this slot conflicts with existing bookings
        const hasConflict = existingBookings.some(booking => {
          const bookingDetails = booking.details as any;
          const bookingTime = bookingDetails.time;
          const bookingEndTime = format(
            addMinutes(parseISO(`${date}T${bookingTime}`), 30),
            'HH:mm'
          );

          // Check for time overlap
          return (
            (slotTime >= bookingTime && slotTime < bookingEndTime) ||
            (slotEndTime > bookingTime && slotEndTime <= bookingEndTime) ||
            (slotTime <= bookingTime && slotEndTime >= bookingEndTime)
          );
        });

        if (!hasConflict) {
          slots.push(slotTime);
        }

        currentSlot = addMinutes(currentSlot, 30);
      }
    } catch (error) {
      this.logger.error(`Error generating time slots:`, error);
    }

    return slots;
  }

  /**
   * Validate booking arguments format
   */
  private validateBookingArgs(args: BookingToolArgs): boolean {
    // Check date format (YYYY-MM-DD)
    if (!this.validateDateFormat(args.date)) {
      return false;
    }

    // Check time format (HH:mm)
    if (!this.validateTimeFormat(args.time)) {
      return false;
    }

    // Check required fields
    if (!args.location || !args.subject) {
      return false;
    }

    return true;
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  private validateDateFormat(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    try {
      const parsedDate = parseISO(date);
      return !isNaN(parsedDate.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Validate time format (HH:mm)
   */
  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(time)) {
      return false;
    }

    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  /**
   * Validate date request (no past dates, max 30 days ahead)
   */
  private validateDateRequest(requestedDate: string): { isValid: boolean; message?: string } {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const requested = parseISO(requestedDate);

    if (isBefore(requested, today)) {
      return {
        isValid: false,
        message: `Cannot check availability for past dates. Today is ${format(today, 'yyyy-MM-dd')}.`
      };
    }

    // Only allow booking up to 30 days in advance
    const maxDate = addDays(today, 30);
    if (isAfter(requested, maxDate)) {
      return {
        isValid: false,
        message: `Can only book up to 30 days in advance. Latest available date is ${format(maxDate, 'yyyy-MM-dd')}.`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate bookingsTime data quality
   */
  private async validateBookingsTimeData(userId: number): Promise<{ isValid: boolean; issues: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bookingsTime: true, bookingEnabled: true }
    });

    const issues: string[] = [];

    if (!user) {
      issues.push('User not found');
      return { isValid: false, issues };
    }

    if (!user.bookingEnabled) {
      issues.push('Booking is disabled for this user');
    }

    if (!user.bookingsTime) {
      issues.push('No availability data configured');
    } else {
      try {
        const slots = this.parseBookingsTimeForDate(user.bookingsTime, format(new Date(), 'yyyy-MM-dd'));
        if (slots.length === 0) {
          // Check if there are any slots for the next 7 days
          let hasAnySlots = false;
          for (let i = 1; i < 7; i++) {
            const checkDate = addDays(new Date(), i);
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            const daySlots = this.parseBookingsTimeForDate(user.bookingsTime, dateStr);
            if (daySlots.length > 0) {
              hasAnySlots = true;
              break;
            }
          }
          if (!hasAnySlots) {
            issues.push('No availability slots found for current timeframe');
          }
        }
      } catch (error) {
        issues.push('Invalid availability data format');
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Check for booking conflicts before creating a new booking
   */
  private async checkBookingConflicts(
    date: string,
    time: string,
    userId: number
  ): Promise<{ hasConflict: boolean; conflictDetails?: any }> {
    const proposedStart = parseISO(`${date}T${time}`);
    const proposedEnd = addMinutes(proposedStart, 30);

    // Check database for existing bookings
    const existingBookings = await this.prisma.booking.findMany({
      where: {
        regularUserId: userId,
        status: { in: ['pending', 'confirmed'] }
      }
    });

    for (const booking of existingBookings) {
      const bookingDetails = booking.details as any;
      if (bookingDetails?.date === date) {
        const existingStart = parseISO(`${date}T${bookingDetails.time}`);
        const existingEnd = addMinutes(existingStart, 30);

        // Check for overlap
        if (
          (proposedStart >= existingStart && proposedStart < existingEnd) ||
          (proposedEnd > existingStart && proposedEnd <= existingEnd) ||
          (proposedStart <= existingStart && proposedEnd >= existingEnd)
        ) {
          return {
            hasConflict: true,
            conflictDetails: {
              existingBookingId: booking.id,
              existingTime: bookingDetails.time,
              existingSubject: bookingDetails.subject
            }
          };
        }
      }
    }

    return { hasConflict: false };
  }

  /**
   * Validate IANA timezone identifier
   */
  private validateTimezone(timezone: string): boolean {
    try {
      // Use Intl API to validate timezone
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      this.logger.error(`Invalid timezone: ${timezone}`);
      return false;
    }
  }

  /**
   * Get timezone offset and abbreviation for a specific date/time
   */
  private getTimezoneInfo(date: string, time: string, timezone: string): {
    offset: string;
    abbreviation: string;
  } {
    const dateTime = new Date(`${date}T${time}:00`);

    // Get timezone abbreviation
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });

    const parts = formatter.formatToParts(dateTime);
    const abbreviation = parts.find(p => p.type === 'timeZoneName')?.value || '';

    // Calculate offset
    const utcDate = new Date(dateTime.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(dateTime.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMinutes = (tzDate.getTime() - utcDate.getTime()) / 60000;
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const offset = `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

    return { offset, abbreviation };
  }
}