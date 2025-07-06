'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { SubAccount } from '@/lib/api';
import logger from '@/lib/logger';

interface SubaccountFilterContextType {
  currentFilter: string; // "GLOBAL" or subaccount ID
  availableSubaccounts: SubAccount[];
  isLoading: boolean;
  isSubaccountsLoading: boolean;
  setFilter: (filter: string) => void;
  refreshSubaccounts: () => Promise<void>;
  getCurrentSubaccount: () => SubAccount | null;
  isGlobalView: () => boolean;
}

const SubaccountFilterContext = createContext<SubaccountFilterContextType | undefined>(undefined);

export function SubaccountFilterProvider({ children }: { children: React.ReactNode }) {
  const [currentFilter, setCurrentFilter] = useState<string>('GLOBAL');
  const [availableSubaccounts, setAvailableSubaccounts] = useState<SubAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubaccountsLoading, setIsSubaccountsLoading] = useState(true);

  // Load subaccounts on mount
  useEffect(() => {
    loadSubaccounts();
  }, []);

  // Load saved filter from localStorage
  useEffect(() => {
    const savedFilter = localStorage.getItem('admin-subaccount-filter');
    if (savedFilter) {
      setCurrentFilter(savedFilter);
    }
  }, []);

  const loadSubaccounts = async () => {
    try {
      setIsSubaccountsLoading(true);
      const subaccounts = await api.adminSubAccounts.getAllSubAccounts();
      setAvailableSubaccounts(subaccounts);
      logger.debug('Loaded subaccounts:', subaccounts.length);
    } catch (error) {
      logger.error('Failed to load subaccounts:', error);
      setAvailableSubaccounts([]);
    } finally {
      setIsSubaccountsLoading(false);
    }
  };

  const setFilter = (filter: string) => {
    setCurrentFilter(filter);
    localStorage.setItem('admin-subaccount-filter', filter);
    logger.debug('Subaccount filter changed to:', filter);
  };

  const refreshSubaccounts = async () => {
    await loadSubaccounts();
  };

  const getCurrentSubaccount = (): SubAccount | null => {
    if (currentFilter === 'GLOBAL') return null;
    return availableSubaccounts.find(sa => sa.id.toString() === currentFilter) || null;
  };

  const isGlobalView = (): boolean => {
    return currentFilter === 'GLOBAL';
  };

  const value: SubaccountFilterContextType = {
    currentFilter,
    availableSubaccounts,
    isLoading,
    isSubaccountsLoading,
    setFilter,
    refreshSubaccounts,
    getCurrentSubaccount,
    isGlobalView,
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
    throw new Error('useSubaccountFilter must be used within a SubaccountFilterProvider');
  }
  return context;
} 