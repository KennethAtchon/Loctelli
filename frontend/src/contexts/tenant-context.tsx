"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useUnifiedAuth } from "./unified-auth-context";
import { SubaccountFilterContext } from "./subaccount-filter-context";
import logger from "@/lib/logger";

/**
 * Tenant Mode determines how data filtering works
 * - USER_SCOPED: Regular user, auto-filter by their subAccountId
 * - ADMIN_GLOBAL: Admin viewing all tenants
 * - ADMIN_FILTERED: Admin filtered to specific tenant
 */
export type TenantMode = "USER_SCOPED" | "ADMIN_GLOBAL" | "ADMIN_FILTERED";

export interface TenantContextType {
  // Current tenant mode
  mode: TenantMode;

  // The subAccountId to filter by (null for ADMIN_GLOBAL)
  subAccountId: number | null;

  // Whether to apply tenant filtering
  shouldFilterByTenant: boolean;

  // Whether current view is global (admin only)
  isGlobalView: boolean;

  // For admin: current filter selection
  adminFilter: string | null;

  // For admin: available subaccounts
  availableSubaccounts: any[];

  // For admin: set filter
  setAdminFilter: ((filter: string) => void) | null;

  // For admin: loading state
  isSubaccountsLoading: boolean;

  // For admin: refresh subaccounts list
  refreshSubaccounts: (() => Promise<void>) | null;

  // For admin: set subaccount id (legacy support)
  setSubAccountId: ((id: number | null) => void) | null;

  // For admin: get current subaccount
  getCurrentSubaccount: (() => any | null) | null;

  // Get query parameters for API calls
  getTenantQueryParams: () => { subAccountId?: number };

  // Get headers for API calls
  getTenantHeaders: () => { "X-SubAccount-Id"?: string };

  // Helper to check if user can access a subAccountId
  canAccessSubAccount: (subAccountId: number) => boolean;

  // Helper to validate tenant context before operations
  validateTenantAccess: (subAccountId?: number) => void;
}

// Initialize with default value so context is always available
// This prevents "useTenant must be used within a TenantProvider" errors
const TenantContext = createContext<TenantContextType>({
  mode: "USER_SCOPED",
  subAccountId: null,
  shouldFilterByTenant: false,
  isGlobalView: false,
  adminFilter: null,
  availableSubaccounts: [],
  setAdminFilter: null,
  isSubaccountsLoading: false,
  refreshSubaccounts: null,
  setSubAccountId: null,
  getCurrentSubaccount: null,
  getTenantQueryParams: () => ({}),
  getTenantHeaders: () => ({}),
  canAccessSubAccount: () => false,
  validateTenantAccess: () => {
    logger.warn("Tenant access validation called but context is not initialized");
  },
});

// Default fallback context value
const DEFAULT_TENANT_CONTEXT: TenantContextType = {
  mode: "USER_SCOPED",
  subAccountId: null,
  shouldFilterByTenant: false,
  isGlobalView: false,
  adminFilter: null,
  availableSubaccounts: [],
  setAdminFilter: null,
  isSubaccountsLoading: false,
  refreshSubaccounts: null,
  setSubAccountId: null,
  getCurrentSubaccount: null,
  getTenantQueryParams: () => ({}),
  getTenantHeaders: () => ({}),
  canAccessSubAccount: () => false,
  validateTenantAccess: () => {
    logger.warn("Tenant access validation called but context is not initialized");
  },
};

