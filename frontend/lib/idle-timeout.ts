"use client";

import { authManager } from "./api/auth-manager";
import { emitSessionExpired } from "./session-expiration";
import logger from "./logger";

export interface IdleTimeoutOptions {
  /** Minutes of inactivity before warning (default: 14) */
  warningMinutes?: number;
  /** Minutes of inactivity before forced logout after warning (default: 1) */
  logoutMinutesAfterWarning?: number;
  /** Events that reset the idle timer (default: mousemove, keydown, scroll, touchstart) */
  events?: string[];
}

export interface IdleTimeoutEventDetail {
  reason: "idle-timeout";
  source: "idle-timeout-manager";
  returnTo: string;
}

const DEFAULT_OPTIONS: Required<IdleTimeoutOptions> = {
  warningMinutes: 14,
  logoutMinutesAfterWarning: 1,
  events: ["mousemove", "keydown", "scroll", "touchstart"],
};

export class IdleTimeoutManager {
  private static instance: IdleTimeoutManager | null = null;
  private options: Required<IdleTimeoutOptions>;
  private warningTimer: NodeJS.Timeout | null = null;
  private logoutTimer: NodeJS.Timeout | null = null;
  private lastActivity: number;
  private isWarningModalOpen = false;
  private boundResetTimer: () => void;

  constructor(options: IdleTimeoutOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.lastActivity = Date.now();
    this.boundResetTimer = this.resetTimer.bind(this);
    this.setupActivityListeners();
  }

  static getInstance(options?: IdleTimeoutOptions): IdleTimeoutManager {
    if (!IdleTimeoutManager.instance) {
      IdleTimeoutManager.instance = new IdleTimeoutManager(options);
    }
    return IdleTimeoutManager.instance;
  }

  private setupActivityListeners(): void {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    this.options.events.forEach((event) => {
      document.addEventListener(event, this.boundResetTimer, { passive: true });
    });
  }

  private removeActivityListeners(): void {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    this.options.events.forEach((event) => {
      document.removeEventListener(event, this.boundResetTimer);
    });
  }

  private resetTimer(): void {
    this.lastActivity = Date.now();
    if (!this.isWarningModalOpen) {
      this.scheduleWarning();
    }
  }

  private scheduleWarning(): void {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);

    const warningDelay = this.options.warningMinutes * 60 * 1000;

    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, warningDelay);
  }

  private showWarning(): void {
    this.isWarningModalOpen = true;
    this.scheduleLogoutAfterWarning();

    // Dispatch custom event for UI to show warning modal
    const event = new CustomEvent<IdleTimeoutEventDetail>("auth:idle-warning", {
      detail: {
        reason: "idle-timeout",
        source: "idle-timeout-manager",
        returnTo:
          window.location.pathname +
          window.location.search +
          window.location.hash,
      },
    });
    window.dispatchEvent(event);
  }

  private scheduleLogoutAfterWarning(): void {
    if (this.logoutTimer) clearTimeout(this.logoutTimer);

    const logoutDelay = this.options.logoutMinutesAfterWarning * 60 * 1000;

    this.logoutTimer = setTimeout(() => {
      this.forceLogout();
    }, logoutDelay);
  }

  private forceLogout(): void {
    logger.debug("🕒 Idle timeout reached, logging out...");
    authManager.clearTokens();
    emitSessionExpired({
      source: "idle-timeout-manager",
      reason: "You were logged out due to inactivity.",
    });
    this.destroy();
  }

  /** Call this when user clicks "Keep me signed in" in the warning modal */
  keepSignedIn(): void {
    this.isWarningModalOpen = false;
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
    this.resetTimer();
  }

  /** Start/restart the idle timeout monitoring */
  start(): void {
    this.resetTimer();
  }

  /** Stop monitoring and clean up timers/listeners */
  stop(): void {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    this.removeActivityListeners();
  }

  /** Clean up instance (call on logout) */
  destroy(): void {
    this.stop();
    IdleTimeoutManager.instance = null;
  }
}

// Export singleton instance for convenience
export const idleTimeoutManager = IdleTimeoutManager.getInstance();

// Helper to subscribe to idle warning events
export function subscribeToIdleWarning(
  callback: (detail: IdleTimeoutEventDetail) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<IdleTimeoutEventDetail>;
    if (!customEvent.detail) return;
    callback(customEvent.detail);
  };

  window.addEventListener("auth:idle-warning", handler as EventListener);
  return () => {
    window.removeEventListener("auth:idle-warning", handler as EventListener);
  };
}
