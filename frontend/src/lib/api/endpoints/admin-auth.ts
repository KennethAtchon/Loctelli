import { ApiClient } from "../client";

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
  bookingsTime?: any;
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
  messageHistory?: any;
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
  constructor(private client: ApiClient) {}

  async adminLogin(data: AdminLoginDto): Promise<AdminAuthResponse> {
    // Use unified /auth/login endpoint with accountType: 'admin'
    const loginData = { ...data, accountType: "admin" as const };
    return this.client.post<AdminAuthResponse>("/auth/login", loginData);
  }

  async adminRegister(
    data: AdminRegisterDto
  ): Promise<Omit<AdminProfile, "lastLoginAt" | "createdAt" | "updatedAt">> {
    // Use unified /auth/register endpoint with accountType: 'admin'
    const registerData = { ...data, accountType: "admin" as const };
    return this.client.post<
      Omit<AdminProfile, "lastLoginAt" | "createdAt" | "updatedAt">
    >("/auth/register", registerData);
  }

  async adminRefreshToken(
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Use unified /auth/refresh endpoint
    return this.client.post<{ access_token: string; refresh_token: string }>(
      "/auth/refresh",
      { refresh_token: refreshToken }
    );
  }

  async adminLogout(): Promise<{ message: string }> {
    // Use unified /auth/logout endpoint
    return this.client.post<{ message: string }>("/auth/logout");
  }

  async getAdminProfile(): Promise<AdminProfile> {
    // Use unified /auth/profile endpoint
    return this.client.get<AdminProfile>("/auth/profile");
  }

  // Note: Admin profile updates are not currently supported by the backend
  // Admins should use the unified /auth endpoints for password changes
  // TODO: Implement admin profile update endpoint in backend if needed
  async updateAdminProfile(data: UpdateAdminProfileDto): Promise<AdminProfile> {
    throw new Error(
      "Admin profile updates are not currently supported. Please contact a super admin."
    );
  }

  async changeAdminPassword(
    data: ChangeAdminPasswordDto
  ): Promise<{ message: string }> {
    // Use unified /auth/change-password endpoint
    return this.client.post<{ message: string }>("/auth/change-password", data);
  }

  async getAllUsers(subaccountId?: string): Promise<UserProfile[]> {
    const endpoint =
      subaccountId && subaccountId !== "GLOBAL"
        ? `/admin/users?subaccountId=${subaccountId}`
        : "/admin/users";
    return this.client.get<UserProfile[]>(endpoint);
  }

  async createUser(
    data: CreateUserDto
  ): Promise<
    Omit<
      UserProfile,
      "lastLoginAt" | "createdAt" | "updatedAt" | "createdByAdmin"
    >
  > {
    return this.client.post<
      Omit<
        UserProfile,
        "lastLoginAt" | "createdAt" | "updatedAt" | "createdByAdmin"
      >
    >("/admin/users", data);
  }

  async updateUser(
    userId: number,
    data: UpdateUserDto
  ): Promise<Omit<UserProfile, "createdByAdmin">> {
    return this.client.put<Omit<UserProfile, "createdByAdmin">>(
      `/admin/users/${userId}`,
      data
    );
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.client.delete<{ message: string }>(`/admin/users/${userId}`);
  }

  async generateAuthCode(): Promise<{
    authCode: string;
    message: string;
    expiresIn: string;
  }> {
    return this.client.post<{
      authCode: string;
      message: string;
      expiresIn: string;
    }>("/admin/auth-code/generate");
  }

  async getCurrentAuthCode(): Promise<{ authCode: string; message: string }> {
    return this.client.get<{ authCode: string; message: string }>(
      "/admin/auth-code/current"
    );
  }

  async getAllAdminAccounts(): Promise<AdminProfile[]> {
    return this.client.get<AdminProfile[]>("/admin/accounts");
  }

  async deleteAdminAccount(adminId: number): Promise<{ message: string }> {
    return this.client.delete<{ message: string }>(
      `/admin/accounts/${adminId}`
    );
  }

  async getDashboardStats(subaccountId?: string): Promise<DashboardStats> {
    const endpoint =
      subaccountId && subaccountId !== "GLOBAL"
        ? `/general/dashboard-stats?subaccountId=${subaccountId}`
        : "/general/dashboard-stats";
    return this.client.get<DashboardStats>(endpoint);
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.client.get<SystemStatus>("/general/system-status");
  }

  async getRecentLeads(subaccountId?: string): Promise<DetailedLead[]> {
    const endpoint =
      subaccountId && subaccountId !== "GLOBAL"
        ? `/general/recent-leads?subaccountId=${subaccountId}`
        : "/general/recent-leads";
    return this.client.get<DetailedLead[]>(endpoint);
  }

  async getDetailedUser(userId: number): Promise<DetailedUser> {
    return this.client.get<DetailedUser>(`/general/users/${userId}/detailed`);
  }

  async getDetailedLead(leadId: number): Promise<DetailedLead> {
    return this.client.get<DetailedLead>(`/general/leads/${leadId}/detailed`);
  }
}
