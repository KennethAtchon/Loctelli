import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { GhlApiClientService } from '../../integrations/ghl-integrations/ghl/ghl-api-client.service';
import { addMinutes, format, parseISO } from 'date-fns';

interface BookingDetails {
  date: string;
  time: string;
  location: string;
  subject: string;
}

interface GhlCalendar {
  id: string;
  name: string;
}

interface GhlCalendarsResponse {
  calendars: GhlCalendar[];
  firstCalendar?: GhlCalendar;
}

@Injectable()
export class BookingHelperService {
  private readonly logger = new Logger(BookingHelperService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ghlApiClient: GhlApiClientService,
  ) {}

  /**
   * Calls the GoHighLevel API to create a block slot for the new booking.
   * @param booking Booking entity from database
   * @deprecated Temporarily disabled - not priority
   */
  createGohighlevelBlockSlot(booking: any): Promise<void> {
    // TODO: Re-enable GHL block slot creation when priority
    this.logger.warn('createGohighlevelBlockSlot is temporarily disabled');
    return Promise.resolve();

    /* COMMENTED OUT - NOT PRIORITY
    try {
      // Lookup user to get calendarId
      const user = await this.prisma.user.findUnique({
        where: { id: booking.userId },
      });

      if (!user) {
        this.logger.warn(`User not found for userId=${booking.userId}`);
        return;
      }

      let calendarId = user.calendarId;
      const locationId = user.locationId;

      if (!locationId) {
        this.logger.warn(`locationId not found for userId=${booking.userId}`);
        return;
      }

      // Find the GHL integration for this subaccount
      const ghlIntegration = await this.prisma.integration.findFirst({
        where: {
          subAccountId: user.subAccountId,
          integrationTemplate: {
            name: 'gohighlevel',
          },
          isActive: true,
        },
      });

      if (!ghlIntegration) {
        this.logger.warn(`No active GHL integration found for subAccountId=${user.subAccountId}`);
        return;
      }

      // If user doesn't have a calendarId, try using GHL integration's calendarId
      if (!calendarId) {
        this.logger.log(
          `calendarId not found for userId=${booking.userId}, trying GHL integration calendarId`,
        );

        const integrationCalendarId = await this.getGhlIntegrationCalendarId(
          user.subAccountId,
        );

        if (integrationCalendarId) {
          calendarId = integrationCalendarId;
          this.logger.log(
            `Using GHL integration calendarId ${calendarId} for userId=${booking.userId}`,
          );

          // Update the user record with the integration's calendar_id
          await this.prisma.user.update({
            where: { id: user.id },
            data: { calendarId },
          });
          this.logger.log(
            `Updated user record with integration calendarId=${calendarId}`,
          );
        } else {
          this.logger.warn(
            `No calendarId found in GHL integration for userId=${booking.userId}`,
          );
          return;
        }
      }

      if (!calendarId) {
        this.logger.warn(
          `Could not determine calendarId for userId=${booking.userId}`,
        );
        return;
      }

      // Get date and time from booking details
      const details = booking.details as BookingDetails;
      const dateStr = details.date;
      const timeStr = details.time;

      try {
        // Combine date and time strings and parse to datetime
        const datetimeStr = `${dateStr}T${timeStr}`;
        const startDt = parseISO(datetimeStr);
        const endDt = addMinutes(startDt, 30);

        // Format as ISO8601 strings
        const startTimeIso = format(startDt, "yyyy-MM-dd'T'HH:mm:ss");
        const endTimeIso = format(endDt, "yyyy-MM-dd'T'HH:mm:ss");

        const blockSlotData = {
          calendarId,
          locationId,
          startTime: startTimeIso,
          endTime: endTimeIso,
          title: details.subject || 'Block Slot',
        };

        this.logger.log(
          `Creating GHL block slot using API client: ${JSON.stringify(blockSlotData)}`,
        );

        // Use the new API client to create the block slot
        const response = await this.ghlApiClient.createBlockSlot(ghlIntegration.id, blockSlotData);

        this.logger.log(
          `GHL block slot created successfully: ${JSON.stringify(response)}`,
        );
      } catch (error) {
        this.logger.error(
          `Error parsing date/time: ${error}. Date: '${dateStr}', Time: '${timeStr}'`,
        );
      }
    } catch (error) {
      this.logger.error(`Error posting block slot to GHL: ${error}`);
    }
    */
  }

