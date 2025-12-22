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
    return this.api.getStrategies(params) as Promise<Strategy[]>;
  }

  async getStrategy(id: number): Promise<Strategy> {
    return this.api.getStrategy({ id }) as Promise<Strategy>;
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    return this.api.createStrategy(undefined, data) as Promise<Strategy>;
  }

  async updateStrategy(
    id: number,
    data: Partial<CreateStrategyDto>
  ): Promise<Strategy> {
    return this.api.updateStrategy({ id }, data) as Promise<Strategy>;
  }

  async deleteStrategy(id: number): Promise<void> {
    return this.api.deleteStrategy({ id }) as Promise<void>;
  }

  async getStrategiesByUser(regularUserId: number): Promise<Strategy[]> {
    return this.api.getStrategiesByUser({ regularUserId }) as Promise<
      Strategy[]
    >;
  }

  async duplicateStrategy(id: number): Promise<Strategy> {
    return this.api.duplicateStrategy({ id }) as Promise<Strategy>;
  }
}
