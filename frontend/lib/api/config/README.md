# Config-Driven API System

This directory contains the config-driven API endpoint system that streamlines API endpoint definitions and reduces boilerplate code.

## Overview

Instead of manually writing API methods for each endpoint, you define endpoints declaratively using configs. The system automatically generates the API methods with proper TypeScript types.

## Structure

- **`endpoint-config.ts`**: Core types and utilities for defining endpoints
- **`endpoint-builder.ts`**: Generic builder that creates API methods from configs
- **`*.config.ts`**: Endpoint configurations for each API resource

## How It Works

### 1. Define Endpoint Config

```typescript
export const strategiesConfig: EndpointGroup = {
  getStrategies: {
    method: "GET",
    path: "/strategy",
    queryParams: [
      { name: "subAccountId", type: "number" },
      { name: "regularUserId", type: "number" },
    ],
    responseType: {} as Strategy[],
  },

  getStrategy: {
    method: "GET",
    path: "/strategy/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as Strategy,
  },

  createStrategy: {
    method: "POST",
    path: "/strategy",
    requiresBody: true,
    bodyType: {} as CreateStrategyDto,
    responseType: {} as Strategy,
  },
};
```

### 2. Use in API Class

```typescript
import { EndpointApiBuilder } from "../config/endpoint-builder";
import { strategiesConfig } from "../config/strategies.config";

export class StrategiesApi {
  private api: ReturnType<EndpointApiBuilder["buildApi"]<typeof strategiesConfig>>;

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
}
```

## Config Options

### EndpointConfig

- **`method`**: HTTP method (`GET`, `POST`, `PATCH`, `DELETE`, `PUT`)
- **`path`**: Endpoint path template (e.g., `/strategy/:id`)
- **`pathParams`**: Path parameters (e.g., `{ name: "id", required: true, type: "number" }`)
- **`queryParams`**: Query parameters (e.g., `{ name: "subAccountId", type: "number" }`)
- **`requiresBody`**: Whether body is required
- **`bodyType`**: TypeScript type for request body
- **`responseType`**: TypeScript type for response
- **`customHandler`**: Custom function for special cases (e.g., file uploads)
- **`isFileUpload`**: Whether to use `uploadFile` method

### Path Parameters

Path parameters are defined in the path template using `:paramName` or `{paramName}`:

```typescript
path: "/strategy/:id/edit"
pathParams: [{ name: "id", required: true, type: "number" }]
```

### Query Parameters

Query parameters are automatically converted to query strings:

```typescript
queryParams: [
  { name: "subAccountId", type: "number" },
  { name: "regularUserId", type: "number" },
]
```

## Benefits

1. **Less Boilerplate**: No need to manually construct URLs and query strings
2. **Type Safety**: Full TypeScript support with inferred types
3. **Consistency**: All endpoints follow the same pattern
4. **Maintainability**: Easy to add/modify endpoints by updating configs
5. **Flexibility**: Supports custom handlers for special cases

## Adding New Endpoints

1. Add the endpoint config to the appropriate `*.config.ts` file
2. Add a wrapper method in the API class (optional, for better API)
3. The system automatically handles path building, query string construction, and type inference

## Examples

### Simple GET Request

```typescript
getUsers: {
  method: "GET",
  path: "/user",
  responseType: {} as User[],
}
```

### GET with Query Params

```typescript
getLeads: {
  method: "GET",
  path: "/lead",
  queryParams: [
    { name: "subAccountId", type: "number" },
    { name: "userId", type: "number" },
  ],
  responseType: {} as Lead[],
}
```

### POST with Body

```typescript
createStrategy: {
  method: "POST",
  path: "/strategy",
  requiresBody: true,
  bodyType: {} as CreateStrategyDto,
  responseType: {} as Strategy,
}
```

### PATCH with Path and Body

```typescript
updateStrategy: {
  method: "PATCH",
  path: "/strategy/:id",
  pathParams: [{ name: "id", required: true, type: "number" }],
  requiresBody: true,
  bodyType: {} as Partial<CreateStrategyDto>,
  responseType: {} as Strategy,
}
```

### File Upload

```typescript
uploadFormFile: {
  method: "POST",
  path: "/forms/public/:slug/upload",
  pathParams: [{ name: "slug", required: true, type: "string" }],
  isFileUpload: true,
  responseType: {} as UploadedFile,
}
```

