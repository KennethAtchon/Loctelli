import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  Query,
} from "@tanstack/react-query";
import { useTenant } from "@/contexts/tenant-context";
import logger from "@/lib/logger";

/**
 * Tenant-aware query hook that automatically includes tenant filtering
 *
 * Features:
 * - Automatically includes subAccountId in query key
 * - Validates tenant access before fetching
 * - Respects admin global/filtered view
 * - Invalidates queries when tenant filter changes
 *
 * @example
 * // Regular user - auto-filtered by their subAccountId
 * const { data: leads } = useTenantQuery({
 *   queryKey: ['leads'],
 *   queryFn: async ({ subAccountId }) => {
 *     return api.leads.getLeads({ subAccountId });
 *   }
 * });
 *
 * @example
 * // Admin - respects global/filtered view
 * const { data: users } = useTenantQuery({
 *   queryKey: ['users'],
 *   queryFn: async ({ subAccountId }) => {
 *     // subAccountId is null for global view
 *     return api.users.getUsers(subAccountId ? { subAccountId } : undefined);
 *   }
 * });
 */
export function useTenantQuery<TData = unknown, TError = Error>(
  options: {
    queryKey: readonly unknown[];
    queryFn: (context: { subAccountId: number | null }) => Promise<TData>;
    enabled?: boolean;
  } & Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">,
) {
  const { subAccountId, mode, validateTenantAccess } = useTenant();

  // Include tenant context in query key
  const tenantQueryKey = [
    ...options.queryKey,
    { tenantMode: mode, subAccountId },
  ];

  return useQuery<TData, TError>({
    ...options,
    queryKey: tenantQueryKey,
    queryFn: async () => {
      // Validate tenant access
      if (subAccountId) {
        validateTenantAccess(subAccountId);
      }

      logger.debug(`Tenant query: ${options.queryKey[0]}`, {
        mode,
        subAccountId,
      });

      return options.queryFn({ subAccountId });
    },
  });
}

/**
 * Tenant-aware mutation hook with automatic query invalidation
 *
 * @example
 * const createLead = useTenantMutation({
 *   mutationFn: async ({ data, subAccountId }) => {
 *     return api.leads.createLead({ ...data, subAccountId });
 *   },
 *   invalidateQueries: [['leads']], // Auto-invalidate leads queries
 * });
 */
export function useTenantMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: {
    mutationFn: (
      variables: TVariables & { subAccountId: number | null },
    ) => Promise<TData>;
    invalidateQueries?: readonly (readonly unknown[])[];
    requireSubAccount?: boolean; // If true, throws error if subAccountId is null
  } & Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "mutationFn"
  >,
) {
  const { subAccountId, mode, validateTenantAccess } = useTenant();
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    ...options,
    mutationFn: async (variables: TVariables) => {
      // Validate requirement
      if (options.requireSubAccount && !subAccountId) {
        throw new Error("SubAccount required for this operation");
      }

      // Validate tenant access
      if (subAccountId) {
        validateTenantAccess(subAccountId);
      }

      logger.debug("Tenant mutation", {
        mode,
        subAccountId,
      });

      return options.mutationFn({ ...variables, subAccountId } as TVariables & {
        subAccountId: number | null;
      });
    },
    onSuccess: (data, variables, context) => {
      // Invalidate specified queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey: [...queryKey, { tenantMode: mode, subAccountId }],
          });
        });
      }

      // Call original onSuccess if provided
      if (options.onSuccess) {
        // @ts-expect-error - onSuccess signature varies between versions
        options.onSuccess(data, variables, context);
      }
    },
  });
}

/**
 * Hook to get tenant-aware query key
 * Useful for manual query invalidation
 *
 * @example
 * const queryClient = useQueryClient();
 * const { getTenantQueryKey } = useTenantQueryKey();
 *
 * // Invalidate leads query for current tenant
 * queryClient.invalidateQueries({
 *   queryKey: getTenantQueryKey(['leads'])
 * });
 */
export function useTenantQueryKey() {
  const { subAccountId, mode } = useTenant();

  return {
    getTenantQueryKey: (baseKey: readonly unknown[]) => [
      ...baseKey,
      { tenantMode: mode, subAccountId },
    ],
    subAccountId,
    mode,
  };
}

/**
 * Hook to invalidate all queries for current tenant
 * Useful when switching tenants (admin) or major data changes
 *
 * @example
 * const { invalidateAllTenantQueries } = useInvalidateTenantQueries();
 *
 * // After switching subaccount filter
 * invalidateAllTenantQueries();
 */
export function useInvalidateTenantQueries() {
  const queryClient = useQueryClient();
  const { subAccountId, mode } = useTenant();

  return {
    invalidateAllTenantQueries: () => {
      logger.debug("Invalidating all tenant queries", { mode, subAccountId });

      queryClient.invalidateQueries({
        predicate: (query: Query) => {
          const key = query.queryKey as any[];
          const lastItem = key[key.length - 1];

          // Check if query key includes our tenant context
          return (
            lastItem &&
            typeof lastItem === "object" &&
            "tenantMode" in lastItem &&
            lastItem.tenantMode === mode &&
            lastItem.subAccountId === subAccountId
          );
        },
      });
    },

    invalidateTenantQuery: (query: readonly unknown[]) => {
      queryClient.invalidateQueries({
        queryKey: [...query, { tenantMode: mode, subAccountId }],
      });
    },
  };
}

/**
 * Hook for infinite queries with tenant awareness
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useTenantInfiniteQuery({
 *   queryKey: ['leads'],
 *   queryFn: async ({ pageParam, subAccountId }) => {
 *     return api.leads.getLeads({
 *       subAccountId,
 *       page: pageParam,
 *       limit: 20
 *     });
 *   },
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 * });
 */
export function useTenantInfiniteQuery<
  TData = unknown,
  TError = Error,
>(options: {
  queryKey: readonly unknown[];
  queryFn: (context: {
    pageParam?: any;
    subAccountId: number | null;
  }) => Promise<TData>;
  getNextPageParam: (lastPage: TData) => unknown | undefined;
  enabled?: boolean;
}) {
  const { subAccountId, mode, validateTenantAccess } = useTenant();

  // Include tenant context in query key
  const tenantQueryKey = [
    ...options.queryKey,
    { tenantMode: mode, subAccountId },
  ];

  return useQuery<TData, TError>({
    queryKey: tenantQueryKey,
    queryFn: async () => {
      // Validate tenant access
      if (subAccountId) {
        validateTenantAccess(subAccountId);
      }

      logger.debug(`Tenant infinite query: ${options.queryKey[0]}`, {
        mode,
        subAccountId,
      });

      return options.queryFn({ subAccountId });
    },
    enabled: options.enabled,
  });
}
