import { ApiClient } from "../client";
import { Lead, CreateLeadDto } from "@/types";

export class LeadsApi {
  constructor(private client: ApiClient) {}

  async getLeads(params?: {
    subAccountId?: number;
    userId?: number;
    strategyId?: number;
  }): Promise<Lead[]> {
    const queryParams = new URLSearchParams();
    if (params?.subAccountId) {
      queryParams.append("subAccountId", params.subAccountId.toString());
    }
    if (params?.userId !== undefined && params?.userId !== null) {
      queryParams.append("userId", params.userId.toString());
    }
    if (params?.strategyId) {
      queryParams.append("strategyId", params.strategyId.toString());
    }
    const queryString = queryParams.toString();
    return this.client.get<Lead[]>(
      `/lead${queryString ? `?${queryString}` : ""}`
    );
  }

  async getLead(id: number): Promise<Lead> {
    return this.client.get<Lead>(`/lead/${id}`);
  }

  async createLead(data: CreateLeadDto): Promise<Lead> {
    return this.client.post<Lead>("/lead", data);
  }

  async updateLead(id: number, data: Partial<CreateLeadDto>): Promise<Lead> {
    return this.client.patch<Lead>(`/lead/${id}`, data);
  }

  async deleteLead(id: number): Promise<void> {
    return this.client.delete<void>(`/lead/${id}`);
  }

  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return this.client.get<Lead[]>(`/lead?userId=${userId}`);
  }

  async getLeadsByStrategy(strategyId: number): Promise<Lead[]> {
    return this.client.get<Lead[]>(`/lead?strategyId=${strategyId}`);
  }
}
