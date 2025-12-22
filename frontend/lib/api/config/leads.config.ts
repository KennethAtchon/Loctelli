/**
 * Leads API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { Lead, CreateLeadDto } from "@/types";

export const leadsConfig: EndpointGroup = {
  getLeads: {
    method: "GET",
    path: "/lead",
    queryParams: [
      { name: "subAccountId", type: "number" },
      { name: "userId", type: "number" },
      { name: "strategyId", type: "number" },
    ],
    responseType: {} as Lead[],
  },

  getLead: {
    method: "GET",
    path: "/lead/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as Lead,
  },

  createLead: {
    method: "POST",
    path: "/lead",
    requiresBody: true,
    bodyType: {} as CreateLeadDto,
    responseType: {} as Lead,
  },

  updateLead: {
    method: "PATCH",
    path: "/lead/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as Partial<CreateLeadDto>,
    responseType: {} as Lead,
  },

  deleteLead: {
    method: "DELETE",
    path: "/lead/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: undefined as unknown as void,
  },

  getLeadsByUser: {
    method: "GET",
    path: "/lead",
    queryParams: [{ name: "userId", required: true, type: "number" }],
    responseType: {} as Lead[],
  },

  getLeadsByStrategy: {
    method: "GET",
    path: "/lead",
    queryParams: [{ name: "strategyId", required: true, type: "number" }],
    responseType: {} as Lead[],
  },
};
