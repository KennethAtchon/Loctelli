import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { adminAuthConfig } from "../config/admin-auth.config";

export interface AdminLoginDto {
  email: string;
  password: string;
  accountType?: "admin";
  rememberMe?: boolean;
}

export interface AdminRegisterDto {
  name: string;
  email: string;
  password: string;
  accountType?: "admin";
  role?: string;
  permissions?: Record<string, unknown>;
  authCode: string;
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: Record<string, unknown>;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuthResponse {
  access_token: string;
  refresh_token: string;
  admin: AdminProfile;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  company: string | null;
  isActive: boolean;
  bookingEnabled: number;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  subAccountId: number;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
  bookingEnabled?: number;
  subAccountId?: number;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: string;
  company?: string;
  isActive?: boolean;
  bookingEnabled?: number;
  bookingsTime?: Array<{ date: string; slots: string[] }> | null;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalStrategies: number;
  totalBookings: number;
  totalLeads: number;
  recentUsers: Array<{
    id: number;
    name: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    company: string | null;
  }>;
  growthRates: {
    users: number;
    activeUsers: number;
    strategies: number;
    bookings: number;
  };
}

export interface SystemStatus {
  database: string;
  apiServer: string;
  redisCache: string;
  fileStorage: string;
}

export interface DetailedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  company?: string;
  budget?: string;
  bookingsTime?: Record<string, unknown>;
  bookingEnabled: number;
  calendarId?: string;
  locationId?: string;
  assignedUserId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByAdminId?: number;
  createdByAdmin?: {
    id: number;
    name: string;
    email: string;
  } | null;
  strategies?: Array<{
    id: number;
    name: string;
    tag?: string;
    tone?: string;
  }>;
  leads?: Array<{
    id: number;
    name: string;
    email?: string;
    status: string;
  }>;
  bookings?: Array<{
    id: number;
    bookingType: string;
    status: string;
    createdAt: string;
  }>;
}

export interface ConversationState {
  qualified?: boolean | null;
  budgetDiscussed?: boolean;
  timelineDiscussed?: boolean;
  decisionMaker?: boolean | null;
  painPointsIdentified?: string[];
  objections?: string[];
  stage?:
    | "discovery"
    | "qualification"
    | "objection_handling"
    | "closing"
    | "booked";
  lastUpdated?: string;
}

export interface MessageHistoryItem {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface DetailedLead {
  id: number;
  regularUserId: number;
  strategyId: number;
  subAccountId: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  customId?: string;
  timezone?: string;
  messageHistory?: MessageHistoryItem[] | string; // Can be array or JSON string
  status: string;
  notes?: string;
  lastMessage?: string;
  lastMessageDate?: string;
  conversationState?: ConversationState;
  createdAt: string;
  updatedAt: string;
  regularUser?: {
    id: number;
    name: string;
    email: string;
    role: string;
    company?: string;
    budget?: string;
    bookingEnabled: number;
    isActive: boolean;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    company?: string;
    budget?: string;
    bookingEnabled: number;
    isActive: boolean;
  };
  strategy?: {
    id: number;
    name: string;
    tag?: string;
    description?: string;
    aiName: string;
    aiRole: string;
    industryContext?: string;
    isActive?: boolean;
  };
  bookings?: Array<{
    id: number;
    bookingType: string;
    status: string;
    createdAt: string;
  }>;
}

export interface UpdateAdminProfileDto {
  name?: string;
  email?: string;
}

export interface ChangeAdminPasswordDto {
  oldPassword: string;
  newPassword: string;
}

export class AdminAuthApi {
  private api: EndpointApi<typeof adminAuthConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(adminAuthConfig);
  }

  async adminLogin(data: AdminLoginDto): Promise<AdminAuthResponse> {
    return this.api.adminLogin(
      undefined,
      data as AdminLoginDto & { accountType: "admin" }
    ) as Promise<AdminAuthResponse>;
  }

