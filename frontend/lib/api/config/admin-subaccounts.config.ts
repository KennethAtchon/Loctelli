/**
 * Admin SubAccounts API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  SubAccount,
  DetailedSubAccount,
  CreateSubAccountDto,
  UpdateSubAccountDto,
} from "../endpoints/admin-subaccounts";

export const adminSubAccountsConfig: EndpointGroup = {
  getAllSubAccounts: {
    method: "GET",
    path: "/admin/subaccounts",
    responseType: {} as SubAccount[],
  },

  getSubAccount: {
    method: "GET",
    path: "/admin/subaccounts/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as DetailedSubAccount,
  },

  createSubAccount: {
    method: "POST",
    path: "/admin/subaccounts",
    requiresBody: true,
    bodyType: {} as CreateSubAccountDto,
    responseType: {} as SubAccount,
  },

  updateSubAccount: {
    method: "PATCH",
    path: "/admin/subaccounts/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as UpdateSubAccountDto,
    responseType: {} as SubAccount,
  },

  deleteSubAccount: {
    method: "DELETE",
    path: "/admin/subaccounts/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as { message: string },
  },
};

