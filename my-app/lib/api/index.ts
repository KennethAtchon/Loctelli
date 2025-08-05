import { ApiClient } from './client';
import { UsersApi } from './endpoints/users';
import { LeadsApi } from './endpoints/leads';
import { StrategiesApi } from './endpoints/strategies';
import { BookingsApi } from './endpoints/bookings';
import { ChatApi } from './endpoints/chat';
import { PromptTemplatesApi } from './endpoints/prompt-templates';
import { IntegrationTemplatesApi } from './endpoints/integration-templates';
import { IntegrationsApi } from './endpoints/integrations';
import { StatusApi } from './endpoints/status';
import { AuthApi } from './endpoints/auth';
import { AdminAuthApi } from './endpoints/admin-auth';
import { AdminSubAccountsApi } from './endpoints/admin-subaccounts';
import { GeneralApi } from './endpoints/general';
import { SmsApi } from './endpoints/sms';
import { ScrapingApi } from './endpoints/scraping';

export class Api extends ApiClient {
  public auth: AuthApi;
  public adminAuth: AdminAuthApi;
  public adminSubAccounts: AdminSubAccountsApi;
  public users: UsersApi;
  public leads: LeadsApi;
  public strategies: StrategiesApi;
  public bookings: BookingsApi;
  public chat: ChatApi;
  public promptTemplates: PromptTemplatesApi;
  public integrationTemplates: IntegrationTemplatesApi;
  public integrations: IntegrationsApi;
  public status: StatusApi;
  public general: GeneralApi;
  public sms: SmsApi;
  public scraping: ScrapingApi;

  constructor(baseUrl?: string) {
    super(baseUrl);
    
    // Initialize all endpoint APIs
    this.auth = new AuthApi(baseUrl);
    this.adminAuth = new AdminAuthApi(baseUrl);
    this.adminSubAccounts = new AdminSubAccountsApi(baseUrl);
    this.users = new UsersApi(baseUrl);
    this.leads = new LeadsApi(baseUrl);
    this.strategies = new StrategiesApi(baseUrl);
    this.bookings = new BookingsApi(baseUrl);
    this.chat = new ChatApi(baseUrl);
    this.promptTemplates = new PromptTemplatesApi(baseUrl);
    this.integrationTemplates = new IntegrationTemplatesApi(baseUrl);
    this.integrations = new IntegrationsApi(baseUrl);
    this.status = new StatusApi(baseUrl);
    this.general = new GeneralApi(baseUrl);
    this.sms = new SmsApi(baseUrl);
    this.scraping = new ScrapingApi(baseUrl);
  }
}

// Create and export a default instance
export const api = new Api();

// Export individual APIs for direct use if needed
export { AuthApi } from './endpoints/auth';
export { AdminAuthApi } from './endpoints/admin-auth';
export { AdminSubAccountsApi } from './endpoints/admin-subaccounts';
export { UsersApi } from './endpoints/users';
export { LeadsApi } from './endpoints/leads';
export { StrategiesApi } from './endpoints/strategies';
export { BookingsApi } from './endpoints/bookings';
export { ChatApi } from './endpoints/chat';
export { PromptTemplatesApi } from './endpoints/prompt-templates';
export { IntegrationTemplatesApi } from './endpoints/integration-templates';
export { IntegrationsApi } from './endpoints/integrations';
export { StatusApi } from './endpoints/status';
export { GeneralApi } from './endpoints/general';
export { SmsApi } from './endpoints/sms';
export { ScrapingApi } from './endpoints/scraping';

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
export type { 
  SubAccount, 
  DetailedSubAccount, 
  CreateSubAccountDto, 
  UpdateSubAccountDto 
} from './endpoints/admin-subaccounts';
export type { 
  IntegrationTemplate, 
  CreateIntegrationTemplateDto, 
  UpdateIntegrationTemplateDto 
} from './endpoints/integration-templates';
export type { 
  Integration, 
  CreateIntegrationDto, 
  UpdateIntegrationDto, 
  TestConnectionResponse, 
  SyncDataResponse 
} from './endpoints/integrations'; 