  async adminRegister(
    data: AdminRegisterDto
  ): Promise<Omit<AdminProfile, "lastLoginAt" | "createdAt" | "updatedAt">> {
    return this.api.adminRegister(
      undefined,
      data as AdminRegisterDto & { accountType: "admin" }
    ) as Promise<Omit<AdminProfile, "lastLoginAt" | "createdAt" | "updatedAt">>;
  }

  async adminRefreshToken(
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.api.adminRefreshToken(undefined, {
      refresh_token: refreshToken,
    }) as Promise<{
      access_token: string;
      refresh_token: string;
    }>;
  }

  async adminLogout(): Promise<{ message: string }> {
    return this.api.adminLogout() as Promise<{ message: string }>;
  }

  async getAdminProfile(): Promise<AdminProfile> {
    return this.api.getAdminProfile() as Promise<AdminProfile>;
  }

  // Note: Admin profile updates are not currently supported by the backend
  // Admins should use the unified /auth endpoints for password changes
  // TODO: Implement admin profile update endpoint in backend if needed
  async updateAdminProfile(data: UpdateAdminProfileDto): Promise<AdminProfile> {
    return this.api.updateAdminProfile(
      undefined,
      data
    ) as Promise<AdminProfile>;
  }

  async changeAdminPassword(
    data: ChangeAdminPasswordDto
  ): Promise<{ message: string }> {
    return this.api.changeAdminPassword(undefined, data) as Promise<{
      message: string;
    }>;
  }

  async getAllUsers(subaccountId?: string): Promise<UserProfile[]> {
    const params =
      subaccountId && subaccountId !== "GLOBAL" ? { subaccountId } : undefined;
    return this.api.getAllUsers(params) as Promise<UserProfile[]>;
  }

  async createUser(
    data: CreateUserDto
  ): Promise<
    Omit<
      UserProfile,
      "lastLoginAt" | "createdAt" | "updatedAt" | "createdByAdmin"
    >
  > {
    return this.api.createUser(undefined, data) as Promise<
      Omit<
        UserProfile,
        "lastLoginAt" | "createdAt" | "updatedAt" | "createdByAdmin"
      >
    >;
  }

  async updateUser(
    userId: number,
    data: UpdateUserDto
  ): Promise<Omit<UserProfile, "createdByAdmin">> {
    return this.api.updateUser({ userId }, data) as Promise<
      Omit<UserProfile, "createdByAdmin">
    >;
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.api.deleteUser({ userId }) as Promise<{ message: string }>;
  }

  async generateAuthCode(): Promise<{
    authCode: string;
    message: string;
    expiresIn: string;
  }> {
    return this.api.generateAuthCode() as Promise<{
      authCode: string;
      message: string;
      expiresIn: string;
    }>;
  }

  async getCurrentAuthCode(): Promise<{ authCode: string; message: string }> {
    return this.api.getCurrentAuthCode() as Promise<{
      authCode: string;
      message: string;
    }>;
  }

  async getAllAdminAccounts(): Promise<AdminProfile[]> {
    return this.api.getAllAdminAccounts() as Promise<AdminProfile[]>;
  }

  async deleteAdminAccount(adminId: number): Promise<{ message: string }> {
    return this.api.deleteAdminAccount({ adminId }) as Promise<{
      message: string;
    }>;
  }

  async getDashboardStats(subaccountId?: string): Promise<DashboardStats> {
    const params =
      subaccountId && subaccountId !== "GLOBAL" ? { subaccountId } : undefined;
    return this.api.getDashboardStats(params) as Promise<DashboardStats>;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.api.getSystemStatus() as Promise<SystemStatus>;
  }

  async getRecentLeads(subaccountId?: string): Promise<DetailedLead[]> {
    const params =
      subaccountId && subaccountId !== "GLOBAL" ? { subaccountId } : undefined;
    return this.api.getRecentLeads(params) as Promise<DetailedLead[]>;
  }

  async getDetailedUser(userId: number): Promise<DetailedUser> {
    return this.api.getDetailedUser({ userId }) as Promise<DetailedUser>;
  }

  async getDetailedLead(leadId: number): Promise<DetailedLead> {
    return this.api.getDetailedLead({ leadId }) as Promise<DetailedLead>;
  }
}
