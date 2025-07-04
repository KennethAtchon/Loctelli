import { ApiClient } from './client';
import { UsersApi } from './endpoints/users';
import { ClientsApi } from './endpoints/clients';
import { StrategiesApi } from './endpoints/strategies';
import { BookingsApi } from './endpoints/bookings';
import { ChatApi } from './endpoints/chat';
import { StatusApi } from './endpoints/status';
import { AuthApi } from './endpoints/auth';

export class Api extends ApiClient {
  public auth: AuthApi;
  public users: UsersApi;
  public clients: ClientsApi;
  public strategies: StrategiesApi;
  public bookings: BookingsApi;
  public chat: ChatApi;
  public status: StatusApi;

  constructor(baseUrl?: string) {
    super(baseUrl);
    
    // Initialize all endpoint APIs
    this.auth = new AuthApi(baseUrl);
    this.users = new UsersApi(baseUrl);
    this.clients = new ClientsApi(baseUrl);
    this.strategies = new StrategiesApi(baseUrl);
    this.bookings = new BookingsApi(baseUrl);
    this.chat = new ChatApi(baseUrl);
    this.status = new StatusApi(baseUrl);
  }
}

// Create and export a default instance
export const api = new Api();

// Export individual APIs for direct use if needed
export { AuthApi } from './endpoints/auth';
export { UsersApi } from './endpoints/users';
export { ClientsApi } from './endpoints/clients';
export { StrategiesApi } from './endpoints/strategies';
export { BookingsApi } from './endpoints/bookings';
export { ChatApi } from './endpoints/chat';
export { StatusApi } from './endpoints/status';

// Export types
export type { SystemStatus } from './endpoints/status';
export type { LoginDto, RegisterDto, AuthResponse, UserProfile } from './endpoints/auth'; 