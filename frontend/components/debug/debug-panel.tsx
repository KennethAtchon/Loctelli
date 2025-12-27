"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Trash2,
  RefreshCw,
  Database,
  Cookie,
  HardDrive,
  Server,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { AuthCookies } from "@/lib/cookies";
import { toast } from "sonner";
import logger from "@/lib/logger";
import { api } from "@/lib/api";
import { SystemInfo } from "@/lib/api/endpoints/dev";

type ActionItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
  variant: "default" | "destructive" | "outline";
  isLoading?: boolean;
};

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const clearReactQueryCache = () => {
    try {
      queryClient.clear();
      toast.success("React Query cache cleared");
      logger.debug("🧹 React Query cache cleared");
    } catch (error) {
      toast.error("Failed to clear React Query cache");
      logger.error("❌ Failed to clear React Query cache:", error);
    }
  };

  const clearCookies = () => {
    try {
      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
      // Also clear auth cookies using the utility
      AuthCookies.clearAll();
      toast.success("All cookies cleared");
      logger.debug("🧹 All cookies cleared");
    } catch (error) {
      toast.error("Failed to clear cookies");
      logger.error("❌ Failed to clear cookies:", error);
    }
  };

  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      toast.success("LocalStorage cleared");
      logger.debug("🧹 LocalStorage cleared");
    } catch (error) {
      toast.error("Failed to clear LocalStorage");
      logger.error("❌ Failed to clear LocalStorage:", error);
    }
  };

  const clearSessionStorage = () => {
    try {
      sessionStorage.clear();
      toast.success("SessionStorage cleared");
      logger.debug("🧹 SessionStorage cleared");
    } catch (error) {
      toast.error("Failed to clear SessionStorage");
      logger.error("❌ Failed to clear SessionStorage:", error);
    }
  };

  const clearAllCache = () => {
    clearReactQueryCache();
    clearCookies();
    clearLocalStorage();
    clearSessionStorage();
    toast.success("All cache cleared");
    logger.debug("🧹 All cache cleared");
  };

  const refreshPage = () => {
    window.location.reload();
  };

  const getSystemInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      localStorageAvailable: typeof Storage !== "undefined",
      sessionStorageAvailable: typeof sessionStorage !== "undefined",
      currentUrl: window.location.href,
      timestamp: new Date().toISOString(),
    };
  };

  const copySystemInfo = () => {
    try {
      const info = getSystemInfo();
      const infoText = JSON.stringify(info, null, 2);
      navigator.clipboard.writeText(infoText);
      toast.success("System info copied to clipboard");
      logger.debug("📋 System info copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy system info");
      logger.error("❌ Failed to copy system info:", error);
    }
  };

  const getBackendSystemInfo = async () => {
    setLoading("system-info");
    try {
      const info = await api.dev.getSystemInfo();
      setSystemInfo(info);
      const infoText = JSON.stringify(info, null, 2);
      navigator.clipboard.writeText(infoText);
      toast.success("Backend system info retrieved and copied");
      logger.debug("📋 Backend system info:", info);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get backend system info";
      toast.error(errorMessage);
      logger.error("❌ Failed to get backend system info:", error);
    } finally {
      setLoading(null);
    }
  };

  const clearBackendCache = async () => {
    setLoading("clear-backend-cache");
    try {
      const result = await api.dev.clearCache();
      toast.success(result.message || "Backend cache cleared");
      logger.debug("🧹 Backend cache cleared:", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to clear backend cache";
      toast.error(errorMessage);
      logger.error("❌ Failed to clear backend cache:", error);
    } finally {
      setLoading(null);
    }
  };

  const testBackendDatabase = async () => {
    setLoading("test-database");
    try {
      const result = await api.dev.testDatabase();
      if (result.connected) {
        toast.success("Database connection successful");
      } else {
        toast.error(result.message);
      }
      logger.debug("🔍 Database test:", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to test database";
      toast.error(errorMessage);
      logger.error("❌ Failed to test database:", error);
    } finally {
      setLoading(null);
    }
  };

  const testBackendCache = async () => {
    setLoading("test-cache");
    try {
      const result = await api.dev.testCache();
      if (result.connected) {
        toast.success("Cache connection successful");
      } else {
        toast.error(result.message);
      }
      logger.debug("🔍 Cache test:", result);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to test cache";
      toast.error(errorMessage);
      logger.error("❌ Failed to test cache:", error);
    } finally {
      setLoading(null);
    }
  };

  const actions: ActionItem[] = [
    {
      id: "clear-react-query",
      label: "Clear React Query Cache",
      description: "Clear all cached queries and mutations",
      icon: Database,
      action: clearReactQueryCache,
      variant: "default" as const,
    },
    {
      id: "clear-cookies",
      label: "Clear Cookies",
      description: "Remove all cookies from the browser",
      icon: Cookie,
      action: clearCookies,
      variant: "default" as const,
    },
    {
      id: "clear-localstorage",
      label: "Clear LocalStorage",
      description: "Remove all LocalStorage data",
      icon: HardDrive,
      action: clearLocalStorage,
      variant: "default" as const,
    },
    {
      id: "clear-sessionstorage",
      label: "Clear SessionStorage",
      description: "Remove all SessionStorage data",
      icon: HardDrive,
      action: clearSessionStorage,
      variant: "default" as const,
    },
    {
      id: "clear-all",
      label: "Clear All Cache",
      description: "Clear React Query, cookies, and storage",
      icon: Trash2,
      action: clearAllCache,
      variant: "destructive" as const,
    },
    {
      id: "refresh",
      label: "Refresh Page",
      description: "Reload the current page",
      icon: RefreshCw,
      action: refreshPage,
      variant: "outline" as const,
    },
    {
      id: "system-info",
      label: "Copy Frontend System Info",
      description: "Copy frontend system information to clipboard",
      icon: Settings2,
      action: copySystemInfo,
      variant: "outline" as const,
    },
    {
      id: "backend-system-info",
      label: "Get Backend System Info",
      description:
        "Get and copy backend system information (requires DEBUG flag)",
      icon: Server,
      action: getBackendSystemInfo,
      variant: "outline" as const,
      isLoading: loading === "system-info",
    },
    {
      id: "clear-backend-cache",
      label: "Clear Backend Cache",
      description: "Clear Redis cache on the backend (requires DEBUG flag)",
      icon: Database,
      action: clearBackendCache,
      variant: "default" as const,
      isLoading: loading === "clear-backend-cache",
    },
    {
      id: "test-database",
      label: "Test Database Connection",
      description: "Test backend database connection (requires DEBUG flag)",
      icon: CheckCircle2,
      action: testBackendDatabase,
      variant: "outline" as const,
      isLoading: loading === "test-database",
    },
    {
      id: "test-cache",
      label: "Test Cache Connection",
      description: "Test backend Redis cache connection (requires DEBUG flag)",
      icon: CheckCircle2,
      action: testBackendCache,
      variant: "outline" as const,
      isLoading: loading === "test-cache",
    },
  ];

  return (
    <>
      {/* Floating Debug Button */}
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] h-12 w-12 rounded-full shadow-lg"
        size="icon"
        variant="default"
        aria-label="Open debug panel"
      >
        <Settings2 className="h-5 w-5" />
      </Button>

      {/* Debug Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debug Panel</DialogTitle>
            <DialogDescription>
              Infrastructure and debugging tools for development
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={action.action}
                    variant={action.variant}
                    size="sm"
                    disabled={action.isLoading}
                  >
                    {action.isLoading ? "Loading..." : "Execute"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* System Info Display */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm font-medium mb-2">
              Frontend System Information
            </div>
            <div className="text-xs text-muted-foreground space-y-1 font-mono bg-muted p-3 rounded">
              <div>
                URL:{" "}
                {typeof window !== "undefined" ? window.location.href : "N/A"}
              </div>
              <div>
                Platform:{" "}
                {typeof window !== "undefined" ? navigator.platform : "N/A"}
              </div>
              <div>
                Language:{" "}
                {typeof window !== "undefined" ? navigator.language : "N/A"}
              </div>
              <div>
                Cookies:{" "}
                {typeof window !== "undefined"
                  ? navigator.cookieEnabled
                    ? "Enabled"
                    : "Disabled"
                  : "N/A"}
              </div>
            </div>

            {/* Backend System Info Display */}
            {systemInfo && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">
                  Backend System Information
                </div>
                <div className="text-xs text-muted-foreground space-y-1 font-mono bg-muted p-3 rounded">
                  <div className="flex items-center gap-2">
                    Environment: {systemInfo.environment}
                  </div>
                  <div>Node Version: {systemInfo.nodeVersion}</div>
                  <div className="flex items-center gap-2">
                    Database:{" "}
                    {systemInfo.database.connected ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected ({systemInfo.database.provider})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-3 w-3" />
                        Disconnected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    Cache:{" "}
                    {systemInfo.cache.connected ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-3 w-3" />
                        Disconnected
                      </span>
                    )}
                  </div>
                  <div>Port: {systemInfo.config.port}</div>
                  <div>
                    Redis Configured:{" "}
                    {systemInfo.config.redisConfigured ? "Yes" : "No"}
                  </div>
                  <div>
                    Database Configured:{" "}
                    {systemInfo.config.databaseConfigured ? "Yes" : "No"}
                  </div>
                  <div>Timestamp: {systemInfo.timestamp}</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
