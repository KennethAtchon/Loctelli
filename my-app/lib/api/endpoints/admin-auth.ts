import { ApiClient } from '../client';

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminRegisterDto {
  name: string;
  email: string;
  password: string;
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

export interface DetailedLead {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  customId?: string;
  status: string;
  notes?: string;
  lastMessage?: string;
  lastMessageDate?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  strategy?: {
    id: number;
    name: string;
    tag?: string;
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



export class AdminAuthApi extends ApiClient {
  async adminLogin(data: AdminLoginDto): Promise<AdminAuthResponse> {
    return this.post<AdminAuthResponse>('/admin/auth/login', data);
  }

  async adminRegister(data: AdminRegisterDto): Promise<Omit<AdminProfile, 'lastLoginAt' | 'createdAt' | 'updatedAt'>> {
    return this.post<Omit<AdminProfile, 'lastLoginAt' | 'createdAt' | 'updatedAt'>>('/admin/auth/register', data);
  }

  async adminRefreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    return this.post<{ access_token: string; refresh_token: string }>('/admin/auth/refresh', { refresh_token: refreshToken });
  }

  async adminLogout(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/admin/auth/logout');
  }

  async getAdminProfile(): Promise<AdminProfile> {
    return this.get<AdminProfile>('/admin/auth/profile');
  }

  async updateAdminProfile(data: UpdateAdminProfileDto): Promise<AdminProfile> {
    return this.put<AdminProfile>('/admin/auth/profile', data);
  }

  async changeAdminPassword(data: ChangeAdminPasswordDto): Promise<{ message: string }> {
    return this.post<{ message: string }>('/admin/auth/change-password', data);
  }

  async getAllUsers(subaccountId?: string): Promise<UserProfile[]> {
    const endpoint = subaccountId && subaccountId !== 'GLOBAL' 
      ? `/admin/auth/users?subaccountId=${subaccountId}`
      : '/admin/auth/users';
    return this.get<UserProfile[]>(endpoint);
  }

  async createUser(data: CreateUserDto): Promise<Omit<UserProfile, 'lastLoginAt' | 'createdAt' | 'updatedAt' | 'createdByAdmin'>> {
    return this.post<Omit<UserProfile, 'lastLoginAt' | 'createdAt' | 'updatedAt' | 'createdByAdmin'>>('/admin/auth/users', data);
  }

  async updateUser(userId: number, data: UpdateUserDto): Promise<Omit<UserProfile, 'createdByAdmin'>> {
    return this.put<Omit<UserProfile, 'createdByAdmin'>>(`/admin/auth/users/${userId}`, data);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/admin/auth/users/${userId}`);
  }

  async generateAuthCode(): Promise<{ authCode: string; message: string; expiresIn: string }> {
    return this.post<{ authCode: string; message: string; expiresIn: string }>('/admin/auth/generate-auth-code');
  }

  async getCurrentAuthCode(): Promise<{ authCode: string; message: string }> {
    return this.get<{ authCode: string; message: string }>('/admin/auth/current-auth-code');
  }

  async getAllAdminAccounts(): Promise<AdminProfile[]> {
    return this.get<AdminProfile[]>('/admin/auth/accounts');
  }

  async deleteAdminAccount(adminId: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/admin/auth/accounts/${adminId}`);
  }

  async getDashboardStats(subaccountId?: string): Promise<DashboardStats> {
    const endpoint = subaccountId && subaccountId !== 'GLOBAL' 
      ? `/general/dashboard-stats?subaccountId=${subaccountId}`
      : '/general/dashboard-stats';
    return this.get<DashboardStats>(endpoint);
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.get<SystemStatus>('/general/system-status');
  }

  async getRecentLeads(subaccountId?: string): Promise<DetailedLead[]> {
    const endpoint = subaccountId && subaccountId !== 'GLOBAL' 
      ? `/general/recent-leads?subaccountId=${subaccountId}`
      : '/general/recent-leads';
    return this.get<DetailedLead[]>(endpoint);
  }

  async getDetailedUser(userId: number): Promise<DetailedUser> {
    return this.get<DetailedUser>(`/general/users/${userId}/detailed`);
  }

  async getDetailedLead(leadId: number): Promise<DetailedLead> {
    return this.get<DetailedLead>(`/general/leads/${leadId}/detailed`);
  }
} 