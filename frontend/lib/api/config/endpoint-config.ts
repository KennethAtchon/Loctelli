/**
 * Config-driven API endpoint system
 * 
 * This system allows defining API endpoints declaratively using configs,
 * reducing boilerplate and making the API layer more maintainable.
 */

import type { ApiClient } from "../client";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export type ParamType = "path" | "query" | "body";

export interface QueryParam {
  name: string;
  required?: boolean;
  type?: "string" | "number" | "boolean";
}

export interface PathParam {
  name: string;
  required: boolean;
  type?: "string" | "number";
}

export interface EndpointConfig<TResponse = unknown, TBody = unknown> {
  /** HTTP method */
  method: HttpMethod;
  
  /** Endpoint path template (e.g., "/strategy/:id" or "/strategy") */
  path: string;
  
  /** Path parameters (e.g., { id: "123" } becomes /strategy/123) */
  pathParams?: PathParam[];
  
  /** Query parameters */
  queryParams?: QueryParam[];
  
  /** Whether this endpoint requires a body */
  requiresBody?: boolean;
  
  /** Response type (for TypeScript) */
  responseType?: TResponse;
  
  /** Body type (for TypeScript) */
  bodyType?: TBody;
  
  /** Custom handler function for special cases (e.g., file uploads) */
  customHandler?: (
    client: ApiClient,
    params: Record<string, unknown>,
    body?: unknown
  ) => Promise<TResponse>;
  
  /** Whether to use uploadFile instead of regular request */
  isFileUpload?: boolean;
}

export interface EndpointGroup {
  [methodName: string]: EndpointConfig;
}

/**
 * Builds a query string from params object
 */
export function buildQueryString(
  params: Record<string, unknown>,
  queryParamDefs?: QueryParam[]
): string {
  if (!queryParamDefs || queryParamDefs.length === 0) {
    return "";
  }

  const searchParams = new URLSearchParams();

  for (const paramDef of queryParamDefs) {
    const value = params[paramDef.name];
    
    // Skip undefined/null values unless required
    if (value === undefined || value === null) {
      if (paramDef.required) {
        throw new Error(`Required query parameter '${paramDef.name}' is missing`);
      }
      continue;
    }

    // Convert to string based on type
    let stringValue: string;
    if (paramDef.type === "number") {
      stringValue = String(value);
    } else if (paramDef.type === "boolean") {
      stringValue = value ? "true" : "false";
    } else {
      stringValue = String(value);
    }

    searchParams.append(paramDef.name, stringValue);
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * Builds a path from template and params
 */
export function buildPath(
  template: string,
  pathParams?: PathParam[],
  paramValues?: Record<string, unknown>
): string {
  if (!pathParams || pathParams.length === 0) {
    return template;
  }

  let path = template;

  for (const paramDef of pathParams) {
    const value = paramValues?.[paramDef.name];
    
    if (value === undefined || value === null) {
      if (paramDef.required) {
        throw new Error(`Required path parameter '${paramDef.name}' is missing`);
      }
      continue;
    }

    // Convert to string
    const stringValue = String(value);
    path = path.replace(`:${paramDef.name}`, stringValue);
    path = path.replace(`{${paramDef.name}}`, stringValue);
  }

  return path;
}

