"use client";

import { useState } from "react";
import { ChevronDown, Building2, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useTenant } from "@/contexts/tenant-context";
import { cn } from "@/lib/utils";

interface SubaccountFilterProps {
  className?: string;
  variant?: "default" | "compact";
}

export function SubaccountFilter({
  className,
  variant = "default",
}: SubaccountFilterProps) {
  const {
    subAccountId,
    availableSubaccounts,
    isSubaccountsLoading,
    setSubAccountId,
    getCurrentSubaccount,
    isGlobalView,
  } = useTenant();

  const [isOpen, setIsOpen] = useState(false);
  const currentSubaccount = getCurrentSubaccount?.();

  const handleFilterChange = (filterId: number | null) => {
    setSubAccountId?.(filterId);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (isGlobalView) {
      return "GLOBAL";
    }
    return currentSubaccount?.name || "Unknown";
  };

  const getDisplayIcon = () => {
    if (isGlobalView) {
      return <Globe className="h-4 w-4" />;
    }
    return <Building2 className="h-4 w-4" />;
  };

  if (variant === "compact") {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2 min-w-[120px] justify-between bg-white/80 dark:bg-slate-700/50 backdrop-blur-sm border-gray-200/60 dark:border-slate-600/60 hover:bg-blue-50 dark:hover:bg-slate-600 transition-all duration-200 dark:text-gray-200",
              className,
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
        <DropdownMenuContent
          align="end"
          className="w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-gray-200/60 dark:border-slate-700/60"
        >
          <DropdownMenuLabel>Filter by Subaccount</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => handleFilterChange(null)}
            className={cn(
              "flex items-center gap-2 hover:bg-blue-50 transition-colors duration-200",
              isGlobalView && "bg-blue-50 text-blue-700",
            )}
          >
            <Globe className="h-4 w-4" />
            <span>Global View</span>
            {isGlobalView && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>

          {availableSubaccounts.map((subaccount) => (
            <DropdownMenuItem
              key={subaccount.id}
              onClick={() => handleFilterChange(subaccount.id)}
              className={cn(
                "flex items-center gap-2 hover:bg-blue-50 transition-colors duration-200",
                subAccountId === subaccount.id && "bg-blue-50 text-blue-700",
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
              {subAccountId === subaccount.id && (
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
          className={cn("flex items-center gap-3 px-4 py-2 h-auto", className)}
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
                  {isGlobalView ? "All Subaccounts" : "Subaccount View"}
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
          onClick={() => handleFilterChange(null)}
          className={cn(
            "flex items-center gap-3 py-3",
            isGlobalView && "bg-blue-50 text-blue-700",
          )}
        >
          <Globe className="h-5 w-5" />
          <div className="flex-1">
            <div className="font-medium">Global View</div>
            <div className="text-sm text-gray-500">
              View all subaccounts data
            </div>
          </div>
          {isGlobalView && (
            <Badge variant="secondary" className="ml-auto">
              Active
            </Badge>
          )}
        </DropdownMenuItem>

        {availableSubaccounts.map((subaccount) => (
          <DropdownMenuItem
            key={subaccount.id}
            onClick={() => handleFilterChange(subaccount.id)}
            className={cn(
              "flex items-center gap-3 py-3",
              subAccountId === subaccount.id && "bg-blue-50 text-blue-700",
            )}
          >
            <Building2 className="h-5 w-5" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{subaccount.name}</div>
              <div className="text-sm text-gray-500 truncate">
                {subaccount.description || "No description"}
              </div>
              <div className="text-xs text-gray-400">
                {subaccount._count.users} users • {subaccount._count.strategies}{" "}
                strategies
              </div>
            </div>
            {subAccountId === subaccount.id && (
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
