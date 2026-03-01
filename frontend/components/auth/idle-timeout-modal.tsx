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
import { idleTimeoutManager, subscribeToIdleWarning } from "@/lib/idle-timeout";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function IdleTimeoutModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [minutesUntilLogout, setMinutesUntilLogout] = useState(1);

  useEffect(() => {
    return subscribeToIdleWarning(() => {
      setIsOpen(true);
      // Start countdown
      let remaining = 60; // seconds
      const interval = setInterval(() => {
        remaining -= 1;
        setMinutesUntilLogout(Math.ceil(remaining / 60));
        if (remaining <= 0) clearInterval(interval);
      }, 1000);
    });
  }, []);

  const handleKeepSignedIn = async () => {
    setIsExtending(true);
    try {
      idleTimeoutManager.keepSignedIn();
      toast.success("Your session has been extended.");
      setIsOpen(false);
    } finally {
      setIsExtending(false);
    }
  };

  const handleSignOutNow = () => {
    idleTimeoutManager.stop();
    // Let the existing session expiration flow handle logout
    window.location.href = "/auth/login";
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You will be signed out soon</AlertDialogTitle>
          <AlertDialogDescription>
            You've been inactive for a while. For your security, you'll be automatically
            signed out in {minutesUntilLogout} minute{minutesUntilLogout !== 1 ? "s" : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleSignOutNow}
            disabled={isExtending}
          >
            Sign out now
          </Button>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleKeepSignedIn();
            }}
            disabled={isExtending}
          >
            {isExtending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extending...
              </>
            ) : (
              "Keep me signed in"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
