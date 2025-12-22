/**
 * Users API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { User, CreateUserDto } from "@/types";

export const usersConfig: EndpointGroup = {
  getUsers: {
    method: "GET",
    path: "/user",
    responseType: {} as User[],
  },

  getUser: {
    method: "GET",
    path: "/user/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as User,
  },

  createUser: {
    method: "POST",
    path: "/user",
    requiresBody: true,
    bodyType: {} as CreateUserDto,
    responseType: {} as User,
  },

  updateUser: {
    method: "PATCH",
    path: "/user/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    requiresBody: true,
    bodyType: {} as Partial<CreateUserDto>,
    responseType: {} as User,
  },

  deleteUser: {
    method: "DELETE",
    path: "/user/:id",
    pathParams: [{ name: "id", required: true, type: "number" }],
    responseType: {} as void,
  },
};
