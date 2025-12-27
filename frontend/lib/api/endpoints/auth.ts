import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { authConfig } from "../config/auth.config";

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
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    company?: string;
    subAccountId?: number;
  };
  admin?: {
    id: number;
    name: string;
    email: string;
    role: string;
    permissions?: Record<string, unknown>;
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
  private api: EndpointApi<typeof authConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(authConfig);
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // Default to 'user' account type if not specified
    const loginData = { ...data, accountType: data.accountType || "user" };
    return this.api.login(undefined, loginData) as Promise<AuthResponse>;
  }

  async register(
    data: RegisterDto
  ): Promise<Omit<UserProfile, "lastLoginAt" | "createdAt" | "updatedAt">> {
    // Default to 'user' account type if not specified
    const registerData = { ...data, accountType: data.accountType || "user" };
    return this.api.register(undefined, registerData) as Promise<
      Omit<UserProfile, "lastLoginAt" | "createdAt" | "updatedAt">
    >;
  }

  async refreshToken(
    refreshToken: string
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.api.refreshToken(undefined, {
      refresh_token: refreshToken,
    }) as Promise<{
      access_token: string;
      refresh_token: string;
    }>;
  }

  async logout(): Promise<{ message: string }> {
    return this.api.logout() as Promise<{ message: string }>;
  }

  async getProfile(): Promise<UserProfile> {
    return this.api.getProfile() as Promise<UserProfile>;
  }

  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.api.changePassword(undefined, {
      oldPassword,
      newPassword,
    }) as Promise<{
      message: string;
    }>;
  }
}
