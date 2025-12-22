/**
 * Integration Templates API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  IntegrationTemplate,
  CreateIntegrationTemplateDto,
  UpdateIntegrationTemplateDto,
} from "../endpoints/integration-templates";

export const integrationTemplatesConfig: EndpointGroup = {
  getAll: {
    method: "GET",
    path: "/admin/integration-templates",
    responseType: {} as IntegrationTemplate[],
  },

  getById: {
    method: "GET",
    path: "/admin/integration-templates/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as IntegrationTemplate,
  },

  getActive: {
    method: "GET",
    path: "/admin/integration-templates/active",
    responseType: {} as IntegrationTemplate[],
  },

  getByCategory: {
    method: "GET",
    path: "/admin/integration-templates/category/:category",
    pathParams: [{ name: "category", required: true, type: "string" }],
    responseType: {} as IntegrationTemplate[],
  },

  create: {
    method: "POST",
    path: "/admin/integration-templates",
    requiresBody: true,
    bodyType: {} as CreateIntegrationTemplateDto,
    responseType: {} as IntegrationTemplate,
  },

  update: {
    method: "PATCH",
    path: "/admin/integration-templates/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as UpdateIntegrationTemplateDto,
    responseType: {} as IntegrationTemplate,
  },

  deleteTemplate: {
    method: "DELETE",
    path: "/admin/integration-templates/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as void,
  },
};

