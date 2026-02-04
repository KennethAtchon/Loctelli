"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { SubAccount } from "@/lib/api";
import logger from "@/lib/logger";

const SUBACCOUNTS_QUERY_KEY = ["subaccounts"] as const;

interface SubaccountFilterContextType {
  currentFilter: string; // "GLOBAL" or subaccount ID
  availableSubaccounts: SubAccount[];
  isLoading: boolean;
  isSubaccountsLoading: boolean;
  setFilter: (filter: string) => void;
  refreshSubaccounts: () => Promise<void>;
  getCurrentSubaccount: () => SubAccount | null;
  isGlobalView: () => boolean;
  refreshFilter: () => void;
}

const SubaccountFilterContext = createContext<
  SubaccountFilterContextType | undefined
>(undefined);

export function SubaccountFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [currentFilter, setCurrentFilterState] =
    React.useState<string>("GLOBAL");

  const {
    data: availableSubaccounts = [],
    isLoading: isSubaccountsLoading,
    refetch: refetchSubaccounts,
  } = useQuery({
    queryKey: SUBACCOUNTS_QUERY_KEY,
    queryFn: () => api.adminSubAccounts.getAllSubAccounts(),
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const setFilter = useCallback(
    (filter: string) => {
      setCurrentFilterState(filter);
      localStorage.setItem("admin-subaccount-filter", filter);
      logger.debug("Subaccount filter changed to:", filter);
      // Invalidate all tenant-scoped queries so data refetches for the new filter
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as readonly unknown[];
          const last = key[key.length - 1];
          return (
            typeof last === "object" &&
            last !== null &&
            "tenantMode" in (last as object) &&
            "subAccountId" in (last as object)
          );
        },
      });
    },
    [queryClient]
  );

  // Load saved filter from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem("admin-subaccount-filter");
    if (savedFilter) {
      setCurrentFilterState(savedFilter);
    }
  }, []);

  // Listen for subaccount changes and refresh the list
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin-subaccount-filter" && e.newValue) {
        setCurrentFilterState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const refreshSubaccounts = useCallback(async () => {
    await refetchSubaccounts();
  }, [refetchSubaccounts]);

  const getCurrentSubaccount = (): SubAccount | null => {
    if (currentFilter === "GLOBAL") return null;
    return (
      availableSubaccounts.find((sa) => sa.id.toString() === currentFilter) ||
      null
    );
  };

  const isGlobalView = (): boolean => {
    return currentFilter === "GLOBAL";
  };

  const refreshFilter = useCallback(() => {
    const current = currentFilter;
    setCurrentFilterState("");
    setTimeout(() => setCurrentFilterState(current), 0);
  }, [currentFilter]);

  const value: SubaccountFilterContextType = {
    currentFilter,
    availableSubaccounts,
    isLoading: false,
    isSubaccountsLoading,
    setFilter,
    refreshSubaccounts,
    getCurrentSubaccount,
    isGlobalView,
    refreshFilter,
  };

  return (
    <SubaccountFilterContext.Provider value={value}>
      {children}
    </SubaccountFilterContext.Provider>
  );
}

export function useSubaccountFilter() {
  const context = useContext(SubaccountFilterContext);
  if (context === undefined) {
    throw new Error(
      "useSubaccountFilter must be used within a SubaccountFilterProvider"
    );
  }
  return context;
}

// Safe version that returns null instead of throwing
export function useSubaccountFilterSafe() {
  const context = useContext(SubaccountFilterContext);
  return context ?? null;
}