  /**
   * Creates a booking and then creates a block slot in GoHighLevel.
   * @param aiResponse AI response containing booking details
   * @param userId User ID
   * @param leadId Lead ID
   */
  async createBookingAndBlockSlotGhl(
    aiResponse: string,
    userId: number,
    leadId: number,
  ): Promise<any | null> {
    const booking = await this.parseAndCreateBooking(
      aiResponse,
      userId,
      leadId,
    );
    // TODO: Re-enable GHL block slot creation when priority
    // if (booking) {
    //   await this.createGohighlevelBlockSlot(booking);
    // }
    return booking;
  }

  /**
   * Detects the [BOOKING_CONFIRMATION] marker in the AI response, extracts booking details,
   * and creates a Booking record in the database. Returns the Booking or null if not triggered.
   * @param aiResponse AI response text
   * @param userId User ID
   * @param leadId Lead ID
   */
  async parseAndCreateBooking(
    aiResponse: string,
    userId: number,
    leadId: number,
  ): Promise<any | null> {
    // Check for the unique marker
    if (!aiResponse.includes('[BOOKING_CONFIRMATION]')) {
      return null;
    }

    // Try to extract details from a flexible booking confirmation pattern
    const pattern =
      /- Date:\s*(?<date>.+)\s*- Time:\s*(?<time>.+)\s*- Location:\s*(?<location>.+)\s*- Subject:\s*(?<subject>.+?)\s*/s;
    const match = pattern.exec(aiResponse);

    let bookingDetails: BookingDetails | null = null;

    if (match && match.groups) {
      bookingDetails = {
        date: match.groups.date.trim(),
        time: match.groups.time.trim(),
        location: match.groups.location.trim(),
        subject: match.groups.subject.trim(),
      };
    } else {
      // Attempt to extract JSON details from the message
      const jsonMatch = /```json(.*?)```/s.exec(aiResponse);
      if (jsonMatch) {
        try {
          bookingDetails = JSON.parse(jsonMatch[1].trim());
        } catch (error) {
          bookingDetails = null;
        }
      } else {
        // Fallback: try to find the first JSON-like object in the message
        const jsonObjectMatch = /({[\s\S]+})/s.exec(aiResponse);
        try {
          bookingDetails = jsonObjectMatch
            ? JSON.parse(jsonObjectMatch[1])
            : null;
        } catch (error) {
          bookingDetails = null;
        }
      }
    }

    if (!bookingDetails) {
      return null;
    }

    // Build details object from parsed fields
    const details = {
      date: bookingDetails.date,
      time: bookingDetails.time,
      location: bookingDetails.location,
      subject: bookingDetails.subject,
    };

    // Get user's SubAccount
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { subAccountId: true },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Create booking in database
    const booking = await this.prisma.booking.create({
      data: {
        regularUser: {
          connect: { id: userId },
        },
        ...(leadId && {
          lead: {
            connect: { id: leadId },
          },
        }),
        bookingType: 'meeting',
        details,
        status: 'pending',
        subAccount: {
          connect: { id: user.subAccountId },
        },
      },
    });

    return booking;
  }

  /**
   * Gets calendars for a specific location from GoHighLevel API
   * @param locationId GoHighLevel location ID
   * @param integrationId GHL integration ID for authentication
   */
  private async getCalendarsByLocation(
    locationId: string,
    integrationId: number,
  ): Promise<GhlCalendarsResponse | null> {
    try {
      const response = await this.ghlApiClient.getCalendars(
        integrationId,
        locationId,
      );

      if (response && Array.isArray(response.calendars)) {
        const calendars = response.calendars as GhlCalendar[];
        return {
          calendars,
          firstCalendar: calendars.length > 0 ? calendars[0] : undefined,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching calendars for location ${locationId}: ${error}`,
      );
      return null;
    }
  }

  /**
   * Gets the GHL integration's calendar ID as a fallback
   * @param subAccountId The subaccount ID to find the GHL integration for
   */
  private async getGhlIntegrationCalendarId(
    subAccountId: number,
  ): Promise<string | null> {
    try {
      // Find the GHL integration for this subaccount
      const ghlIntegration = await this.prisma.integration.findFirst({
        where: {
          subAccountId,
          integrationTemplate: {
            name: 'gohighlevel',
          },
          isActive: true,
        },
        include: {
          integrationTemplate: true,
        },
      });

      if (!ghlIntegration) {
        this.logger.warn(
          `No active GHL integration found for subAccountId=${subAccountId}`,
        );
        return null;
      }

      const config = ghlIntegration.config as any;
      if (config.calendarId) {
        this.logger.log(
          `Found calendarId ${config.calendarId} from GHL integration for subAccountId=${subAccountId}`,
        );
        return config.calendarId;
      }

      this.logger.warn(
        `GHL integration found but no calendarId configured for subAccountId=${subAccountId}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error fetching GHL integration calendar ID for subAccountId=${subAccountId}: ${error}`,
      );
      return null;
    }
  }
}
