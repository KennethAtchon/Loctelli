'use client';

import { useState } from 'react';
import { ChevronDown, Building2, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSubaccountFilter } from '@/contexts/subaccount-filter-context';
import { cn } from '@/lib/utils';

interface SubaccountFilterProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function SubaccountFilter({ className, variant = 'default' }: SubaccountFilterProps) {
  const {
    currentFilter,
    availableSubaccounts,
    isSubaccountsLoading,
    setFilter,
    getCurrentSubaccount,
    isGlobalView,
  } = useSubaccountFilter();

  const [isOpen, setIsOpen] = useState(false);
  const currentSubaccount = getCurrentSubaccount();

  const handleFilterChange = (filter: string) => {
    setFilter(filter);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (isGlobalView()) {
      return 'GLOBAL';
    }
    return currentSubaccount?.name || 'Unknown';
  };

  const getDisplayIcon = () => {
    if (isGlobalView()) {
      return <Globe className="h-4 w-4" />;
    }
    return <Building2 className="h-4 w-4" />;
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'flex items-center gap-2 min-w-[120px] justify-between',
              className
            )}
            disabled={isSubaccountsLoading}
          >
            {isSubaccountsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {getDisplayIcon()}
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filter by Subaccount</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => handleFilterChange('GLOBAL')}
            className={cn(
              'flex items-center gap-2',
              currentFilter === 'GLOBAL' && 'bg-blue-50 text-blue-700'
            )}
          >
            <Globe className="h-4 w-4" />
            <span>Global View</span>
            {currentFilter === 'GLOBAL' && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>

          {availableSubaccounts.map((subaccount) => (
            <DropdownMenuItem
              key={subaccount.id}
              onClick={() => handleFilterChange(subaccount.id.toString())}
              className={cn(
                'flex items-center gap-2',
                currentFilter === subaccount.id.toString() && 'bg-blue-50 text-blue-700'
              )}
            >
              <Building2 className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{subaccount.name}</div>
                {subaccount.description && (
                  <div className="text-xs text-gray-500 truncate">
                    {subaccount.description}
                  </div>
                )}
              </div>
              {currentFilter === subaccount.id.toString() && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          ))}

          {availableSubaccounts.length === 0 && !isSubaccountsLoading && (
            <DropdownMenuItem disabled className="text-gray-500">
              No subaccounts available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'flex items-center gap-3 px-4 py-2 h-auto',
            className
          )}
          disabled={isSubaccountsLoading}
        >
          {isSubaccountsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {getDisplayIcon()}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{getDisplayText()}</span>
                <span className="text-xs text-gray-500">
                  {isGlobalView() ? 'All Subaccounts' : 'Subaccount View'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Filter by Subaccount</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleFilterChange('GLOBAL')}
          className={cn(
            'flex items-center gap-3 py-3',
            currentFilter === 'GLOBAL' && 'bg-blue-50 text-blue-700'
          )}
        >
          <Globe className="h-5 w-5" />
          <div className="flex-1">
            <div className="font-medium">Global View</div>
            <div className="text-sm text-gray-500">View all subaccounts data</div>
          </div>
          {currentFilter === 'GLOBAL' && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        {availableSubaccounts.map((subaccount) => (
          <DropdownMenuItem
            key={subaccount.id}
            onClick={() => handleFilterChange(subaccount.id.toString())}
            className={cn(
              'flex items-center gap-3 py-3',
              currentFilter === subaccount.id.toString() && 'bg-blue-50 text-blue-700'
            )}
          >
            <Building2 className="h-5 w-5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{subaccount.name}</div>
              <div className="text-sm text-gray-500 truncate">
                {subaccount.description || 'No description'}
              </div>
              <div className="text-xs text-gray-400">
                {subaccount._count.users} users • {subaccount._count.strategies} strategies
              </div>
            </div>
            {currentFilter === subaccount.id.toString() && (
              <Badge variant="secondary" className="ml-auto">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}

        {availableSubaccounts.length === 0 && !isSubaccountsLoading && (
          <DropdownMenuItem disabled className="text-gray-500 py-3">
            No subaccounts available
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 