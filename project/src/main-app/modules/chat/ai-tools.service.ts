import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BookingHelperService } from '../bookings/booking-helper.service';
import { addMinutes, format, parseISO, isBefore, isAfter } from 'date-fns';

export interface BookingToolArgs {
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format (24-hour)
  location: string;
  subject: string;
  participants?: string[];
}

export interface AvailabilityToolArgs {
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:mm format (optional, defaults to 09:00)
  endTime?: string; // HH:mm format (optional, defaults to 17:00)
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
  getBookingTools(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'book_meeting',
          description: 'Book a calendar meeting/appointment with specified details',
          parameters: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                description: 'Meeting date in YYYY-MM-DD format (e.g., 2025-09-28)',
                pattern: '^\\d{4}-\\d{2}-\\d{2}$'
              },
              time: {
                type: 'string',
                description: 'Meeting time in 24-hour HH:mm format (e.g., 14:30 for 2:30 PM)',
                pattern: '^\\d{2}:\\d{2}$'
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
        message: 'Invalid booking arguments. Please provide valid date (YYYY-MM-DD) and time (HH:mm) formats.'
      };
    }

    // Check if user has booking enabled
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { bookingEnabled: true, subAccountId: true }
    });

    if (!user || !user.bookingEnabled) {
      return {
        success: false,
        message: 'Booking is not enabled for this user.'
      };
    }

    try {
      // Create booking details object
      const details = {
        date: args.date,
        time: args.time,
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
        message: `Meeting booked successfully for ${args.date} at ${args.time}. Booking ID: ${booking.id}`,
        data: {
          bookingId: booking.id,
          date: args.date,
          time: args.time,
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
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      };
    }

    const startTime = args.startTime || '09:00';
    const endTime = args.endTime || '17:00';

    try {
      // Get user's bookings for the specified date
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
        return details.date === args.date;
      });

      // Generate available time slots (30-minute intervals)
      const availableSlots = this.generateAvailableSlots(
        args.date,
        startTime,
        endTime,
        dateBookings
      );

      return {
        success: true,
        message: `Found ${availableSlots.length} available slots for ${args.date}`,
        data: {
          date: args.date,
          availableSlots,
          existingBookings: dateBookings.length
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
   * Generate available time slots for a given date and time range
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
}