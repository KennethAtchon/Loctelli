import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { adminSubAccountsConfig } from "../config/admin-subaccounts.config";

export interface SubAccount {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  createdByAdmin: {
    id: number;
    name: string;
    email: string;
  };
  _count: {
    users: number;
    strategies: number;
    leads: number;
    bookings: number;
  };
}

export interface DetailedSubAccount extends SubAccount {
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  }>;
  strategies: Array<{
    id: number;
    name: string;
    tag?: string;
    tone?: string;
    createdAt: string;
  }>;
  leads: Array<{
    id: number;
    name: string;
    email?: string;
    status: string;
    createdAt: string;
  }>;
  bookings: Array<{
    id: number;
    bookingType: string;
    status: string;
    createdAt: string;
  }>;
}

export interface CreateSubAccountDto {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateSubAccountDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
}

export class AdminSubAccountsApi {
  private api: EndpointApi<typeof adminSubAccountsConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(adminSubAccountsConfig);
  }

  async getAllSubAccounts(): Promise<SubAccount[]> {
    return this.api.getAllSubAccounts() as Promise<SubAccount[]>;
  }

  async getSubAccount(id: number): Promise<DetailedSubAccount> {
    return this.api.getSubAccount({
      id,
    }) as Promise<DetailedSubAccount>;
  }

  async createSubAccount(data: CreateSubAccountDto): Promise<SubAccount> {
    return this.api.createSubAccount(undefined, data) as Promise<SubAccount>;
  }

  async updateSubAccount(
    id: number,
    data: UpdateSubAccountDto
  ): Promise<SubAccount> {
    return this.api.updateSubAccount({ id }, data) as Promise<SubAccount>;
  }

  async deleteSubAccount(id: number): Promise<{ message: string }> {
    return this.api.deleteSubAccount({ id }) as Promise<{
      message: string;
    }>;
  }
}
