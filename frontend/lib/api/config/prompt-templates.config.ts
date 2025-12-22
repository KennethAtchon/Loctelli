/**
 * Prompt Templates API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  PromptTemplate,
  CreatePromptTemplateDto,
  UpdatePromptTemplateDto,
} from "../endpoints/prompt-templates";

export const promptTemplatesConfig: EndpointGroup = {
  getAll: {
    method: "GET",
    path: "/admin/prompt-templates",
    responseType: {} as PromptTemplate[],
  },

  getAllForSubAccount: {
    method: "GET",
    path: "/admin/prompt-templates/subaccount/:subAccountId",
    pathParams: [{ name: "subAccountId", required: true, type: "number" }],
    responseType: {} as PromptTemplate[],
  },

  getById: {
    method: "GET",
    path: "/admin/prompt-templates/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as PromptTemplate,
  },

  getActive: {
    method: "GET",
    path: "/admin/prompt-templates/active",
    responseType: {} as PromptTemplate,
  },

  create: {
    method: "POST",
    path: "/admin/prompt-templates",
    requiresBody: true,
    bodyType: {} as CreatePromptTemplateDto,
    responseType: {} as PromptTemplate,
  },

  update: {
    method: "PATCH",
    path: "/admin/prompt-templates/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as UpdatePromptTemplateDto,
    responseType: {} as PromptTemplate,
  },

  activate: {
    method: "PATCH",
    path: "/admin/prompt-templates/:id/activate",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as { subAccountId: number },
    responseType: {} as PromptTemplate,
  },

  deleteTemplate: {
    method: "DELETE",
    path: "/admin/prompt-templates/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: undefined as unknown as void,
  },
};
