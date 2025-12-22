/**
 * Forms API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import {
  FormTemplate,
  FormSubmission,
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
  CreateFormSubmissionDto,
  UpdateFormSubmissionDto,
  FormStats,
  UploadedFile,
} from "../endpoints/forms";

export const formsConfig: EndpointGroup = {
  // Form Templates
  getFormTemplates: {
    method: "GET",
    path: "/forms/templates",
    queryParams: [{ name: "subAccountId", type: "number" }],
    responseType: {} as FormTemplate[],
  },

  getFormTemplate: {
    method: "GET",
    path: "/forms/templates/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    responseType: {} as FormTemplate,
  },

  createFormTemplate: {
    method: "POST",
    path: "/forms/templates",
    requiresBody: true,
    bodyType: {} as CreateFormTemplateDto,
    responseType: {} as FormTemplate,
  },

  updateFormTemplate: {
    method: "PATCH",
    path: "/forms/templates/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as UpdateFormTemplateDto,
    responseType: {} as FormTemplate,
  },

  deleteFormTemplate: {
    method: "DELETE",
    path: "/forms/templates/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    responseType: {} as void,
  },

  // Public form access
  getPublicForm: {
    method: "GET",
    path: "/forms/public/:slug",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    responseType: {} as FormTemplate,
  },

  submitPublicForm: {
    method: "POST",
    path: "/forms/public/:slug/submit",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as CreateFormSubmissionDto,
    responseType: {} as FormSubmission,
  },

  wakeUpDatabase: {
    method: "GET",
    path: "/forms/public/wake-up",
    responseType: {} as { status: string; timestamp: string },
  },

  uploadFormFile: {
    method: "POST",
    path: "/forms/public/:slug/upload",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    isFileUpload: true,
    responseType: {} as UploadedFile,
  },

  // Form Submissions
  getFormSubmissions: {
    method: "GET",
    path: "/forms/submissions",
    queryParams: [
      { name: "subAccountId", type: "number" },
      { name: "formTemplateId", type: "string" },
      { name: "status", type: "string" },
    ],
    responseType: {} as FormSubmission[],
  },

  getFormSubmission: {
    method: "GET",
    path: "/forms/submissions/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    responseType: {} as FormSubmission,
  },

  updateFormSubmission: {
    method: "PATCH",
    path: "/forms/submissions/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as UpdateFormSubmissionDto,
    responseType: {} as FormSubmission,
  },

  deleteFormSubmission: {
    method: "DELETE",
    path: "/forms/submissions/:id",
    pathParams: [{ name: "id", required: true, type: "string" }],
    responseType: {} as void,
  },

  getFormStats: {
    method: "GET",
    path: "/forms/submissions/stats",
    responseType: {} as FormStats,
  },
};
