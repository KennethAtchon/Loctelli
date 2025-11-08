/**
 * ONBOARDING SubAccount Constants
 *
 * These constants define the special ONBOARDING subaccount that new users
 * are assigned to before they join or create their own workspace.
 */

export const ONBOARDING_SUBACCOUNT_ID = 1;

export const ONBOARDING_RESTRICTIONS = {
  // Allowed routes for ONBOARDING users
  allowedRoutes: [
    '/api/users/profile',
    '/api/users/settings',
    '/api/subaccounts/create',
    '/api/subaccounts/join',
    '/api/subaccounts/status',
    '/api/subaccounts/invitations/*/validate',
    '/api/auth/*', // All auth routes
  ],

  // Blocked routes for ONBOARDING users
  blockedRoutes: [
    '/api/leads/*',
    '/api/strategies/*',
    '/api/bookings/*',
    '/api/chat/*',
    '/api/integrations/*',
    '/api/contacts/*',
    '/api/forms/*',
  ],

  // Features
  features: {
    canViewLeads: false,
    canCreateStrategies: false,
    canMakeBookings: false,
    canUseIntegrations: false,
    canManageContacts: false,
  }
};