function TenantProviderInner({ children }: { children: React.ReactNode }) {
  // Hooks must be called unconditionally - always call them
  // These should always be available since they're in the root layout
  const { account, accountType, isAuthenticated, isLoading } = useUnifiedAuth();
  
  // Admin context (only available for admins)
  // Use useContext directly instead of the hook to avoid throwing errors
  // This returns undefined if not in provider, which we handle gracefully
  const subaccountFilterContext = useContext(SubaccountFilterContext);

  const value = useMemo<TenantContextType>(() => {
    try {
      // Still loading - provide a safe default context
      if (isLoading) {
        return {
          mode: "USER_SCOPED",
          subAccountId: null,
          shouldFilterByTenant: false,
          isGlobalView: false,
          adminFilter: null,
          availableSubaccounts: [],
          setAdminFilter: null,
          isSubaccountsLoading: false,
          refreshSubaccounts: null,
          setSubAccountId: null,
          getCurrentSubaccount: null,
          getTenantQueryParams: () => ({}),
          getTenantHeaders: () => ({}),
          canAccessSubAccount: () => false,
          validateTenantAccess: () => {
            // Don't throw during loading - just log
            logger.debug("Tenant access validation skipped - auth still loading");
          },
        };
      }
    // Not authenticated - no tenant context
    if (!isAuthenticated || !account) {
      return {
        mode: "USER_SCOPED",
        subAccountId: null,
        shouldFilterByTenant: false,
        isGlobalView: false,
        adminFilter: null,
        availableSubaccounts: [],
        setAdminFilter: null,
        isSubaccountsLoading: false,
        refreshSubaccounts: null,
        setSubAccountId: null,
        getCurrentSubaccount: null,
        getTenantQueryParams: () => ({}),
        getTenantHeaders: () => ({}),
        canAccessSubAccount: () => false,
        validateTenantAccess: () => {
          throw new Error("User not authenticated");
        },
      };
    }

    // Admin user
    if (accountType === "admin") {
      const isGlobal =
        !subaccountFilterContext || subaccountFilterContext.isGlobalView?.() || false;
      const currentSubAccount = subaccountFilterContext?.getCurrentSubaccount?.() || null;

      return {
        mode: isGlobal ? "ADMIN_GLOBAL" : "ADMIN_FILTERED",
        subAccountId: currentSubAccount?.id || null,
        shouldFilterByTenant: !isGlobal,
        isGlobalView: isGlobal,
        adminFilter: subaccountFilterContext?.currentFilter || "GLOBAL",
        availableSubaccounts:
          subaccountFilterContext?.availableSubaccounts || [],
        setAdminFilter: subaccountFilterContext?.setFilter || null,
        isSubaccountsLoading:
          subaccountFilterContext?.isSubaccountsLoading || false,
        refreshSubaccounts: subaccountFilterContext?.refreshSubaccounts || null,
        setSubAccountId: subaccountFilterContext?.setFilter
          ? (id: number | null) => {
              subaccountFilterContext?.setFilter?.(
                id === null ? "GLOBAL" : id.toString(),
              );
            }
          : null,
        getCurrentSubaccount:
          subaccountFilterContext?.getCurrentSubaccount || null,

        getTenantQueryParams: () => {
          if (isGlobal) return {};
          return currentSubAccount
            ? { subAccountId: currentSubAccount.id }
            : {};
        },

        getTenantHeaders: () => {
          if (isGlobal) return {};
          return currentSubAccount
            ? { "X-SubAccount-Id": currentSubAccount.id.toString() }
            : {};
        },

        canAccessSubAccount: (subAccountId: number) => {
          // Admins can access any subaccount
          return true;
        },

        validateTenantAccess: (subAccountId?: number) => {
          // Admins can access anything
          logger.debug(
            `Admin accessing ${subAccountId ? `subAccount ${subAccountId}` : "global view"}`,
          );
        },
      };
    }

    // Regular user
    const userSubAccountId = (account as any).subAccountId;

    if (!userSubAccountId) {
      logger.error("Regular user without subAccountId!", account);
      throw new Error("User account missing subAccountId");
    }

    return {
      mode: "USER_SCOPED",
      subAccountId: userSubAccountId,
      shouldFilterByTenant: true,
      isGlobalView: false,
      adminFilter: null,
      availableSubaccounts: [],
      setAdminFilter: null,
      isSubaccountsLoading: false,
      refreshSubaccounts: null,
      setSubAccountId: null,
      getCurrentSubaccount: null,

      getTenantQueryParams: () => {
        return { subAccountId: userSubAccountId };
      },

      getTenantHeaders: () => {
        return { "X-SubAccount-Id": userSubAccountId.toString() };
      },

      canAccessSubAccount: (subAccountId: number) => {
        // Regular users can only access their own subaccount
        return subAccountId === userSubAccountId;
      },

      validateTenantAccess: (subAccountId?: number) => {
        if (subAccountId && subAccountId !== userSubAccountId) {
          logger.error(
            `Security violation: User ${account.id} (subAccount ${userSubAccountId}) ` +
              `attempted to access subAccount ${subAccountId}`,
          );
          throw new Error("Access denied: Cannot access other tenant data");
        }
        logger.debug(`User accessing subAccount ${userSubAccountId}`);
      },
    };
    } catch (error) {
      logger.error("Error creating tenant context value:", error);
      // Return a safe fallback context
      return {
        mode: "USER_SCOPED",
        subAccountId: null,
        shouldFilterByTenant: false,
        isGlobalView: false,
        adminFilter: null,
        availableSubaccounts: [],
        setAdminFilter: null,
        isSubaccountsLoading: false,
        refreshSubaccounts: null,
        setSubAccountId: null,
        getCurrentSubaccount: null,
        getTenantQueryParams: () => ({}),
        getTenantHeaders: () => ({}),
        canAccessSubAccount: () => false,
        validateTenantAccess: () => {
          logger.warn("Tenant access validation called but context initialization failed");
        },
      };
    }
  }, [account, accountType, isAuthenticated, isLoading, subaccountFilterContext]);

  // Always render the provider - ensure value is never undefined
  // This prevents "useTenant must be used within a TenantProvider" errors
  if (!value) {
    logger.error("TenantProvider: value is undefined, using fallback");
    const fallbackValue: TenantContextType = {
      mode: "USER_SCOPED",
      subAccountId: null,
      shouldFilterByTenant: false,
      isGlobalView: false,
      adminFilter: null,
      availableSubaccounts: [],
      setAdminFilter: null,
      isSubaccountsLoading: false,
      refreshSubaccounts: null,
      setSubAccountId: null,
      getCurrentSubaccount: null,
      getTenantQueryParams: () => ({}),
      getTenantHeaders: () => ({}),
      canAccessSubAccount: () => false,
      validateTenantAccess: () => {
        logger.warn("Tenant access validation called but context value is undefined");
      },
    };
    return (
      <TenantContext.Provider value={fallbackValue}>{children}</TenantContext.Provider>
    );
  }

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

// Error boundary component to catch any errors during provider initialization
class TenantProviderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("TenantProvider: Error caught in error boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // If there's an error, still render the provider with default value
      // This ensures useTenant() never throws
      return (
        <TenantContext.Provider value={DEFAULT_TENANT_CONTEXT}>
          {this.props.children}
        </TenantContext.Provider>
      );
    }

    return this.props.children;
  }
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  return (
    <TenantProviderErrorBoundary>
      <TenantProviderInner>{children}</TenantProviderInner>
    </TenantProviderErrorBoundary>
  );
}

