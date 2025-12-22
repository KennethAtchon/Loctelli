/**
 * Status API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { SystemStatus } from "../endpoints/status";

export const statusConfig: EndpointGroup = {
  getStatus: {
    method: "GET",
    path: "/status",
    responseType: {} as SystemStatus,
  },

  getHealth: {
    method: "GET",
    path: "/status/health",
    responseType: {} as { status: string },
  },

  getVersion: {
    method: "GET",
    path: "/status/version",
    responseType: {} as { version: string },
  },
};
