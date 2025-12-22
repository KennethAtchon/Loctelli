import { ApiClient } from "../client";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { generalConfig } from "../config/general.config";

export interface DatabaseSchema {
  models: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
      isRequired: boolean;
      isId: boolean;
      isUnique: boolean;
      isRelation: boolean;
      relationType?: string;
      relationTarget?: string;
    }>;
  }>;
  rawSchema: string;
  lastModified: string;
}

export interface SchemaResponse {
  success: boolean;
  data?: DatabaseSchema;
  error?: string;
  details?: string;
}

export class GeneralApi {
  private api: EndpointApi<typeof generalConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(generalConfig);
  }

  async getDatabaseSchema(): Promise<SchemaResponse> {
    return this.api.getDatabaseSchema() as Promise<SchemaResponse>;
  }
}
