import { ApiClient } from './client';
import { UsersApi } from './endpoints/users';
import { LeadsApi } from './endpoints/leads';
import { StrategiesApi } from './endpoints/strategies';
import { BookingsApi } from './endpoints/bookings';
import { ChatApi } from './endpoints/chat';
import { PromptTemplatesApi } from './endpoints/prompt-templates';
import { StatusApi } from './endpoints/status';
import { AuthApi } from './endpoints/auth';
import { AdminAuthApi } from './endpoints/admin-auth';
import { GeneralApi } from './endpoints/general';

export class Api extends ApiClient {
  public auth: AuthApi;
  public adminAuth: AdminAuthApi;
  public users: UsersApi;
  public leads: LeadsApi;
  public strategies: StrategiesApi;
  public bookings: BookingsApi;
  public chat: ChatApi;
  public promptTemplates: PromptTemplatesApi;
  public status: StatusApi;
  public general: GeneralApi;

  constructor(baseUrl?: string) {
    super(baseUrl);
    
    // Initialize all endpoint APIs
    this.auth = new AuthApi(baseUrl);
    this.adminAuth = new AdminAuthApi(baseUrl);
    this.users = new UsersApi(baseUrl);
    this.leads = new LeadsApi(baseUrl);
    this.strategies = new StrategiesApi(baseUrl);
    this.bookings = new BookingsApi(baseUrl);
    this.chat = new ChatApi(baseUrl);
    this.promptTemplates = new PromptTemplatesApi(baseUrl);
    this.status = new StatusApi(baseUrl);
    this.general = new GeneralApi(baseUrl);
  }
}

// Create and export a default instance
export const api = new Api();

// Export individual APIs for direct use if needed
export { AuthApi } from './endpoints/auth';
export { AdminAuthApi } from './endpoints/admin-auth';
export { UsersApi } from './endpoints/users';
export { LeadsApi } from './endpoints/leads';
export { StrategiesApi } from './endpoints/strategies';
export { BookingsApi } from './endpoints/bookings';
export { ChatApi } from './endpoints/chat';
export { PromptTemplatesApi } from './endpoints/prompt-templates';
export { StatusApi } from './endpoints/status';
export { GeneralApi } from './endpoints/general';

// Export types
export type { SystemStatus } from './endpoints/status';
export type { LoginDto, RegisterDto, AuthResponse, UserProfile } from './endpoints/auth';
export type { 
  AdminLoginDto, 
  AdminRegisterDto, 
  AdminProfile, 
  AdminAuthResponse, 
  CreateUserDto, 
  UpdateUserDto 
} from './endpoints/admin-auth'; 