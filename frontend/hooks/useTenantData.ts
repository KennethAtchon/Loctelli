/**
 * Simplified tenant-aware data fetching hooks
 * Works without React Query - uses native React hooks
 */

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/tenant-context";
import logger from "@/lib/logger";

interface UseTenantDataOptions<T> {
  queryKey: string;
  queryFn: (context: { subAccountId: number | null }) => Promise<T>;
  enabled?: boolean;
}

/**
 * Simplified tenant-aware data fetching
 * Alternative to useTenantQuery that doesn't require React Query
 */
export function useTenantData<T>(options: UseTenantDataOptions<T>) {
  const { subAccountId, mode, validateTenantAccess } = useTenant();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (options.enabled === false) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validate tenant access
      if (subAccountId) {
        validateTenantAccess(subAccountId);
      }

      logger.debug(`Tenant data fetch: ${options.queryKey}`, {
        mode,
        subAccountId,
      });

      const result = await options.queryFn({ subAccountId });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      logger.error(`Tenant data fetch failed: ${options.queryKey}`, err);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options and validateTenantAccess intentionally omitted to avoid ref churn
  }, [subAccountId, mode, options.queryKey, options.enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Simplified tenant-aware mutation
 */
export function useTenantMutation<
  TData,
  TVariables extends Record<string, unknown>,
>(options: {
  mutationFn: (
    variables: TVariables & { subAccountId: number | null }
  ) => Promise<TData>;
  requireSubAccount?: boolean;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}) {
  const { subAccountId, mode, validateTenantAccess } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables) => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate requirement
        if (options.requireSubAccount && !subAccountId) {
          throw new Error("SubAccount required for this operation");
        }

        // Validate tenant access
        if (subAccountId) {
          validateTenantAccess(subAccountId);
        }

        logger.debug("Tenant mutation", { mode, subAccountId });

        const result = await options.mutationFn({
          ...variables,
          subAccountId,
        });

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- validateTenantAccess stable from context
    [subAccountId, mode, options]
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

/**
 * Hook to get tenant scope helpers
 * Simpler alternative that just provides the context
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
