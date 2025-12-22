/**
 * Integrations API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  Integration,
  CreateIntegrationDto,
  UpdateIntegrationDto,
  TestConnectionResponse,
  SyncDataResponse,
} from "../endpoints/integrations";

export const integrationsConfig: EndpointGroup = {
  getAll: {
    method: "GET",
    path: "/admin/integrations",
    queryParams: [{ name: "subAccountId", type: "number" }],
    responseType: {} as Integration[],
  },

  getById: {
    method: "GET",
    path: "/admin/integrations/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as Integration,
  },

  getBySubAccount: {
    method: "GET",
    path: "/admin/integrations/subaccount/:subAccountId",
    pathParams: [{ name: "subAccountId", required: true, type: "number" }],
    responseType: {} as Integration[],
  },

  getByStatus: {
    method: "GET",
    path: "/admin/integrations/status/:status",
    pathParams: [{ name: "status", required: true, type: "string" }],
    queryParams: [{ name: "subAccountId", type: "number" }],
    responseType: {} as Integration[],
  },

  create: {
    method: "POST",
    path: "/admin/integrations",
    requiresBody: true,
    bodyType: {} as CreateIntegrationDto,
    responseType: {} as Integration,
  },

  update: {
    method: "PATCH",
    path: "/admin/integrations/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as UpdateIntegrationDto,
    responseType: {} as Integration,
  },

  updateStatus: {
    method: "PATCH",
    path: "/admin/integrations/:id/status",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as { status: string; errorMessage?: string },
    responseType: {} as Integration,
  },

  testConnection: {
    method: "POST",
    path: "/admin/integrations/:id/test",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as TestConnectionResponse,
  },

  syncData: {
    method: "POST",
    path: "/admin/integrations/:id/sync",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as SyncDataResponse,
  },

  deleteIntegration: {
    method: "DELETE",
    path: "/admin/integrations/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as void,
  },
};
