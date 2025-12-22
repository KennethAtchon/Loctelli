/**
 * Config-driven API endpoint system
 *
 * Export all configs and utilities
 */

export * from "./endpoint-config";
export * from "./endpoint-builder";

// Export all endpoint configs
export { strategiesConfig } from "./strategies.config";
export { leadsConfig } from "./leads.config";
export { bookingsConfig } from "./bookings.config";
export { usersConfig } from "./users.config";
export { formsConfig } from "./forms.config";
export { chatConfig } from "./chat.config";
export { contactsConfig } from "./contacts.config";
export { promptTemplatesConfig } from "./prompt-templates.config";
export { integrationTemplatesConfig } from "./integration-templates.config";
export { integrationsConfig } from "./integrations.config";
export { generalConfig } from "./general.config";
export { statusConfig } from "./status.config";
export { authConfig } from "./auth.config";
export { adminAuthConfig } from "./admin-auth.config";
export { adminSubAccountsConfig } from "./admin-subaccounts.config";
