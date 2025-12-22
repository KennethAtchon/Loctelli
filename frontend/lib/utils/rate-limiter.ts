import logger from "@/lib/logger";
import { toast } from "sonner";

export interface RateLimitOptions {
  retryAfterSeconds?: number;
  showToast?: boolean;
}

export class RateLimiter {
  private blockedEndpoints = new Map<string, number>();

  isBlocked(endpoint: string): boolean {
    const retryTime = this.blockedEndpoints.get(endpoint);
    if (!retryTime) return false;

    const now = Date.now();
    if (now < retryTime) {
      return true;
    } else {
      this.blockedEndpoints.delete(endpoint);
      return false;
    }
  }

  blockEndpoint(endpoint: string, retryAfterSeconds: number): void {
    const retryTime = Date.now() + retryAfterSeconds * 1000;
    this.blockedEndpoints.set(endpoint, retryTime);
    logger.debug(
      `🚫 Blocked endpoint ${endpoint} until ${new Date(retryTime).toISOString()}`
    );
  }

  getRetryTime(endpoint: string): number | null {
    const retryTime = this.blockedEndpoints.get(endpoint);
    if (!retryTime) return null;

    const now = Date.now();
    if (now < retryTime) {
      return Math.ceil((retryTime - now) / 1000);
    } else {
      this.blockedEndpoints.delete(endpoint);
      return null;
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [endpoint, retryTime] of this.blockedEndpoints.entries()) {
      if (now >= retryTime) {
        this.blockedEndpoints.delete(endpoint);
        logger.debug(`🧹 Cleaned up expired block for ${endpoint}`);
      }
    }
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds} seconds`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) return `${minutes} minutes`;
    return `${minutes} minutes and ${remainingSeconds} seconds`;
  }

  handleRateLimitError(
    endpoint: string,
    response: Response,
    errorData: { retryAfter?: number }
  ): void {
    const retryAfter = errorData.retryAfter || 60;
    const waitTime = this.formatTime(retryAfter);

    this.blockEndpoint(endpoint, retryAfter);

    logger.warn(
      `🚫 Rate limit exceeded for ${endpoint}. Retry after ${retryAfter} seconds`
    );

    this.showRateLimitToast(waitTime);

    throw new Error(
      `Rate limit exceeded. Please wait ${waitTime} before trying again.`
    );
  }

  checkRateLimit(endpoint: string): void {
    if (this.isBlocked(endpoint)) {
      const retryAfter = this.getRetryTime(endpoint);
      if (retryAfter) {
        const waitTime = this.formatTime(retryAfter);
        logger.warn(
          `🚫 Blocked request to ${endpoint} - rate limited. Wait ${waitTime}`
        );
        this.showRateLimitToast(waitTime);
        throw new Error(
          `Rate limit exceeded. Please wait ${waitTime} before trying again.`
        );
      }
    }
  }

  private showRateLimitToast(waitTime: string): void {
    if (typeof window !== "undefined") {
      toast.error(`Rate limited! Please wait ${waitTime} before trying again.`);
    }
  }
}

export const rateLimiter = new RateLimiter();
