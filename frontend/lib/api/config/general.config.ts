/**
 * General API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import { SchemaResponse } from "../endpoints/general";

export const generalConfig: EndpointGroup = {
  getDatabaseSchema: {
    method: "GET",
    path: "/general/schema",
    responseType: {} as SchemaResponse,
  },
};

