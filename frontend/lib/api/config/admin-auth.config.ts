/**
 * Admin Auth API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  AdminLoginDto,
  AdminRegisterDto,
  AdminAuthResponse,
  AdminProfile,
  UpdateAdminProfileDto,
  ChangeAdminPasswordDto,
  UserProfile,
  CreateUserDto,
  UpdateUserDto,
  DashboardStats,
  SystemStatus,
  DetailedUser,
  DetailedLead,
} from "../endpoints/admin-auth";

export const adminAuthConfig: EndpointGroup = {
  adminLogin: {
    method: "POST",
    path: "/auth/login",
    requiresBody: true,
    bodyType: {} as AdminLoginDto & { accountType: "admin" },
    responseType: {} as AdminAuthResponse,
    customHandler: async (client, params, body) => {
      // Use unified /auth/login endpoint with accountType: 'admin'
      const loginData = { ...(body as AdminLoginDto), accountType: "admin" as const };
      return client.post<AdminAuthResponse>("/auth/login", loginData);
    },
  },

  adminRegister: {
    method: "POST",
    path: "/auth/register",
    requiresBody: true,
    bodyType: {} as AdminRegisterDto & { accountType: "admin" },
    responseType: {} as Omit<AdminProfile, "lastLoginAt" | "createdAt" | "updatedAt">,
    customHandler: async (client, params, body) => {
      // Use unified /auth/register endpoint with accountType: 'admin'
      const registerData = { ...(body as AdminRegisterDto), accountType: "admin" as const };
      return client.post<Omit<AdminProfile, "lastLoginAt" | "createdAt" | "updatedAt">>(
        "/auth/register",
        registerData
      );
    },
  },

  adminRefreshToken: {
    method: "POST",
    path: "/auth/refresh",
    requiresBody: true,
    bodyType: {} as { refresh_token: string },
    responseType: {} as { access_token: string; refresh_token: string },
  },

  adminLogout: {
    method: "POST",
    path: "/auth/logout",
    responseType: {} as { message: string },
  },

  getAdminProfile: {
    method: "GET",
    path: "/auth/profile",
    responseType: {} as AdminProfile,
  },

  updateAdminProfile: {
    method: "POST",
    path: "/admin/profile/update",
    requiresBody: true,
    bodyType: {} as UpdateAdminProfileDto,
    responseType: {} as AdminProfile,
    customHandler: async () => {
      throw new Error(
        "Admin profile updates are not currently supported. Please contact a super admin."
      );
    },
  },

  changeAdminPassword: {
    method: "POST",
    path: "/auth/change-password",
    requiresBody: true,
    bodyType: {} as ChangeAdminPasswordDto,
    responseType: {} as { message: string },
  },

  getAllUsers: {
    method: "GET",
    path: "/admin/users",
    queryParams: [{ name: "subaccountId", type: "string" }],
    responseType: {} as UserProfile[],
  },

  createUser: {
    method: "POST",
    path: "/admin/users",
    requiresBody: true,
    bodyType: {} as CreateUserDto,
    responseType: {} as Omit<
      UserProfile,
      "lastLoginAt" | "createdAt" | "updatedAt" | "createdByAdmin"
    >,
  },

  updateUser: {
    method: "PUT",
    path: "/admin/users/:userId",
    pathParams: [{ name: "userId", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as UpdateUserDto,
    responseType: {} as Omit<UserProfile, "createdByAdmin">,
  },

  deleteUser: {
    method: "DELETE",
    path: "/admin/users/:userId",
    pathParams: [{ name: "userId", required: true, type: "number" }],
    responseType: {} as { message: string },
  },

  generateAuthCode: {
    method: "POST",
    path: "/admin/auth-code/generate",
    responseType: {} as { authCode: string; message: string; expiresIn: string },
  },

  getCurrentAuthCode: {
    method: "GET",
    path: "/admin/auth-code/current",
    responseType: {} as { authCode: string; message: string },
  },

  getAllAdminAccounts: {
    method: "GET",
    path: "/admin/accounts",
    responseType: {} as AdminProfile[],
  },

  deleteAdminAccount: {
    method: "DELETE",
    path: "/admin/accounts/:adminId",
    pathParams: [{ name: "adminId", required: true, type: "number" }],
    responseType: {} as { message: string },
  },

  getDashboardStats: {
    method: "GET",
    path: "/general/dashboard-stats",
    queryParams: [{ name: "subaccountId", type: "string" }],
    responseType: {} as DashboardStats,
  },

  getSystemStatus: {
    method: "GET",
    path: "/general/system-status",
    responseType: {} as SystemStatus,
  },

  getRecentLeads: {
    method: "GET",
    path: "/general/recent-leads",
    queryParams: [{ name: "subaccountId", type: "string" }],
    responseType: {} as DetailedLead[],
  },

  getDetailedUser: {
    method: "GET",
    path: "/general/users/:userId/detailed",
    pathParams: [{ name: "userId", required: true, type: "number" }],
    responseType: {} as DetailedUser,
  },

  getDetailedLead: {
    method: "GET",
    path: "/general/leads/:leadId/detailed",
    pathParams: [{ name: "leadId", required: true, type: "number" }],
    responseType: {} as DetailedLead,
  },
};

