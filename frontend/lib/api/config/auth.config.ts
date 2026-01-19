/**
 * Auth API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  LoginDto,
  RegisterDto,
  AuthResponse,
  UserProfile,
} from "../endpoints/auth";

export const authConfig: EndpointGroup = {
  login: {
    method: "POST",
    path: "/auth/login",
    requiresBody: true,
    bodyType: {} as LoginDto,
    responseType: {} as AuthResponse,
  },

  register: {
    method: "POST",
    path: "/auth/register",
    requiresBody: true,
    bodyType: {} as RegisterDto,
    responseType: {} as Omit<
      UserProfile,
      "lastLoginAt" | "createdAt" | "updatedAt"
    >,
  },

  refreshToken: {
    method: "POST",
    path: "/auth/refresh",
    requiresBody: true,
    bodyType: {} as { refresh_token: string },
    responseType: {} as {
      access_token: string;
      refresh_token: string;
    },
  },

  logout: {
    method: "POST",
    path: "/auth/logout",
    responseType: {} as { message: string },
  },

  getProfile: {
    method: "GET",
    path: "/auth/profile",
    responseType: {} as UserProfile,
  },

  changePassword: {
    method: "POST",
    path: "/auth/change-password",
    requiresBody: true,
    bodyType: {} as { oldPassword: string; newPassword: string },
    responseType: {} as { message: string },
  },
};
