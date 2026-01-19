import { ApiClient } from "../client";
import { Booking, CreateBookingDto } from "@/types";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { bookingsConfig } from "../config/bookings.config";

export class BookingsApi {
  private api: EndpointApi<typeof bookingsConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(bookingsConfig);
  }

  async getBookings(params?: {
    subAccountId?: number;
    userId?: number;
    leadId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Booking[]> {
    return this.api.getBookings(params) as Promise<Booking[]>;
  }

  async getBooking(id: number): Promise<Booking> {
    return this.api.getBooking({ id }) as Promise<Booking>;
  }

  async createBooking(data: CreateBookingDto): Promise<Booking> {
    return this.api.createBooking(undefined, data) as Promise<Booking>;
  }

  async updateBooking(
    id: number,
    data: Partial<CreateBookingDto>
  ): Promise<Booking> {
    return this.api.updateBooking({ id }, data) as Promise<Booking>;
  }

  async deleteBooking(id: number): Promise<void> {
    return this.api.deleteBooking({ id }) as Promise<void>;
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return this.api.getBookingsByUser({ userId }) as Promise<Booking[]>;
  }

  async getBookingsByLead(leadId: number): Promise<Booking[]> {
    return this.api.getBookingsByLead({ leadId }) as Promise<Booking[]>;
  }

  async getBookingsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Booking[]> {
    return this.api.getBookingsByDateRange({
      startDate,
      endDate,
    }) as Promise<Booking[]>;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    return this.api.updateBookingStatus({ id }, { status }) as Promise<Booking>;
  }
}
