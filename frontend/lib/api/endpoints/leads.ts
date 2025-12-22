import { ApiClient } from "../client";
import { Lead, CreateLeadDto } from "@/types";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { leadsConfig } from "../config/leads.config";

export class LeadsApi {
  private api: EndpointApi<typeof leadsConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(leadsConfig);
  }

  async getLeads(params?: {
    subAccountId?: number;
    userId?: number;
    strategyId?: number;
  }): Promise<Lead[]> {
    return this.api.getLeads(params);
  }

  async getLead(id: number): Promise<Lead> {
    return this.api.getLead({ id });
  }

  async createLead(data: CreateLeadDto): Promise<Lead> {
    return this.api.createLead(undefined, data);
  }

  async updateLead(id: number, data: Partial<CreateLeadDto>): Promise<Lead> {
    return this.api.updateLead({ id }, data);
  }

  async deleteLead(id: number): Promise<void> {
    return this.api.deleteLead({ id });
  }

  async getLeadsByUser(userId: number): Promise<Lead[]> {
    return this.api.getLeadsByUser({ userId });
  }

  async getLeadsByStrategy(strategyId: number): Promise<Lead[]> {
    return this.api.getLeadsByStrategy({ strategyId });
  }
}
