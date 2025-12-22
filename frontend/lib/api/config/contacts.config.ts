/**
 * Contacts API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  ContactSubmission,
  CreateContactSubmissionDto,
  UpdateContactSubmissionDto,
  CreateContactNoteDto,
  ContactStats,
} from "@/types";

export const contactsConfig: EndpointGroup = {
  getContacts: {
    method: "GET",
    path: "/contacts",
    queryParams: [
      { name: "status", type: "string" },
      { name: "priority", type: "string" },
      { name: "assignedToId", type: "number" },
    ],
    responseType: {} as ContactSubmission[],
  },

  getContact: {
    method: "GET",
    path: "/contacts/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    responseType: {} as ContactSubmission,
  },

  createContact: {
    method: "POST",
    path: "/contacts",
    requiresBody: true,
    bodyType: {} as CreateContactSubmissionDto,
    responseType: {} as ContactSubmission,
  },

  updateContact: {
    method: "PATCH",
    path: "/contacts/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as UpdateContactSubmissionDto,
    responseType: {} as ContactSubmission,
  },

  addNote: {
    method: "POST",
    path: "/contacts/:contactId/notes",
    pathParams: [{ name: "contactId", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as CreateContactNoteDto,
    responseType: {} as ContactSubmission,
  },

  getStats: {
    method: "GET",
    path: "/contacts/stats",
    responseType: {} as ContactStats,
  },
};
