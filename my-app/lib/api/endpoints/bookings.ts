import { ApiClient } from '../client';
import { Booking, CreateBookingDto } from '@/types';

export class BookingsApi extends ApiClient {
  async getBookings(): Promise<Booking[]> {
    return this.get<Booking[]>('/booking');
  }

  async getBooking(id: number): Promise<Booking> {
    return this.get<Booking>(`/booking/${id}`);
  }

  async createBooking(data: CreateBookingDto): Promise<Booking> {
    return this.post<Booking>('/booking', data);
  }

  async updateBooking(id: number, data: Partial<CreateBookingDto>): Promise<Booking> {
    return this.patch<Booking>(`/booking/${id}`, data);
  }

  async deleteBooking(id: number): Promise<void> {
    return this.delete<void>(`/booking/${id}`);
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return this.get<Booking[]>(`/booking?userId=${userId}`);
  }

  async getBookingsByClient(leadId: number): Promise<Booking[]> {
    return this.get<Booking[]>(`/booking?leadId=${leadId}`);
  }

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    return this.get<Booking[]>(`/booking?startDate=${startDate}&endDate=${endDate}`);
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    return this.patch<Booking>(`/booking/${id}/status`, { status });
  }
} 