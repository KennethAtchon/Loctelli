import { ApiClient } from "../client";
import { Strategy, CreateStrategyDto } from "@/types";

export class StrategiesApi {
  constructor(private client: ApiClient) {}

  async getStrategies(params?: {
    subAccountId?: number;
    regularUserId?: number;
  }): Promise<Strategy[]> {
    const queryParams = new URLSearchParams();
    if (params?.subAccountId) {
      queryParams.append("subAccountId", params.subAccountId.toString());
    }
    if (params?.regularUserId !== undefined && params?.regularUserId !== null) {
      queryParams.append("regularUserId", params.regularUserId.toString());
    }
    const queryString = queryParams.toString();
    return this.client.get<Strategy[]>(
      `/strategy${queryString ? `?${queryString}` : ""}`,
    );
  }

  async getStrategy(id: number): Promise<Strategy> {
    return this.client.get<Strategy>(`/strategy/${id}`);
  }

  async createStrategy(data: CreateStrategyDto): Promise<Strategy> {
    return this.client.post<Strategy>("/strategy", data);
  }

  async updateStrategy(
    id: number,
    data: Partial<CreateStrategyDto>,
  ): Promise<Strategy> {
    return this.client.patch<Strategy>(`/strategy/${id}`, data);
  }

  async deleteStrategy(id: number): Promise<void> {
    return this.client.delete<void>(`/strategy/${id}`);
  }

  async getStrategiesByUser(regularUserId: number): Promise<Strategy[]> {
    return this.client.get<Strategy[]>(
      `/strategy?regularUserId=${regularUserId}`,
    );
  }

  async duplicateStrategy(id: number): Promise<Strategy> {
    return this.client.post<Strategy>(`/strategy/${id}/duplicate`);
  }
}
