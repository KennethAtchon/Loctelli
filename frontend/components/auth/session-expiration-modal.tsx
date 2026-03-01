"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authManager } from "@/lib/api/auth-manager";
import { apiClient } from "@/lib/api/client";
import {
  redirectToLoginWithReturnTo,
  subscribeToSessionExpired,
} from "@/lib/session-expiration";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SessionExpirationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reason, setReason] = useState<string>("Your session is no longer valid.");

  useEffect(() => {
    return subscribeToSessionExpired((detail) => {
      setReason(detail.reason ?? "Your session is no longer valid.");
      setIsOpen(true);
    });
  }, []);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      await authManager.refreshToken();
      // Retry the last failed request if any
      await apiClient.retryLastFailedRequest();
      toast.success("Session refreshed. You can continue where you left off.");
      setIsOpen(false);
    } catch {
      authManager.clearTokens();
      redirectToLoginWithReturnTo();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoginAgain = () => {
    authManager.clearTokens();
    redirectToLoginWithReturnTo();
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            You are about to be logged out due to authentication
          </AlertDialogTitle>
          <AlertDialogDescription>{reason}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleLoginAgain}
            disabled={isRefreshing}
          >
            Log in again
          </Button>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleRefreshSession();
            }}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              "Refresh session"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
