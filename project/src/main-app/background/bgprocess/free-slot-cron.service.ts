import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { addDays } from 'date-fns';

interface GhlLocation {
  id: string;
  name: string;
  email?: string;
}

interface GhlSubaccountsResponse {
  locations?: GhlLocation[];
}

interface UserData {
  name: string;
  company: string;
  email?: string;
  locationId?: string;
  [key: string]: any;
}

interface User {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  budget: string | null;
  bookingsTime: any;
  bookingEnabled: number;
  calendarId: string | null;
  locationId: string | null;
  assignedUserId: string | null;
}

@Injectable()
export class FreeSlotCronService {
  private readonly logger = new Logger(FreeSlotCronService.name);
  private readonly ghlApiKey: string;
  private readonly ghlApiVersion: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.ghlApiKey = this.configService.get<string>('GHL_API_KEY') || '';
    this.ghlApiVersion = this.configService.get<string>(
      'GHL_API_VERSION',
      '2021-04-15',
    );
  }

  /**
   * Import users from GoHighLevel subaccounts (locations) and create a user for each subaccount.
   * This is the background-process version of the /import-ghl-users endpoint.
   * DEPRECATED: This is not needed anymore, this won't provide us the API key which is needed for automations
   */
  async importGhlUsersBg(): Promise<User[]> {
    try {
      // Get typed response from GoHighLevel API
      const response = await this.searchGohighlevelSubaccounts();
      if (!response || !response.locations || response.locations.length === 0) {
        this.logger.warn(
          '[importGhlUsersBg] Failed to fetch subaccounts from GoHighLevel API',
        );
        return [];
      }

      const createdUsers: User[] = [];
      for (const location of response.locations) {
        // Create user data with proper fields from the location
        const userData: UserData = {
          name: location.name,
          company: location.name, // Use location name as company since companyId doesn't exist
          email: location.email,
          locationId: location.id, // Set the locationId field
        };

        // Prevent duplicates by checking if user with same email or locationId exists
        let existingUser: User | null = null;
        if (userData.email) {
          existingUser = (await this.prisma.user.findFirst({
            where: { email: userData.email },
          })) as User | null;
        }

        if (!existingUser && userData.locationId) {
          existingUser = (await this.prisma.user.findFirst({
            where: { locationId: userData.locationId },
          })) as User | null;
        }

        if (existingUser) {
          // Update existing user's locationId if needed
          if (!existingUser.locationId && userData.locationId) {
            await this.prisma.user.update({
              where: { id: existingUser.id },
              data: { locationId: userData.locationId } as any,
            });
          }
          continue;
        }

        // Create new user
        const dbUser = (await this.prisma.user.create({
          data: userData as any,
        })) as User;

        createdUsers.push(dbUser);
      }

      this.logger.log(
        `[importGhlUsersBg] Imported ${createdUsers.length} users from GoHighLevel.`,
      );
      return createdUsers;
    } catch (error) {
      this.logger.error(`[importGhlUsersBg] Error importing users: ${error}`);
      return [];
    }
  }

  /**
   * Search for GoHighLevel subaccounts (locations)
   * DEPRECATED: This is not needed anymore, this won't provide us the API key which is needed for automations
   */
  private async searchGohighlevelSubaccounts(): Promise<GhlSubaccountsResponse> {
    try {
      const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${this.ghlApiKey}`,
        Version: this.ghlApiVersion,
      };

      const url = 'https://services.leadconnectorhq.com/locations/';
      const response = await axios.get(url, { headers });

      if (response.status === 200) {
        return response.data;
      }

      return {};
    } catch (error) {
      this.logger.error(`Error fetching subaccounts: ${error}`);
      return {};
    }
  }

  /**
   * Fetch free slots from GoHighLevel for each user with a calendarId, Availability slots, The AI tool will call this function realistically.
   * CURRENTLY BLOCKED: Set up but disabled until GHL integration is ready
   */
  async fetchFreeSlots(): Promise<void> {
    // BLOCKED: GHL integration not ready yet
    this.logger.log('GHL fetchFreeSlots called but currently blocked');
    return;

    // TODO: Uncomment when GHL is ready
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${this.ghlApiKey}`,
      Version: this.ghlApiVersion,
    };

    try {
      const users = await this.prisma.user.findMany();

      for (const user of users) {
        const calendarId = user.calendarId;
        if (!calendarId) {
          this.logger.debug(
            `[${new Date().toISOString()}] Skipping userId=${user.id}: no calendarId.`,
          );
          continue;
        }

        // Calculate 1 day from now to 8 days from now (in ms since epoch)
        const now = new Date();
        const startDt = addDays(now, 1);
        const endDt = addDays(now, 8);
        const startMs = startDt.getTime();
        const endMs = endDt.getTime();

        const params = {
          startDate: startMs,
          endDate: endMs,
        };

        const url = `https://services.leadconnectorhq.com/calendars/${calendarId}/free-slots`;

        try {
          const response = await axios.get(url, { headers, params });

          if (response.status === 200) {
            await this.prisma.user.update({
              where: { id: user.id },
              data: { bookingsTime: response.data } as any,
            });

            this.logger.log(
              `[${new Date().toISOString()}] Updated bookingsTime for userId=${user.id} (calendarId=${calendarId})`,
            );
          }
        } catch (error) {
          this.logger.error(
            `[${new Date().toISOString()}] Error fetching slots for userId=${user.id}, calendarId=${calendarId}: ${error}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[${new Date().toISOString()}] Error updating user bookingsTime: ${error}`,
      );
    }
  }

  /**
   * Run background processes on schedule
   * ENABLED but BLOCKED: Ready for when GHL integration is unblocked
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCronTasks() {
    this.logger.log('Running scheduled background tasks');
    // Note: fetchFreeSlots is currently blocked internally
    await this.fetchFreeSlots();
  }

  /**
   * Manual method to populate bookingsTime field with sample data for testing
   * This should be replaced with actual calendar integration data
   */
  async populateTestBookingsTime(): Promise<void> {
    this.logger.log(
      'Populating test bookingsTime data for users with booking enabled',
    );

    try {
      const users = await this.prisma.user.findMany({
        where: {
          bookingEnabled: {
            not: 0,
          },
        },
      });

      const now = new Date();
      const testData: Array<{ date: string; slots: string[] }> = [];

      // Generate test availability for next 7 days
      for (let i = 1; i <= 7; i++) {
        const date = addDays(now, i);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Generate sample time slots (9 AM to 5 PM, 30-min intervals)
        const slots: string[] = [];
        for (let hour = 9; hour < 17; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }

        testData.push({
          date: dateStr,
          slots: slots,
        });
      }

      // Update each user with test booking data
      for (const user of users) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            bookingsTime: testData,
          },
        });

        this.logger.log(`Updated test bookingsTime for userId=${user.id}`);
      }

      this.logger.log(
        `Populated test bookingsTime data for ${users.length} users`,
      );
    } catch (error) {
      this.logger.error(`Error populating test bookingsTime: ${error}`);
    }
  }
}
