import { tool } from 'ai';
import { z } from 'zod';
import { Injectable, Logger } from '@nestjs/common';
import { BookingHelperService } from '../../bookings/booking-helper.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * Booking tools for Vercel AI SDK
 * Config-based approach: userId and leadId are passed in closure
 */
@Injectable()
export class BookingToolsVercel {
  private readonly logger = new Logger(BookingToolsVercel.name);

  constructor(
    private prisma: PrismaService,
    private bookingHelper: BookingHelperService,
  ) {}

  /**
   * Create book meeting tool for Vercel AI SDK
   * @param userId User ID (from closure)
   * @param leadId Lead ID (from closure)
   * @param leadTimezone Optional lead timezone
   */
  createBookMeetingTool(userId: number, leadId: number, leadTimezone?: string) {
    const timezoneDescription = leadTimezone
      ? `IANA timezone identifier (e.g., "America/New_York", "America/Los_Angeles", "Europe/London"). OPTIONAL - Lead timezone (${leadTimezone}) will be used if not provided.`
      : 'IANA timezone identifier (e.g., "America/New_York", "America/Los_Angeles", "Europe/London"). REQUIRED - must be confirmed with lead before booking.';

    return tool({
      description: leadTimezone
        ? `Book a calendar meeting/appointment with specified details. Lead's timezone is ${leadTimezone}, so you can proceed without asking for timezone.`
        : 'Book a calendar meeting/appointment with specified details. ALWAYS confirm timezone with the lead before booking.',
      parameters: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format'),
        timezone: z
          .string()
          .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid IANA timezone format')
          .optional(),
        location: z
          .string()
          .describe(
            'Meeting location (e.g., "Online", "Office", "Client Site")',
          ),
        subject: z.string().describe('Meeting subject/title'),
        participants: z
          .array(z.string().email())
          .default([])
          .describe('Email addresses of meeting participants (optional)'),
      }),
      // @ts-expect-error - TypeScript type inference issue with 'ai' package tool function execute property
      execute: async ({
        date,
        time,
        timezone,
        location,
        subject,
        participants,
      }) => {
        try {
          // Get user and lead for timezone resolution
          const [user, lead] = await Promise.all([
            this.prisma.user.findUnique({
              where: { id: userId },
              select: {
                bookingEnabled: true,
                subAccountId: true,
                timezone: true,
              },
            }),
            this.prisma.lead.findUnique({
              where: { id: leadId },
              select: { timezone: true },
            }),
          ]);

          if (!user || !user.bookingEnabled) {
            return "I'm sorry, booking is not enabled for this account. Please contact support.";
          }

          // Resolve timezone: lead > provided > user > default
          const resolvedTimezone =
            lead?.timezone ||
            timezone ||
            leadTimezone ||
            user.timezone ||
            'America/New_York';

          // Create booking details
          const details = {
            date,
            time,
            location,
            subject,
            participants: participants || [],
          };

          // Create booking in database
          const booking = await this.prisma.booking.create({
            data: {
              regularUser: { connect: { id: userId } },
              lead: { connect: { id: leadId } },
              bookingType: 'meeting',
              details,
              status: 'pending',
              subAccount: { connect: { id: user.subAccountId } },
            },
          });

          // TODO: Create GoHighLevel block slot
          // await this.bookingHelper.createGohighlevelBlockSlot(booking);

          return `Perfect! I've booked your meeting for ${date} at ${time}. You'll receive a confirmation email shortly.`;
        } catch (error) {
          this.logger.error('Error booking meeting:', error);
          return "I'm sorry, I encountered an issue booking the meeting. Please try again or contact support.";
        }
      },
    });
  }

  /**
   * Create check availability tool for Vercel AI SDK
   * @param userId User ID (from closure)
   */
  createCheckAvailabilityTool(userId: number) {
    return tool({
      description:
        'Check calendar availability for a specific date and time range',
      parameters: z.object({
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        startTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .default('09:00')
          .describe('Start time in HH:mm format (defaults to 09:00)'),
        endTime: z
          .string()
          .regex(/^\d{2}:\d{2}$/)
          .default('17:00')
          .describe('End time in HH:mm format (defaults to 17:00)'),
      }),
      // @ts-expect-error - TypeScript type inference issue with 'ai' package tool function execute property
      execute: async ({ date, startTime, endTime }) => {
        try {
          const start = startTime || '09:00';
          const end = endTime || '17:00';

          // Get user bookings for the date
          const bookings = await this.prisma.booking.findMany({
            where: {
              regularUserId: userId,
              details: {
                path: ['date'],
                equals: date,
              },
            },
          });

          // Simple availability check - return available slots
          const availableSlots: string[] = [];
          const bookedTimes = bookings
            .map((b) => {
              const details = b.details;
              if (details && typeof details === 'object' && 'time' in details) {
                return details.time as string;
              }
              return null;
            })
            .filter((time): time is string => time !== null);

          // Generate hourly slots
          for (
            let hour = parseInt(start.split(':')[0]);
            hour < parseInt(end.split(':')[0]);
            hour++
          ) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            if (!bookedTimes.includes(timeSlot)) {
              availableSlots.push(timeSlot);
            }
          }

          return `Here are the available time slots for ${date}: ${availableSlots.length > 0 ? availableSlots.join(', ') : 'No available slots'}`;
        } catch (error) {
          this.logger.error('Error checking availability:', error);
          return "I'm sorry, I couldn't check availability right now. Please try again later.";
        }
      },
    });
  }
}
