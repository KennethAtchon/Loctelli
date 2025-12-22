import { ApiClient } from "../client";
import { Strategy, CreateStrategyDto } from "@/types";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { strategiesConfig } from "../config/strategies.config";

export class StrategiesApi {
  private api: EndpointApi<typeof strategiesConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(strategiesConfig);
  }

  async getStrategies(params?: {
    subAccountId?: number;
    regularUserId?: number;
  }): Promise<Strategy[]> {
    return this.api.getStrategies(params);
  }

  async getStrategy(id: number): Promise<Strategy> {
    return this.api.getStrategy({ id });
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    return this.api.createStrategy(undefined, data);
  }

  async updateStrategy(
    id: number,
    data: Partial<CreateStrategyDto>
  ): Promise<Strategy> {
    return this.api.updateStrategy({ id }, data);
  }

  async deleteStrategy(id: number): Promise<void> {
    return this.api.deleteStrategy({ id });
  }

  async getStrategiesByUser(regularUserId: number): Promise<Strategy[]> {
    return this.api.getStrategiesByUser({ regularUserId });
  }

  async duplicateStrategy(id: number): Promise<Strategy> {
    return this.api.duplicateStrategy({ id });
  }
}
