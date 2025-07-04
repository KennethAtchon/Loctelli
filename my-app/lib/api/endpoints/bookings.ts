import { ApiClient } from '../client';
import { Booking, CreateBookingDto } from '@/types';

export class BookingsApi extends ApiClient {
  async getBookings(): Promise<Booking[]> {
    return this.get<Booking[]>('/bookings');
  }

  async getBooking(id: number): Promise<Booking> {
    return this.get<Booking>(`/bookings/${id}`);
  }

  async createBooking(data: CreateBookingDto): Promise<Booking> {
    return this.post<Booking>('/bookings', data);
  }

  async updateBooking(id: number, data: Partial<CreateBookingDto>): Promise<Booking> {
    return this.patch<Booking>(`/bookings/${id}`, data);
  }

  async deleteBooking(id: number): Promise<void> {
    return this.delete<void>(`/bookings/${id}`);
  }

  async getBookingsByUser(userId: number): Promise<Booking[]> {
    return this.get<Booking[]>(`/bookings?userId=${userId}`);
  }

  async getBookingsByClient(clientId: number): Promise<Booking[]> {
    return this.get<Booking[]>(`/bookings?clientId=${clientId}`);
  }

  async getBookingsByDateRange(startDate: string, endDate: string): Promise<Booking[]> {
    return this.get<Booking[]>(`/bookings?startDate=${startDate}&endDate=${endDate}`);
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking> {
    return this.patch<Booking>(`/bookings/${id}/status`, { status });
  }
} 