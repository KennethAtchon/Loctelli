import { ApiClient } from "../client";

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
  constructor(private client: ApiClient) {}

  async getAllSubAccounts(): Promise<SubAccount[]> {
    return this.client.get("/admin/subaccounts");
  }

  async getSubAccount(id: number): Promise<DetailedSubAccount> {
    return this.client.get(`/admin/subaccounts/${id}`);
  }

  async createSubAccount(data: CreateSubAccountDto): Promise<SubAccount> {
    return this.client.post("/admin/subaccounts", data);
  }

  async updateSubAccount(
    id: number,
    data: UpdateSubAccountDto,
  ): Promise<SubAccount> {
    return this.client.patch(`/admin/subaccounts/${id}`, data);
  }

  async deleteSubAccount(id: number): Promise<{ message: string }> {
    return this.client.delete(`/admin/subaccounts/${id}`);
  }
}