/**
 * Hook to access tenant context
 *
 * @example
 * // Regular user - auto-filtered
 * const { subAccountId, getTenantQueryParams } = useTenant();
 * const leads = await api.leads.getLeads(getTenantQueryParams());
 *
 * @example
 * // Admin - respects global/filtered view
 * const { isGlobalView, getTenantQueryParams } = useTenant();
 * if (isGlobalView) {
 *   // Fetch all data
 * } else {
 *   // Fetch for specific tenant
 * }
 */
export function useTenant() {
  // Context always has a value (default or provided), so no need to check for undefined
  return useContext(TenantContext);
}

/**
 * Hook to enforce tenant-scoped operations
 * Automatically includes tenant filtering in queries
 *
 * @example
 * const { query, canAccess } = useTenantScope();
 * const leads = await api.leads.getLeads(query());
 */
export function useTenantScope() {
  const tenant = useTenant();

  return {
    // Get query params with tenant filtering
    query: tenant.getTenantQueryParams,

    // Get headers with tenant context
    headers: tenant.getTenantHeaders,

    // Check if can access a specific subAccountId
    canAccess: tenant.canAccessSubAccount,

    // Validate before an operation
    validate: tenant.validateTenantAccess,

    // Current tenant info
    subAccountId: tenant.subAccountId,
    mode: tenant.mode,
    isGlobalView: tenant.isGlobalView,
  };
}

/**
 * Component wrapper that requires tenant context
 * Useful for pages that should only be accessible with proper tenant scope
 */
export function RequireTenant({ children }: { children: React.ReactNode }) {
  const { shouldFilterByTenant, subAccountId } = useTenant();

  if (shouldFilterByTenant && !subAccountId) {
    return (
      <div className="p-4 text-red-600">
        Error: Tenant context required but not available
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component to inject tenant context
 */
export function withTenant<P extends object>(
  Component: React.ComponentType<P & { tenant: TenantContextType }>,
) {
  return function WithTenantComponent(props: P) {
    const tenant = useTenant();
    return <Component {...props} tenant={tenant} />;
  };
}
