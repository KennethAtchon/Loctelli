/**
 * Strategies API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { Strategy, CreateStrategyDto } from "@/types";

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

  updateStrategy: {
    method: "PATCH",
    path: "/strategy/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as Partial<CreateStrategyDto>,
    responseType: {} as Strategy,
  },

  deleteStrategy: {
    method: "DELETE",
    path: "/strategy/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as void,
  },

  getStrategiesByUser: {
    method: "GET",
    path: "/strategy",
    queryParams: [
      { name: "regularUserId", required: true, type: "number" },
    ],
    responseType: {} as Strategy[],
  },

  duplicateStrategy: {
    method: "POST",
    path: "/strategy/:id/duplicate",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as Strategy,
  },
};

