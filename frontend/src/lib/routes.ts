/**
 * Centralized route configuration
 *
 * This file contains all route paths used throughout the application.
 * Use these constants instead of hardcoding route strings to ensure
 * consistency and easier refactoring.
 */

export const ROUTES = {
  // Public routes
  HOME: "/",
  BLOG: "/(public)/blog",
  PUBLIC_SLUG: "/(public)/$slug",

  // Auth routes
  LOGIN: "/(auth)/login",
  REGISTER: "/(auth)/register",

  // Customer routes
  ACCOUNT: "/(customer)/account",

  // Admin routes
  ADMIN: {
    // Layout
    LAYOUT: "/admin/_layout",

    // Core admin routes
    DASHBOARD: "/admin/(core)/dashboard",
    SETTINGS: "/admin/(core)/settings",
    SUBACCOUNTS: "/admin/(core)/subaccounts",
    USERS: "/admin/(core)/users",

    // Auth routes
    ADMIN_LOGIN: "/admin/(auth)/login",
    ADMIN_REGISTER: "/admin/(auth)/register",

    // CRM routes
    LEADS: "/admin/(crm)/leads/",
    LEADS_INDEX: "/admin/(crm)/leads/",
    LEAD_NEW: "/admin/(crm)/leads/new",
    LEAD_EDIT: "/admin/(crm)/leads/$id/edit",
    CONTACTS: "/admin/(crm)/contacts",
    CONTACT_EDIT: "/admin/(crm)/contacts/$id/edit",
    BOOKINGS: "/admin/(crm)/bookings",
    BOOKING_EDIT: "/admin/(crm)/bookings/$id/edit",

    // Content routes
    STRATEGIES: "/admin/(content)/strategies",
    STRATEGY_DETAIL: "/admin/(content)/strategies/$id",
    STRATEGY_NEW: "/admin/(content)/strategies/new",
    STRATEGY_EDIT: "/admin/(content)/strategies/$id/edit",
    PROMPT_TEMPLATES: "/admin/(content)/prompt-templates",
    PROMPT_TEMPLATE_NEW: "/admin/(content)/prompt-templates/new",
    PROMPT_TEMPLATE_EDIT: "/admin/(content)/prompt-templates/$id/edit",
    FORMS: "/admin/(content)/forms/",
    FORMS_INDEX: "/admin/(content)/forms/",
    FORM_NEW: "/admin/(content)/forms/new",
    FORM_EDIT: "/admin/(content)/forms/$id/edit",
    FORM_SUBMISSIONS: "/admin/(content)/forms/submissions/",
    FORM_SUBMISSION_DETAIL: "/admin/(content)/forms/submissions/$id",

    // Integrations routes
    INTEGRATIONS: "/admin/(integrations)/integrations",
    INTEGRATION_DETAIL: "/admin/(integrations)/$id",
    INTEGRATION_NEW: "/admin/(integrations)/new",
    INTEGRATION_EDIT: "/admin/(integrations)/$id/edit",

    // Tools routes
    CHAT: "/admin/(tools)/chat",
    DEV: "/admin/(tools)/dev",
  },
} as const;
