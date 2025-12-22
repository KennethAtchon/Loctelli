/**
 * Generic endpoint API builder
 * 
 * Creates API methods from endpoint configs automatically
 */

import { ApiClient } from "../client";
import {
  EndpointConfig,
  EndpointGroup,
  buildPath,
  buildQueryString,
} from "./endpoint-config";

export class EndpointApiBuilder {
  constructor(private client: ApiClient) {}

  /**
   * Creates API methods from an endpoint group config
   */
  buildApi<T extends EndpointGroup>(config: T): EndpointApi<T> {
    const api = {} as EndpointApi<T>;

    for (const [methodName, endpointConfig] of Object.entries(config)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      api[methodName as keyof T] = this.createMethod(
        endpointConfig as EndpointConfig<any>
      ) as EndpointApi<T>[keyof T];
    }

    return api;
  }

  /**
   * Creates a single API method from an endpoint config
   */
  private createMethod<T = unknown>(
    config: EndpointConfig<T>
  ) {
    return async (
      params?: Record<string, unknown>,
      body?: unknown
    ): Promise<T> => {
      // Handle custom handlers (for special cases like file uploads)
      if (config.customHandler) {
        return config.customHandler(
          this.client,
          params || {},
          body
        ) as Promise<T>;
      }

      // Separate path params from query params
      const pathParamNames = new Set(
        config.pathParams?.map((p) => p.name) || []
      );
      const pathParams: Record<string, unknown> = {};
      const queryParams: Record<string, unknown> = {};

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (pathParamNames.has(key)) {
            pathParams[key] = value;
          } else {
            queryParams[key] = value;
          }
        }
      }

      // Build the path
      const path = buildPath(
        config.path,
        config.pathParams,
        pathParams
      );

      // Build query string
      const queryString = buildQueryString(queryParams, config.queryParams);
      const fullPath = `${path}${queryString}`;

      // Handle file uploads
      if (config.isFileUpload && body instanceof FormData) {
        return this.client.uploadFile<T>(fullPath, body);
      }

      // Execute the request based on method
      switch (config.method) {
        case "GET":
          return this.client.get<T>(fullPath);
        
        case "POST":
          if (config.requiresBody && !body) {
            throw new Error(`Body is required for ${config.path}`);
          }
          return this.client.post<T>(fullPath, body);
        
        case "PATCH":
          if (config.requiresBody && !body) {
            throw new Error(`Body is required for ${config.path}`);
          }
          return this.client.patch<T>(fullPath, body);
        
        case "DELETE":
          return this.client.delete<T>(fullPath);
        
        case "PUT":
          if (config.requiresBody && !body) {
            throw new Error(`Body is required for ${config.path}`);
          }
          return this.client.put<T>(fullPath, body);
        
        default:
          throw new Error(`Unsupported HTTP method: ${config.method}`);
      }
    };
  }
}

/**
 * Type helper to infer API method signatures from config
 */
export type EndpointApi<T extends EndpointGroup> = {
  [K in keyof T]: T[K] extends EndpointConfig<infer R>
    ? (
        params?: Record<string, unknown>,
        body?: unknown
      ) => Promise<R>
    : never;
};

