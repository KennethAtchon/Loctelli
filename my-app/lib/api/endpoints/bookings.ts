import { ApiClient } from '../client';
import { Booking, CreateBookingDto } from '@/types';

export class BookingsApi {
  constructor(private client: ApiClient) {}
  
  async getBookings(params?: { subAccountId?: number; userId?: number; leadId?: number; startDate?: string; endDate?: string }): Promise<Booking[]> {
    const queryParams = new URLSearchParams();
    if (params?.subAccountId) {
      queryParams.append('subAccountId', params.subAccountId.toString());
    }
    if (params?.userId !== undefined && params?.userId !== null) {
      queryParams.append('userId', params.userId.toString());
    }
    if (params?.leadId) {
      queryParams.append('leadId', params.leadId.toString());
    }
    if (params?.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    const queryString = queryParams.toString();
    return this.client.get<Booking[]>(`/booking${queryString ? `?${queryString}` : ''}`);
  }

  async getBooking(id: number): Promise<Booking> {
    return this.client.get<Booking>(`/booking/${id}`);
  }

  async createBooking(data: CreateBookingDto): Promise<Booking> {
    return this.client.post<Booking>('/booking', data);
  }

  async updateBooking(id: number, data: Partial<CreateBookingDto>): Promise<Booking> {
    return this.client.patch<Booking>(`/booking/${id}`, data);
  }

  async deleteBooking(id: number): Promise<void> {
    return this.client.delete<void>(`/booking/${id}`);
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return this.client.get<Booking[]>(`/booking?userId=${userId}`);
  }

  async getBookingsByLead(leadId: number): Promise<Booking[]> {
    return this.client.get<Booking[]>(`/booking?leadId=${leadId}`);
  }

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    return this.client.get<Booking[]>(`/booking?startDate=${startDate}&endDate=${endDate}`);
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    return this.client.patch<Booking>(`/booking/${id}/status`, { status });
  }
} 