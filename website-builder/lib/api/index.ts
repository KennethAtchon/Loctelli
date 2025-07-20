import { ApiClient } from './client';
import { AuthApi } from './endpoints/auth';
import { AdminAuthApi } from './endpoints/admin-auth';
import { StatusApi } from './endpoints/status';

export class Api extends ApiClient {
  public auth: AuthApi;
  public adminAuth: AdminAuthApi;
  public status: StatusApi;

  constructor(baseUrl?: string) {
    super(baseUrl);
    
    // Initialize only the APIs needed for website builder
    this.auth = new AuthApi(baseUrl);
    this.adminAuth = new AdminAuthApi(baseUrl);
    this.status = new StatusApi(baseUrl);
  }
}

// Create and export a default instance
export const api = new Api();

// Export individual APIs for direct use if needed
export { AuthApi } from './endpoints/auth';
export { AdminAuthApi } from './endpoints/admin-auth';
export { StatusApi } from './endpoints/status';

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