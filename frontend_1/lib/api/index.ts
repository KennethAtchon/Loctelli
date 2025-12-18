import { ApiClient } from "./client";
import { UsersApi } from "./endpoints/users";
import { LeadsApi } from "./endpoints/leads";
import { StrategiesApi } from "./endpoints/strategies";
import { BookingsApi } from "./endpoints/bookings";
import { ChatApi } from "./endpoints/chat";
import { PromptTemplatesApi } from "./endpoints/prompt-templates";
import { IntegrationTemplatesApi } from "./endpoints/integration-templates";
import { IntegrationsApi } from "./endpoints/integrations";
import { StatusApi } from "./endpoints/status";
import { AuthApi } from "./endpoints/auth";
import { AdminAuthApi } from "./endpoints/admin-auth";
import { AdminSubAccountsApi } from "./endpoints/admin-subaccounts";
import { GeneralApi } from "./endpoints/general";
import { ContactsApi } from "./endpoints/contacts";
import { FormsApi } from "./endpoints/forms";

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
  public contacts: ContactsApi;
  public forms: FormsApi;

  constructor(baseUrl?: string) {
    super(baseUrl);

    // Initialize all endpoint APIs with shared client instance
    // This ensures single AuthService, single cleanup interval, and shared state
    this.auth = new AuthApi(this);
    this.adminAuth = new AdminAuthApi(this);
    this.adminSubAccounts = new AdminSubAccountsApi(this);
    this.users = new UsersApi(this);
    this.leads = new LeadsApi(this);
    this.strategies = new StrategiesApi(this);
    this.bookings = new BookingsApi(this);
    this.chat = new ChatApi(this);
    this.promptTemplates = new PromptTemplatesApi(this);
    this.integrationTemplates = new IntegrationTemplatesApi(this);
    this.integrations = new IntegrationsApi(this);
    this.status = new StatusApi(this);
    this.general = new GeneralApi(this);
    this.contacts = new ContactsApi(this);
    this.forms = new FormsApi(this);
  }
}

// Create and export a default instance
export const api = new Api();

// Export individual APIs for direct use if needed
export { AuthApi } from "./endpoints/auth";
export { AdminAuthApi } from "./endpoints/admin-auth";
export { AdminSubAccountsApi } from "./endpoints/admin-subaccounts";
export { UsersApi } from "./endpoints/users";
export { LeadsApi } from "./endpoints/leads";
export { StrategiesApi } from "./endpoints/strategies";
export { BookingsApi } from "./endpoints/bookings";
export { ChatApi } from "./endpoints/chat";
export { PromptTemplatesApi } from "./endpoints/prompt-templates";
export { IntegrationTemplatesApi } from "./endpoints/integration-templates";
export { IntegrationsApi } from "./endpoints/integrations";
export { StatusApi } from "./endpoints/status";
export { GeneralApi } from "./endpoints/general";
export { ContactsApi } from "./endpoints/contacts";
export { FormsApi } from "./endpoints/forms";

// Export types
export type { SystemStatus } from "./endpoints/status";
export type {
  LoginDto,
  RegisterDto,
  AuthResponse,
  UserProfile,
} from "./endpoints/auth";
export type {
  AdminLoginDto,
  AdminRegisterDto,
  AdminProfile,
  AdminAuthResponse,
  CreateUserDto,
  UpdateUserDto,
} from "./endpoints/admin-auth";
export type {
  SubAccount,
  DetailedSubAccount,
  CreateSubAccountDto,
  UpdateSubAccountDto,
} from "./endpoints/admin-subaccounts";
export type {
  IntegrationTemplate,
  CreateIntegrationTemplateDto,
  UpdateIntegrationTemplateDto,
} from "./endpoints/integration-templates";
export type {
  Integration,
  CreateIntegrationDto,
  UpdateIntegrationDto,
  TestConnectionResponse,
  SyncDataResponse,
} from "./endpoints/integrations";
export type {
  FormTemplate,
  FormSubmission,
  FormField,
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
  CreateFormSubmissionDto,
  UpdateFormSubmissionDto,
  FormStats,
} from "./endpoints/forms";
