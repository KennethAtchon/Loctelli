import { ToolBuilder, type ToolResult, type ExecutionContext } from '@atchonk/ai-receptionist';
import { Injectable, Logger } from '@nestjs/common';
import { BookingHelperService } from '../../bookings/booking-helper.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { addMinutes, format, parseISO } from 'date-fns';

/**
 * Custom booking tools for AI-receptionist
 * Wraps existing booking functionality to work with AI-receptionist tool system
 */
@Injectable()
export class BookingTools {
  private readonly logger = new Logger(BookingTools.name);

  constructor(
    private prisma: PrismaService,
    private bookingHelper: BookingHelperService
  ) {}

  /**
   * Create booking tool for AI-receptionist
   */
  createBookMeetingTool(leadTimezone?: string) {
    const timezoneDescription = leadTimezone
      ? `IANA timezone identifier (e.g., "America/New_York", "America/Los_Angeles", "Europe/London"). OPTIONAL - Lead timezone (${leadTimezone}) will be used if not provided.`
      : 'IANA timezone identifier (e.g., "America/New_York", "America/Los_Angeles", "Europe/London"). REQUIRED - must be confirmed with lead before booking.';

    return new ToolBuilder()
      .withName('book_meeting')
      .withDescription(
        leadTimezone
          ? `Book a calendar meeting/appointment with specified details. Lead's timezone is ${leadTimezone}, so you can proceed without asking for timezone.`
          : 'Book a calendar meeting/appointment with specified details. ALWAYS confirm timezone with the lead before booking.'
      )
      .withParameters({
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
      })
      .onCall(async (params, ctx: ExecutionContext): Promise<ToolResult> => {
        try {
          // Extract userId and leadId from metadata
          const userId = ctx.metadata?.userId as number;
          const leadId = ctx.metadata?.leadId as number;
          
          if (!userId || !leadId) {
            return {
              success: false,
              error: 'Missing userId or leadId in context',
              response: {
                speak: "I'm sorry, I encountered an issue booking the meeting. Please try again or contact support."
              }
            };
          }
          
          // Get user and lead for timezone resolution
          const [user, lead] = await Promise.all([
            this.prisma.user.findUnique({
              where: { id: userId },
              select: { bookingEnabled: true, subAccountId: true, timezone: true }
            }),
            this.prisma.lead.findUnique({
              where: { id: leadId },
              select: { timezone: true }
            })
          ]);

          if (!user || !user.bookingEnabled) {
            return {
              success: false,
              error: 'Booking is not enabled for this user',
              response: {
                speak: "I'm sorry, booking is not enabled for this account. Please contact support."
              }
            };
          }

          // Resolve timezone: lead > provided > user > default
          const timezone = lead?.timezone || params.timezone || leadTimezone || user.timezone || 'America/New_York';

          // Create booking details
          const details = {
            date: params.date,
            time: params.time,
            location: params.location,
            subject: params.subject,
            participants: params.participants || []
          };

          // Create booking in database
          const booking = await this.prisma.booking.create({
            data: {
              regularUser: { connect: { id: userId } },
              lead: { connect: { id: leadId } },
              bookingType: 'meeting',
              details,
              status: 'pending',
              subAccount: { connect: { id: user.subAccountId } }
            }
          });

          // Create GoHighLevel block slot
          await this.bookingHelper.createGohighlevelBlockSlot(booking);

          return {
            success: true,
            data: { bookingId: booking.id },
            response: {
              speak: `Perfect! I've booked your meeting for ${params.date} at ${params.time}. You'll receive a confirmation email shortly.`
            }
          };
        } catch (error) {
          this.logger.error('Error booking meeting:', error);
          return {
            success: false,
            error: error.message,
            response: {
              speak: "I'm sorry, I encountered an issue booking the meeting. Please try again or contact support."
            }
          };
        }
      })
      .build();
  }

  /**
   * Create availability check tool for AI-receptionist
   */
  createCheckAvailabilityTool() {
    return new ToolBuilder()
      .withName('check_availability')
      .withDescription('Check calendar availability for a specific date and time range')
      .withParameters({
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
      })
      .onCall(async (params, ctx: ExecutionContext): Promise<ToolResult> => {
        try {
          // Extract userId from metadata
          const userId = ctx.metadata?.userId as number;
          
          if (!userId) {
            return {
              success: false,
              error: 'Missing userId in context',
              response: {
                speak: "I'm sorry, I couldn't check availability right now."
              }
            };
          }
          const startTime = params.startTime || '09:00';
          const endTime = params.endTime || '17:00';

          // Get user bookings for the date
          const bookings = await this.prisma.booking.findMany({
            where: {
              regularUserId: userId,
              details: {
                path: ['date'],
                equals: params.date
              }
            }
          });

          // Simple availability check - return available slots
          // This is a simplified version - you may want to enhance this
          const availableSlots: string[] = [];
          const bookedTimes = bookings.map(b => {
            const details = b.details as any;
            return details?.time;
          }).filter(Boolean);

          // Generate hourly slots
          for (let hour = parseInt(startTime.split(':')[0]); hour < parseInt(endTime.split(':')[0]); hour++) {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            if (!bookedTimes.includes(timeSlot)) {
              availableSlots.push(timeSlot);
            }
          }

          return {
            success: true,
            data: { 
              date: params.date,
              availableSlots,
              bookedSlots: bookedTimes
            },
            response: {
              speak: `Here are the available time slots for ${params.date}: ${availableSlots.length > 0 ? availableSlots.join(', ') : 'No available slots'}`
            }
          };
        } catch (error) {
          this.logger.error('Error checking availability:', error);
          return {
            success: false,
            error: error.message,
            response: {
              speak: "I'm sorry, I couldn't check availability right now. Please try again later."
            }
          };
        }
      })
      .build();
  }
}

