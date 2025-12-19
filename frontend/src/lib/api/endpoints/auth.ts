import { ApiClient } from "../client";

export interface LoginDto {
  email: string;
  password: string;
  accountType?: "user" | "admin";
  rememberMe?: boolean;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  accountType?: "user" | "admin";
  company?: string;
  budget?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    company?: string;
  };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  company?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class AuthApi {
  constructor(private client: ApiClient) {}
  async login(data: LoginDto): Promise<AuthResponse> {
    // Default to 'user' account type if not specified
    const loginData = { ...data, accountType: data.accountType || "user" };
    return this.client.post<AuthResponse>("/auth/login", loginData);
  }

  async register(
    data: RegisterDto,
  ): Promise<Omit<UserProfile, "lastLoginAt" | "createdAt" | "updatedAt">> {
    // Default to 'user' account type if not specified
    const registerData = { ...data, accountType: data.accountType || "user" };
    return this.client.post<
      Omit<UserProfile, "lastLoginAt" | "createdAt" | "updatedAt">
    >("/auth/register", registerData);
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.client.post<{ access_token: string; refresh_token: string }>(
      "/auth/refresh",
      { refresh_token: refreshToken },
    );
  }

  async logout(): Promise<{ message: string }> {
    return this.client.post<{ message: string }>("/auth/logout");
  }

  async getProfile(): Promise<UserProfile> {
    return this.client.get<UserProfile>("/auth/profile");
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    return this.client.post<{ message: string }>("/auth/change-password", {
      oldPassword,
      newPassword,
    });
  }
}
