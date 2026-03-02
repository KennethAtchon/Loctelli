/**
 * Forms API endpoint configuration
 */

import { EndpointGroup } from "./endpoint-config";
import type {
  FormTemplate,
  FormSubmission,
  CreateFormTemplateDto,
  UpdateFormTemplateDto,
  CreateFormSubmissionDto,
  UpdateFormSubmissionDto,
  FormStats,
  UploadedFile,
  FormSessionPayload,
  CreateFormSessionDto,
  UpdateFormSessionDto,
} from "@/lib/forms/types";

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
    responseType: undefined as unknown as void,
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

  calculateProfileEstimation: {
    method: "POST",
    path: "/forms/public/:slug/calculate-profile",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as { answers: Record<string, unknown> },
    responseType: {} as {
      type: string;
      result: Record<string, unknown>;
      aiEnhanced?: boolean;
      aiResult?: Record<string, unknown>;
      error?: string;
    },
  },

  pingDatabase: {
    method: "GET",
    path: "/forms/public/ping",
    responseType: {} as { status: string; timestamp: string },
  },

  uploadFormFile: {
    method: "POST",
    path: "/forms/public/:slug/upload",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    isFileUpload: true,
    responseType: {} as UploadedFile,
  },

  uploadAdminFile: {
    method: "POST",
    path: "/forms/templates/:slug/upload",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    isFileUpload: true,
    responseType: {} as UploadedFile,
  },

  // Form session (card form save/resume)
  createFormSession: {
    method: "POST",
    path: "/forms/public/:slug/session",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as CreateFormSessionDto,
    responseType: {} as FormSessionPayload,
  },
  getFormSession: {
    method: "GET",
    path: "/forms/public/:slug/session/:token",
    pathParams: [
      { name: "slug", required: true, type: "string" },
      { name: "token", required: true, type: "string" },
    ],
    responseType: {} as FormSessionPayload,
  },
  updateFormSession: {
    method: "PATCH",
    path: "/forms/public/:slug/session/:token",
    pathParams: [
      { name: "slug", required: true, type: "string" },
      { name: "token", required: true, type: "string" },
    ],
    requiresBody: true,
    bodyType: {} as UpdateFormSessionDto,
    responseType: {} as FormSessionPayload,
  },
  completeFormSession: {
    method: "POST",
    path: "/forms/public/:slug/session/:token/complete",
    pathParams: [
      { name: "slug", required: true, type: "string" },
      { name: "token", required: true, type: "string" },
    ],
    responseType: undefined as unknown as void,
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
    responseType: undefined as unknown as void,
  },

  getFormStats: {
    method: "GET",
    path: "/forms/submissions/stats",
    responseType: {} as FormStats,
  },

  getFormAnalytics: {
    method: "GET",
    path: "/forms/templates/:id/analytics",
    pathParams: [{ name: "id", required: true, type: "string" }],
    responseType: {} as {
      totalViews: number;
      totalStarted: number;
      totalCompleted: number;
      completionRate: number;
      averageTime: number;
      dropOffAnalysis: Array<{
        cardIndex: number;
        cardId: string;
        cardLabel: string;
        views: number;
        dropOffRate: number;
        averageTime: number;
      }>;
      timePerCard: Record<string, number>;
      deviceBreakdown: {
        mobile: number;
        tablet: number;
        desktop: number;
        unknown: number;
      };
      profileResults?: Array<{
        result: string;
        count: number;
        percentage: number;
      }>;
    },
  },

  trackCardTime: {
    method: "POST",
    path: "/forms/public/:slug/track-time",
    pathParams: [{ name: "slug", required: true, type: "string" }],
    requiresBody: true,
    bodyType: {} as {
      sessionToken: string;
      cardId: string;
      timeSeconds: number;
    },
    responseType: {} as { success: boolean },
  },

  // Card Form AI chat (admin): ask questions, get Card Form JSON
  cardFormAiChat: {
    method: "POST",
    path: "/forms/ai-card-form-chat",
    requiresBody: true,
    bodyType: {} as {
      message: string;
      currentCardFormPayload?: Record<string, unknown>;
      conversationHistory?: Array<{ role: string; content: string }>;
    },
    responseType: {} as { content: string },
  },

  // Simple Form AI chat (admin): ask questions, get Simple Form JSON
  simpleFormAiChat: {
    method: "POST",
    path: "/forms/ai-simple-form-chat",
    requiresBody: true,
    bodyType: {} as {
      message: string;
      currentSimpleFormPayload?: Record<string, unknown>;
      conversationHistory?: Array<{ role: string; content: string }>;
    },
    responseType: {} as { content: string },
  },
};
