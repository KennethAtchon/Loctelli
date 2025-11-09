import { ApiClient } from '../client';

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
  constructor(private client: ApiClient) {}
  
  async getDatabaseSchema(): Promise<SchemaResponse> {
    return this.client.get<SchemaResponse>('/general/schema');
  }
} 